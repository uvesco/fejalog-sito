/* Statistiche del sito (utente, 2026-11-21): GoatCounter, senza cookie né dati personali (niente banner). Conta le visite
   alle pagine, gli scaricamenti (app, kit, schede: anche l'APK) e le aperture degli strumenti dalle altre pagine.
   Niente script esterni: si chiama il contatore come un'immagine (il «pixel» di GoatCounter), così nessun codice di altri
   gira nell'origine del sito, dove gli strumenti tengono backup e azioni (revisione 9, P2-5). Nelle pagine degli strumenti
   non parte niente; mai i file creati dalla pagina (blob:, data:). */
(function () {
  'use strict';
  var codice = window.FEJALOG_GOATCOUNTER;
  if (!codice || /\/strumenti\//.test(location.pathname) || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
  if (navigator.doNotTrack === '1') return;
  var radice = location.pathname;
  function invia(par) {
    var q = Object.keys(par).map(function (k) { return k + '=' + encodeURIComponent(par[k]); }).join('&');
    var img = new Image(); img.referrerPolicy = 'no-referrer-when-downgrade';
    img.src = 'https://' + codice + '.goatcounter.com/count?' + q + '&rnd=' + Math.random().toString(36).slice(2);
  }
  var rif = '';
  try { if (document.referrer && new URL(document.referrer).origin !== location.origin) rif = new URL(document.referrer).origin; } catch (e) { rif = ''; }
  invia({ p: radice, t: document.title, r: rif });
  function conta(path, titolo) { invia({ p: path, t: titolo, e: 'true' }); }
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/^(blob|data|javascript|mailto):/i.test(href)) return;
    var url;
    try { url = new URL(href, location.href); } catch (e) { return; }
    var file = url.pathname.split('/').pop() || '';
    if (/\.(apk|zip|pdf|xlsx|csv)$/i.test(file) || /\/releases\/(download|latest\/download)\//.test(url.pathname)) conta('scarica/' + file, 'Scarica ' + file);
    else if (url.origin === location.origin && /\/strumenti\//.test(url.pathname)) {
      var nome = url.pathname.replace(/^.*\/strumenti\//, '').replace(/\/$/, '') || 'indice';
      conta('apri-strumento/' + nome, 'Apre lo strumento ' + nome);
    }
  }, true);
})();
