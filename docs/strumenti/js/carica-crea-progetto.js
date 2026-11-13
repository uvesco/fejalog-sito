/* Carica in ordine gli script di «Crea progetto» (relativi a questo file) e monta la pagina. */
(function () {
  'use strict';
  var root = document.getElementById('fejalog-crea');
  if (!root) return;
  var base = document.currentScript.src.replace(/[^/]*$/, '');
  var elenco = ['vendor/fejalog-shared.js', 'dominio.js', 'vendor/xlsx.js', 'zip.js', 'vendor/qrcode.js', 'vendor/stampe.js', 'registro.js', 'progetto.js', 'reti.js',
    'prima-del-campo.js', 'crea-progetto.js'];
  (function avanti(i) {
    if (i >= elenco.length) {
      try { window.FejCreaProgetto.monta(root, { dominio: window.FejDominio, zip: window.FejZip }); }
      catch (e) { root.textContent = 'Non riesco ad avviare la pagina: ' + (e && e.message ? e.message : e); }
      return;
    }
    var s = document.createElement('script');
    s.src = base + elenco[i];
    s.onload = function () { avanti(i + 1); };
    s.onerror = function () { root.textContent = 'Non riesco a caricare ' + elenco[i] + '.'; };
    document.head.appendChild(s);
  })(0);
})();
