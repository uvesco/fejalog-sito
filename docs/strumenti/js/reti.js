/* Le reti Wi-Fi del progetto per le pagine del sito: CSV «SSID;password;note;sicurezza» (lo stesso reti.csv delle reti
   salvate dell'app, con la sicurezza in più), reti di un registro (evento RETI_PROGETTO) e tipo del QR Wi-Fi.
   Comune a «Crea il progetto» e alle stampe pre-campo (utente, 2026-11-13: i QR delle reti anche dalla scheda delle
   stampe, col CSV). Niente ?. e ?? (browser datati). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FejReti = factory();
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';

var SICUREZZE = { WPA: 'WPA2', SAE: 'WPA3', APERTA: 'aperta' };

/** Le reti in CSV «SSID;password;note;sicurezza», da riusare negli altri progetti sulle stesse reti. */
function inCsv(reti) {
  var c = function (v) { v = String(v == null ? '' : v); return /[;"\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  return 'SSID;password;note;sicurezza\r\n' + reti.filter(function (r) { return String(r.ssid || '').trim(); }).map(function (r) {
    return [String(r.ssid).trim(), r.password, r.note, SICUREZZE[r.sicurezza] || 'WPA2'].map(c).join(';');
  }).join('\r\n') + '\r\n';
}

/** Le reti da un CSV «SSID;password;note;sicurezza» (separatore ; , o tabulazione; intestazione facoltativa). */
function daCsv(testo) {
  var righe = String(testo).replace(/^﻿/, '').split(/\r?\n/).filter(function (r) { return r.trim(); });
  if (!righe.length) return [];
  var sep = [';', '\t', ','].sort(function (a, b) { return righe[0].split(b).length - righe[0].split(a).length; })[0];
  var viste = {}, out = [];
  righe.forEach(function (r, i) {
    var p = r.split(sep).map(function (x) { return x.trim().replace(/^"(.*)"$/, '$1').replace(/""/g, '"'); });
    var ssid = p[0] || '';
    if (i === 0 && /^(ssid|rete|nome)$/i.test(ssid)) return;
    if (!ssid || viste[ssid] || ssid.length > 32) return;
    viste[ssid] = true;
    var sic = String(p[3] || '').toLowerCase();
    out.push({ ssid: ssid, password: (p[1] || '').slice(0, 63), note: p[2] || '',
      sicurezza: /wpa3|sae/.test(sic) ? 'SAE' : /apert|open|nessun/.test(sic) ? 'APERTA' : 'WPA' });
  });
  return out;
}

/** Le reti del progetto da un registro: l'ultimo RETI_PROGETTO (principale, riserva, altre), in ordine. */
function daEventi(eventi) {
  var ultimo = null;
  (eventi || []).forEach(function (e) {
    if (e && e.tipo === 'RETI_PROGETTO' && (!ultimo || (e.lamport || 0) >= (ultimo.lamport || 0))) ultimo = e;
  });
  if (!ultimo || !ultimo.dati) return [];
  var d = ultimo.dati, viste = {}, out = [];
  [d.principale, d.riserva].concat(Array.isArray(d.altre) ? d.altre : []).forEach(function (r) {
    if (!r || !r.ssid || viste[r.ssid]) return;
    viste[r.ssid] = true;
    out.push({ ssid: String(r.ssid), password: String(r.password || ''), note: '', sicurezza: SICUREZZE[r.sicurezza] ? r.sicurezza : 'WPA' });
  });
  return out;
}

/** Il tipo per il QR Wi-Fi standard: «nopass» per le reti aperte, altrimenti WPA (vale anche per le reti WPA2/WPA3). */
function tipoQr(r) { return r && r.sicurezza === 'APERTA' ? 'nopass' : 'WPA'; }

return { inCsv: inCsv, daCsv: daCsv, daEventi: daEventi, tipoQr: tipoQr, SICUREZZE: SICUREZZE };
});
