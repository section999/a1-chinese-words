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

  if (['all', 'learned', 'unlearned', 'favorites'].indexOf(state.filter) === -1) state.filter = 'all';

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
      if (state.filter === 'favorites' && !App.favorites.has(w.id)) return false;
      return matches(w, q, qFold);
    });
    list.sort(function (a, b) {
      return state.order === 'shuffle' ? state.rank[a.id] - state.rank[b.id] : a.id - b.id;
    });
    return list;
  }

  var CHECK =
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" ' +
    'd="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function learnedButton(w) {
    var on = App.progress.has(w.id);
    return (
      '<button type="button" class="btn btn-icon learned-toggle" data-learn="' + w.id + '" aria-pressed="' + on +
      '" aria-label="' + esc(t('markLearnedLabel', { word: w.hanzi })) + '" title="' + esc(t('markLearned')) + '">' +
      CHECK + '</button>'
    );
  }

  function rowHtml(w) {
    return (
      '<li class="word-row' + (App.progress.has(w.id) ? ' is-learned' : '') + '" data-id="' + w.id + '">' +
      '<span class="word-num">' + w.id + '</span>' +
      '<span class="hanzi" lang="zh-CN">' + esc(w.hanzi) + '</span>' +
      '<div class="word-info">' +
      '<div class="word-head">' + App.view.pinyinHtml(w) + '</div>' +
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
    el.toolbar.classList.toggle('is-filtered', state.filter !== 'all' || state.order !== 'number');
  }

  /* ---- Phones: sticky toolbar with Show / Order folded behind a button ---- */

  function isSticky() {
    return getComputedStyle(el.toolbar).position === 'sticky';
  }

  function setOptionsOpen(open) {
    el.toolbar.classList.toggle('is-open', open);
    el.optionsToggle.setAttribute('aria-expanded', String(open));
  }

  /** The toolbar sticks right under the header, whose height changes with the screen width. */
  function measureHeader() {
    var h = document.querySelector('.site-header').getBoundingClientRect().height;
    document.documentElement.style.setProperty('--header-h', h + 'px');
  }

  /** After the list changes while scrolled down, start it again right under the sticky toolbar. */
  function scrollToListTop() {
    if (el.panel.hidden || !isSticky()) return;
    var gap = el.meta.getBoundingClientRect().top - el.toolbar.getBoundingClientRect().bottom;
    if (gap < 0) window.scrollBy(0, gap);
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
    // No favorites yet: explain how to add them instead of "No matching words".
    el.empty.textContent = state.filter === 'favorites' && !App.favorites.size() ? t('favoritesEmpty') : t('noResults');
    updatePractice();
    el.count.textContent = t('resultCount', { n: list.length });
  }

  /** "Practice with flashcards" under the Favorites filter, while there are favorites. */
  function updatePractice() {
    el.practice.hidden = !(state.filter === 'favorites' && App.favorites.size() > 0);
  }

  /** Update one row in place so the toggle keeps focus. */
  function updateRow(id) {
    var row = el.list.querySelector('[data-id="' + id + '"]');
    if (!row) return;
    var on = App.progress.has(id);
    row.classList.toggle('is-learned', on);
    var btn = row.querySelector('[data-learn]');
    btn.setAttribute('aria-pressed', String(on));
  }

  function init() {
    el.search = document.getElementById('search');
    el.filter = document.getElementById('list-filter');
    el.order = document.getElementById('list-order');
    el.panel = document.getElementById('panel-list');
    el.list = document.getElementById('word-list');
    el.practice = document.getElementById('list-practice');
    el.empty = document.getElementById('list-empty');
    el.count = document.getElementById('result-count');
    el.toolbar = document.getElementById('list-toolbar');
    el.optionsToggle = document.getElementById('list-options-toggle');
    el.meta = el.panel.querySelector('.list-meta');

    measureHeader();
    window.addEventListener('resize', measureHeader);

    el.optionsToggle.addEventListener('click', function () {
      setOptionsOpen(!el.toolbar.classList.contains('is-open'));
    });

    // Scrolling the list (not the toolbar) folds the options away again.
    function foldOnScroll(e) {
      if (el.toolbar.classList.contains('is-open') && !el.toolbar.contains(e.target)) setOptionsOpen(false);
    }
    document.addEventListener('touchmove', foldOnScroll, { passive: true });
    document.addEventListener('wheel', foldOnScroll, { passive: true });

    el.search.addEventListener('input', function () {
      state.query = el.search.value;
      render();
      scrollToListTop();
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
      scrollToListTop();
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
    // Update just the favorite button so focus stays on the row (an un-starred word stays
    // in the Favorites list until the filter is used again). Changes from other views re-filter on show().
    App.on('favorites', function (p) {
      if (el.panel.hidden) dirty = true;
      var btn = el.list.querySelector('[data-fav="' + p.id + '"]');
      if (btn) btn.setAttribute('aria-pressed', String(App.favorites.has(p.id)));
      updatePractice();
    });

    el.practice.addEventListener('click', function () {
      App.cards.setMode('favorites');
      location.hash = 'cards';
    });

    render();
  }

  function setFilter(filter) {
    state.filter = filter;
    App.storage.set('listFilter', filter);
    render();
    scrollToListTop();
  }

  /** Called by app.js whenever the word list becomes visible. */
  function show() {
    if (!dirty) return;
    dirty = false;
    render();
  }

  App.list = { init: init, show: show, render: render, setFilter: setFilter };
})(window.App);
