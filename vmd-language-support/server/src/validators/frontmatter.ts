import { DiagnosticSeverity } from 'vscode-languageserver/node';
import { ValidationContext } from '../utils/types';

export function validateFrontmatter({ lines, diagnostics }: ValidationContext): void {
  // Rule 1: Frontmatter is missing or incomplete
  let hasFrontmatterStart = lines[0] === '---';
  let hasFrontmatterEnd = false;
  
  if (hasFrontmatterStart) {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') {
        hasFrontmatterEnd = true;
        break;
      }
    }
    
    if (!hasFrontmatterEnd) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 3 }
        },
        message: 'Frontmatter is incomplete: Missing closing "---"',
        source: 'vmd-language-server'
      });
    }
    
    // Rules 2-4: Frontmatter content validation
    if (hasFrontmatterEnd) {
      let hasTitle = false;
      let hasAuthor = false;
      
      // Determine the frontmatter section
      let frontmatterEndLine = 0;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i] === '---') {
          frontmatterEndLine = i;
          break;
        }
        
        // Rule 2: Check required attributes
        if (lines[i].match(/^\s*title\s*=\s*"[^"]*"/)) {
          hasTitle = true;
        }
        if (lines[i].match(/^\s*author\s*=\s*"[^"]*"/)) {
          hasAuthor = true;
        }
        
        // Rule 3: Unknown attribute
        const attributeMatch = lines[i].match(/^\s*(\w+)\s*=\s*"[^"]*"/);
        if (attributeMatch) {
          const knownAttributes = ['title', 'author', 'style', 'date', 'version', 'description'];
          if (!knownAttributes.includes(attributeMatch[1].toLowerCase())) {
            diagnostics.push({
              severity: DiagnosticSeverity.Warning,
              range: {
                start: { line: i, character: 0 },
                end: { line: i, character: lines[i].length }
              },
              message: `Unknown frontmatter attribute: "${attributeMatch[1]}"`,
              source: 'vmd-language-server'
            });
          }
        }
        
        // Rule 4: YAML syntax error
        if (!lines[i].match(/^\s*\w+\s*=\s*"[^"]*"\s*$/) && lines[i].trim() !== '') {
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: {
              start: { line: i, character: 0 },
              end: { line: i, character: lines[i].length }
            },
            message: 'Syntax error in frontmatter. Format should be: key = "value"',
            source: 'vmd-language-server'
          });
        }
      }
      
      // Required attributes missing
      if (!hasTitle) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: 1, character: 0 },
            end: { line: 1, character: 0 }
          },
          message: 'Required attribute "title" is missing in frontmatter',
          source: 'vmd-language-server'
        });
      }
      
      if (!hasAuthor) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: 1, character: 0 },
            end: { line: 1, character: 0 }
          },
          message: 'Required attribute "author" is missing in frontmatter',
          source: 'vmd-language-server'
        });
      }
    }
  } else {
    // Frontmatter is completely missing
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: Math.min(lines[0].length, 10) }
      },
      message: 'Frontmatter is missing. Document should start with "---"',
      source: 'vmd-language-server'
    });
  }
  
  // Rule 5: Character encoding issues
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Ã¤') || lines[i].includes('Ã¶') || lines[i].includes('Ã¼') || 
        lines[i].includes('ÃŸ') || lines[i].includes('Ã„') || lines[i].includes('Ã–') || 
        lines[i].includes('Ãœ')) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: {
          start: { line: i, character: 0 },
          end: { line: i, character: lines[i].length }
        },
        message: 'Possible character encoding issue detected. Make sure the file is encoded in UTF-8.',
        source: 'vmd-language-server'
      });
      break; // Only one warning for the entire file
    }
  }
}