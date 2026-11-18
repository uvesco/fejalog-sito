/**
 * arvet_clear.js — SVUOTA tutti i campi "Numero campione" (provetta) del form
 * ARVET di inserimento dei numeri di provetta.
 *
 * Stessa selezione del motore di compilazione (arvet_fill.js): tutti gli
 * input[id^="ncampione_"] della pagina. Usa il setter nativo + eventi input/change
 * così il framework della pagina registra lo svuotamento. Chiede conferma prima di
 * agire (operazione distruttiva) e mostra un report. NON salva su ARVET.
 *
 * Uso: F12 → tab Console → incolla → Invio. (Se il browser blocca l'incolla:
 * digita prima "allow pasting" / "consenti incolla".)
 */
(function () {
  'use strict';

  var TAG = '[ARVET-clear]';

  try {
    var inputs = document.querySelectorAll('input[id^="ncampione_"]');
    if (!inputs.length) {
      alert(TAG + ' nessun campo "Numero campione" trovato.\n' +
            'Sei sulla pagina ARVET di inserimento dei numeri di provetta?');
      return;
    }
    var daSvuotare = 0;
    inputs.forEach(function (inp) { if (inp.value !== '') daSvuotare++; });
    if (daSvuotare === 0) {
      alert(TAG + ' i ' + inputs.length + ' campi provetta sono già vuoti.');
      return;
    }
    if (!window.confirm(TAG + ' svuotare ' + daSvuotare + ' numeri di provetta su ' +
        inputs.length + ' caselle?\nL\'azione non salva su ARVET, ma cancella i valori dal form.')) {
      return;
    }

    var proto = window.HTMLInputElement.prototype;
    var setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    var svuotati = 0;
    inputs.forEach(function (inp) {
      if (inp.value === '') return;
      setter.call(inp, '');                                  // setter nativo (bypassa override React/Vue)
      inp.dispatchEvent(new Event('input',  { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      svuotati++;
    });

    // report (riusa lo stile del motore di compilazione)
    document.querySelectorAll('.arvet-fill-report').forEach(function (n) { n.remove(); });
    var div = document.createElement('div');
    div.className = 'arvet-fill-report';
    div.style.cssText = [
      'position:fixed', 'top:12px', 'right:12px', 'z-index:2147483647',
      'background:#1e293b', 'color:#f8fafc', 'padding:14px 18px',
      'border-radius:8px', 'font:13px/1.45 system-ui,-apple-system,sans-serif',
      'box-shadow:0 8px 28px rgba(0,0,0,.35)', 'max-width:400px'
    ].join(';');
    div.innerHTML =
      '<div style="font-weight:600;margin-bottom:8px">' + TAG + '</div>' +
      '<div>✓ Provette svuotate: <b>' + svuotati + '</b> / ' + inputs.length + '</div>' +
      '<div style="color:#94a3b8;font-size:11px;margin-top:4px">' +
        'Verifica e salva su ARVET manualmente.</div>' +
      '<button class="arvet-fill-close" style="margin-top:10px;background:#475569;' +
        'border:none;color:#f8fafc;padding:5px 12px;border-radius:4px;cursor:pointer;' +
        'font:12px system-ui">chiudi</button>';
    div.querySelector('.arvet-fill-close').onclick = function () { div.remove(); };
    document.body.appendChild(div);
  } catch (err) {
    alert(TAG + ' errore: ' + err.message);
    throw err;
  }
})();
