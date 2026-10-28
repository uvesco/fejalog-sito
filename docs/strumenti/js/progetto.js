/* Il backup di Fejalog letto per gli strumenti del sito: manifesto, pacchetto, registro, export per stabilimento,
   numerazione assegnata. Dà anche la distinta dei capi non prelevati e la scheda di una provetta (chi, quando, come è
   stata letta). Tutto in memoria, nel browser: niente parte verso nessun server. Niente ?. e ?? */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./zip.js'), require('./registro.js'), require('./dominio.js'));
  else root.FejProgetto = factory(root.FejZip, root.FejRegistro, root.FejDominio);
})(typeof self !== 'undefined' ? self : this, function (Zip, Reg, Dominio) {
'use strict';

function json(files, nome) {
  if (!files[nome]) throw new Error('Nel backup manca ' + nome + ': è proprio uno zip di backup di Fejalog?');
  return JSON.parse(Zip.testo(files[nome]));
}

function costruisciProgetto(manifesto, pacchetto, eventi, esporti, files) {
  var P = {
    manifesto: manifesto, pacchetto: pacchetto, eventi: eventi, esporti: esporti,
    numerazioneCsv: files && files['numerazione_chiave.csv'] ? (typeof files['numerazione_chiave.csv'] === 'string' ? files['numerazione_chiave.csv'] : Zip.testo(files['numerazione_chiave.csv'])) : '',
    verifica: Reg.verifica(eventi, manifesto, pacchetto),
    modifichePendenti: files && files['fejalog-modifiche.json'] ? JSON.parse(typeof files['fejalog-modifiche.json'] === 'string' ? files['fejalog-modifiche.json'] : Zip.testo(files['fejalog-modifiche.json'])) : null,
    chiave: String(pacchetto.sha256) + ':' + String(manifesto.registro && manifesto.registro.impronta),
  };
  var stato = Dominio.applica(P, []);
  P.esporti = stato.esporti;
  P.etaMesi = stato.impostazioni.eta_diagnostica_mesi;
  P.chiudiBuchi = stato.impostazioni.chiudi_buchi;
  P.riordinoIniziato = stato.impostazioni.riordino_iniziato;
  P.regole = stato.impostazioni.regole;
  P.eventiEfficaci = stato.eventiEfficaci;
  P.etichetteStoriche = {};
  stato.etichette.forEach(function (et) { P.etichetteStoriche[et.toUpperCase()] = true; });
  P.spunteBackup = stato.spunte;
  P.stabilimenti = stato.stabilimenti;
  return P;
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
    return costruisciProgetto(manifesto, pacchetto, eventi, esporti, files);
  });
}

/* buffers: Array di ArrayBuffer o Uint8Array di più backup dello stesso progetto → Promise<{ P, files, zipBytes, resoconto }> */
function riconciliaBackup(buffers, opz) {
  if (!buffers || !buffers.length) return Promise.reject(new Error('Nessun file fornito per la riconciliazione.'));
  opz = opz || {};
  return Promise.all(buffers.map(function (b) { return Zip.leggi(b); })).then(function (listaFiles) {
    var ingressi = listaFiles.map(function (files, i) {
      if (!files['pacchetto.json']) throw new Error('Nel file #' + (i + 1) + ' manca pacchetto.json');
      var manifesto = files['backup.json'] ? JSON.parse(Zip.testo(files['backup.json'])) : {};
      if (manifesto.formato && manifesto.formato !== 'fejalog-backup') throw new Error('Il file #' + (i + 1) + ' non è un backup di Fejalog.');
      var ev = [];
      Object.keys(files).filter(function (n) { return /^registro\/[^/]+\.jsonl$/.test(n); }).sort().forEach(function (n) {
        Zip.testo(files[n]).split('\n').forEach(function (r) { if (r.trim()) ev.push(JSON.parse(r)); });
      });
      return {
        pacchetto: Zip.testo(files['pacchetto.json']),
        eventi: ev,
        manifesto: manifesto,
        avvisi: Reg.verifica(ev, manifesto, JSON.parse(Zip.testo(files['pacchetto.json']))).errori,
        rete: manifesto.rete || null
      };
    });
    var adesso = (opz.adesso && opz.adesso.toISOString()) || new Date().toISOString();
    var ris = Dominio.riconciliaBackup(ingressi, {
      nome: opz.nome || 'Sito',
      codice_fiscale: opz.codice_fiscale || null,
      dispositivo: opz.dispositivo || 'Browser',
      device: opz.device || 'sito'
    }, adesso, opz.ora || '', 'sito');

    var pendenti = [], perId = Object.create(null);
    listaFiles.forEach(function (files) {
      if (!files['fejalog-modifiche.json']) return;
      var f = JSON.parse(Zip.testo(files['fejalog-modifiche.json']));
      if (f.formato !== 'fejalog-modifiche' || !f.origine || f.origine.pacchetto_id !== ris.pacchetto.id || f.origine.pacchetto_sha256 !== ris.pacchetto.sha256) throw new Error('Le modifiche allegate sono di un altro progetto.');
      (f.azioni || []).forEach(function (a) {
        if (perId[a.id] && Reg.jcs(perId[a.id]) !== Reg.jcs(a)) throw new Error('Conflitto fra modifiche allegate con lo stesso identificativo.');
        if (!perId[a.id]) { perId[a.id] = a; pendenti.push(a); }
      });
    });
    if (pendenti.length) ris.files['fejalog-modifiche.json'] = JSON.stringify({formato:'fejalog-modifiche',versione:2,
      origine:{pacchetto_id:ris.pacchetto.id,pacchetto_sha256:ris.pacchetto.sha256,impronta:ris.impronta,creato_il:adesso,nome:opz.nome || 'Sito'},azioni:pendenti});

    var esporti = Object.keys(ris.files).filter(function (n) { return /^export\/export_accettazione_[^/]*\.json$/.test(n); }).sort().map(function (n) {
      var e = JSON.parse(ris.files[n]);
      var voce = (ris.manifesto.export || []).filter(function (x) { return x.file === n; })[0];
      var meta = e.meta || {};
      return { file: n, codice: voce ? voce.stabilimento : meta.azienda || meta.codice_lavorazione || n, export: e };
    });

    var P = costruisciProgetto(ris.manifesto, ris.pacchetto, ris.eventi, esporti, ris.files);
    var vociZip = Object.keys(ris.files).sort().map(function (nome) {
      return { name: nome, data: ris.files[nome] };
    });
    var zipBytes = Zip.scrivi(vociZip);
    var resoconto = {
      backupUniti: buffers.length,
      eventiTotali: ris.eventi.length,
      impronta: ris.impronta,
      device: ris.manifesto.registro ? ris.manifesto.registro.device : 0
    };
    return { P: P, files: ris.files, zipBytes: zipBytes, resoconto: resoconto };
  });
}

function stabilimento(P, codice) {
  return (P.stabilimenti || Dominio.applica(P, []).stabilimenti).filter(function (s) { return s.codice === codice; })[0] || { codice: codice, lettera: '', denominazione: '' };
}

function righeCsv(testo) {
  var righe = String(testo || '').replace(/^﻿/, '').split(/\r?\n/).filter(function (r) { return r.trim() !== ''; });
  return righe.slice(1).map(function (r) {
    var c = r.split(';');
    return { stabilimento: c[0], specie: c[1], numero: parseInt(c[2], 10), etichetta: c[3], contrassegno: c[4], sesso: c[5] || '', razza: c[6] || '', dataNascita: c[7] || '' };
  });
}

/* La distinta viene da NonTrovati; azioni applicate comprese. */
function nonPrelevati(P, azioni) { return Dominio.applica(P, azioni || []).nonPrelevati; }

var NOMI_IDENT = { elettronica: 'codice elettronico letto per intero (lettore di microchip)', completa: 'contrassegno digitato per intero',
  cifre: 'scelto fra i contrassegni con le cifre digitate', elenco: 'scelto dall\'elenco dei mancanti', a_mano: 'contrassegno scritto a mano' };

/* La scheda di una provetta per i casi dubbi: [[etichetta, valore]…] e gli eventi del registro con quel uid. */
function scheda(P, r) {
  var identOp = r.sigla_veterinario ? ' (sigla ' + r.sigla_veterinario + ')' : (r.lettera ? ' (lettera ' + r.lettera + ')' : '');
  var campi = [
    ['Etichetta', r.etichetta], ['Contrassegno', r.contrassegno], ['Specie', r.specie], ['Stabilimento', r.codice_stabilimento],
    ['Prelevata da', r.operatore + identOp], ['Quando', r.ts],
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

/* Lo stabilimento di un capo, dai record degli export (per le azioni sul riordino con più stabilimenti). */
function stabilimentoDi(P, specie, contrassegno, esporti) {
  var trovato = null;
  (esporti || P.esporti).forEach(function (e) { (e.export.records || []).forEach(function (r) { if (!trovato && r.specie === specie && r.contrassegno === contrassegno) trovato = e.codice; }); });
  return trovato || (P.esporti[0] && P.esporti[0].codice) || '';
}

return { leggiBackup: leggiBackup, riconciliaBackup: riconciliaBackup, stabilimento: stabilimento, nonPrelevati: nonPrelevati, scheda: scheda, stabilimentoDi: stabilimentoDi, righeCsv: righeCsv, inEta: Dominio.inEta };
});
