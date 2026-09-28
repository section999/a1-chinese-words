/* Mandarin pronunciation through the Web Speech API (zh-CN). */
(function (App) {
  'use strict';

  var synth = window.speechSynthesis;
  var supported = !!synth && typeof window.SpeechSynthesisUtterance === 'function';
  var voice = null;

  /** Higher is better; -1 means not a Chinese voice. */
  function score(v) {
    var lang = v.lang || '';
    var id = (v.name + ' ' + v.voiceURI).toLowerCase();
    var s;
    if (/^zh[-_]cn/i.test(lang) || /^cmn/i.test(lang)) s = 30;
    else if (/^zh/i.test(lang) && !/hk|tw|yue/i.test(lang)) s = 20;
    else if (/^zh/i.test(lang)) s = 10; // Taiwan / Hong Kong: last resort
    else return -1;
    // Neural and enhanced voices: Edge "(Natural)" / "Online", Chrome "Google 普通话", Apple Enhanced / Premium
    if (/natural|neural/.test(id)) s += 50;
    else if (/premium|enhanced/.test(id)) s += 45;
    else if (/google/.test(id)) s += 40;
    else if (/online/.test(id)) s += 35;
    if (/compact|espeak/.test(id)) s -= 15; // small robotic voices
    if (v.localService === false) s += 1;
    return s;
  }

  function pickVoice() {
    voice = null;
    var best = -1;
    synth.getVoices().forEach(function (v) {
      var s = score(v);
      if (s > best) {
        best = s;
        voice = v;
      }
    });
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
