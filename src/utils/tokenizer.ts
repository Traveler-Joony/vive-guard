import * as ts from 'typescript';
import * as fs from 'fs';

export interface Token {
  kind: ts.SyntaxKind;
  text: string;
  /** 1-based line number in the original source */
  line: number;
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, source);

  while (scanner.scan() !== ts.SyntaxKind.EndOfFileToken) {
    const kind = scanner.getToken();

    // Skip whitespace and comments
    if (
      kind === ts.SyntaxKind.WhitespaceTrivia ||
      kind === ts.SyntaxKind.NewLineTrivia ||
      kind === ts.SyntaxKind.SingleLineCommentTrivia ||
      kind === ts.SyntaxKind.MultiLineCommentTrivia
    ) {
      continue;
    }

    const pos = scanner.getTokenStart();
    const line = computeLine(source, pos);

    tokens.push({
      kind,
      text: scanner.getTokenText(),
      line,
    });
  }

  return tokens;
}

export function tokenizeFile(filePath: string): Token[] {
  const source = fs.readFileSync(filePath, 'utf-8');
  return tokenize(source);
}

/** Compute 1-based line number for a character position. */
function computeLine(source: string, pos: number): number {
  let line = 1;
  for (let i = 0; i < pos; i++) {
    if (source[i] === '\n') {
      line++;
    }
  }
  return line;
}
