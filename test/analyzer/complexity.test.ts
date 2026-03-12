import { strict as assert } from 'assert';
import * as path from 'path';
import { analyzeComplexity } from '../../src/analyzer/complexityAnalyzer';
import { FileComplexity } from '../../src/shared/types';

const fixture = (name: string) => path.join(__dirname, '../fixtures', name);

describe('complexityAnalyzer', () => {
  describe('simple.ts', () => {
    let result: FileComplexity;

    before(() => {
      [result] = analyzeComplexity([fixture('simple.ts')]);
    });

    it('should detect all 4 functions', () => {
      assert.equal(result.functions.length, 4);
    });

    it('should have all complexities in 1-3 range', () => {
      for (const fn of result.functions) {
        assert.ok(fn.complexity >= 1 && fn.complexity <= 3,
          `${fn.name}: complexity ${fn.complexity} not in [1,3]`);
      }
    });

    it('should extract function names correctly', () => {
      const names = result.functions.map(f => f.name);
      assert.deepEqual(names, ['greet', 'isPositive', 'classify', 'add']);
    });

    it('should set startLine and endLine', () => {
      for (const fn of result.functions) {
        assert.ok(fn.startLine > 0, `${fn.name}: startLine should be > 0`);
        assert.ok(fn.endLine >= fn.startLine, `${fn.name}: endLine should be >= startLine`);
      }
    });

    it('should calculate correct individual complexities', () => {
      const byName = Object.fromEntries(result.functions.map(f => [f.name, f.complexity]));
      assert.equal(byName['greet'], 1);
      assert.equal(byName['isPositive'], 2);
      assert.equal(byName['classify'], 3);
      assert.equal(byName['add'], 1);
    });

    it('should calculate average and max correctly', () => {
      // (1 + 2 + 3 + 1) / 4 = 1.75
      assert.equal(result.average, 1.75);
      assert.equal(result.max, 3);
    });
  });

  describe('moderate.ts', () => {
    let result: FileComplexity;

    before(() => {
      [result] = analyzeComplexity([fixture('moderate.ts')]);
    });

    it('should detect all 3 functions', () => {
      assert.equal(result.functions.length, 3);
    });

    it('should have all complexities in 5-10 range', () => {
      for (const fn of result.functions) {
        assert.ok(fn.complexity >= 5 && fn.complexity <= 10,
          `${fn.name}: complexity ${fn.complexity} not in [5,10]`);
      }
    });

    it('should count switch cases correctly (getDayType)', () => {
      const fn = result.functions.find(f => f.name === 'getDayType')!;
      // 1 base + 5 case clauses + 1 if = 7
      assert.equal(fn.complexity, 7);
    });

    it('should count && and || operators', () => {
      const fn = result.functions.find(f => f.name === 'filterAndTransform')!;
      // 1 base + 1 forOf + 3 if + 1 && = 6
      assert.equal(fn.complexity, 6);
    });
  });

  describe('complex.ts', () => {
    let result: FileComplexity;

    before(() => {
      [result] = analyzeComplexity([fixture('complex.ts')]);
    });

    it('should have at least one function with complexity >= 15', () => {
      const maxComplexity = Math.max(...result.functions.map(f => f.complexity));
      assert.ok(maxComplexity >= 15,
        `max complexity ${maxComplexity} should be >= 15`);
    });

    it('should count && and || operators in complex function', () => {
      const fn = result.functions.find(f => f.name === 'processRecords')!;
      // 1 base + 2 for + 1 if + 1 && + 4 case + 3 if + 1 || + 1 for + 1 if + 1 catch + 1 ternary + 1 if + 1 && = 19
      assert.equal(fn.complexity, 19);
    });

    it('should handle simpler function in same file', () => {
      const fn = result.functions.find(f => f.name === 'summarize')!;
      assert.equal(fn.complexity, 3);
    });
  });

  describe('edge cases', () => {
    it('should return empty functions for file with no functions', () => {
      const emptyFixture = path.join(__dirname, '../fixtures/empty.ts');
      require('fs').writeFileSync(emptyFixture, 'const x = 1;\n');
      try {
        const [result] = analyzeComplexity([emptyFixture]);
        assert.equal(result.functions.length, 0);
        assert.equal(result.average, 0);
        assert.equal(result.max, 0);
      } finally {
        require('fs').unlinkSync(emptyFixture);
      }
    });

    it('should extract arrow function names from variable declarations', () => {
      const [result] = analyzeComplexity([fixture('simple.ts')]);
      const arrowFn = result.functions.find(f => f.name === 'add');
      assert.ok(arrowFn, 'arrow function "add" should be found');
      assert.equal(arrowFn!.complexity, 1);
    });

    it('should analyze multiple files at once', () => {
      const results = analyzeComplexity([
        fixture('simple.ts'),
        fixture('moderate.ts'),
        fixture('complex.ts'),
      ]);
      assert.equal(results.length, 3);
      assert.equal(results[0].filePath, fixture('simple.ts'));
      assert.equal(results[1].filePath, fixture('moderate.ts'));
      assert.equal(results[2].filePath, fixture('complex.ts'));
    });
  });
});
