// server/src/validators/teleprompt.ts - Full updated file
import { DiagnosticSeverity } from 'vscode-languageserver/node';
import { ValidationContext } from '../utils/types';
import { validLanguageCodes } from '../utils/constants';

export function validateTelepromptElements({ lines, diagnostics }: ValidationContext): void {
  const telepromptRegex = /^##\s+(Teleprompt|Telepromt)\s*\(([^)]*)\)$/;
  
  // First check if any teleprompts have the lang attribute
  let anyTelepromptHasLang = false;
  const telepromptLines: number[] = [];
  
  // First pass: collect info about teleprompts and lang attribute usage
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(telepromptRegex);
    if (match) {
      telepromptLines.push(i);
      const params = match[2];
      const langMatch = params.match(/lang\s*=\s*"([^"]*)"/);
      if (langMatch) {
        anyTelepromptHasLang = true;
      }
    }
  }
  
  // Second pass: validate each teleprompt
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(telepromptRegex);
    if (match) {
      // Rule 17: Wrong spelling
      if (match[1] === 'Telepromt') {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: {
            start: { line: i, character: 3 },
            end: { line: i, character: 11 }
          },
          message: 'Wrong spelling: "Telepromt" should be "Teleprompt"',
          source: 'vmd-language-server'
        });
      }
      
      const params = match[2];
      
      // Rule 18: Teleprompt without title
      const titleMatch = params.match(/title\s*=\s*"([^"]*)"/);
      if (!titleMatch) {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: lines[i].length }
          },
          message: 'Teleprompt should have a title attribute',
          source: 'vmd-language-server'
        });
      }
      
      // Rule 19: Teleprompt without text
      let hasContent = false;
      for (let j = i + 1; j < lines.length && !lines[j].match(/^##\s+/); j++) {
        if (lines[j].trim() !== '') {
          hasContent = true;
          break;
        }
      }
      
      if (!hasContent) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: lines[i].length }
          },
          message: 'Teleprompt has no text',
          source: 'vmd-language-server'
        });
      }
      
      // Rule 20: Invalid language code
      const langMatch = params.match(/lang\s*=\s*"([^"]*)"/);
      if (langMatch) {
        if (!validLanguageCodes.includes(langMatch[1].toUpperCase())) {
          const langMatchIndex = params.indexOf(langMatch[0]);
          
          diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range: {
              start: { line: i, character: langMatchIndex + match[0].indexOf('(') + 1 },
              end: { line: i, character: langMatchIndex + match[0].indexOf('(') + 1 + langMatch[0].length }
            },
            message: `Invalid language code: "${langMatch[1]}". Valid codes: ${validLanguageCodes.join(', ')}`,
            source: 'vmd-language-server'
          });
        }
      }
      // New rule: Inconsistent language attribute usage
      else if (anyTelepromptHasLang) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: lines[i].length }
          },
          message: 'Missing "lang" attribute. When any teleprompt has a "lang" attribute, all teleprompts must include it for consistency.',
          source: 'vmd-language-server'
        });
      }
    }
  }
}