import * as ts from 'typescript';
import * as fs from 'fs';

export function parseSource(source: string, fileName = 'unknown.ts'): ts.SourceFile {
  return ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
}

export function parseFile(filePath: string): ts.SourceFile {
  const source = fs.readFileSync(filePath, 'utf-8');
  return parseSource(source, filePath);
}
