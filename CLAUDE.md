# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VibeGuard — a VS Code extension that monitors code complexity in real-time for "vibe coding" projects. It statically analyzes JS/TS code to measure cyclomatic complexity, code duplication, pattern consistency, and file dependency, then visualizes results in a sidebar dashboard.

## Tech Stack

- TypeScript, VS Code Extension API
- TypeScript Compiler API (`ts.createSourceFile`) for AST parsing
- esbuild (bundler), Mocha (tests)
- Webview (HTML/CSS/JS) for sidebar UI

## Build & Test Commands

```bash
npm run build          # esbuild build
npm run watch          # dev mode (watch for changes)
npm run test           # all tests
npm run test:unit      # analyzer unit tests only
npm run lint           # eslint
npm run package        # .vsix packaging for marketplace
```

## Architecture Rules — IMPORTANT

### Dependency Direction (unidirectional only)

```
watcher/ → analyzer/ → healthScorer → ui/
```

### Absolute Prohibitions

- **analyzer/ files MUST NOT import `vscode`** — pure TypeScript only, no VS Code API dependency
- **ui/ files MUST NOT import analyzer/ directly** — only through `healthScorer.ts`
- **Do not modify `package.json` contributes section** without explicit user approval
- **Do not modify `src/shared/messages.ts`** — manually managed message protocol file
- Use `vscode.workspace.fs` instead of Node.js `fs` in ui/ (for Remote/WSL compatibility)
- Webview ↔ Extension Host communication via `postMessage` only — no direct function calls

### Directory Structure

```
src/
  extension.ts              — entry point (activate/deactivate)
  shared/
    types.ts                — shared types (analysis results, config)
    messages.ts             — Webview message types (DO NOT MODIFY)
  analyzer/                 — pure TS, no vscode dependency
    complexityAnalyzer.ts   — cyclomatic complexity (AST-based)
    duplicationDetector.ts  — code duplication (token hashing)
    patternChecker.ts       — pattern consistency checks
    dependencyMapper.ts     — import/export dependency graph
    healthScorer.ts         — combines 4 metrics → overall score
  watcher/
    fileWatcher.ts          — file change detection + debouncing (500ms)
  ui/
    sidebarProvider.ts      — Webview sidebar dashboard
    codeLensProvider.ts     — per-function complexity CodeLens
    diagnosticsProvider.ts  — Problems panel integration
    notificationManager.ts  — alerts + action guides
  config/
    thresholds.ts           — threshold defaults + user customization
  utils/
    astParser.ts            — TypeScript Compiler API wrapper
    tokenizer.ts            — tokenization utility
webview/                    — sidebar HTML/CSS/JS
test/
  analyzer/                 — unit tests
  fixtures/                 — sample code for tests
```

### Key Design Patterns

- **Event-driven**: file save → FileWatcher → analyze changed file only → HealthScorer updates → UI refreshes
- **Incremental analysis**: only re-analyze changed files; cache results by file hash
- **Debouncing**: 500ms debounce on file save events
- **Analyzer purity**: analyzer/ modules take file paths/source strings as input, return typed result objects — testable without VS Code

### Health Score

- Weights: complexity 35%, duplication 25%, patterns 20%, dependencies 20%
- Grades: A (0–20), B (21–40), C (41–60), D (61–80), F (81–100) — lower is healthier
- Warning messages should use non-technical language (target audience includes non-developers)

## Workflow

- Commit messages: conventional commits (`feat:`, `fix:`, `refactor:`, `test:`)
- One module per session — do not mix analyzer and UI work in the same session
- Write tests first, then implement
- Run `npm run build` after file changes to verify
