// server/src/validators/markdown.ts - Full updated file
import { DiagnosticSeverity } from 'vscode-languageserver/node';
import { ValidationContext } from '../utils/types';

export function validateMarkdownFormatting({ lines, diagnostics }: ValidationContext): void {
  // Track if we're inside a comment block
  let insideCommentBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for comment block start/end
    if (line.includes('/*')) {
      insideCommentBlock = true;
    }
    if (line.includes('*/')) {
      insideCommentBlock = false;
      continue;
    }
    
    // Skip single-line comments, code blocks, section headers, and comment blocks
    if (line.trim().startsWith('//') || 
        line.startsWith('#') || 
        line.startsWith('```') || 
        insideCommentBlock) {
      continue;
    }
    
    // Count asterisks properly
    let singleCount = 0;
    let doubleCount = 0;
    
    // Check for ** (bold) - count pairs
    for (let j = 0; j < line.length - 1; j++) {
      if (line[j] === '*' && line[j + 1] === '*') {
        doubleCount++;
        j++; // Skip the second asterisk
      }
    }
    
    // Check for * (italic) - count singles that aren't part of doubles
    for (let j = 0; j < line.length; j++) {
      if (line[j] === '*') {
        // Check if this * is part of a ** - if it is, skip it
        if (j < line.length - 1 && line[j + 1] === '*') {
          j++; // Skip the second asterisk
          continue;
        }
        if (j > 0 && line[j - 1] === '*') {
          continue; // This is the second * of a ** pair we've already counted
        }
        singleCount++;
      }
    }
    
    // If we have an odd number of pairs or singles, we have unbalanced formatting
    if (doubleCount % 2 !== 0 || singleCount % 2 !== 0) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: {
          start: { line: i, character: 0 },
          end: { line: i, character: lines[i].length }
        },
        message: 'Potentially unbalanced Markdown formatting (* or **)',
        source: 'vmd-language-server'
      });
    }
  }
}