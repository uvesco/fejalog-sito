/* Proietta le azioni tramite il dominio Kotlin e passa gli export al driver di fine lavori dell'app.
   Qui resta l'adattamento dei file. Il driver genera la guida fisica in HTML e xlsx. Tutto nel browser. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./progetto.js'), require('./dominio.js'));
  else root.FejAzioni = factory(root.FejProgetto, root.FejDominio);
})(typeof self !== 'undefined' ? self : this, function (Progetto, Dominio) {
'use strict';

function str(x) { return x == null ? '' : String(x); }
var driver = null;
function configuraDriver(fl) {
  driver = fl;
  Dominio.configuraMotoreRiordino(function (testo) { return JSON.stringify(fl.calcola(JSON.parse(testo))); });
}
function applica(P, azioni) { return Dominio.applica(P, azioni); }

/* «Da» come si legge in tabella: la sigla o il numero di partenza della riga della guida del motore. */
function daTesto(r, letteraStab) {
  if (r.da) return r.da;
  if (r.da_n == null) return '— (provetta nuova)';
  return (r.coda_da === 'prob' ? str(r.corsia_da) : str(letteraStab)) + r.da_n;
}

function guidaFisica(P, uscita, specie, letteraStab, codice, azioni) {
  return Dominio.guida(P, uscita, specie, letteraStab, codice || P.esporti[0].codice, azioni);
}

function pad(n) { return ('0' + n).slice(-2); }
function stampDi(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '_' + pad(d.getHours()) + '-' + pad(d.getMinutes()) + '-' + pad(d.getSeconds()); }
function dataDi(d) { return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }


/* Tutti i file di fine lavori per ogni stabilimento, col driver dell'app. opz: {FineLavori, M, motoreArvet, adesso: Date,
   proiezione, soloDati}. → [{codice, uscita: {file, riepilogo, dati}, errori[]}] */
function calcola(P, azioni, opz) {
  configuraDriver(opz.FineLavori);
  var adesso = opz.adesso || new Date();
  var ap = opz.proiezione || applica(P, azioni);
  var uscite = ap.esporti.map(function (x) {
    if (!(x.export.records || []).length) return { codice: x.codice, uscita: { file: [], riepilogo: null, dati: { specie: {} } }, errori: x.errori, vuoto: true };
    var inp = {
      stabilimento: Progetto.stabilimento(P, x.codice), export: x.export,
      regs: { pecore: P.pacchetto.registri.pecore, capre: P.pacchetto.registri.capre },
      marche: { pecore: (P.pacchetto.specie_dati.pecore.disponibili || []).map(function (m) { return m.contrassegno; }),
        capre: (P.pacchetto.specie_dati.capre.disponibili || []).map(function (m) { return m.contrassegno; }) },
      decodifica: P.pacchetto.decodifica_uscite, ordine: null, compatta: ap.impostazioni.chiudi_buchi, stamp: stampDi(adesso), data: dataDi(adesso),
      partenze: ap.partenze,
      riepilogoGestione: ap.riepilogoProblematici,
      motoreArvet: opz.motoreArvet || '', soloDati: !!opz.soloDati,
      ricercati: (ap.ricercatiPerStabilimento && ap.ricercatiPerStabilimento[x.codice]) || [],
      generatoIl: adesso.toISOString(),
    };
    var uscita = opz.FineLavori.calcola(inp);
    return { codice: x.codice, uscita: uscita, errori: x.errori };
  });
  return { uscite: uscite, nonPrelevati: ap.nonPrelevati, stamp: stampDi(adesso) };
}

return { configuraDriver: configuraDriver, daTesto: daTesto, guidaFisica: guidaFisica, applica: applica, calcola: calcola, stampDi: stampDi, dataDi: dataDi };
});
