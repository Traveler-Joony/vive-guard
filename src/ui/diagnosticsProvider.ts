import * as vscode from 'vscode';
import { t } from '../config/i18n';
import { AnalysisResult } from '../shared/types';

export class DiagnosticsProvider {
  private readonly diagnosticCollection: vscode.DiagnosticCollection;

  constructor() {
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection('vibeGuard');
  }

  refresh(result: AnalysisResult): void {
    this.diagnosticCollection.clear();

    for (const file of result.files) {
      const uri = vscode.Uri.file(file.filePath);
      const diagnostics: vscode.Diagnostic[] = [];

      for (const fn of file.functions) {
        if (fn.complexity <= 10) {
          continue;
        }

        const startLine = Math.max(fn.startLine - 1, 0);
        const endLine = Math.max(fn.endLine - 1, 0);
        const range = new vscode.Range(
          startLine,
          0,
          endLine,
          Number.MAX_SAFE_INTEGER,
        );

        const severity =
          fn.complexity <= 20
            ? vscode.DiagnosticSeverity.Warning
            : vscode.DiagnosticSeverity.Error;

        const threshold = fn.complexity <= 20 ? 10 : 20;
        const msgKey = fn.complexity <= 20 ? 'diagnostics.complexity' : 'diagnostics.highComplexity';
        const message = t(msgKey, { name: fn.name, value: String(fn.complexity), threshold: String(threshold) });

        const diagnostic = new vscode.Diagnostic(range, message, severity);
        diagnostic.source = 'VibeGuard';
        diagnostics.push(diagnostic);
      }

      if (diagnostics.length > 0) {
        this.diagnosticCollection.set(uri, diagnostics);
      }
    }
  }

  dispose(): void {
    this.diagnosticCollection.dispose();
  }
}
