/* Adattatore JSON alla facciata del dominio Kotlin, compilata in fejalog-shared.js. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./vendor/fejalog-shared.js'));
  else root.FejDominio = factory(root['fejalog:shared']);
})(typeof self !== 'undefined' ? self : this, function (bundle) {
'use strict';
var api = bundle.io.github.uvesco.fejalog.prova;
function json(x) { return JSON.stringify(x); }
var D = {
  creaProgetto: function (ingresso) { return JSON.parse(api.creaProgettoSito(json(ingresso))); },
  cercaCapiGestione: function (P, az, specie, query) { return JSON.parse(api.cercaCapiGestioneSito(json(P), json(az || []), specie, query)); },
  bordoPlateau: function (celle, serie, vista, numero, sequenza) {
    return JSON.parse(api.calcolaBordoPlateauSito(serie, vista, numero, json(celle), null, !!sequenza));
  },
  configuraMotoreRiordino: function (esegui) { api.configuraMotoreRiordinoSito(esegui); },
  materiale: function (dati, opzioni) { return JSON.parse(api.materialeSito(json(dati), json(opzioni || {}))); },
  numerazioneStampe: function (P) { return JSON.parse(api.numerazioneStampeSito(json(P))); },
  numerazioneFinaleStampe: function (P, az, sistemazioni) { return JSON.parse(api.numerazioneFinaleStampeSito(json(P), json(az || []), json(sistemazioni || {}))); },
  riconciliaBackup: function (ingressi, firma, adesso, ora, versioneApp) {
    return JSON.parse(api.riconciliaBackupSito(json(ingressi), json(firma || {}), adesso || new Date().toISOString(), ora || '', versioneApp || 'sito'));
  },
  statoEventi: function (ev, p) { return JSON.parse(api.statoSito(json(ev), json(p))); },
  riordino: function (P, az) { return JSON.parse(api.riordinoRigheSito(json(P), json(az || []))); },
  applica: function (P, az) { return JSON.parse(api.applicaSito(json(P), json(az || []))); },
  /* Il Banco (2026-11-13): una sessione tenuta aperta sul backup; ogni scelta scrive solo i suoi eventi. */
  apriBanco: function (P, az) { return avvolgiBanco(api.apriBancoSito(json(P), json(az || []))); },
};
function avvolgiBanco(b) {
    /* Le letture si ricordano finché la sessione non cambia (dopo il campo del 16/11, utente 2026-11-20: «F5 molto lento»,
       un'azione 3-6 s sul PC dell'ASL): coda, risultato e guida dei buchi costano centinaia di millisecondi l'una e la
       pagina le chiedeva più volte per ogni clic. Ogni scrittura (applica, nota, file della BDN) le dimentica. Chi le usa
       non deve cambiare gli oggetti ricevuti. */
    var memo = {};
    function ricorda(k, f) { if (!Object.prototype.hasOwnProperty.call(memo, k)) memo[k] = f(); return memo[k]; }
    function scrive(r) { memo = {}; return r; }
    return {
      coda: function () { return ricorda('coda', function () { return JSON.parse(b.coda()); }); },
      scheda: function (uid, cifre, tutti) { var k = 'scheda|' + uid + '|' + (cifre || '') + '|' + !!tutti; return ricorda(k, function () { return JSON.parse(b.scheda(String(uid), String(cifre || ''), !!tutti)); }); },
      cerca: function (q) { return ricorda('cerca|' + (q || ''), function () { return JSON.parse(b.cerca(String(q || ''))); }); },
      applica: function (a) { memo = {}; return JSON.parse(b.applica(json(a))); },
      notaAllevatore: function (uid, testo) { return scrive(JSON.parse(b.notaAllevatore(String(uid), String(testo || '')))); },
      destinazione: function (uid) { return ricorda('dest|' + uid, function () { return JSON.parse(b.destinazione(String(uid))); }); },
      risultato: function () { return ricorda('risultato', function () { return JSON.parse(b.risultato()); }); },
      riordino: function () { return ricorda('riordino', function () { return JSON.parse(b.riordino()); }); },
      cercaCapi: function (specie, query) { return JSON.parse(b.cercaCapi(String(specie), String(query || ''))); },
      numerazioneFinale: function (sistemazioni) { return JSON.parse(b.numerazioneFinale(json(sistemazioni || {}))); },
      azioni: function () { return ricorda('azioni', function () { return JSON.parse(b.azioni()); }); },
      /* Verifica in BDN dei contrassegni fuori registro (2026-11-14): elenco per lo snippet e risultati caricati. */
      daVerificareBdn: function (tutte) { return ricorda('daVer|' + !!tutte, function () { return JSON.parse(b.daVerificareBdn(!!tutte)); }); },
      caricaVerificaBdn: function (testo) { return scrive(JSON.parse(b.caricaVerificaBdn(String(testo || '')))); },
      avvisoFormato: function (codice) { return b.avvisoFormato(String(codice || '')) || null; },
      verificheBdn: function () { return ricorda('verifiche', function () { return JSON.parse(b.verificheBdn()); }); },
      /* Uscite per modello degli ultimi 7 giorni (2026-11-18): la BDN si aggiorna fino a 7 giorni dopo il modello. */
      caricaUsciteModello: function (testo) { return scrive(JSON.parse(b.caricaUsciteModello(String(testo || '')))); },
      usciteModello: function () { return ricorda('uscite', function () { return JSON.parse(b.usciteModello()); }); },
      /* I veterinari prelevatori per ARVET (2026-11-21), letti dal registro della sessione: si cambiano con l'azione «prelevatori». */
      prelevatori: function () { return ricorda('prelevatori', function () { return JSON.parse(b.prelevatori()); }); },
      /* Interrogazione (2026-11-18): per contrassegno con le provette collegate, o per provetta col contrassegno collegato. */
      interroga: function (query) { return ricorda('interroga|' + (query || ''), function () { return JSON.parse(b.interroga(String(query || ''))); }); },
      /* Una sessione nuova sullo stesso backup con altre azioni (Annulla), senza rileggere il progetto. */
      riparti: function (az) { return avvolgiBanco(b.riparti(json(az || []))); },
      /* Le azioni salvate applicate alla sessione appena aperta dal caricamento del backup. */
      applicaSalvate: function (az) { if (az && az.length) { memo = {}; b.applicaSalvate(json(az)); } }
    };
}
return Object.assign(D, {
  cercaPlateau: function (celle, query) { return JSON.parse(api.cercaPlateauSito(json(celle), String(query || ''))); },
  posizionePlateau: function (serie, vista, plateau, pozzetto) { return JSON.parse(api.posizionePlateauSito(serie, vista, String(plateau), String(pozzetto))); },
  chiaveSpunta: function (r) { return api.chiaveSpuntaSito(json(r)); },
  confronto: function (indizi, capi, max) { return JSON.parse(api.confrontoSito(json(indizi), json(capi), json(max == null ? {} : { max: max }))); },
  inEta: function (n, r, mesi) { return JSON.parse(api.inEtaSito(json({ nascita: n || '', riferimento: r || '', mesi: mesi || 0 }))); },
  guida: function (P, u, sp, lettera, codice, azioni) { return JSON.parse(api.guidaSito(json(P), json(azioni || []), json(u.dati), json({ codice: codice, specie: sp, lettera: lettera || '' }))); },
  cercaGuida: function (P, u, sp, lettera, codice, azioni, query) { return JSON.parse(api.ricercaGuidaSito(json(P), json(azioni || []), json(u.dati), json({ codice: codice, specie: sp, lettera: lettera || '', query: query }))); },
  analizzaEtichetta: function (et) {
    try { return JSON.parse(api.analizzaEtichettaSito(String(et || ''))); } catch (e) { return { valida: false, originale: String(et || '') }; }
  },
  corrispondeRicerca: function (et, q) {
    try { return api.corrispondeRicercaEtichettaSito(String(et || ''), String(q || '')); } catch (e) { return false; }
  }
});
});