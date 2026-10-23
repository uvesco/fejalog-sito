/* Il file `fejalog-modifiche`: le azioni fatte sul sito, da riportare nell'app (la Regia lo importa, con anteprima, e
   l'app scrive eventi nuovi). Contratto: contratti/modifiche.schema.json. Mai codice fiscale, mai token. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FejModifiche = factory();
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';

var FORMATO = 'fejalog-modifiche', VERSIONE = 1;
/* le sole azioni che l'app sa tradurre in eventi del registro; le spunte della guida sono avanzamento locale e vanno
   come `spunta` (PROVETTA_SPOSTATA) */
var TIPI = ['soluzione', 'tardiva', 'spostamento', 'scambio', 'spunta'];

function esporta(P, azioni, nome, ora) {
  return {
    formato: FORMATO, versione: VERSIONE,
    origine: {
      pacchetto_id: P.pacchetto.id, pacchetto_sha256: P.pacchetto.sha256,
      impronta: P.manifesto.registro && P.manifesto.registro.impronta, creato_il: ora || new Date().toISOString(),
      nome: String(nome || '').trim(),
    },
    azioni: azioni.filter(function (a) { return TIPI.indexOf(a.tipo) >= 0; }),
  };
}

function nomeFile(P, ora) {
  var d = (ora || new Date().toISOString()).slice(0, 10);
  return 'fejalog-modifiche_' + String((P.manifesto.seduta && P.manifesto.seduta.nome) || 'progetto').replace(/[^A-Za-z0-9_-]+/g, '_') + '_' + d + '.json';
}

return { esporta: esporta, nomeFile: nomeFile, FORMATO: FORMATO, VERSIONE: VERSIONE, TIPI: TIPI };
});
