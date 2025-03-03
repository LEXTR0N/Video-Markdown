// server/src/providers/documentLinkProvider.ts
import {
    DocumentLink,
    DocumentLinkParams,
    Range
  } from 'vscode-languageserver/node';
  import { TextDocument } from 'vscode-languageserver-textdocument';
  import * as path from 'path';
  import * as url from 'url';
  
  export function provideDocumentLinks(
    document: TextDocument,
    params: DocumentLinkParams,
    workspacePath: string | null
  ): DocumentLink[] {
    const text = document.getText();
    const lines = text.split(/\r?\n/g);
    const links: DocumentLink[] = [];
  
    // 1. File references (images and videos)
    const mediaRefRegex = /source\s*=\s*"([^"]*\.(?:mp4|webm|ogg|mov|png|jpg|jpeg|gif|svg))"/g;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match: RegExpExecArray | null;
      
      // Reset regex for each line
      mediaRefRegex.lastIndex = 0;
      
      while ((match = mediaRefRegex.exec(line)) !== null) {
        const filePath = match[1];
        if (!filePath.startsWith('http://') && !filePath.startsWith('https://')) {
          const startPosition = match.index + match[0].indexOf(match[1]) - 1; // Include the opening quote
          const endPosition = startPosition + match[1].length + 2; // Include the closing quote
          
          const documentUri = document.uri;
          let documentDir = "";
          
          // Handle URI properly
          if (documentUri.startsWith('file://')) {
            documentDir = path.dirname(documentUri.replace('file://', ''));
          } else {
            documentDir = path.dirname(documentUri);
          }
          
          const fullPath = path.resolve(documentDir, filePath);
          const targetUri = url.pathToFileURL(fullPath).href;
          
          links.push({
            range: {
              start: { line: i, character: startPosition },
              end: { line: i, character: endPosition }
            },
            target: targetUri
          });
        }
      }
    }
    
    // 2. Scene references in button actions
    const sceneRefRegex = /action\s*=\s*"scene:\s*([^"]*)"/g;
    const sceneHeadingRegex = /^#\s+Scene:\s*(.*)$/;
    
    // First collect all scene headings and their line numbers
    const scenes: { [title: string]: number } = {};
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(sceneHeadingRegex);
      if (match && match[1]) {
        scenes[match[1].trim()] = i;
      }
    }
    
    // Then process all scene references
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match: RegExpExecArray | null;
      
      // Reset regex for each line
      sceneRefRegex.lastIndex = 0;
      
      while ((match = sceneRefRegex.exec(line)) !== null) {
        const sceneTitle = match[1].trim();
        if (scenes[sceneTitle] !== undefined) {
          const startPosition = match.index + match[0].indexOf(sceneTitle);
          const endPosition = startPosition + sceneTitle.length;
          
          links.push({
            range: {
              start: { line: i, character: startPosition },
              end: { line: i, character: endPosition }
            },
            target: `${document.uri}#${scenes[sceneTitle] + 1}` // +1 for 1-based line numbers
          });
        }
      }
    }
    
    return links;
  }