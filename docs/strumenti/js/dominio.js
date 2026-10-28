/* Adattatore JSON alla facciata del dominio Kotlin, compilata in fejalog-shared.js. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./vendor/fejalog-shared.js'));
  else root.FejDominio = factory(root['fejalog:shared']);
})(typeof self !== 'undefined' ? self : this, function (bundle) {
'use strict';
var api = bundle.io.github.uvesco.fejalog.prova;
function json(x) { return JSON.stringify(x); }
return {
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
};
});
