// server/src/providers/documentStatusProvider.ts
import { TextDocument } from 'vscode-languageserver-textdocument';

export interface DocumentStatus {
  sceneCount: number;
  slideCount: number;
  videoCount: number;
  screencastCount: number;
  quizCount: number;
  totalLength: number; // Estimated in seconds
}

export function getDocumentStatus(document: TextDocument): DocumentStatus {
  const text = document.getText();
  const lines = text.split(/\r?\n/g);
  
  let sceneCount = 0;
  let slideCount = 0;
  let videoCount = 0;
  let screencastCount = 0;
  let quizCount = 0;
  let totalLength = 0;
  
  // Default durations (in seconds)
  const SLIDE_DEFAULT_DURATION = 60; // 1 minute per slide
  const VIDEO_DEFAULT_DURATION = 120; // 2 minutes per video
  const SCREENCAST_DEFAULT_DURATION = 180; // 3 minutes per screencast
  const QUIZ_DEFAULT_DURATION = 90; // 1.5 minutes per quiz
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Count scenes
    if (line.startsWith('# Scene:')) {
      sceneCount++;
    }
    
    // Count slides and get duration
    if (line.startsWith('## Slide')) {
      slideCount++;
      
      // Look for duration attribute
      const durationMatch = line.match(/duration\s*=\s*"(\d+)"/);
      if (durationMatch) {
        totalLength += parseInt(durationMatch[1]);
      } else {
        // Calculate based on content
        // Count lines until next element
        let contentLines = 0;
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim().startsWith('##')) {
            break;
          }
          if (lines[j].trim() !== '') {
            contentLines++;
          }
        }
        
        // Adjust duration based on content amount
        const contentFactor = Math.max(1, Math.min(3, contentLines / 5));
        totalLength += SLIDE_DEFAULT_DURATION * contentFactor;
      }
    }
    
    // Count videos and get duration
    if (line.startsWith('## Video')) {
      videoCount++;
      totalLength += VIDEO_DEFAULT_DURATION;
    }
    
    // Count screencasts and get duration
    if (line.startsWith('## Screencast')) {
      screencastCount++;
      totalLength += SCREENCAST_DEFAULT_DURATION;
    }
    
    // Count quizzes and estimate duration
    if (line.startsWith('## Quiz')) {
      quizCount++;
      
      // Count questions to adjust duration
      let questionCount = 0;
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim().startsWith('###') && !lines[j].match(/###\s+(Button|Image|Code|column)/)) {
          questionCount++;
        }
        if (lines[j].trim().startsWith('##')) {
          break;
        }
      }
      
      totalLength += QUIZ_DEFAULT_DURATION * Math.max(1, questionCount);
    }
  }
  
  return {
    sceneCount,
    slideCount,
    videoCount,
    screencastCount,
    quizCount,
    totalLength
  };
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}