import * as vscode from 'vscode';
import { AnalysisResult, FunctionComplexity } from '../shared/types';

export class VibeGuardCodeLensProvider implements vscode.CodeLensProvider {
  private readonly _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  private fileComplexityMap = new Map<string, FunctionComplexity[]>();

  refresh(result: AnalysisResult): void {
    for (const file of result.files) {
      this.fileComplexityMap.set(file.filePath, file.functions);
    }
    this._onDidChangeCodeLenses.fire();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const functions = this.fileComplexityMap.get(document.uri.fsPath);
    if (!functions) {
      return [];
    }

    return functions.map((fn) => {
      const line = Math.max(fn.startLine - 1, 0);
      const range = new vscode.Range(line, 0, line, 0);
      const icon =
        fn.complexity <= 10 ? '✅' : fn.complexity <= 20 ? '⚠️' : '🔴';

      return new vscode.CodeLens(range, {
        title: `Complexity: ${fn.complexity} ${icon}`,
        command: 'editor.action.goToLocations',
        arguments: [
          document.uri,
          new vscode.Position(line, 0),
          [],
          'goto',
          '',
        ],
      });
    });
  }

  dispose(): void {
    this._onDidChangeCodeLenses.dispose();
  }
}
