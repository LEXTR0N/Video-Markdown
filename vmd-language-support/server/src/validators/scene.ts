import { DiagnosticSeverity } from 'vscode-languageserver/node';
import { ValidationContext } from '../utils/types';

export function validateSceneStructure({ lines, diagnostics }: ValidationContext): void {
  // Rule 7: Scene without title
  const sceneRegex = /^#\s+Scene:\s*(.*)$/;
  
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(sceneRegex);
    if (match) {
      if (!match[1] || match[1].trim() === '') {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: lines[i].length }
          },
          message: 'Scene requires a title after the colon',
          source: 'vmd-language-server'
        });
      }
    }
  }
}