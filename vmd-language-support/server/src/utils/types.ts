import { Diagnostic } from 'vscode-languageserver/node';

export interface ValidationContext {
  lines: string[];
  diagnostics: Diagnostic[];
  documentUri: string;
  workspacePath?: string | null;
}

export interface ElementCollection {
  buttonNames: Set<string>;
  quizNames: Set<string>;
  codeSnippets: { [name: string]: boolean };
  bulletDefinitions: Set<string>;
}