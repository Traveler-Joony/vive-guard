import * as vscode from 'vscode';
import { FileWatcher } from './watcher/fileWatcher';
import { SidebarProvider } from './ui/sidebarProvider';

let fileWatcher: FileWatcher | undefined;

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('VibeGuard');

  const sidebarProvider = new SidebarProvider(context.extensionUri);

  const sidebarRegistration = vscode.window.registerWebviewViewProvider(
    SidebarProvider.viewType,
    sidebarProvider,
  );

  fileWatcher = new FileWatcher();

  fileWatcher.onAnalysisComplete((result) => {
    const { health, timestamp } = result;
    const time = new Date(timestamp).toLocaleTimeString();

    outputChannel.appendLine(`[${time}] Health: ${health.grade} (${health.score.toFixed(1)})`);

    if (health.warnings.length > 0) {
      outputChannel.appendLine(`  Warnings (${health.warnings.length}):`);
      for (const w of health.warnings) {
        outputChannel.appendLine(`    - ${w}`);
      }
    }

    sidebarProvider.update(result);
  });

  const refreshCmd = vscode.commands.registerCommand('vibeGuard.refresh', () => {
    fileWatcher?.analyzeWorkspace();
  });

  const analyzeCmd = vscode.commands.registerCommand('vibeGuard.analyze', () => {
    fileWatcher?.analyzeWorkspace();
  });

  context.subscriptions.push(
    outputChannel,
    sidebarRegistration,
    fileWatcher,
    refreshCmd,
    analyzeCmd,
  );

  // Initial workspace analysis
  fileWatcher.analyzeWorkspace();
}

export function deactivate() {
  fileWatcher?.dispose();
  fileWatcher = undefined;
}
