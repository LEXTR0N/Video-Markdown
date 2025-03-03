// server/src/validators/media.ts - Full updated file
import { DiagnosticSeverity } from 'vscode-languageserver/node';
import { ValidationContext } from '../utils/types';
import { supportedVideoFormats } from '../utils/constants';
import * as fs from 'fs';
import * as path from 'path';

export function validateMedia({ lines, diagnostics, documentUri, workspacePath }: ValidationContext): void {
  const videoRegex = /^##\s+Video\s*\(([^)]*)\)$/;
  const screencastRegex = /^##\s+Screencast\s*\(([^)]*)\)$/;
  
  for (let i = 0; i < lines.length; i++) {
    // Validate Video elements
    const videoMatch = lines[i].match(videoRegex);
    if (videoMatch) {
      const params = videoMatch[1];
      
      // Check for source attribute
      const sourceMatch = params.match(/source\s*=\s*"([^"]*)"/);
      if (!sourceMatch) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: lines[i].length }
          },
          message: 'Video must have a source attribute',
          source: 'vmd-language-server'
        });
      } else {
        // Check if video file exists
        const videoPath = sourceMatch[1];
        if (workspacePath && !videoPath.startsWith('http://') && !videoPath.startsWith('https://')) {
          try {
            const documentDir = path.dirname(documentUri.replace('file://', ''));
            const fullVideoPath = path.resolve(documentDir, videoPath);
            
            if (!fs.existsSync(fullVideoPath)) {
              const sourceMatchIdx = params.indexOf(sourceMatch[0]);
              
              diagnostics.push({
                severity: DiagnosticSeverity.Error, // Changed from Warning to Error
                range: {
                  start: { line: i, character: sourceMatchIdx + videoMatch[0].indexOf('(') + 1 },
                  end: { line: i, character: sourceMatchIdx + videoMatch[0].indexOf('(') + 1 + sourceMatch[0].length }
                },
                message: `Video file not found: "${videoPath}"`,
                source: 'vmd-language-server'
              });
            }
            
            // Check video format compatibility
            const fileExt = path.extname(videoPath).toLowerCase();
            if (!supportedVideoFormats.includes(fileExt)) {
              const sourceMatchIdx = params.indexOf(sourceMatch[0]);
              diagnostics.push({
                severity: DiagnosticSeverity.Warning,
                range: {
                  start: { line: i, character: sourceMatchIdx + videoMatch[0].indexOf('(') + 1 },
                  end: { line: i, character: sourceMatchIdx + videoMatch[0].indexOf('(') + 1 + sourceMatch[0].length }
                },
                message: `Potentially unsupported video format: "${fileExt}". Recommended formats: ${supportedVideoFormats.join(', ')}`,
                source: 'vmd-language-server'
              });
            }
          } catch (error) {
            // No diagnostics for file access errors
          }
        }
      }
    }
    
    // Validate Screencast elements
    const screencastMatch = lines[i].match(screencastRegex);
    if (screencastMatch) {
      const params = screencastMatch[1];
      
      // Check for source attribute
      const sourceMatch = params.match(/source\s*=\s*"([^"]*)"/);
      if (!sourceMatch) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: lines[i].length }
          },
          message: 'Screencast must have a source attribute',
          source: 'vmd-language-server'
        });
      } else {
        // Check if screencast file exists
        const screencastPath = sourceMatch[1];
        if (workspacePath && !screencastPath.startsWith('http://') && !screencastPath.startsWith('https://')) {
          try {
            const documentDir = path.dirname(documentUri.replace('file://', ''));
            const fullScreencastPath = path.resolve(documentDir, screencastPath);
            
            if (!fs.existsSync(fullScreencastPath)) {
              const sourceMatchIdx = params.indexOf(sourceMatch[0]);
              
              diagnostics.push({
                severity: DiagnosticSeverity.Error, // Changed from Warning to Error
                range: {
                  start: { line: i, character: sourceMatchIdx + screencastMatch[0].indexOf('(') + 1 },
                  end: { line: i, character: sourceMatchIdx + screencastMatch[0].indexOf('(') + 1 + sourceMatch[0].length }
                },
                message: `Screencast file not found: "${screencastPath}"`,
                source: 'vmd-language-server'
              });
            }
            
            // Check screencast format compatibility
            const fileExt = path.extname(screencastPath).toLowerCase();
            if (!supportedVideoFormats.includes(fileExt)) {
              const sourceMatchIdx = params.indexOf(sourceMatch[0]);
              diagnostics.push({
                severity: DiagnosticSeverity.Warning,
                range: {
                  start: { line: i, character: sourceMatchIdx + screencastMatch[0].indexOf('(') + 1 },
                  end: { line: i, character: sourceMatchIdx + screencastMatch[0].indexOf('(') + 1 + sourceMatch[0].length }
                },
                message: `Potentially unsupported screencast format: "${fileExt}". Recommended formats: ${supportedVideoFormats.join(', ')}`,
                source: 'vmd-language-server'
              });
            }
          } catch (error) {
            // No diagnostics for file access errors
          }
        }
      }
    }
  }
}