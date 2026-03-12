import * as vscode from 'vscode';
import type { AnalysisResult, HealthGrade, HealthScore } from '../shared/types';

export class NotificationManager implements vscode.Disposable {
  private _lastGrade: HealthGrade | undefined;
  private _lastScore: number | undefined;

  constructor(private readonly _workspaceState: vscode.Memento) {
    const persisted = _workspaceState.get<HealthScore>('vibeGuard.lastHealthScore');
    this._lastScore = persisted?.score;
  }

  public refresh(result: AnalysisResult): void {
    const { grade, score } = result.health;

    // Save point recommendation: score worsened by 10+
    if (this._lastScore !== undefined) {
      const delta = score - this._lastScore;
      if (delta >= 10) {
        vscode.window.showWarningMessage(
          'VibeGuard: Your project complexity increased significantly. Consider committing your current working state before making more changes.',
          'Got it',
        );
      }
    }
    this._lastScore = score;

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
