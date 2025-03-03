import { DiagnosticSeverity } from 'vscode-languageserver/node';
import { ValidationContext } from '../utils/types';
import { validTimePatterns } from '../utils/constants';

export function validateQuizzes({ lines, diagnostics }: ValidationContext): void {
  const quizRegex = /^##\s+Quiz\s*\(([^)]*)\)$/;
  const questionRegex = /^###\s+(?!Button|Image|column|Code)(.+)$/;
  
  // Track quizzes in each scene
  let currentScene = '';
  const quizNamesInScene: { [scene: string]: Set<string> } = {};
  
  for (let i = 0; i < lines.length; i++) {
    // Track current scene
    const sceneMatch = lines[i].match(/^#\s+Scene:\s*(.*)$/);
    if (sceneMatch && sceneMatch[1]) {
      currentScene = sceneMatch[1].trim();
      if (!quizNamesInScene[currentScene]) {
        quizNamesInScene[currentScene] = new Set<string>();
      }
    }
    
    // Quiz validation
    const quizMatch = lines[i].match(quizRegex);
    if (quizMatch) {
      const params = quizMatch[1];
      let hasQuestions = false;
      let hasOptions = false;
      let hasCorrectAnswer = false;
      let optionCount = 0;
      
      // Check for time or name attribute
      const nameMatch = params.match(/name\s*=\s*"([^"]*)"/);
      const timeMatch = params.match(/time\s*=\s*"([^"]*)"/);
      
      if (!nameMatch && !timeMatch) {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: lines[i].length }
          },
          message: 'Quiz should have either a name or time attribute for reference',
          source: 'vmd-language-server'
        });
      }
      
      // Check for duplicate quiz names in the same scene
      if (nameMatch && currentScene) {
        const quizName = nameMatch[1];
        
        // Check for duplicates by counting occurrences
        let count = 0;
        for (let j = 0; j < i; j++) {
          const otherQuizMatch = lines[j].match(quizRegex);
          if (otherQuizMatch) {
            const otherParams = otherQuizMatch[1];
            const otherNameMatch = otherParams.match(/name\s*=\s*"([^"]*)"/);
            if (otherNameMatch && otherNameMatch[1] === quizName) {
              count++;
              if (count > 0) {
                break;
              }
            }
          }
        }
        
        if (count > 0) {
          const nameMatchIndex = params.indexOf(`name="${quizName}"`);
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: {
              start: { line: i, character: nameMatchIndex },
              end: { line: i, character: nameMatchIndex + `name="${quizName}"`.length }
            },
            message: `Duplicate quiz name "${quizName}" in the same scene`,
            source: 'vmd-language-server'
          });
        }
      }
      
      // Validate time attribute format if present
      if (timeMatch) {
        const timeValue = timeMatch[1];
        if (!validTimePatterns.includes(timeValue)) {
          const timeMatchIndex = params.indexOf(timeMatch[0]);
          diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range: {
              start: { line: i, character: timeMatchIndex },
              end: { line: i, character: timeMatchIndex + timeMatch[0].length }
            },
            message: `Invalid time pattern: "${timeValue}". Valid patterns: ${validTimePatterns.join(', ')}`,
            source: 'vmd-language-server'
          });
        }
      }
      
      for (let j = i + 1; j < lines.length && !lines[j].match(/^##\s+/); j++) {
        const questionMatch = lines[j].match(questionRegex);
        if (questionMatch) {
          hasQuestions = true;
          optionCount = 0;
          
          // Check answer options for this question
          for (let k = j + 1; k < lines.length && !lines[k].match(/^##/) && !lines[k].match(/^###/); k++) {
            const optionMatch = lines[k].match(/^\s*[-+]\s+(.+)$/);
            if (optionMatch) {
              hasOptions = true;
              optionCount++;
              if (lines[k].trim().startsWith('+')) {
                hasCorrectAnswer = true;
              }
            }
          }
          
          // TODO: Check if there are too many options (>6)
          if (optionCount > 6) {
            diagnostics.push({
              severity: DiagnosticSeverity.Warning,
              range: {
                start: { line: j, character: 0 },
                end: { line: j, character: lines[j].length }
              },
              message: 'Question has too many answer options (>6), which may be confusing',
              source: 'vmd-language-server'
            });
          }
        }
      }
      
      // Rule: Quiz without questions
      if (!hasQuestions) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: lines[i].length }
          },
          message: 'Quiz contains no questions',
          source: 'vmd-language-server'
        });
      }
      
      // Rule: Question without answer options
      if (hasQuestions && !hasOptions) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: lines[i].length }
          },
          message: 'Quiz contains questions without answer options',
          source: 'vmd-language-server'
        });
      }
      
      // Rule: No correct answer
      if (hasOptions && !hasCorrectAnswer) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: lines[i].length }
          },
          message: 'Quiz has no correct answer (marked with "+")',
          source: 'vmd-language-server'
        });
      }
    }
  }
}