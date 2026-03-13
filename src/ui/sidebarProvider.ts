import * as vscode from 'vscode';
import type { AnalysisResult, HealthScore } from '../shared/types';
import type { Message } from '../shared/messages';
import { t, setLanguage, getTranslationsForWebview, getStoredLanguagePref } from '../config/i18n';

interface MetricTrend {
  direction: 'up' | 'down' | 'stable';
  delta: number;
}

interface TrendsData {
  score: MetricTrend;
  complexity: MetricTrend;
  duplication: MetricTrend;
  patterns: MetricTrend;
  dependencies: MetricTrend;
}

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'vibeGuard.dashboard';

  private _view?: vscode.WebviewView;
  private _pendingResult?: AnalysisResult;
  private _pendingTrends?: TrendsData;
  private _previousHealth: HealthScore | undefined;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _workspaceState: vscode.Memento,
  ) {
    this._previousHealth = _workspaceState.get<HealthScore>('vibeGuard.lastHealthScore');
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'webview'),
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message: Message & { type: string; payload?: any }) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      switch (message.type) {
        case 'REQUEST_REFRESH':
          vscode.commands.executeCommand('vibeGuard.refresh');
          break;
        case 'OPEN_FILE': {
          const filePath = message.payload.path;
          const uri = vscode.Uri.file(filePath);
          vscode.workspace.openTextDocument(uri).then((doc) => {
            vscode.window.showTextDocument(doc);
          });
          break;
        }
        case 'CHANGE_LANGUAGE': {
          setLanguage(message.payload.language, this._workspaceState);
          webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
          vscode.commands.executeCommand('vibeGuard.refresh');
          break;
        }
      }
    });

    // If analysis completed before the webview was ready, send it now
    if (this._pendingResult) {
      this._postHealth(this._pendingResult, this._pendingTrends);
      this._postFiles(this._pendingResult);
      this._pendingResult = undefined;
      this._pendingTrends = undefined;
    }
  }

  public update(result: AnalysisResult): void {
    const trends = this._computeTrends(result.health);

    if (!this._view) {
      this._pendingResult = result;
      this._pendingTrends = trends;
      return;
    }

    this._postHealth(result, trends);
    this._postFiles(result);

    this._previousHealth = result.health;
  }

  private _postHealth(result: AnalysisResult, trends?: TrendsData): void {
    const history = this._workspaceState.get<Array<{ score: number; grade: string; timestamp: number }>>('vibeGuard.scoreHistory', []);
    this._view!.webview.postMessage({
      type: 'UPDATE_HEALTH',
      payload: { ...result.health, trends, history, translations: getTranslationsForWebview() },
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  private _postFiles(result: AnalysisResult): void {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
    this._view!.webview.postMessage({
      type: 'UPDATE_FILES',
      payload: { files: result.files, workspaceRoot },
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  private _computeTrends(current: HealthScore): TrendsData | undefined {
    if (!this._previousHealth) {
      return undefined;
    }
    const prev = this._previousHealth;

    const avgComplexity = (files: { average: number }[]) =>
      files.length > 0
        ? files.reduce((s, f) => s + f.average, 0) / files.length
        : 0;

    const complexityDelta =
      (avgComplexity(current.complexity) - avgComplexity(prev.complexity)) * 5;
    const duplicationDelta =
      (current.duplication.duplicationRate - prev.duplication.duplicationRate) * 100;
    const patternsDelta =
      (prev.patterns.overallConsistency - current.patterns.overallConsistency) * 100;
    const depsDelta =
      (current.dependencies.couplingIndex - prev.dependencies.couplingIndex) * 100;

    return {
      score: this._toTrend(current.score - prev.score),
      complexity: this._toTrend(complexityDelta),
      duplication: this._toTrend(duplicationDelta),
      patterns: this._toTrend(patternsDelta),
      dependencies: this._toTrend(depsDelta),
    };
  }

  private _toTrend(delta: number): MetricTrend {
    const direction = delta >= 5 ? 'up' : delta <= -5 ? 'down' : 'stable';
    return { direction, delta };
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'webview', 'style.css'),
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'webview', 'main.js'),
    );
    const iconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'webview', 'icons'),
    );
    const nonce = getNonce();
    const langPref = getStoredLanguagePref(this._workspaceState);

    const langOptions = [
      { value: 'auto', label: 'Auto' },
      { value: 'en', label: 'English' },
      { value: 'ko', label: '\uD55C\uAD6D\uC5B4' },
      { value: 'ja', label: '\u65E5\u672C\u8A9E' },
      { value: 'zh-cn', label: '\u7B80\u4F53\u4E2D\u6587' },
      { value: 'zh-tw', label: '\u7E41\u9AD4\u4E2D\u6587' },
      { value: 'de', label: 'Deutsch' },
      { value: 'fr', label: 'Fran\u00E7ais' },
      { value: 'es', label: 'Espa\u00F1ol' },
      { value: 'pt', label: 'Portugu\u00EAs' },
      { value: 'ru', label: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439' },
    ];
    const optionsHtml = langOptions.map((o) =>
      `<option value="${o.value}"${o.value === langPref ? ' selected' : ''}>${o.label}</option>`,
    ).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}'; img-src ${webview.cspSource};">
  <link href="${styleUri}" rel="stylesheet">
  <title>VibeGuard Dashboard</title>
</head>
<body>
  <div class="dashboard">
    <section class="gauge-container">
      <svg class="gauge" viewBox="0 0 120 120">
        <circle class="gauge-bg" cx="60" cy="60" r="52" />
        <circle class="gauge-fill" cx="60" cy="60" r="52" />
      </svg>
      <div class="gauge-label">
        <span class="grade">-</span>
        <span class="score">--</span>
      </div>
    </section>

    <section id="history-chart"></section>

    <section class="metrics-grid">
      <div class="metric-card" id="metric-complexity">
        <div class="metric-info">
          <div class="metric-title">${t('dashboard.complexity')}</div>
          <div class="metric-value">--</div>
          <div class="metric-detail"></div>
        </div>
      </div>
      <div class="metric-card" id="metric-duplication">
        <div class="metric-info">
          <div class="metric-title">${t('dashboard.duplication')}</div>
          <div class="metric-value">--</div>
          <div class="metric-detail"></div>
        </div>
      </div>
      <div class="metric-card" id="metric-patterns">
        <div class="metric-info">
          <div class="metric-title">${t('dashboard.patterns')}</div>
          <div class="metric-value">--</div>
          <div class="metric-detail"></div>
        </div>
      </div>
      <div class="metric-card" id="metric-dependencies">
        <div class="metric-info">
          <div class="metric-title">${t('dashboard.dependencies')}</div>
          <div class="metric-value">--</div>
          <div class="metric-detail"></div>
        </div>
      </div>
    </section>

    <section class="warnings-section">
      <h3>${t('dashboard.warnings')}</h3>
      <ul class="warnings-list"></ul>
    </section>

    <section class="files-section">
      <h3>${t('dashboard.highComplexity')}</h3>
      <ul class="high-complexity-list"></ul>
    </section>

    <section class="files-section">
      <h3>${t('dashboard.projectFiles')}</h3>
      <div class="file-tree"></div>
    </section>

    <button class="refresh-btn" id="refresh-btn">${t('dashboard.refreshAnalysis')}</button>

    <div class="language-selector">
      <label>${t('dashboard.language')}</label>
      <select id="language-select">${optionsHtml}</select>
    </div>
  </div>
  <script nonce="${nonce}">window.iconsBaseUri = "${iconsUri}";</script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
