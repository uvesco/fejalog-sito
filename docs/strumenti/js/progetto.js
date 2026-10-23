/* Il backup di Fejalog letto per gli strumenti del sito: manifesto, pacchetto, registro, export per stabilimento,
   numerazione assegnata. Dà anche la distinta dei capi non prelevati e la scheda di una provetta (chi, quando, come è
   stata letta). Tutto in memoria, nel browser: niente parte verso nessun server. Niente ?. e ?? */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./zip.js'), require('./registro.js'));
  else root.FejProgetto = factory(root.FejZip, root.FejRegistro);
})(typeof self !== 'undefined' ? self : this, function (Zip, Reg) {
'use strict';

function json(files, nome) {
  if (!files[nome]) throw new Error('Nel backup manca ' + nome + ': è proprio uno zip di backup di Fejalog?');
  return JSON.parse(Zip.testo(files[nome]));
}

/* buf: il file zip → Promise<P> */
function leggiBackup(buf) {
  return Zip.leggi(buf).then(function (files) {
    var manifesto = json(files, 'backup.json');
    if (manifesto.formato !== 'fejalog-backup') throw new Error('Questo non è un backup di Fejalog (formato «' + manifesto.formato + '»).');
    var pacchetto = json(files, 'pacchetto.json');
    var eventi = [];
    Object.keys(files).filter(function (n) { return /^registro\/[^/]+\.jsonl$/.test(n); }).sort().forEach(function (n) {
      Zip.testo(files[n]).split('\n').forEach(function (riga) { if (riga.trim()) eventi.push(JSON.parse(riga)); });
    });
    var esporti = Object.keys(files).filter(function (n) { return /^export\/export_accettazione_[^/]*\.json$/.test(n); }).sort().map(function (n) {
      var e = JSON.parse(Zip.testo(files[n]));
      var voce = (manifesto.export || []).filter(function (x) { return x.file === n; })[0];
      var meta = e.meta || {};
      return { file: n, codice: voce ? voce.stabilimento : meta.azienda || meta.codice_lavorazione || n, export: e };
    });
    if (!esporti.length) throw new Error('Nel backup non c\'è nessun export: nessuna provetta registrata?');
    return {
      manifesto: manifesto, pacchetto: pacchetto, eventi: eventi, esporti: esporti,
      numerazioneCsv: files['numerazione_chiave.csv'] ? Zip.testo(files['numerazione_chiave.csv']) : '',
      verifica: Reg.verifica(eventi, manifesto, pacchetto),
      chiave: String(pacchetto.sha256) + ':' + String(manifesto.registro && manifesto.registro.impronta),
    };
  });
}

function stabilimento(P, codice) {
  var l = ((P.pacchetto.config || {}).stabilimenti_lavoro || []).filter(function (s) { return s.codice === codice; })[0];
  if (l) return { codice: l.codice, lettera: l.lettera || '', denominazione: l.denominazione || '' };
  var e = P.esporti.filter(function (x) { return x.codice === codice; })[0];
  var meta = (e && e.export.meta) || {};
  return { codice: codice, lettera: '', denominazione: meta.denominazione || '' };
}

function righeCsv(testo) {
  var righe = String(testo || '').replace(/^﻿/, '').split(/\r?\n/).filter(function (r) { return r.trim() !== ''; });
  return righe.slice(1).map(function (r) {
    var c = r.split(';');
    return { stabilimento: c[0], specie: c[1], numero: parseInt(c[2], 10), etichetta: c[3], contrassegno: c[4], sesso: c[5] || '', razza: c[6] || '', dataNascita: c[7] || '' };
  });
}

/* I capi che hanno già una provetta valida (le eliminate non contano, come nella copertura dell'app). */
function capiFatti(esporti) {
  var fatti = {};
  esporti.forEach(function (e) {
    (e.export.records || []).forEach(function (r) {
      if (r.contrassegno && r.soluzione !== 'esclusa') fatti[r.specie + '|' + r.contrassegno] = true;
    });
  });
  return fatti;
}

/* I capi non prelevati secondo il backup: la numerazione assegnata (capi in età diagnostica), altrimenti i presenti
   degli stabilimenti di lavoro. `esporti` sono quelli da considerare (con le tardive già dentro). */
function nonPrelevati(P, esporti) {
  var fatti = capiFatti(esporti || P.esporti), out = [];
  var righe = righeCsv(P.numerazioneCsv);
  if (righe.length) {
    righe.forEach(function (r) {
      if (!fatti[r.specie + '|' + r.contrassegno]) {
        out.push({ contrassegno: r.contrassegno, specie: r.specie, sesso: r.sesso, razza: r.razza, dataNascita: r.dataNascita,
          stabilimento: r.stabilimento, numeroAssegnato: isNaN(r.numero) ? null : r.numero });
      }
    });
  } else {
    var lavoro = ((P.pacchetto.config || {}).stabilimenti_lavoro || []).map(function (s) { return s.codice; });
    ['pecore', 'capre'].forEach(function (sp) {
      ((P.pacchetto.specie_dati[sp] || {}).presenti || []).forEach(function (c) {
        if (lavoro.indexOf(c.codice_stabilimento) >= 0 && !fatti[sp + '|' + c.contrassegno]) {
          out.push({ contrassegno: c.contrassegno, specie: sp, sesso: c.sesso || '', razza: c.razza || '', dataNascita: c.data_nascita || '',
            stabilimento: c.codice_stabilimento, numeroAssegnato: null });
        }
      });
    });
  }
  return out.sort(function (a, b) {
    return a.specie < b.specie ? -1 : a.specie > b.specie ? 1 : a.stabilimento < b.stabilimento ? -1 : a.stabilimento > b.stabilimento ? 1 :
      (a.numeroAssegnato == null ? 1e9 : a.numeroAssegnato) - (b.numeroAssegnato == null ? 1e9 : b.numeroAssegnato) ||
      (a.contrassegno < b.contrassegno ? -1 : 1);
  });
}

var NOMI_IDENT = { elettronica: 'codice elettronico letto per intero (lettore di microchip)', completa: 'contrassegno digitato per intero',
  cifre: 'scelto fra i contrassegni con le cifre digitate', elenco: 'scelto dall\'elenco dei mancanti', a_mano: 'contrassegno scritto a mano' };

/* La scheda di una provetta per i casi dubbi: [[etichetta, valore]…] e gli eventi del registro con quel uid. */
function scheda(P, r) {
  var campi = [
    ['Etichetta', r.etichetta], ['Contrassegno', r.contrassegno], ['Specie', r.specie], ['Stabilimento', r.codice_stabilimento],
    ['Prelevata da', r.operatore + (r.lettera ? ' (lettera ' + r.lettera + ')' : '')], ['Quando', r.ts],
    ['Come è stato letto', (NOMI_IDENT[r.identificazione] || r.identificazione || '') +
      (r.identificazione === 'cifre' && r.candidati ? ' (' + r.candidati + ' candidati)' : '')],
    ['Metodo d\'ingresso', r.metodo_ingresso], ['Codice letto', r.codice_letto || ''],
    ['Sesso · razza · nascita', [r.sesso, r.razza, r.data_nascita].filter(Boolean).join(' · ')],
    ['Categoria', r.categoria], ['Origine del numero', r.origine_numero], ['Note', r.note || ''],
  ];
  var storia = (r.storia_numeri || []).map(function (s) { return [s.ts, s.evento + ' ' + s.etichetta + (s.motivo ? ' (' + s.motivo + ')' : '')]; });
  var eventi = (P.eventi || []).filter(function (e) { return e.dati && (e.dati.uid === r.uid || (e.dati.uids || []).indexOf(r.uid) >= 0); })
    .map(function (e) { return { ts: e.ts, tipo: e.tipo, op: e.op }; });
  return { campi: campi.filter(function (c) { return c[1] !== '' && c[1] != null; }), storia: storia, eventi: eventi };
}

return { leggiBackup: leggiBackup, stabilimento: stabilimento, nonPrelevati: nonPrelevati, scheda: scheda, capiFatti: capiFatti, righeCsv: righeCsv };
});
