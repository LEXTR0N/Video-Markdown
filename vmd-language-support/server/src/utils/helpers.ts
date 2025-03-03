import { ValidationContext } from './types';

// Helper to collect all named elements in the document
export function collectNamedElements(context: ValidationContext) {
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