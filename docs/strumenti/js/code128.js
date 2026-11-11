/* =============================================================================
 * CODE 128 — Encoder e Decoder puro (nessuna dipendenza esterna)
 * Compatibile con R/code128.R e testato su specifica ISO/IEC 15417.
 * Supporta Code C (coppie numeriche) e Code B (alfanumerico).
 * ============================================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FejCode128 = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var WIDTHS = [
    '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
    '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
    '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
    '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
    '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
    '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
    '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
    '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
    '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
    '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
    '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
  ];

  var START_A = 103, START_B = 104, START_C = 105, CODE_B = 100, CODE_C = 99, STOP = 106;

  function widthsToBits(larghezze) {
    var bit = '1', out = '';
    for (var i = 0; i < larghezze.length; i++) {
      var n = parseInt(larghezze[i], 10);
      for (var k = 0; k < n; k++) out += bit;
      bit = (bit === '1') ? '0' : '1';
    }
    return out;
  }

  // Mappa inversa: bit pattern -> codeword (per la decodifica)
  var BITS_TO_CW = {};
  for (var c = 0; c < WIDTHS.length; c++) {
    BITS_TO_CW[widthsToBits(WIDTHS[c])] = c;
  }

  function valoreB(ch) { return ch.charCodeAt(0) - 32; }

  function coppieC(cifrePari) {
    var out = [];
    for (var i = 0; i < cifrePari.length; i += 2) {
      out.push(parseInt(cifrePari.substr(i, 2), 10));
    }
    return out;
  }

  /* Sequenza COMPLETA di codeword (valori 0-106), start e stop compresi. */
  function codewords(valore) {
    var v = String(valore == null ? '' : valore);
    if (!v.length) throw new Error('code128 codewords(): valore vuoto.');
    var soliNumeri = /^[0-9]+$/.test(v);
    var cw, dati;
    if (soliNumeri && v.length % 2 === 0) {
      cw = [START_C].concat(coppieC(v));
    } else if (soliNumeri) {
      var pairs = v.slice(0, -1), ultima = v.slice(-1);
      dati = coppieC(pairs).concat([CODE_B, valoreB(ultima)]);
      cw = [START_C].concat(dati);
    } else {
      dati = [];
      for (var i = 0; i < v.length; i++) dati.push(valoreB(v[i]));
      cw = [START_B].concat(dati);
    }
    var somma = cw[0];
    for (var p = 1; p < cw.length; p++) somma += cw[p] * p;
    var checksum = somma % 103;
    return cw.concat([checksum, STOP]);
  }

  /* Stringa di moduli 0/1 (barra="1", spazio="0"), quiet zone ESCLUSA. */
  function moduli(valore) {
    var cw = codewords(valore), out = '';
    for (var i = 0; i < cw.length; i++) out += widthsToBits(WIDTHS[cw[i]]);
    return out;
  }

  function larghezzaModuli(valore) { return moduli(valore).length; }

  /* Sole posizioni delle barre (non degli spazi), in UNITA' DI MODULO. */
  function barre(valore) {
    var bits = moduli(valore), out = [], x = 0, i = 0, n = bits.length;
    while (i < n) {
      var j = i;
      while (j < n && bits[j] === bits[i]) j++;
      var w = j - i;
      if (bits[i] === '1') out.push({ x: x, w: w });
      x += w; i = j;
    }
    return out;
  }

  function validoChip(v) { return /^[0-9]{15,16}$/.test(String(v == null ? '' : v)); }
  function validoCf(v) { return /^[A-Za-z0-9]{16}$/.test(String(v == null ? '' : v)); }

  function chipTesto(chip) {
    var v = String(chip == null ? '' : chip);
    if (v.length === 15) return v.slice(0, 3) + ' ' + v.slice(3, 8) + ' ' + v.slice(8, 15);
    if (v.length === 16) return v.slice(0, 4) + ' ' + v.slice(4, 9) + ' ' + v.slice(9, 16);
    return v;
  }

  /* Genera codice a barre in formato SVG puro stringa */
  function svg(valore, opzioni) {
    opzioni = opzioni || {};
    var moduloPx = opzioni.modulo || 2;
    var altezzaPx = opzioni.altezza || 60;
    var quietZone = typeof opzioni.quietZone === 'number' ? opzioni.quietZone : 10;
    var mostraTesto = opzioni.mostraTesto !== false;
    var colore = opzioni.colore || '#000000';
    var fondo = opzioni.fondo || '#ffffff';

    var b = barre(valore);
    var totModuli = larghezzaModuli(valore) + 2 * quietZone;
    var widthSvg = totModuli * moduloPx;
    var heightSvg = altezzaPx + (mostraTesto ? 18 : 0);

    var rettangoli = '';
    for (var i = 0; i < b.length; i++) {
      var rx = (b[i].x + quietZone) * moduloPx;
      var rw = b[i].w * moduloPx;
      rettangoli += '<rect x="' + rx + '" y="0" width="' + rw + '" height="' + altezzaPx + '" fill="' + colore + '"/>';
    }

    var testoSvg = '';
    if (mostraTesto) {
      var etichetta = chipTesto(valore);
      testoSvg = '<text x="' + (widthSvg / 2) + '" y="' + (altezzaPx + 14) + '" font-family="monospace, sans-serif" font-size="12" font-weight="bold" text-anchor="middle" fill="' + colore + '">' + etichetta + '</text>';
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + widthSvg + ' ' + heightSvg + '" width="' + widthSvg + '" height="' + heightSvg + '" shape-rendering="crispEdges" style="background:' + fondo + ';display:inline-block;max-width:100%;height:auto;">' +
      rettangoli + testoSvg + '</svg>';
  }

  /* Decodificatore Code 128: dalla sequenza di bit o moduli alla stringa originale */
  function decodifica(bits) {
    bits = String(bits || '').trim();
    if (!bits.length) throw new Error('decodifica(): sequenza vuota.');

    var cwList = [];
    var i = 0;
    while (i < bits.length) {
      // Se mancano 13 bit e l'ultimo è STOP
      if (bits.length - i === 13) {
        var p13 = bits.slice(i, i + 13);
        if (BITS_TO_CW[p13] !== STOP) throw new Error('decodifica(): pattern STOP non valido: ' + p13);
        cwList.push(STOP);
        i += 13;
        break;
      }
      var p11 = bits.slice(i, i + 11);
      if (!(p11 in BITS_TO_CW)) throw new Error('decodifica(): pattern sconosciuto a posizione ' + i + ': ' + p11);
      cwList.push(BITS_TO_CW[p11]);
      i += 11;
    }

    if (cwList.length < 3) throw new Error('decodifica(): sequenza troppo corta per essere Code 128.');
    var start = cwList[0];
    var stop = cwList[cwList.length - 1];
    var checksum = cwList[cwList.length - 2];
    var dati = cwList.slice(1, cwList.length - 2);

    if (stop !== STOP) throw new Error('decodifica(): manca codeword STOP.');
    if (start !== START_A && start !== START_B && start !== START_C) {
      throw new Error('decodifica(): start non valido: ' + start);
    }

    // Verifica checksum
    var somma = start;
    for (var k = 0; k < dati.length; k++) {
      somma += dati[k] * (k + 1);
    }
    if ((somma % 103) !== checksum) {
      throw new Error('decodifica(): checksum errato (' + (somma % 103) + ' != ' + checksum + ').');
    }

    // Ricostruzione testo
    var modo = (start === START_C) ? 'C' : ((start === START_B) ? 'B' : 'A');
    var testo = '';
    for (var idx = 0; idx < dati.length; idx++) {
      var c = dati[idx];
      if (modo === 'C') {
        if (c === CODE_B) { modo = 'B'; continue; }
        if (c < 0 || c > 99) throw new Error('decodifica(): valore non valido in modo C: ' + c);
        testo += (c < 10 ? '0' : '') + c;
      } else if (modo === 'B') {
        if (c === CODE_C) { modo = 'C'; continue; }
        if (c < 0 || c > 95) throw new Error('decodifica(): valore non valido in modo B: ' + c);
        testo += String.fromCharCode(c + 32);
      } else {
        // Modo A
        if (c === CODE_C) { modo = 'C'; continue; }
        if (c === CODE_B) { modo = 'B'; continue; }
        testo += String.fromCharCode(c < 64 ? c + 32 : c - 64);
      }
    }
    return testo;
  }

  return {
    WIDTHS: WIDTHS,
    START_A: START_A,
    START_B: START_B,
    START_C: START_C,
    STOP: STOP,
    CODE_B: CODE_B,
    CODE_C: CODE_C,
    codewords: codewords,
    moduli: moduli,
    barre: barre,
    larghezzaModuli: larghezzaModuli,
    validoChip: validoChip,
    validoCf: validoCf,
    chipTesto: chipTesto,
    svg: svg,
    decodifica: decodifica
  };
});
