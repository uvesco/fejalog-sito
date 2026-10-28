/* Il confronto è quello Kotlin: nessun algoritmo duplicato nel sito. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./dominio.js'));
  else root.FejConfronto = factory(root.FejDominio);
})(typeof self !== 'undefined' ? self : this, function (Dominio) {
'use strict';
return { confronta: Dominio.confronto };
});
