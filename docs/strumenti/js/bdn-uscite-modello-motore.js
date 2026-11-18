/* =============================================================================
 * Fejalog — SNIPPET per la BDN ovicaprini: capi usciti con un modello negli ultimi 7 giorni
 * -----------------------------------------------------------------------------
 * Il registro di stalla non è ancora aggiornato nemmeno dai modelli degli ultimi 7 giorni (utente, 2026-11-18): le uscite si
 * leggono dalla sezione MOVIMENTAZIONI della BDN (modelli di accompagnamento in uscita), non dal registro né dalla verifica
 * dei contrassegni. Si incolla nella console (F12 → Console) sulla TUA sessione BDN già aperta; il sito di Fejalog
 * (Carica › Uscite per modello negli ultimi 7 giorni) antepone
 *   window.__BDN_USCITE_MODELLO__ = { stabilimenti: ['888TO999', …], giorni: 7, al: 'gg/mm/aaaa' (facoltativo, predefinito oggi), timbro, data, origine }.
 * La finestra è [al − giorni, al]: per un'analisi a posteriori (per esempio il risanamento del 16/11) si imposta `al` al giorno del
 * campionamento, così i capi usciti dopo non entrano (erano presenti quel giorno).
 *
 * Per ogni stabilimento, come a mano (studiato sulla BDN il 2026-11-18):
 *  - Movimentazioni › Ricerca modelli (documento_accompagnamento/singoli/int_doc_acc_ric.pl): Origine, codice allevamento,
 *    tutte le destinazioni, data di richiesta larga (da 30 giorni prima della finestra a oggi);
 *  - si tengono i modelli con la data d'uscita nella finestra (filtro della BDN «per data uscita da allevamento» e controllo qui),
 *    anche verso il pascolo, tranne i rifiutati, i non ancora autorizzati e quelli già rientrati; TUTTI gli altri, qualunque sia lo stato (utente, 18/11: un modello confermato fra la preparazione del progetto e
 *    l'interrogazione non si deve perdere: niente filtro «senza movimentazione di uscita»);
 *  - per ogni modello il dettaglio (int_doc_acc.pl, P_PRENOTAZIONE_ID): i capi, il riferimento, la data di partenza.
 *
 * Solo letture, una richiesta alla volta con una pausa: non salva e non modifica niente in BDN. Nessun dato esce dal
 * browser. Il formato del file è in docs/piani/2026-11-18_uscite_per_modello.md.
 * ============================================================================= */
(function (globale) {
  'use strict';

  var B = '/ovicaprini/sito_interrogazioni/';
  var BM = '/ovicaprini/documento_accompagnamento/singoli/';
  var PAUSA = 600;
  var FORMATO = 'fejalog-uscite-modello';

  /* ---------- funzioni pure (provate in Node: sito/prove/bdn-uscite-modello.cjs) ---------- */
  function norma(c) { return String(c == null ? '' : c).replace(/\s+/g, '').toUpperCase(); }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function timbroAdesso(d) { d = d || new Date(); return '' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '_' + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds()); }
  function dataIt(d) { return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear(); }
  /** La data come in BDN («gg/mm/aaaa» o «aaaa-mm-gg») in «gg/mm/aaaa»; '' se non si legge. */
  function normalizzaData(t) {
    var s = String(t == null ? '' : t).trim(), m;
    if ((m = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/.exec(s))) return p2(+m[1]) + '/' + p2(+m[2]) + '/' + m[3];
    if ((m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s))) return m[3] + '/' + m[2] + '/' + m[1];
    return '';
  }
  /** La finestra [dal, al] (gg/mm/aaaa) di `giorni` giorni che finisce in `al` (predefinito oggi). */
  function finestra(al, giorni, oggi) {
    var f = normalizzaData(al), d;
    if (f) { var m = f.split('/'); d = new Date(+m[2], +m[1] - 1, +m[0]); } else d = oggi || new Date();
    var a = new Date(d.getFullYear(), d.getMonth(), d.getDate()), da = new Date(a.getTime()); da.setDate(da.getDate() - (giorni || 7));
    return { dal: dataIt(da), al: dataIt(a) };
  }
  /** La causale del modello nel tipo di uscita di Fejalog: macello, vendita (o cessione) o altro. */
  function tipoDaCausale(testo) {
    var s = String(testo || '').toUpperCase();
    if (/MACELL/.test(s)) return 'macello';
    if (/VENDIT|CESSION|COMPRAVEND|SCAMBIO/.test(s)) return 'vendita';
    return 'altro';
  }
  /** Una riga letta dalla BDN nell'uscita del file; null se manca il contrassegno o la data non si legge. */
  function uscita(stabilimento, r) {
    var c = norma(r && r.contrassegno), d = normalizzaData(r && r.data);
    if (!c || !d) return null;
    var tipo = r.tipo === 'macello' || r.tipo === 'vendita' || r.tipo === 'altro' ? r.tipo : tipoDaCausale(r.causale || r.tipo);
    return { stabilimento: String(stabilimento).trim().toUpperCase(), specie: r.specie === 'capre' ? 'capre' : 'pecore', contrassegno: c, data: d, tipo: tipo,
      modello: String(r.modello || '').trim(), destinazione_codice: norma(r.destinazione_codice), destinazione: String(r.destinazione || '').trim().slice(0, 80) };
  }
  /** Il file `fejalog-uscite-modello` v1: uscite ripetute (stesso capo) tolte, tenendo la più recente. */
  function costruisciFile(cfg, uscite, fin) {
    var perCapo = {};
    uscite.forEach(function (u) {
      var k = u.contrassegno, g = u.data.split('/').reverse().join('');
      if (!perCapo[k] || g > perCapo[k].data.split('/').reverse().join('')) perCapo[k] = u;
    });
    return { formato: FORMATO, versione: 1, timbro: cfg.timbro, giorni: cfg.giorni || 7, dal: fin ? fin.dal : '', al: fin ? fin.al : '', uscite: Object.keys(perCapo).map(function (k) { return perCapo[k]; }) };
  }

  function pulisci(t) { return String(t == null ? '' : t).replace(/\s+/g, ' ').trim(); }
  function chiaveData(g) { var d = normalizzaData(g); return d ? d.split('/').reverse().join('') : ''; }
  /** La tipologia di destinazione del modello nel tipo d'uscita (il pascolo è «altro»: il capo non è in allevamento). */
  function tipoDaDestinazione(t) {
    var s = String(t || '').toUpperCase();
    if (/MACELL/.test(s)) return 'macello';
    if (/ALLEVAMENTO|SOSTA|TRANSITO|RACCOLTA|FIERA|MERCATO|GENETICO/.test(s)) return 'vendita';
    return 'altro';
  }
  /** I modelli della lista della BDN (tabella con «Estremi documento»): l'identificativo sta nell'onclick della riga. */
  function modelliDa(doc) {
    var t = Array.prototype.filter.call(doc.querySelectorAll('table'), function (x) { return x.rows.length > 1 && /Estremi documento/i.test(x.rows[0].textContent); })[0];
    if (!t) return [];
    var int = Array.prototype.map.call(t.rows[0].cells, function (c) { return pulisci(c.textContent); });
    function col(re) { for (var k = 0; k < int.length; k++) if (re.test(int[k])) return k; return -1; }
    var c = { specie: col(/Specie/i), richiesta: col(/Data Richiesta/i), uscita: col(/Data uscita/i), rientro: col(/Data rientro/i), tipologia: col(/Tipologia/i),
      destinazione: col(/^Destinazione/i), estremi: col(/Estremi/i), capi: col(/Num/i), autorizzazione: col(/autorizzazione/i), rifiuto: col(/rifiuto/i) };
    return Array.prototype.slice.call(t.rows, 1).map(function (r) {
      var v = function (k) { return k >= 0 && r.cells[k] ? pulisci(r.cells[k].textContent) : ''; };
      var m = /lista_scelta_riga\(\s*'?(\d+)'?\s*\)/.exec(r.getAttribute('onclick') || '');
      return { id: m ? m[1] : '', specie: v(c.specie), richiesta: v(c.richiesta), uscita: v(c.uscita), rientro: v(c.rientro), tipologia: v(c.tipologia),
        destinazione: v(c.destinazione), estremi: v(c.estremi), capi: v(c.capi), autorizzato: c.autorizzazione < 0 || !!v(c.autorizzazione), rifiutato: !!v(c.rifiuto) };
    }).filter(function (m) { return m.id; });
  }
  /**
   * Quali modelli della lista contano (utente, 18/11: «più prudente non filtrare; escluderei al massimo quelli non autorizzati,
   * o da confermare»): tutti quelli usciti nella finestra, anche verso il pascolo, tranne i rifiutati, i non ancora
   * autorizzati e quelli già rientrati entro la fine della finestra. Con il perché degli scartati.
   */
  function scegliModelli(modelli, dal, al) {
    var da = chiaveData(dal), a = chiaveData(al), tenuti = [], scartati = [];
    modelli.forEach(function (m) {
      var g = chiaveData(m.uscita) || chiaveData(m.richiesta), rientro = chiaveData(m.rientro);
      var perche = m.rifiutato ? 'rifiutato' : !m.autorizzato ? 'non ancora autorizzato (da confermare)' : (rientro && rientro <= a) ? 'rientrato il ' + m.rientro :
        !g ? 'senza data' : (g < da || g > a) ? 'fuori dalla finestra' : '';
      if (perche) scartati.push({ modello: m, perche: perche }); else tenuti.push(m);
    });
    return { tenuti: tenuti, scartati: scartati };
  }
  /** Il dettaglio di un modello: riferimento, data di partenza e i capi (tabella con «Codice Capo»). */
  function capiDelModello(doc) {
    var val = function (n) { var e = doc.querySelector('[name="' + n + '"]'); return e ? pulisci(e.value) : ''; };
    var t = Array.prototype.filter.call(doc.querySelectorAll('table'), function (x) { return x.rows.length > 1 && /Codice Capo/i.test(x.rows[0].textContent); })[0];
    var capi = [];
    if (t) {
      var int = Array.prototype.map.call(t.rows[0].cells, function (c) { return pulisci(c.textContent); });
      var iCapo = 0, iSpecie = -1, iUscita = -1;
      int.forEach(function (x, k) { if (/^Codice Capo/i.test(x)) iCapo = k; if (/^Specie/i.test(x)) iSpecie = k; if (/^Uscita/i.test(x)) iUscita = k; });
      Array.prototype.slice.call(t.rows, 1).forEach(function (r) {
        var c = norma(r.cells[iCapo] ? r.cells[iCapo].textContent : '');
        if (!c) return;
        var sp = iSpecie >= 0 && r.cells[iSpecie] ? pulisci(r.cells[iSpecie].textContent).toUpperCase() : '';
        capi.push({ contrassegno: c, specie: /CAPR/.test(sp) ? 'capre' : 'pecore', uscitaRegistrata: iUscita >= 0 && r.cells[iUscita] ? pulisci(r.cells[iUscita].textContent) : '' });
      });
    }
    return { rif: val('P_RIF_MODELLO'), partenza: val('P_DT_PARTENZA'), destinazione: val('P_DEST_AZIENDA_CODICE'), capi: capi };
  }

  var puro = { norma: norma, normalizzaData: normalizzaData, tipoDaCausale: tipoDaCausale, uscita: uscita, finestra: finestra, costruisciFile: costruisciFile, tipoDaDestinazione: tipoDaDestinazione, modelliDa: modelliDa, scegliModelli: scegliModelli, capiDelModello: capiDelModello, timbroAdesso: timbroAdesso, dataIt: dataIt, FORMATO: FORMATO };
  if (typeof module === 'object' && module.exports) { module.exports = puro; return; }

  /* ---------- nella BDN ---------- */
  var cfg = globale.__BDN_USCITE_MODELLO__;
  if (!cfg || !(cfg.stabilimenti || []).length) {
    console.log('Fejalog: manca l\'elenco degli stabilimenti (window.__BDN_USCITE_MODELLO__). Prepara lo snippet dalla pagina del sito.');
    return;
  }
  if (location.hostname.indexOf('vetinfo.it') < 0) { console.log('Fejalog: lo snippet va incollato nella BDN (vetinfo.it), nella scheda dove hai fatto l\'accesso.'); return; }
  cfg.timbro = cfg.timbro || timbroAdesso(); cfg.giorni = cfg.giorni || 7;
  var fin = finestra(cfg.al, cfg.giorni);

  var attesa = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var dec = function (b) { return new TextDecoder('latin1').decode(b); };
  var leggiDoc = function (h) { return new DOMParser().parseFromString(h, 'text/html'); };
  var MASSIMO = 60000, ultima = Date.now();
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
  function coppie(form) { var fd = new FormData(form), out = []; fd.forEach(function (v, k) { out.push([k, v]); }); return out; }
  function imposta(c, valori) {
    c = c.map(function (x) { return x.slice(); });
    Object.keys(valori).forEach(function (nome) {
      var t = false; c.forEach(function (x) { if (x[0] === nome) { x[1] = valori[nome]; t = true; } }); if (!t) c.push([nome, valori[nome]]);
    });
    return c;
  }
  function inviaModulo(url, c) { return richiesta(url, { method: 'POST', body: new URLSearchParams(c) }); }

  /* pannello d'avanzamento */
  var pannello = document.createElement('div');
  pannello.style.cssText = 'position:fixed;top:8px;right:8px;z-index:99999;background:#fff;border:2px solid #2e5e3e;border-radius:8px;' +
    'padding:10px 12px;font:13px system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.25);width:440px;max-width:92vw;color:#222';
  pannello.innerHTML = '<button type="button" data-f="chiudi" title="Chiudi" style="position:absolute;top:2px;right:6px;border:0;background:none;' +
    'font-size:22px;line-height:1;cursor:pointer;color:#444;padding:2px 4px">×</button><b>Fejalog · uscite per modello (' + fin.dal + ' – ' + fin.al + ')</b>' +
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
    q('tempo').textContent = 'Da ' + Math.round((Date.now() - inizio) / 1000) + ' s' + (finito ? '' : ' · ultima risposta della BDN ' + Math.round((Date.now() - ultima) / 1000) + ' s fa');
  }, 1000);
  function fase(t) { q('fase').textContent = t; }
  function riga(t) { var e = q('righe'); e.textContent += t + '\n'; e.scrollTop = e.scrollHeight; }
  function scarica(nome, testo, tipo) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([testo], { type: tipo }));
    a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  function inviaAllaPagina(file) {
    var dest = globale.opener;
    if (!dest || dest.closed || !cfg.origine) return false;
    try { dest.postMessage({ fejalog: 'uscite-modello', file: file }, cfg.origine); } catch (e) { return false; }
    globale.addEventListener('message', function (ev) {
      if (ev.origin !== cfg.origine || !ev.data || ev.data.fejalog !== 'uscite-modello-ricevute') return;
      fase('Fatto: il risultato è arrivato nella pagina di Fejalog (' + (ev.data.caricate || 0) + ' capi).');
    });
    return true;
  }

  /* ---------- la lettura delle movimentazioni ---------- */
  var formRicerca = null;
  /**
   * Le uscite per modello di uno stabilimento dal `dal` al `al` (gg/mm/aaaa), dalla Ricerca modelli della BDN: tutti i
   * modelli d'origine con l'uscita nella finestra, poi il dettaglio di ognuno coi suoi capi.
   */
  async function leggiUscite(stabilimento, dal, al) {
    if (!formRicerca) {
      var f = leggiDoc(await richiesta(BM + 'int_doc_acc_ric.pl')).forms.formPrincipale;
      if (!f) throw new Error('non trovo il modulo della ricerca dei modelli');
      formRicerca = coppie(f);
      await attesa(PAUSA);
    }
    // la richiesta di solito precede l'uscita di pochi giorni: si cerca largo e si sceglie sulla data d'uscita
    var m = dal.split('/'), inizio = new Date(+m[2], +m[1] - 1, +m[0]); inizio.setDate(inizio.getDate() - 30);
    var lista = leggiDoc(await inviaModulo(BM + 'int_doc_acc_ric.pl', imposta(formRicerca, {
      P_SUBMIT: 'ON', P_FLAG_MOVIMENTO: 'ORIGINE', P_COD_AZIENDA: stabilimento, P_TIPO_DESTINAZIONE: 'ALL',
      P_DT_RICHIESTA_INIZIO: dataIt(inizio), P_DT_RICHIESTA_FINE: dataIt(new Date()),
      // il filtro della BDN per data d'uscita dall'allevamento (la casella e le due date)
      P_ABILITA: 'on', P_DT_USCITA_INIZIO: dal, P_DT_USCITA_FINE: al,
    })));
    var scelta = scegliModelli(modelliDa(lista), dal, al);
    scelta.scartati.forEach(function (x) { riga('  modello ' + x.modello.estremi + ' (' + x.modello.tipologia.toLowerCase() + ', ' + (x.modello.uscita || x.modello.richiesta) + '): ' + x.perche); });
    var moduloLista = lista.forms.formPrincipale ? coppie(lista.forms.formPrincipale) : formRicerca, out = [];
    for (var k = 0; k < scelta.tenuti.length; k++) {
      var mod = scelta.tenuti[k];
      await attesa(PAUSA);
      var det = capiDelModello(leggiDoc(await inviaModulo(BM + 'int_doc_acc.pl', imposta(moduloLista, { P_PRENOTAZIONE_ID: mod.id }))));
      var nonRegistrati = det.capi.filter(function (c) { return !c.uscitaRegistrata; }).length;
      riga('  modello ' + (det.rif || mod.estremi) + ' · ' + mod.tipologia.toLowerCase() + ' · uscita ' + (det.partenza || mod.uscita) + ' · ' + det.capi.length + ' capi (' + nonRegistrati + ' con l\'uscita non ancora registrata)');
      if (String(det.capi.length) !== String(mod.capi)) riga('  ATTENZIONE: la lista dice ' + mod.capi + ' capi, il dettaglio ne ha ' + det.capi.length);
      det.capi.forEach(function (c) {
        out.push({ specie: c.specie, contrassegno: c.contrassegno, data: det.partenza || mod.uscita || mod.richiesta, tipo: tipoDaDestinazione(mod.tipologia),
          modello: det.rif || mod.estremi, destinazione_codice: det.destinazione, destinazione: pulisci(mod.tipologia.toLowerCase()) });
      });
    }
    return out;
  }

  (async function () {
    var tutte = [], errori = [];
    var st = cfg.stabilimenti;
    for (var n = 0; n < st.length; n++) {
      fase((n + 1) + ' di ' + st.length + ': stabilimento ' + st[n]);
      q('barra').style.width = Math.round(100 * n / st.length) + '%';
      try {
        var lette = await leggiUscite(st[n], fin.dal, fin.al);
        var buone = lette.map(function (r) { return uscita(st[n], r); }).filter(Boolean);
        riga(st[n] + ' · ' + buone.length + ' capi usciti con modello (' + (lette.length - buone.length) + ' righe scartate)');
        tutte = tutte.concat(buone);
      } catch (e) {
        var m = e && e.message ? e.message : String(e);
        errori.push(st[n] + ': ' + m); riga(st[n] + ' · ' + m);
        if (/sessione BDN è scaduta/.test(m)) break;
      }
      await attesa(PAUSA);
    }
    finito = true; clearInterval(orologio);
    q('barra').style.width = '100%';
    var file = costruisciFile(cfg, tutte, fin);
    globale.__BDN_USCITE_MODELLO_ESITO__ = file;
    var testo = JSON.stringify(file, null, 1), nomeJson = 'fejalog_uscite_modello_' + cfg.timbro + '.json';
    if (errori.length) { fase('Finito con errori: ' + errori.length + ' stabilimenti non letti. Il file contiene solo quelli riusciti.'); }
    else fase('Fatto: ' + file.uscite.length + ' capi usciti con modello in ' + st.length + ' stabilimenti.');
    if (!file.uscite.length && errori.length) return; // niente da consegnare
    var inviato = inviaAllaPagina(file);
    if (!cfg.senzaFile) scarica(nomeJson, testo, 'application/json');
    // se lo scaricamento non parte o il risultato non arriva alla pagina: si scarica di nuovo o si copia e si incolla
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
    q('nota').textContent = (inviato ? 'Risultato mandato alla pagina di Fejalog che ha aperto la BDN. ' : '') +
      'Caricalo in Fejalog (sito: Carica › Uscite per modello negli ultimi ' + cfg.giorni + ' giorni) prima della Sistemazione.';
  })().catch(function (e) { fase('Errore: ' + (e && e.message ? e.message : e)); finito = true; clearInterval(orologio); });
})(typeof window !== 'undefined' ? window : this);
