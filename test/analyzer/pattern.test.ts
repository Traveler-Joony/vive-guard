import { strict as assert } from 'assert';
import * as path from 'path';
import { checkPatterns } from '../../src/analyzer/patternChecker';
import { PatternType, PatternConsistencyResult } from '../../src/shared/types';

const fixture = (name: string) => path.join(__dirname, '../fixtures', name);

function findPattern(result: PatternConsistencyResult, type: PatternType) {
  return result.patterns.find(p => p.type === type);
}

describe('patternChecker', () => {
  describe('ErrorHandling', () => {
    it('should detect consistent try-catch usage', () => {
      const result = checkPatterns([fixture('pattern-trycatch.ts')]);
      const eh = findPattern(result, PatternType.ErrorHandling)!;
      assert.equal(eh.dominant, 'try-catch');
      assert.equal(eh.consistency, 1.0);
    });

    it('should detect consistent .catch() usage', () => {
      const result = checkPatterns([fixture('pattern-dotcatch.ts')]);
      const eh = findPattern(result, PatternType.ErrorHandling)!;
      assert.equal(eh.dominant, '.catch()');
      assert.equal(eh.consistency, 1.0);
    });

    it('should detect no-error-handling pattern', () => {
      const result = checkPatterns([fixture('pattern-noerror.ts')]);
      const eh = findPattern(result, PatternType.ErrorHandling)!;
      assert.equal(eh.dominant, 'no-error-handling');
      assert.equal(eh.consistency, 1.0);
    });

    it('should report mixed error handling with reduced consistency', () => {
      const result = checkPatterns([
        fixture('pattern-trycatch.ts'),
        fixture('pattern-dotcatch.ts'),
        fixture('pattern-noerror.ts'),
      ]);
      const eh = findPattern(result, PatternType.ErrorHandling)!;
      assert.ok(eh.consistency < 1.0);
      assert.equal(eh.variants.length, 3);
      const total = eh.variants.reduce((sum, v) => sum + v.count, 0);
      assert.equal(total, 6); // 2 try-catch + 2 .catch() + 2 no-error
    });
  });

  describe('ExportStyle', () => {
    it('should detect consistent named exports', () => {
      const result = checkPatterns([fixture('pattern-named-export.ts')]);
      const es = findPattern(result, PatternType.ExportStyle)!;
      assert.equal(es.dominant, 'named');
      assert.equal(es.consistency, 1.0);
    });

    it('should detect default export', () => {
      const result = checkPatterns([fixture('pattern-default-export.ts')]);
      const es = findPattern(result, PatternType.ExportStyle)!;
      assert.equal(es.dominant, 'default');
      assert.equal(es.consistency, 1.0);
    });

    it('should report mixed exports with named as dominant', () => {
      const result = checkPatterns([fixture('pattern-mixed-export.ts')]);
      const es = findPattern(result, PatternType.ExportStyle)!;
      assert.equal(es.dominant, 'named');
      assert.ok(es.consistency < 1.0);
      // 2 named + 1 default = 2/3
      assert.ok(Math.abs(es.consistency - 2 / 3) < 0.01);
    });
  });

  describe('FileNaming', () => {
    it('should detect camelCase file names', () => {
      const result = checkPatterns([
        fixture('pattern-trycatch.ts'),   // kebab
        fixture('pattern-dotcatch.ts'),   // kebab
        fixture('pattern-noerror.ts'),    // kebab
      ]);
      const fn = findPattern(result, PatternType.FileNaming)!;
      assert.equal(fn.dominant, 'kebab-case');
      assert.equal(fn.consistency, 1.0);
    });

    it('should detect mixed naming patterns', () => {
      const result = checkPatterns([
        fixture('simple.ts'),            // camelCase
        fixture('pattern-trycatch.ts'),  // kebab-case
      ]);
      const fn = findPattern(result, PatternType.FileNaming)!;
      assert.ok(fn.consistency <= 1.0);
      assert.equal(fn.variants.length, 2);
    });
  });

  describe('overallConsistency', () => {
    it('should average all pattern consistencies', () => {
      const result = checkPatterns([fixture('pattern-trycatch.ts')]);
      const eh = findPattern(result, PatternType.ErrorHandling)!;
      const es = findPattern(result, PatternType.ExportStyle)!;
      const fn = findPattern(result, PatternType.FileNaming)!;
      const expected = (eh.consistency + es.consistency + fn.consistency) / 3;
      assert.ok(Math.abs(result.overallConsistency - expected) < 0.01);
    });

    it('should return 0 for empty input', () => {
      const result = checkPatterns([]);
      assert.equal(result.overallConsistency, 0);
      assert.equal(result.patterns.length, 0);
    });
  });
});
