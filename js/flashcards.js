/* Flashcards: hanzi on the front, pinyin + meaning on the back, know / don't know. */
(function (App) {
  'use strict';

  var t = App.i18n.t;
  var esc = App.util.escapeHtml;

  var MODES = ['all', 'learned', 'unlearned', 'favorites'];

  var state = {
    mode: App.storage.get('deckMode', 'unlearned'),
    order: App.storage.get('deckOrder', 'number'),
    deck: [],
    index: 0,
    flipped: false,
    known: 0,
    unknown: [],
  };

  if (MODES.indexOf(state.mode) === -1) state.mode = 'unlearned';
  if (state.order !== 'shuffle') state.order = 'number';

  var el = {};
  var answering = false; // our own progress changes must not trigger a rebuild

  function build(ids) {
    if (!ids) {
      ids = App.words
        .filter(function (w) {
          if (state.mode === 'favorites') return App.favorites.has(w.id);
          if (state.mode === 'learned') return App.progress.has(w.id);
          return state.mode === 'all' || !App.progress.has(w.id);
        })
        .map(function (w) { return w.id; });
    }
    ids = ids.slice().sort(function (a, b) { return a - b; });
    state.deck = state.order === 'shuffle' ? App.util.shuffle(ids) : ids;
    state.index = 0;
    state.flipped = false;
    state.known = 0;
    state.unknown = [];
  }

  function current() {
    return App.byId[state.deck[state.index]];
  }

  /** ☆ / ★ in the card's top-left corner. Outside the card button, so tapping it doesn't flip the card. */
  function favStarHtml(w) {
    var on = App.favorites.has(w.id);
    return (
      '<button type="button" class="card-fav" data-fav="' + w.id + '" aria-pressed="' + on + '" aria-label="' +
      esc(t('favoriteLabel', { word: w.hanzi })) + '" title="' + esc(t('favorite')) + '">' + (on ? '★' : '☆') + '</button>'
    );
  }

  function cardHtml(w) {
    var f = state.flipped;
    return (
      '<p class="deck-progress">' +
      // The Favorites deck has no button of its own, so name it here.
      (state.mode === 'favorites' ? '★ ' + esc(t('tabFavorites')) + ' · ' : '') +
      (state.index + 1) + ' / ' + state.deck.length +
      '</p>' +
      '<div class="card-scene">' +
      favStarHtml(w) +
      '<button type="button" class="card' + (f ? ' is-flipped' : '') + '" id="flashcard">' +
      '<span class="card-face card-front"' + (f ? ' aria-hidden="true"' : '') + '>' +
      '<span class="hanzi" lang="zh-CN">' + esc(w.hanzi) + '</span>' +
      '</span>' +
      '<span class="card-face card-back"' + (f ? '' : ' aria-hidden="true"') + '>' +
      '<span>' + App.view.pinyinHtml(w) + '</span>' +
      '<span class="card-meaning">' + esc(App.view.meaning(w)) + '</span>' +
      '</span>' +
      '</button>' +
      '</div>' +
      '<div class="card-controls">' +
      App.speech.button(w) +
      App.writing.linkHtml(w) +
      '<button type="button" class="btn btn-bad" data-card="unknown"><span class="card-arrow" aria-hidden="true">← </span>' + esc(t('dontKnow')) + '</button>' +
      '<button type="button" class="btn btn-good" data-card="known">' + esc(t('know')) + '<span class="card-arrow" aria-hidden="true"> →</span></button>' +
      '</div>'
    );
  }

  function summaryHtml() {
    if (state.deck.length === 0 && state.mode === 'favorites') {
      return (
        '<div class="deck-summary"><p>' + esc(t('favoritesEmpty')) + '</p>' +
        '<div class="button-row"><button type="button" class="btn btn-primary" data-card="deck-unlearned">' +
        esc(t('filterUnlearned')) + ' →</button></div></div>'
      );
    }
    if (state.deck.length === 0 && state.mode === 'learned') {
      return (
        '<div class="deck-summary"><p>' + esc(t('deckNoLearned')) + '</p>' +
        '<div class="button-row"><button type="button" class="btn btn-primary" data-card="deck-unlearned">' +
        esc(t('filterUnlearned')) + ' →</button></div></div>'
      );
    }
    if (state.deck.length === 0) {
      return (
        '<div class="deck-summary"><p>' + esc(t('deckEmpty')) + '</p>' +
        '<div class="button-row"><button type="button" class="btn btn-primary" data-card="deck-all">' +
        esc(t('filterAll')) + ' →</button></div></div>'
      );
    }
    var buttons = '';
    if (state.unknown.length) {
      buttons +=
        '<button type="button" class="btn btn-primary" data-card="review">' +
        esc(t('reviewUnknown', { n: state.unknown.length })) + '</button>';
    }
    buttons += '<button type="button" class="btn" data-card="restart">' + esc(t('restartDeck')) + '</button>';
    return (
      '<div class="deck-summary"><p>' +
      esc(t('deckDone', { known: state.known, unknown: state.unknown.length })) +
      '</p>' +
      '<div class="button-row">' + buttons + '</div></div>'
    );
  }

  function renderControls() {
    el.mode.querySelectorAll('[data-deck]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-deck') === state.mode));
    });
    el.order.querySelectorAll('[data-order]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-order') === state.order));
    });
  }

  function render() {
    var hadFocus = el.area.contains(document.activeElement);
    renderControls();
    var w = current();
    el.area.innerHTML = w ? cardHtml(w) : summaryHtml();
    // Under the buttons: how to flip.
    el.hint.innerHTML = w ? esc(t('flipHint')) : '';
    if (hadFocus) {
      var target = el.area.querySelector('#flashcard') || el.area.querySelector('.btn-primary, .btn');
      if (target) target.focus();
    }
  }

  function flip() {
    var card = document.getElementById('flashcard');
    if (!card) return;
    state.flipped = !state.flipped;
    card.classList.toggle('is-flipped', state.flipped);
    var w = current();
    el.live.textContent = state.flipped && w ? w.pinyin + ', ' + App.view.meaning(w) : '';
    // Only the visible face is exposed to screen readers.
    var faces = card.querySelectorAll('.card-face');
    [state.flipped, !state.flipped].forEach(function (hidden, i) {
      if (hidden) faces[i].setAttribute('aria-hidden', 'true');
      else faces[i].removeAttribute('aria-hidden');
    });
  }

  function answer(knows) {
    var w = current();
    if (!w) return;
    answering = true;
    // "I don't know" leaves a learned word learned, so a practice round in All / Learned can't wipe progress.
    if (knows) App.progress.set(w.id, true);
    answering = false;
    if (knows) state.known++;
    else state.unknown.push(w.id);
    state.index++;
    state.flipped = false;
    render();
  }

  function untouched() {
    return !answering && state.index === 0 && !state.flipped && state.known === 0 && !state.unknown.length;
  }

  function setMode(mode) {
    state.mode = mode;
    App.storage.set('deckMode', mode);
    build();
    render();
  }

  function onAreaClick(e) {
    if (e.target.closest('#flashcard')) return flip();
    var b = e.target.closest('[data-card]');
    if (!b) return;
    switch (b.getAttribute('data-card')) {
      case 'known': return answer(true);
      case 'unknown': return answer(false);
      case 'review': build(state.unknown); return render();
      case 'restart': build(); return render();
      case 'deck-all': return setMode('all');
      case 'deck-unlearned': return setMode('unlearned');
    }
  }

  /** Keyboard shortcuts while the flashcard tab is active. Returns true if handled. */
  function handleKey(e) {
    var w = current();
    if (!w) return false;
    var onButton = e.target.closest && e.target.closest('button, a'); // links (pencil, site title) keep Enter
    if ((e.key === ' ' || e.key === 'Enter') && !onButton) {
      flip();
      return true;
    }
    if (e.key === 'ArrowRight') { answer(true); return true; }
    if (e.key === 'ArrowLeft') { answer(false); return true; }
    if (e.key === 'p' || e.key === 'P') { App.speech.speakWord(w); return true; }
    return false;
  }

  function init() {
    el.panel = document.getElementById('panel-cards');
    el.area = document.getElementById('card-area');
    el.live = document.getElementById('card-live');
    el.hint = document.getElementById('card-hint');
    el.mode = document.getElementById('deck-mode');
    el.order = document.getElementById('deck-order');

    el.area.addEventListener('click', onAreaClick);

    el.mode.addEventListener('click', function (e) {
      var b = e.target.closest('[data-deck]');
      if (b) setMode(b.getAttribute('data-deck'));
    });

    el.order.addEventListener('click', function (e) {
      var b = e.target.closest('[data-order]');
      if (!b) return;
      state.order = b.getAttribute('data-order');
      App.storage.set('deckOrder', state.order);
      build();
      render();
    });

    App.on('lang', render);
    App.on('progress', function (p) {
      // Rebuild when progress was reset, or when it changed elsewhere (e.g. the
      // word list) before this deck was started.
      if ((p.id === null && !answering) || (untouched() && (state.mode === 'unlearned' || state.mode === 'learned'))) {
        build();
        render();
      }
    });
    App.on('favorites', function (p) {
      var w = current();
      // Starring the card on screen only updates its star; other changes (e.g. from the
      // Favorites page) refresh an unstarted Favorites deck.
      var onScreen = !el.panel.hidden && w && p.id === w.id;
      if (untouched() && state.mode === 'favorites' && !onScreen) {
        build();
        render();
        return;
      }
      var star = el.area.querySelector('.card-fav');
      if (!star || !w) return;
      var on = App.favorites.has(w.id); // update in place so the star keeps focus
      star.setAttribute('aria-pressed', String(on));
      star.textContent = on ? '★' : '☆';
    });

    build();
    render();
  }

  /**
   * Called by app.js whenever the tab becomes visible. A deck that hasn't been
   * started is rebuilt, so it reflects changes made elsewhere (word list, favorites).
   */
  function show() {
    if (!untouched()) return;
    build();
    render();
  }

  App.cards = { init: init, show: show, render: render, handleKey: handleKey, setMode: setMode };
})(window.App);
