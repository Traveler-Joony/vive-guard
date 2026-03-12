// ── Complexity ──

export interface FunctionComplexity {
  name: string;
  startLine: number;
  endLine: number;
  complexity: number;
}

export interface FileComplexity {
  filePath: string;
  functions: FunctionComplexity[];
  average: number;
  max: number;
}

// ── Duplication ──

export interface DuplicateBlock {
  sourceFile: string;
  sourceLine: number;
  targetFile: string;
  targetLine: number;
  tokenCount: number;
}

export interface DuplicationResult {
  duplicationRate: number;
  totalTokens: number;
  duplicatedTokens: number;
  blocks: DuplicateBlock[];
}

// ── Pattern Consistency ──

export enum PatternType {
  ErrorHandling = 'ErrorHandling',
  ExportStyle = 'ExportStyle',
  FileNaming = 'FileNaming',
}

export interface PatternVariant {
  pattern: string;
  count: number;
}

export interface PatternInfo {
  type: PatternType;
  dominant: string;
  consistency: number;
  variants: PatternVariant[];
}

export interface PatternConsistencyResult {
  patterns: PatternInfo[];
  overallConsistency: number;
}

// ── Dependencies ──

export interface DependencyNode {
  filePath: string;
  inDegree: number;
  outDegree: number;
}

export interface DependencyEdge {
  from: string;
  to: string;
}

export interface CyclicDependency {
  files: string[];
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  cycles: CyclicDependency[];
  couplingIndex: number;
}

// ── Health Score ──

export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface HealthScore {
  score: number;
  grade: HealthGrade;
  complexity: FileComplexity[];
  duplication: DuplicationResult;
  patterns: PatternConsistencyResult;
  dependencies: DependencyGraph;
  warnings: string[];
}

// ── Analysis Result ──

export interface AnalysisResult {
  health: HealthScore;
  files: FileComplexity[];
  duplication: DuplicationResult;
  patterns: PatternConsistencyResult;
  dependencies: DependencyGraph;
  timestamp: number;
}
