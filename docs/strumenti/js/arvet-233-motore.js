/* =============================================================================
 * Fejalog — SNIPPET per ARVET: scarica il modello 2/33 degli stabilimenti campionati, per ogni specie ovicaprina
 * -----------------------------------------------------------------------------
 * Si incolla nella console del browser (F12 → Console) su una pagina di ARVET con la TUA sessione aperta. La pagina
 * «Scarica dalla BDN e da ARVET» del sito di Fejalog antepone window.__ARVET_233__ = { codici: [...], data: 'AAAAMMGG' }.
 *
 * Per ogni stabilimento e per ogni specie che alleva fra ovini e caprini: lo stesso «Stampa modello 2/33» che faresti a
 * mano (codice dello stabilimento, specie, ordinamento per marchio auricolare), l'attesa nella coda stampe di ARVET e il
 * file .htm, salvato così com'è come 2-33_<stabilimento>_<specie>_<AAAAMMGG>.htm. Alla fine un solo zip,
 * arvet_233_<AAAAMMGG>.zip, con tutti i 2/33 e riepilogo.txt: si carica così com'è nelle stampe pre-campo del sito, che
 * restituiscono i 2/33 precompilati coi numeri delle provette.
 *
 * Solo stampe: non salva e non modifica niente in ARVET. Una stampa alla volta (la coda di ARVET è una sola: se c'è già
 * una stampa in corso, aspetta e riprova). Nessun dato esce dal browser. Le stampe risultano fatte dalla tua utenza.
 * ============================================================================= */
(function (globale) {
  'use strict';

  var PAUSA = 1000, MASSIMO = 90000, ATTESA_STAMPA = 300000, OGNI = 3000, RIPROVE_CODA = 12;

  /* ---------- funzioni pure (provate in Node: sito/prove/scarica-bdn.cjs) ---------- */
  function pulisci(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function specieBreve(s) {
    var t = pulisci(s).toLowerCase();
    if (/^(o|ov|ovin[io]|pecor[ae]|pecora)$/.test(t)) return 'ovini';
    if (/^(c|cap|caprin[io]|capr[ae]|capra)$/.test(t)) return 'caprini';
    return t;
  }
  function ovicaprino(s) { var t = specieBreve(s); return t === 'ovini' || t === 'caprini'; }
  function oggiAAAAMMGG(d) {
    d = d || new Date();
    var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    return '' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate());
  }
  function nomeFile(codice, specie, data) { return '2-33_' + pulisci(codice).toUpperCase() + '_' + specieBreve(specie) + '_' + data + '.htm'; }
  function nomeStampa(codice) { return 'stampa_mod233_' + pulisci(codice).toUpperCase(); }
  /** Le specie ovicaprine dello stabilimento dalla risposta di ricerca_specie_azienda.json: [{specie, specieazi}]. */
  function specieOvicaprine(lista) {
    return (Array.isArray(lista) ? lista : []).filter(function (x) { return x && ovicaprino(x.descrizionespecie); })
      .map(function (x) { return { specie: specieBreve(x.descrizionespecie), specieazi: String(x.id) }; });
  }
  /** Il lavoro appena accodato nella coda stampe: il più recente con quel nome che non c'era prima. */
  function lavoroNuovo(lista, noti, nomestampa) {
    var c = (Array.isArray(lista) ? lista : []).filter(function (j) { return noti.indexOf(j.id) < 0 && j.nomestampa === nomestampa; });
    return c.length ? c[0] : null;
  }
  /** I parametri del form «Stampa modello 2/33» (form_stampa, in GET), come li manda la pagina. */
  function parametriStampa(serveter, aziendaId, codice, specieazi) {
    return [['utf8', '✓'], ['serveter_attivo', serveter || ''], ['azienda_id', aziendaId], ['azienda_id_codice_ajax', codice],
      ['specieazi', specieazi], ['proprietario_id', ''], ['stato_id', ''], ['dadataingresso', ''], ['adataingresso', ''],
      ['nrighevuote', ''], ['ordinamento', 'contrassegno']];
  }
  function codici(cfg) {
    var out = [], visti = {};
    (cfg && cfg.codici || []).forEach(function (c) { var k = pulisci(c).toUpperCase(); if (k && !visti[k]) { visti[k] = true; out.push(k); } });
    return out;
  }

  /* zip senza compressione (lo snippet gira in ARVET, senza librerie) */
  var TABELLA_CRC = (function () { var t = [], c; for (var n = 0; n < 256; n++) { c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u) { var c = 0xFFFFFFFF; for (var i = 0; i < u.length; i++) c = TABELLA_CRC[(c ^ u[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function latin1(s) { var u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 0xFF; return u; }
  function zip(voci) {
    var parti = [], centrale = [], pos = 0;
    function u16(n) { return [n & 0xFF, (n >>> 8) & 0xFF]; }
    function u32(n) { return [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF]; }
    voci.forEach(function (v) {
      var nome = latin1(v.nome), crc = crc32(v.dati), n = v.dati.length;
      var testa = [].concat(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0x21), u32(crc), u32(n), u32(n), u16(nome.length), u16(0));
      parti.push(new Uint8Array(testa), nome, v.dati);
      centrale.push(new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0x21), u32(crc), u32(n), u32(n),
        u16(nome.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(pos))), nome);
      pos += testa.length + nome.length + n;
    });
    var lCentrale = centrale.reduce(function (s, x) { return s + x.length; }, 0);
    var fine = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(voci.length), u16(voci.length), u32(lCentrale), u32(pos), u16(0)));
    var tutto = parti.concat(centrale, [fine]), tot = tutto.reduce(function (s, x) { return s + x.length; }, 0);
    var out = new Uint8Array(tot), o = 0;
    tutto.forEach(function (x) { out.set(x, o); o += x.length; });
    return out;
  }

  var puro = { specieBreve: specieBreve, ovicaprino: ovicaprino, nomeFile: nomeFile, nomeStampa: nomeStampa, oggiAAAAMMGG: oggiAAAAMMGG,
    specieOvicaprine: specieOvicaprine, lavoroNuovo: lavoroNuovo, parametriStampa: parametriStampa, codici: codici, zip: zip, crc32: crc32 };
  if (typeof module === 'object' && module.exports) { module.exports = puro; return; }

  /* ---------- in ARVET ---------- */
  var cfg = globale.__ARVET_233__;
  if (!cfg || !codici(cfg).length) { console.log('Fejalog: manca l\'elenco degli stabilimenti (window.__ARVET_233__). Prepara lo snippet dalla pagina del sito.'); return; }
  if (location.hostname.indexOf('arvet.reteunitaria.piemonte.it') < 0) { console.log('Fejalog: lo snippet va incollato in ARVET, nella scheda dove hai fatto l\'accesso.'); return; }
  cfg.data = cfg.data || oggiAAAAMMGG();
  // solo per le prove (sito/prove/scarica-bdn.cjs): tempi ridotti
  var T = cfg.tempi || {}, ATTESA_CODA = T.coda || 15000;
  if (T.pausa != null) PAUSA = T.pausa; if (T.ogni != null) OGNI = T.ogni;

  var attesa = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function richiesta(url) {
    var c = typeof AbortController === 'function' ? new AbortController() : null;
    var t = setTimeout(function () { if (c) c.abort(); }, MASSIMO);
    return fetch(url, Object.assign({ credentials: 'same-origin' }, c ? { signal: c.signal } : {}))
      .then(function (r) {
        clearTimeout(t); risposta();
        if (/\/cas\/login|casvet\./.test(r.url)) throw new Error('la sessione ARVET è scaduta: rientra e rilancia lo snippet');
        if (!r.ok) throw new Error('ARVET risponde ' + r.status + ' a ' + url.split('?')[0]);
        return r;
      }, function (e) { clearTimeout(t); throw new Error(e && e.name === 'AbortError' ? 'ARVET non ha risposto in ' + MASSIMO / 1000 + ' s' : 'rete: ' + (e && e.message)); });
  }
  var json = function (url) { return richiesta(url).then(function (r) { return r.json(); }); };
  var testo = function (url) { return richiesta(url).then(function (r) { return r.text(); }); };

  /* pannello di avanzamento */
  var pannello = document.createElement('div');
  pannello.style.cssText = 'position:fixed;top:8px;right:8px;z-index:99999;background:#fff;border:2px solid #2e5e3e;border-radius:8px;' +
    'padding:10px 12px;font:13px system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.25);width:400px;max-width:90vw;color:#222';
  pannello.innerHTML = '<b>Fejalog · 2/33 da ARVET</b>' +
    '<div data-f="fase" style="margin-top:6px;font-weight:600"></div>' +
    '<div style="background:#e6ece7;border-radius:4px;height:10px;margin:6px 0;overflow:hidden"><div data-f="barra" style="background:#2e5e3e;height:10px;width:0"></div></div>' +
    '<div data-f="passo"></div><div data-f="tempo" style="margin-top:4px;color:#666"></div>' +
    '<div data-f="file" style="margin-top:6px;font:12px ui-monospace,monospace;color:#2e5e3e;max-height:9em;overflow:auto"></div>' +
    '<div data-f="nota" style="color:#666;margin-top:6px">Non chiudere questa scheda e non cambiare pagina finché non arriva lo zip.</div>';
  document.body.appendChild(pannello);
  var q = function (n) { return pannello.querySelector('[data-f="' + n + '"]'); };
  var stato = { inizio: Date.now(), ultima: Date.now(), fatti: 0, totale: 0, file: [], fine: false };
  var mmss = function (ms) { var s = Math.round(ms / 1000); return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); };
  function ridisegna() {
    q('barra').style.width = (stato.totale ? Math.round(100 * stato.fatti / stato.totale) : 0) + '%';
    var fermo = Math.round((Date.now() - stato.ultima) / 1000);
    q('tempo').textContent = 'Da ' + mmss(Date.now() - stato.inizio) + (stato.fine ? '' : ' · ultima risposta di ARVET ' + fermo + ' s fa');
    q('file').innerHTML = stato.file.map(function (f) { return f.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }).join('<br>');
  }
  var orologio = setInterval(ridisegna, 1000);
  var fase = function (t) { q('fase').textContent = t; ridisegna(); };
  var msg = function (t) { q('passo').textContent = t; console.log('Fejalog:', t); ridisegna(); };
  function risposta() { stato.ultima = Date.now(); }

  function utenteId() {
    var m = document.documentElement.innerHTML.match(/utente_id=(\d+)/);
    if (m) return Promise.resolve(m[1]);
    return testo('/aziende/filtro_stampa_modello233').then(function (h) {
      var n = h.match(/utente_id=(\d+)/); if (!n) throw new Error('non trovo il tuo utente ARVET: apri una pagina di ARVET e rilancia'); return n[1];
    });
  }
  function serveterAttivo() {
    return testo('/aziende/filtro_stampa_modello233').then(function (h) { var m = h.match(/name="serveter_attivo"[^>]*value="([^"]*)"/); return m ? m[1] : ''; });
  }
  function coda(utente) { return json('/codastampe/list.json?utente_id=' + utente + '&noCache=' + Date.now()); }

  /** Una stampa del 2/33: accoda (aspettando se la coda è occupata), attende il lavoro in F, scarica il file. */
  function stampa(utente, serveter, az, sp) {
    var ns = nomeStampa(az.codice), noti;
    return coda(utente).then(function (l) { noti = (l || []).map(function (j) { return j.id; }); })
      .then(function accoda(k) {
        k = k || 0;
        var url = '/aziende/stampa_modello_233.html?' + new URLSearchParams(parametriStampa(serveter, az.id, az.codice, sp.specieazi)).toString();
        return richiesta(url).then(function (r) {
          if (/show_stampa_in_corso/.test(r.url)) {
            if (k >= RIPROVE_CODA) throw new Error('la coda stampe di ARVET resta occupata da un\'altra stampa');
            msg(az.codice + ' ' + sp.specie + ': un\'altra stampa è in corso in ARVET, aspetto e riprovo…');
            return attesa(ATTESA_CODA).then(function () { return accoda(k + 1); });
          }
        });
      })
      .then(function () {
        var t0 = Date.now();
        return (function guarda() {
          return coda(utente).then(function (l) {
            var j = lavoroNuovo(l, noti, ns);
            if (j && j.stato === 'F' && j.nomefile) return j;
            if (j && j.stato === 'X') throw new Error('ARVET non è riuscito a fare la stampa (lavoro in errore)');
            if (Date.now() - t0 > ATTESA_STAMPA) throw new Error('la stampa non è pronta dopo ' + ATTESA_STAMPA / 60000 + ' minuti');
            msg(az.codice + ' ' + sp.specie + ': ARVET prepara il 2/33' + (j ? ' (stato ' + j.stato + ')' : '') + '…');
            return attesa(OGNI).then(guarda);
          });
        })();
      })
      .then(function (j) { return attesa(PAUSA).then(function () { return richiesta('/arvetdl/' + encodeURIComponent(j.nomefile)); }); })
      .then(function (r) { return r.arrayBuffer(); })
      .then(function (b) {
        var t = new TextDecoder('latin1').decode(b);
        if (!/inizio stampa capi/.test(t)) throw new Error('il file arrivato non sembra un modello 2/33');
        return b;
      });
  }
  function scarica(nome, u, tipo) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([u], { type: tipo })); a.download = nome;
    document.body.appendChild(a); a.click(); a.remove();
  }

  var avvisi = [], fatti = [], voci = [];
  Promise.all([utenteId(), serveterAttivo()]).then(function (v) {
    var utente = v[0], serveter = v[1], lista = codici(cfg), lavori = [];
    fase('Cerco gli stabilimenti e le loro specie');
    return lista.reduce(function (p, codice) {
      return p.then(function () { msg(codice + '…'); return json('/utility/ricerca_lente/Azienda/codiceazienda/' + encodeURIComponent(codice) + '?campo_descrizione=indirizzo'); })
        .then(function (az) {
          if (!az || !az.id) { avvisi.push(codice + ': non trovato in ARVET'); return; }
          return attesa(PAUSA).then(function () { return json('/aziende/ricerca_specie_azienda.json?azienda_id=' + encodeURIComponent(az.id)); })
            .then(function (s) {
              var sp = specieOvicaprine(s);
              if (!sp.length) avvisi.push(codice + ': in ARVET non alleva ovini né caprini');
              sp.forEach(function (x) { lavori.push({ az: { codice: codice, id: String(az.id) }, sp: x }); });
            });
        }).catch(function (e) { if (/sessione/.test(e.message)) throw e; avvisi.push(codice + ': ' + e.message); })
        .then(function () { return attesa(PAUSA); });
    }, Promise.resolve()).then(function () {
      stato.totale = lavori.length;
      fase('Stampo ' + lavori.length + ' modelli 2/33, uno alla volta');
      return lavori.reduce(function (p, l, i) {
        return p.then(function () {
          msg(l.az.codice + ' ' + l.sp.specie + ': chiedo la stampa…');
          return stampa(utente, serveter, l.az, l.sp);
        }).then(function (b) {
          var nome = nomeFile(l.az.codice, l.sp.specie, cfg.data);
          voci.push({ nome: nome, dati: new Uint8Array(b) }); fatti.push(nome);
          stato.file.push('✓ ' + nome + ' (' + Math.round(b.byteLength / 1024) + ' kB)');
        }).catch(function (e) {
          if (/sessione/.test(e.message)) throw e;
          avvisi.push(l.az.codice + ' ' + l.sp.specie + ': ' + e.message);
          stato.file.push('✗ ' + l.az.codice + ' ' + l.sp.specie + ': ' + e.message);
        }).then(function () { stato.fatti = i + 1; ridisegna(); return attesa(PAUSA); });
      }, Promise.resolve());
    });
  }).then(function () {
    fase('Preparo lo zip…');
    var r = ['Fejalog · 2/33 da ARVET del ' + cfg.data, '', 'Stabilimenti: ' + codici(cfg).join(', '), '']
      .concat(fatti.map(function (f) { return 'scaricato: ' + f; }), avvisi.length ? ['', 'Avvisi:'].concat(avvisi.map(function (a) { return '- ' + a; })) : []);
    voci.push({ nome: 'riepilogo.txt', dati: latin1(r.join('\r\n') + '\r\n') });
    scarica('arvet_233_' + cfg.data + '.zip', zip(voci), 'application/zip');
    stato.fine = true; fase('Finito');
    msg(fatti.length + ' modelli 2/33 nello zip arvet_233_' + cfg.data + '.zip' + (avvisi.length ? '; da controllare: ' + avvisi.join(' · ') : '') +
      '. Caricalo nelle stampe pre-campo del sito.');
  }).catch(function (e) {
    stato.fine = true; fase('Interrotto'); q('fase').style.color = '#b00020'; msg('Interrotto: ' + e.message);
  }).then(function () { clearInterval(orologio); ridisegna(); q('nota').textContent = 'Puoi chiudere questo riquadro ricaricando la pagina.'; });
})(typeof window !== 'undefined' ? window : this);
