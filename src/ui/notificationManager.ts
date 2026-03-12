import * as vscode from 'vscode';
import type { AnalysisResult, HealthGrade } from '../shared/types';

export class NotificationManager implements vscode.Disposable {
  private _lastGrade: HealthGrade | undefined;

  public refresh(result: AnalysisResult): void {
    const { grade, score } = result.health;

    // Suppress duplicate notifications for the same grade
    if (grade === this._lastGrade) {
      return;
    }
    this._lastGrade = grade;

    // A and B are healthy — no notification needed
    if (score <= 40) {
      return;
    }

    const message = `VibeGuard: Code health dropped to grade ${grade} (${score.toFixed(1)}/100).`;
    const showFn =
      score > 60
        ? vscode.window.showErrorMessage
        : vscode.window.showWarningMessage;

    showFn(message, 'Show Dashboard', 'Dismiss').then((action) => {
      if (action === 'Show Dashboard') {
        vscode.commands.executeCommand('vibeGuard.dashboard.focus');
      }
    });
  }

  public dispose(): void {
    // No resources to release
  }
}
