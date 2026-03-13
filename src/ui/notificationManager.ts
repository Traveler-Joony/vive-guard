import * as vscode from 'vscode';
import { t } from '../config/i18n';
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
          t('notification.complexityIncreased'),
          t('notification.gotIt'),
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

    const message = t('notification.healthDropped', { grade, score: score.toFixed(1) });
    const showDashboard = t('notification.showDashboard');
    const dismiss = t('notification.dismiss');
    const showFn =
      score > 60
        ? vscode.window.showErrorMessage
        : vscode.window.showWarningMessage;

    showFn(message, showDashboard, dismiss).then((action) => {
      if (action === showDashboard) {
        vscode.commands.executeCommand('vibeGuard.dashboard.focus');
      }
    });
  }

  public dispose(): void {
    // No resources to release
  }
}
