import { DuplicationResult, DuplicateBlock } from '../shared/types';
import { Token, tokenizeFile } from '../utils/tokenizer';

const WINDOW_SIZE = 30;

interface FileTokenData {
  filePath: string;
  tokens: Token[];
}

interface HashEntry {
  filePath: string;
  tokenIndex: number;
  line: number;
}

export function detectDuplication(filePaths: string[]): DuplicationResult {
  const fileData: FileTokenData[] = filePaths.map(filePath => ({
    filePath,
    tokens: tokenizeFile(filePath),
  }));

  const totalTokens = fileData.reduce((sum, f) => sum + f.tokens.length, 0);

  if (totalTokens === 0) {
    return { duplicationRate: 0, totalTokens: 0, duplicatedTokens: 0, blocks: [] };
  }

  // Build hash map: hash → list of occurrences
  const hashMap = new Map<string, HashEntry[]>();

  for (const fd of fileData) {
    const { filePath, tokens } = fd;
    if (tokens.length < WINDOW_SIZE) continue;

    for (let i = 0; i <= tokens.length - WINDOW_SIZE; i++) {
      const hash = computeWindowHash(tokens, i);
      let entries = hashMap.get(hash);
      if (!entries) {
        entries = [];
        hashMap.set(hash, entries);
      }
      entries.push({ filePath, tokenIndex: i, line: tokens[i].line });
    }
  }

  // Find duplicate pairs and merge adjacent windows
  const rawPairs = collectDuplicatePairs(hashMap);
  const blocks = mergeAdjacentBlocks(rawPairs);

  // Calculate duplicated tokens using a set of (filePath, tokenIndex)
  const duplicatedSet = new Set<string>();
  for (const block of blocks) {
    for (let i = 0; i < block.tokenCount; i++) {
      duplicatedSet.add(`${block.sourceFile}:${block._sourceTokenIndex + i}`);
      duplicatedSet.add(`${block.targetFile}:${block._targetTokenIndex + i}`);
    }
  }

  const duplicatedTokens = duplicatedSet.size;
  const duplicationRate = duplicatedTokens / totalTokens;

  return {
    duplicationRate,
    totalTokens,
    duplicatedTokens,
    blocks: blocks.map(({ sourceFile, sourceLine, targetFile, targetLine, tokenCount }) => ({
      sourceFile,
      sourceLine,
      targetFile,
      targetLine,
      tokenCount,
    })),
  };
}

function computeWindowHash(tokens: Token[], start: number): string {
  let hash = '';
  for (let i = start; i < start + WINDOW_SIZE; i++) {
    hash += tokens[i].text + '\0';
  }
  return hash;
}

interface RawPair {
  sourceFile: string;
  sourceTokenIndex: number;
  sourceLine: number;
  targetFile: string;
  targetTokenIndex: number;
  targetLine: number;
}

/** Collect all duplicate window pairs (cross-file and intra-file at different positions). */
function collectDuplicatePairs(hashMap: Map<string, HashEntry[]>): RawPair[] {
  const pairs: RawPair[] = [];

  for (const entries of hashMap.values()) {
    if (entries.length < 2) continue;

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i];
        const b = entries[j];
        // Skip same position in same file
        if (a.filePath === b.filePath && a.tokenIndex === b.tokenIndex) continue;

        // Normalize order: source is lexicographically first, or by tokenIndex if same file
        const [src, tgt] = normalizePair(a, b);
        pairs.push({
          sourceFile: src.filePath,
          sourceTokenIndex: src.tokenIndex,
          sourceLine: src.line,
          targetFile: tgt.filePath,
          targetTokenIndex: tgt.tokenIndex,
          targetLine: tgt.line,
        });
      }
    }
  }

  return pairs;
}

function normalizePair(a: HashEntry, b: HashEntry): [HashEntry, HashEntry] {
  if (a.filePath < b.filePath) return [a, b];
  if (a.filePath > b.filePath) return [b, a];
  return a.tokenIndex <= b.tokenIndex ? [a, b] : [b, a];
}

interface InternalBlock {
  sourceFile: string;
  sourceLine: number;
  targetFile: string;
  targetLine: number;
  tokenCount: number;
  _sourceTokenIndex: number;
  _targetTokenIndex: number;
}

/** Merge overlapping/adjacent windows between the same file pairs into single blocks. */
function mergeAdjacentBlocks(pairs: RawPair[]): InternalBlock[] {
  // Group by (sourceFile, targetFile)
  const grouped = new Map<string, RawPair[]>();
  for (const p of pairs) {
    const key = `${p.sourceFile}\0${p.targetFile}`;
    let group = grouped.get(key);
    if (!group) {
      group = [];
      grouped.set(key, group);
    }
    group.push(p);
  }

  const blocks: InternalBlock[] = [];

  for (const group of grouped.values()) {
    // Sort by source token index, then target token index
    group.sort((a, b) => a.sourceTokenIndex - b.sourceTokenIndex || a.targetTokenIndex - b.targetTokenIndex);

    // Deduplicate (same sourceTokenIndex + targetTokenIndex)
    const deduped: RawPair[] = [];
    for (const p of group) {
      const last = deduped[deduped.length - 1];
      if (last && last.sourceTokenIndex === p.sourceTokenIndex && last.targetTokenIndex === p.targetTokenIndex) {
        continue;
      }
      deduped.push(p);
    }

    // Merge consecutive windows
    let current: InternalBlock | null = null;

    for (const p of deduped) {
      if (
        current &&
        p.sourceTokenIndex === current._sourceTokenIndex + (current.tokenCount - WINDOW_SIZE + 1) &&
        p.targetTokenIndex === current._targetTokenIndex + (current.tokenCount - WINDOW_SIZE + 1)
      ) {
        // Extend current block by 1 token
        current.tokenCount++;
      } else {
        if (current) blocks.push(current);
        current = {
          sourceFile: p.sourceFile,
          sourceLine: p.sourceLine,
          targetFile: p.targetFile,
          targetLine: p.targetLine,
          tokenCount: WINDOW_SIZE,
          _sourceTokenIndex: p.sourceTokenIndex,
          _targetTokenIndex: p.targetTokenIndex,
        };
      }
    }

    if (current) blocks.push(current);
  }

  return blocks;
}
