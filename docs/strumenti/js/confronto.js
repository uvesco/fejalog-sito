/* Confronto per attribuire una provetta dal contrassegno incompleto, sbagliato o illeggibile a un capo non prelevato.
   Gemello esatto di shared/.../dominio/ConfrontoNonPrelevati.kt: stessi punteggi, stessi motivi, stessi vettori
   (contratti/fixture/confronto_vettori.json, provati da ConfrontoNonPrelevatiTest e da prova-confronto.js).
   capo: {contrassegno, specie, sesso, razza, dataNascita, stabilimento, numeroAssegnato}
   indizi: {cifre, etichetta, specie, sesso, razza, stabilimento, etaMesiMin, etaMesiMax, dataRiferimento}
   → [{capo, punteggio, motivi[]}], punteggio decrescente poi contrassegno. Niente ?. e ?? */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FejConfronto = factory();
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';

var CIFRE_MIN = 2, MAX = 20;

function soloCifre(s) { return String(s == null ? '' : s).replace(/[^0-9]/g, ''); }
function vuoto(s) { return s == null || s === ''; }
function fineCon(s, x) { return s.length >= x.length && s.substring(s.length - x.length) === x; }

/* il punteggio delle cifre digitate d contro le cifre s del contrassegno: [punti, motivo|null] */
function confrontaCifre(d, s) {
  if (fineCon(s, d)) return [100, 'finisce con ' + d];
  if (s.indexOf(d) >= 0) return [70, 'contiene ' + d];
  if (d.length < 4) return [0, null];
  var i;
  if (s.length >= d.length) {
    var fine = s.substring(s.length - d.length), diverse = 0;
    for (i = 0; i < d.length; i++) if (d.charAt(i) !== fine.charAt(i)) diverse++;
    if (diverse === 1) return [60, 'una cifra diversa'];
  }
  for (i = 0; i < d.length - 1; i++) {
    if (d.charAt(i) === d.charAt(i + 1)) continue;
    var x = d.substring(0, i) + d.charAt(i + 1) + d.charAt(i) + d.substring(i + 2);
    if (fineCon(s, x)) return [60, 'due cifre scambiate'];
  }
  if (d.length - 1 >= 3) {
    for (i = 0; i < d.length; i++) if (fineCon(s, d.substring(0, i) + d.substring(i + 1))) return [55, 'una cifra in più nel digitato'];
  }
  if (s.length > d.length) {
    var f = s.substring(s.length - d.length - 1);
    for (i = 0; i <= d.length; i++) if (f.substring(0, i) + f.substring(i + 1) === d) return [55, 'una cifra in meno nel digitato'];
  }
  return [0, null];
}

/* il numero scritto sulla provetta d (con ? per una cifra illeggibile) contro il numero assegnato n: [punti, motivo] o null */
function senza(x, i) { return x.substring(0, i) + x.substring(i + 1); }
function confrontaNumero(d, n) {
  var i;
  if (d.indexOf('?') >= 0) {
    if (/^\?+$/.test(d) || d.length !== n.length) return null;
    for (i = 0; i < d.length; i++) if (d.charAt(i) !== '?' && d.charAt(i) !== n.charAt(i)) return null;
    return [100, 'corrisponde a ' + d + ' (cifra illeggibile)'];
  }
  if (d === n) return [120, "numero assegnato uguale all'etichetta scritta"];
  if (d.length < 2) return null;
  if (d.length === n.length) {
    var diverse = 0;
    for (i = 0; i < d.length; i++) if (d.charAt(i) !== n.charAt(i)) diverse++;
    if (diverse === 1) return [60, 'numero con una cifra diversa'];
    for (i = 0; i < d.length - 1; i++) {
      if (d.charAt(i) === d.charAt(i + 1)) continue;
      if (d.substring(0, i) + d.charAt(i + 1) + d.charAt(i) + d.substring(i + 2) === n) return [60, 'numero con due cifre scambiate'];
    }
  }
  if (d.length === n.length + 1 && n.length >= 2) for (i = 0; i < d.length; i++) if (senza(d, i) === n) return [55, 'una cifra in più nel numero scritto'];
  if (d.length + 1 === n.length && d.length >= 2) for (i = 0; i < n.length; i++) if (senza(n, i) === d) return [55, 'una cifra in meno nel numero scritto'];
  return null;
}

function annoMese(t) {
  t = String(t == null ? '' : t).trim();
  var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(t);
  if (m) return [parseInt(m[3], 10), parseInt(m[2], 10)];
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (m) return [parseInt(m[1], 10), parseInt(m[2], 10)];
  return null;
}
function mesiDi(nascita, riferimento) {
  var n = annoMese(nascita), r = annoMese(riferimento);
  if (!n || !r) return null;
  return (r[0] - n[0]) * 12 + (r[1] - n[1]);
}

function confronta(indizi, capi, max) {
  max = max || MAX;
  var cifre = soloCifre(indizi.cifre), usaCifre = cifre.length >= CIFRE_MIN;
  var mn = /^[A-Za-z]{0,3}([0-9?]+)$/.exec(String(indizi.etichetta == null ? '' : indizi.etichetta).trim());
  var numeroScritto = mn ? mn[1] : null;
  var out = [];
  capi.forEach(function (capo) {
    if (!vuoto(indizi.specie) && capo.specie !== indizi.specie) return;
    var punti = 0, motivi = [];
    if (numeroScritto !== null && capo.numeroAssegnato != null) {
      var rn = confrontaNumero(numeroScritto, String(capo.numeroAssegnato));
      if (rn) { punti += rn[0]; motivi.push(rn[1]); }
    }
    if (usaCifre) {
      var r = confrontaCifre(cifre, soloCifre(capo.contrassegno));
      punti += r[0]; if (r[1]) motivi.push(r[1]);
    }
    if (!(punti > 0) && (usaCifre || numeroScritto !== null)) return;
    if (!vuoto(indizi.sesso) && !vuoto(capo.sesso)) {
      if (indizi.sesso === capo.sesso) { punti += 10; motivi.push('sesso uguale'); } else { punti -= 40; motivi.push('sesso diverso'); }
    }
    if (!vuoto(indizi.razza) && !vuoto(capo.razza) && indizi.razza === capo.razza) { punti += 10; motivi.push('razza uguale'); }
    if (!vuoto(indizi.stabilimento) && !vuoto(capo.stabilimento) && indizi.stabilimento !== capo.stabilimento) {
      punti -= 20; motivi.push('altro stabilimento');
    }
    var mesi = mesiDi(capo.dataNascita, indizi.dataRiferimento);
    if (mesi !== null && (indizi.etaMesiMin != null || indizi.etaMesiMax != null)) {
      var ok = (indizi.etaMesiMin == null || mesi >= indizi.etaMesiMin) && (indizi.etaMesiMax == null || mesi <= indizi.etaMesiMax);
      if (ok) { punti += 10; motivi.push('età compatibile'); } else { punti -= 30; motivi.push('età incompatibile'); }
    }
    if (punti > 0) out.push({ capo: capo, punteggio: punti, motivi: motivi });
  });
  out.sort(function (a, b) {
    if (a.punteggio !== b.punteggio) return b.punteggio - a.punteggio;
    return a.capo.contrassegno < b.capo.contrassegno ? -1 : a.capo.contrassegno > b.capo.contrassegno ? 1 : 0;
  });
  return out.slice(0, max);
}

return { confronta: confronta, confrontaCifre: confrontaCifre, confrontaNumero: confrontaNumero, mesiDi: mesiDi };
});
