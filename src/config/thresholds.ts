import * as vscode from 'vscode';

export interface ThresholdConfig {
  maxComplexity: number;
  maxDuplicationRate: number;
  maxCouplingIndex: number;
  minPatternConsistency: number;
}

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  maxComplexity: 15,
  maxDuplicationRate: 0.1,
  maxCouplingIndex: 0.3,
  minPatternConsistency: 0.7,
};

export function getThresholds(): ThresholdConfig {
  const config = vscode.workspace.getConfiguration('vibeGuard');

  return {
    maxComplexity: config.get<number>('maxComplexity', DEFAULT_THRESHOLDS.maxComplexity),
    maxDuplicationRate: config.get<number>('maxDuplicationRate', DEFAULT_THRESHOLDS.maxDuplicationRate),
    maxCouplingIndex: config.get<number>('maxCouplingIndex', DEFAULT_THRESHOLDS.maxCouplingIndex),
    minPatternConsistency: config.get<number>('minPatternConsistency', DEFAULT_THRESHOLDS.minPatternConsistency),
  };
}
