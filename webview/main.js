// @ts-check

(function () {
  // @ts-ignore
  const vscode = acquireVsCodeApi();

  const CIRCUMFERENCE = 2 * Math.PI * 52; // ~326.73

  const GRADE_COLORS = {
    A: '#4caf50',
    B: '#8bc34a',
    C: '#ffc107',
    D: '#ff9800',
    F: '#f44336',
  };

  // ── DOM refs ──

  const gaugeFill = /** @type {SVGCircleElement} */ (document.querySelector('.gauge-fill'));
  const gradeEl = /** @type {HTMLElement} */ (document.querySelector('.grade'));
  const scoreEl = /** @type {HTMLElement} */ (document.querySelector('.score'));

  const complexityValue = /** @type {HTMLElement} */ (document.querySelector('#metric-complexity .metric-value'));
  const complexityDetail = /** @type {HTMLElement} */ (document.querySelector('#metric-complexity .metric-detail'));
  const duplicationValue = /** @type {HTMLElement} */ (document.querySelector('#metric-duplication .metric-value'));
  const duplicationDetail = /** @type {HTMLElement} */ (document.querySelector('#metric-duplication .metric-detail'));
  const patternsValue = /** @type {HTMLElement} */ (document.querySelector('#metric-patterns .metric-value'));
  const patternsDetail = /** @type {HTMLElement} */ (document.querySelector('#metric-patterns .metric-detail'));
  const dependenciesValue = /** @type {HTMLElement} */ (document.querySelector('#metric-dependencies .metric-value'));
  const dependenciesDetail = /** @type {HTMLElement} */ (document.querySelector('#metric-dependencies .metric-detail'));

  const warningsList = /** @type {HTMLUListElement} */ (document.querySelector('.warnings-list'));
  const filesList = /** @type {HTMLUListElement} */ (document.querySelector('.files-list'));

  const refreshBtn = /** @type {HTMLButtonElement} */ (document.getElementById('refresh-btn'));

  // ── Event Handlers ──

  refreshBtn.addEventListener('click', function () {
    vscode.postMessage({ type: 'REQUEST_REFRESH' });
  });

  window.addEventListener('message', function (event) {
    var message = event.data;
    switch (message.type) {
      case 'UPDATE_HEALTH':
        renderHealth(message.payload);
        break;
      case 'UPDATE_FILES':
        renderFiles(message.payload);
        break;
    }
  });

  // ── Renderers ──

  function renderHealth(health) {
    // Gauge
    var pct = Math.max(0, Math.min(100, health.score)) / 100;
    var offset = CIRCUMFERENCE * (1 - pct);
    var color = GRADE_COLORS[health.grade] || GRADE_COLORS.F;

    gaugeFill.style.strokeDashoffset = String(offset);
    gaugeFill.style.stroke = color;

    // Grade & score
    gradeEl.textContent = health.grade;
    gradeEl.className = 'grade grade-' + health.grade.toLowerCase();
    scoreEl.textContent = health.score.toFixed(1) + ' / 100';

    // Complexity
    var avgComplexity = health.complexity.length > 0
      ? health.complexity.reduce(function (sum, f) { return sum + f.average; }, 0) / health.complexity.length
      : 0;
    var maxComplexity = health.complexity.length > 0
      ? Math.max.apply(null, health.complexity.map(function (f) { return f.max; }))
      : 0;
    complexityValue.textContent = avgComplexity.toFixed(1);
    complexityDetail.textContent = 'max ' + maxComplexity;

    // Duplication
    var dupPct = (health.duplication.duplicationRate * 100).toFixed(1);
    duplicationValue.textContent = dupPct + '%';
    duplicationDetail.textContent = health.duplication.blocks.length + ' blocks';

    // Patterns
    var patPct = (health.patterns.overallConsistency * 100).toFixed(0);
    patternsValue.textContent = patPct + '%';
    patternsDetail.textContent = health.patterns.patterns.length + ' rules';

    // Dependencies
    dependenciesValue.textContent = health.dependencies.couplingIndex.toFixed(2);
    dependenciesDetail.textContent = health.dependencies.cycles.length + ' cycles';

    // Warnings
    renderWarnings(health.warnings, health);
  }

  function getPromptForWarning(warning, health) {
    // High complexity — extract filename from ""{name}" has high complexity..."
    if (warning.indexOf('high complexity') !== -1) {
      var match = warning.match(/"([^"]+)"/);
      var filename = match ? match[1] : 'this file';
      return 'Split ' + filename + ' into smaller functions. Each function should do one thing.';
    }
    // Duplication
    if (warning.indexOf('duplicated') !== -1) {
      var blocks = health.duplication.blocks;
      if (blocks.length > 0) {
        var src = blocks[0].sourceFile.split('/').pop();
        var tgt = blocks[0].targetFile.split('/').pop();
        return 'Extract the duplicated code between ' + src + ' and ' + tgt + ' into a shared utility.';
      }
      return 'Extract the duplicated code between files into a shared utility.';
    }
    // Pattern inconsistency
    if (warning.indexOf('inconsistent') !== -1 || warning.indexOf('Inconsistent') !== -1) {
      var patterns = health.patterns.patterns;
      var dominant = patterns.length > 0 ? patterns[0].dominant : 'a consistent';
      return 'Standardize error handling across all files to use ' + dominant + ' pattern.';
    }
    // Circular dependencies
    if (warning.indexOf('circular') !== -1) {
      var cycles = health.dependencies.cycles;
      if (cycles.length > 0) {
        var files = cycles[0].files.map(function (f) { return f.split('/').pop(); }).join(', ');
        return 'Remove circular dependency between ' + files + '. Extract shared logic into a separate module.';
      }
      return 'Remove circular dependency between files. Extract shared logic into a separate module.';
    }
    return null;
  }

  function renderWarnings(warnings, health) {
    warningsList.innerHTML = '';
    if (warnings.length === 0) {
      var li = document.createElement('li');
      li.className = 'warnings-empty';
      li.textContent = 'No warnings — looking good!';
      warningsList.appendChild(li);
      return;
    }
    for (var i = 0; i < warnings.length; i++) {
      var li = document.createElement('li');
      li.className = 'warning-item';

      var textSpan = document.createElement('span');
      textSpan.textContent = warnings[i];
      li.appendChild(textSpan);

      var prompt = getPromptForWarning(warnings[i], health);
      if (prompt) {
        var btn = document.createElement('button');
        btn.className = 'copy-prompt-btn';
        btn.textContent = 'Copy AI Prompt';
        btn.setAttribute('data-prompt', prompt);
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var button = this;
          var text = button.getAttribute('data-prompt');
          navigator.clipboard.writeText(text).then(function () {
            button.textContent = 'Copied!';
            setTimeout(function () {
              button.textContent = 'Copy AI Prompt';
            }, 1500);
          });
        });
        li.appendChild(btn);
      }

      warningsList.appendChild(li);
    }
  }

  function renderFiles(files) {
    filesList.innerHTML = '';
    if (files.length === 0) {
      var li = document.createElement('li');
      li.className = 'files-empty';
      li.textContent = 'No files analyzed yet.';
      filesList.appendChild(li);
      return;
    }

    var sorted = files.slice().sort(function (a, b) { return b.max - a.max; });

    for (var i = 0; i < sorted.length; i++) {
      var file = sorted[i];
      var li = document.createElement('li');
      li.className = 'file-item';

      var nameSpan = document.createElement('span');
      nameSpan.className = 'file-name';
      nameSpan.textContent = shortenPath(file.filePath);
      nameSpan.title = file.filePath;

      var complexitySpan = document.createElement('span');
      complexitySpan.className = 'file-complexity ' + getComplexityClass(file.max);
      complexitySpan.textContent = String(file.max);

      li.appendChild(nameSpan);
      li.appendChild(complexitySpan);

      li.setAttribute('data-path', file.filePath);
      li.addEventListener('click', function () {
        vscode.postMessage({
          type: 'OPEN_FILE',
          payload: { path: this.getAttribute('data-path') },
        });
      });

      filesList.appendChild(li);
    }
  }

  function shortenPath(filePath) {
    var parts = filePath.replace(/\\/g, '/').split('/');
    return parts.length > 3
      ? '.../' + parts.slice(-3).join('/')
      : parts.join('/');
  }

  function getComplexityClass(complexity) {
    if (complexity <= 5) return 'complexity-low';
    if (complexity <= 10) return 'complexity-med';
    if (complexity <= 20) return 'complexity-high';
    return 'complexity-critical';
  }
})();
