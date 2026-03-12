import { strict as assert } from 'assert';
import * as path from 'path';
import { mapDependencies } from '../../src/analyzer/dependencyMapper';
import { DependencyGraph } from '../../src/shared/types';

const fixture = (name: string) => path.join(__dirname, '../fixtures/deps', name);

describe('dependencyMapper', () => {
  describe('linear chain (a → b → c)', () => {
    let result: DependencyGraph;

    before(() => {
      result = mapDependencies([
        fixture('a.ts'),
        fixture('b.ts'),
        fixture('c.ts'),
      ]);
    });

    it('should have 3 nodes', () => {
      assert.equal(result.nodes.length, 3);
    });

    it('should have 2 edges', () => {
      assert.equal(result.edges.length, 2);
    });

    it('should have edge from a to b', () => {
      const edge = result.edges.find(
        e => e.from.endsWith('a.ts') && e.to.endsWith('b.ts'),
      );
      assert.ok(edge, 'expected edge a → b');
    });

    it('should have edge from b to c', () => {
      const edge = result.edges.find(
        e => e.from.endsWith('b.ts') && e.to.endsWith('c.ts'),
      );
      assert.ok(edge, 'expected edge b → c');
    });

    it('should have correct out-degrees', () => {
      const nodeA = result.nodes.find(n => n.filePath.endsWith('a.ts'))!;
      const nodeB = result.nodes.find(n => n.filePath.endsWith('b.ts'))!;
      const nodeC = result.nodes.find(n => n.filePath.endsWith('c.ts'))!;
      assert.equal(nodeA.outDegree, 1);
      assert.equal(nodeB.outDegree, 1);
      assert.equal(nodeC.outDegree, 0);
    });

    it('should have correct in-degrees', () => {
      const nodeA = result.nodes.find(n => n.filePath.endsWith('a.ts'))!;
      const nodeB = result.nodes.find(n => n.filePath.endsWith('b.ts'))!;
      const nodeC = result.nodes.find(n => n.filePath.endsWith('c.ts'))!;
      assert.equal(nodeA.inDegree, 0);
      assert.equal(nodeB.inDegree, 1);
      assert.equal(nodeC.inDegree, 1);
    });

    it('should detect no cycles', () => {
      assert.equal(result.cycles.length, 0);
    });
  });

  describe('circular dependency (x ↔ y)', () => {
    let result: DependencyGraph;

    before(() => {
      result = mapDependencies([
        fixture('circular-x.ts'),
        fixture('circular-y.ts'),
      ]);
    });

    it('should have 2 edges', () => {
      assert.equal(result.edges.length, 2);
    });

    it('should detect at least one cycle', () => {
      assert.ok(result.cycles.length >= 1, 'expected at least one cycle');
    });

    it('should include both files in the cycle', () => {
      const allCycleFiles = result.cycles.flatMap(c => c.files);
      const hasX = allCycleFiles.some(f => f.endsWith('circular-x.ts'));
      const hasY = allCycleFiles.some(f => f.endsWith('circular-y.ts'));
      assert.ok(hasX, 'cycle should include circular-x.ts');
      assert.ok(hasY, 'cycle should include circular-y.ts');
    });
  });

  describe('standalone file', () => {
    let result: DependencyGraph;

    before(() => {
      result = mapDependencies([fixture('standalone.ts')]);
    });

    it('should have 1 node', () => {
      assert.equal(result.nodes.length, 1);
    });

    it('should have 0 edges', () => {
      assert.equal(result.edges.length, 0);
    });

    it('should have in-degree and out-degree of 0', () => {
      const node = result.nodes[0];
      assert.equal(node.inDegree, 0);
      assert.equal(node.outDegree, 0);
    });

    it('should have coupling index of 0', () => {
      assert.equal(result.couplingIndex, 0);
    });

    it('should have no cycles', () => {
      assert.equal(result.cycles.length, 0);
    });
  });

  describe('coupling index', () => {
    it('should be between 0 and 1 for a linear chain', () => {
      const result = mapDependencies([
        fixture('a.ts'),
        fixture('b.ts'),
        fixture('c.ts'),
      ]);
      assert.ok(result.couplingIndex >= 0, 'coupling index should be >= 0');
      assert.ok(result.couplingIndex <= 1, 'coupling index should be <= 1');
      // 2 edges / (3 * 2) = 1/3
      const expected = 2 / (3 * 2);
      assert.ok(
        Math.abs(result.couplingIndex - expected) < 0.001,
        `expected ~${expected}, got ${result.couplingIndex}`,
      );
    });
  });

  describe('node_modules imports are ignored', () => {
    it('should not create edges for non-relative imports', () => {
      // a.ts imports from './b' (relative) — only that counts
      // Even if a file had `import x from 'lodash'`, it would be ignored
      const result = mapDependencies([fixture('a.ts'), fixture('b.ts')]);
      assert.equal(result.edges.length, 1);
      assert.ok(result.edges[0].from.endsWith('a.ts'));
      assert.ok(result.edges[0].to.endsWith('b.ts'));
    });
  });
});
