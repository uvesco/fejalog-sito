/* =============================================================================
 * Fejalog — SNIPPET UNICO per la BDN ovicaprini: verifica dei contrassegni, uscite e ingressi per modello
 * -----------------------------------------------------------------------------
 * Utente, 2026-11-20: «unificare gli snippet BDN (tutte e tre le query, ingressi compresi) in una sola query e un solo json da
 * caricare, sia in entrata sia in uscita». Si incolla nella console (F12 → Console) sulla TUA sessione BDN già aperta; il sito
 * di Fejalog antepone
 *   window.__BDN_UNICO__ = { stabilimenti: [...], giorni: 7, dal, al, codici: [{ contrassegno, etichette }], base, timbro, data, origine }.
 * Uno dopo l'altro, nella stessa scheda, gira i tre snippet di sempre (letti dal sito, all'indirizzo `base`):
 *  1. la verifica dei contrassegni fuori registro (bdn-verifica-motore.js), solo se `codici` non è vuoto;
 *  2. le uscite per modello degli stabilimenti (bdn-uscite-modello-motore.js);
 *  3. gli ingressi per modello degli stabilimenti (lo stesso snippet, dalla parte della destinazione).
 * Poi un solo file `fejalog-bdn` v1 con le tre parti, che torna da solo alla pagina di Fejalog che ha aperto la BDN, oppure si
 * scarica o si copia. Solo letture, una richiesta alla volta: non salva e non modifica niente in BDN. Nessun dato esce dal browser.
 * ============================================================================= */
(function (globale) {
  'use strict';
  var FORMATO = 'fejalog-bdn';
  var cfg = globale.__BDN_UNICO__;
  if (!cfg || (!(cfg.stabilimenti || []).length && !(cfg.codici || []).length)) {
    console.log('Fejalog: manca la configurazione (window.__BDN_UNICO__). Prepara lo snippet dalla pagina del sito.');
    return;
  }
  if (location.hostname.indexOf('vetinfo.it') < 0) { console.log('Fejalog: lo snippet va incollato nella BDN (vetinfo.it), nella scheda dove hai fatto l\'accesso.'); return; }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  if (!cfg.timbro) { var d0 = new Date(); cfg.timbro = '' + d0.getFullYear() + p2(d0.getMonth() + 1) + p2(d0.getDate()) + '_' + p2(d0.getHours()) + p2(d0.getMinutes()) + p2(d0.getSeconds()); }
  var attesa = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /* il pannello dello snippet unico, in alto; quelli dei tre passi sotto, uno alla volta */
  document.querySelectorAll('[data-fejalog-pannello]').forEach(function (p) { p.remove(); });
  var pannello = document.createElement('div');
  pannello.setAttribute('data-fejalog-pannello', 'unico');
  pannello.style.cssText = 'position:fixed;top:8px;right:8px;z-index:100000;background:#fff;border:2px solid #2e5e3e;border-radius:8px;' +
    'padding:10px 12px;font:13px system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.25);width:440px;max-width:92vw;color:#222';
  pannello.innerHTML = '<button type="button" data-u="chiudi" title="Chiudi" style="position:absolute;top:2px;right:6px;border:0;background:none;' +
    'font-size:22px;line-height:1;cursor:pointer;color:#444;padding:2px 4px">×</button><b>Fejalog · BDN: verifica, uscite e ingressi</b>' +
    '<div data-u="passi" style="margin-top:6px;font:12px ui-monospace,monospace;white-space:pre-wrap"></div>' +
    '<div data-u="fase" style="margin-top:6px;font-weight:600"></div>' +
    '<div data-u="nota" style="color:#666;margin-top:6px">Non cambiare pagina in questa scheda finché non arriva il file.</div>';
  document.body.appendChild(pannello);
  var q = function (n) { return pannello.querySelector('[data-u="' + n + '"]'); };
  q('chiudi').onclick = function () { pannello.remove(); };
  var passi = [];
  function passo(i, t) { passi[i] = t; q('passi').textContent = passi.filter(Boolean).join('\n'); }
  function fase(t) { q('fase').textContent = t; }
  function scarica(nome, testo, tipo) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([testo], { type: tipo }));
    a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  /** Uno dei tre snippet: lo legge dal sito, lo fa girare sotto il pannello e aspetta il suo risultato (o un errore). */
  function gira(nomeFile, chiaveCfg, valori, chiaveEsito) {
    globale[chiaveEsito] = undefined;
    globale[chiaveCfg] = Object.assign({ timbro: cfg.timbro, senzaFile: true, senzaInvio: true, pannelloAlto: pannello.offsetHeight + 16 }, valori);
    return fetch(cfg.base + nomeFile + '?v=' + (cfg.data || '')).then(function (r) { if (!r.ok) throw new Error('non riesco a leggere ' + nomeFile + ' dal sito (HTTP ' + r.status + ')'); return r.text(); })
      .then(function (t) {
        new Function(t)();
        var inizio = Date.now();
        return new Promise(function (si, no) {
          (function aspetta() {
            if (globale[chiaveEsito]) { si(globale[chiaveEsito]); return; }
            var p = document.querySelector('[data-fejalog-pannello]:not([data-fejalog-pannello="unico"])'), f = p && p.querySelector('[data-f="fase"]');
            if (f && /^Errore: /.test(f.textContent)) { no(new Error(f.textContent.replace(/^Errore: /, ''))); return; }
            if (Date.now() - inizio > 45 * 60000) { no(new Error('nessun risultato dopo 45 minuti')); return; }
            setTimeout(aspetta, 500);
          })();
        });
      })
      .then(function (esito) {
        // il passo è finito: il suo pannello si chiude, il riassunto resta qui
        document.querySelectorAll('[data-fejalog-pannello]:not([data-fejalog-pannello="unico"])').forEach(function (p) { p.remove(); });
        return esito;
      });
  }

  (async function () {
    var file = { formato: FORMATO, versione: 1, timbro: cfg.timbro, stabilimenti: cfg.stabilimenti || [], verifica: null, uscite: null, ingressi: null, errori: [] };
    var codici = cfg.codici || [], st = cfg.stabilimenti || [];
    var finestra = { stabilimenti: st, giorni: cfg.giorni || 7, dal: cfg.dal || '', al: cfg.al || '' };
    // 1. la verifica dei contrassegni
    if (codici.length) {
      passo(0, '1. Verifica di ' + codici.length + ' contrassegni: in corso (circa ' + Math.max(1, Math.round(codici.length * 3 / 60)) + ' min)…');
      try {
        file.verifica = await gira('bdn-verifica-motore.js', '__BDN_VERIFICA__', { codici: codici }, '__BDN_VERIFICA_ESITO__');
        // la verifica interrotta (sessione scaduta) consegna quello che ha: non è un «fatto» (revisione 8)
        var interrotta = file.verifica.risultati.filter(function (r) { return /sessione BDN è scaduta/.test(r.errore || ''); })[0];
        if (interrotta) file.errori.push('verifica: ' + interrotta.errore);
        passo(0, '1. Verifica: ' + file.verifica.risultati.length + ' di ' + codici.length + ' contrassegni ' + (interrotta || file.verifica.risultati.length < codici.length ? '— INTERROTTA' : '✓'));
      } catch (e) { file.errori.push('verifica: ' + e.message); passo(0, '1. Verifica: ' + e.message); }
      await attesa(600);
    } else passo(0, '1. Verifica: nessun contrassegno da cercare');
    if (st.length && !file.errori.some(function (x) { return /sessione BDN è scaduta/.test(x); })) {
      // 2. le uscite per modello
      passo(1, '2. Uscite per modello di ' + st.join(', ') + ': in corso…');
      try {
        file.uscite = await gira('bdn-uscite-modello-motore.js', '__BDN_USCITE_MODELLO__', finestra, '__BDN_USCITE_MODELLO_ESITO__');
        (file.uscite.errori || []).forEach(function (x) { file.errori.push('uscite: ' + x); });
        passo(1, '2. Uscite per modello (' + file.uscite.dal + ' – ' + file.uscite.al + '): ' + file.uscite.uscite.length + ' capi ' + ((file.uscite.errori || []).length ? '— CON ERRORI: ' + file.uscite.errori.join('; ') : '✓'));
      } catch (e) { file.errori.push('uscite: ' + e.message); passo(1, '2. Uscite: ' + e.message); }
      await attesa(600);
      if (file.errori.some(function (x) { return /sessione BDN è scaduta/.test(x); })) { passo(2, '3. Ingressi: non letti (sessione BDN scaduta)'); }
      else {
      // 3. gli ingressi per modello
      passo(2, '3. Ingressi per modello di ' + st.join(', ') + ': in corso…');
      try {
        file.ingressi = await gira('bdn-uscite-modello-motore.js', '__BDN_USCITE_MODELLO__', Object.assign({ verso: 'ingressi' }, finestra), '__BDN_INGRESSI_MODELLO_ESITO__');
        (file.ingressi.errori || []).forEach(function (x) { file.errori.push('ingressi: ' + x); });
        passo(2, '3. Ingressi per modello (' + file.ingressi.dal + ' – ' + file.ingressi.al + '): ' + file.ingressi.ingressi.length + ' capi ' + ((file.ingressi.errori || []).length ? '— CON ERRORI: ' + file.ingressi.errori.join('; ') : '✓'));
      } catch (e) { file.errori.push('ingressi: ' + e.message); passo(2, '3. Ingressi: ' + e.message); }
      }
    }
    globale.__BDN_UNICO_ESITO__ = file;
    var testo = JSON.stringify(file, null, 1), nomeJson = 'fejalog_bdn_' + cfg.timbro + '.json';
    fase(file.errori.length ? 'Finito con ERRORI (' + file.errori.join('; ') + '): il file contiene solo le parti riuscite. Se la sessione è scaduta rientra nella BDN e rilancia lo snippet.' : 'Fatto: un solo file con verifica, uscite e ingressi.');
    // il risultato torna da solo alla pagina di Fejalog che ha aperto questa scheda
    var dest = globale.opener, inviato = false;
    if (dest && !dest.closed && cfg.origine) {
      try { dest.postMessage({ fejalog: 'bdn-unico', file: file }, cfg.origine); inviato = true; } catch (e) { inviato = false; }
      globale.addEventListener('message', function (ev) {
        if (ev.origin !== cfg.origine || !ev.data || ev.data.fejalog !== 'bdn-unico-ricevuto') return;
        fase('Fatto: il risultato è arrivato nella pagina di Fejalog. ' + (ev.data.testo || ''));
      });
    }
    if (!cfg.senzaFile) scarica(nomeJson, testo, 'application/json');
    var tasti = document.createElement('div');
    tasti.style.cssText = 'margin-top:8px;display:flex;flex-wrap:wrap;gap:6px';
    function tasto(etichetta, azione) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = etichetta;
      b.style.cssText = 'padding:6px 10px;border:1px solid #2e5e3e;border-radius:6px;background:#fff;color:#2e5e3e;cursor:pointer;font:13px system-ui,sans-serif';
      b.onclick = azione; tasti.appendChild(b); return b;
    }
    tasto('Scarica il file per Fejalog (.json)', function () { scarica(nomeJson, testo, 'application/json'); });
    var copia = tasto('Copia il risultato', function () {
      function fatto() { copia.textContent = 'Copiato ✓'; }
      function aMano() {
        var t = document.createElement('textarea'); t.value = testo; t.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
        document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); fatto(); } catch (e) { copia.textContent = 'Non riesco a copiare'; }
        t.remove();
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(testo).then(fatto, aMano); else aMano();
    });
    pannello.insertBefore(tasti, q('nota'));
    q('nota').textContent = (inviato ? 'Risultato mandato alla pagina di Fejalog che ha aperto la BDN: guarda lì se è arrivato. ' : '') +
      'Se non arriva: il file ' + nomeJson + ' (cartella dei download) o «Copia il risultato», da caricare nella pagina di Fejalog.';
  })().catch(function (e) { fase('Errore: ' + (e && e.message ? e.message : e)); });
})(typeof window !== 'undefined' ? window : this);
