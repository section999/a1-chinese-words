/* Quiz: see the hanzi, pick the meaning out of 4 options. */
(function (App) {
  'use strict';

  var t = App.i18n.t;
  var esc = App.util.escapeHtml;
  var LENGTHS = [10, 20, 50];
  var SOURCES = ['all', 'unlearned', 'learned'];

  var state = {
    phase: 'setup', // setup | question | result
    length: App.storage.get('quizLength', 10),
    source: App.storage.get('quizSource', 'all'),
    questions: [],
    index: 0,
    score: 0,
  };
  if (LENGTHS.indexOf(state.length) === -1) state.length = 10;
  if (SOURCES.indexOf(state.source) === -1) state.source = 'all';

  var el = {};

  function pool() {
    return App.words.filter(function (w) {
      if (state.source === 'learned') return App.progress.has(w.id);
      if (state.source === 'unlearned') return !App.progress.has(w.id);
      return true;
    });
  }

  var MEANING_LANGS = ['en', 'ko', 'uk'];

  /** First English sense, lowercased: "outside, outdoors" -> "outside", "can (be able to)" -> "can". */
  function senseKey(w) {
    return w.en.split(/[,;(]/)[0].trim().toLowerCase();
  }

  function sharesChar(a, b) {
    return Array.from(a).some(function (ch) { return b.indexOf(ch) !== -1; });
  }

  /**
   * Three distractors that can't also be right: different meaning in every language,
   * a different first English sense (会/能 "can"), and no shared character with the
   * answer (外 / 外边, 睡 / 睡觉).
   */
  function distractors(answer) {
    var senses = {};
    senses[senseKey(answer)] = true;
    var seen = {};
    MEANING_LANGS.forEach(function (l) {
      seen[l] = {};
      seen[l][answer[l]] = true;
    });
    var picked = [];
    var candidates = App.util.shuffle(App.words);
    for (var i = 0; i < candidates.length && picked.length < 3; i++) {
      var w = candidates[i];
      if (w.id === answer.id || sharesChar(w.hanzi, answer.hanzi)) continue;
      var clash = MEANING_LANGS.some(function (l) { return seen[l][w[l]]; });
      if (clash || senses[senseKey(w)]) continue;
      MEANING_LANGS.forEach(function (l) { seen[l][w[l]] = true; });
      senses[senseKey(w)] = true;
      picked.push(w.id);
    }
    return picked;
  }

  function start() {
    var words = App.util.shuffle(pool()).slice(0, state.length);
    if (!words.length) return;
    state.questions = words.map(function (w) {
      return { id: w.id, options: App.util.shuffle([w.id].concat(distractors(w))), chosen: null };
    });
    state.index = 0;
    state.score = 0;
    state.phase = 'question';
    render(true);
  }

  function segmented(name, values, current, labelFor) {
    return (
      '<div class="segmented" role="group" aria-labelledby="quiz-' + name + '-label">' +
      values
        .map(function (v) {
          return (
            '<button type="button" class="btn" data-quiz-' + name + '="' + v + '" aria-pressed="' + (v === current) + '">' +
            esc(labelFor(v)) + '</button>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function setupHtml() {
    var available = pool().length;
    var sourceLabel = { all: t('quizSourceAll'), learned: t('quizSourceLearned'), unlearned: t('quizSourceUnlearned') };
    return (
      '<div class="quiz-setup">' +
      '<p>' + esc(t('quizIntro')) + '</p>' +
      '<div class="quiz-options-row">' +
      '<div><span class="field-label" id="quiz-length-label">' + esc(t('quizLength')) + '</span>' +
      segmented('length', LENGTHS, state.length, String) + '</div>' +
      '<div><span class="field-label" id="quiz-source-label">' + esc(t('quizSource')) + '</span>' +
      segmented('source', SOURCES, state.source, function (v) {
        return sourceLabel[v];
      }) + '</div>' +
      '</div>' +
      (available
        ? '<button type="button" class="btn btn-primary" data-quiz="start">' + esc(t('quizStart')) + ' →</button>'
        : '<p class="muted">' + esc(t('quizNotEnough')) + '</p>') +
      '</div>'
    );
  }

  function questionHtml() {
    var q = state.questions[state.index];
    var w = App.byId[q.id];
    var answered = q.chosen !== null;
    var isLast = state.index === state.questions.length - 1;

    var options = q.options
      .map(function (id, i) {
        var cls = 'btn quiz-option';
        if (answered && id === q.id) cls += ' is-correct';
        else if (answered && id === q.chosen) cls += ' is-wrong';
        return (
          '<li><button type="button" class="' + cls + '" data-option="' + id + '"' + (answered ? ' disabled' : '') + '>' +
          '<span class="opt-key">' + (i + 1) + '</span>' +
          '<span>' + esc(App.view.meaning(App.byId[id])) + '</span></button></li>'
        );
      })
      .join('');

    var feedback = '';
    if (answered) {
      var correct = q.chosen === q.id;
      feedback =
        '<div class="quiz-feedback ' + (correct ? 'is-correct' : 'is-wrong') + '">' +
        '<span>' + esc(correct ? t('quizCorrect') : t('quizWrong', { a: App.view.meaning(w) })) + '</span>' +
        '<button type="button" class="btn btn-primary" data-quiz="next">' +
        esc(isLast ? t('quizFinish') : t('quizNext')) + ' →</button>' +
        '</div>';
    }

    return (
      '<div class="quiz-meta">' +
      '<span>' + esc(t('quizQuestion', { i: state.index + 1, n: state.questions.length })) + '</span>' +
      '<span class="quiz-score">' + esc(t('quizScore', { s: state.score })) + '</span>' +
      '<button type="button" class="btn btn-small" data-quiz="quit">' + esc(t('quizQuit')) + '</button>' +
      '</div>' +
      '<div class="quiz-question">' +
      '<span class="hanzi" lang="zh-CN">' + esc(w.hanzi) + '</span>' +
      '<span>' + (answered ? App.view.pinyinHtml(w) : '&nbsp;') + '</span>' +
      App.speech.button(w) +
      '</div>' +
      '<p class="quiz-prompt" id="quiz-prompt">' + esc(t('quizPrompt')) + '</p>' +
      '<ol class="quiz-options" aria-labelledby="quiz-prompt">' + options + '</ol>' +
      feedback
    );
  }

  function resultHtml() {
    var n = state.questions.length;
    var wrong = state.questions.filter(function (q) {
      return q.chosen !== q.id;
    });
    var review = wrong.length
      ? '<h2 class="panel-title">' + esc(t('quizMistakes')) + '</h2><ul class="review-list">' +
        wrong
          .map(function (q) {
            var w = App.byId[q.id];
            return (
              '<li><span class="hanzi" lang="zh-CN">' + esc(w.hanzi) + '</span>' + App.view.pinyinHtml(w) +
              '<span>' + esc(App.view.meaning(w)) + '</span>' + App.speech.button(w) + '</li>'
            );
          })
          .join('') +
        '</ul>'
      : '<p>' + esc(t('quizPerfect')) + '</p>';

    return (
      '<div class="quiz-result">' +
      '<h2 class="panel-title">' + esc(t('quizDone')) + '</h2>' +
      '<p class="big-score">' + esc(t('quizFinalScore', { s: state.score, n: n })) +
      ' <span class="muted">(' + Math.round((state.score / n) * 100) + '%)</span></p>' +
      review +
      '<div class="button-row button-row-start">' +
      '<button type="button" class="btn btn-primary" data-quiz="again">' + esc(t('quizAgain')) + '</button>' +
      '</div></div>'
    );
  }

  function render(moveFocus) {
    var html = state.phase === 'question' ? questionHtml() : state.phase === 'result' ? resultHtml() : setupHtml();
    el.area.innerHTML = html;
    if (moveFocus) {
      var target =
        el.area.querySelector('[data-quiz="next"]') ||
        el.area.querySelector('.quiz-option:not(:disabled)') ||
        el.area.querySelector('.btn-primary');
      if (target) target.focus();
    }
  }

  function choose(id) {
    var q = state.questions[state.index];
    if (!q || q.chosen !== null) return;
    q.chosen = id;
    // A live region that already exists is announced reliably; one inserted with its text is often not.
    var w = App.byId[q.id];
    document.getElementById('quiz-live').textContent =
      id === q.id ? t('quizCorrect') : t('quizWrong', { a: App.view.meaning(w) });
    if (id === q.id) {
      state.score++;
    }
    render(true);
  }

  function next() {
    var q = state.questions[state.index];
    if (!q || q.chosen === null) return;
    if (state.index < state.questions.length - 1) state.index++;
    else state.phase = 'result';
    render(true);
  }

  function onClick(e) {
    var opt = e.target.closest('[data-option]');
    if (opt) return choose(Number(opt.getAttribute('data-option')));

    var len = e.target.closest('[data-quiz-length]');
    if (len) {
      state.length = Number(len.getAttribute('data-quiz-length'));
      App.storage.set('quizLength', state.length);
      return render();
    }
    var src = e.target.closest('[data-quiz-source]');
    if (src) {
      state.source = src.getAttribute('data-quiz-source');
      App.storage.set('quizSource', state.source);
      return render();
    }

    var action = e.target.closest('[data-quiz]');
    if (!action) return;
    switch (action.getAttribute('data-quiz')) {
      case 'start': return start();
      case 'next': return next();
      case 'quit':
      case 'again':
        state.phase = 'setup';
        return render(true);
    }
  }

  function handleKey(e) {
    if (state.phase !== 'question') return false;
    var q = state.questions[state.index];
    if (/^[1-4]$/.test(e.key) && q.chosen === null) {
      var id = q.options[Number(e.key) - 1];
      if (id !== undefined) choose(id);
      return true;
    }
    if (e.key === 'Enter' && q.chosen !== null && !(e.target.closest && e.target.closest('button'))) {
      next();
      return true;
    }
    if (e.key === 'p' || e.key === 'P') {
      App.speech.speakWord(App.byId[q.id]);
      return true;
    }
    return false;
  }

  function init() {
    el.area = document.getElementById('quiz-area');
    el.area.addEventListener('click', onClick);
    App.on('lang', function () {
      render();
    });
    App.on('progress', function () {
      // Keep the "available words" state of the setup screen current.
      if (state.phase === 'setup') render();
    });
    render();
  }

  App.quiz = { init: init, render: render, handleKey: handleKey };
})(window.App);
