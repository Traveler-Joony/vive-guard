import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { parseFile } from '../utils/astParser';
import {
  DependencyGraph,
  DependencyNode,
  DependencyEdge,
  CyclicDependency,
} from '../shared/types';

export function mapDependencies(filePaths: string[]): DependencyGraph {
  const absolutePaths = filePaths.map(f => path.resolve(f));
  const fileSet = new Set(absolutePaths);

  // Collect raw edges
  const edges: DependencyEdge[] = [];
  for (const filePath of absolutePaths) {
    const sourceFile = parseFile(filePath);
    const specifiers = extractImports(sourceFile);

    for (const specifier of specifiers) {
      if (!isRelativeImport(specifier)) {
        continue;
      }
      const resolved = resolveRelativeImport(filePath, specifier);
      if (resolved && fileSet.has(resolved)) {
        edges.push({ from: filePath, to: resolved });
      }
    }
  }

  // Build nodes with degree counts
  const inDegreeMap = new Map<string, number>();
  const outDegreeMap = new Map<string, number>();
  for (const fp of absolutePaths) {
    inDegreeMap.set(fp, 0);
    outDegreeMap.set(fp, 0);
  }
  for (const edge of edges) {
    outDegreeMap.set(edge.from, (outDegreeMap.get(edge.from) ?? 0) + 1);
    inDegreeMap.set(edge.to, (inDegreeMap.get(edge.to) ?? 0) + 1);
  }

  const nodes: DependencyNode[] = absolutePaths.map(fp => ({
    filePath: fp,
    inDegree: inDegreeMap.get(fp) ?? 0,
    outDegree: outDegreeMap.get(fp) ?? 0,
  }));

  const cycles = detectCycles(absolutePaths, edges);

  const nodeCount = nodes.length;
  const couplingIndex =
    nodeCount <= 1 ? 0 : edges.length / (nodeCount * (nodeCount - 1));

  return { nodes, edges, cycles, couplingIndex };
}

function extractImports(sourceFile: ts.SourceFile): string[] {
  const specifiers: string[] = [];

  function visit(node: ts.Node): void {
    // import ... from 'specifier'
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      specifiers.push(node.moduleSpecifier.text);
    }

    // export ... from 'specifier'
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      specifiers.push(node.moduleSpecifier.text);
    }

    // require('specifier')
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'require' &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specifiers;
}

function isRelativeImport(specifier: string): boolean {
  return specifier.startsWith('./') || specifier.startsWith('../');
}

function resolveRelativeImport(
  fromFile: string,
  specifier: string,
): string | null {
  const dir = path.dirname(fromFile);
  const base = path.resolve(dir, specifier);

  // Try exact path, then with extensions, then as directory index
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function detectCycles(
  filePaths: string[],
  edges: DependencyEdge[],
): CyclicDependency[] {
  // Build adjacency list
  const adj = new Map<string, string[]>();
  for (const fp of filePaths) {
    adj.set(fp, []);
  }
  for (const edge of edges) {
    adj.get(edge.from)!.push(edge.to);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();
  const cycles: CyclicDependency[] = [];

  function dfs(node: string, stack: string[]): void {
    visited.add(node);
    inStack.add(node);
    stack.push(node);

    for (const neighbor of adj.get(node) ?? []) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, stack);
      } else if (inStack.has(neighbor)) {
        // Found a cycle: extract from the cycle start to current
        const cycleStart = stack.indexOf(neighbor);
        const cycleFiles = stack.slice(cycleStart);
        cycles.push({ files: cycleFiles });
      }
    }

    stack.pop();
    inStack.delete(node);
  }

  for (const fp of filePaths) {
    if (!visited.has(fp)) {
      dfs(fp, []);
    }
  }

  return cycles;
}
