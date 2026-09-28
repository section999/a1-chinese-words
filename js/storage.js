/* localStorage wrapper (fails soft in private mode) + learned-word progress. */
(function (App) {
  'use strict';

  var PREFIX = 'a1zh:';
  // Saved by features that were removed (review schedule, sidebar, missed words). Deleted at
  // startup and skipped when importing an old backup.
  var LEGACY_KEYS = ['srs', 'sidebarCollapsed', 'missed'];

  var storage = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem(PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },

    set: function (key, value) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
      } catch (e) {
        /* storage full or disabled: keep working in memory */
      }
    },

    /** Every saved value (without the prefix), for a backup file. */
    dump: function () {
      var out = {};
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (key.indexOf(PREFIX) !== 0) continue;
          try {
            out[key.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(key));
          } catch (e) {
            /* skip values that are not ours */
          }
        }
      } catch (e) {
        /* storage disabled */
      }
      return out;
    },

    /**
     * Replace every saved value with the ones in data. The new values are written
     * first; if any write fails (storage full or disabled) the old values are put
     * back and false is returned, so a failed import never loses progress.
     */
    restore: function (data) {
      var keys = Object.keys(data).filter(function (k) { return LEGACY_KEYS.indexOf(k) === -1; });
      var before = {};
      var written = []; // keys overwritten so far, for rolling back
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (key.indexOf(PREFIX) === 0) before[key] = localStorage.getItem(key);
        }
        keys.forEach(function (k) {
          localStorage.setItem(PREFIX + k, JSON.stringify(data[k]));
          written.push(PREFIX + k);
        });
        Object.keys(before).forEach(function (full) {
          if (keys.indexOf(full.slice(PREFIX.length)) === -1) localStorage.removeItem(full);
        });
        return true;
      } catch (e) {
        // A failed setItem leaves that key untouched; undo only the ones already written.
        written.forEach(function (full) {
          try {
            if (full in before) localStorage.setItem(full, before[full]);
            else localStorage.removeItem(full);
          } catch (e2) {
            /* nothing more we can do */
          }
        });
        return false;
      }
    },
  };

  try {
    LEGACY_KEYS.forEach(function (k) { localStorage.removeItem(PREFIX + k); });
  } catch (e) {
    /* storage disabled */
  }

  // Only real word ids, as numbers ("1" -> 1); anything else in storage is dropped.
  var learned = new Set();
  var storedLearned = storage.get('learned', []);
  (Array.isArray(storedLearned) ? storedLearned : []).forEach(function (x) {
    var id = App.util.wordId(x);
    if (id !== null) learned.add(id);
  });

  function save(id) {
    storage.set('learned', Array.from(learned));
    App.emit('progress', { id: id });
  }

  var progress = {
    has: function (id) {
      return learned.has(id);
    },

    set: function (id, value) {
      if (value === learned.has(id)) return;
      if (value) learned.add(id);
      else learned.delete(id);
      save(id);
    },

    toggle: function (id) {
      progress.set(id, !learned.has(id));
    },

    count: function () {
      return learned.size;
    },

    clear: function () {
      learned.clear();
      save(null);
    },
  };

  App.storage = storage;
  App.progress = progress;
})(window.App);
