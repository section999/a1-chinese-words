/* Bootstraps the app: home + tabs, menu, language, theme, learned-words progress, shared handlers. */
(function (App) {
  'use strict';

  var t = App.i18n.t;
  var TABS = ['list', 'cards', 'quiz', 'write', 'favorites'];
  var VIEWS = ['home'].concat(TABS);
  var activeTab = null;

  /* ---- Views (synced with location.hash so reload/back keep the view) ---- */

  /** name: view id (no hash = home); arg: optional part after "/" in the hash (#write/75 -> "75"). */
  function showTab(name, arg) {
    if (VIEWS.indexOf(name) === -1) name = 'home';
    var wasHome = activeTab === 'home';
    var home = name === 'home';
    activeTab = name;

    // The home page hides the tabs (see .is-home in the CSS).
    document.body.classList.toggle('is-home', home);
    document.getElementById('panel-home').hidden = !home;
    TABS.forEach(function (tab) {
      var selected = tab === name;
      var btn = document.getElementById('tab-' + tab);
      btn.setAttribute('aria-selected', String(selected));
      btn.tabIndex = selected ? 0 : -1;
      document.getElementById('panel-' + tab).hidden = !selected;
    });
    document.querySelectorAll('.menu-link').forEach(function (a) {
      if (a.getAttribute('data-view') === name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    if (!home) revealTab(document.getElementById('tab-' + name));
    if (home) App.home.show();
    if (name === 'write') App.writing.show(arg);
    if (name === 'favorites') App.favoritesView.show();
    if (name === 'list') App.list.show();
    if (name === 'cards') App.cards.show();
    if (wasHome !== home) window.scrollTo(0, 0);
  }

  /** Phones can't fit all tabs: scroll the tab bar so the selected tab is visible. */
  function revealTab(btn) {
    var bar = btn.parentNode;
    var b = bar.getBoundingClientRect();
    var r = btn.getBoundingClientRect();
    if (r.left < b.left) bar.scrollLeft -= b.left - r.left + 24;
    else if (r.right > b.right) bar.scrollLeft += r.right - b.right + 24;
    updateTabFade();
  }

  /** Fade the edge(s) of the tab bar that have more tabs behind them. */
  function updateTabFade() {
    var bar = document.querySelector('.tabs');
    var max = bar.scrollWidth - bar.clientWidth;
    bar.classList.toggle('more-left', bar.scrollLeft > 2);
    bar.classList.toggle('more-right', bar.scrollLeft < max - 2);
  }

  /** After a link hid the element that had focus, continue from the top of the content. */
  function keepFocus() {
    var a = document.activeElement;
    var main = document.getElementById('main');
    if (!a || a === document.body || (a !== main && !a.offsetParent)) main.focus({ preventScroll: true });
  }

  function parseHash() {
    var parts = location.hash.replace('#', '').split('/');
    return { tab: parts[0], arg: parts[1] };
  }

  function initTabs() {
    var tablist = document.querySelector('.tabs');
    tablist.addEventListener('scroll', updateTabFade, { passive: true });
    window.addEventListener('resize', updateTabFade);
    tablist.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tab]');
      if (!b) return;
      var name = b.getAttribute('data-tab');
      if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
      showTab(name);
    });

    // Arrow keys move between tabs (WAI-ARIA tabs pattern).
    tablist.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var i = TABS.indexOf(activeTab);
      var next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
      history.replaceState(null, '', '#' + next);
      showTab(next);
      document.getElementById('tab-' + next).focus();
      e.preventDefault();
      e.stopPropagation();
    });

    window.addEventListener('hashchange', function () {
      var h = parseHash();
      showTab(h.tab, h.arg);
      keepFocus();
    });
    var h = parseHash();
    showTab(h.tab, h.arg);
  }

  /* ---- Language ---- */

  function renderLangButtons() {
    var current = document.getElementById('menu-lang-current');
    document.querySelectorAll('[data-lang]').forEach(function (b) {
      var on = b.getAttribute('data-lang') === App.i18n.lang();
      b.setAttribute('aria-pressed', String(on));
      if (on) {
        // Shown on the folded "Language" row, in that language's own name.
        current.textContent = b.textContent;
        current.lang = b.lang;
      }
    });
  }

  function initLang() {
    document.querySelector('.site-header').addEventListener('click', function (e) {
      var b = e.target.closest('[data-lang]');
      if (b) App.i18n.setLang(b.getAttribute('data-lang'));
    });
    App.on('lang', function () {
      renderLangButtons();
      renderTheme();
      renderStatus();
    });
    renderLangButtons();
  }

  /* ---- Header menu (disclosure: navigation + language) ---- */

  function initMenu() {
    var btn = document.getElementById('menu-toggle');
    var menu = document.getElementById('site-menu');

    function setOpen(open, focusButton) {
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      var label = t(open ? 'menuClose' : 'menuOpen');
      btn.setAttribute('aria-label', label);
      btn.title = label;
      if (!open) {
        // Language and Progress start folded every time the menu opens.
        menu.querySelectorAll('details').forEach(function (d) { d.open = false; });
        if (focusButton) btn.focus();
      }
    }

    btn.addEventListener('click', function () {
      setOpen(menu.hidden);
    });
    // Navigating closes the menu; picking a language keeps it open so the change is visible.
    menu.addEventListener('click', function (e) {
      if (e.target.closest('.menu-link')) setOpen(false);
    });
    // Only real clicks count: the export download is a script click on a link outside the menu.
    document.addEventListener('click', function (e) {
      if (!e.isTrusted) return;
      if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) {
        setOpen(false, true);
        e.preventDefault();
      }
    });
    App.on('lang', function () {
      setOpen(!menu.hidden);
    });
    setOpen(false);
  }

  /* ---- Theme ---- */

  function theme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function renderTheme() {
    var btn = document.getElementById('theme-toggle');
    var toLight = theme() === 'dark';
    var label = t(toLight ? 'themeToLightLabel' : 'themeToDarkLabel');
    btn.textContent = toLight ? '☀' : '☾';
    btn.setAttribute('aria-label', label);
    btn.title = label;
  }

  function initTheme() {
    document.getElementById('theme-toggle').addEventListener('click', function () {
      var next = theme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      App.storage.set('theme', next);
      renderTheme();
      App.emit('theme', next);
    });
    renderTheme();
  }

  /* ---- Status line: learned [██████░░░░] n/500 ---- */

  function renderStatus() {
    var n = App.progress.count();
    var total = App.words.length;
    var pct = total ? Math.round((n / total) * 100) : 0;
    var cells = 20;
    var filled = total ? Math.round((n / total) * cells) : 0;
    document.getElementById('status-text').textContent =
      t('statusLearned', { n: n, total: total, pct: pct });
    document.getElementById('status-bar').textContent =
      '[' + '#'.repeat(filled) + '-'.repeat(cells - filled) + ']';
  }

  /* ---- Misc ---- */

  function initSpeakButtons() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-speak]');
      if (b) App.speech.speakWord(App.byId[b.getAttribute('data-speak')]);
    });
  }

  function initKeys() {
    document.addEventListener('keydown', function (e) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || App.util.isTyping(e)) return;
      var handled = false;
      if (activeTab === 'cards') handled = App.cards.handleKey(e);
      else if (activeTab === 'quiz') handled = App.quiz.handleKey(e);
      else if (activeTab === 'write') handled = App.writing.handleKey(e);
      if (handled) e.preventDefault();
    });
  }

  function init() {
    if (!App.words.length) {
      document.getElementById('main').innerHTML =
        '<p class="empty-state">data/vocabulary.js is missing. Run: node scripts/convert.js</p>';
      return;
    }
    App.i18n.apply();
    initLang();
    initTheme();
    initSpeakButtons();
    initKeys();
    App.list.init();
    App.cards.init();
    App.quiz.init();
    App.writing.init();
    App.backup.init();
    App.home.init();
    App.favoritesView.init();
    initMenu();
    initTabs(); // last: showing a view needs every module ready
    App.on('progress', renderStatus);
    App.on('srs', renderStatus);
    renderStatus();
  }

  init();
})(window.App);
