/* Shared namespace, a tiny event bus, and helpers used by every module. */
(function () {
  'use strict';

  var listeners = {};

  var App = {
    words: window.VOCABULARY || [],
    byId: Object.create(null), // no inherited keys: "toString" is not a word

    on: function (event, fn) {
      (listeners[event] = listeners[event] || []).push(fn);
    },

    emit: function (event, payload) {
      (listeners[event] || []).forEach(function (fn) {
        fn(payload);
      });
    },
  };

  App.words.forEach(function (w) {
    App.byId[w.id] = w;
  });

  App.util = {
    escapeHtml: function (s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },

    shuffle: function (arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
      }
      return a;
    },

    /** Lowercase, drop tone marks/spaces/punctuation: "Nǚ'ér" -> "nuer" */
    foldPinyin: function (s) {
      return String(s)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/v/g, 'u')
        .replace(/[\s'’\-·/]/g, '');
    },

    /** Local calendar date as "YYYY-MM-DD" (local, not UTC, so it flips at local midnight). */
    dateStr: function (d) {
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    },

    parseDate: function (s) {
      var p = s.split('-').map(Number);
      return new Date(p[0], p[1] - 1, p[2]);
    },

    today: function () {
      return App.util.dateStr(new Date());
    },

    addDays: function (s, n) {
      var d = App.util.parseDate(s);
      d.setDate(d.getDate() + n);
      return App.util.dateStr(d);
    },

    /** Whole days from today until the date s (negative if overdue). */
    daysUntil: function (s) {
      var ms = App.util.parseDate(s) - App.util.parseDate(App.util.today());
      return Math.round(ms / 86400000);
    },

    /** The word id for a stored value (1, "1"), or null if it is not one of our words. */
    wordId: function (x) {
      var id = typeof x === 'string' && /^\d+$/.test(x) ? Number(x) : x;
      return typeof id === 'number' && App.byId[id] ? id : null;
    },

    isPlainObject: function (v) {
      return !!v && typeof v === 'object' && !Array.isArray(v);
    },

    isDateStr: function (s) {
      return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(App.util.parseDate(s));
    },

    isTyping: function (e) {
      var el = e.target;
      return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
    },
  };

  window.App = App;
})();
