/* Spaced repetition (Leitner boxes) on top of the learned-word progress.
 *
 * Every learned word has { box, due, last }. Box 1 = just learned.
 * "Know" on a due word moves it up a box; the next review is INTERVALS[box]
 * days later. "Don't know" on a learned word sends it back to box 1 (review
 * tomorrow); un-learning it (word list) drops it from the schedule.
 */
(function (App) {
  'use strict';

  var INTERVALS = [0, 1, 2, 4, 7, 14]; // days, indexed by box
  var MAX_BOX = INTERVALS.length - 1;
  var util = App.util;

  // Only well-formed entries survive: a real word id, box 1..MAX_BOX, valid dates.
  // Dropped entries of learned words are recreated by migrate() below.
  var schedule = {};
  (function load() {
    var raw = App.storage.get('srs', {});
    if (!util.isPlainObject(raw)) return;
    Object.keys(raw).forEach(function (key) {
      var id = util.wordId(key);
      var s = raw[key];
      if (id === null || !util.isPlainObject(s) || !util.isDateStr(s.due)) return;
      var box = s.box;
      if (typeof box !== 'number' || box % 1 !== 0 || box < 1 || box > MAX_BOX) return;
      schedule[id] = { box: box, due: s.due };
      if (util.isDateStr(s.last)) schedule[id].last = s.last;
    });
  })();

  function save(emit) {
    App.storage.set('srs', schedule);
    if (emit !== false) App.emit('srs');
  }

  // Keep the schedule in step with learned words. Words learned before this
  // feature existed start at box 1, due today.
  (function migrate() {
    var changed = false;
    Object.keys(schedule).forEach(function (id) {
      if (!App.progress.has(Number(id))) {
        delete schedule[id];
        changed = true;
      }
    });
    App.words.forEach(function (w) {
      if (App.progress.has(w.id) && !schedule[w.id]) {
        schedule[w.id] = { box: 1, due: util.today() };
        changed = true;
      }
    });
    if (changed) save(false);
  })();

  // Registered before any view listens to 'progress', so views see an updated schedule.
  App.on('progress', function (p) {
    if (p.id === null) {
      schedule = {};
      return save();
    }
    if (App.progress.has(p.id)) {
      if (!schedule[p.id]) {
        schedule[p.id] = { box: 1, due: util.addDays(util.today(), INTERVALS[1]), last: util.today() };
        save();
      }
    } else if (schedule[p.id]) {
      delete schedule[p.id];
      save();
    }
  });

  function get(id) {
    return schedule[id] || null;
  }

  function isDue(id) {
    var s = schedule[id];
    return !!s && s.due <= util.today();
  }

  /** Due word ids, most overdue first. */
  function dueIds() {
    return App.words
      .filter(function (w) { return isDue(w.id); })
      .sort(function (a, b) {
        var da = schedule[a.id].due;
        var db = schedule[b.id].due;
        return da < db ? -1 : da > db ? 1 : a.id - b.id;
      })
      .map(function (w) { return w.id; });
  }

  function dueCount() {
    return dueIds().length;
  }

  /** "Know" on a due word: next box, next date. */
  function promote(id) {
    var s = schedule[id];
    if (!s) return;
    s.box = Math.min(s.box + 1, MAX_BOX);
    s.due = util.addDays(util.today(), INTERVALS[s.box]);
    s.last = util.today();
    save();
  }

  /** "I don't know" on a learned word: back to step 1, review tomorrow. */
  function reset(id) {
    var s = schedule[id];
    if (!s) return;
    s.box = 1;
    s.due = util.addDays(util.today(), INTERVALS[1]);
    s.last = util.today();
    save();
  }

  /** The earliest upcoming review day after today, with how many words are due then. */
  function upcoming() {
    var today = util.today();
    var first = null;
    var count = 0;
    Object.keys(schedule).forEach(function (id) {
      var due = schedule[id].due;
      if (due <= today) return;
      if (first === null || due < first) {
        first = due;
        count = 1;
      } else if (due === first) {
        count++;
      }
    });
    return first ? { date: first, count: count } : null;
  }

  function size() {
    return Object.keys(schedule).length;
  }

  /* ---- Formatting (language-aware) ---- */

  function locale() {
    return { en: 'en-US', ko: 'ko-KR', uk: 'uk-UA' }[App.i18n.lang()] || 'en-US';
  }

  function formatDate(s) {
    try {
      return new Intl.DateTimeFormat(locale(), { month: 'short', day: 'numeric' }).format(util.parseDate(s));
    } catch (e) {
      return s;
    }
  }

  App.srs = {
    INTERVALS: INTERVALS,
    MAX_BOX: MAX_BOX,
    get: get,
    isDue: isDue,
    dueIds: dueIds,
    dueCount: dueCount,
    promote: promote,
    reset: reset,
    upcoming: upcoming,
    size: size,
    formatDate: formatDate,
  };
})(window.App);
