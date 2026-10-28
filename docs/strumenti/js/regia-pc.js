/* Ponte opzionale, soltanto per la pagina servita dal tablet. Cookie HttpOnly, nessuna credenziale negli URL o
   nello storage del browser. Il POST deposita un file: l'app richiede sempre anteprima e conferma sul tablet. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FejRegiaPc = factory();
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';
function crea(invia) {
  function richiesta(path, opzioni) {
    var o = opzioni || {};
    o.credentials = 'same-origin'; o.cache = 'no-store';
    return invia('/api/' + path, o).then(function (r) {
      if (!r.ok) {
        var errore = new Error(r.status === 403 ? 'Accesso rifiutato: inserisci il PIN mostrato sul tablet. Se è scaduto o già usato, premi «Nuovo PIN» sulla Regia.' :
          r.status === 429 ? 'Troppi tentativi: il PIN è cambiato. Attendi 30 secondi e leggi il nuovo PIN sul tablet.' :
          r.status === 413 ? 'File troppo grande.' : r.status === 422 ? 'File non valido o di un altro progetto.' :
          r.status === 409 ? 'La Regia non ha ancora accettato le modifiche dal PC per questa sessione.' : 'Tablet non disponibile. Controlla il collegamento USB e la Regia.');
        errore.statoHttp = r.status;
        throw errore;
      }
      return r;
    });
  }
  return {
    stato: function () { return richiesta('stato').then(function (r) { return r.json(); }); },
    accesso: function (pin) { return richiesta('accesso', { method: 'POST', headers: { 'X-Fejalog-Richiesta': '1', 'X-Fejalog-Pin': pin.replace(/\s/g, '') } }); },
    backup: function () { return richiesta('backup').then(function (r) { return r.arrayBuffer(); }); },
    modifiche: function (testo) { return richiesta('modifiche', { method: 'POST', headers: { 'X-Fejalog-Richiesta': '1', 'Content-Type': 'application/json' }, body: testo }).then(function (r) { return r.status === 202 ? { esiti: [], in_attesa: true } : r.json(); }); }
  };
}

/* Solo presentazione: formato e autorizzazione sono verificati dal server Kotlin. Niente credenziali nello storage. */
function campiPin(doc) {
  var box = doc.createElement('fieldset'), legenda = doc.createElement('legend');
  box.className = 'fej-pin'; legenda.textContent = 'PIN mostrato sul tablet'; box.appendChild(legenda);
  var campi = [0, 1].map(function (i) {
    var label = doc.createElement('label'), input = doc.createElement('input');
    label.appendChild(doc.createTextNode(i === 0 ? 'Prime 4 cifre ' : 'Ultime 4 cifre '));
    input.type = 'text'; input.inputMode = 'numeric'; input.autocomplete = 'off';
    input.setAttribute('aria-label', i === 0 ? 'PIN: prime 4 cifre' : 'PIN: ultime 4 cifre');
    input.setAttribute('pattern', '[0-9]{4}'); input.maxLength = 4; input.required = true;
    input.spellcheck = false;
    label.appendChild(input); box.appendChild(label); return input;
  });
  function incollaIntero(testo) {
    var n = testo.replace(/\s/g, '');
    if (!/^[0-9]{8}$/.test(n)) return false;
    campi[0].value = n.slice(0, 4); campi[1].value = n.slice(4);
    campi[1].focus(); return true;
  }
  campi.forEach(function (campo, i) {
    campo.addEventListener('paste', function (ev) {
      if (ev.clipboardData && incollaIntero(ev.clipboardData.getData('text'))) ev.preventDefault();
    });
    campo.addEventListener('input', function () {
      if (incollaIntero(campo.value)) return;
      campo.value = campo.value.replace(/[^0-9]/g, '').slice(0, 4);
      if (i === 0 && campo.value.length === 4) campi[1].focus();
    });
  });
  return {
    elemento: box,
    valore: function () { return campi[0].value + campi[1].value; },
    svuota: function () { campi.forEach(function (c) { c.value = ''; }); }
  };
}
return { crea: crea, campiPin: campiPin };
});
