// client/src/preview.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class VmdPreviewPanel {
  private static currentPanel: VmdPreviewPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _document: vscode.TextDocument;
  
  public static createOrShow(extensionUri: vscode.Uri, document: vscode.TextDocument) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    
    // If we already have a panel, show it
    if (VmdPreviewPanel.currentPanel) {
      VmdPreviewPanel.currentPanel._panel.reveal(column);
      VmdPreviewPanel.currentPanel.update(document);
      return;
    }
    
    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'vmdPreview',
      'VMD Preview',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'media'),
          vscode.Uri.file(path.dirname(document.uri.fsPath))
        ]
      }
    );
    
    VmdPreviewPanel.currentPanel = new VmdPreviewPanel(panel, extensionUri, document);
  }
  
  public constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, document: vscode.TextDocument) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._document = document;
    
    // Set the webview's initial html content
    this._update();
    
    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    
    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      e => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );
    
    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'alert':
            vscode.window.showErrorMessage(message.text);
            return;
        }
      },
      null,
      this._disposables
    );
  }
  
  public dispose() {
    VmdPreviewPanel.currentPanel = undefined;
    
    // Clean up our resources
    this._panel.dispose();
    
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
  
  public update(document: vscode.TextDocument) {
    this._document = document;
    this._update();
  }
  
  private _update() {
    const webview = this._panel.webview;
    this._panel.title = `Preview: ${path.basename(this._document.uri.fsPath)}`;
    webview.html = this._getHtmlForWebview(webview);
  }
  
  private _getHtmlForWebview(webview: vscode.Webview) {
    const text = this._document.getText();
    const documentDir = path.dirname(this._document.uri.fsPath);
    
    // Parse the VMD content
    const scenes = this._parseVmd(text, documentDir, webview);
    
    // Generate HTML preview
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VMD Preview</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
          }
          .scene {
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            padding: 15px;
          }
          .scene-title {
            border-bottom: 1px solid #eee;
            font-size: 24px;
            margin-top: 0;
            padding-bottom: 10px;
          }
          .slide, .video, .screencast, .quiz {
            border-left: 4px solid #007acc;
            margin: 15px 0;
            padding: 10px 15px;
          }
          .slide { border-color: #007acc; }
          .video { border-color: #e83e8c; }
          .screencast { border-color: #6f42c1; }
          .quiz { border-color: #28a745; }
          .teleprompt {
            background-color: #f8f9fa;
            border-radius: 5px;
            font-style: italic;
            margin-top: 10px;
            padding: 10px;
          }
          .element-title {
            color: #333;
            font-size: 18px;
            margin-top: 0;
          }
          .image-preview {
            max-width: 100%;
            height: auto;
            border: 1px solid #ddd;
            margin: 10px 0;
          }
          .button {
            background-color: #007acc;
            border: none;
            border-radius: 3px;
            color: white;
            cursor: pointer;
            display: inline-block;
            margin: 5px;
            padding: 8px 15px;
          }
          .button:hover {
            background-color: #005999;
          }
          .quiz-question {
            font-weight: bold;
            margin: 10px 0 5px;
          }
          .quiz-options {
            list-style-type: none;
            padding-left: 15px;
          }
          .quiz-option {
            margin: 5px 0;
          }
          .quiz-option.correct {
            color: #28a745;
            font-weight: bold;
          }
          .code-snippet {
            background-color: #f5f5f5;
            border-radius: 3px;
            font-family: monospace;
            margin: 10px 0;
            padding: 10px;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>VMD Preview</h1>
          ${scenes}
        </div>
      </body>
      </html>
    `;
  }
  
  private _parseVmd(text: string, documentDir: string, webview: vscode.Webview): string {
    const lines = text.split(/\r?\n/g);
    let html = '';
    
    let inScene = false;
    let currentSceneHtml = '';
    let sceneTitle = '';
    
    let inSlide = false;
    let currentSlideHtml = '';
    let slideTitle = '';
    
    let inTeleprompt = false;
    let currentTelepromptHtml = '';
    
    let inQuiz = false;
    let currentQuizHtml = '';
    let quizTitle = '';
    
    // Skip YAML front matter
    let skipToLine = 0;
    if (lines.length > 0 && lines[0].trim() === '---') {
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
          skipToLine = i + 1;
          break;
        }
      }
    }
    
    for (let i = skipToLine; i < lines.length; i++) {
      const line = lines[i];
      
      // Parse Scene headings
      if (line.match(/^#\s+Scene:/)) {
        // Close previous scene if there was one
        if (inScene) {
          html += `<div class="scene"><h2 class="scene-title">${sceneTitle}</h2>${currentSceneHtml}</div>`;
          currentSceneHtml = '';
        }
        
        inScene = true;
        sceneTitle = line.replace(/^#\s+Scene:\s*/, '');
        continue;
      }
      
      // Parse Slides
      if (line.match(/^##\s+Slide\s*\(/)) {
        // Close previous elements
        this._closeElements(inTeleprompt, currentTelepromptHtml, inSlide, currentSlideHtml, inQuiz, currentQuizHtml, currentSceneHtml);
        inTeleprompt = false;
        inSlide = true;
        inQuiz = false;
        currentTelepromptHtml = '';
        currentQuizHtml = '';
        
        // Extract slide title
        const titleMatch = line.match(/title\s*=\s*"([^"]*)"/);
        slideTitle = titleMatch ? titleMatch[1] : 'Untitled Slide';
        
        // Extract language
        const langMatch = line.match(/lang\s*=\s*"([^"]*)"/);
        const lang = langMatch ? ` (${langMatch[1]})` : '';
        
        currentSlideHtml = `<div class="slide"><h3 class="element-title">Slide: ${slideTitle}${lang}</h3>`;
        continue;
      }
      
      // Parse Video/Screencast
      if (line.match(/^##\s+(Video|Screencast)\s*\(/)) {
        // Close previous elements
        this._closeElements(inTeleprompt, currentTelepromptHtml, inSlide, currentSlideHtml, inQuiz, currentQuizHtml, currentSceneHtml);
        inTeleprompt = false;
        inSlide = false;
        inQuiz = false;
        currentTelepromptHtml = '';
        currentSlideHtml = '';
        currentQuizHtml = '';
        
        const isVideo = line.match(/^##\s+Video\s*\(/);
        const type = isVideo ? 'Video' : 'Screencast';
        
        // Extract source
        const sourceMatch = line.match(/source\s*=\s*"([^"]*)"/);
        const source = sourceMatch ? sourceMatch[1] : 'No source';
        
        // Add video/screencast element
        const className = isVideo ? 'video' : 'screencast';
        currentSceneHtml += `<div class="${className}">
            <h3 class="element-title">${type}: ${source}</h3>`;
        
        // Try to add video player if source exists
        if (sourceMatch) {
          const videoPath = sourceMatch[1];
          if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
            currentSceneHtml += `<video controls src="${videoPath}" style="max-width:100%"></video>`;
          } else {
            try {
              const fullPath = path.resolve(documentDir, videoPath);
              if (fs.existsSync(fullPath)) {
                const videoUri = webview.asWebviewUri(vscode.Uri.file(fullPath));
                currentSceneHtml += `<video controls src="${videoUri}" style="max-width:100%"></video>`;
              } else {
                currentSceneHtml += `<div class="video-placeholder">[${type} not found: ${videoPath}]</div>`;
              }
            } catch (err: any) {
              currentSceneHtml += `<div class="video-placeholder">[${type} error: ${err.message || "Unknown error"}]</div>`;
            }
          }
        }
        
        currentSceneHtml += `</div>`;
        continue;
      }
      
      // Parse Quiz
      if (line.match(/^##\s+Quiz\s*\(/)) {
        // Close previous elements
        this._closeElements(inTeleprompt, currentTelepromptHtml, inSlide, currentSlideHtml, inQuiz, currentQuizHtml, currentSceneHtml);
        inTeleprompt = false;
        inSlide = false;
        inQuiz = true;
        currentTelepromptHtml = '';
        currentSlideHtml = '';
        
        // Extract quiz title
        const titleMatch = line.match(/title\s*=\s*"([^"]*)"/);
        quizTitle = titleMatch ? titleMatch[1] : 'Untitled Quiz';
        
        // Extract quiz name
        const nameMatch = line.match(/name\s*=\s*"([^"]*)"/);
        const name = nameMatch ? `(${nameMatch[1]})` : '';
        
        currentQuizHtml = `<div class="quiz"><h3 class="element-title">Quiz: ${quizTitle} ${name}</h3>`;
        continue;
      }
      
      // Parse Teleprompt
      if (line.match(/^##\s+(Teleprompt|Telepromt)\s*\(/)) {
        // Close previous teleprompt if there was one
        if (inTeleprompt) {
          if (inSlide) {
            currentSlideHtml += `<div class="teleprompt">${currentTelepromptHtml}</div>`;
          } else if (inQuiz) {
            currentQuizHtml += `<div class="teleprompt">${currentTelepromptHtml}</div>`;
          } else {
            currentSceneHtml += `<div class="teleprompt">${currentTelepromptHtml}</div>`;
          }
          currentTelepromptHtml = '';
        }
        
        inTeleprompt = true;
        
        // Extract teleprompt title
        const titleMatch = line.match(/title\s*=\s*"([^"]*)"/);
        const telepromptTitle = titleMatch ? titleMatch[1] : 'Teleprompt';
        
        // Extract language
        const langMatch = line.match(/lang\s*=\s*"([^"]*)"/);
        const lang = langMatch ? ` (${langMatch[1]})` : '';
        
        currentTelepromptHtml = `<h4>Teleprompt: ${telepromptTitle}${lang}</h4>`;
        continue;
      }
      
      // Add content to the current element
      if (inTeleprompt) {
        if (line.trim() !== '') {
          currentTelepromptHtml += `<p>${this._formatText(line)}</p>`;
        }
      } else if (inSlide) {
        // Process slide content (bullet points, images, buttons)
        if (line.trim().startsWith('-')) {
          currentSlideHtml += `<p>${this._formatText(line.trim().substring(1).trim())}</p>`;
        } else if (line.trim().startsWith('###')) {
          const match = line.match(/###\s+(Button|Image|Code|column)\s*\((.*)\)/);
          if (match) {
            const subElementType = match[1].toLowerCase();
            const params = match[2];
            
            switch (subElementType) {
              case 'button':
                const labelMatch = params.match(/label\s*=\s*"([^"]*)"/);
                const label = labelMatch ? labelMatch[1] : 'Button';
                currentSlideHtml += `<button class="button">${label}</button>`;
                break;
                
              case 'image':
                const sourceMatch = params.match(/source\s*=\s*"([^"]*)"/);
                if (sourceMatch) {
                  const imagePath = sourceMatch[1];
                  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
                    currentSlideHtml += `<img class="image-preview" src="${imagePath}" alt="Image" />`;
                  } else {
                    // Convert local path to webview URI
                    try {
                      const fullPath = path.resolve(documentDir, imagePath);
                      if (fs.existsSync(fullPath)) {
                        const imageUri = webview.asWebviewUri(vscode.Uri.file(fullPath));
                        currentSlideHtml += `<img class="image-preview" src="${imageUri}" alt="Image" />`;
                      } else {
                        currentSlideHtml += `<div class="image-placeholder">[Image not found: ${imagePath}]</div>`;
                      }
                    } catch (err: any) {
                      currentSlideHtml += `<div class="image-placeholder">[Image error: ${err.message || "Unknown error"}]</div>`;
                    }
                  }
                }
                break;
                
              case 'code':
                // Code snippets need special handling - collecting lines until next element
                let codeContent = '';
                let j = i + 1;
                while (j < lines.length && 
                       !lines[j].match(/^##\s+/) && 
                       !lines[j].match(/^###\s+/)) {
                  codeContent += lines[j] + '\n';
                  j++;
                }
                currentSlideHtml += `<pre class="code-snippet">${codeContent}</pre>`;
                break;
                
              case 'column':
                const widthMatch = params.match(/width\s*=\s*(\d+)/);
                const width = widthMatch ? widthMatch[1] + '%' : '50%';
                currentSlideHtml += `<div style="width:${width};display:inline-block;vertical-align:top;">`;
                break;
            }
          }
        } else if (line.trim() !== '') {
          currentSlideHtml += `<p>${this._formatText(line)}</p>`;
        }
      } else if (inQuiz) {
        // Process quiz content (questions and options)
        if (line.trim().startsWith('###') && !line.match(/###\s+(Button|Image|Code|column)/)) {
          // New question
          currentQuizHtml += `<div class="quiz-question">${line.replace(/^###\s+/, '')}</div>`;
          currentQuizHtml += `<ul class="quiz-options">`;
        } else if (line.trim().startsWith('-') || line.trim().startsWith('+')) {
          const isCorrect = line.trim().startsWith('+');
          const optionText = line.trim().substring(1).trim();
          const optionClass = isCorrect ? 'quiz-option correct' : 'quiz-option';
          currentQuizHtml += `<li class="${optionClass}">${optionText}</li>`;
        } else if (line.trim() === '' && currentQuizHtml.endsWith('</li>')) {
          // End of options list
          currentQuizHtml += `</ul>`;
        }
      }
    }
    
    // Close the last elements
    this._closeElements(inTeleprompt, currentTelepromptHtml, inSlide, currentSlideHtml, inQuiz, currentQuizHtml, currentSceneHtml);
    
    // Close the last scene
    if (inScene) {
      html += `<div class="scene"><h2 class="scene-title">${sceneTitle}</h2>${currentSceneHtml}</div>`;
    }
    
    return html;
  }
  
  private _closeElements(inTeleprompt: boolean, currentTelepromptHtml: string, inSlide: boolean, currentSlideHtml: string, inQuiz: boolean, currentQuizHtml: string, currentSceneHtml: string): void {
    if (inTeleprompt) {
      if (inSlide) {
        currentSlideHtml += `<div class="teleprompt">${currentTelepromptHtml}</div>`;
      } else if (inQuiz) {
        currentQuizHtml += `<div class="teleprompt">${currentTelepromptHtml}</div>`;
      } else {
        currentSceneHtml += `<div class="teleprompt">${currentTelepromptHtml}</div>`;
      }
    }
    
    if (inSlide) {
      currentSceneHtml += `<div class="slide">${currentSlideHtml}</div>`;
    }
    
    if (inQuiz) {
      currentSceneHtml += `<div class="quiz">${currentQuizHtml}</div>`;
    }
  }
  
  private _formatText(text: string): string {
    // Convert Markdown-style formatting to HTML
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*([^*]+)\*/g, '<em>$1</em>') // Italic
      .replace(/`([^`]+)`/g, '<code>$1</code>') // Code
      .replace(/\[!([^\]]+)\]/g, '<span class="interactive-command">[$1]</span>'); // Interactive commands
  }
}

// Command to open the preview
export function openPreview(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (editor && editor.document.languageId === 'vmd') {
    VmdPreviewPanel.createOrShow(context.extensionUri, editor.document);
  }
}

// Command to export to HTML
export function exportToHtml(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'vmd') {
    vscode.window.showErrorMessage('Please open a VMD file first');
    return;
  }
  
  // Create a preview panel but don't show it
  const panel = vscode.window.createWebviewPanel(
    'vmdExport',
    'VMD Export',
    vscode.ViewColumn.One,
    { 
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(context.extensionUri, 'media'),
        vscode.Uri.file(path.dirname(editor.document.uri.fsPath))
      ]
    }
  );
  
  // Use the existing VmdPreviewPanel to generate the HTML
  const previewPanel = new VmdPreviewPanel(panel, context.extensionUri, editor.document);
  
  // Access the webview HTML content
  const html = panel.webview.html;
  
  // Dispose the panel (we don't need to show it)
  previewPanel.dispose();
  
  // Ask for file location
  vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file(editor.document.uri.fsPath.replace('.vmd', '.html')),
    filters: { 'HTML files': ['html'] }
  }).then(fileUri => {
    if (fileUri) {
      fs.writeFileSync(fileUri.fsPath, html);
      vscode.window.showInformationMessage(`Exported to ${fileUri.fsPath}`);
    }
  });
}