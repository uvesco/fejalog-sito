/* Verifica del registro di un backup di Fejalog, nel browser: JCS (RFC 8785 ristretto a interi e stringhe), SHA-256,
   hash di ogni evento, catena `prev` per feed, impronta del registro e hash del pacchetto. Gemello di
   shared/.../registro/{Jcs,Evento,Impronta,Registro}.kt. SHA-256 in JS puro e sincrono: vale anche da file:// (dove
   crypto.subtle non c'è) e nei test. Niente ?. e ?? (browser datati). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FejRegistro = factory();
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';

var MAX = 9007199254740991;

function jcs(v) {
  if (v === null) return 'null';
  switch (typeof v) {
    case 'boolean': return v ? 'true' : 'false';
    case 'number':
      if (!isFinite(v) || Math.floor(v) !== v || Math.abs(v) > MAX) throw new Error('numero non ammesso nel JCS: ' + v);
      return String(v === 0 ? 0 : v);
    case 'string': return JSON.stringify(v);
    case 'object':
      if (Array.isArray(v)) return '[' + v.map(jcs).join(',') + ']';
      return '{' + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ':' + jcs(v[k]); }).join(',') + '}';
    default: throw new Error('valore non ammesso nel JCS: ' + typeof v);
  }
}

var K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be,
  0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa,
  0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85,
  0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
  0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];

function utf8(s) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s);
  var e = unescape(encodeURIComponent(s)), u = new Uint8Array(e.length);
  for (var i = 0; i < e.length; i++) u[i] = e.charCodeAt(i);
  return u;
}

function sha256(testo) {
  var m = utf8(testo), n = m.length, tot = ((n + 9 + 63) >> 6) << 6, b = new Uint8Array(tot);
  b.set(m); b[n] = 0x80;
  var dv = new DataView(b.buffer);
  dv.setUint32(tot - 8, Math.floor((n * 8) / 4294967296), false);
  dv.setUint32(tot - 4, (n * 8) >>> 0, false);
  var h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19], w = new Array(64);
  for (var o = 0; o < tot; o += 64) {
    var t;
    for (t = 0; t < 16; t++) w[t] = dv.getUint32(o + t * 4, false);
    for (t = 16; t < 64; t++) {
      var a0 = w[t - 15], a1 = w[t - 2];
      var s0 = ((a0 >>> 7) | (a0 << 25)) ^ ((a0 >>> 18) | (a0 << 14)) ^ (a0 >>> 3);
      var s1 = ((a1 >>> 17) | (a1 << 15)) ^ ((a1 >>> 19) | (a1 << 13)) ^ (a1 >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }
    var A = h[0], B = h[1], C = h[2], D = h[3], E = h[4], F = h[5], G = h[6], H = h[7];
    for (t = 0; t < 64; t++) {
      var S1 = ((E >>> 6) | (E << 26)) ^ ((E >>> 11) | (E << 21)) ^ ((E >>> 25) | (E << 7));
      var ch = (E & F) ^ (~E & G);
      var t1 = (H + S1 + ch + K[t] + w[t]) | 0;
      var S0 = ((A >>> 2) | (A << 30)) ^ ((A >>> 13) | (A << 19)) ^ ((A >>> 22) | (A << 10));
      var mj = (A & B) ^ (A & C) ^ (B & C);
      var t2 = (S0 + mj) | 0;
      H = G; G = F; F = E; E = (D + t1) | 0; D = C; C = B; B = A; A = (t1 + t2) | 0;
    }
    h[0] = (h[0] + A) | 0; h[1] = (h[1] + B) | 0; h[2] = (h[2] + C) | 0; h[3] = (h[3] + D) | 0;
    h[4] = (h[4] + E) | 0; h[5] = (h[5] + F) | 0; h[6] = (h[6] + G) | 0; h[7] = (h[7] + H) | 0;
  }
  return h.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
}

function copiaSenza(o, campo) {
  var c = {};
  Object.keys(o).forEach(function (k) { if (k !== campo) c[k] = o[k]; });
  return c;
}

var hashPacchetto = function (p) { return sha256(jcs(copiaSenza(p, 'sha256'))); };
var hashEvento = function (e) { return sha256(jcs(copiaSenza(e, 'hash'))); };

/* eventi: tutti gli eventi del registro (anche di più feed); manifesto: backup.json; pacchetto: pacchetto.json.
   → { ok, errori[], eventi, device, impronta } */
function verifica(eventi, manifesto, pacchetto) {
  var errori = [], feeds = {};
  eventi.forEach(function (e) { (feeds[e.feed] = feeds[e.feed] || []).push(e); });
  var teste = [];
  Object.keys(feeds).sort().forEach(function (feed) {
    var catena = feeds[feed].slice().sort(function (a, b) { return a.seq - b.seq; });
    var prec = null;
    catena.forEach(function (e, i) {
      if (e.seq !== i + 1) { errori.push('feed ' + feed.slice(0, 8) + ': manca l\'evento ' + (i + 1)); }
      if ((e.prev === undefined ? null : e.prev) !== prec) errori.push('feed ' + feed.slice(0, 8) + ' evento ' + e.seq + ': la catena non torna');
      if (hashEvento(e) !== e.hash) errori.push('feed ' + feed.slice(0, 8) + ' evento ' + e.seq + ' (' + e.tipo + '): contenuto modificato');
      prec = e.hash;
    });
    if (catena.length) teste.push([feed, catena[catena.length - 1].seq, catena[catena.length - 1].hash]);
  });
  var impronta = sha256(jcs(teste));
  var m = manifesto || {}, reg = m.registro || {}, sed = m.seduta || {};
  if (reg.impronta && reg.impronta !== impronta) errori.push('l\'impronta del registro non corrisponde a quella del backup');
  if (reg.eventi != null && reg.eventi !== eventi.length) errori.push('gli eventi sono ' + eventi.length + ', il backup ne dichiara ' + reg.eventi);
  if (pacchetto) {
    var hp = hashPacchetto(pacchetto);
    if (pacchetto.sha256 && pacchetto.sha256 !== hp) errori.push('il pacchetto è stato modificato (hash diverso)');
    if (sed.pacchetto_sha256 && sed.pacchetto_sha256 !== pacchetto.sha256) errori.push('il pacchetto non è quello del backup');
  }
  return { ok: errori.length === 0, errori: errori, eventi: eventi.length, device: Object.keys(feeds).length, impronta: impronta };
}

return { jcs: jcs, sha256: sha256, hashEvento: hashEvento, hashPacchetto: hashPacchetto, verifica: verifica };
});
