/* Le azioni dello stato applicate agli export del backup (stesso modello della pagina «Dopo il campo» di svet-tools:
   si modificano i record dell'export) e il calcolo di tutti i file di fine lavori col driver di Fejalog
   (fine_lavori.js, lo stesso dell'app). Niente va su internet. Niente ?. e ?? */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./progetto.js'));
  else root.FejAzioni = factory(root.FejProgetto);
})(typeof self !== 'undefined' ? self : this, function (Progetto) {
'use strict';

function copia(x) { return JSON.parse(JSON.stringify(x)); }
function str(x) { return x == null ? '' : String(x); }

/* L'etichetta scritta → i campi del record: il numero (coda main) o una sigla con numero come A3 (coda prob). */
function campiEtichetta(etichetta, capo) {
  var et = str(etichetta).trim().toUpperCase();
  var m;
  if (/^[0-9]+$/.test(et)) {
    if (capo.numeroAssegnato == null || parseInt(et, 10) !== capo.numeroAssegnato)
      throw new Error('L\'etichetta ' + et + ' non è il numero assegnato a questo capo' + (capo.numeroAssegnato != null ? ' (' + capo.numeroAssegnato + ')' : '') + ': scrivi una sigla con il numero, come A3 (per le altre scritte usa l\'app).');
    return { etichetta: et, numero_campo: et, progressivo: parseInt(et, 10), corsia: '', coda: 'main', origine_numero: 'assegnata_tardiva' };
  }
  m = /^([A-Z]{1,3})([0-9]+)$/.exec(et);
  if (m) return { etichetta: et, numero_campo: et, progressivo: parseInt(m[2], 10), corsia: m[1], coda: 'prob', origine_numero: 'rinumerata' };
  throw new Error('Etichetta «' + etichetta + '» non riconosciuta: il numero assegnato o una sigla con il numero, come A3 (per le altre scritte usa l\'app).');
}

/* Il record di una registrazione tardiva: i campi di un record dello stesso export come modello, così ci sono tutti. */
function recordTardiva(P, e, a, capo) {
  var esistenti = e.export.records || [];
  var modello = esistenti.filter(function (r) { return r.specie === capo.specie; })[0] || esistenti[0];
  if (!modello) throw new Error('L\'export non ha nessuna provetta da prendere a modello.');
  var presente = (((P.pacchetto.specie_dati || {})[capo.specie] || {}).presenti || []).filter(function (c) { return c.contrassegno === capo.contrassegno; })[0] || {};
  var nota = 'Registrazione tardiva: ' + str(a.nota).trim();
  var serie = capo.stabilimento + ':' + capo.specie;
  var r = Object.assign(copia(modello), campiEtichetta(a.etichetta, capo), {
    uid: a.uid || a.id, serie: serie, contrassegno: capo.contrassegno, specie: capo.specie,
    sesso: capo.sesso, razza: capo.razza, data_nascita: capo.dataNascita, specie_bdn: str(presente.specie_bdn || modello.specie_bdn),
    codice_stabilimento: capo.stabilimento, categoria: 'verde', in_arvet: true, duplicato: false, altro_stabilimento: false,
    specie_discordante: false, motivo_uscita: '', motivo_uscita_dec: '', data_uscita: '', soluzione: '', ricollocata_da: '',
    sostituisci_marche: false, acquisto_da: '', dda_dichiarato: false, dda_nota: '', dda_stato: '', anagrafica_forzata: null,
    sesso_corretto: '', note: nota, codice_letto: '', metodo_ingresso: 'mancanti', identificazione: 'elenco', candidati: a.candidati || 0,
    orecchino_dx: false, orecchino_sx: false, bolo: false, senza_transponder: false,
    operatore: str(a.nome) || 'Sito', device: 'sito', lettera: '', ts: a.ts, ts_raccolta: a.ts, offset_ms: 0,
  });
  if (r.fuori_eta !== undefined) r.fuori_eta = false;
  r.storia_numeri = [{ etichetta: r.etichetta, evento: 'registrata', motivo: 'registrazione tardiva', ts: a.ts }];
  return r;
}

/* → { esporti: [{codice, export, errori[]}] }: gli export con le azioni applicate; l'azione che non si può applicare
   non ferma le altre: finisce negli errori col suo motivo. M = il motore (AccMotore). */
function applica(P, azioni, M) {
  var esporti = P.esporti.map(function (e) { return { codice: e.codice, file: e.file, export: copia(e.export), errori: [] }; });
  var capi = Progetto.nonPrelevati(P, P.esporti);
  function tra(codice) { return esporti.filter(function (x) { return x.codice === codice; })[0]; }
  azioni.forEach(function (a) {
    try {
      if (a.tipo === 'soluzione') {
        var rec = null, dove = null;
        esporti.forEach(function (x) { (x.export.records || []).forEach(function (r) { if (r.uid === a.uid) { rec = r; dove = x; } }); });
        if (!rec) throw new Error('provetta ' + (a.etichetta || a.uid) + ' non trovata');
        if (a.soluzione === 'regola' || a.soluzione === '') { rec.soluzione = ''; return; }
        if (a.soluzione === 'coda' || a.soluzione === 'esclusa') { rec.soluzione = a.soluzione; return; }
        if (a.soluzione === 'normalizzata') {
          var tipo = M.tipologiaProblema(rec);
          if (!tipo) throw new Error('la provetta ' + rec.etichetta + ' non è una problematica');
          var perTipo = {}; perTipo[tipo] = 'normalizzata';
          var nuova = M.applicaSoluzioni([rec], { perTipo: perTipo, regs: P.pacchetto.registri, codiceLavoro: dove.codice, acquistiDda: {} })[0];
          if (nuova === rec || nuova.soluzione !== 'normalizzata') throw new Error('il capo ' + rec.contrassegno + ' non è nei registri dello stabilimento: non si può normalizzare');
          Object.keys(nuova).forEach(function (k) { rec[k] = nuova[k]; });
          return;
        }
        throw new Error('soluzione «' + a.soluzione + '» non gestita dal sito (la ricollocazione si sceglie nell\'app)');
      } else if (a.tipo === 'tardiva') {
        var capo = capi.filter(function (c) { return c.contrassegno === a.contrassegno && c.specie === a.specie; })[0];
        if (!capo) throw new Error('il capo ' + a.contrassegno + ' non è fra i non prelevati (già attribuito?)');
        var x = tra(capo.stabilimento) || esporti[0];
        x.export.records.push(recordTardiva(P, x, a, capo));
        capi = capi.filter(function (c) { return c !== capo; });
      } else if (a.tipo === 'spostamento' || a.tipo === 'scambio') {
        var y = tra(a.stabilimento) || esporti[0];
        var sp = y.export.spostamenti = y.export.spostamenti || { pecore: [], capre: [] };
        sp[a.specie] = sp[a.specie] || [];
        var voce = a.tipo === 'scambio' ? { contrassegno: a.a, con: a.b } : { contrassegno: a.contrassegno, provetta: a.provetta };
        if (a.quando === 'prima') voce.quando = 'prima';
        sp[a.specie].push(voce);
      }
      /* le spunte della guida non cambiano l'export: sono l'avanzamento del riordino */
    } catch (err) {
      (tra(a.stabilimento) || esporti[0]).errori.push((a.tipo || 'azione') + ': ' + err.message);
    }
  });
  return { esporti: esporti, nonPrelevati: capi };
}

function pad(n) { return ('0' + n).slice(-2); }
function stampDi(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '_' + pad(d.getHours()) + '-' + pad(d.getMinutes()) + '-' + pad(d.getSeconds()); }
function dataDi(d) { return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }

/* Tutti i file di fine lavori per ogni stabilimento, col driver dell'app. opz: {FineLavori, M, motoreArvet, adesso: Date,
   compatta, soloDati}. → [{codice, uscita: {file, riepilogo, dati}, errori[]}] */
function calcola(P, azioni, opz) {
  var adesso = opz.adesso || new Date();
  var ap = applica(P, azioni, opz.M);
  var uscite = ap.esporti.map(function (x) {
    var inp = {
      stabilimento: Progetto.stabilimento(P, x.codice), export: x.export,
      regs: { pecore: P.pacchetto.registri.pecore, capre: P.pacchetto.registri.capre },
      marche: { pecore: (P.pacchetto.specie_dati.pecore.disponibili || []).map(function (m) { return m.contrassegno; }),
        capre: (P.pacchetto.specie_dati.capre.disponibili || []).map(function (m) { return m.contrassegno; }) },
      decodifica: P.pacchetto.decodifica_uscite, ordine: null, compatta: !!opz.compatta, stamp: stampDi(adesso), data: dataDi(adesso),
      motoreArvet: opz.motoreArvet || '', soloDati: !!opz.soloDati, ricercati: [], generatoIl: adesso.toISOString(),
    };
    return { codice: x.codice, uscita: opz.FineLavori.calcola(inp), errori: x.errori };
  });
  return { uscite: uscite, nonPrelevati: ap.nonPrelevati, stamp: stampDi(adesso) };
}

return { applica: applica, calcola: calcola, recordTardiva: recordTardiva, campiEtichetta: campiEtichetta, stampDi: stampDi, dataDi: dataDi };
});
