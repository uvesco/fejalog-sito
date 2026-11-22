/* Memoria del browser per gli strumenti del sito: una chiave → un valore in IndexedDB, nella stessa base
   («fejalog-strumenti», archivio «k») che usa la Sistemazione (app.js): così «Cancella tutti i dati di Fejalog da questo
   browser» toglie anche ciò che si salva qui. Senza IndexedDB non salva niente e non dà errori: si lavora lo stesso.
   Niente esce dal browser. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FejMemoria = factory();
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';
function crea(idb) {
  var ok = !!idb;
  function db() {
    return new Promise(function (si, no) {
      if (!ok) { no(new Error('IndexedDB assente')); return; }
      var r = idb.open('fejalog-strumenti', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('k'); };
      r.onsuccess = function () { si(r.result); }; r.onerror = function () { no(r.error); };
    });
  }
  function scrivi(fa) {
    return db().then(function (d) { return new Promise(function (si, no) {
      var t = d.transaction('k', 'readwrite'); fa(t.objectStore('k'));
      t.oncomplete = function () { d.close(); si(true); }; t.onerror = t.onabort = function () { d.close(); no(t.error); };
    }); }).catch(function () { return false; });
  }
  return {
    ok: ok,
    /** Salva; la promessa dà false se non è stato possibile (senza IndexedDB, spazio finito). */
    metti: function (k, v) { return scrivi(function (s) { s.put(v, k); }); },
    prendi: function (k) {
      return db().then(function (d) { return new Promise(function (si, no) {
        var q = d.transaction('k').objectStore('k').get(k); q.onsuccess = function () { d.close(); si(q.result); }; q.onerror = function () { d.close(); no(q.error); };
      }); }).catch(function () { return null; });
    },
    togli: function (k) { return scrivi(function (s) { s.delete(k); }); },
  };
}
return { crea: crea };
});
