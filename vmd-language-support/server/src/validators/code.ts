// server/src/validators/code.ts - Full updated file
import { DiagnosticSeverity } from 'vscode-languageserver/node';
import { ValidationContext } from '../utils/types';

export function validateCodeElements({ lines, diagnostics }: ValidationContext): void {
  const codeRegex = /^###\s+Code\s*\(([^)]*)\)$/;
  
  // First pass: collect all code snippet names
  const snippets: { [name: string]: boolean } = {};
  
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(codeRegex);
    if (match) {
      const params = match[1];
      const snippetMatch = params.match(/snippet\s*=\s*"([^"]*)"/);
      if (snippetMatch) {
        snippets[snippetMatch[1]] = true;
      }
    }
  }
  
  // Second pass: validate code elements
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(codeRegex);
    if (match) {
      const params = match[1];
      
      // Check for snippet attribute
      const snippetMatch = params.match(/snippet\s*=\s*"([^"]*)"/);
      if (!snippetMatch) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: lines[i].length }
          },
          message: 'Code element must have a snippet attribute',
          source: 'vmd-language-server'
        });
        
        // Only check for content if no snippet attribute is provided
        // Check for code content
        let hasContent = false;
        for (let j = i + 1; j < lines.length && !lines[j].match(/^##/) && !lines[j].match(/^###/); j++) {
          if (lines[j].trim() !== '') {
            hasContent = true;
            break;
          }
        }
        
        if (!hasContent) {
          diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range: {
              start: { line: i, character: 0 },
              end: { line: i, character: lines[i].length }
            },
            message: 'Code element has no content',
            source: 'vmd-language-server'
          });
        }
      }
      // If snippet attribute is present, no need to check for content
    }
    
    // Check line marker references to snippets
    const lineMarkerRegex = /\[!line:([^\]]+)\]/g;
    const lineText = lines[i];
    let markerMatch;
    
    // Reset regex for each line
    lineMarkerRegex.lastIndex = 0;
    
    while ((markerMatch = lineMarkerRegex.exec(lineText)) !== null) {
      const markerParams = markerMatch[1].split('-');
      if (markerParams.length === 2) {
        const snippetName = markerParams[0];
        if (!snippets[snippetName]) {
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: {
              start: { line: i, character: markerMatch.index },
              end: { line: i, character: markerMatch.index + markerMatch[0].length }
            },
            message: `Line marker references non-existent code snippet: "${snippetName}"`,
            source: 'vmd-language-server'
          });
        }
      }
    }
  }
}