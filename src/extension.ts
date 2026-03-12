import * as vscode from 'vscode';
import { FileWatcher } from './watcher/fileWatcher';
import { SidebarProvider } from './ui/sidebarProvider';
import { VibeGuardCodeLensProvider } from './ui/codeLensProvider';
import { DiagnosticsProvider } from './ui/diagnosticsProvider';
import { NotificationManager } from './ui/notificationManager';

let fileWatcher: FileWatcher | undefined;

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('VibeGuard');

  const sidebarProvider = new SidebarProvider(context.extensionUri, context.workspaceState);

  const sidebarRegistration = vscode.window.registerWebviewViewProvider(
    SidebarProvider.viewType,
    sidebarProvider,
  );

  const codeLensProvider = new VibeGuardCodeLensProvider();
  const codeLensSelector = [
    { language: 'typescript' },
    { language: 'javascript' },
    { language: 'typescriptreact' },
    { language: 'javascriptreact' },
  ];
  const codeLensRegistration = vscode.languages.registerCodeLensProvider(
    codeLensSelector,
    codeLensProvider,
  );

  const diagnosticsProvider = new DiagnosticsProvider();
  const notificationManager = new NotificationManager(context.workspaceState);

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
    codeLensProvider.refresh(result);
    diagnosticsProvider.refresh(result);
    notificationManager.refresh(result);

    context.workspaceState.update('vibeGuard.lastHealthScore', result.health);
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
    codeLensRegistration,
    codeLensProvider,
    diagnosticsProvider,
    notificationManager,
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
