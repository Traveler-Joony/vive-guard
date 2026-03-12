import type { FileComplexity, HealthScore } from './types';

// Extension → Webview
export interface UpdateHealthMessage {
  type: 'UPDATE_HEALTH';
  payload: HealthScore;
}

export interface UpdateFilesMessage {
  type: 'UPDATE_FILES';
  payload: FileComplexity[];
}

// Webview → Extension
export interface RequestRefreshMessage {
  type: 'REQUEST_REFRESH';
}

export interface OpenFileMessage {
  type: 'OPEN_FILE';
  payload: { path: string };
}

// Bidirectional
export interface GetSettingsMessage {
  type: 'GET_SETTINGS';
}

export interface UpdateSettingsMessage {
  type: 'UPDATE_SETTINGS';
  payload: Record<string, unknown>;
}

export type Message =
  | UpdateHealthMessage
  | UpdateFilesMessage
  | RequestRefreshMessage
  | OpenFileMessage
  | GetSettingsMessage
  | UpdateSettingsMessage;
