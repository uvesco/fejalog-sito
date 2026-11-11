/* =============================================================================
 * Carica gli script del Simulatore di Campo e Tutorial in sequenza ordinata
 * ============================================================================= */
(function () {
  'use strict';
  var root = document.getElementById('fejalog-simulatore');
  if (!root) return;

  var base = document.currentScript.src.replace(/[^/]*$/, '');
  var elenco = [
    'vendor/fejalog-shared.js',
    'dominio.js',
    'zip.js',
    'registro.js',
    'progetto.js',
    'code128.js',
    'progetto-fittizio.js',
    'simulatore.js'
  ];

  (function avanti(i) {
    if (i >= elenco.length) {
      if (window.FejSimulatore && window.FejSimulatore.avvia) {
        window.FejSimulatore.avvia(root);
      }
      return;
    }
    var script = document.createElement('script');
    script.src = base + elenco[i];
    script.onload = function () { avanti(i + 1); };
    script.onerror = function () {
      root.textContent = 'Non riesco a caricare ' + elenco[i] + ' del simulatore.';
    };
    document.head.appendChild(script);
  })(0);
})();
