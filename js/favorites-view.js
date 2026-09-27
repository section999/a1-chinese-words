/* Favorites page: the starred words, plus a flashcard review of just those words. */
(function (App) {
  'use strict';

  var t = App.i18n.t;
  var esc = App.util.escapeHtml;

  var el = {};

  function rowHtml(w) {
    return (
      '<li class="word-row" data-id="' + w.id + '">' +
      '<span class="word-num">' + w.id + '</span>' +
      '<span class="hanzi" lang="zh-CN">' + esc(w.hanzi) + '</span>' +
      '<div class="word-info">' +
      '<div class="word-head">' + App.view.pinyinHtml(w) + '</div>' +
      '<p class="word-meaning">' + esc(App.view.meaning(w)) + '</p>' +
      '</div>' +
      '<div class="word-actions">' + App.speech.button(w) + App.writing.linkHtml(w) + App.favorites.buttonHtml(w) + '</div>' +
      '</li>'
    );
  }

  function render() {
    if (el.panel.hidden) return;
    // If a star here had focus, move focus to the star now at the same position.
    var stars = Array.prototype.slice.call(el.area.querySelectorAll('[data-fav]'));
    var focusAt = stars.indexOf(document.activeElement);
    draw();
    if (focusAt === -1) return;
    var next = el.area.querySelectorAll('[data-fav]');
    var target = next[Math.min(focusAt, next.length - 1)] || el.area.querySelector('[data-favorites="practice"]');
    if (target) target.focus();
    else {
      el.area.setAttribute('tabindex', '-1');
      el.area.focus(); // empty list: keep focus in the panel
    }
  }

  function draw() {
    var ids = App.favorites.ids();
    if (!ids.length) {
      el.area.innerHTML = '<p class="empty-state">' + esc(t('favoritesEmpty')) + '</p>';
      return;
    }
    el.area.innerHTML =
      '<div class="favorites-head">' +
      '<p class="result-count">' + esc(t('resultCount', { n: ids.length })) + '</p>' +
      '<button type="button" class="btn btn-primary" data-favorites="practice">' + esc(t('favoritesPractice')) + ' →</button>' +
      '</div>' +
      '<ul class="word-list">' + ids.map(function (id) { return rowHtml(App.byId[id]); }).join('') + '</ul>';
  }

  function init() {
    el.panel = document.getElementById('panel-favorites');
    el.area = document.getElementById('favorites-area');

    el.area.addEventListener('click', function (e) {
      if (!e.target.closest('[data-favorites="practice"]')) return;
      App.cards.setMode('favorites');
      location.hash = 'cards';
    });

    ['lang', 'favorites'].forEach(function (ev) {
      App.on(ev, render);
    });
  }

  /** Called by app.js whenever this view becomes visible. */
  App.favoritesView = { init: init, show: render };
})(window.App);
