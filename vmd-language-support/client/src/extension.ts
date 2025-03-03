// client/src/extension.ts
import * as path from 'path';
import * as vscode from 'vscode';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node';

import { openPreview, exportToHtml } from './preview';

let client: LanguageClient;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log("VMD Language Support Extension wird aktiviert.");

  // Pfad zum Server-Modul
  const serverModule = context.asAbsolutePath(path.join("server", "dist", "server.js"));
  console.log("Server-Modul Pfad:", serverModule);

  // Workspace-Informationen sammeln
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const workspacePath = workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : "";
  console.log("Workspace path:", workspacePath);

  // Serveroptionen
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc, options: { execArgv: ["--nolazy", "--inspect=6009"] } }
  };

  // Clientoptionen mit Workspace-Pfad als Initialisierungsoption
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "vmd" }],
    initializationOptions: { workspacePath }
  };

  // Erstelle und starte den Language Client
  client = new LanguageClient("vmdLanguageServer", "VMD Language Server", serverOptions, clientOptions);
  
  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'vmd.openDocumentation';
  context.subscriptions.push(statusBarItem);
  
  // Starte den Client und füge ihn zu den Subscriptions hinzu
  context.subscriptions.push({
    dispose: () => client.stop()
  });
  
  // VMD-spezifische Syntaxhervorhebung hinzufügen
  addVMDSyntaxHighlighting(context);
  
  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('vmd.openDocumentation', () => {
      vscode.env.openExternal(vscode.Uri.parse('https://github.com/Ihr-Username/vmd-language-support'));
    }),
    
    vscode.commands.registerCommand('vmd.openPreview', () => {
      openPreview(context);
    }),
    
    vscode.commands.registerCommand('vmd.exportToHtml', () => {
      exportToHtml(context);
    })
  );
  
  // Update document status when active editor changes
  vscode.window.onDidChangeActiveTextEditor(editor => {
    updateDocumentStatus(editor);
  });
  
  // Listen for document status notifications
  client.start().then(() => {
    console.log("Language Client ist bereit.");
    
    // Set up notification handler
    client.onNotification('vmd/documentStatus', (params: { uri: string, status: any }) => {
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor && activeEditor.document.uri.toString() === params.uri) {
        const { sceneCount, slideCount, videoCount, screencastCount, quizCount, duration } = params.status;
        statusBarItem.text = `VMD: ${sceneCount} scenes, ${slideCount + videoCount + screencastCount} elements, Est. ${duration}`;
        statusBarItem.show();
      }
    });
  }).catch((error: Error) => {
    console.error("Fehler beim Starten des Language Clients:", error);
  });
  
  // Initial status update
  updateDocumentStatus(vscode.window.activeTextEditor);

  // Starte den Client und warte auf die Bereitschaft
  client.start().then(() => {
    console.log("Language Client ist bereit.");
  }).catch((error: Error) => {
    console.error("Fehler beim Starten des Language Clients:", error);
  });
}

function updateDocumentStatus(editor: vscode.TextEditor | undefined) {
  if (editor && editor.document.languageId === 'vmd') {
    statusBarItem.show();
    client.sendNotification('vmd/requestDocumentStatus', { uri: editor.document.uri.toString() });
  } else {
    statusBarItem.hide();
  }
}

function addVMDSyntaxHighlighting(context: vscode.ExtensionContext) {
  // Your existing syntax highlighting code...
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  
  statusBarItem.dispose();
  return client.stop();
}