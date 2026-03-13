import { analyzeComplexity } from './complexityAnalyzer';
import { detectDuplication } from './duplicationDetector';
import { checkPatterns } from './patternChecker';
import { mapDependencies } from './dependencyMapper';
import {
  FileComplexity,
  DuplicationResult,
  PatternConsistencyResult,
  DependencyGraph,
  HealthGrade,
  AnalysisResult,
} from '../shared/types';

const WEIGHTS = {
  complexity: 0.35,
  duplication: 0.25,
  patterns: 0.20,
  dependencies: 0.20,
};

export function complexityToScore(files: FileComplexity[]): number {
  if (files.length === 0) return 0;

  const totalAvg =
    files.reduce((sum, f) => sum + f.average, 0) / files.length;

  // Linear interpolation across 5 bands:
  // 1-5 → 0-20, 6-10 → 20-40, 11-15 → 40-60, 16-20 → 60-80, 21+ → 80-100
  if (totalAvg <= 0) return 0;
  if (totalAvg <= 5) return (totalAvg / 5) * 20;
  if (totalAvg <= 10) return 20 + ((totalAvg - 5) / 5) * 20;
  if (totalAvg <= 15) return 40 + ((totalAvg - 10) / 5) * 20;
  if (totalAvg <= 20) return 60 + ((totalAvg - 15) / 5) * 20;
  return Math.min(80 + ((totalAvg - 20) / 5) * 20, 100);
}

function duplicationToScore(result: DuplicationResult): number {
  return Math.min(result.duplicationRate * 100, 100);
}

function patternToScore(result: PatternConsistencyResult): number {
  return (1 - result.overallConsistency) * 100;
}

function dependencyToScore(graph: DependencyGraph): number {
  let score = graph.couplingIndex * 100;
  if (graph.cycles.length > 0) score += 20;
  return Math.min(score, 100);
}

export function getGrade(score: number): HealthGrade {
  if (score <= 20) return 'A';
  if (score <= 40) return 'B';
  if (score <= 60) return 'C';
  if (score <= 80) return 'D';
  return 'F';
}

type TranslateFn = (key: string, vars?: Record<string, string>) => string;

const defaultT: TranslateFn = (key, vars) => {
  const defaults: Record<string, string> = {
    'warning.highComplexity': '"{name}" has high complexity and may be hard to maintain.',
    'warning.duplicated': 'About {rate}% of the code appears to be duplicated. Consider reusing shared logic.',
    'warning.inconsistentPatterns': 'Coding styles are inconsistent across files. Aligning on a single style improves readability.',
    'warning.circular': 'Some files depend on each other in a circular way, which can cause unexpected issues.',
  };
  let text = defaults[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return text;
};

interface WarningsResult {
  warnings: string[];
  warningKeys: string[];
}

function generateWarnings(
  complexityScore: number,
  files: FileComplexity[],
  duplication: DuplicationResult,
  patternScore: number,
  dependencies: DependencyGraph,
  t: TranslateFn = defaultT,
): WarningsResult {
  const warnings: string[] = [];
  const warningKeys: string[] = [];

  // High complexity — top 3 files
  if (complexityScore > 40) {
    const sorted = [...files].sort((a, b) => b.average - a.average);
    const top = sorted.slice(0, 3);
    for (const f of top) {
      const name = f.filePath.split('/').pop() ?? f.filePath;
      warnings.push(t('warning.highComplexity', { name }));
      warningKeys.push('warning.highComplexity');
    }
  }

  // High duplication
  if (duplication.duplicationRate > 0.1) {
    const pct = String(Math.round(duplication.duplicationRate * 100));
    warnings.push(t('warning.duplicated', { rate: pct }));
    warningKeys.push('warning.duplicated');
  }

  // Pattern inconsistency
  if (patternScore > 40) {
    warnings.push(t('warning.inconsistentPatterns'));
    warningKeys.push('warning.inconsistentPatterns');
  }

  // Circular dependencies
  if (dependencies.cycles.length > 0) {
    warnings.push(t('warning.circular'));
    warningKeys.push('warning.circular');
  }

  return { warnings, warningKeys };
}

export function calculateHealth(filePaths: string[], t?: TranslateFn): AnalysisResult {
  const complexity = analyzeComplexity(filePaths);
  const duplication = detectDuplication(filePaths);
  const patterns = checkPatterns(filePaths);
  const dependencies = mapDependencies(filePaths);

  const cScore = complexityToScore(complexity);
  const dScore = duplicationToScore(duplication);
  const pScore = patternToScore(patterns);
  const depScore = dependencyToScore(dependencies);

  const score =
    cScore * WEIGHTS.complexity +
    dScore * WEIGHTS.duplication +
    pScore * WEIGHTS.patterns +
    depScore * WEIGHTS.dependencies;

  const grade = getGrade(score);
  const { warnings, warningKeys } = generateWarnings(
    cScore,
    complexity,
    duplication,
    pScore,
    dependencies,
    t,
  );

  return {
    health: {
      score,
      grade,
      complexity,
      duplication,
      patterns,
      dependencies,
      warnings,
      warningKeys,
    },
    files: complexity,
    duplication,
    patterns,
    dependencies,
    timestamp: Date.now(),
  };
}
