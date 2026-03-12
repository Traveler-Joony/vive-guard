import * as ts from 'typescript';
import * as path from 'path';
import { parseFile } from '../utils/astParser';
import {
  PatternType,
  PatternVariant,
  PatternInfo,
  PatternConsistencyResult,
} from '../shared/types';

export function checkPatterns(filePaths: string[]): PatternConsistencyResult {
  if (filePaths.length === 0) {
    return { patterns: [], overallConsistency: 0 };
  }

  const sourceFiles = filePaths.map(fp => ({ filePath: fp, source: parseFile(fp) }));

  const patterns: PatternInfo[] = [];
  const errorHandling = analyzeErrorHandling(sourceFiles.map(sf => sf.source));
  if (errorHandling) patterns.push(errorHandling);

  const exportStyle = analyzeExportStyle(sourceFiles.map(sf => sf.source));
  if (exportStyle) patterns.push(exportStyle);

  const fileNaming = analyzeFileNaming(filePaths);
  if (fileNaming) patterns.push(fileNaming);

  const overallConsistency =
    patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.consistency, 0) / patterns.length
      : 0;

  return { patterns, overallConsistency };
}

// --- Error Handling ---

function analyzeErrorHandling(sourceFiles: ts.SourceFile[]): PatternInfo | null {
  const counts = new Map<string, number>();

  for (const sf of sourceFiles) {
    visitAsyncFunctions(sf, sf, counts);
  }

  return buildPatternInfo(PatternType.ErrorHandling, counts);
}

function visitAsyncFunctions(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  counts: Map<string, number>,
): void {
  if (isAsyncFunction(node)) {
    const pattern = classifyErrorPattern(node);
    counts.set(pattern, (counts.get(pattern) ?? 0) + 1);
    // Don't recurse into nested async functions
    return;
  }
  ts.forEachChild(node, child => visitAsyncFunctions(child, sourceFile, counts));
}

function isAsyncFunction(node: ts.Node): boolean {
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isArrowFunction(node) ||
    ts.isFunctionExpression(node) ||
    ts.isMethodDeclaration(node)
  ) {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    return modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false;
  }
  return false;
}

function classifyErrorPattern(node: ts.Node): string {
  let hasTryCatch = false;
  let hasDotCatch = false;

  function visit(n: ts.Node): void {
    // Don't recurse into nested functions
    if (n !== node && (ts.isFunctionDeclaration(n) || ts.isArrowFunction(n) ||
        ts.isFunctionExpression(n) || ts.isMethodDeclaration(n))) {
      return;
    }
    if (ts.isTryStatement(n)) {
      hasTryCatch = true;
    }
    if (
      ts.isCallExpression(n) &&
      ts.isPropertyAccessExpression(n.expression) &&
      n.expression.name.text === 'catch'
    ) {
      hasDotCatch = true;
    }
    ts.forEachChild(n, visit);
  }

  ts.forEachChild(node, visit);

  if (hasTryCatch) return 'try-catch';
  if (hasDotCatch) return '.catch()';
  return 'no-error-handling';
}

// --- Export Style ---

function analyzeExportStyle(sourceFiles: ts.SourceFile[]): PatternInfo | null {
  const counts = new Map<string, number>();

  for (const sf of sourceFiles) {
    ts.forEachChild(sf, node => {
      // export default ...
      if (ts.isExportAssignment(node)) {
        counts.set('default', (counts.get('default') ?? 0) + 1);
        return;
      }

      // export { ... } or export { ... } from '...'
      if (ts.isExportDeclaration(node)) {
        counts.set('named', (counts.get('named') ?? 0) + 1);
        return;
      }

      // Declarations with export modifier (export function, export const, etc.)
      if (ts.canHaveModifiers(node)) {
        const modifiers = ts.getModifiers(node);
        if (modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
          // Check if it also has default keyword
          if (modifiers.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)) {
            counts.set('default', (counts.get('default') ?? 0) + 1);
          } else {
            counts.set('named', (counts.get('named') ?? 0) + 1);
          }
        }
      }
    });
  }

  return buildPatternInfo(PatternType.ExportStyle, counts);
}

// --- File Naming ---

function analyzeFileNaming(filePaths: string[]): PatternInfo | null {
  const counts = new Map<string, number>();

  for (const fp of filePaths) {
    const base = path.basename(fp).replace(/\.[^.]+$/, '');
    if (base === 'index') continue;

    const pattern = classifyNamingPattern(base);
    counts.set(pattern, (counts.get(pattern) ?? 0) + 1);
  }

  return buildPatternInfo(PatternType.FileNaming, counts);
}

function classifyNamingPattern(name: string): string {
  if (/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(name)) return 'kebab-case';
  if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) return 'PascalCase';
  if (/^[a-z][a-zA-Z0-9]*$/.test(name)) return 'camelCase';
  return 'unknown';
}

// --- Shared Utilities ---

function buildPatternInfo(
  type: PatternType,
  counts: Map<string, number>,
): PatternInfo | null {
  if (counts.size === 0) return null;

  const variants: PatternVariant[] = [];
  let total = 0;
  let dominantPattern = '';
  let dominantCount = 0;

  for (const [pattern, count] of counts) {
    variants.push({ pattern, count });
    total += count;
    if (count > dominantCount) {
      dominantCount = count;
      dominantPattern = pattern;
    }
  }

  return {
    type,
    dominant: dominantPattern,
    consistency: dominantCount / total,
    variants,
  };
}
