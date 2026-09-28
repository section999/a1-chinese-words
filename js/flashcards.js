/* Flashcards: pick a deck on the setup screen, then hanzi on the front, pinyin + meaning on the back. */
(function (App) {
  'use strict';

  var t = App.i18n.t;
  var esc = App.util.escapeHtml;

  var MODES = ['all', 'learned', 'unlearned', 'favorites'];

  var state = {
    phase: 'setup', // setup | deck
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

  function pool() {
    return App.words
      .filter(function (w) {
        if (state.mode === 'favorites') return App.favorites.has(w.id);
        if (state.mode === 'learned') return App.progress.has(w.id);
        return state.mode === 'all' || !App.progress.has(w.id);
      })
      .map(function (w) { return w.id; });
  }

  function build(ids) {
    ids = (ids || pool()).slice().sort(function (a, b) { return a - b; });
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

  function segmented(name, values, current, labelFor, cls) {
    return (
      '<div class="segmented' + (cls ? ' ' + cls : '') + '" role="group" aria-labelledby="deck-' + name + '-label">' +
      values
        .map(function (v) {
          return (
            '<button type="button" class="btn" data-deck-' + name + '="' + v + '" aria-pressed="' + (v === current) + '">' +
            esc(labelFor(v)) + '</button>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  /** Like the quiz: intro, Show, Order, then the start button (or why there is nothing to show). */
  function setupHtml() {
    var modeLabel = { all: t('filterAll'), learned: t('filterLearned'), unlearned: t('filterUnlearned'), favorites: t('filterFavorites') };
    var orderLabel = { number: t('orderNumber'), shuffle: t('orderShuffle') };
    var n = pool().length;
    var empty = state.mode === 'favorites' ? t('favoritesEmpty') : state.mode === 'learned' ? t('deckNoLearned') : t('deckEmpty');
    return (
      '<div class="quiz-setup deck-setup">' +
      '<p>' + esc(t('cardsIntro')) + '</p>' +
      '<div class="quiz-options-row">' +
      '<div><span class="field-label" id="deck-mode-label">' + esc(t('show')) + '</span>' +
      segmented('mode', MODES, state.mode, function (v) { return modeLabel[v]; }, 'seg-grid') + '</div>' +
      '<div><span class="field-label" id="deck-order-label">' + esc(t('order')) + '</span>' +
      segmented('order', ['number', 'shuffle'], state.order, function (v) { return orderLabel[v]; }) + '</div>' +
      '</div>' +
      (n
        ? '<button type="button" class="btn btn-primary" data-card="start">' + esc(t('cardsStart')) + ' →</button>'
        : '<p class="muted">' + esc(empty) + '</p>') +
      '</div>'
    );
  }

  /** "3 / 20" and Quit above the card, like the quiz. */
  function metaHtml() {
    return (
      '<div class="quiz-meta">' +
      '<span>' + (state.index + 1) + ' / ' + state.deck.length + '</span>' +
      '<button type="button" class="btn btn-small" data-card="quit">' + esc(t('quizQuit')) + '</button>' +
      '</div>'
    );
  }

  function cardHtml(w) {
    var f = state.flipped;
    return (
      metaHtml() +
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
    var buttons = '';
    if (state.unknown.length) {
      buttons +=
        '<button type="button" class="btn btn-primary" data-card="review">' +
        esc(t('reviewUnknown', { n: state.unknown.length })) + '</button>';
    }
    buttons += '<button type="button" class="btn" data-card="restart">' + esc(t('restartDeck')) + '</button>';
    buttons += '<button type="button" class="btn" data-card="quit">' + esc(t('cardsNewDeck')) + '</button>';
    return (
      '<div class="deck-summary"><p>' +
      esc(t('deckDone', { known: state.known, unknown: state.unknown.length })) +
      '</p>' +
      '<div class="button-row">' + buttons + '</div></div>'
    );
  }

  function render(moveFocus) {
    var hadFocus = moveFocus || el.area.contains(document.activeElement);
    var w = state.phase === 'deck' ? current() : null;
    el.area.innerHTML = state.phase === 'setup' ? setupHtml() : w ? cardHtml(w) : summaryHtml();
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

  function start(ids) {
    build(ids);
    if (!state.deck.length) return render();
    state.phase = 'deck';
    render(true);
  }

  function quit() {
    state.phase = 'setup';
    render(true);
  }

  function setMode(mode) {
    state.mode = mode;
    App.storage.set('deckMode', mode);
  }

  /** "Practice with flashcards" on the word list: straight into that deck, no setup screen. */
  function startDeck(mode) {
    setMode(mode);
    start();
  }

  function onAreaClick(e) {
    if (e.target.closest('#flashcard')) return flip();
    var m = e.target.closest('[data-deck-mode]');
    if (m) {
      setMode(m.getAttribute('data-deck-mode'));
      return render();
    }
    var o = e.target.closest('[data-deck-order]');
    if (o) {
      state.order = o.getAttribute('data-deck-order');
      App.storage.set('deckOrder', state.order);
      return render();
    }
    var b = e.target.closest('[data-card]');
    if (!b) return;
    switch (b.getAttribute('data-card')) {
      case 'start': return start();
      case 'quit': return quit();
      case 'known': return answer(true);
      case 'unknown': return answer(false);
      case 'review': return start(state.unknown);
      case 'restart': return start();
    }
  }

  /** Keyboard shortcuts while the flashcard tab is active. Returns true if handled. */
  function handleKey(e) {
    if (state.phase !== 'deck') return false;
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
    el.area = document.getElementById('card-area');
    el.live = document.getElementById('card-live');
    el.hint = document.getElementById('card-hint');

    el.area.addEventListener('click', onAreaClick);

    App.on('lang', function () {
      render();
    });
    App.on('progress', function (p) {
      if (answering) return;
      // Progress reset: the running deck no longer matches it, so back to setup.
      if (p.id === null) state.phase = 'setup';
      // Keep the setup screen's word count / empty message current.
      if (state.phase === 'setup') render();
    });
    App.on('favorites', function () {
      if (state.phase === 'setup') return render();
      var w = current();
      var star = el.area.querySelector('.card-fav');
      if (!star || !w) return;
      var on = App.favorites.has(w.id); // update in place so the star keeps focus
      star.setAttribute('aria-pressed', String(on));
      star.textContent = on ? '★' : '☆';
    });

    render();
  }

  /** Called by app.js whenever the tab becomes visible: the setup screen reflects changes made elsewhere. */
  function show() {
    if (state.phase === 'setup') render();
  }

  App.cards = { init: init, show: show, render: render, handleKey: handleKey, startDeck: startDeck };
})(window.App);
