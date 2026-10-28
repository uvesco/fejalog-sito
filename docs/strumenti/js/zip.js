/* Lettura dello zip di un backup di Fejalog nel browser (e in Node per i test): tutte le voci, per nome.
   STORED a mano; DEFLATE con DecompressionStream('deflate-raw') (Chrome, Edge, Firefox, Safari recenti, Node 20).
   FejZip.leggi(ArrayBuffer|Uint8Array) → Promise<{ [nome]: Uint8Array }>; FejZip.testo(Uint8Array) → string;
   FejZip.scrivi([{name, data}]) → Uint8Array (STORED, con xlsx.js del motore). Niente ?. e ?? (browser datati). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./vendor/xlsx.js'));
  else root.FejZip = factory(root.AccXlsx);
})(typeof self !== 'undefined' ? self : this, function (X) {
'use strict';

function testo(u) {
  if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(u);
  var s = '';
  for (var i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return decodeURIComponent(escape(s));
}

function leggi(buf) {
  try {
    var b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    var dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    var fine = -1, i;
    for (i = b.length - 22; i >= 0 && i >= b.length - 22 - 65535; i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { fine = i; break; }
    }
    if (fine < 0) throw new Error('non è uno zip');
    var voci = dv.getUint16(fine + 10, true);
    var p = dv.getUint32(fine + 16, true);
    var lavori = [], visti = {};
    for (var k = 0; k < voci; k++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('zip rovinato');
      var metodo = dv.getUint16(p + 10, true);
      var crc = dv.getUint32(p + 16, true), compressa = dv.getUint32(p + 20, true), grande = dv.getUint32(p + 24, true);
      var lNome = dv.getUint16(p + 28, true), lExtra = dv.getUint16(p + 30, true), lComm = dv.getUint16(p + 32, true);
      var locale = dv.getUint32(p + 42, true);
      var nome = testo(b.subarray(p + 46, p + 46 + lNome));
      p += 46 + lNome + lExtra + lComm;
      if (nome.charAt(nome.length - 1) === '/') continue;
      if (visti[nome]) throw new Error(nome + ': voce ripetuta nello zip');
      visti[nome] = true;
      var inizio = locale + 30 + dv.getUint16(locale + 26, true) + dv.getUint16(locale + 28, true);
      var dati = b.subarray(inizio, inizio + compressa);
      lavori.push(voce(nome, metodo, dati, crc, grande));
    }
    return Promise.all(lavori).then(function (v) {
      var out = {};
      v.forEach(function (x) { out[x.nome] = x.dati; });
      return out;
    });
  } catch (e) {
    return Promise.reject(e);
  }
}

/* Ogni voce si controlla col CRC-32 e la dimensione scritti nello zip: un byte cambiato dentro un export non passa inosservato. */
function controllata(nome, dati, crc, grande) {
  if (dati.length !== grande) throw new Error(nome + ': dimensione diversa da quella dello zip (file troncato o alterato)');
  if (X && X.crc32 && (X.crc32(dati) >>> 0) !== (crc >>> 0)) throw new Error(nome + ': CRC non corrisponde (file rovinato o alterato)');
  return { nome: nome, dati: dati };
}

function voce(nome, metodo, dati, crc, grande) {
  if (metodo === 0) { try { return Promise.resolve(controllata(nome, dati, crc, grande)); } catch (e) { return Promise.reject(e); } }
  if (metodo === 8 && typeof DecompressionStream !== 'undefined') {
    var flusso = new Blob([dati]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Response(flusso).arrayBuffer().then(function (ab) { return controllata(nome, new Uint8Array(ab), crc, grande); });
  }
  return Promise.reject(new Error(nome + ': compresso in un modo che questo browser non apre: usa Chrome, Edge o Firefox aggiornati'));
}

function scrivi(files) { return X.zipStore(files); }

return { leggi: leggi, testo: testo, scrivi: scrivi };
});
