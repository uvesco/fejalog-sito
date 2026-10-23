/* Carica in ordine gli script degli strumenti «dopo il campo» (relativi a questo file: la pagina sta in una cartella
   a parte, per gli indirizzi del sito). Uno solo da includere nella pagina. */
(function () {
  var base = document.currentScript.src.replace(/[^/]*$/, '');
  var elenco = ['vendor/motore.js', 'vendor/xlsx.js', 'vendor/fine_lavori.js', 'zip.js', 'registro.js', 'confronto.js', 'progetto.js', 'stato.js', 'modifiche.js', 'azioni.js', 'app.js'];
  (function avanti(i) {
    if (i >= elenco.length) return;
    var s = document.createElement('script');
    s.src = base + elenco[i];
    s.onload = function () { avanti(i + 1); };
    s.onerror = function () { var r = document.getElementById('fejalog-strumenti'); if (r) r.textContent = 'Non riesco a caricare ' + elenco[i] + '.'; };
    document.head.appendChild(s);
  })(0);
})();
