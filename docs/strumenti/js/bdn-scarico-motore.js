/* =============================================================================
 * Fejalog — SNIPPET per la BDN ovicaprini: scarica i registri storici ASCII e le marche disponibili
 * -----------------------------------------------------------------------------
 * Si incolla nella console del browser (F12 → Console) sulla TUA sessione BDN già aperta, nella pagina
 * Dati › Interrogazioni › Stabilimenti. La pagina «Scarica i registri dalla BDN» del sito di Fejalog antepone
 * window.__BDN_SCARICO__ = { campionare: [codici], aggiuntivi: [{codice, specie, cf}], data: 'AAAAMMGG' }.
 *
 * Per ogni allevamento (stabilimento + specie + codice fiscale dell'operatore):
 *  - il registro storico dei capi identificati singolarmente, dall'apertura dell'allevamento a oggi, in ASCII:
 *    <stabilimento>_<specie>_<cf>_<AAAAMMGG_HHMMSS>.txt (righe da 700 caratteri, quelle che Fejalog legge);
 *  - le marche disponibili (contrassegni a magazzino), solo se ce ne sono: marche_<stabilimento>_<specie>_<cf>_<data>.txt.
 * Alla fine un solo zip, bdn_<AAAAMMGG_HHMMSS>.zip, con anche riepilogo.txt: da caricare in «Crea il progetto sul sito».
 *
 * Come lavora: le stesse pagine e gli stessi form dei tuoi click (ricerca stabilimento → «N Allevamenti» → scheda
 * dell'allevamento → «Identificativi(Ascii)» e «Stampa registro di stalla» › Registro attività Classico › Storico ›
 * ASCII), una richiesta alla volta con una pausa di circa un secondo. La stampa del registro passa da un riquadro
 * nascosto della pagina, perché la BDN riempie quel form coi suoi script. Solo letture: non salva e non modifica
 * niente in BDN. Nessun dato esce dal browser; lo zip è un file locale. Le interrogazioni risultano fatte dalla tua
 * utenza: eseguilo con le tue credenziali.
 * ============================================================================= */
(function (globale) {
  'use strict';

  var B = '/ovicaprini/sito_interrogazioni/';
  var STAMPA = '/ovicaprini/registro_stalla_ovicaprini/stampa_registro_stalla.pl';
  var PAUSA = 900;

  /* ---------- funzioni pure (provate in Node: sito/prove/scarica-bdn.cjs) ---------- */

  function pulisci(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function specieBreve(s) {
    var t = pulisci(s).toLowerCase();
    // solo parole intere: «CAVALLI» o «ASINI» non sono caprini (12/11: lo snippet apriva i cavalli come capre)
    if (/^(o|ov|ovin[io]|ovino|pecor[ae]|pecora)$/.test(t)) return 'ovini';
    if (/^(c|cap|caprin[io]|capr[ae]|capra)$/.test(t)) return 'caprini';
    return t;
  }
  function ovicaprino(specie) { var s = specieBreve(specie); return s === 'ovini' || s === 'caprini'; }
  function chiave(codice, specie, cf) { return pulisci(codice).toUpperCase() + '|' + specieBreve(specie) + '|' + pulisci(cf).toUpperCase(); }
  function nomeRegistro(a, data) { return pulisci(a.codice).toUpperCase() + '_' + specieBreve(a.specie) + '_' + pulisci(a.cf).toUpperCase() + '_' + data + '.txt'; }
  function nomeMarche(a, data) { return 'marche_' + nomeRegistro(a, data); }
  function oggiAAAAMMGG(d) {
    d = d || new Date();
    var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    return '' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate());
  }
  /** Data e ora dello scarico, `AAAAMMGG_HHMMSS`, nei nomi dei file (utente, 2026-11-12). */
  function timbroAdesso(d) {
    d = d || new Date();
    var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    return oggiAAAAMMGG(d) + '_' + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds());
  }

  /** Il primo percorso di file temporaneo della BDN in una pagina (il tasto «Visualizza File»). */
  function percorsoTmp(html) {
    var m = String(html).match(/tmp_files\/[^'"\s<>)]+/);
    return m ? '/ovicaprini/' + m[0] : null;
  }
  /** L'argomento di lista_scelta_riga('…') nell'HTML di una riga (sta sull'elemento <tr>: usare outerHTML). */
  function sceltaRiga(html) {
    var m = String(html).match(/lista_scelta_riga\(\s*'([^']+)'/);
    return m ? m[1] : null;
  }
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
        var riga = t.rows[r], o = { _scelta: sceltaRiga(riga.outerHTML) };
        for (var k = 0; k < intest.length; k++) o[intest[k]] = riga.cells[k] ? pulisci(riga.cells[k].textContent) : '';
        out.push(o);
      }
      return out;
    }
    return null;
  }
  function campo(o, re) { for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k) && re.test(k)) return o[k]; return ''; }
  /** Elenco degli allevamenti di uno stabilimento (pagina «N Allevamenti»). */
  function allevamentiDa(doc) {
    var righe = righeTabella(doc, [/^Specie/, /Codice Fiscale Operato/, /Data Apertura/], 8);
    if (!righe) return null;
    return righe.map(function (o) {
      return {
        codice: campo(o, /^Codice Aziendale/).toUpperCase(),
        specie: specieBreve(campo(o, /^Specie/)),
        cf: campo(o, /Codice Fiscale Operato/).toUpperCase(),
        apertura: campo(o, /Data Apertura/),
        chiusura: campo(o, /Data Chiusura/),
        scelta: o._scelta,
      };
    });
  }
  /** Gli stabilimenti col codice cercato (pagina dei risultati della ricerca stabilimenti). */
  function stabilimentiDa(doc, codice) {
    var righe = righeTabella(doc, [/^Codice Aziendale/, /Data Apertura/], 3) || [];
    return righe.filter(function (o) { return campo(o, /^Codice Aziendale/).toUpperCase() === codice.toUpperCase() && o._scelta; })
      .map(function (o) { return o._scelta; });
  }
  /** Gli allevamenti da scaricare: tutti quelli degli stabilimenti da campionare, più gli aggiuntivi che esistono. */
  function daScaricare(cfg, perStabilimento) {
    var scelti = [], visti = {}, avvisi = [];
    function aggiungi(a, motivo) {
      var k = chiave(a.codice, a.specie, a.cf);
      if (visti[k]) return;
      visti[k] = true;
      scelti.push(Object.assign({ motivo: motivo }, a));
    }
    (cfg.campionare || []).forEach(function (c) {
      (perStabilimento[c.toUpperCase()] || []).forEach(function (a) { aggiungi(a, 'da campionare'); });
    });
    (cfg.aggiuntivi || []).forEach(function (x) {
      var elenco = perStabilimento[pulisci(x.codice).toUpperCase()] || [];
      var trovato = elenco.filter(function (a) { return chiave(a.codice, a.specie, a.cf) === chiave(x.codice, x.specie, x.cf); });
      if (!trovato.length) avvisi.push('non trovato in BDN: ' + chiave(x.codice, x.specie, x.cf).replace(/\|/g, ' · '));
      trovato.forEach(function (a) { aggiungi(a, 'aggiuntivo'); });
    });
    return { allevamenti: scelti, avvisi: avvisi };
  }
  /** Gli stabilimenti da interrogare, senza doppioni, nell'ordine: prima quelli da campionare. */
  function stabilimentiDaInterrogare(cfg) {
    var out = [], visti = {};
    (cfg.campionare || []).concat((cfg.aggiuntivi || []).map(function (x) { return x.codice; })).forEach(function (c) {
      var k = pulisci(c).toUpperCase();
      if (k && !visti[k]) { visti[k] = true; out.push(k); }
    });
    return out;
  }

  /* ---------- zip STORED (nessuna libreria: lo snippet gira nella BDN) ---------- */
  var TABELLA_CRC = (function () {
    var t = [], c;
    for (var n = 0; n < 256; n++) { c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(u) { var c = 0xFFFFFFFF; for (var i = 0; i < u.length; i++) c = TABELLA_CRC[(c ^ u[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function latin1(s) { var u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 0xFF; return u; }
  /** Uno zip senza compressione: [{nome, dati: Uint8Array}] → Uint8Array. */
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

  function riepilogo(cfg, esiti, avvisi) {
    var r = ['Fejalog · scarico dalla BDN del ' + (cfg.timbro || cfg.data), '',
      'Stabilimenti da campionare: ' + (cfg.campionare || []).join(', '),
      'Allevamenti aggiuntivi chiesti: ' + (cfg.aggiuntivi || []).length, ''];
    esiti.forEach(function (e) {
      r.push([e.codice, e.specie, e.cf, e.chiusura ? 'chiuso il ' + e.chiusura : 'aperto', e.motivo,
        'registro: ' + (e.righeRegistro != null ? e.righeRegistro + ' righe' : e.nota ? e.nota : 'NON SCARICATO'),
        'marche: ' + (e.marche == null ? 'NON SCARICATE' : e.marche === 0 ? 'nessuna a magazzino' : e.marche),
        e.errore ? 'ERRORE: ' + e.errore : ''].filter(Boolean).join(' · '));
    });
    if (avvisi.length) { r.push('', 'Avvisi:'); avvisi.forEach(function (a) { r.push('- ' + a); }); }
    return r.join('\r\n') + '\r\n';
  }

  var puro = {
    fineStorico: fineStorico, specieBreve: specieBreve, ovicaprino: ovicaprino, chiave: chiave, nomeRegistro: nomeRegistro, nomeMarche: nomeMarche, oggiAAAAMMGG: oggiAAAAMMGG, timbroAdesso: timbroAdesso,
    percorsoTmp: percorsoTmp, sceltaRiga: sceltaRiga, allevamentiDa: allevamentiDa, stabilimentiDa: stabilimentiDa,
    daScaricare: daScaricare, stabilimentiDaInterrogare: stabilimentiDaInterrogare, zip: zip, crc32: crc32, latin1: latin1,
    riepilogo: riepilogo,
  };
  if (typeof module === 'object' && module.exports) { module.exports = puro; return; }

  /* ---------- nella BDN ---------- */
  var cfg = globale.__BDN_SCARICO__;
  if (!cfg || !(cfg.campionare || []).length && !(cfg.aggiuntivi || []).length) {
    console.log('Fejalog: manca l\'elenco degli stabilimenti (window.__BDN_SCARICO__). Prepara lo snippet dalla pagina del sito.');
    return;
  }
  cfg.data = cfg.data || oggiAAAAMMGG();
  cfg.timbro = cfg.timbro || timbroAdesso();
  if (location.hostname.indexOf('vetinfo.it') < 0) { console.log('Fejalog: lo snippet va incollato nella BDN (vetinfo.it), nella scheda dove hai fatto l\'accesso.'); return; }

  var attesa = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var dec = function (b) { return new TextDecoder('latin1').decode(b); };
  var leggiDoc = function (h) { return new DOMParser().parseFromString(h, 'text/html'); };
  function controlla(h) {
    if (/cas\/login|name="password"/i.test(h)) throw new Error('la sessione BDN è scaduta: rientra e rilancia lo snippet');
    return h;
  }
  /** Tempo massimo di ogni richiesta e di ogni pagina del riquadro: una BDN ferma diventa un errore dell'allevamento
      (nel riepilogo) e lo scarico prosegue, invece di restare appeso. */
  var MASSIMO = 90000;
  function richiesta(url, opzioni) {
    var c = typeof AbortController === 'function' ? new AbortController() : null;
    var t = setTimeout(function () { if (c) c.abort(); }, MASSIMO);
    return fetch(url, Object.assign({ credentials: 'same-origin' }, opzioni || {}, c ? { signal: c.signal } : {}))
      .catch(function (e) { throw new Error(e && e.name === 'AbortError' ? 'la BDN non ha risposto in ' + MASSIMO / 1000 + ' s' : 'rete: ' + (e && e.message)); })
      .then(function (r) { clearTimeout(t); return r; }, function (e) { clearTimeout(t); throw e; });
  }
  function caricamento() {
    return Promise.race([
      new Promise(function (r) { riquadro.addEventListener('load', r, { once: true }); }),
      attesa(MASSIMO).then(function () { throw new Error('la BDN non ha aperto la pagina in ' + MASSIMO / 1000 + ' s'); }),
    ]);
  }
  function post(url, coppie) {
    return richiesta(url, { method: 'POST', body: new URLSearchParams(coppie) })
      .then(function (r) { if (!r.ok) throw new Error('la BDN risponde ' + r.status + ' a ' + url.split('/').pop()); return r.arrayBuffer(); })
      .then(function (b) { risposta(); return dec(b); }).then(controlla);
  }
  function get(url) {
    return richiesta(url).then(function (r) { if (!r.ok) throw new Error('la BDN risponde ' + r.status); return r.arrayBuffer(); }).then(function (b) { risposta(); return dec(b); });
  }
  function coppie(form) { var fd = new FormData(form), out = []; fd.forEach(function (v, k) { out.push([k, v]); }); return out; }
  function imposta(c, nome, valore) { var t = false; c.forEach(function (x) { if (x[0] === nome) { x[1] = valore; t = true; } }); if (!t) c.push([nome, valore]); return c; }

  /* pannello di avanzamento: fase, passo, barra, tempo e «ultima risposta N s fa» aggiornati ogni secondo, ultimi file */
  var pannello = document.createElement('div');
  pannello.style.cssText = 'position:fixed;top:8px;right:8px;z-index:99999;background:#fff;border:2px solid #2e5e3e;border-radius:8px;' +
    'padding:10px 12px;font:13px system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.25);width:400px;max-width:90vw;color:#222';
  pannello.innerHTML = '<button type="button" data-f="chiudi" title="Chiudi (se lo scarico è in corso, continua e lo zip arriva lo stesso)" ' +
    'style="position:absolute;top:2px;right:6px;border:0;background:none;font-size:22px;line-height:1;cursor:pointer;color:#444;padding:2px 4px">×</button>' +
    '<b>Fejalog · scarico dalla BDN</b>' +
    '<div data-f="fase" style="margin-top:6px;font-weight:600"></div>' +
    '<div style="background:#e6ece7;border-radius:4px;height:10px;margin:6px 0;overflow:hidden"><div data-f="barra" style="background:#2e5e3e;height:10px;width:0"></div></div>' +
    '<div data-f="conti" style="color:#444"></div>' +
    '<div data-f="passo" style="margin-top:4px"></div>' +
    '<div data-f="tempo" style="margin-top:4px;color:#666"></div>' +
    '<div data-f="file" style="margin-top:6px;font:12px ui-monospace,monospace;color:#2e5e3e;max-height:9em;overflow:auto"></div>' +
    '<div data-f="nota" style="color:#666;margin-top:6px">Non chiudere questa scheda e non cambiare pagina finché non arriva lo zip.</div>';
  document.body.appendChild(pannello);
  var q = function (n) { return pannello.querySelector('[data-f="' + n + '"]'); };
  var stato = { inizio: Date.now(), ultima: Date.now(), fatti: 0, totale: 0, unita: 'stabilimenti', file: [], fine: false };
  var mmss = function (ms) { var s = Math.round(ms / 1000); return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); };
  function ridisegna() {
    var pr = stato.totale ? Math.round(100 * stato.fatti / stato.totale) : 0;
    q('barra').style.width = pr + '%';
    q('conti').textContent = stato.totale ? stato.fatti + ' di ' + stato.totale + ' ' + stato.unita + ' (' + pr + '%) · ' +
      stato.file.length + ' file pronti' : '';
    var fermo = Math.round((Date.now() - stato.ultima) / 1000);
    q('tempo').textContent = 'Da ' + mmss(Date.now() - stato.inizio) + (stato.fine ? '' : ' · ultima risposta della BDN ' + fermo + ' s fa' +
      (fermo > 60 ? ' — la BDN è lenta o ferma: aspetta ancora un po\'; se non riparte, ricarica la pagina e rilancia' : ''));
    q('tempo').style.color = !stato.fine && fermo > 60 ? '#b00020' : '#666';
    q('file').innerHTML = stato.file.slice(-8).map(function (f) { return '✓ ' + f.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }).join('<br>');
  }
  var orologio = setInterval(ridisegna, 1000);
  // la crocetta chiude la finestrella senza ricaricare la pagina; il lavoro in corso continua (utente, 2026-11-12)
  q('chiudi').addEventListener('click', function () { clearInterval(orologio); pannello.remove(); });
  var fase = function (t) { q('fase').textContent = t; ridisegna(); };
  var msg = function (t) { q('passo').textContent = t; console.log('Fejalog:', t); ridisegna(); };
  var risposta = function () { stato.ultima = Date.now(); };
  var arrivato = function (nome, righe) { stato.file.push(nome + ' (' + righe + ' righe)'); ridisegna(); };

  /* il riquadro nascosto: le pagine della BDN che si riempiono coi loro script */
  var riquadro = document.createElement('iframe');
  riquadro.name = '__fejalog_bdn';
  riquadro.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;bottom:0;right:0;border:0';
  document.body.appendChild(riquadro);
  function carica(azione, dati) {
    var f = document.createElement('form');
    f.method = 'post'; f.action = azione; f.target = riquadro.name;
    dati.forEach(function (x) { var i = document.createElement('input'); i.type = 'hidden'; i.name = x[0]; i.value = x[1]; f.appendChild(i); });
    document.body.appendChild(f);
    var p = caricamento();
    f.submit(); f.remove();
    return p.then(function () { risposta(); return attesa(PAUSA); });
  }

  function formRicerca() {
    if (document.forms.ricerca && document.forms.ricerca.elements.P_CODICE) return Promise.resolve(coppie(document.forms.ricerca));
    return get(B + 'int_aziende_ric.pl').then(function (h) {
      var f = leggiDoc(h).forms.ricerca;
      if (!f) throw new Error('apri Dati › Interrogazioni › Stabilimenti e rilancia lo snippet da quella pagina');
      return coppie(f);
    });
  }

  /** Gli allevamenti di uno stabilimento: ricerca → scheda → «N Allevamenti». */
  function allevamentiDiStabilimento(base, codice) {
    var lista;
    return post(B + 'interrogazioni_lista.pl', imposta(base.slice().map(function (x) { return x.slice(); }), 'P_CODICE', codice))
      .then(function (h) {
        var d = leggiDoc(h); lista = d.forms.ricerca;
        var scelte = stabilimentiDa(d, codice);
        if (!scelte.length || !lista) return [];
        var tutti = [];
        return scelte.reduce(function (p, id) {
          return p.then(function () { return attesa(PAUSA); })
            .then(function () { return post(B + 'int_aziende.pl', imposta(coppie(lista), 'P_RECORD_ID', id)); })
            .then(function (h2) {
              var g = leggiDoc(h2).forms.formPrincipale;
              if (!g || !g.elements.ALLEVAMENTI) return;
              var c = imposta(coppie(g), 'ALLEVAMENTI', g.elements.ALLEVAMENTI.value);
              return attesa(PAUSA).then(function () { return post(B + (g.getAttribute('action') || 'interrogazioni_lista.pl').split('/').pop(), c); })
                .then(function (h3) {
                  var d3 = leggiDoc(h3), el = allevamentiDa(d3) || [];
                  var altre = el.filter(function (a) { return !ovicaprino(a.specie); });
                  if (altre.length) avvisi.push('stabilimento ' + codice + ': ' + altre.length + ' allevamenti di altre specie non scaricati (' +
                    altre.map(function (a) { return a.specie; }).join(', ') + ')');
                  el.filter(function (a) { return ovicaprino(a.specie); })
                    .forEach(function (a) { a.codice = a.codice || codice; a.formLista = coppie(d3.forms.ricerca); tutti.push(a); });
                });
            });
        }, Promise.resolve()).then(function () { return tutti; });
      });
  }

  /** Le marche disponibili dalla scheda dell'allevamento (già nel riquadro): numero e testo. */
  function marche(scheda) {
    var n = parseInt((scheda.elements.P_NUM_MARCHE_DISPONIBILI || {}).value || '0', 10) || 0;
    if (!n) return Promise.resolve({ righe: 0, testo: '' });
    return post(B + 'marche_disponibili_ascii.pl', imposta(coppie(scheda), 'HTMLPDF', 'ASCII'))
      .then(function (h) { var p = percorsoTmp(h); if (!p) throw new Error('il file delle marche non è arrivato'); return attesa(PAUSA).then(function () { return get(p); }); })
      .then(function (t) { return { righe: t.split(/\r?\n/).filter(Boolean).length, testo: t }; });
  }

  /** Il registro storico: «Stampa registro di stalla» nel riquadro, Classico, Storico, date, ASCII. */
  /** Aspetta (fino a 5 s) che la pagina nel riquadro abbia la funzione `nome`: le schede lente arrivano dopo il load. */
  function pronta(nome) {
    var t0 = Date.now();
    return (function prova() {
      if (typeof riquadro.contentWindow[nome] === 'function') return Promise.resolve(true);
      if (Date.now() - t0 > 5000) return Promise.resolve(false);
      return attesa(300).then(prova);
    })();
  }
  /** Fine dello storico: la chiusura dell'allevamento se c'è (la BDN non accetta una data oltre la fine attività), se no oggi. */
  function fineStorico(fineAttivita, oggi) {
    var f = pulisci(fineAttivita).split('/');
    if (f.length === 3 && /^\d{2}$/.test(f[0]) && /^\d{2}$/.test(f[1]) && /^\d{4}$/.test(f[2])) return f;
    var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    return [p2(oggi.getDate()), p2(oggi.getMonth() + 1), String(oggi.getFullYear())];
  }
  function storico() {
    return pronta('Stampa').then(function (ok) {
    var w = riquadro.contentWindow;
    if (!ok) return { righe: null, nota: 'la BDN non offre il registro di stalla per questo allevamento' };
    var p = caricamento();
    w.Stampa();
    return p.then(function () { return attesa(PAUSA * 1.5); }).then(function () {
      var w2 = riquadro.contentWindow, d = riquadro.contentDocument, g = d.forms.formPrincipale;
      if (!g || !g.elements.P_DT_INIZIO_ATTIVITA) throw new Error('la pagina del registro non si è aperta');
      var cl = d.getElementById('old_ovi'); if (cl) cl.click();
      var st = d.getElementById('STORICO'); if (st) st.click();
      var ini = pulisci(g.elements.P_DT_INIZIO_ATTIVITA.value).split('/');
      if (ini.length !== 3) ini = ['01', '01', '1920'];
      var fine = fineStorico(g.elements.P_DT_FINE_ATTIVITA ? g.elements.P_DT_FINE_ATTIVITA.value : '', new Date());
      var sel = function (n, v) { var e = g.elements[n]; if (e) { e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); } };
      sel('P_DT_INIZIO_GG', ini[0]); sel('P_DT_INIZIO_MM', ini[1]); sel('P_DT_INIZIO_AA', ini[2]);
      sel('P_DT_FINE_GG', fine[0]); sel('P_DT_FINE_MM', fine[1]); sel('P_DT_FINE_AA', fine[2]);
      var catturato = null;
      w2.open = function () { return { closed: false, focus: function () {}, close: function () {}, document: { write: function () {}, close: function () {} }, location: {} }; };
      w2.alert = function (m) { throw new Error('la BDN avvisa: ' + pulisci(m).slice(0, 120)); };
      w2.HTMLFormElement.prototype.submit = function () { catturato = coppie(this); };
      if (typeof w2.new_window_ascii !== 'function') throw new Error('manca il tasto ASCII del registro');
      w2.new_window_ascii();
      if (!catturato) throw new Error('il registro non è stato chiesto');
      var dest = (catturato.filter(function (x) { return x[0] === 'P_PAGINA'; })[0] || [])[1] || STAMPA;
      return post(dest.charAt(0) === '/' ? dest : STAMPA, catturato);
    }).then(function (h) {
      var p = percorsoTmp(h);
      if (!p) throw new Error('il file del registro non è arrivato');
      return attesa(PAUSA).then(function () { return get(p); });
    }).then(function (t) {
      var righe = t.split(/\r?\n/).filter(Boolean);
      if (righe.length && righe.every(function (r) { return r.length < 538; })) throw new Error('il registro non è nel tracciato ASCII atteso');
      return { righe: righe.length, testo: t };
    });
    });
  }

  var esiti = [], voci = [], avvisi = [];
  formRicerca().then(function (base) {
    var codici = stabilimentiDaInterrogare(cfg), perStab = {};
    fase('Fase 1 di 2 · cerco gli allevamenti di ' + codici.length + ' stabilimenti');
    stato.totale = codici.length;
    return codici.reduce(function (p, c, i) {
      return p.then(function () { msg('Stabilimento ' + (i + 1) + ' di ' + codici.length + ': ' + c + '…'); return allevamentiDiStabilimento(base, c); })
        .then(function (el) { stato.fatti = i + 1; perStab[c] = el; if (!el.length) avvisi.push('stabilimento ' + c + ': nessun allevamento ovicaprino trovato'); })
        .catch(function (e) { perStab[c] = []; avvisi.push('stabilimento ' + c + ': ' + e.message); });
    }, Promise.resolve()).then(function () { return perStab; });
  }).then(function (perStab) {
    var d = daScaricare(cfg, perStab);
    avvisi = avvisi.concat(d.avvisi);
    fase('Fase 2 di 2 · scarico registri storici e marche di ' + d.allevamenti.length + ' allevamenti');
    stato.fatti = 0; stato.totale = d.allevamenti.length; stato.unita = 'allevamenti';
    return d.allevamenti.reduce(function (p, a, i) {
      var e = { codice: a.codice, specie: a.specie, cf: a.cf, chiusura: a.chiusura, motivo: a.motivo };
      esiti.push(e);
      return p.then(function () {
        msg(a.codice + ' ' + a.specie + (a.chiusura ? ' (chiuso)' : '') + ': apro la scheda dell\'allevamento…');
        return carica(B + 'int_allevamenti.pl', imposta(a.formLista.map(function (x) { return x.slice(); }), 'P_RECORD_ID', a.scelta));
      }).then(function () {
        var scheda = riquadro.contentDocument.forms.formPrincipale;
        if (!scheda) throw new Error('la scheda dell\'allevamento non si è aperta');
        msg(a.codice + ' ' + a.specie + ': marche a magazzino…');
        return marche(scheda).then(function (m) {
          e.marche = m.righe;
          if (m.righe) { voci.push({ nome: nomeMarche(a, cfg.timbro), dati: latin1(m.testo) }); arrivato(nomeMarche(a, cfg.timbro), m.righe); }
        }).catch(function (err) { e.errore = 'marche: ' + err.message; })
          .then(function () { msg(a.codice + ' ' + a.specie + ': registro storico (può volerci qualche secondo)…'); return storico(); })
          .then(function (r) { if (r.righe == null) { e.nota = r.nota; return; } e.righeRegistro = r.righe; voci.push({ nome: nomeRegistro(a, cfg.timbro), dati: latin1(r.testo) }); arrivato(nomeRegistro(a, cfg.timbro), r.righe); });
      }).catch(function (err) { e.errore = (e.errore ? e.errore + '; ' : '') + err.message; if (/sessione/.test(err.message)) throw err; })
        .then(function () { stato.fatti = i + 1; ridisegna(); return attesa(PAUSA); });
    }, Promise.resolve());
  }).then(function () {
    fase('Preparo lo zip…');
    voci.push({ nome: 'riepilogo.txt', dati: latin1(riepilogo(cfg, esiti, avvisi)) });
    var blob = new Blob([zip(voci)], { type: 'application/zip' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'bdn_' + cfg.timbro + '.zip';
    document.body.appendChild(a); a.click(); a.remove();
    stato.fine = true; fase('Finito');
    var reg = esiti.filter(function (e) { return e.righeRegistro != null; }).length;
    msg('Fatto: ' + reg + ' registri su ' + esiti.length + ' allevamenti, ' + esiti.filter(function (e) { return e.marche; }).length +
      ' file di marche. Zip bdn_' + cfg.timbro + '.zip scaricato' + (avvisi.length || esiti.some(function (e) { return e.errore; }) ? ': leggi riepilogo.txt.' : '.'));
  }).catch(function (e) {
    stato.fine = true; fase('Interrotto'); msg('Interrotto: ' + e.message);
    q('fase').style.color = '#b00020';
  }).then(function () { clearInterval(orologio); ridisegna(); riquadro.remove();
    q('nota').textContent = 'Chiudi questo riquadro con la × in alto a destra.'; });
})(typeof window !== 'undefined' ? window : this);
