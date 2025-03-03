// server/src/validators/slide.ts - Full updated file
import { DiagnosticSeverity } from 'vscode-languageserver/node';
import { ValidationContext } from '../utils/types';
import { validLanguageCodes } from '../utils/constants';

export function validateSlideElements({ lines, diagnostics }: ValidationContext): void {
  const slideRegex = /^##\s+Slide\s*\(([^)]*)\)$/;
  
  // First check if any slides have the lang attribute
  let anySlideHasLang = false;
  const slideLines: number[] = [];
  
  // First pass: collect info about slides and lang attribute usage
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(slideRegex);
    if (match) {
      slideLines.push(i);
      const params = match[1];
      const langMatch = params.match(/lang\s*=\s*"([^"]*)"/);
      if (langMatch) {
        anySlideHasLang = true;
      }
    }
  }
  
  // Second pass: validate each slide
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(slideRegex);
    if (match) {
      const params = match[1];
      
      // Rule 12: Slide with empty title attribute
      const titleMatch = params.match(/title\s*=\s*"([^"]*)"/);
      if (titleMatch && titleMatch[1].trim() === '') {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: lines[i].length }
          },
          message: 'Slide has empty title attribute',
          source: 'vmd-language-server'
        });
      }
      
      // Rule 13: Unknown attribute
      const attributeRegex = /(\w+)\s*=\s*"[^"]*"/g;
      let attributeMatch: RegExpExecArray | null;
      while ((attributeMatch = attributeRegex.exec(params)) !== null && match) {
        const knownAttributes = ['title', 'lang', 'style', 'transition', 'duration'];
        if (!knownAttributes.includes(attributeMatch[1].toLowerCase())) {
          const matchIndex = match.index || 0;
          diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range: {
              start: { line: i, character: attributeMatch.index + matchIndex + match[0].indexOf('(') + 1 },
              end: { line: i, character: attributeMatch.index + matchIndex + match[0].indexOf('(') + 1 + attributeMatch[1].length }
            },
            message: `Unknown slide attribute: "${attributeMatch[1]}"`,
            source: 'vmd-language-server'
          });
        }
      }
      
      // Rule 14: Slide without content
      let hasContent = false;
      for (let j = i + 1; j < lines.length && !lines[j].match(/^##\s+/); j++) {
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
          message: 'Slide has no content',
          source: 'vmd-language-server'
        });
      }
      
      // Rule 16: Invalid language code
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
      else if (anySlideHasLang) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: lines[i].length }
          },
          message: 'Missing "lang" attribute. When any slide has a "lang" attribute, all slides must include it for consistency.',
          source: 'vmd-language-server'
        });
      }
    }
  }
}