/* Home (front page): one call to action that follows the learner's state, progress, shortcuts. */
(function (App) {
  'use strict';

  var t = App.i18n.t;
  var esc = App.util.escapeHtml;

  var el = {};

  /** What the big button does right now: open a flashcard deck, or (href) go to another view. */
  function primary() {
    var due = App.srs.dueCount();
    var learned = App.progress.count();
    if (due) return { label: t('homeReview', { n: due }), deck: 'review' };
    // New words: the word list, showing only the words not learned yet.
    if (!learned) return { label: t('homeStart'), href: '#list', filter: 'unlearned' };
    if (learned < App.words.length) return { label: t('homeLearnNew'), href: '#list', filter: 'unlearned' };
    return { label: t('homePracticeAll'), deck: 'all' };
  }

  function actionsHtml() {
    var p = primary();
    return p.href
      ? '<a class="btn btn-primary btn-large" href="' + p.href + '" data-home-filter="' + p.filter + '">' +
        esc(p.label) + ' →</a>'
      : '<button type="button" class="btn btn-primary btn-large" data-home-deck="' + p.deck + '">' +
        esc(p.label) + ' →</button>';
  }

  /** "Next review: Sep 29 · words due: 3", so learners know when to come back. */
  function nextReviewHtml() {
    var next = App.srs.upcoming();
    return next ? '<p class="muted">' + esc(t('reviewNext', { date: App.srs.formatDate(next.date), n: next.count })) + '</p>' : '';
  }

  /** Only for returning learners; a first visit stays short. */
  function progressHtml() {
    var n = App.progress.count();
    var written = App.writing.recordCount();
    if (!n && !written) return '';
    var total = App.words.length;
    var pct = Math.round((n / total) * 100);
    var cells = 20;
    var filled = Math.round((n / total) * cells);
    return (
      '<div class="home-progress">' +
      '<h2 class="home-subtitle">' + esc(t('homeProgress')) + '</h2>' +
      '<p>' + esc(t('statusLearned', { n: n, total: total, pct: pct })) + '</p>' +
      '<p class="home-bar" aria-hidden="true">[' + '#'.repeat(filled) + '-'.repeat(cells - filled) + ']</p>' +
      (written ? '<p class="muted">' + esc(t('homeWritten', { n: written })) + '</p>' : '') +
      nextReviewHtml() +
      '</div>'
    );
  }

  function render() {
    if (el.panel.hidden) return;
    el.actions.innerHTML = actionsHtml();
    el.progress.innerHTML = progressHtml();
  }

  /** Called by app.js whenever the home page becomes visible (the due count may have changed). */
  function show() {
    render();
  }

  function init() {
    el.panel = document.getElementById('panel-home');
    el.actions = document.getElementById('home-actions');
    el.progress = document.getElementById('home-progress');

    el.actions.addEventListener('click', function (e) {
      var link = e.target.closest('[data-home-filter]');
      if (link) return App.list.setFilter(link.getAttribute('data-home-filter')); // the link then navigates
      var b = e.target.closest('[data-home-deck]');
      if (!b) return;
      App.cards.setMode(b.getAttribute('data-home-deck'));
      location.hash = 'cards';
    });
    document.getElementById('home-import').addEventListener('click', App.backup.pick);

    ['lang', 'progress', 'srs', 'writing'].forEach(function (ev) {
      App.on(ev, render);
    });
  }

  App.home = { init: init, show: show };
})(window.App);
