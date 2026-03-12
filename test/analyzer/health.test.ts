import { strict as assert } from 'assert';
import * as path from 'path';
import {
  calculateHealth,
  complexityToScore,
  getGrade,
} from '../../src/analyzer/healthScorer';
import { AnalysisResult } from '../../src/shared/types';

const fixture = (name: string) => path.join(__dirname, '../fixtures', name);

describe('healthScorer', () => {
  describe('simple files (low complexity)', () => {
    let result: AnalysisResult;

    before(() => {
      result = calculateHealth([fixture('simple.ts')]);
    });

    it('should return a low score', () => {
      assert.ok(result.health.score >= 0 && result.health.score <= 40,
        `expected score 0-40 but got ${result.health.score}`);
    });

    it('should assign grade A or B', () => {
      assert.ok(
        result.health.grade === 'A' || result.health.grade === 'B',
        `expected A or B but got ${result.health.grade}`,
      );
    });

    it('should have a warnings array', () => {
      assert.ok(Array.isArray(result.health.warnings));
    });

    it('should have a timestamp', () => {
      assert.ok(result.timestamp > 0);
    });

    it('should include complexity results in files', () => {
      assert.ok(result.files.length > 0);
    });
  });

  describe('complex files (high complexity)', () => {
    let result: AnalysisResult;

    before(() => {
      result = calculateHealth([fixture('complex.ts')]);
    });

    it('should have higher complexity score than simple files', () => {
      const simpleResult = calculateHealth([fixture('simple.ts')]);
      assert.ok(result.health.score > simpleResult.health.score,
        `expected complex score (${result.health.score}) > simple score (${simpleResult.health.score})`);
    });

    it('should include complexity warnings', () => {
      const hasComplexityWarning = result.health.warnings.some(
        w => w.includes('complexity') || w.includes('hard to maintain'),
      );
      assert.ok(hasComplexityWarning, 'expected a complexity warning');
    });
  });

  describe('duplication detection', () => {
    let result: AnalysisResult;

    before(() => {
      result = calculateHealth([fixture('duplicate-a.ts'), fixture('duplicate-b.ts')]);
    });

    it('should detect duplication', () => {
      assert.ok(result.duplication.duplicationRate > 0,
        'expected duplication rate > 0');
    });

    it('should include duplication warning', () => {
      const hasDupWarning = result.health.warnings.some(
        w => w.includes('duplicated'),
      );
      assert.ok(hasDupWarning, 'expected a duplication warning');
    });
  });

  describe('mixed files integration', () => {
    let result: AnalysisResult;

    before(() => {
      result = calculateHealth([
        fixture('simple.ts'),
        fixture('complex.ts'),
        fixture('duplicate-a.ts'),
        fixture('duplicate-b.ts'),
      ]);
    });

    it('should have score in 0-100 range', () => {
      assert.ok(result.health.score >= 0 && result.health.score <= 100,
        `score out of range: ${result.health.score}`);
    });

    it('should have a valid grade', () => {
      assert.ok(['A', 'B', 'C', 'D', 'F'].includes(result.health.grade));
    });

    it('should include all analysis sections', () => {
      assert.ok(result.files.length > 0);
      assert.ok(result.duplication.totalTokens > 0);
      assert.ok(result.patterns !== undefined);
      assert.ok(result.dependencies !== undefined);
    });
  });

  describe('pattern consistency', () => {
    let result: AnalysisResult;

    before(() => {
      result = calculateHealth([
        fixture('pattern-trycatch.ts'),
        fixture('pattern-dotcatch.ts'),
      ]);
    });

    it('should detect pattern inconsistency', () => {
      assert.ok(result.patterns.overallConsistency < 1,
        'expected inconsistency when mixing error handling styles');
    });

    it('should include pattern warning when inconsistency is high', () => {
      const patternScore = (1 - result.patterns.overallConsistency) * 100;
      if (patternScore > 40) {
        const hasWarning = result.health.warnings.some(
          w => w.includes('inconsistent') || w.includes('style'),
        );
        assert.ok(hasWarning, 'expected a pattern inconsistency warning');
      }
    });
  });

  describe('dependency cycles', () => {
    let result: AnalysisResult;

    before(() => {
      result = calculateHealth([
        fixture('deps/circular-x.ts'),
        fixture('deps/circular-y.ts'),
      ]);
    });

    it('should detect circular dependencies', () => {
      assert.ok(result.dependencies.cycles.length > 0,
        'expected at least one cycle');
    });

    it('should include circular dependency warning', () => {
      const hasWarning = result.health.warnings.some(
        w => w.includes('circular'),
      );
      assert.ok(hasWarning, 'expected a circular dependency warning');
    });
  });

  describe('complexityToScore', () => {
    it('should return 0 for empty array', () => {
      assert.equal(complexityToScore([]), 0);
    });

    it('should map avg=1 to score ~4', () => {
      const score = complexityToScore([
        { filePath: 'a.ts', functions: [], average: 1, max: 1 },
      ]);
      assert.ok(score >= 0 && score <= 20, `expected 0-20 but got ${score}`);
    });

    it('should map avg=5 to score 20', () => {
      const score = complexityToScore([
        { filePath: 'a.ts', functions: [], average: 5, max: 5 },
      ]);
      assert.equal(score, 20);
    });

    it('should map avg=10 to score 40', () => {
      const score = complexityToScore([
        { filePath: 'a.ts', functions: [], average: 10, max: 10 },
      ]);
      assert.equal(score, 40);
    });

    it('should map avg=15 to score 60', () => {
      const score = complexityToScore([
        { filePath: 'a.ts', functions: [], average: 15, max: 15 },
      ]);
      assert.equal(score, 60);
    });

    it('should map avg=20 to score 80', () => {
      const score = complexityToScore([
        { filePath: 'a.ts', functions: [], average: 20, max: 20 },
      ]);
      assert.equal(score, 80);
    });

    it('should cap at 100 for very high avg', () => {
      const score = complexityToScore([
        { filePath: 'a.ts', functions: [], average: 50, max: 50 },
      ]);
      assert.equal(score, 100);
    });
  });

  describe('getGrade', () => {
    it('should return A for score 0-20', () => {
      assert.equal(getGrade(0), 'A');
      assert.equal(getGrade(20), 'A');
    });

    it('should return B for score 21-40', () => {
      assert.equal(getGrade(21), 'B');
      assert.equal(getGrade(40), 'B');
    });

    it('should return C for score 41-60', () => {
      assert.equal(getGrade(41), 'C');
      assert.equal(getGrade(60), 'C');
    });

    it('should return D for score 61-80', () => {
      assert.equal(getGrade(61), 'D');
      assert.equal(getGrade(80), 'D');
    });

    it('should return F for score 81-100', () => {
      assert.equal(getGrade(81), 'F');
      assert.equal(getGrade(100), 'F');
    });
  });
});
