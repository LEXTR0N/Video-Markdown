// server/src/providers/foldingRangeProvider.ts
import {
    FoldingRange,
    FoldingRangeKind
  } from 'vscode-languageserver/node';
  import { TextDocument } from 'vscode-languageserver-textdocument';
  
  export function provideFoldingRanges(document: TextDocument): FoldingRange[] {
    const text = document.getText();
    const lines = text.split(/\r?\n/g);
    const ranges: FoldingRange[] = [];
    
    // Track indentation levels
    let sceneStart = -1;
    let slideStart = -1;
    let quizStart = -1;
    let commentStart = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 1. Front Matter
      if (i === 0 && line === '---') {
        const frontMatterEnd = lines.findIndex((l, idx) => idx > 0 && l.trim() === '---');
        if (frontMatterEnd > 0) {
          ranges.push({
            startLine: 0,
            endLine: frontMatterEnd,
            kind: FoldingRangeKind.Region
          });
        }
      }
      
      // 2. Comments
      if (line.startsWith('/*') && commentStart === -1) {
        commentStart = i;
      } else if (line.includes('*/') && commentStart !== -1) {
        ranges.push({
          startLine: commentStart,
          endLine: i,
          kind: FoldingRangeKind.Comment
        });
        commentStart = -1;
      }
      
      // 3. Scenes
      if (line.startsWith('# Scene:')) {
        // Close previous scene if there's one
        if (sceneStart !== -1) {
          ranges.push({
            startLine: sceneStart,
            endLine: i - 1,
            kind: FoldingRangeKind.Region
          });
        }
        sceneStart = i;
      }
      
      // 4. Slides and other content elements
      if (line.startsWith('## Slide') || line.startsWith('## Video') || line.startsWith('## Screencast')) {
        // Close previous slide if there's one
        if (slideStart !== -1) {
          ranges.push({
            startLine: slideStart,
            endLine: i - 1,
            kind: FoldingRangeKind.Region
          });
        }
        slideStart = i;
      }
      
      // 5. Teleprompt (typically ends a slide section)
      if (line.startsWith('## Teleprompt') || line.startsWith('## Telepromt')) {
        // Don't close the slide section yet, include the teleprompt
        if (slideStart !== -1) {
          // Look ahead to find the end of the teleprompt section
          let j = i + 1;
          while (j < lines.length && !lines[j].trim().startsWith('#')) {
            j++;
          }
          
          ranges.push({
            startLine: slideStart,
            endLine: j - 1,
            kind: FoldingRangeKind.Region
          });
          
          slideStart = -1; // Reset slide start
        }
      }
      
      // 6. Quiz sections
      if (line.startsWith('## Quiz')) {
        quizStart = i;
      } else if (quizStart !== -1 && (line.startsWith('##') || line.startsWith('# Scene:'))) {
        ranges.push({
          startLine: quizStart,
          endLine: i - 1,
          kind: FoldingRangeKind.Region
        });
        quizStart = -1;
      }
    }
    
    // Close any open sections at the end of the document
    if (sceneStart !== -1 && sceneStart < lines.length - 1) {
      ranges.push({
        startLine: sceneStart,
        endLine: lines.length - 1,
        kind: FoldingRangeKind.Region
      });
    }
    
    if (slideStart !== -1 && slideStart < lines.length - 1) {
      ranges.push({
        startLine: slideStart,
        endLine: lines.length - 1,
        kind: FoldingRangeKind.Region
      });
    }
    
    if (quizStart !== -1 && quizStart < lines.length - 1) {
      ranges.push({
        startLine: quizStart,
        endLine: lines.length - 1,
        kind: FoldingRangeKind.Region
      });
    }
    
    return ranges;
  }