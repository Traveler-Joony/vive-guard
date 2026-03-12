import * as vscode from 'vscode';
import { calculateHealth } from '../analyzer/healthScorer';
import { AnalysisResult } from '../shared/types';

const DEBOUNCE_MS = 500;
const FILE_GLOB = '**/*.{ts,tsx,js,jsx}';
const EXCLUDE_GLOB = '**/node_modules/**';

export class FileWatcher implements vscode.Disposable {
  private readonly _watcher: vscode.FileSystemWatcher;
  private readonly _disposables: vscode.Disposable[] = [];
  private _debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private _callback: ((result: AnalysisResult) => void) | undefined;

  constructor() {
    this._watcher = vscode.workspace.createFileSystemWatcher(FILE_GLOB);

    this._watcher.onDidChange(() => this._scheduleAnalysis(), undefined, this._disposables);
    this._watcher.onDidCreate(() => this._scheduleAnalysis(), undefined, this._disposables);
    this._watcher.onDidDelete(() => this._scheduleAnalysis(), undefined, this._disposables);

    this._disposables.push(this._watcher);
  }

  onAnalysisComplete(callback: (result: AnalysisResult) => void): void {
    this._callback = callback;
  }

  async analyzeWorkspace(): Promise<void> {
    const uris = await vscode.workspace.findFiles(FILE_GLOB, EXCLUDE_GLOB);
    const filePaths = uris.map((uri) => uri.fsPath);

    if (filePaths.length === 0) {
      return;
    }

    const result = calculateHealth(filePaths);
    this._callback?.(result);
  }

  private _scheduleAnalysis(): void {
    if (this._debounceTimer !== undefined) {
      clearTimeout(this._debounceTimer);
    }

    this._debounceTimer = setTimeout(() => {
      this._debounceTimer = undefined;
      this.analyzeWorkspace();
    }, DEBOUNCE_MS);
  }

  dispose(): void {
    if (this._debounceTimer !== undefined) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = undefined;
    }

    for (const d of this._disposables) {
      d.dispose();
    }
  }
}
