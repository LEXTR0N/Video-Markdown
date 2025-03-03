// server/src/completionProvider.ts
import {
    CompletionItem,
    CompletionItemKind,
    TextDocumentPositionParams,
    CompletionList,
    InsertTextFormat
  } from 'vscode-languageserver/node';
  import { TextDocument } from 'vscode-languageserver-textdocument';
  import { validLanguageCodes } from '../utils/constants';
  import { ValidationContext } from '../utils/types';
  import { ElementCollection } from '../utils/types';
  import * as fs from 'fs';
  import * as path from 'path';
  
  // Define a helper function to collect named elements, since we can't import it from utils/helpers
  function collectNamedElements(context: ValidationContext): ElementCollection {
    const { lines } = context;
    
    const buttonNames = new Set<string>();
    const quizNames = new Set<string>();
    const codeSnippets: { [name: string]: boolean } = {};
    const bulletDefinitions = new Set<string>();
    
    // First pass: collect all defined elements
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Collect button names
      const buttonMatch = line.match(/^###\s+Button\s*\(.*?name\s*=\s*"([^"]*)".*?\)/);
      if (buttonMatch && buttonMatch[1]) {
        buttonNames.add(buttonMatch[1]);
      }
      
      // Collect quiz names
      const quizMatch = line.match(/^##\s+Quiz\s*\(.*?name\s*=\s*"([^"]*)".*?\)/);
      if (quizMatch && quizMatch[1]) {
        quizNames.add(quizMatch[1]);
      }
      
      // Collect code snippet names
      const codeMatch = line.match(/^###\s+Code\s*\(.*?snippet\s*=\s*"([^"]*)".*?\)/);
      if (codeMatch && codeMatch[1]) {
        codeSnippets[codeMatch[1]] = true;
      }
      
      // Collect bullet definitions that appear at the beginning of a line
      const bulletDefinitionMatch = line.match(/^\s*\[!bullet(\d+)\]/);
      if (bulletDefinitionMatch) {
        bulletDefinitions.add('bullet' + bulletDefinitionMatch[1]);
      }
    }
    
    return { buttonNames, quizNames, codeSnippets, bulletDefinitions };
  }
  
  export function provideCompletions(
    document: TextDocument,
    position: TextDocumentPositionParams,
    workspacePath: string | null
  ): CompletionList {
    const text = document.getText();
    const lines = text.split(/\r?\n/g);
    const lineText = lines[position.position.line] || '';
    const linePrefix = lineText.slice(0, position.position.character);
  
    const completions: CompletionItem[] = [];
  
    // Check if document appears to be empty/new
    if (lines.length <= 1 && lineText.trim() === '') {
    // In completionProvider.ts - fix YAML header indentation
    completions.push({
        label: 'Add YAML Header',
        kind: CompletionItemKind.Snippet,
        detail: 'Add a YAML header for VMD document',
        insertTextFormat: InsertTextFormat.Snippet,
        insertText: 
    `---
    title = "\${1:Video Title}"
    author = "\${2:Your Name}"
    style = "\${3:style.css}"
    ---
    `
    });
    }
  
    // Structure suggestions based on line context
    if (lineText.trim() === '') {
      // Get previous non-empty line
      let prevLineIndex = position.position.line - 1;
      let prevLineText = '';
      
      while (prevLineIndex >= 0) {
        if (lines[prevLineIndex].trim() !== '') {
          prevLineText = lines[prevLineIndex].trim();
          break;
        }
        prevLineIndex--;
      }
  
      // If document is completely empty or just has YAML, suggest Scene
      if (prevLineIndex < 0 || prevLineText === '---' || (prevLineIndex > 0 && lines[prevLineIndex-1].trim() === '---')) {
        completions.push({
          label: 'New Scene',
          kind: CompletionItemKind.Snippet,
          detail: 'Create a new scene',
          insertTextFormat: InsertTextFormat.Snippet,
          insertText: '# Scene: \${1:Scene Title}'
        });
      }
      // If previous line is a Scene heading, suggest content elements
      else if (prevLineText.match(/^#\s+Scene:/)) {
        completions.push(
          {
            label: 'Add Slide',
            kind: CompletionItemKind.Snippet,
            detail: 'Add a slide element',
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: '## Slide (title="\${1:Slide Title}"\${2:, lang="\${3:DE}"})'
          },
          {
            label: 'Add Video',
            kind: CompletionItemKind.Snippet,
            detail: 'Add a video element',
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: '## Video (source="\${1:video.mp4}")'
          },
          {
            label: 'Add Screencast',
            kind: CompletionItemKind.Snippet,
            detail: 'Add a screencast element',
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: '## Screencast (source="\${1:screencast.mp4}")'
          },
          {
            label: 'Add Quiz',
            kind: CompletionItemKind.Snippet,
            detail: 'Add a quiz element',
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: 
  `## Quiz (name="\${1:quiz1}", title="\${2:Quiz Title}")
  
  ### \${3:First Question}
  - \${4:Wrong option}
  + \${5:Correct option}
  - \${6:Another wrong option}`
          }
        );
      }
      // If previous line is a content element, suggest Teleprompt
      else if (prevLineText.match(/^##\s+(Slide|Video|Screencast|Quiz)/) || 
               prevLineText.match(/^\+\s+/) || prevLineText.match(/^-\s+/) || 
               prevLineText.match(/###\s+(Button|Image|Code|column)/)) {
        // Check if we already have a Teleprompt after this element
        let hasTeleprompt = false;
        for (let i = prevLineIndex + 1; i < lines.length; i++) {
          if (lines[i].match(/^##\s+(Teleprompt|Telepromt)/)) {
            hasTeleprompt = true;
            break;
          }
          if (lines[i].match(/^#\s+Scene:/) || lines[i].match(/^##\s+(Slide|Video|Screencast|Quiz)/)) {
            break;
          }
        }
        
        if (!hasTeleprompt) {
          completions.push({
            label: 'Add Teleprompt',
            kind: CompletionItemKind.Snippet,
            detail: 'Add a teleprompt element',
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: 
  `## Teleprompt (title="\${1:Teleprompt Title}"\${2:, lang="\${3:DE}"})
  \${4:Enter the text that will be read by the presenter.}`
          });
        } else {
          // If we already have a Teleprompt, suggest a new Scene
          completions.push({
            label: 'New Scene',
            kind: CompletionItemKind.Snippet,
            detail: 'Create a new scene',
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: '# Scene: \${1:Scene Title}'
          });
        }
      }
      // If previous line is a Teleprompt, suggest a new Scene
      else if (prevLineText.match(/^##\s+(Teleprompt|Telepromt)/) || 
               (prevLineIndex > 0 && lines[prevLineIndex-1].match(/^##\s+(Teleprompt|Telepromt)/))) {
        completions.push({
          label: 'New Scene',
          kind: CompletionItemKind.Snippet,
          detail: 'Create a new scene',
          insertTextFormat: InsertTextFormat.Snippet,
          insertText: '# Scene: \${1:Scene Title}'
        });
      }
    }
  
    // 1. Element attribute suggestions
    if (linePrefix.match(/##\s+Slide\s*\(([^)]*)$/)) {
      // We're inside a Slide element's attributes - removed style and transition
      completions.push(
        createCompletionItem('title', 'Title of the slide', CompletionItemKind.Property),
        createCompletionItem('lang', 'Language of the slide content', CompletionItemKind.Property),
        createCompletionItem('duration', 'Duration of the slide in seconds', CompletionItemKind.Property)
      );
    } else if (linePrefix.match(/##\s+(Teleprompt|Telepromt)\s*\(([^)]*)$/)) {
      // We're inside a Teleprompt element's attributes
      completions.push(
        createCompletionItem('title', 'Title of the teleprompt', CompletionItemKind.Property),
        createCompletionItem('lang', 'Language of the teleprompt content', CompletionItemKind.Property)
      );
    } else if (linePrefix.match(/###\s+Button\s*\(([^)]*)$/)) {
      // We're inside a Button element's attributes
      completions.push(
        createCompletionItem('name', 'Unique identifier for this button', CompletionItemKind.Property),
        createCompletionItem('label', 'Text to display on the button', CompletionItemKind.Property),
        createCompletionItem('action', 'Action to perform when clicked', CompletionItemKind.Property),
        createCompletionItem('time', 'When to show this button', CompletionItemKind.Property)
      );
    } else if (linePrefix.match(/###\s+Image\s*\(([^)]*)$/)) {
      // We're inside an Image element's attributes
      completions.push(
        createCompletionItem('source', 'Path to the image file', CompletionItemKind.Property),
        createCompletionItem('width', 'Width of the image', CompletionItemKind.Property),
        createCompletionItem('height', 'Height of the image', CompletionItemKind.Property)
      );
    } else if (linePrefix.match(/###\s+Code\s*\(([^)]*)$/)) {
      // We're inside a Code element's attributes
      completions.push(
        createCompletionItem('snippet', 'Identifier for this code snippet', CompletionItemKind.Property),
        createCompletionItem('language', 'Programming language for syntax highlighting', CompletionItemKind.Property)
      );
    } else if (linePrefix.match(/##\s+Quiz\s*\(([^)]*)$/)) {
      // We're inside a Quiz element's attributes
      completions.push(
        createCompletionItem('name', 'Unique identifier for this quiz', CompletionItemKind.Property),
        createCompletionItem('title', 'Title of the quiz', CompletionItemKind.Property),
        createCompletionItem('time', 'When to show this quiz', CompletionItemKind.Property)
      );
    }
  
    // 2. Language code suggestions
    if (linePrefix.match(/lang\s*=\s*"([^"]*)$/)) {
      // We're typing a language code
      validLanguageCodes.forEach(code => {
        completions.push(createCompletionItem(code, `${code} language code`, CompletionItemKind.Enum));
      });
    }
  
    // 3. Scene navigation suggestions for button actions
    if (linePrefix.match(/action\s*=\s*"scene:\s*([^"]*)$/)) {
      // We're typing a scene reference in a button action
      // Collect all scene titles from the document
      const sceneRegex = /^#\s+Scene:\s*(.*)$/;
      const scenes: string[] = [];
      
      lines.forEach(line => {
        const match = line.match(sceneRegex);
        if (match && match[1]) {
          scenes.push(match[1].trim());
        }
      });
      
      // Add scene titles as completion items
      scenes.forEach(scene => {
        completions.push(createCompletionItem(scene, `Navigate to scene: ${scene}`, CompletionItemKind.Reference));
      });
    }
  
    // 4. Named element references for interactive commands
    if (linePrefix.match(/\[!show:([^,\]]*)$/)) {
      // We're typing a reference to a button or bullet in a show command
      const context: ValidationContext = {
        lines,
        diagnostics: [],
        documentUri: document.uri,
        workspacePath
      };
      
      const elements = collectNamedElements(context);
      
      // Add button names
      elements.buttonNames.forEach(name => {
        completions.push(createCompletionItem(name, `Reference to button: ${name}`, CompletionItemKind.Reference));
      });
      
      // Add bullet identifiers
      elements.bulletDefinitions.forEach(name => {
        completions.push(createCompletionItem(name, `Reference to bullet: ${name}`, CompletionItemKind.Reference));
      });
    } else if (linePrefix.match(/\[!quiz:([^,\]]*)$/)) {
      // We're typing a reference to a quiz in a quiz command
      const context: ValidationContext = {
        lines,
        diagnostics: [],
        documentUri: document.uri,
        workspacePath
      };
      
      const elements = collectNamedElements(context);
      
      // Add quiz names
      elements.quizNames.forEach(name => {
        completions.push(createCompletionItem(name, `Reference to quiz: ${name}`, CompletionItemKind.Reference));
      });
    } else if (linePrefix.match(/\[!line:([^-\]]*)$/)) {
      // We're typing a reference to a code snippet in a line command
      const context: ValidationContext = {
        lines,
        diagnostics: [],
        documentUri: document.uri,
        workspacePath
      };
      
      const elements = collectNamedElements(context);
      
      // Add code snippet names
      Object.keys(elements.codeSnippets).forEach(name => {
        completions.push(createCompletionItem(name, `Reference to code snippet: ${name}`, CompletionItemKind.Reference));
      });
    }
  
    // 5. File path completion for media elements
    const mediaSourceMatch = linePrefix.match(/source\s*=\s*"([^"]*)$/);
    if (mediaSourceMatch && workspacePath) {
      try {
        const inputPath = mediaSourceMatch[1] || '';
        const documentUri = document.uri;
        let documentDir = "";
        
        // Handle URI properly
        if (documentUri.startsWith('file://')) {
          documentDir = path.dirname(documentUri.replace('file://', ''));
        } else {
          documentDir = path.dirname(documentUri);
        }
        
        // Determine the directory to search based on input
        let searchDir = documentDir;
        if (inputPath.includes('/')) {
          const lastSlashIndex = inputPath.lastIndexOf('/');
          const dirPart = inputPath.substring(0, lastSlashIndex);
          searchDir = path.resolve(documentDir, dirPart);
        }
        
        // Get files in the directory
        if (fs.existsSync(searchDir)) {
          const files = fs.readdirSync(searchDir);
          
          files.forEach(file => {
            // Filter based on what's already typed
            const fileBasename = inputPath.includes('/') 
              ? inputPath.substring(0, inputPath.lastIndexOf('/') + 1) + file
              : file;
            
            const stat = fs.statSync(path.join(searchDir, file));
            
            if (stat.isDirectory()) {
              // Suggest directories with trailing slash
              completions.push(createCompletionItem(fileBasename + '/', 'Directory', CompletionItemKind.Folder));
            } else {
              // For media elements, filter by file extension
              const ext = path.extname(file).toLowerCase();
              const isVideo = ['.mp4', '.webm', '.ogg', '.mov'].includes(ext);
              const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.svg'].includes(ext);
              
              if (linePrefix.match(/##\s+Video\s*\(/) || linePrefix.match(/##\s+Screencast\s*\(/)) {
                if (isVideo) {
                  completions.push(createCompletionItem(fileBasename, 'Video file', CompletionItemKind.File));
                }
              } else if (linePrefix.match(/###\s+Image\s*\(/)) {
                if (isImage) {
                  completions.push(createCompletionItem(fileBasename, 'Image file', CompletionItemKind.File));
                }
              } else {
                // For other contexts, suggest all files
                completions.push(createCompletionItem(fileBasename, 'File', CompletionItemKind.File));
              }
            }
          });
        }
      } catch (error) {
        // Silently fail for file system errors
      }
    }
  
    return {
      isIncomplete: false,
      items: completions
    };
  }
  
  // Helper function to create completion items
  function createCompletionItem(label: string, detail: string, kind: CompletionItemKind): CompletionItem {
    return {
      label,
      kind,
      detail,
      insertText: label
    };
  }