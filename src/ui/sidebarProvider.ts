import * as vscode from 'vscode';
import type { AnalysisResult } from '../shared/types';
import type { Message } from '../shared/messages';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'vibeGuard.dashboard';

  private _view?: vscode.WebviewView;
  private _pendingResult?: AnalysisResult;

  constructor(private readonly _extensionUri: vscode.Uri) {}

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

    webviewView.webview.onDidReceiveMessage((message: Message) => {
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
      }
    });

    // If analysis completed before the webview was ready, send it now
    if (this._pendingResult) {
      this.update(this._pendingResult);
      this._pendingResult = undefined;
    }
  }

  public update(result: AnalysisResult): void {
    if (!this._view) {
      this._pendingResult = result;
      return;
    }

    this._view.webview.postMessage({
      type: 'UPDATE_HEALTH',
      payload: result.health,
    });

    this._view.webview.postMessage({
      type: 'UPDATE_FILES',
      payload: result.files,
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'webview', 'style.css'),
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'webview', 'main.js'),
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
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

    <section class="metrics-grid">
      <div class="metric-card" id="metric-complexity">
        <div class="metric-icon">\u26A1</div>
        <div class="metric-info">
          <div class="metric-title">Complexity</div>
          <div class="metric-value">--</div>
          <div class="metric-detail"></div>
        </div>
      </div>
      <div class="metric-card" id="metric-duplication">
        <div class="metric-icon">\uD83D\uDCCB</div>
        <div class="metric-info">
          <div class="metric-title">Duplication</div>
          <div class="metric-value">--</div>
          <div class="metric-detail"></div>
        </div>
      </div>
      <div class="metric-card" id="metric-patterns">
        <div class="metric-icon">\uD83D\uDCD0</div>
        <div class="metric-info">
          <div class="metric-title">Patterns</div>
          <div class="metric-value">--</div>
          <div class="metric-detail"></div>
        </div>
      </div>
      <div class="metric-card" id="metric-dependencies">
        <div class="metric-icon">\uD83D\uDD17</div>
        <div class="metric-info">
          <div class="metric-title">Dependencies</div>
          <div class="metric-value">--</div>
          <div class="metric-detail"></div>
        </div>
      </div>
    </section>

    <section class="warnings-section">
      <h3>Warnings</h3>
      <ul class="warnings-list"></ul>
    </section>

    <section class="files-section">
      <h3>Files by Complexity</h3>
      <ul class="files-list"></ul>
    </section>

    <button class="refresh-btn" id="refresh-btn">Refresh Analysis</button>
  </div>
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
