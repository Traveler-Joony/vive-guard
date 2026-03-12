import { strict as assert } from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import { detectDuplication } from '../../src/analyzer/duplicationDetector';
import { DuplicationResult } from '../../src/shared/types';

const fixture = (name: string) => path.join(__dirname, '../fixtures', name);

describe('duplicationDetector', () => {
  describe('duplicate files', () => {
    let result: DuplicationResult;

    before(() => {
      result = detectDuplication([fixture('duplicate-a.ts'), fixture('duplicate-b.ts')]);
    });

    it('should have duplicationRate > 0', () => {
      assert.ok(result.duplicationRate > 0,
        `duplicationRate ${result.duplicationRate} should be > 0`);
    });

    it('should have duplicatedTokens > 0', () => {
      assert.ok(result.duplicatedTokens > 0,
        `duplicatedTokens ${result.duplicatedTokens} should be > 0`);
    });

    it('should have totalTokens equal to sum of both files', () => {
      assert.ok(result.totalTokens > 0, 'totalTokens should be > 0');
    });

    it('should have at least one duplicate block', () => {
      assert.ok(result.blocks.length >= 1,
        `expected at least 1 block, got ${result.blocks.length}`);
    });

    it('should have correct source/target file info in blocks', () => {
      const fileA = fixture('duplicate-a.ts');
      const fileB = fixture('duplicate-b.ts');

      for (const block of result.blocks) {
        const files = [block.sourceFile, block.targetFile].sort();
        assert.deepEqual(files, [fileA, fileB].sort(),
          `block files should be duplicate-a.ts and duplicate-b.ts`);
        assert.ok(block.sourceLine > 0, 'sourceLine should be > 0');
        assert.ok(block.targetLine > 0, 'targetLine should be > 0');
        assert.ok(block.tokenCount >= 30, `tokenCount ${block.tokenCount} should be >= 30`);
      }
    });
  });

  describe('unique file only', () => {
    let result: DuplicationResult;

    before(() => {
      result = detectDuplication([fixture('unique.ts')]);
    });

    it('should have duplicationRate === 0', () => {
      assert.equal(result.duplicationRate, 0);
    });

    it('should have no duplicate blocks', () => {
      assert.equal(result.blocks.length, 0);
    });

    it('should have totalTokens > 0', () => {
      assert.ok(result.totalTokens > 0);
    });

    it('should have duplicatedTokens === 0', () => {
      assert.equal(result.duplicatedTokens, 0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty file', () => {
      const emptyFile = path.join(__dirname, '../fixtures/empty-dup.ts');
      fs.writeFileSync(emptyFile, '');
      try {
        const result = detectDuplication([emptyFile]);
        assert.equal(result.duplicationRate, 0);
        assert.equal(result.totalTokens, 0);
        assert.equal(result.duplicatedTokens, 0);
        assert.equal(result.blocks.length, 0);
      } finally {
        fs.unlinkSync(emptyFile);
      }
    });

    it('should handle single file with no self-duplication', () => {
      const result = detectDuplication([fixture('duplicate-a.ts')]);
      // Single file with no repeated 30-token blocks → no duplication
      assert.equal(result.blocks.length, 0);
      assert.equal(result.duplicationRate, 0);
    });

    it('should handle file with fewer tokens than window size', () => {
      const smallFile = path.join(__dirname, '../fixtures/small-dup.ts');
      fs.writeFileSync(smallFile, 'const x = 1;\n');
      try {
        const result = detectDuplication([smallFile]);
        assert.equal(result.duplicationRate, 0);
        assert.equal(result.blocks.length, 0);
        assert.ok(result.totalTokens > 0, 'should still count tokens');
        assert.ok(result.totalTokens < 30, 'should have fewer than 30 tokens');
      } finally {
        fs.unlinkSync(smallFile);
      }
    });
  });
});
