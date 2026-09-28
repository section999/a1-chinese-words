/* Home (front page): the "Start learning" button, progress summary, shortcuts. */
(function (App) {
  'use strict';

  var t = App.i18n.t;
  var esc = App.util.escapeHtml;

  var el = {};

  /** Always "Start learning": the word list, showing only the words not learned yet. */
  function actionsHtml() {
    return (
      '<a class="btn btn-primary btn-large" href="#list" data-home-filter="unlearned">' +
      esc(t('homeStart')) + ' →</a>'
    );
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
      '</div>'
    );
  }

  function render() {
    if (el.panel.hidden) return;
    el.actions.innerHTML = actionsHtml();
    el.progress.innerHTML = progressHtml();
  }

  /** Called by app.js whenever the home page becomes visible (progress may have changed elsewhere). */
  function show() {
    render();
  }

  function init() {
    el.panel = document.getElementById('panel-home');
    el.actions = document.getElementById('home-actions');
    el.progress = document.getElementById('home-progress');

    el.actions.addEventListener('click', function (e) {
      var link = e.target.closest('[data-home-filter]');
      if (link) App.list.setFilter(link.getAttribute('data-home-filter')); // the link then navigates
    });
    document.getElementById('home-import').addEventListener('click', App.backup.pick);

    ['lang', 'progress', 'writing'].forEach(function (ev) {
      App.on(ev, render);
    });
  }

  App.home = { init: init, show: show };
})(window.App);
