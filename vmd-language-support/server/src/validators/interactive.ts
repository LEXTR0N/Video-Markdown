// server/src/validators/interactive.ts - Full updated file
import { DiagnosticSeverity } from 'vscode-languageserver/node';
import { ValidationContext } from '../utils/types';
import { validTimePatterns } from '../utils/constants';
import { collectNamedElements } from '../utils/helpers';
import * as fs from 'fs';
import * as path from 'path';

export function validateInteractiveElements({ lines, diagnostics, documentUri, workspacePath }: ValidationContext): void {
  const buttonRegex = /^###\s+Button\s*\(([^)]*)\)$/;
  const imageRegex = /^###\s+Image\s*\(([^)]*)\)$/;
  const columnRegex = /^###\s+column\s*\(([^)]*)\)$/;
  
  // Get named elements for duplicate checking
  const { buttonNames } = collectNamedElements({ lines, diagnostics, documentUri, workspacePath });
  
  // Reset current scene for second pass
  let currentScene = '';
  
  for (let i = 0; i < lines.length; i++) {
    // Update current scene when we encounter a scene heading
    const sceneMatch = lines[i].match(/^#\s+Scene:\s*(.*)$/);
    if (sceneMatch && sceneMatch[1]) {
      currentScene = sceneMatch[1].trim();
    }
    
    // === Validate Buttons ===
    const buttonMatch = lines[i].match(buttonRegex);
    if (buttonMatch) {
      const params = buttonMatch[1];
      
      // Rule 22: Button without name
      const nameMatch = params.match(/name\s*=\s*"([^"]*)"/);
      if (!nameMatch) {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: lines[i].length }
          },
          message: 'Button should have a name attribute',
          source: 'vmd-language-server'
        });
      } else {
        // Check for duplicate button names in the same scene
        const buttonName = nameMatch[1];
        let isDuplicate = false;
        
        // Check if this is a duplicate by counting occurrences
        let count = 0;
        for (let j = 0; j < lines.length; j++) {
          const otherButtonMatch = lines[j].match(buttonRegex);
          if (otherButtonMatch) {
            const otherParams = otherButtonMatch[1];
            const otherNameMatch = otherParams.match(/name\s*=\s*"([^"]*)"/);
            if (otherNameMatch && otherNameMatch[1] === buttonName) {
              count++;
              if (count > 1 && j === i) {
                isDuplicate = true;
                break;
              }
            }
          }
        }
        
        if (isDuplicate) {
          const nameMatchIndex = params.indexOf(`name="${buttonName}"`);
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: {
              start: { line: i, character: nameMatchIndex },
              end: { line: i, character: nameMatchIndex + `name="${buttonName}"`.length }
            },
            message: `Duplicate button name "${buttonName}" in the same scene`,
            source: 'vmd-language-server'
          });
        }
      }
      
      // Validate time attribute format
      const timeMatch = params.match(/time\s*=\s*"([^"]*)"/);
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
      
      // Rule 24: Button without action
      const actionMatch = params.match(/action\s*=\s*"([^"]*)"/);
      if (!actionMatch) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: lines[i].length }
          },
          message: 'Button must have an action attribute',
          source: 'vmd-language-server'
        });
      } else {
        // Rules 25 & 26: Action format and existence
        const actionValue = actionMatch[1];
        if (actionValue.startsWith('scene:')) {
          const sceneName = actionValue.substring(6).trim();
          let sceneExists = false;
          
          // Check if the referenced scene exists
          for (let j = 0; j < lines.length; j++) {
            const otherSceneMatch = lines[j].match(/^#\s+Scene:\s*(.*)/);
            if (otherSceneMatch && otherSceneMatch[1].trim() === sceneName) {
              sceneExists = true;
              break;
            }
          }
          
          if (!sceneExists) {
            const actionMatchIndex = params.indexOf(actionMatch[0]);
            
            diagnostics.push({
              severity: DiagnosticSeverity.Error,
              range: {
                start: { line: i, character: actionMatchIndex + buttonMatch[0].indexOf('(') + 1 },
                end: { line: i, character: actionMatchIndex + buttonMatch[0].indexOf('(') + 1 + actionMatch[0].length }
              },
              message: `Button action references non-existent scene: "${sceneName}"`,
              source: 'vmd-language-server'
            });
          }
        } else if (!actionValue.startsWith('http://') && !actionValue.startsWith('https://') && !actionValue.startsWith('file:')) {
          const actionMatchIndex = params.indexOf(actionMatch[0]);
          
          diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range: {
              start: { line: i, character: actionMatchIndex + buttonMatch[0].indexOf('(') + 1 },
              end: { line: i, character: actionMatchIndex + buttonMatch[0].indexOf('(') + 1 + actionMatch[0].length }
            },
            message: `Invalid action format: "${actionValue}". Should start with "scene:", "http://", "https://" or "file:"`,
            source: 'vmd-language-server'
          });
        }
      }
    }
    
    // === Validate Images ===
    const imageMatch = lines[i].match(imageRegex);
    if (imageMatch) {
      const params = imageMatch[1];
      
      // Rule 27: Image without source
      const sourceMatch = params.match(/source\s*=\s*"([^"]*)"/);
      if (!sourceMatch) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: lines[i].length }
          },
          message: 'Image must have a source attribute',
          source: 'vmd-language-server'
        });
      } else {
        // Rule 28: Image path doesn't exist
        const imagePath = sourceMatch[1];
        if (workspacePath && !imagePath.startsWith('http://') && !imagePath.startsWith('https://')) {
          try {
            const documentDir = path.dirname(documentUri.replace('file://', ''));
            const fullImagePath = path.resolve(documentDir, imagePath);
            
            if (!fs.existsSync(fullImagePath)) {
              const sourceMatchIndex = params.indexOf(sourceMatch[0]);
              
              diagnostics.push({
                severity: DiagnosticSeverity.Error, 
                range: {
                  start: { line: i, character: sourceMatchIndex + imageMatch[0].indexOf('(') + 1 },
                  end: { line: i, character: sourceMatchIndex + imageMatch[0].indexOf('(') + 1 + sourceMatch[0].length }
                },
                message: `Image file not found: "${imagePath}"`,
                source: 'vmd-language-server'
              });
            }
          } catch (error) {
            // No diagnostics for file access errors
          }
        }
      }
      
      // Removed alt attribute check
    }
    
    // === Validate Columns ===
    const columnMatch = lines[i].match(columnRegex);
    if (columnMatch) {
      const params = columnMatch[1];
      
      // Rule 38: Invalid width value
      const widthMatch = params.match(/width\s*=\s*(\d+)/);
      if (widthMatch) {
        const width = parseInt(widthMatch[1]);
        if (isNaN(width)) {
          const widthMatchIndex = params.indexOf(widthMatch[0]);
          
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: {
              start: { line: i, character: widthMatchIndex + columnMatch[0].indexOf('(') + 1 },
              end: { line: i, character: widthMatchIndex + columnMatch[0].indexOf('(') + 1 + widthMatch[0].length }
            },
            message: `Invalid value for width: "${widthMatch[1]}". Must be a number.`,
            source: 'vmd-language-server'
          });
        }
      }
    }
  }
}