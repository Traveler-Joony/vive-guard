import * as ts from 'typescript';
import { parseFile } from '../utils/astParser';
import { FileComplexity, FunctionComplexity } from '../shared/types';

export function analyzeComplexity(filePaths: string[]): FileComplexity[] {
  return filePaths.map(analyzeFile);
}

function analyzeFile(filePath: string): FileComplexity {
  const sourceFile = parseFile(filePath);
  const functions: FunctionComplexity[] = [];

  visitNode(sourceFile, sourceFile, functions);

  const average = functions.length > 0
    ? functions.reduce((sum, f) => sum + f.complexity, 0) / functions.length
    : 0;
  const max = functions.length > 0
    ? Math.max(...functions.map(f => f.complexity))
    : 0;

  return { filePath, functions, average, max };
}

function visitNode(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  functions: FunctionComplexity[],
): void {
  if (isFunctionNode(node)) {
    const name = getFunctionName(node);
    const complexity = calculateComplexity(node);
    const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
    const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;

    functions.push({ name, startLine, endLine, complexity });
  }

  ts.forEachChild(node, child => visitNode(child, sourceFile, functions));
}

function isFunctionNode(node: ts.Node): boolean {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isArrowFunction(node) ||
    ts.isFunctionExpression(node)
  );
}

function getFunctionName(node: ts.Node): string {
  if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
    return node.name?.getText() ?? '<anonymous>';
  }

  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    const parent = node.parent;
    if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
      return parent.name.text;
    }
    if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
      return parent.name.text;
    }
  }

  return '<anonymous>';
}

function calculateComplexity(node: ts.Node): number {
  let complexity = 1;

  function walk(child: ts.Node): void {
    switch (child.kind) {
      case ts.SyntaxKind.IfStatement:
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.ForOfStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.DoStatement:
      case ts.SyntaxKind.CatchClause:
      case ts.SyntaxKind.ConditionalExpression:
      case ts.SyntaxKind.CaseClause:
        complexity++;
        break;
      case ts.SyntaxKind.BinaryExpression: {
        const op = (child as ts.BinaryExpression).operatorToken.kind;
        if (
          op === ts.SyntaxKind.AmpersandAmpersandToken ||
          op === ts.SyntaxKind.BarBarToken
        ) {
          complexity++;
        }
        break;
      }
    }

    // Don't recurse into nested functions
    if (isFunctionNode(child) && child !== node) {
      return;
    }

    ts.forEachChild(child, walk);
  }

  ts.forEachChild(node, walk);
  return complexity;
}
