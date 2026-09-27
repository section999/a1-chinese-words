/* Favorite words: marked in the word list, shown on the Favorites page. */
(function (App) {
  'use strict';

  var favs = {};
  var stored = App.storage.get('favorites', []);
  (Array.isArray(stored) ? stored : []).forEach(function (x) {
    var id = App.util.wordId(x);
    if (id !== null) favs[id] = true;
  });

  function save(id) {
    App.storage.set('favorites', App.favorites.ids());
    App.emit('favorites', { id: id });
  }

  App.favorites = {
    has: function (id) {
      return !!favs[id];
    },

    size: function () {
      return Object.keys(favs).length;
    },

    toggle: function (id) {
      if (favs[id]) delete favs[id];
      else favs[id] = true;
      save(id);
    },

    /** By word number. */
    ids: function () {
      return Object.keys(favs).map(Number).sort(function (a, b) { return a - b; });
    },

    /** Favorite toggle used in the word list and on the Favorites page. */
    buttonHtml: function (w) {
      var on = !!favs[w.id];
      return (
        '<button type="button" class="btn btn-small fav-toggle" data-fav="' + w.id + '" aria-pressed="' + on +
        '" aria-label="' + App.util.escapeHtml(App.i18n.t('favoriteLabel', { word: w.hanzi })) + '">' +
        App.util.escapeHtml(App.i18n.t('favorite')) + '</button>'
      );
    },
  };

  // One handler for every favorite button on the page.
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fav]');
    if (b) App.favorites.toggle(Number(b.getAttribute('data-fav')));
  });
})(window.App);
