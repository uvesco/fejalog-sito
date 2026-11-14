/* =============================================================================
 * Fejalog — SNIPPET per la BDN ovicaprini: verifica dei contrassegni delle provette fuori registro
 * -----------------------------------------------------------------------------
 * Si incolla nella console del browser (F12 → Console) sulla TUA sessione BDN già aperta, in una pagina della BDN
 * ovicaprini (per esempio Dati › Interrogazioni › Capi). Il sito di Fejalog (Fine lavori sul computer › Carica) antepone
 * window.__BDN_VERIFICA__ = { codici: [{ contrassegno, etichette }], timbro: 'AAAAMMGG_HHMMSS' }.
 *
 * Per ogni contrassegno, come faresti a mano (utente, 2026-11-14: «cercando uno a uno in capi e in contrassegni»):
 *  - Dati › Interrogazioni › Capi: codice capo (e, se non c'è, codice elettronico o precedente), poi la scheda del capo
 *    per l'allevamento d'iscrizione: sesso, razza, specie, nascita, stato, stabilimento;
 *  - Dati › Interrogazioni › Identificativi: la marca, col suo stato (usabile o applicata), l'allevamento che l'ha
 *    avuta, la specie e la data della richiesta.
 * Alla fine scarica fejalog_verifica_bdn_<AAAAMMGG_HHMMSS>.json, da caricare in Fejalog accanto al backup.
 *
 * Solo letture, una richiesta alla volta con una pausa: non salva e non modifica niente in BDN. Nessun dato esce dal
 * browser; il file è locale. Le interrogazioni risultano fatte dalla tua utenza.
 * ============================================================================= */
(function (globale) {
  'use strict';

  var B = '/ovicaprini/sito_interrogazioni/';
  var PAUSA = 600;
  var FORMATO = 'fejalog-verifica-bdn';

  /* ---------- funzioni pure (provate in Node: sito/prove/bdn-verifica.cjs) ---------- */

  function pulisci(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function norma(c) { return String(c == null ? '' : c).replace(/\s+/g, '').toUpperCase(); }
  /** Le cifre di un codice elettronico (380…, con o senza lo zero davanti) o di un contrassegno IT…: per i confronti. */
  function cifre(c) { return norma(c).replace(/^0(?=\d{15}$)/, '').replace(/^IT/, ''); }
  function stessoCodice(a, b) {
    var x = norma(a), y = norma(b);
    if (!x || !y) return false;
    if (x === y) return true;
    // un codice elettronico 380 + 12 cifre è lo stesso capo di IT + le stesse 12 cifre
    var cx = cifre(x), cy = cifre(y);
    return cx.length >= 12 && cy.length >= 12 && cx.slice(-12) === cy.slice(-12) && (/^380/.test(cx) || /^380/.test(cy));
  }
  /** Un codice elettronico (solo cifre, 15 o 16 con lo zero). */
  function elettronico(c) { return /^0?\d{15}$/.test(norma(c)); }

  /** Le righe di una tabella di risultati: intestazioni dalla prima riga con almeno `minimo` celle. */
  function righeTabella(doc, richieste, minimo) {
    var tabelle = doc.querySelectorAll('table');
    for (var i = 0; i < tabelle.length; i++) {
      var t = tabelle[i];
      if (!t.rows.length || t.rows[0].cells.length < minimo) continue;
      var intest = [];
      for (var c = 0; c < t.rows[0].cells.length; c++) intest.push(pulisci(t.rows[0].cells[c].textContent));
      var ok = richieste.every(function (r) { return intest.some(function (x) { return r.test(x); }); });
      if (!ok) continue;
      var out = [];
      for (var r = 1; r < t.rows.length; r++) {
        var riga = t.rows[r], m = String(riga.outerHTML).match(/lista_scelta_riga\(\s*'([^']+)'/), o = { _scelta: m ? m[1] : null };
        for (var k = 0; k < intest.length; k++) o[intest[k]] = riga.cells[k] ? pulisci(riga.cells[k].textContent) : '';
        out.push(o);
      }
      return out;
    }
    return null;
  }
  function campo(o, re) { for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k) && re.test(k)) return o[k]; return ''; }
  function nessunRisultato(doc) { return /non ha prodotto risultati/i.test(doc.body ? doc.body.textContent : ''); }

  /** La lista dei capi (Interrogazioni › Capi): codice, sesso, razza, specie, nascita, precedente, elettronico, stato. */
  function capiDa(doc) {
    var righe = righeTabella(doc, [/^Codice capo/i, /Stato Capo/i], 5);
    if (!righe) return [];
    return righe.map(function (o) {
      return {
        codice: norma(campo(o, /^Codice capo/i)), sesso: campo(o, /^Sesso/i).toUpperCase(), razza: campo(o, /^Razza/i),
        specie: campo(o, /^Specie/i), nascita: campo(o, /nascita/i), precedente: norma(campo(o, /precedente/i)),
        madre: norma(campo(o, /madre/i)), elettronico: norma(campo(o, /Elettronico/i)), stato: campo(o, /Stato Capo/i),
        scelta: o._scelta,
      };
    });
  }
  /** I capi della lista che hanno proprio questo codice (la BDN cerca anche per inizio del codice). */
  function capiEsatti(capi, codice) {
    return capi.filter(function (c) { return stessoCodice(c.codice, codice) || stessoCodice(c.elettronico, codice) || stessoCodice(c.precedente, codice); });
  }
  /** Dalla scheda del capo: l'allevamento d'iscrizione (il codice dello stabilimento). */
  function stabilimentoDa(doc) {
    var celle = doc.querySelectorAll('td,th');
    for (var i = 0; i < celle.length; i++) {
      if (/Allevamento d.iscrizione/i.test(celle[i].textContent) && pulisci(celle[i].textContent).length < 40) {
        var n = celle[i].nextElementSibling;
        var t = n ? pulisci(n.textContent) : '';
        var m = t.match(/\d{3}[A-Z]{2}\d{3}/);
        return m ? m[0] : t;
      }
    }
    return '';
  }
  /** La scheda del capo (dalla lista dei capi o, con la marca applicata, dalla scheda della marca, tasto «Dettaglio capo»). */
  function capoDaScheda(doc) {
    var c = {
      codice: norma(valore(doc, 'P_CODICE')), sesso: valore(doc, 'P_SESSO').toUpperCase(), razza: valore(doc, 'P_RAZZA_DENOMINAZIONE'),
      specie: valore(doc, 'P_SPECIE'), nascita: valore(doc, 'P_DT_NASCITA'), precedente: norma(valore(doc, 'P_COD_PRECEDENTE')),
      elettronico: norma(valore(doc, 'P_CODE_ELETTRONICO')), stato: valore(doc, 'P_STATO_CAPO'), stabilimento: stabilimentoDa(doc),
    };
    return c.codice ? c : null;
  }
  /** La lista delle marche (Interrogazioni › Identificativi): codice e gruppo di specie. */
  function marcheDa(doc) {
    var righe = righeTabella(doc, [/^Codice/i, /Specie/i], 2);
    if (!righe) return [];
    return righe.map(function (o) { return { codice: norma(campo(o, /^Codice/i)), gruppo: campo(o, /Specie/i), scelta: o._scelta }; });
  }
  function valore(doc, nome) { var e = doc.querySelector('[name="' + nome + '"]'); return e ? pulisci(e.value) : ''; }
  /** Dalla scheda della marca: stato, tipo, allevamento che l'ha avuta, specie, data della richiesta. */
  function marcaDa(doc) {
    return {
      codice: norma(valore(doc, 'P_CODICE_MARCA')), stato: valore(doc, 'P_STATO_FLAG_USABILE').toUpperCase(),
      tipo_richiesta: valore(doc, 'P_TIPO_RICHIESTA'), tipo_marca: valore(doc, 'P_TIPO_MARCA_DESCRIZIONE'),
      allevamento: valore(doc, 'P_AZIENDE_CODICE').toUpperCase(), specie: valore(doc, 'P_SPE_DESCRIZIONE'),
      data_richiesta: valore(doc, 'P_DT_RICHIESTA'),
    };
  }
  /** Il controllo non bloccante del formato (gemello di FormatoContrassegno in Kotlin). */
  function avvisoFormato(c) {
    var x = norma(c);
    if (!x) return null;
    if (/^[A-Z]{2}\d{12}$/.test(x) || /^IT\d{13}$/.test(x) || /^0?\d{15}$/.test(x)) return null;
    return 'formato inusuale';
  }
  /** Una riga leggibile per il riquadro e per il CSV. */
  function sintesi(r) {
    if (r.errore) return 'errore: ' + r.errore;
    var p = [];
    if (r.capi.length === 1) { var c = r.capi[0]; p.push('capo ' + [c.sesso, c.razza, c.nascita, c.stato, c.stabilimento].filter(Boolean).join(' · ')); }
    else if (r.capi.length > 1) p.push(r.capi.length + ' capi con questo codice');
    if (r.marca) p.push('marca ' + [r.marca.stato, r.marca.allevamento, r.marca.specie].filter(Boolean).join(' · '));
    return p.length ? p.join(' — ') : 'non trovato';
  }
  function csv(risultati) {
    var q = function (s) { s = String(s == null ? '' : s); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    var righe = [['contrassegno', 'etichette', 'capo_sesso', 'capo_razza', 'capo_specie', 'capo_nascita', 'capo_stato', 'capo_stabilimento',
      'marca_stato', 'marca_allevamento', 'marca_specie', 'marca_data', 'esito'].join(';')];
    risultati.forEach(function (r) {
      var c = r.capi.length === 1 ? r.capi[0] : {}, m = r.marca || {};
      righe.push([r.contrassegno, r.etichette, c.sesso, c.razza, c.specie, c.nascita, c.stato, c.stabilimento, m.stato, m.allevamento,
        m.specie, m.data_richiesta, sintesi(r)].map(q).join(';'));
    });
    return '﻿' + righe.join('\r\n') + '\r\n';
  }
  function timbroAdesso(d) {
    d = d || new Date();
    var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    return '' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '_' + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds());
  }

  var puro = {
    norma: norma, stessoCodice: stessoCodice, elettronico: elettronico, capiDa: capiDa, capiEsatti: capiEsatti,
    stabilimentoDa: stabilimentoDa, capoDaScheda: capoDaScheda, marcheDa: marcheDa, marcaDa: marcaDa, avvisoFormato: avvisoFormato, sintesi: sintesi,
    csv: csv, timbroAdesso: timbroAdesso, nessunRisultato: nessunRisultato, FORMATO: FORMATO,
  };
  if (typeof module === 'object' && module.exports) { module.exports = puro; return; }

  /* ---------- nella BDN ---------- */
  var cfg = globale.__BDN_VERIFICA__;
  if (!cfg || !(cfg.codici || []).length) {
    console.log('Fejalog: manca l\'elenco dei contrassegni (window.__BDN_VERIFICA__). Prepara lo snippet dalla pagina del sito.');
    return;
  }
  if (location.hostname.indexOf('vetinfo.it') < 0) { console.log('Fejalog: lo snippet va incollato nella BDN (vetinfo.it), nella scheda dove hai fatto l\'accesso.'); return; }
  cfg.timbro = cfg.timbro || timbroAdesso();

  var attesa = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var dec = function (b) { return new TextDecoder('latin1').decode(b); };
  var leggiDoc = function (h) { return new DOMParser().parseFromString(h, 'text/html'); };
  var MASSIMO = 60000;
  var ultima = Date.now();
  function controlla(h) {
    if (/cas\/login|name="password"/i.test(h)) throw new Error('la sessione BDN è scaduta: rientra e rilancia lo snippet');
    return h;
  }
  function richiesta(url, opzioni) {
    var c = typeof AbortController === 'function' ? new AbortController() : null;
    var t = setTimeout(function () { if (c) c.abort(); }, MASSIMO);
    return fetch(url, Object.assign({ credentials: 'same-origin' }, opzioni || {}, c ? { signal: c.signal } : {}))
      .then(function (r) { clearTimeout(t); if (!r.ok) throw new Error('la BDN risponde ' + r.status); return r.arrayBuffer(); },
        function (e) { clearTimeout(t); throw new Error(e && e.name === 'AbortError' ? 'la BDN non ha risposto in ' + MASSIMO / 1000 + ' s' : 'rete: ' + (e && e.message)); })
      .then(function (b) { ultima = Date.now(); return controlla(dec(b)); });
  }
  function post(pagina, coppie) { return richiesta(B + pagina, { method: 'POST', body: new URLSearchParams(coppie) }); }
  function coppie(form) { var fd = new FormData(form), out = []; fd.forEach(function (v, k) { out.push([k, v]); }); return out; }
  function imposta(c, valori) {
    c = c.map(function (x) { return x.slice(); });
    Object.keys(valori).forEach(function (nome) {
      var t = false; c.forEach(function (x) { if (x[0] === nome) { x[1] = valori[nome]; t = true; } }); if (!t) c.push([nome, valori[nome]]);
    });
    return c;
  }

  /* pannello d'avanzamento */
  var pannello = document.createElement('div');
  pannello.style.cssText = 'position:fixed;top:8px;right:8px;z-index:99999;background:#fff;border:2px solid #2e5e3e;border-radius:8px;' +
    'padding:10px 12px;font:13px system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.25);width:440px;max-width:92vw;color:#222';
  pannello.innerHTML = '<button type="button" data-f="chiudi" title="Chiudi" style="position:absolute;top:2px;right:6px;border:0;background:none;' +
    'font-size:22px;line-height:1;cursor:pointer;color:#444;padding:2px 4px">×</button><b>Fejalog · verifica dei contrassegni in BDN</b>' +
    '<div data-f="fase" style="margin-top:6px;font-weight:600"></div>' +
    '<div style="background:#e6ece7;border-radius:4px;height:10px;margin:6px 0;overflow:hidden"><div data-f="barra" style="background:#2e5e3e;height:10px;width:0"></div></div>' +
    '<div data-f="tempo" style="color:#666"></div>' +
    '<div data-f="righe" style="margin-top:6px;font:12px ui-monospace,monospace;max-height:14em;overflow:auto;white-space:pre-wrap"></div>' +
    '<div data-f="nota" style="color:#666;margin-top:6px">Non cambiare pagina in questa scheda finché non arriva il file.</div>';
  document.body.appendChild(pannello);
  var q = function (n) { return pannello.querySelector('[data-f="' + n + '"]'); };
  q('chiudi').onclick = function () { pannello.remove(); };
  var inizio = Date.now(), finito = false;
  var orologio = setInterval(function () {
    var fermo = Math.round((Date.now() - ultima) / 1000);
    q('tempo').textContent = 'Da ' + Math.round((Date.now() - inizio) / 1000) + ' s' + (finito ? '' : ' · ultima risposta della BDN ' + fermo + ' s fa');
  }, 1000);
  function fase(t) { q('fase').textContent = t; }
  function riga(t) { var e = q('righe'); e.textContent += t + '\n'; e.scrollTop = e.scrollHeight; }
  function scarica(nome, testo, tipo) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([testo], { type: tipo }));
    a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  var formCapi = null;
  function cercaCapi(codice) {
    var base = formCapi ? Promise.resolve(formCapi) : richiesta(B + 'int_dati_anagrafici_capi_ric.pl').then(function (h) {
      var f = leggiDoc(h).forms.formPrincipale;
      if (!f) throw new Error('non trovo il modulo della ricerca dei capi');
      formCapi = coppie(f); return formCapi;
    });
    function prova(nome) {
      var v = { P_CODICE: '', P_COD_ELETTRONICO: '', P_COD_PRECEDENTE: '' }; v[nome] = codice;
      return base.then(function (c) { return post('interrogazioni_lista.pl', imposta(c, v)); }).then(function (h) {
        var d = leggiDoc(h);
        return { capi: capiEsatti(capiDa(d), codice), lista: d.forms.ricerca ? coppie(d.forms.ricerca) : null };
      });
    }
    var ordine = elettronico(codice) ? ['P_COD_ELETTRONICO', 'P_CODICE', 'P_COD_PRECEDENTE'] : ['P_CODICE', 'P_COD_PRECEDENTE'];
    var i = 0;
    function avanti() {
      if (i >= ordine.length) return Promise.resolve({ capi: [], lista: null });
      return prova(ordine[i++]).then(function (r) { return r.capi.length ? r : attesa(PAUSA).then(avanti); });
    }
    return avanti().then(function (r) {
      if (r.capi.length !== 1 || !r.capi[0].scelta || !r.lista) return r.capi;
      return attesa(PAUSA).then(function () { return post('int_dati_anagrafici_capi.pl', imposta(r.lista, { P_RECORD_ID: r.capi[0].scelta })); })
        .then(function (h) { r.capi[0].stabilimento = stabilimentoDa(leggiDoc(h)); return r.capi; })
        .catch(function () { return r.capi; });
    });
  }
  function cercaMarca(codice) {
    if (elettronico(codice)) return Promise.resolve(null);
    return post('interrogazioni_lista.pl', [['P_TIPO_INTERROGAZIONE', 'MARCHE'], ['P_CODICE', codice]]).then(function (h) {
      var d = leggiDoc(h);
      var m = marcheDa(d).filter(function (x) { return stessoCodice(x.codice, codice); })[0];
      if (!m || !m.scelta || !d.forms.ricerca) return null;
      return attesa(PAUSA).then(function () { return post('int_marca.pl', imposta(coppie(d.forms.ricerca), { P_RECORD_ID: m.scelta })); })
        .then(function (h2) {
          var d2 = leggiDoc(h2), marca = marcaDa(d2);
          // la scheda della marca porta al capo su cui è applicata (il tasto «Dettaglio capo» manda questo modulo)
          marca._capo = d2.forms.formPrincipale ? coppie(d2.forms.formPrincipale) : null;
          return marca;
        });
    });
  }
  /** Marca applicata (utente, 14/11: «Se la marca è applicata va interrogato il capo»): la scheda del capo dalla marca. */
  function capoDallaMarca(marca) {
    if (!marca || marca.stato !== 'APPLICATA' || !marca._capo) return Promise.resolve(null);
    return attesa(PAUSA).then(function () { return post('int_dati_anagrafici_capi.pl', marca._capo); })
      .then(function (h) { return capoDaScheda(leggiDoc(h)); });
  }

  /** Manda il risultato alla pagina di Fejalog che ha aperto questa scheda (stessa origine data dallo snippet). */
  function inviaAllaPagina(file) {
    var dest = globale.opener;
    if (!dest || dest.closed || !cfg.origine) return false;
    try { dest.postMessage({ fejalog: 'verifica-bdn', file: file }, cfg.origine); } catch (e) { return false; }
    globale.addEventListener('message', function (ev) {
      if (ev.origin !== cfg.origine || !ev.data || ev.data.fejalog !== 'verifica-bdn-ricevuta') return;
      fase('Fatto: il risultato è arrivato nella pagina di Fejalog (' + (ev.data.caricati || 0) + ' contrassegni).');
    });
    return true;
  }

  var codici = cfg.codici, risultati = [];
  (async function () {
    for (var n = 0; n < codici.length; n++) {
      var v = codici[n], codice = norma(v.contrassegno);
      fase((n + 1) + ' di ' + codici.length + ': ' + codice);
      q('barra').style.width = Math.round(100 * n / codici.length) + '%';
      var r = { contrassegno: codice, etichette: (v.etichette || []).join(', '), capi: [], marca: null, errore: '' };
      try {
        r.capi = (await cercaCapi(codice)).map(function (c) {
          return { codice: c.codice, sesso: c.sesso, razza: c.razza, specie: c.specie, nascita: c.nascita, precedente: c.precedente,
            elettronico: c.elettronico, stato: c.stato, stabilimento: c.stabilimento || '' };
        });
        await attesa(PAUSA);
        r.marca = await cercaMarca(codice);
        if (r.marca && r.marca.stato === 'APPLICATA' && !r.capi.length) {
          var dallaMarca = await capoDallaMarca(r.marca);
          if (dallaMarca) { dallaMarca.dalla_marca = true; r.capi = [dallaMarca]; }
        }
        if (r.marca) delete r.marca._capo;
      } catch (e) {
        r.errore = e && e.message ? e.message : String(e);
        if (/sessione BDN è scaduta/.test(r.errore)) { risultati.push(r); riga(codice + ' · ' + r.errore); break; }
      }
      risultati.push(r);
      riga(codice + (avvisoFormato(codice) ? ' (formato inusuale)' : '') + ' · ' + sintesi(r));
      await attesa(PAUSA);
    }
    finito = true; clearInterval(orologio);
    q('barra').style.width = '100%';
    var file = { formato: FORMATO, versione: 1, timbro: cfg.timbro, cercati: codici.length, risultati: risultati };
    globale.__BDN_VERIFICA_ESITO__ = file;
    var testo = JSON.stringify(file, null, 1), nomeJson = 'fejalog_verifica_bdn_' + cfg.timbro + '.json';
    // Caricamento diretto (utente, 14/11): se la BDN è stata aperta dalla pagina di Fejalog («Apri la BDN»), il risultato
    // torna da solo a quella pagina; la pagina risponde «ricevuto». Altrimenti restano il file e «Copia il risultato».
    var inviato = inviaAllaPagina(file);
    // Se lo scaricamento non parte (Chrome lo può bloccare), il risultato resta qui: si scarica di nuovo o si copia e si
    // incolla nella pagina di Fejalog (utente, 14/11: «deve esserci modo di caricarlo se non si carica da solo»).
    if (!cfg.senzaFile) scarica(nomeJson, testo, 'application/json');
    fase('Fatto: ' + risultati.length + ' di ' + codici.length + ' contrassegni.');
    var tasti = document.createElement('div');
    tasti.style.cssText = 'margin-top:8px;display:flex;flex-wrap:wrap;gap:6px';
    function tasto(etichetta, azione) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = etichetta;
      b.style.cssText = 'padding:6px 10px;border:1px solid #2e5e3e;border-radius:6px;background:#fff;color:#2e5e3e;cursor:pointer;font:13px system-ui,sans-serif';
      b.onclick = azione; tasti.appendChild(b); return b;
    }
    tasto('Scarica il file per Fejalog (.json)', function () { scarica(nomeJson, testo, 'application/json'); });
    tasto('Scarica l\'elenco (.csv)', function () { scarica('fejalog_verifica_bdn_' + cfg.timbro + '.csv', csv(risultati), 'text/csv'); });
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
      (cfg.senzaFile ? '' : 'Il file ' + nomeJson + ' è nella cartella dei download. ') +
      'Caricalo in Fejalog accanto al backup (sito: Carica › Risultato della BDN; tablet: Soluzioni › Verifica in BDN). ' +
      'Se il file non c\'è, scaricalo di nuovo qui, oppure «Copia il risultato» e incollalo nella pagina di Fejalog. ' +
      'Il .csv è lo stesso elenco da leggere a colpo d\'occhio.';
  })().catch(function (e) { fase('Errore: ' + (e && e.message ? e.message : e)); finito = true; clearInterval(orologio); });
})(typeof window !== 'undefined' ? window : this);
