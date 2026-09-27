/* Word list: search (hanzi / pinyin / meaning), learned filter, number / shuffled order. */
(function (App) {
  'use strict';

  var t = App.i18n.t;
  var esc = App.util.escapeHtml;
  var fold = App.util.foldPinyin;

  var state = {
    query: '',
    filter: App.storage.get('listFilter', 'all'),
    order: App.storage.get('listOrder', 'number') === 'shuffle' ? 'shuffle' : 'number',
    rank: {}, // word id -> position in the current shuffle
  };

  if (['all', 'learned', 'unlearned'].indexOf(state.filter) === -1) state.filter = 'all';

  var el = {};
  var dirty = false; // progress changed in another view while the list was hidden

  // Precomputed search keys
  var keys = {};
  App.words.forEach(function (w) {
    var hanzi = [w.hanzi].concat(
      w.variants.map(function (v) { return v.hanzi; }),
      w.example ? [w.example.hanzi] : []
    );
    var pinyin = [w.pinyin].concat(
      w.pinyinAlt,
      w.variants.map(function (v) { return v.pinyin; })
    );
    keys[w.id] = {
      hanzi: hanzi.join(' '),
      pinyin: pinyin.map(fold).join(' '),
      pinyinToned: pinyin.map(toned).join(' '),
    };
  });

  /** Like foldPinyin but keeps tone marks, for queries typed with them ("bà"). */
  function toned(s) {
    return String(s).normalize('NFC').toLowerCase().replace(/[\s'’\-·/]/g, '');
  }

  function hasToneMarks(s) {
    return /[̀-ͯ]/.test(String(s).normalize('NFD').replace(/ü/gi, ''));
  }

  function matches(w, q, qFold) {
    if (!q) return true;
    var k = keys[w.id];
    if (k.hanzi.indexOf(q) !== -1) return true;
    if (qFold && /[a-z]/.test(qFold)) {
      var hit = hasToneMarks(q) ? k.pinyinToned.indexOf(toned(q)) !== -1 : k.pinyin.indexOf(qFold) !== -1;
      if (hit) return true;
    }
    var ql = q.toLowerCase();
    return App.view.meaning(w).toLowerCase().indexOf(ql) !== -1 || w.en.toLowerCase().indexOf(ql) !== -1;
  }

  function visibleWords() {
    var q = state.query.trim();
    var qFold = fold(q);
    var list = App.words.filter(function (w) {
      if (state.filter === 'learned' && !App.progress.has(w.id)) return false;
      if (state.filter === 'unlearned' && App.progress.has(w.id)) return false;
      return matches(w, q, qFold);
    });
    list.sort(function (a, b) {
      return state.order === 'shuffle' ? state.rank[a.id] - state.rank[b.id] : a.id - b.id;
    });
    return list;
  }

  function learnedButton(w) {
    var on = App.progress.has(w.id);
    return (
      '<button type="button" class="btn btn-small learned-toggle" data-learn="' + w.id + '" aria-pressed="' + on +
      '" aria-label="' + esc(t('markLearnedLabel', { word: w.hanzi })) + '">' +
      esc(on ? '✓ ' + t('learnedOn') : t('markLearned')) + '</button>'
    );
  }

  function writtenBadge(w) {
    var r = App.writing.record(w.id);
    if (!r) return '';
    var label = t('writtenBadge') + ' · ' + t('writeRecord', { m: r.best, n: r.tries });
    return '<span class="write-badge" title="' + esc(label) + '">✍<span class="visually-hidden"> ' + esc(label) + '</span></span>';
  }

  function rowHtml(w) {
    return (
      '<li class="word-row' + (App.progress.has(w.id) ? ' is-learned' : '') + '" data-id="' + w.id + '">' +
      '<span class="word-num">' + w.id + '</span>' +
      '<span class="hanzi" lang="zh-CN">' + esc(w.hanzi) + '</span>' +
      '<div class="word-info">' +
      '<div class="word-head">' + App.view.pinyinHtml(w) + writtenBadge(w) + '</div>' +
      '<p class="word-meaning">' + esc(App.view.meaning(w)) + '</p>' +
      App.view.extrasHtml(w) +
      '</div>' +
      '<div class="word-actions">' + App.speech.button(w) + App.writing.linkHtml(w) + learnedButton(w) + App.favorites.buttonHtml(w) + '</div>' +
      '</li>'
    );
  }

  function renderControls() {
    el.filter.querySelectorAll('[data-filter]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === state.filter));
    });
    el.order.querySelectorAll('[data-order]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-order') === state.order));
    });
  }

  /** New random order; kept until Shuffle is pressed again so re-renders don't reorder. */
  function reshuffle() {
    state.rank = {};
    App.util.shuffle(App.words.map(function (w) { return w.id; })).forEach(function (id, i) {
      state.rank[id] = i;
    });
  }

  function render() {
    renderControls();
    var list = visibleWords();
    el.list.innerHTML = list.map(rowHtml).join('');
    el.empty.hidden = list.length > 0;
    el.count.textContent = t('resultCount', { n: list.length });
  }

  /** Update one row in place so the toggle keeps focus. */
  function updateRow(id) {
    var row = el.list.querySelector('[data-id="' + id + '"]');
    if (!row) return;
    var on = App.progress.has(id);
    row.classList.toggle('is-learned', on);
    var btn = row.querySelector('[data-learn]');
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? '✓ ' + t('learnedOn') : t('markLearned');
  }

  function init() {
    el.search = document.getElementById('search');
    el.filter = document.getElementById('list-filter');
    el.order = document.getElementById('list-order');
    el.panel = document.getElementById('panel-list');
    el.list = document.getElementById('word-list');
    el.empty = document.getElementById('list-empty');
    el.count = document.getElementById('result-count');

    el.search.addEventListener('input', function () {
      state.query = el.search.value;
      render();
    });

    el.filter.addEventListener('click', function (e) {
      var b = e.target.closest('[data-filter]');
      if (!b) return;
      setFilter(b.getAttribute('data-filter'));
    });

    el.order.addEventListener('click', function (e) {
      var b = e.target.closest('[data-order]');
      if (!b) return;
      state.order = b.getAttribute('data-order');
      App.storage.set('listOrder', state.order);
      if (state.order === 'shuffle') reshuffle();
      render();
    });

    if (state.order === 'shuffle') reshuffle();

    el.list.addEventListener('click', function (e) {
      var b = e.target.closest('[data-learn]');
      if (!b) return;
      App.progress.toggle(Number(b.getAttribute('data-learn')));
    });

    document.getElementById('reset-progress').addEventListener('click', function () {
      if (App.progress.count() === 0) return;
      if (!window.confirm(t('confirmReset'))) return;
      App.progress.clear();
    });

    App.on('progress', function (p) {
      if (p.id === null) return render();
      // In-list toggles update their row in place (keeps focus; the row stays until
      // the filter is used again). Changes from other views re-filter on show().
      if (el.panel.hidden) dirty = true;
      else updateRow(p.id);
    });
    App.on('lang', render);
    App.on('writing', render);
    // Update just the favorite button so focus stays on the row.
    App.on('favorites', function (p) {
      var btn = el.list.querySelector('[data-fav="' + p.id + '"]');
      if (btn) btn.setAttribute('aria-pressed', String(App.favorites.has(p.id)));
    });

    render();
  }

  function setFilter(filter) {
    state.filter = filter;
    App.storage.set('listFilter', filter);
    render();
  }

  /** Called by app.js whenever the word list becomes visible. */
  function show() {
    if (!dirty) return;
    dirty = false;
    render();
  }

  App.list = { init: init, show: show, render: render, setFilter: setFilter };
})(window.App);
