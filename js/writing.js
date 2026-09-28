/* Writing: whole-word stroke order (view / trace / test) with Hanzi Writer. */
(function (App) {
  'use strict';

  var t = App.i18n.t;
  var esc = App.util.escapeHtml;

  var MODES = ['view', 'trace', 'test'];
  var SPEEDS = {
    slow: { speed: 0.4, delay: 700 },
    normal: { speed: 0.7, delay: 400 },
    fast: { speed: 1.3, delay: 150 },
  };
  // Show a hint after this many misses on the same stroke.
  var HINT_AFTER = { trace: 2, test: 3 };
  // How far a drawn stroke may stray and still match (Hanzi Writer default 1). Measured on
  // simulated sloppy strokes: trace 1.5 accepts ~96% of very sloppy strokes; test 1.25 keeps
  // wrong strokes (the nearest other stroke) accepted under ~7%, since test results are recorded.
  var LENIENCY = { trace: 1.5, test: 1.25 };

  // Stroke data (~600KB) and Hanzi Writer load the first time the tab is shown.
  var SCRIPTS = ['data/strokes.js', 'vendor/hanzi-writer.min.js'];
  var STROKES = null;
  var available = false;
  var loaded = false;
  var loading = null;

  var GRID =
    '<svg class="write-grid" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
    '<line x1="50" y1="0" x2="50" y2="100"/><line x1="0" y1="50" x2="100" y2="50"/></svg>';

  var PENCIL =
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" ' +
    'd="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>';

  function pick(value, allowed, fallback) {
    return allowed.indexOf(value) === -1 ? fallback : value;
  }

  var state = {
    id: App.util.wordId(App.storage.get('writeWord', 1)) || 1,
    mode: pick(App.storage.get('writeMode', 'trace'), MODES, 'trace'),
    speed: pick(App.storage.get('writeSpeed', 'normal'), Object.keys(SPEEDS), 'normal'),
    order: pick(App.storage.get('writeOrder', 'number'), ['number', 'shuffle'], 'number'),
    seq: [], // shuffled word ids that ← / → follow in Shuffle order
  };

  var records = {};
  (function loadRecords() {
    var raw = App.storage.get('writing', {});
    if (!App.util.isPlainObject(raw)) return;
    Object.keys(raw).forEach(function (key) {
      var id = App.util.wordId(key);
      var r = raw[key];
      if (id === null || !App.util.isPlainObject(r) || typeof r.tries !== 'number' || r.tries < 1) return;
      records[id] = { tries: r.tries, best: typeof r.best === 'number' ? r.best : 0 };
      if (typeof r.bestScore === 'number' && r.bestScore >= 0 && r.bestScore <= 100) records[id].bestScore = r.bestScore;
      if (App.util.isDateStr(r.last)) records[id].last = r.last;
    });
  })();
  var session = null; // the word currently on screen
  var runId = 0; // bumps on every render/replay so stale async work stops
  var dirty = true; // needs a render the next time the panel is visible
  var el = {};

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  /** Resolves even when the file is missing; render() then shows writeNoData. */
  function loadScript(src) {
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = s.onerror = function () { resolve(); };
      document.head.appendChild(s);
    });
  }

  function load() {
    if (!loading) {
      loading = Promise.all(SCRIPTS.map(loadScript)).then(function () {
        STROKES = window.STROKES || null;
        available = !!STROKES && typeof window.HanziWriter === 'function';
        loaded = true;
      });
    }
    return loading;
  }

  function sum(arr) {
    return arr.reduce(function (a, b) { return a + b; }, 0);
  }

  /* ---- Data helpers ---- */

  function hasData(ch) {
    return !!(STROKES && STROKES[ch]);
  }

  function colors() {
    var cs = getComputedStyle(document.documentElement);
    function v(name) { return cs.getPropertyValue(name).trim(); }
    return {
      strokeColor: v('--write-stroke'),
      // Radical strokes get their own color; if unset, Hanzi Writer copies the
      // stroke color once at creation, so it would not follow theme changes.
      radicalColor: v('--write-stroke'),
      outlineColor: v('--write-outline'),
      highlightColor: v('--write-highlight'),
      drawingColor: v('--write-drawing'),
      highlightCompleteColor: v('--write-complete'),
    };
  }

  function record(id) {
    return records[id] || null;
  }

  function saveRecord(id, mistakes, score) {
    var r = records[id] || { tries: 0, best: null };
    r.tries++;
    r.best = r.best === null ? mistakes : Math.min(r.best, mistakes);
    r.bestScore = typeof r.bestScore === 'number' ? Math.max(r.bestScore, score) : score;
    r.last = App.util.today();
    records[id] = r;
    App.storage.set('writing', records);
    App.emit('writing', { id: id });
  }

  /* ---- Markup ---- */

  function headHtml() {
    var s = session;
    var w = s.word;
    var hide = state.mode === 'test' && !s.revealed;
    var word = hide
      ? '<span class="write-blank" aria-hidden="true">' + '□'.repeat(s.chars.length) + '</span>'
      : '<span class="hanzi" lang="zh-CN">' + esc(s.form.hanzi) + '</span>';
    var pinyin = s.form.pinyin || w.pinyin;
    return (
      '<div>' +
      '<div class="write-word">' + word +
      '<span class="pinyin" lang="zh-Latn-pinyin">' + esc(pinyin) + '</span>' +
      speakButton() +
      '</div>' +
      '<p class="write-meaning">' + esc(App.view.meaning(w)) + '</p>' +
      '</div>' +
      '<span class="write-counter" id="write-counter" aria-live="off"></span>'
    );
  }

  function speakButton() {
    if (!App.speech.supported) return '';
    var hidden = state.mode === 'test' && !session.revealed;
    return (
      '<button type="button" class="btn btn-icon" data-write="speak" aria-label="' +
      esc(hidden ? t('listen') : t('listenWord', { word: session.form.hanzi })) +
      '" title="' + esc(t('listen')) + '">' + App.speech.icon + '</button>'
    );
  }

  function cellHtml(ch, i) {
    var inner;
    if (hasData(ch)) inner = '<div class="write-target" id="write-target-' + i + '"></div>';
    else if (state.mode === 'test') inner = '<div class="write-missing">?</div>';
    else inner = '<div class="write-missing"><span class="hanzi" lang="zh-CN">' + esc(ch) + '</span></div>';
    return (
      '<div class="write-cell" data-cell="' + i + '">' +
      '<div class="write-box" role="group" aria-label="' + esc(t('boxLabel', { n: i + 1 })) + '">' + GRID + inner + '</div>' +
      '<div class="write-cell-foot"></div>' +
      '</div>'
    );
  }

  /** 0.6x / 1.0x / 2.0x in view mode; pressing one (again) replays the strokes at that speed. */
  function speedHtml() {
    return (
      '<div class="segmented write-speed" role="group" aria-label="' + esc(t('writeSpeed')) + '">' +
      Object.keys(SPEEDS)
        .map(function (key) {
          return (
            '<button type="button" class="btn" data-write-speed="' + key + '" aria-pressed="' + (key === state.speed) + '">' +
            SPEEDS[key].speed.toFixed(1) + 'x</button>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function arrowHtml(action, key, arrow) {
    return (
      '<button type="button" class="btn btn-icon" data-write="' + action + '" aria-label="' + esc(t(key)) +
      '" title="' + esc(t(key)) + '">' + arrow + '</button>'
    );
  }

  /** Bottom row of the card: ← in the left corner, speed / start-over in the middle, → in the right corner. */
  function controlsHtml() {
    var main = state.mode === 'view'
      ? speedHtml()
      : '<button type="button" class="btn" data-write="restart">' + esc(t('restartWord')) + '</button>';
    return (
      arrowHtml('prev', 'prevWord', '←') +
      '<div class="write-controls-main">' + main + '</div>' +
      arrowHtml('next', 'nextWordShort', '→')
    );
  }

  function resultHtml() {
    var s = session;
    if (!s.finished || state.mode === 'view') return '';
    var m = totalMistakes(s);
    var text;
    var detail = '';
    if (state.mode === 'test') {
      text = t('testDone', { word: s.form.hanzi, m: m, h: totalHints(s) });
      if (s.chars.length > 1) {
        detail =
          '<p>' + esc(t('testPerChar')) + ': ' +
          s.chars
            .map(function (ch, i) {
              return '<span class="hanzi" lang="zh-CN">' + esc(ch) + '</span> ' + (hasData(ch) ? s.carried[i] + s.mistakes[i] : '–');
            })
            .join(' · ') +
          '</p>';
      }
    } else {
      text = t('traceDone', { m: m });
    }
    return (
      '<div class="write-result" role="status">' +
      scoreHtml(wordScore(s)) +
      '<p>' + esc(text) + '</p>' + detail +
      '<div class="button-row">' +
      '<button type="button" class="btn" data-write="restart">' + esc(t('writeAgain')) + '</button>' +
      '<button type="button" class="btn btn-primary" data-write="next">' + esc(t('nextWord')) + '</button>' +
      '</div></div>'
    );
  }

  function recordHtml() {
    var r = record(session.word.id);
    if (!r) return '';
    // Records from before scoring have only the fewest wrong strokes.
    return esc(typeof r.bestScore === 'number'
      ? t('writeRecordScore', { s: r.bestScore, n: r.tries })
      : t('writeRecord', { m: r.best, n: r.tries }));
  }

  /* ---- Partial updates (keep the Hanzi Writer instances alive) ---- */

  function updateCounter() {
    var s = session;
    var node = document.getElementById('write-counter');
    if (!node || !s) return;
    node.textContent = t('strokeCounter', { i: sum(s.strokesDone), n: s.total });
  }

  function updateCells() {
    var s = session;
    s.chars.forEach(function (ch, i) {
      var cell = el.area.querySelector('[data-cell="' + i + '"]');
      if (!cell) return;
      var missing = !hasData(ch);
      var current = i === s.active;
      var done = s.done[i] && !missing;
      cell.classList.toggle('is-current', current);
      cell.classList.toggle('is-done', done);
      var label = missing ? t('cellMissing') : current ? t('cellCurrent') : done ? t('cellDone') : t('cellWaiting');
      var html = '<span>' + esc(label) + '</span>';
      if (done && state.mode !== 'view') {
        html +=
          '<button type="button" class="btn btn-small" data-write-retry="' + i + '" aria-label="' +
          esc(t('retryCharLabel', { char: ch })) + '">' + esc(t('retryChar')) + '</button>';
      }
      cell.querySelector('.write-cell-foot').innerHTML = html;
    });
  }

  /** Re-render everything except the writing boxes (language change, finish, etc.). */
  /* ---- Favorite star (top-left corner; the page-wide [data-fav] handler in favorites.js toggles it) ---- */

  function favHtml() {
    var id = session.word.id;
    return (
      '<button type="button" class="btn btn-icon fav-toggle write-fav" id="write-fav" data-fav="' + id + '" aria-pressed="false">' +
      '<span aria-hidden="true"></span></button>'
    );
  }

  /** Update in place so the button keeps focus after a toggle. */
  function updateFav() {
    var btn = document.getElementById('write-fav');
    if (!btn || !session) return;
    var on = App.favorites.has(session.word.id);
    // In "From memory" the word is hidden, so the label must not name it.
    var label = state.mode === 'test' && !session.revealed
      ? t('favorite')
      : t('favoriteLabel', { word: session.form.hanzi });
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', label);
    btn.title = t('favorite');
    btn.firstChild.textContent = on ? '★' : '☆';
  }

  function relabel() {
    if (!session) return;
    updateFav();
    document.getElementById('write-head').innerHTML = headHtml();
    document.getElementById('write-controls').innerHTML = controlsHtml();
    document.getElementById('write-result').innerHTML = resultHtml();
    document.getElementById('write-record').innerHTML = recordHtml();
    el.area.querySelectorAll('.write-box').forEach(function (box, i) {
      box.setAttribute('aria-label', t('boxLabel', { n: i + 1 }));
    });
    updateCells();
    updateCounter();
    renderHint();
  }

  function renderHint() {
    // View mode needs no explanation: the Play button and speed buttons speak for themselves.
    if (!available || state.mode === 'view') {
      el.hint.innerHTML = '';
      return;
    }
    var text = { trace: 'writeHintTrace', test: 'writeHintTest' }[state.mode];
    el.hint.textContent = t(text);
  }

  function renderControls() {
    el.mode.querySelectorAll('[data-write-mode]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-write-mode') === state.mode));
    });
    el.order.querySelectorAll('[data-order]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-order') === state.order));
    });
    // Folded bar on phones: "Trace · By number"
    var modeKey = { view: 'modeView', trace: 'modeTrace', test: 'modeTest' }[state.mode];
    el.summary.textContent = t(modeKey) + ' · ' + t(state.order === 'shuffle' ? 'orderShuffle' : 'orderNumber');
    // "4 / 500": the word number, or the place in the shuffled order.
    var pos = state.order === 'shuffle' ? state.seq.indexOf(state.id) + 1 : state.id;
    el.position.textContent = pos + ' / ' + App.words.length;
  }

  /* ---- Box sizing ---- */

  function boxSize(n) {
    var boxes = el.area.querySelector('.write-boxes');
    var gap = n > 1 ? (window.innerWidth <= 480 ? 8 : 16) : 0;
    var max = n === 1 ? 320 : 240;
    var avail = boxes ? boxes.clientWidth : 320;
    return { size: Math.max(72, Math.floor(Math.min(max, (avail - gap * (n - 1)) / n))), gap: gap };
  }

  function applySize() {
    var boxes = el.area.querySelector('.write-boxes');
    var dim = boxSize(session.chars.length);
    boxes.style.setProperty('--box', dim.size + 'px');
    boxes.style.setProperty('--box-gap', dim.gap + 'px');
    return dim.size - 4; // minus the 2px border on each side
  }

  function onResize() {
    if (!session || el.panel.hidden) return;
    var before = session.inner;
    var inner = applySize();
    if (inner === before) return;
    session.inner = inner;
    session.writers.forEach(function (w) {
      if (w) w.updateDimensions({ width: inner, height: inner, padding: Math.round(inner * 0.06) });
    });
  }

  /* ---- Rendering a word ---- */

  function teardown() {
    runId++;
    if (!session) return;
    session.writers.forEach(function (w) {
      if (!w) return;
      w.cancelQuiz();
      w.pauseAnimation();
    });
    session.listeners.forEach(function (l) {
      document.removeEventListener(l[0], l[1], l[2]);
    });
    session = null;
  }

  function render() {
    if (el.panel.hidden) {
      dirty = true;
      return;
    }
    if (!loaded) {
      renderControls();
      el.area.innerHTML = '<p class="empty-state" role="status">' + esc(t('writeLoading')) + '</p>';
      renderHint();
      load().then(render);
      return;
    }
    if (!available) {
      renderControls();
      el.area.innerHTML = '<p class="empty-state">' + t('writeNoData') + '</p>';
      renderHint();
      return;
    }
    dirty = false;
    teardown();
    renderControls();

    var w = App.byId[state.id];
    var form = { hanzi: w.hanzi, pinyin: w.pinyin };
    var chars = Array.from(form.hanzi);

    session = {
      word: w,
      form: form,
      chars: chars,
      writers: [],
      counts: chars.map(function (ch) { return hasData(ch) ? STROKES[ch].strokes.length : 0; }),
      done: chars.map(function (ch) { return !hasData(ch); }),
      mistakes: chars.map(function () { return 0; }),
      hints: chars.map(function () { return 0; }),
      // Mistakes/hints from earlier attempts at a character ("↺ Again"), so retrying can't clean the record.
      carried: chars.map(function () { return 0; }),
      carriedHints: chars.map(function () { return 0; }),
      // Per-stroke score (1 / 0.5 / 0); a retried character keeps the lower score of each stroke.
      strokeScores: chars.map(function () { return []; }),
      hinted: chars.map(function () { return {}; }), // stroke numbers that showed a hint in this attempt
      listeners: [], // document listeners Hanzi Writer added, removed in teardown()
      strokesDone: chars.map(function () { return 0; }),
      active: -1,
      finished: false,
      revealed: false,
      run: runId,
    };
    session.total = sum(session.counts);

    el.area.innerHTML =
      '<div class="write-card">' +
      favHtml() +
      '<div class="write-head" id="write-head"></div>' +
      '<div class="write-boxes">' + chars.map(cellHtml).join('') + '</div>' +
      '<div class="write-controls" id="write-controls"></div>' +
      '<div id="write-result"></div>' +
      '<p class="write-record" id="write-record"></p>' +
      '</div>';

    session.inner = applySize();
    createWriters();
    relabel();

    if (state.mode === 'view') play();
    else startNext();
  }

  function createWriters() {
    var s = session;
    var sp = SPEEDS[state.speed];
    var c = colors();
    s.chars.forEach(function (ch, i) {
      if (!hasData(ch)) {
        s.writers[i] = null;
        return;
      }
      s.writers[i] = createWriter(s, document.getElementById('write-target-' + i), ch, {
        width: s.inner,
        height: s.inner,
        padding: Math.round(s.inner * 0.06),
        showCharacter: false,
        showOutline: state.mode !== 'test',
        strokeAnimationSpeed: sp.speed,
        delayBetweenStrokes: sp.delay,
        strokeColor: c.strokeColor,
        radicalColor: c.radicalColor,
        outlineColor: c.outlineColor,
        highlightColor: c.highlightColor,
        drawingColor: c.drawingColor,
        highlightCompleteColor: c.highlightCompleteColor,
        drawingWidth: Math.max(4, Math.round(s.inner / 30)),
        charDataLoader: function (char, onLoad, onError) {
          if (STROKES[char]) onLoad(STROKES[char]);
          else onError(new Error('No stroke data for ' + char));
        },
      });
    });
  }

  /**
   * HanziWriter.create adds mouseup/touchend listeners on document and never removes
   * them. Record them while creating so teardown() can remove them.
   */
  function createWriter(s, target, ch, options) {
    var add = document.addEventListener;
    document.addEventListener = function (type, fn, opts) {
      s.listeners.push([type, fn, opts]);
      return add.call(document, type, fn, opts);
    };
    try {
      return window.HanziWriter.create(target, ch, options);
    } finally {
      document.addEventListener = add;
    }
  }

  /** 0–100: average of the stroke scores over every stroke of the word. */
  function wordScore(s) {
    if (!s.total) return 0;
    var points = 0;
    s.strokeScores.forEach(function (list) {
      list.forEach(function (v) { points += v || 0; });
    });
    return Math.round((points / s.total) * 100);
  }

  /** ★★★ from 90, ★★ from 70, ★ below. */
  function stars(score) {
    return score >= 90 ? 3 : score >= 70 ? 2 : 1;
  }

  function scoreHtml(score) {
    var n = stars(score);
    return (
      '<p class="write-score"><strong>' + esc(t('writeScore', { s: score })) + '</strong> ' +
      '<span class="write-stars" aria-hidden="true">' + '★'.repeat(n) + '<span class="write-stars-off">' + '★'.repeat(3 - n) + '</span></span>' +
      '<span class="visually-hidden">' + esc(t('scoreStars', { n: n })) + '</span></p>'
    );
  }

  function totalMistakes(s) {
    return sum(s.carried) + sum(s.mistakes);
  }

  function totalHints(s) {
    return sum(s.carriedHints) + sum(s.hints);
  }

  /* ---- View mode: animate the whole word, stroke by stroke ---- */

  async function play() {
    var s = session;
    if (!s || state.mode !== 'view') return;
    var run = ++runId;
    s.run = run;
    var sp = SPEEDS[state.speed];
    s.strokesDone = s.chars.map(function () { return 0; });
    s.done = s.chars.map(function (ch) { return !hasData(ch); });
    s.active = -1;
    updateCells();
    updateCounter();

    await Promise.all(s.writers.map(function (w) { return w && w.hideCharacter({ duration: 0 }); }));

    for (var i = 0; i < s.chars.length; i++) {
      var w = s.writers[i];
      if (!w) continue;
      if (run !== runId) return;
      s.active = i;
      updateCells();
      for (var k = 0; k < s.counts[i]; k++) {
        await w.animateStroke(k);
        if (run !== runId) return;
        s.strokesDone[i] = k + 1;
        updateCounter();
        await sleep(sp.delay);
        if (run !== runId) return;
      }
      s.done[i] = true;
      await sleep(sp.delay);
    }
    if (run !== runId) return;
    s.active = -1;
    updateCells();
  }

  /* ---- Trace / test: quiz one box after another ---- */

  function startNext() {
    var s = session;
    if (!s) return;
    var i = s.done.indexOf(false);
    if (i === -1) finish();
    else startQuiz(i);
  }

  function startQuiz(i) {
    var s = session;
    var w = s.writers[i];
    var run = s.run;
    var threshold = HINT_AFTER[state.mode];
    s.active = i;
    s.strokesDone[i] = 0;
    s.carried[i] += s.mistakes[i];
    s.carriedHints[i] += s.hints[i];
    s.mistakes[i] = 0;
    s.hints[i] = 0;
    s.hinted[i] = {};
    updateCells();
    updateCounter();

    w.quiz({
      showHintAfterMisses: threshold,
      leniency: LENIENCY[state.mode],
      onMistake: function (d) {
        if (session !== s || run !== s.run) return;
        s.mistakes[i] = d.totalMistakes;
        if (d.mistakesOnStroke === threshold) {
          s.hints[i]++;
          s.hinted[i][d.strokeNum] = true;
        }
      },
      onCorrectStroke: function (d) {
        if (session !== s || run !== s.run) return;
        var score = s.hinted[i][d.strokeNum] ? 0 : d.mistakesOnStroke > 0 ? 0.5 : 1;
        var prev = s.strokeScores[i][d.strokeNum];
        s.strokeScores[i][d.strokeNum] = prev === undefined ? score : Math.min(prev, score);
        s.strokesDone[i] = d.strokeNum + 1;
        s.mistakes[i] = d.totalMistakes;
        updateCounter();
      },
      onComplete: function (d) {
        if (session !== s || run !== s.run) return;
        s.mistakes[i] = d.totalMistakes;
        s.strokesDone[i] = s.counts[i];
        s.done[i] = true;
        s.active = -1;
        updateCells();
        updateCounter();
        startNext();
      },
    });
  }

  function finish() {
    var s = session;
    s.finished = true;
    s.active = -1;
    if (state.mode === 'test' && !s.saved) {
      s.saved = true;
      saveRecord(s.word.id, totalMistakes(s), wordScore(s));
    }
    s.revealed = true;
    relabel();
    var next = document.querySelector('#write-result [data-write="next"]');
    if (next) next.focus({ preventScroll: true });
  }

  function retry(i) {
    var s = session;
    if (!s || state.mode === 'view' || !s.writers[i]) return;
    if (s.active >= 0 && s.writers[s.active]) {
      s.writers[s.active].cancelQuiz();
      s.strokesDone[s.active] = 0;
    }
    s.done[i] = false;
    s.finished = false;
    document.getElementById('write-result').innerHTML = '';
    startQuiz(i);
  }

  function applyColors() {
    if (!session) return;
    var c = colors();
    session.writers.forEach(function (w) {
      if (!w) return;
      Object.keys(c).forEach(function (key) {
        w.updateColor(key, c[key], { duration: 0 });
      });
    });
  }

  /* ---- Dots by tapping ---- */

  /**
   * Hanzi Writer ignores a stroke with fewer than two points, so tapping a dot (丶)
   * never counts. When the pen lifts without moving, add one short move (6px) along
   * the stroke being asked for, just before Hanzi Writer ends the stroke (pointerup
   * fires before mouseup / touchend). A dot then matches; a tap on a long stroke is
   * still far too short and counts as a mistake.
   */
  function initTapDots() {
    var tap = null;
    el.area.addEventListener('pointerdown', function (e) {
      var target = e.target.closest && e.target.closest('.write-target');
      tap = target ? { x: e.clientX, y: e.clientY, svg: target.querySelector('svg'), moved: false } : null;
    }, true);
    el.area.addEventListener('pointermove', function (e) {
      if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 1) tap.moved = true;
    }, true);
    document.addEventListener('pointerup', function () {
      var t = tap;
      tap = null;
      var s = session;
      if (!t || t.moved || !t.svg || !s || state.mode === 'view' || s.active < 0) return;
      var med = STROKES[s.chars[s.active]].medians[s.strokesDone[s.active]];
      if (!med) return;
      var a = med[0], z = med[med.length - 1];
      var dx = z[0] - a[0], dy = a[1] - z[1]; // stroke data has y pointing up
      var len = Math.hypot(dx, dy) || 1;
      t.svg.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true,
        clientX: t.x + (dx / len) * 6,
        clientY: t.y + (dy / len) * 6,
      }));
    }, true);
  }

  /* ---- Navigation ---- */

  function go(id) {
    var n = App.words.length;
    id = ((Math.round(id) - 1 + n) % n) + 1; // wrap around 1..n
    if (!App.byId[id]) return;
    state.id = id;
    App.storage.set('writeWord', id);
    if (!el.panel.hidden) history.replaceState(null, '', '#write/' + id);
    render();
  }

  /** New random order starting from the current word. */
  function reshuffle() {
    state.seq = App.util.shuffle(App.words.map(function (w) { return w.id; }).filter(function (id) {
      return id !== state.id;
    }));
    state.seq.unshift(state.id);
  }

  /** Previous (-1) / next (+1) word: by number, or through the shuffled order. */
  function step(dir) {
    if (state.order === 'number') return go(state.id + dir);
    var n = state.seq.length;
    var i = state.seq.indexOf(state.id);
    go(state.seq[(i + dir + n) % n]);
  }

  function speak() {
    if (!session) return;
    if (session.form.hanzi === session.word.hanzi) App.speech.speakWord(session.word);
    else App.speech.speak(session.form.hanzi);
  }

  /** Called by app.js whenever the writing tab becomes visible. */
  function show(arg) {
    var id = Number(arg);
    if (arg && App.byId[id] && id !== state.id) {
      state.id = id;
      App.storage.set('writeWord', id);
      dirty = true;
    }
    history.replaceState(null, '', '#write/' + state.id);
    if (dirty || !session) render();
    else onResize();
  }

  function handleKey(e) {
    var onButton = e.target.closest && e.target.closest('button, a');
    if (e.key === 'ArrowLeft') { step(-1); return true; }
    if (e.key === 'ArrowRight') { step(1); return true; }
    if (e.key === ' ' && !onButton && state.mode === 'view') { play(); return true; }
    if (e.key === 'r' || e.key === 'R') {
      if (state.mode === 'view') play();
      else render();
      return true;
    }
    if (e.key === 'p' || e.key === 'P') { speak(); return true; }
    return false;
  }

  /** Pencil link used by the word list and flashcards. */
  function linkHtml(w) {
    return (
      '<a class="btn btn-icon write-link" href="#write/' + w.id + '" aria-label="' +
      esc(t('writeLinkLabel', { word: w.hanzi })) + '" title="' + esc(t('writeLink')) + '">' + PENCIL + '</a>'
    );
  }

  function onAreaClick(e) {
    var retryBtn = e.target.closest('[data-write-retry]');
    if (retryBtn) return retry(Number(retryBtn.getAttribute('data-write-retry')));
    var speedBtn = e.target.closest('[data-write-speed]');
    if (speedBtn) {
      state.speed = speedBtn.getAttribute('data-write-speed');
      App.storage.set('writeSpeed', state.speed);
      return render(); // new animation speed needs fresh writers; replays from the start
    }
    var b = e.target.closest('[data-write]');
    if (!b) return;
    switch (b.getAttribute('data-write')) {
      case 'play': return play();
      case 'restart': return render();
      case 'prev': return step(-1);
      case 'next': return step(1);
      case 'speak': return speak();
    }
  }

  function init() {
    el.panel = document.getElementById('panel-write');
    el.area = document.getElementById('write-area');
    el.hint = document.getElementById('write-hint');
    el.mode = document.getElementById('write-mode');
    el.order = document.getElementById('write-order');
    el.position = document.getElementById('write-position');
    el.summary = document.getElementById('write-options-summary');
    App.foldBar(document.getElementById('write-toolbar'));


    el.area.addEventListener('click', onAreaClick);
    initTapDots();

    el.mode.addEventListener('click', function (e) {
      var b = e.target.closest('[data-write-mode]');
      if (!b) return;
      state.mode = b.getAttribute('data-write-mode');
      App.storage.set('writeMode', state.mode);
      render();
    });




    el.order.addEventListener('click', function (e) {
      var b = e.target.closest('[data-order]');
      if (!b) return;
      state.order = b.getAttribute('data-order');
      App.storage.set('writeOrder', state.order);
      if (state.order === 'shuffle') reshuffle();
      renderControls();
    });
    reshuffle();

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(onResize, 150);
    });

    // Language change: swap texts in place so a half-written word is kept.
    App.on('lang', function () {
      if (!available || !session) return render();
      renderControls();
      relabel();
    });
    App.on('theme', applyColors);
    App.on('favorites', updateFav);
  }

  App.writing = {
    init: init,
    show: show,
    handleKey: handleKey,
    linkHtml: linkHtml,
    record: record,
    recordCount: function () { return Object.keys(records).length; },
    score: function () { return session && session.finished ? wordScore(session) : null; },
  };
})(window.App);
