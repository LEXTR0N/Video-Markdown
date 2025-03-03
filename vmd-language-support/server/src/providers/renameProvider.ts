// server/src/providers/renameProvider.ts
import {
    TextDocumentPositionParams,
    RenameParams,
    WorkspaceEdit,
    TextEdit,
    Range
  } from 'vscode-languageserver/node';
  import { TextDocument } from 'vscode-languageserver-textdocument';
  
  export function prepareRename(
    document: TextDocument,
    position: TextDocumentPositionParams
  ): Range | null {
    const text = document.getText();
    const lines = text.split(/\r?\n/g);
    const line = lines[position.position.line];
    const character = position.position.character;
    
    // Check if we're in a scene title
    const sceneMatch = line.match(/^#\s+Scene:\s*(.*)/);
    if (sceneMatch && character >= line.indexOf(sceneMatch[1]) && character <= line.indexOf(sceneMatch[1]) + sceneMatch[1].length) {
      return {
        start: { line: position.position.line, character: line.indexOf(sceneMatch[1]) },
        end: { line: position.position.line, character: line.indexOf(sceneMatch[1]) + sceneMatch[1].length }
      };
    }
    
    // Check if we're in a button name
    const buttonMatch = line.match(/name\s*=\s*"([^"]*)"/);
    if (buttonMatch && character >= line.indexOf(buttonMatch[1]) && character <= line.indexOf(buttonMatch[1]) + buttonMatch[1].length) {
      return {
        start: { line: position.position.line, character: line.indexOf(buttonMatch[1]) },
        end: { line: position.position.line, character: line.indexOf(buttonMatch[1]) + buttonMatch[1].length }
      };
    }
    
    // Check if we're in a quiz name
    const quizMatch = line.match(/##\s+Quiz\s*\(.*?name\s*=\s*"([^"]*)".*?\)/);
    if (quizMatch && character >= line.indexOf(quizMatch[1]) && character <= line.indexOf(quizMatch[1]) + quizMatch[1].length) {
      return {
        start: { line: position.position.line, character: line.indexOf(quizMatch[1]) },
        end: { line: position.position.line, character: line.indexOf(quizMatch[1]) + quizMatch[1].length }
      };
    }
    
    return null;
  }
  
  export function provideRenameEdits(
    document: TextDocument,
    params: RenameParams
  ): WorkspaceEdit {
    const text = document.getText();
    const lines = text.split(/\r?\n/g);
    const line = lines[params.position.line];
    const character = params.position.character;
    const newName = params.newName;
    
    const edits: TextEdit[] = [];
    
    // Check if we're renaming a scene title
    const sceneMatch = line.match(/^#\s+Scene:\s*(.*)/);
    if (sceneMatch && character >= line.indexOf(sceneMatch[1]) && character <= line.indexOf(sceneMatch[1]) + sceneMatch[1].length) {
      const oldName = sceneMatch[1];
      
      // First, update the scene heading
      edits.push({
        range: {
          start: { line: params.position.line, character: line.indexOf(oldName) },
          end: { line: params.position.line, character: line.indexOf(oldName) + oldName.length }
        },
        newText: newName
      });
      
      // Then, update all references to this scene in button actions
      const sceneRefRegex = /action\s*=\s*"scene:\s*([^"]*)"/;
      for (let i = 0; i < lines.length; i++) {
        const actionMatch = lines[i].match(sceneRefRegex);
        if (actionMatch && actionMatch[1].trim() === oldName.trim()) {
          edits.push({
            range: {
              start: { line: i, character: lines[i].indexOf(actionMatch[1]) },
              end: { line: i, character: lines[i].indexOf(actionMatch[1]) + actionMatch[1].length }
            },
            newText: newName
          });
        }
      }
    }
    
    // Check if we're renaming a button name
    const buttonMatch = line.match(/name\s*=\s*"([^"]*)"/);
    if (buttonMatch && character >= line.indexOf(buttonMatch[1]) && character <= line.indexOf(buttonMatch[1]) + buttonMatch[1].length) {
      const oldName = buttonMatch[1];
      
      // First, update the button name
      edits.push({
        range: {
          start: { line: params.position.line, character: line.indexOf(oldName) },
          end: { line: params.position.line, character: line.indexOf(oldName) + oldName.length }
        },
        newText: newName
      });
      
      // Then, update all references to this button in interactive commands
      const buttonRefRegex = /\[!show:([^,\]]*)/;
      for (let i = 0; i < lines.length; i++) {
        let commandMatch;
        if ((commandMatch = lines[i].match(buttonRefRegex)) && commandMatch[1] === oldName) {
          edits.push({
            range: {
              start: { line: i, character: lines[i].indexOf(commandMatch[1]) },
              end: { line: i, character: lines[i].indexOf(commandMatch[1]) + commandMatch[1].length }
            },
            newText: newName
          });
        }
      }
    }
    
    // Check if we're renaming a quiz name
    const quizMatch = line.match(/##\s+Quiz\s*\(.*?name\s*=\s*"([^"]*)".*?\)/);
    if (quizMatch && character >= line.indexOf(quizMatch[1]) && character <= line.indexOf(quizMatch[1]) + quizMatch[1].length) {
      const oldName = quizMatch[1];
      
      // First, update the quiz name
      edits.push({
        range: {
          start: { line: params.position.line, character: line.indexOf(oldName) },
          end: { line: params.position.line, character: line.indexOf(oldName) + oldName.length }
        },
        newText: newName
      });
      
      // Then, update all references to this quiz in interactive commands
      const quizRefRegex = /\[!quiz:([^,\]]*)/;
      for (let i = 0; i < lines.length; i++) {
        let commandMatch;
        if ((commandMatch = lines[i].match(quizRefRegex)) && commandMatch[1] === oldName) {
          edits.push({
            range: {
              start: { line: i, character: lines[i].indexOf(commandMatch[1]) },
              end: { line: i, character: lines[i].indexOf(commandMatch[1]) + commandMatch[1].length }
            },
            newText: newName
          });
        }
      }
    }
    
    return {
      changes: {
        [document.uri]: edits
      }
    };
  }