import { DiagnosticSeverity } from 'vscode-languageserver/node';
import { ValidationContext } from '../utils/types';
import { collectNamedElements } from '../utils/helpers';

export function validateInteractiveCommands(context: ValidationContext): void {
  const { lines, diagnostics } = context;
  const interactiveCommandRegex = /\[!(\w+):([^\]]+)\]/g;
  const validCommands = ['show', 'hide', 'quiz', 'line'];
  
  // Get all named elements
  const { buttonNames, quizNames, codeSnippets, bulletDefinitions } = collectNamedElements(context);
  
  // Validate interactive commands
  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i];
    let match;
    
    // Reset the regex for each line
    interactiveCommandRegex.lastIndex = 0;
    
    while ((match = interactiveCommandRegex.exec(lineText)) !== null) {
      const command = match[1];
      const params = match[2];
      
      // Check if command is valid
      if (!validCommands.includes(command)) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: i, character: match.index + 2 },
            end: { line: i, character: match.index + 2 + command.length }
          },
          message: `Unknown interactive command: "${command}". Valid commands: ${validCommands.join(', ')}`,
          source: 'vmd-language-server'
        });
      }
      
      // Check if parameter is empty
      if (!params || params.trim() === '') {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: i, character: match.index },
            end: { line: i, character: match.index + match[0].length }
          },
          message: `Interactive command "${command}" has no parameters`,
          source: 'vmd-language-server'
        });
      } else {
        // Handle comma-separated parameters
        const paramsList = params.split(',').map(p => p.trim());
        
        for (const param of paramsList) {
          // Validate based on command type and parameter
          if ((command === 'show' || command === 'hide')) {
            // Check if it's a button reference
            if (!param.startsWith('bullet') && !buttonNames.has(param)) {
              diagnostics.push({
                severity: DiagnosticSeverity.Error,
                range: {
                  start: { line: i, character: match.index },
                  end: { line: i, character: match.index + match[0].length }
                },
                message: `Interactive command references non-existent button: "${param}"`,
                source: 'vmd-language-server'
              });
            }
            
            // Check if it's a bullet reference
            if (param.startsWith('bullet') && !bulletDefinitions.has(param)) {
              diagnostics.push({
                severity: DiagnosticSeverity.Error,
                range: {
                  start: { line: i, character: match.index },
                  end: { line: i, character: match.index + match[0].length }
                },
                message: `Interactive command references non-existent bullet: "${param}"`,
                source: 'vmd-language-server'
              });
            }
          }
          
          // Validate quiz references
          if (command === 'quiz' && !quizNames.has(param)) {
            diagnostics.push({
              severity: DiagnosticSeverity.Error,
              range: {
                start: { line: i, character: match.index },
                end: { line: i, character: match.index + match[0].length }
              },
              message: `Interactive command references non-existent quiz: "${param}"`,
              source: 'vmd-language-server'
            });
          }
        }
        
        // Additional validation for line markers
        if (command === 'line') {
          const lineParams = params.split('-');
          if (lineParams.length !== 2) {
            diagnostics.push({
              severity: DiagnosticSeverity.Error,
              range: {
                start: { line: i, character: match.index },
                end: { line: i, character: match.index + match[0].length }
              },
              message: `Invalid format for line marker. Should be: "snippet-marker"`,
              source: 'vmd-language-server'
            });
          } else {
            const [snippetName, markerName] = lineParams;
            if (!codeSnippets[snippetName]) {
              diagnostics.push({
                severity: DiagnosticSeverity.Error,
                range: {
                  start: { line: i, character: match.index },
                  end: { line: i, character: match.index + match[0].length }
                },
                message: `Line marker references non-existent code snippet: "${snippetName}"`,
                source: 'vmd-language-server'
              });
            }
          }
        }
      }
    }
  }
}