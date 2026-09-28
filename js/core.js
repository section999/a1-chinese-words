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

  /* ---- Fold bar (phones): sticky toolbar whose options fold behind .fold-toggle ---- */

  // The bar sticks right under the header, whose height changes with the screen width.
  function measureHeader() {
    var header = document.querySelector('.site-header');
    if (header) document.documentElement.style.setProperty('--header-h', header.getBoundingClientRect().height + 'px');
  }
  measureHeader();
  window.addEventListener('resize', measureHeader);

  App.foldBar = function (bar) {
    var toggle = bar.querySelector('.fold-toggle');
    function isOpen() {
      return bar.classList.contains('is-open');
    }
    function setOpen(open) {
      bar.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    }
    toggle.addEventListener('click', function () {
      setOpen(!isOpen());
    });
    // Scrolling (or drawing) outside the bar folds the options away again.
    function fold(e) {
      if (isOpen() && !bar.contains(e.target)) setOpen(false);
    }
    document.addEventListener('touchmove', fold, { passive: true });
    document.addEventListener('wheel', fold, { passive: true });
    return {
      setOpen: setOpen,
      isSticky: function () {
        return getComputedStyle(bar).position === 'sticky';
      },
    };
  };

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
