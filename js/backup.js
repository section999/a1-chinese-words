/* Backup: export every saved value to a .json file and import it back. */
(function (App) {
  'use strict';

  var t = App.i18n.t;
  var APP_ID = 'a1zh';
  var VERSION = 1;

  var el = {};
  var failed = false; // an import error is on screen

  /** The error shows next to every import button (header menu and home page). */
  function showMessage(text) {
    failed = !!text;
    el.messages.forEach(function (node) {
      node.textContent = text;
      node.hidden = !text;
    });
  }

  function pick() {
    el.file.click();
  }

  function exportFile() {
    var backup = {
      app: APP_ID,
      version: VERSION,
      exported: App.util.today(),
      data: App.storage.dump(),
    };
    var blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = APP_ID + '-backup-' + backup.exported + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    showMessage('');
  }

  /** The backup's data, or null if the file is not one of our backups. */
  function parse(text) {
    var backup;
    try {
      backup = JSON.parse(text);
    } catch (e) {
      return null;
    }
    if (!backup || backup.app !== APP_ID || typeof backup.version !== 'number' || backup.version > VERSION) return null;
    var data = backup.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    // An empty backup (e.g. exported where storage was unavailable) would only wipe progress here.
    if (!Object.keys(data).length) return null;
    // Every value the app reads at startup must have the right shape.
    var arrays = ['learned', 'favorites'];
    var objects = ['writing'];
    if (arrays.some(function (k) { return data[k] !== undefined && !Array.isArray(data[k]); })) return null;
    if (objects.some(function (k) { return data[k] !== undefined && !App.util.isPlainObject(data[k]); })) return null;
    return backup;
  }

  function importFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var backup = parse(String(reader.result));
      if (!backup) return showMessage(t('importFailed'));
      if (!window.confirm(t('confirmImport', { date: backup.exported || '?' }))) return;
      if (!App.storage.restore(backup.data)) return showMessage(t('importFailed'));
      // Every module reads storage at startup, so reload instead of patching state.
      location.reload();
    };
    reader.onerror = function () {
      showMessage(t('importFailed'));
    };
    reader.readAsText(file);
  }

  function init() {
    el.file = document.getElementById('import-file');
    el.messages = Array.from(document.querySelectorAll('.backup-message'));

    document.getElementById('export-backup').addEventListener('click', exportFile);
    document.getElementById('import-backup').addEventListener('click', pick);
    el.file.addEventListener('change', function () {
      var file = el.file.files[0];
      el.file.value = ''; // allow picking the same file again
      if (file) importFile(file);
    });
    App.on('lang', function () {
      if (failed) showMessage(t('importFailed'));
    });
  }

  App.backup = { init: init, pick: pick };
})(window.App);
