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

    // Trends
    if (health.trends) {
      setScoreTrend(health.trends.score);
      setTrend('metric-complexity', health.trends.complexity);
      setTrend('metric-duplication', health.trends.duplication);
      setTrend('metric-patterns', health.trends.patterns);
      setTrend('metric-dependencies', health.trends.dependencies);
    }

    // History chart
    renderHistoryChart(health.history, color);

    // Warnings
    renderWarnings(health.warnings, health);
  }

  function renderHistoryChart(history, lineColor) {
    var container = document.getElementById('history-chart');
    if (!container) return;

    if (!history || history.length < 2) {
      container.innerHTML = '<div class="chart-empty">Not enough data for trend chart</div>';
      return;
    }

    var width = 280;
    var height = 120;
    var padLeft = 30;
    var padRight = 10;
    var padTop = 10;
    var padBottom = 20;
    var plotW = width - padLeft - padRight;
    var plotH = height - padTop - padBottom;

    // Grade zone bands
    var zones = [
      { min: 0, max: 20, color: '#4caf50' },
      { min: 20, max: 40, color: '#8bc34a' },
      { min: 40, max: 60, color: '#ffc107' },
      { min: 60, max: 80, color: '#ff9800' },
      { min: 80, max: 100, color: '#f44336' },
    ];

    var bands = '';
    for (var z = 0; z < zones.length; z++) {
      var yTop = padTop + plotH * (1 - zones[z].max / 100);
      var yBot = padTop + plotH * (1 - zones[z].min / 100);
      bands += '<rect x="' + padLeft + '" y="' + yTop + '" width="' + plotW + '" height="' + (yBot - yTop) + '" fill="' + zones[z].color + '" opacity="0.1"/>';
    }

    // Y-axis labels
    var yLabels = '';
    var yTicks = [0, 20, 40, 60, 80, 100];
    for (var t = 0; t < yTicks.length; t++) {
      var yPos = padTop + plotH * (1 - yTicks[t] / 100);
      yLabels += '<text x="' + (padLeft - 4) + '" y="' + (yPos + 3) + '" text-anchor="end" font-size="9" fill="currentColor" opacity="0.5">' + yTicks[t] + '</text>';
      yLabels += '<line x1="' + padLeft + '" y1="' + yPos + '" x2="' + (padLeft + plotW) + '" y2="' + yPos + '" stroke="currentColor" stroke-opacity="0.1"/>';
    }

    // Data points
    var points = '';
    var circles = '';
    var hitAreas = '';
    var n = history.length;
    for (var i = 0; i < n; i++) {
      var x = n === 1 ? padLeft + plotW / 2 : padLeft + (i / (n - 1)) * plotW;
      var y = padTop + plotH * (1 - history[i].score / 100);
      points += (i === 0 ? '' : ' ') + x.toFixed(1) + ',' + y.toFixed(1);
      circles += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3" fill="' + lineColor + '" class="chart-dot"/>';

      var time = new Date(history[i].timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      var tooltipText = 'Score: ' + history[i].score.toFixed(1) + ', ' + time;
      hitAreas += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="10" fill="transparent" data-tooltip="' + tooltipText + '" class="chart-hit"/>';
    }

    var svg = '<svg viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none">'
      + bands
      + yLabels
      + '<polyline points="' + points + '" fill="none" stroke="' + lineColor + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'
      + circles
      + hitAreas
      + '</svg>';

    container.innerHTML = svg + '<div class="chart-tooltip" style="display:none;"></div>';

    // Tooltip events
    var tooltip = container.querySelector('.chart-tooltip');
    var hits = container.querySelectorAll('.chart-hit');
    for (var h = 0; h < hits.length; h++) {
      hits[h].addEventListener('mouseenter', function (e) {
        var text = this.getAttribute('data-tooltip');
        tooltip.textContent = text;
        tooltip.style.display = 'block';
      });
      hits[h].addEventListener('mousemove', function (e) {
        var rect = container.getBoundingClientRect();
        tooltip.style.left = (e.clientX - rect.left + 8) + 'px';
        tooltip.style.top = (e.clientY - rect.top - 24) + 'px';
      });
      hits[h].addEventListener('mouseleave', function () {
        tooltip.style.display = 'none';
      });
    }
  }

  function getTrendArrow(trend) {
    if (trend.direction === 'up') return '\u2191';
    if (trend.direction === 'down') return '\u2193';
    return '\u2192';
  }

  function setScoreTrend(trend) {
    var el = document.querySelector('.score-trend');
    if (!el) {
      el = document.createElement('span');
      el.className = 'score-trend';
      scoreEl.parentNode.appendChild(el);
    }
    el.textContent = getTrendArrow(trend);
    el.className = 'score-trend trend-' + trend.direction;
  }

  function setTrend(cardId, trend) {
    var card = document.getElementById(cardId);
    if (!card) return;
    var el = card.querySelector('.metric-trend');
    if (!el) {
      el = document.createElement('span');
      el.className = 'metric-trend';
      card.querySelector('.metric-info').appendChild(el);
    }
    el.textContent = getTrendArrow(trend);
    el.className = 'metric-trend trend-' + trend.direction;
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
