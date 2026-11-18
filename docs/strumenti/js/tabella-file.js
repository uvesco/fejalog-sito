/* File intermedi compilati a mano (utente, 2026-11-18): se la BDN cambia e uno snippet non funziona più, gli stessi dati si copiano
   dalla BDN in un modello .xlsx (o .csv) scaricato dal sito e si caricano al posto del file dello snippet. Qui: lettura di un
   .xlsx o di un .csv in righe (oggetti per intestazione) e conversione nei due formati di Fejalog
   (`fejalog-uscite-modello` v1 e `fejalog-verifica-bdn` v1). Tutto nel browser; in Node per le prove. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./zip.js'));
  else root.FejTabella = factory(root.FejZip);
})(typeof self !== 'undefined' ? self : this, function (Zip) {
'use strict';

function p2(n) { return (n < 10 ? '0' : '') + n; }
function pulisci(t) { return String(t == null ? '' : t).replace(/\s+/g, ' ').trim(); }
function norma(c) { return String(c == null ? '' : c).replace(/\s+/g, '').toUpperCase(); }
function chiave(t) { return pulisci(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); }
function xml(t) { return String(t).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(+n); }).replace(/&amp;/g, '&'); }

/** Il numero seriale di Excel (giorni dal 1900) in «gg/mm/aaaa». */
function serialeInData(n) {
  var d = new Date(Date.UTC(1899, 11, 30) + Math.round(Number(n)) * 86400000);
  return p2(d.getUTCDate()) + '/' + p2(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear();
}
/** Una data scritta a mano o da Excel in «gg/mm/aaaa»; '' se non si legge. */
function data(t) {
  var s = pulisci(t), m;
  if (/^\d{5}(\.\d+)?$/.test(s)) return serialeInData(parseFloat(s));
  if ((m = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(s))) return p2(+m[1]) + '/' + p2(+m[2]) + '/' + m[3];
  if ((m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s))) return m[3] + '/' + m[2] + '/' + m[1];
  return '';
}

/** Le righe di una tabella (prima riga = intestazioni) come oggetti; le righe vuote e quelle d'esempio («ESEMPIO») si saltano. */
function oggetti(tabella) {
  var i0 = -1;
  for (var i = 0; i < tabella.length && i0 < 0; i++) if (tabella[i].some(function (c) { return pulisci(c); })) i0 = i;
  if (i0 < 0) return [];
  var int = tabella[i0].map(chiave), out = [];
  for (var r = i0 + 1; r < tabella.length; r++) {
    var riga = tabella[r], o = {}, pieno = false;
    int.forEach(function (k, j) { if (!k) return; var v = pulisci(riga[j]); o[k] = v; if (v) pieno = true; });
    if (pieno && !/^esempio/i.test(Object.keys(o).map(function (k) { return o[k]; }).join(' ').trim())) { o._riga = r + 1; out.push(o); }
  }
  return out;
}

/** Un CSV (separatore ; , o tabulazione, virgolette doppie) in tabella. */
function leggiCsv(testo) {
  var t = String(testo).replace(/^﻿/, ''), prima = t.split(/\r?\n/)[0] || '';
  var sep = (prima.match(/;/g) || []).length >= (prima.match(/,/g) || []).length ? ((prima.match(/\t/g) || []).length > (prima.match(/;/g) || []).length ? '\t' : ';') : ',';
  var righe = [], riga = [], c = '', dentro = false;
  for (var i = 0; i < t.length; i++) {
    var ch = t[i];
    if (dentro) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else dentro = false; } else c += ch; }
    else if (ch === '"') dentro = true;
    else if (ch === sep) { riga.push(c); c = ''; }
    else if (ch === '\n') { riga.push(c); righe.push(riga); riga = []; c = ''; }
    else if (ch !== '\r') c += ch;
  }
  if (c !== '' || riga.length) { riga.push(c); righe.push(riga); }
  return righe;
}

function colonna(ref) { var m = /^([A-Z]+)/.exec(ref || ''), n = 0; if (!m) return -1; for (var i = 0; i < m[1].length; i++) n = n * 26 + (m[1].charCodeAt(i) - 64); return n - 1; }
/** Il primo foglio di un .xlsx in tabella (stringhe condivise e in linea, numeri come testo). */
function leggiXlsx(buf) {
  return Zip.leggi(buf).then(function (file) {
    var nomi = Object.keys(file), foglio = nomi.filter(function (n) { return /^xl\/worksheets\/sheet\d+\.xml$/.test(n); }).sort(function (a, b) { return parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10); })[0];
    if (!foglio) throw new Error('nel file .xlsx non trovo nessun foglio');
    var condivise = [];
    if (file['xl/sharedStrings.xml']) {
      var ss = Zip.testo(file['xl/sharedStrings.xml']), re = /<si>([\s\S]*?)<\/si>/g, m;
      while ((m = re.exec(ss))) condivise.push(xml((m[1].match(/<t[^>]*>([\s\S]*?)<\/t>/g) || []).map(function (x) { return x.replace(/<[^>]+>/g, ''); }).join('')));
    }
    var x = Zip.testo(file[foglio]), tabella = [], rr = /<row[^>]*>([\s\S]*?)<\/row>/g, r;
    while ((r = rr.exec(x))) {
      var riga = [], cc = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, c, prossima = 0;
      while ((c = cc.exec(r[1]))) {
        var attr = c[1], dentro = c[2] || '', ref = (/r="([A-Z]+\d+)"/.exec(attr) || [])[1], tipo = (/t="([^"]+)"/.exec(attr) || [])[1] || 'n';
        var j = ref ? colonna(ref) : prossima; prossima = j + 1;
        var v = (/<v>([\s\S]*?)<\/v>/.exec(dentro) || [])[1], val = '';
        if (tipo === 's') val = condivise[parseInt(v, 10)] || '';
        else if (tipo === 'inlineStr') val = xml((dentro.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || []).map(function (y) { return y.replace(/<[^>]+>/g, ''); }).join(''));
        else if (v != null) val = xml(v);
        while (riga.length < j) riga.push('');
        riga[j] = val;
      }
      tabella.push(riga);
    }
    return tabella;
  });
}
/** Un file (nome e contenuto) in righe: .xlsx o .csv/.txt. */
function leggi(nome, buf) {
  if (/\.xlsx$/i.test(nome)) return leggiXlsx(buf).then(oggetti);
  var u = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Promise.resolve(oggetti(leggiCsv(Zip.testo(u))));
}

var COLONNE_USCITE = ['stabilimento', 'specie', 'contrassegno', 'data', 'tipo', 'destinazione_codice', 'modello', 'destinazione'];
/** Le righe del modello «uscite per modello» nel file `fejalog-uscite-modello` v1; gli errori dicono la riga. */
function usciteModello(righe, timbro) {
  var uscite = [], errori = [];
  righe.forEach(function (o) {
    var c = norma(o.contrassegno), st = norma(o.stabilimento), d = data(o.data), sp = /capr/i.test(o.specie) ? 'capre' : /ov|pecor/i.test(o.specie) ? 'pecore' : '';
    var tipo = /macell/i.test(o.tipo) ? 'macello' : /vend|cess|sosta|allev|fiera|mercat/i.test(o.tipo) ? 'vendita' : pulisci(o.tipo) ? 'altro' : '';
    var manca = [!st ? 'stabilimento' : '', !sp ? 'specie (pecore o capre)' : '', !c ? 'contrassegno' : '', !d ? 'data (gg/mm/aaaa)' : '', !tipo ? 'tipo (macello, vendita o altro)' : ''].filter(Boolean);
    if (manca.length) { errori.push('riga ' + o._riga + ': manca o non si legge ' + manca.join(', ')); return; }
    uscite.push({ stabilimento: st, specie: sp, contrassegno: c, data: d, tipo: tipo, modello: pulisci(o.modello), destinazione_codice: norma(o.destinazione_codice), destinazione: pulisci(o.destinazione).slice(0, 80) });
  });
  return { file: { formato: 'fejalog-uscite-modello', versione: 1, timbro: timbro, giorni: 7, origine: 'compilato a mano', uscite: uscite }, errori: errori };
}

var COLONNE_VERIFICA = ['contrassegno', 'trovato', 'specie', 'sesso', 'razza', 'nascita', 'stato', 'stabilimento', 'codice_elettronico', 'marca_stato', 'marca_allevamento'];
/**
 * Le righe del modello «verifica dei contrassegni» nel file `fejalog-verifica-bdn` v1. `trovato`: capo (il contrassegno è di
 * un capo registrato: servono specie, sesso, nascita, stato e stabilimento), marca (identificativo mai applicato: marca_stato
 * USABILE e marca_allevamento) o no (non trovato in BDN).
 */
function verificaBdn(righe, timbro) {
  var risultati = [], errori = [];
  righe.forEach(function (o) {
    var c = norma(o.contrassegno), come = /capo/i.test(o.trovato) ? 'capo' : /marc|identificativ/i.test(o.trovato) ? 'marca' : /^(no|non)/i.test(pulisci(o.trovato)) ? 'no' : '';
    if (!c) { errori.push('riga ' + o._riga + ': manca il contrassegno'); return; }
    if (!come) { errori.push('riga ' + o._riga + ': «trovato» deve essere capo, marca o no'); return; }
    var sp = /capr/i.test(o.specie) ? 'CAPRINI' : /ov|pecor/i.test(o.specie) ? 'OVINI' : '';
    var r = { contrassegno: c, etichette: 'compilato a mano', capi: [], marca: null, errore: '' };
    if (come === 'capo') {
      var manca = [!sp ? 'specie' : '', !/^[MF]$/i.test(pulisci(o.sesso)) ? 'sesso (M o F)' : '', !pulisci(o.stato) ? 'stato (VIVO, MACELLATO…)' : '', !norma(o.stabilimento) ? 'stabilimento' : ''].filter(Boolean);
      if (manca.length) { errori.push('riga ' + o._riga + ': per un capo manca ' + manca.join(', ')); return; }
      r.capi.push({ codice: c, sesso: pulisci(o.sesso).toUpperCase(), razza: pulisci(o.razza).toUpperCase(), specie: sp, nascita: data(o.nascita), precedente: '', elettronico: norma(o.codice_elettronico), stato: pulisci(o.stato).toUpperCase(), stabilimento: norma(o.stabilimento) });
    } else if (come === 'marca') {
      if (!sp || !norma(o.marca_allevamento)) { errori.push('riga ' + o._riga + ': per una marca servono specie e marca_allevamento'); return; }
      r.marca = { codice: c, stato: (pulisci(o.marca_stato) || 'USABILE').toUpperCase(), allevamento: norma(o.marca_allevamento), specie: sp, data_richiesta: '' };
    }
    risultati.push(r);
  });
  return { file: { formato: 'fejalog-verifica-bdn', versione: 1, timbro: timbro, cercati: risultati.length, origine: 'compilato a mano', risultati: risultati }, errori: errori };
}

/* I due modelli da compilare: nome del file, colonne, righe d'esempio (non lette) e istruzioni (secondo foglio). */
var MODELLI = {
  uscite: { nome: 'fejalog_uscite_modello_da_compilare', colonne: COLONNE_USCITE,
    esempi: [['ESEMPIO 888TO999', 'pecore', 'IT066000000101', '14/11/2026', 'vendita', '888TO777', 'IT888TO999202600001', 'stalla di sosta']],
    istruzioni: ['Una riga per ogni capo uscito con un documento di accompagnamento (modello 4) nei 7 giorni prima del risanamento.',
      'Dalla BDN: Movimentazioni › Ricerca modelli › Origine, codice allevamento; poi il dettaglio di ogni modello, coi suoi capi.',
      'stabilimento: il codice dello stabilimento di partenza (quello in risanamento). specie: pecore o capre.',
      'contrassegno: il codice del capo, come in BDN. data: la data di partenza, gg/mm/aaaa.',
      'tipo: macello, vendita (anche stalla di sosta, altro allevamento, fiera) oppure altro (per esempio pascolo).',
      'destinazione_codice: il codice dello stabilimento (o del macello) di destinazione; modello: il numero del documento di accompagnamento (IT…). Con questi due, cercando il capo si legge «uscito il … verso … con documento …».',
      'destinazione (descrizione) è facoltativa. La riga che comincia con ESEMPIO non viene letta: si può lasciare o cancellare.',
      'Il file compilato si carica in Fejalog dove si caricherebbe il file dello snippet (sito: Crea il progetto, oppure Fine lavori › Carica).'] },
  verifica: { nome: 'fejalog_verifica_bdn_da_compilare', colonne: COLONNE_VERIFICA,
    esempi: [['ESEMPIO IT066000000555', 'capo', 'pecore', 'F', 'BIELLESE', '01/03/2021', 'VIVO', '888TO777', '', '', ''],
      ['ESEMPIO IT066000000900', 'marca', 'pecore', '', '', '', '', '', '', 'USABILE', '888TO999'],
      ['ESEMPIO IT066000000999', 'no', '', '', '', '', '', '', '', '', '']],
    istruzioni: ['Una riga per ogni contrassegno fuori registro cercato in BDN (Dati › Interrogazioni › Capi e › Identificativi).',
      'trovato: capo (è un capo registrato), marca (identificativo mai applicato) oppure no (non trovato).',
      'Per un capo: specie (pecore o capre), sesso (M o F), razza, nascita (gg/mm/aaaa), stato (VIVO, MACELLATO, MORTO, VENDUTO, SMARRITO…) e stabilimento dove è iscritto.',
      'Per una marca: specie, marca_stato (USABILE) e marca_allevamento (lo stabilimento che l’ha avuta).',
      'Le righe che cominciano con ESEMPIO non vengono lette. Il file compilato si carica in Fejalog dove si caricherebbe il file dello snippet (Fine lavori › Carica).'] },
};
/** I fogli del modello (per `xlsxBuild`): «dati» con le righe d'esempio e «istruzioni». Tutte le celle sono testo, così Excel non tocca date e codici. */
function fogliModello(tipo) {
  var m = MODELLI[tipo];
  var righe = m.esempi.map(function (v) { var o = {}; m.colonne.forEach(function (c, i) { o[c] = v[i] || ''; }); return o; });
  return [{ nome: 'dati', colonne: m.colonne, righe: righe, testo: m.colonne }, { nome: 'istruzioni', colonne: ['Istruzioni'], righe: m.istruzioni.map(function (t) { return { Istruzioni: t }; }), testo: ['Istruzioni'] }];
}

/** Quale dei due modelli è, dalle intestazioni. */
function riconosci(righe) {
  var k = righe.length ? Object.keys(righe[0]) : [];
  if (k.indexOf('trovato') >= 0) return 'verifica';
  if (k.indexOf('data') >= 0 && k.indexOf('tipo') >= 0) return 'uscite';
  return '';
}

return { leggi: leggi, leggiCsv: leggiCsv, leggiXlsx: leggiXlsx, oggetti: oggetti, data: data, serialeInData: serialeInData, usciteModello: usciteModello, verificaBdn: verificaBdn,
  riconosci: riconosci, MODELLI: MODELLI, fogliModello: fogliModello, COLONNE_USCITE: COLONNE_USCITE, COLONNE_VERIFICA: COLONNE_VERIFICA };
});
