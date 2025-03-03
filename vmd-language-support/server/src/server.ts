// server/src/server.ts
import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  DocumentLinkParams,
  RenameParams,
  PrepareRenameParams,
  FoldingRangeParams
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import * as validators from './validators';
import { ValidationContext } from './utils/types';
import { provideCompletions } from './providers/completionProvider';
import { provideDocumentLinks } from './providers/documentLinkProvider';
import { prepareRename, provideRenameEdits } from './providers/renameProvider';
import { provideFoldingRanges } from './providers/foldingRangeProvider';
import { getDocumentStatus, formatDuration } from './providers/documentStatusProvider';

// Create a connection to VSCode
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Tools for validation
let workspacePath: string | null = null;

connection.onInitialize((params: InitializeParams) => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Add completion provider capability
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['=', '"', ':', '.', '/']
      },
      // Add document link provider
      documentLinkProvider: {
        resolveProvider: false
      },
      // Add rename provider
      renameProvider: {
        prepareProvider: true
      },
      // Add folding range provider
      foldingRangeProvider: true
    }
  };
  
  // Store the workspace path
  workspacePath = params.rootPath || null;
  
  return result;
});

// Document link provider
connection.onDocumentLinks((params: DocumentLinkParams) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return [];
  }
  
  return provideDocumentLinks(document, params, workspacePath);
});

// Rename provider
connection.onPrepareRename((params: PrepareRenameParams) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }
  
  return prepareRename(document, params);
});

connection.onRenameRequest((params: RenameParams) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }
  
  return provideRenameEdits(document, params);
});

// Folding range provider
connection.onFoldingRanges((params: FoldingRangeParams) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return [];
  }
  
  return provideFoldingRanges(document);
});

// Add completion handler
connection.onCompletion((textDocumentPosition) => {
  const document = documents.get(textDocumentPosition.textDocument.uri);
  if (!document) {
    return null;
  }
  
  return provideCompletions(document, textDocumentPosition, workspacePath).items;
});

// Add completion resolve handler
connection.onCompletionResolve((item) => {
  return item;
});

// Document status notification handler (custom)
connection.onNotification('vmd/requestDocumentStatus', (params: { uri: string }) => {
  const document = documents.get(params.uri);
  if (!document) {
    return;
  }
  
  const status = getDocumentStatus(document);
  const duration = formatDuration(status.totalLength);
  
  connection.sendNotification('vmd/documentStatus', {
    uri: params.uri,
    status: {
      ...status,
      duration
    }
  });
});

// Validate a document when it changes
documents.onDidChangeContent(change => {
  validateVMDDocument(change.document);
});

async function validateVMDDocument(textDocument: TextDocument): Promise<void> {
  const text = textDocument.getText();
  const lines = text.split(/\r?\n/g);
  
  // Skip validation for empty documents or documents with only whitespace
  if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) {
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: [] });
    return;
  }
  
  const diagnostics: Diagnostic[] = [];
  const context: ValidationContext = {
    lines,
    diagnostics,
    documentUri: textDocument.uri,
    workspacePath
  };
  
  // Run all validators
  validators.validateFrontmatter(context);
  validators.validateSceneStructure(context);
  validators.validateSlideElements(context);
  validators.validateTelepromptElements(context);
  validators.validateInteractiveElements(context);
  validators.validateQuizzes(context);
  validators.validateInteractiveCommands(context);
  validators.validateMedia(context);
  validators.validateCodeElements(context);
  validators.validateMarkdownFormatting(context);
  
  // Add cross-element consistency validation
  validateCrossElementConsistency(context);
  
  // Send the diagnostics to the client
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
  
  // Also update the document status
  connection.sendNotification('vmd/documentStatus', {
    uri: textDocument.uri,
    status: getDocumentStatus(textDocument)
  });
}

function validateCrossElementConsistency(context: ValidationContext): void {
  const { lines, diagnostics } = context;
  const slideRegex = /^##\s+Slide\s*\(([^)]*)\)$/;
  const telepromptRegex = /^##\s+(Teleprompt|Telepromt)\s*\(([^)]*)\)$/;
  
  let anySlideHasLang = false;
  let anyTelepromptHasLang = false;
  
  // First check if any slides or teleprompts have the lang attribute
  for (let i = 0; i < lines.length; i++) {
    const slideMatch = lines[i].match(slideRegex);
    if (slideMatch) {
      const params = slideMatch[1];
      const langMatch = params.match(/lang\s*=\s*"([^"]*)"/);
      if (langMatch) {
        anySlideHasLang = true;
      }
    }
    
    const telepromptMatch = lines[i].match(telepromptRegex);
    if (telepromptMatch) {
      const params = telepromptMatch[2];
      const langMatch = params.match(/lang\s*=\s*"([^"]*)"/);
      if (langMatch) {
        anyTelepromptHasLang = true;
      }
    }
  }
  
  // If either has lang, both should have lang for cross-element consistency
  if (anySlideHasLang || anyTelepromptHasLang) {
    // Second pass to flag inconsistencies
    for (let i = 0; i < lines.length; i++) {
      const slideMatch = lines[i].match(slideRegex);
      if (slideMatch && anyTelepromptHasLang) {
        const params = slideMatch[1];
        const langMatch = params.match(/lang\s*=\s*"([^"]*)"/);
        if (!langMatch) {
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: {
              start: { line: i, character: 0 },
              end: { line: i, character: lines[i].length }
            },
            message: 'Cross-element inconsistency: Missing "lang" attribute in Slide. When any element has a "lang" attribute, all Slides and Teleprompts must include it.',
            source: 'vmd-language-server'
          });
        }
      }
      
      const telepromptMatch = lines[i].match(telepromptRegex);
      if (telepromptMatch && anySlideHasLang) {
        const params = telepromptMatch[2];
        const langMatch = params.match(/lang\s*=\s*"([^"]*)"/);
        if (!langMatch) {
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: {
              start: { line: i, character: 0 },
              end: { line: i, character: lines[i].length }
            },
            message: 'Cross-element inconsistency: Missing "lang" attribute in Teleprompt. When any element has a "lang" attribute, all Slides and Teleprompts must include it.',
            source: 'vmd-language-server'
          });
        }
      }
    }
  }
}

// Connect documents to the server
documents.listen(connection);

// Start the server
connection.listen();