/* Lo stato di lavoro sul sito: l'elenco ordinato delle azioni fatte (soluzioni, registrazioni tardive, spostamenti,
   scambi, spunte). Si conserva nel browser (localStorage), con chiave pacchetto+impronta del backup, così ricaricando la
   pagina non si perde niente; «Ricomincia da capo» lo azzera. Niente va su internet. Niente ?. e ?? */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FejStato = factory();
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';

function uuid() {
  var c = typeof crypto !== 'undefined' ? crypto : null;
  if (c && c.randomUUID) return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (ch) {
    var r = Math.floor(Math.random() * 16);
    return (ch === 'x' ? r : (r & 3) | 8).toString(16);
  });
}

function depositoBrowser() {
  try {
    var ls = typeof localStorage !== 'undefined' ? localStorage : null;
    if (ls) { ls.setItem('fejalog:prova', '1'); ls.removeItem('fejalog:prova'); return ls; }
  } catch (e) { /* modalità privata: si lavora in memoria */ }
  var m = {};
  return { getItem: function (k) { return m[k] == null ? null : m[k]; }, setItem: function (k, v) { m[k] = v; }, removeItem: function (k) { delete m[k]; } };
}

/* deposito: getItem/setItem/removeItem (localStorage, o un finto nei test) */
function crea(chiave, deposito) {
  var d = deposito || depositoBrowser(), k = 'fejalog:strumenti:' + chiave, azioni = [];
  try { azioni = JSON.parse(d.getItem(k) || '[]'); } catch (e) { azioni = []; }
  function salva() { try { d.setItem(k, JSON.stringify(azioni)); } catch (e) { /* pieno: si lavora in memoria */ } }
  return {
    azioni: function () { return azioni.slice(); },
    aggiungi: function (tipo, dati, ora) {
      var a = Object.assign({ id: uuid(), tipo: tipo, ts: ora || new Date().toISOString() }, dati);
      azioni.push(a); salva(); return a;
    },
    rimuovi: function (id) { azioni = azioni.filter(function (a) { return a.id !== id; }); salva(); },
    sostituisci: function (nuove) { azioni = nuove.slice(); salva(); },
    azzera: function () { azioni = []; salva(); },
  };
}

return { crea: crea, uuid: uuid };
});
