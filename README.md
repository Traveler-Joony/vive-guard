# VibeGuard

**Real-time code complexity guardrails for vibe coding projects.**

VibeGuard is a VS Code extension that monitors your codebase health in real-time — tracking complexity, duplication, pattern consistency, and dependencies — so you can catch problems *before* they spiral out of control.

> **The Problem:** AI-generated code starts great, but as features pile up, one bug triggers a cascading chain where every AI fix breaks something else. By the time you notice, your project is in a "fix spiral" that's nearly impossible to escape.
>
> **The Solution:** VibeGuard acts as a check engine light for your codebase, warning you before you cross the complexity threshold where AI can no longer reliably maintain your code.

---

## Features

### Dashboard with Health Score
A visual sidebar dashboard showing your project's overall health grade (A–F) with a score from 0–100. Four key metrics are displayed at a glance: complexity, duplication, patterns, and dependencies.

### Score History Chart
Track how your codebase health changes over time with an SVG line chart. Grade zone backgrounds (green to red) make it easy to spot trends. Data persists across VS Code restarts.

### CodeLens Complexity Display
See function-level complexity right in your editor. Each function shows its cyclomatic complexity score with a status indicator:
- ✅ Complexity ≤ 10 (healthy)
- ⚠️ Complexity 11–20 (warning)
- 🔴 Complexity 21+ (critical)

### Problems Panel Integration
High-complexity functions appear as warnings or errors in VS Code's Problems panel, making them impossible to miss.

### File Tree Explorer
A project file tree with complexity scores for each file. High-complexity functions are highlighted at the top. 52 file type icons included for instant visual recognition.

### Copy AI Prompt
Each warning comes with a "Copy AI Prompt" button that generates a context-aware refactoring prompt you can paste directly into Cursor, Claude Code, or any AI coding tool. Hover to preview the prompt before copying.

### Smart Notifications
- **Health alerts:** Get notified when your project health drops to grade C or below
- **Save point recommendations:** When complexity jumps significantly, VibeGuard suggests committing your current state before making more changes

### 10 Language Support
Full UI localization: English, 한국어, 日本語, 简体中文, 繁體中文, Deutsch, Français, Español, Português, Русский. Change language from the sidebar dropdown.

### Configurable Thresholds
Customize all thresholds from VS Code Settings:
- Max Complexity (default: 15)
- Max Duplication Rate (default: 10%)
- Min Pattern Consistency (default: 70%)
- Max Coupling Index (default: 0.3)

---

## How It Works

VibeGuard analyzes your JavaScript and TypeScript files using four metrics:

| Metric | What It Measures | How |
|--------|-----------------|-----|
| **Cyclomatic Complexity** | How many paths through your code | AST parsing, counting branches (if/for/while/switch/catch/ternary/&&/\|\|) |
| **Code Duplication** | Repeated code blocks across files | Token-based sliding window hashing (30-token window) |
| **Pattern Consistency** | Coding style uniformity | Error handling patterns, export styles, file naming conventions |
| **Dependency Coupling** | How tangled your imports are | Import graph analysis with cycle detection (DFS) |

These four scores are combined with weights (35% / 25% / 20% / 20%) into a single health score graded A through F.

---

## Quick Start

1. Install from VS Code Marketplace (or build from source)
2. Open any JavaScript/TypeScript project
3. Click the VibeGuard icon (pulse) in the Activity Bar
4. Your project health dashboard appears instantly

Analysis runs automatically on file save with 500ms debouncing.

---

## Use Case: Preventing the Fix Spiral

**Day 1–3: Project starts great**
```
🟢 Health: A (12/100) — All metrics healthy
```

**Day 4–7: Features pile up, patterns start diverging**
```
🟡 Health: B (38/100)
⚠️ 3 different error handling patterns detected
⚠️ Supabase client initialized in 3 places
💡 Copy AI Prompt: "Standardize error handling to try-catch pattern"
```

**Day 10: Before adding payment system**
```
🔴 Health: D (67/100)
⚠️ dashboard.tsx complexity: 31
⚠️ Consider committing before making more changes
💡 Copy AI Prompt: "Split dashboard.tsx into smaller components"
```

Without VibeGuard, you'd add Stripe on top of the mess and enter a 3-day fix spiral. With VibeGuard, you refactor first, then add the feature safely.

---

## Building from Source

### Prerequisites
- Node.js 18+
- VS Code 1.85+

### Setup
```bash
git clone https://github.com/Traveler-Joony/vive-guard.git
cd vive-guard
npm install
npm run build
```

### Development
```bash
# Watch mode
npm run watch

# Run tests (84 tests)
npm run test

# Lint
npm run lint

# Package for distribution
npm run package
```

### Testing the Extension
1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. Open any JS/TS project in the new window
4. Click the VibeGuard icon in the Activity Bar

---

## Project Structure

```
src/
  extension.ts              — Entry point (activate/deactivate)
  shared/
    types.ts                — Shared type definitions
    messages.ts             — Webview message protocol
  analyzer/                 — Pure TypeScript, no VS Code dependency
    complexityAnalyzer.ts   — Cyclomatic complexity (AST-based)
    duplicationDetector.ts  — Code duplication (token hashing)
    patternChecker.ts       — Pattern consistency checks
    dependencyMapper.ts     — Import graph + cycle detection
    healthScorer.ts         — Combines 4 metrics → health score
  watcher/
    fileWatcher.ts          — File change detection + debouncing
  ui/
    sidebarProvider.ts      — Webview dashboard
    codeLensProvider.ts     — Inline complexity display
    diagnosticsProvider.ts  — Problems panel integration
    notificationManager.ts  — Alerts + save point recommendations
  config/
    thresholds.ts           — Configurable thresholds
    i18n.ts                 — 10-language translation system
webview/
  main.js                   — Dashboard UI logic
  style.css                 — VS Code themed styles
  icons/                    — 52 file type SVG icons
```

### Architecture

```
File Save Event
  → FileWatcher (500ms debounce)
    → HealthScorer
      → complexityAnalyzer (AST)
      → duplicationDetector (token hashing)
      → patternChecker (pattern matching)
      → dependencyMapper (import graph)
    → Health Score (0–100, A–F grade)
      → Sidebar Dashboard (Webview)
      → CodeLens (inline display)
      → Diagnostics (Problems panel)
      → Notifications (alerts)
```

The analyzer modules are pure TypeScript with zero VS Code dependency, making them independently testable and portable.

---

## Tech Stack

- **TypeScript** — Extension and analysis engine
- **TypeScript Compiler API** — AST parsing (no external parser)
- **VS Code Extension API** — Webview, CodeLens, Diagnostics
- **esbuild** — Fast bundling
- **Mocha** — 84 unit tests
- **Pure SVG** — Charts and icons (no external libraries)

---

## Supported Languages

Analysis currently supports:
- TypeScript (.ts, .tsx)
- JavaScript (.js, .jsx)

File icons support 52+ file types including Python, Go, Rust, Java, C/C++, and more.

---

## Configuration

All settings are under `vibeGuard.*` in VS Code Settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `vibeGuard.maxComplexity` | 15 | Max cyclomatic complexity per function |
| `vibeGuard.maxDuplicationRate` | 0.1 | Max code duplication rate (0–1) |
| `vibeGuard.minPatternConsistency` | 0.7 | Min pattern consistency score (0–1) |
| `vibeGuard.maxCouplingIndex` | 0.3 | Max file dependency coupling (0–1) |
| `vibeGuard.language` | auto | UI language (auto/en/ko/ja/zh-cn/zh-tw/de/fr/es/pt/ru) |

---

## Roadmap

- [ ] Native TreeView with right-click context menu (file operations)
- [ ] Incremental analysis (re-analyze only changed files)
- [ ] AI-powered custom refactoring prompts (API integration)
- [ ] Support for Python, Go, Rust analysis
- [ ] VS Code Marketplace publishing

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Run tests (`npm run test`)
4. Commit with conventional commits (`feat:`, `fix:`, `refactor:`)
5. Open a Pull Request

---

## License

## License

AGPL-3.0 License — see [LICENSE](LICENSE) for details. For commercial licensing, please contact the author.

---

## Acknowledgments

- File icons from [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme) (MIT License)
- Built with [TypeScript Compiler API](https://github.com/microsoft/TypeScript)

---

**Built with vibe coding.** This extension was itself developed using AI-assisted coding (Claude Code), making it a meta-tool — a complexity guardrail built by the very workflow it's designed to protect.
