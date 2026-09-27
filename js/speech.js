/* Mandarin pronunciation through the Web Speech API (zh-CN). */
(function (App) {
  'use strict';

  var synth = window.speechSynthesis;
  var supported = !!synth && typeof window.SpeechSynthesisUtterance === 'function';
  var voice = null;

  function pickVoice() {
    var voices = synth.getVoices();
    voice =
      voices.find(function (v) { return v.lang === 'zh-CN'; }) ||
      voices.find(function (v) { return /^zh[-_]CN/i.test(v.lang); }) ||
      voices.find(function (v) { return /^(zh|cmn)/i.test(v.lang) && !/HK|TW/i.test(v.lang); }) ||
      voices.find(function (v) { return /^(zh|cmn)/i.test(v.lang); }) ||
      null;
  }

  if (supported) {
    pickVoice();
    // Chrome loads voices asynchronously.
    if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', pickVoice);
    else synth.onvoiceschanged = pickVoice;
  }

  function speak(text) {
    if (!supported || !text) return;
    synth.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    if (voice) u.voice = voice;
    u.rate = 0.8;
    synth.speak(u);
  }

  function speakWord(w) {
    if (w) speak(w.speak || w.hanzi);
  }

  var ICON =
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3z"/>' +
    '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M16 8.5a5 5 0 0 1 0 7M19 5.5a9 9 0 0 1 0 13"/>' +
    '</svg>';

  /** Markup for a speaker button; wired up by a delegated click handler in app.js. */
  function button(w) {
    var esc = App.util.escapeHtml;
    var t = App.i18n.t;
    var label = esc(t('listenWord', { word: w.hanzi }));
    if (!supported) {
      return (
        '<button type="button" class="btn btn-icon speak-btn" disabled title="' + esc(t('speechUnsupported')) +
        '" aria-label="' + label + '">' + ICON + '</button>'
      );
    }
    return (
      '<button type="button" class="btn btn-icon speak-btn" data-speak="' + w.id + '" aria-label="' + label +
      '" title="' + esc(t('listen')) + '">' + ICON + '</button>'
    );
  }

  App.speech = {
    supported: supported,
    icon: ICON,
    speak: speak,
    speakWord: speakWord,
    button: button,
  };
})(window.App);
