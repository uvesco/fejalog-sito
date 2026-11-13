/* «Crea progetto» del sito (utente, 2026-11-11): file BDN, elenco dei veterinari e scelte nel browser; il dominio Kotlin
   compilato in JS (FejDominio.creaProgetto) fa pacchetto, numerazione ed eventi; qui solo lettura dei file, modulo e
   download. Nessun dato esce dal browser. In Node (prove) si monta con jsdom passando dominio, zip e scarica. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./reti.js'), require('./registro.js'));
  else root.FejCreaProgetto = factory(root.FejReti, root.FejRegistro);
})(typeof self !== 'undefined' ? self : this, function (Reti, Reg) {
'use strict';

/* Byte → carattere, come ISO-8859-1 di Java (la BDN scrive così): identico su JVM e nel browser, senza TextDecoder
   (il cui «iso-8859-1» è in realtà windows-1252). */
function latin1(u8) {
  var s = '';
  for (var i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return s;
}
function uuid(w) {
  if (w && w.crypto && w.crypto.randomUUID) return w.crypto.randomUUID();
  var b = new Array(16);
  for (var i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  var h = b.map(function (x) { return (x < 16 ? '0' : '') + x.toString(16); }).join('');
  return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
}
function isoSenzaMillisecondi(data) { return data.toISOString().replace(/\.\d{3}Z$/, 'Z'); }
function oggi(data) { return data.toISOString().slice(0, 10); }
function eZip(u8) { return u8.length > 4 && u8[0] === 0x50 && u8[1] === 0x4b && u8[2] === 3 && u8[3] === 4; }

/* Riprendere un progetto per cambiarlo (utente, 2026-11-13: reti, veterinari, file della BDN). Il file salvato da questa
   pagina riporta tutto; uno snapshot (o un backup del tablet ancora in configurazione) tutto tranne i file della BDN, che
   non contiene. Un backup col campionamento avviato non si riprende: un progetto in corso si cambia solo sul tablet. */
var FORMATO_SALVATO = 'fejalog-progetto-sito';
function campiCsv(v) { v = String(v == null ? '' : v); return /[;"\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
/** La chiave di una persona come la scrivono le sigle nel registro (SigleVeterinari.normalizzaChiavePersona). */
function chiavePersona(cf) {
  var n = String(cf || '').replace(/\s+/g, '').toUpperCase();
  return n ? 'persona:' + Reg.sha256('fejalog-persona:' + n) : '';
}
function sceltaDaBackup(P) {
  var ev = (P.eventi || []).slice().sort(function (a, b) {
    return (a.lamport || 0) - (b.lamport || 0) || String(a.feed).localeCompare(String(b.feed)) || (a.seq || 0) - (b.seq || 0);
  });
  var avviato = ev.some(function (e) {
    return /^PROVETTA_/.test(e.tipo) || (e.tipo === 'IMPOSTAZIONI_PROGETTO' && e.dati && e.dati.fase_operativa && e.dati.fase_operativa !== 'configurazione');
  });
  if (avviato) return { ok: false, errore: 'In questo backup il campionamento è già stato avviato: un progetto in corso non si cambia sul sito. Reti, veterinari e registri si cambiano sul tablet della Regia.' };
  var imp = {};
  ev.forEach(function (e) { if (e.tipo === 'IMPOSTAZIONI_PROGETTO' && e.dati) Object.keys(e.dati).forEach(function (k) { imp[k] = e.dati[k]; }); });
  var p = P.pacchetto || {}, ops = p.operatori || [], ric = p.ricercati || [], ses = p.sessione || {}, cfg = p.config || {};
  var perPersona = {};
  ops.forEach(function (o) { var k = chiavePersona(o.codice_fiscale); if (k) perPersona[k] = o.id; });
  var sigle = {};
  Object.keys(imp.sigle_veterinari || {}).forEach(function (k) { var id = perPersona[String(k).toLowerCase()]; if (id) sigle[id] = String(imp.sigle_veterinari[k]); });
  var ids = ops.map(function (o) { return o.id; });
  var stab = (cfg.stabilimenti_lavoro || []).map(function (s) { return s.codice; });
  return { ok: true, scelte: {
    file: [], specie_file: {},
    veterinari_csv: ops.length ? 'id;cognome;nome;codice_fiscale\r\n' + ops.map(function (o) { return [o.id, o.cognome, o.nome, o.codice_fiscale].map(campiCsv).join(';'); }).join('\r\n') + '\r\n' : '',
    veterinari_nome: ops.length ? 'elenco del progetto ripreso' : '',
    ricercati_csv: ric.length ? 'codice;nota;azione;segno\r\n' + ric.map(function (r) { return [r.codice, r.nota, r.azione, r.segno].map(campiCsv).join(';'); }).join('\r\n') + '\r\n' : '',
    ricercati_nome: ric.length ? 'ricercati del progetto ripreso' : '',
    stabilimenti: stab, principale: stab[0] || '', descrizione: ses.descrizione || '', data: ses.data || '',
    eta_mesi: typeof imp.eta_diagnostica_mesi === 'number' ? imp.eta_diagnostica_mesi : 6, lettere: imp.lettere_specie || '',
    problematici_in_sequenza: imp.problematici_in_sequenza !== false, verso: imp.verso_riempimento === 'basso_alto' ? 'basso_alto' : 'alto_basso',
    sigle: sigle, priorita: String(imp.priorita_regia || '').split(',').map(function (x) { return x.trim(); }).filter(function (x) { return ids.indexOf(x) >= 0; }),
    reti: Reti.daEventi(ev), cerchietto_principale: typeof imp.cerchietto_principale === 'boolean' ? imp.cerchietto_principale : null
  }, riferimento: { id: p.id || '', creato_il: p.creato_il || '', impronta: P.verifica && P.verifica.impronta || '', numerazione_csv: P.numerazioneCsv || '' } };
}
/** Le righe della chiave della numerazione cambiate o aggiunte e quelle tolte, rispetto al progetto ripreso. */
function confrontaNumerazione(prima, ora) {
  var righe = function (t) { return String(t || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter(function (r) { return r.trim(); }); };
  var conta = {}, nuove = 0, tolte = 0;
  righe(prima).forEach(function (r) { conta[r] = (conta[r] || 0) + 1; });
  righe(ora).forEach(function (r) { if (conta[r]) conta[r]--; else nuove++; });
  Object.keys(conta).forEach(function (k) { tolte += conta[k]; });
  return { uguale: !nuove && !tolte, nuove: nuove, tolte: tolte };
}

function monta(radice, deps) {
  var d = radice.ownerDocument, w = deps.finestra || d.defaultView;
  var Dominio = deps.dominio, Zip = deps.zip, Progetto = deps.progetto || w.FejProgetto;
  var adesso = deps.adesso ? deps.adesso() : new Date();
  var stato = {
    file: [], specieFile: {}, veterinariCsv: '', veterinariNome: '', ricercatiCsv: '', ricercatiNome: '',
    stabilimenti: null, principale: '', descrizione: '', data: oggi(adesso), etaMesi: 6, lettere: '',
    problematiciInSequenza: true, verso: 'alto_basso', sigle: {}, priorita: [], reti: [], regole: {}, cerchiettoPrincipale: null,
    id: deps.id || uuid(w), creatoIl: deps.creatoIl || isoSenzaMillisecondi(adesso), messaggio: '', esito: null, occupato: false,
    // il progetto ripreso: la sua identità (cambia se cambia il contenuto) e la chiave della numerazione già stampata
    riferimento: null, numerazioneRipresa: '', ripresoDa: '', avvisoIdentita: ''
  };
  var codiciVisti = '', veterinariVisti = '';

  function h(tag, attrs) {
    var e = d.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? '' : String(attrs[k]));
    });
    Array.prototype.slice.call(arguments, 2).forEach(function (x) {
      (Array.isArray(x) ? x : [x]).forEach(function (v) { if (v != null) e.appendChild(typeof v === 'object' ? v : d.createTextNode(String(v))); });
    });
    return e;
  }
  function bottone(testo, azione, attrs) { return h('button', Object.assign({ type: 'button', onclick: azione }, attrs || {}), testo); }
  function campo(testo, valore, tipo, attrs) {
    var input = h('input', Object.assign({ type: tipo || 'text', value: valore == null ? '' : valore }, attrs || {}));
    return { input: input, label: h('label', null, testo + ' ', input) };
  }
  function scelta(testo, opzioni, valore, attrs) {
    var select = h('select', attrs || {});
    opzioni.forEach(function (o) { select.appendChild(h('option', { value: o[0], selected: String(o[0]) === String(valore) }, o[1])); });
    return { input: select, label: h('label', null, testo + ' ', select) };
  }
  var retiInCsv = Reti.inCsv, retiDaCsv = Reti.daCsv;
  function scarica(nome, dati, mime) {
    if (deps.scarica) return deps.scarica(nome, dati, mime);
    var url = w.URL.createObjectURL(new w.Blob([dati], { type: mime }));
    var a = h('a', { href: url, download: nome }); d.body.appendChild(a); a.click(); a.remove();
    w.setTimeout(function () { w.URL.revokeObjectURL(url); }, 30000);
  }
  function leggiBytes(file) {
    return new Promise(function (resolve, reject) {
      var r = new w.FileReader();
      r.onerror = function () { reject(new Error('Non riesco a leggere ' + file.name + '.')); };
      r.onload = function () { resolve(new Uint8Array(r.result)); };
      r.readAsArrayBuffer(file);
    });
  }
  function leggiTesto(file) {
    return new Promise(function (resolve, reject) {
      var r = new w.FileReader();
      r.onerror = function () { reject(new Error('Non riesco a leggere ' + file.name + '.')); };
      r.onload = function () { resolve(String(r.result)); };
      r.readAsText(file, 'UTF-8');
    });
  }
  /* Un file scelto: uno della BDN, o uno zip con dentro i file della BDN (come sul tablet). */
  function fileBdnDa(nome, u8, profondita) {
    if (!eZip(u8)) return Promise.resolve([{ nome: nome, contenuto: latin1(u8) }]);
    if (profondita > 1) return Promise.resolve([]);
    return Zip.leggi(u8).then(function (voci) {
      var lavori = Object.keys(voci).sort().filter(function (n) {
        var base = n.replace(/^.*\//, '');
        // il riepilogo.txt degli snippet BDN e ARVET non è un file della BDN: non si carica mai (utente, 2026-11-12)
        return base && base.charAt(0) !== '.' && n.indexOf('__MACOSX') < 0 && base.toLowerCase() !== 'riepilogo.txt';
      }).map(function (n) { return fileBdnDa(nome + ' › ' + n.replace(/^.*\//, ''), voci[n], (profondita || 0) + 1); });
      return Promise.all(lavori).then(function (liste) { return [].concat.apply([], liste); });
    });
  }

  function ingresso() {
    var sigle = {};
    Object.keys(stato.sigle).forEach(function (k) { if (String(stato.sigle[k]).trim()) sigle[k] = String(stato.sigle[k]).trim().toUpperCase(); });
    return {
      file: stato.file, specie_file: stato.specieFile, veterinari_csv: stato.veterinariCsv, ricercati_csv: stato.ricercatiCsv,
      id: stato.id, creato_il: stato.creatoIl, data: stato.data, descrizione: stato.descrizione,
      stabilimenti: stato.stabilimenti || [], principale: stato.principale,
      eta_mesi: stato.etaMesi, lettere_specie: stato.lettere, problematici_in_sequenza: stato.problematiciInSequenza,
      verso_riempimento: stato.verso, sigle: sigle, priorita_regia: stato.priorita,
      reti: stato.reti.filter(function (r) { return r.ssid.trim(); }), regole: stato.regole,
      cerchietto_principale: stato.cerchiettoPrincipale === null ? undefined : stato.cerchiettoPrincipale
    };
  }
  function calcola() {
    try { stato.esito = Dominio.creaProgetto(ingresso()); }
    catch (e) { stato.esito = { ok: false, errori: ['Errore nel calcolo: ' + (e && e.message ? e.message : e)], avvisi: [], file: [], codici: [], veterinari: [], tipologie: [] }; }
  }
  var attesa = null;
  function ricalcola(subito) {
    if (attesa) w.clearTimeout(attesa);
    if (subito) { calcola(); aggiorna(); return; }
    attesa = w.setTimeout(function () { attesa = null; calcola(); aggiorna(); }, 150);
  }

  /* ---- sezioni ---- */
  var sez = {};
  function sezione(id, titolo) {
    var s = h('section', { id: 'crea-' + id, class: 'fej-riga' }, h('h2', null, titolo));
    var corpo = h('div', { class: 'fej-form' }); s.appendChild(corpo); sez[id] = corpo; return s;
  }
  function svuota(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function renderFile() {
    var c = sez.file; svuota(c);
    var input = h('input', { type: 'file', multiple: true, accept: '.txt,.zip,text/plain,application/zip' });
    input.addEventListener('change', function () {
      var scelti = Array.prototype.slice.call(input.files || []);
      if (!scelti.length) return;
      stato.occupato = true; stato.messaggio = 'Leggo i file…'; aggiorna();
      Promise.all(scelti.map(function (f) { return leggiBytes(f).then(function (u8) { return fileBdnDa(f.name, u8, 0); }); }))
        .then(function (liste) {
          [].concat.apply([], liste).forEach(function (f) {
            if (!stato.file.some(function (g) { return g.nome === f.nome; })) stato.file.push(f);
          });
          stato.messaggio = '';
        }, function (e) { stato.messaggio = e.message; })
        .then(function () { stato.occupato = false; input.value = ''; calcola(); aggiorna(); renderFile(); });
    });
    c.appendChild(h('p', null, h('label', null, 'Registri di stalla e contrassegni (anche uno zip) ', input)));
    var e = stato.esito;
    if (e && e.file && e.file.length) {
      var ul = h('ul');
      e.file.forEach(function (f) {
        var li = h('li', null, f.nome + ' · ' + (f.tipo === 'registro' ? 'registro' : f.tipo === 'marche' ? 'contrassegni' : 'non riconosciuto') +
          (f.specie ? ' · ' + (f.specie === 'entrambe' ? 'pecore e capre' : f.specie) : '') + (f.codici.length ? ' · ' + f.codici.join(', ') : '') + (f.tipo !== 'sconosciuto' ? ' · ' + f.capi + ' righe' : '') + ' ');
        if (f.tipo === 'marche' && !f.specie) {
          var sp = scelta('Specie', [['', 'Da scegliere'], ['entrambe', 'Ambedue'], ['pecore', 'Pecore'], ['capre', 'Capre']], stato.specieFile[f.nome] || '');
          sp.input.addEventListener('change', function () { stato.specieFile[f.nome] = sp.input.value; ricalcola(true); renderFile(); });
          li.appendChild(sp.label); li.appendChild(d.createTextNode(' '));
        }
        li.appendChild(bottone('Togli', function () {
          stato.file = stato.file.filter(function (g) { return g.nome !== f.nome; }); delete stato.specieFile[f.nome];
          if (stato.stabilimenti) stato.stabilimenti = null;
          ricalcola(true); renderFile();
        }));
        ul.appendChild(li);
      });
      c.appendChild(ul);
      c.appendChild(h('p', null, bottone('Svuota i file', function () { stato.file = []; stato.specieFile = {}; stato.stabilimenti = null; ricalcola(true); renderFile(); })));
    } else c.appendChild(h('p', { class: 'fej-tenue' }, 'Fejalog riconosce i file dal contenuto: registri di stalla (ASCII a 538 colonne) e contrassegni disponibili, di pecore e capre.'));
  }

  /* ---- 0 · riprendere un progetto salvato o uno snapshot ---- */
  function scelteCorrenti() {
    return {
      file: stato.file, specie_file: stato.specieFile, veterinari_csv: stato.veterinariCsv, veterinari_nome: stato.veterinariNome,
      ricercati_csv: stato.ricercatiCsv, ricercati_nome: stato.ricercatiNome, stabilimenti: stato.stabilimenti || [], principale: stato.principale,
      descrizione: stato.descrizione, data: stato.data, eta_mesi: stato.etaMesi, lettere: stato.lettere, problematici_in_sequenza: stato.problematiciInSequenza,
      verso: stato.verso, sigle: stato.sigle, priorita: stato.priorita, reti: stato.reti, cerchietto_principale: stato.cerchiettoPrincipale
    };
  }
  function riprendi(sc, rif, nome) {
    Object.assign(stato, {
      file: (sc.file || []).map(function (f) { return { nome: String(f.nome), contenuto: String(f.contenuto) }; }), specieFile: sc.specie_file || {},
      veterinariCsv: sc.veterinari_csv || '', veterinariNome: sc.veterinari_csv ? sc.veterinari_nome || 'elenco del progetto ripreso' : '',
      ricercatiCsv: sc.ricercati_csv || '', ricercatiNome: sc.ricercati_csv ? sc.ricercati_nome || 'ricercati del progetto ripreso' : '',
      stabilimenti: sc.stabilimenti && sc.stabilimenti.length ? sc.stabilimenti.slice() : null, principale: sc.principale || '',
      descrizione: sc.descrizione || '', data: sc.data || stato.data, etaMesi: typeof sc.eta_mesi === 'number' ? sc.eta_mesi : 6, lettere: sc.lettere || '',
      problematiciInSequenza: sc.problematici_in_sequenza !== false, verso: sc.verso === 'basso_alto' ? 'basso_alto' : 'alto_basso',
      sigle: Object.assign({}, sc.sigle || {}), priorita: (sc.priorita || []).slice(),
      reti: (sc.reti || []).map(function (r) { return { ssid: String(r.ssid || ''), password: String(r.password || ''), note: String(r.note || ''), sicurezza: Reti.SICUREZZE[r.sicurezza] ? r.sicurezza : 'WPA' }; }),
      regole: {}, cerchiettoPrincipale: typeof sc.cerchietto_principale === 'boolean' ? sc.cerchietto_principale : null,
      id: rif.id || uuid(w), creatoIl: rif.creato_il || stato.creatoIl, esito: null,
      riferimento: rif.impronta ? { impronta: rif.impronta } : null, numerazioneRipresa: rif.numerazione_csv || '', ripresoDa: nome, avvisoIdentita: ''
    });
    codiciVisti = veterinariVisti = '';
    calcola(); aggiorna(); renderFile(); renderElenco(); renderRicercati(); renderRiprendi();
  }
  function renderRiprendi() {
    var c = sez.riprendi; svuota(c);
    var input = h('input', { type: 'file', accept: '.json,.zip,application/json,application/zip' });
    input.addEventListener('change', function () {
      var f = input.files && input.files[0]; if (!f) return;
      stato.occupato = true; stato.messaggio = 'Leggo ' + f.name + '…'; aggiornaMessaggio();
      leggiBytes(f).then(function (u8) {
        if (eZip(u8)) {
          if (!Progetto) throw new Error('Non riesco a leggere gli snapshot in questa pagina.');
          return Progetto.leggiBackup(u8).then(function (P) {
            if (!P.verifica.ok) throw new Error('Lo zip non è un backup integro di Fejalog: ' + (P.verifica.errori || []).join('; '));
            var r = sceltaDaBackup(P);
            if (!r.ok) throw new Error(r.errore);
            riprendi(r.scelte, r.riferimento, f.name);
            stato.messaggio = 'Ripreso da ' + f.name + ': veterinari, ricercati, stabilimenti, regole, sigle, priorità e reti. Lo snapshot non contiene i file della BDN: ricaricali al passo 1 (con gli stessi file la numerazione resta identica).';
          });
        }
        return leggiTesto(f).then(function (t) {
          var o;
          try { o = JSON.parse(String(t).replace(/^\uFEFF/, '')); } catch (e) { throw new Error(f.name + ' non è un progetto salvato da questa pagina (né JSON né zip).'); }
          if (!o || o.formato !== FORMATO_SALVATO || !o.scelte) throw new Error(f.name + ' non è un progetto salvato da «Crea il progetto».');
          if (o.versione !== 1) throw new Error('Il progetto salvato è di una versione più nuova della pagina: ricarica la pagina.');
          riprendi(o.scelte, o.riferimento || {}, f.name);
          stato.messaggio = 'Ripreso da ' + f.name + ', con i file della BDN: cambia ciò che serve e scarica di nuovo lo snapshot.';
        });
      }).then(null, function (e) { stato.messaggio = e && e.message ? e.message : String(e); })
        .then(function () { stato.occupato = false; input.value = ''; aggiornaMessaggio(); });
    });
    c.appendChild(h('p', null, h('label', null, 'Progetto salvato (JSON) o snapshot per la Regia (zip) ', input)));
    if (stato.ripresoDa) c.appendChild(h('p', null, 'Ripreso da ' + stato.ripresoDa + '. ', bottone('Togli e ricomincia da capo', ricomincia)));
    c.appendChild(h('p', { class: 'fej-tenue' }, 'Per cambiare un progetto già preparato (reti, veterinari, scelte, file della BDN): il file salvato al passo 9 riporta tutto, file della BDN compresi; lo snapshot riporta tutto tranne i file della BDN, da ricaricare al passo 1. Un backup del tablet col campionamento già avviato non si riprende qui.'));
  }

  function renderElenco() {
    var c = sez.elenco; svuota(c);
    var vet = h('input', { type: 'file', accept: '.csv,.txt,text/csv,text/plain' });
    vet.addEventListener('change', function () {
      var f = vet.files && vet.files[0]; if (!f) return;
      leggiTesto(f).then(function (t) { stato.veterinariCsv = t; stato.veterinariNome = f.name; stato.sigle = {}; stato.priorita = []; }, function (e) { stato.messaggio = e.message; })
        .then(function () { vet.value = ''; ricalcola(true); renderElenco(); });
    });
    var e = stato.esito || {};
    c.appendChild(h('p', null, h('label', null, 'Elenco dei veterinari (CSV id;cognome;nome;codice_fiscale) ', vet), ' ',
      stato.veterinariNome ? stato.veterinariNome + ': ' + (e.veterinari || []).length + ' veterinari' + (e.veterinari_scartati ? ', ' + e.veterinari_scartati + ' righe ignorate' : '') : 'nessuno: in campo ognuno si aggiunge a mano',
      stato.veterinariNome ? [' ', bottone('Togli', function () { stato.veterinariCsv = ''; stato.veterinariNome = ''; stato.sigle = {}; stato.priorita = []; ricalcola(true); renderElenco(); })] : null));
    c.appendChild(h('p', { class: 'fej-tenue' }, 'L’elenco entra nel pacchetto del progetto, mai nel registro: il codice fiscale non va sulle provette né nei file di campo.'));
  }

  // i capi ricercati, separati dall'elenco dei veterinari (utente, 2026-11-12)
  function renderRicercati() {
    var c = sez.ricercati; svuota(c);
    var ric = h('input', { type: 'file', accept: '.csv,.txt,text/csv,text/plain' });
    ric.addEventListener('change', function () {
      var f = ric.files && ric.files[0]; if (!f) return;
      leggiTesto(f).then(function (t) { stato.ricercatiCsv = t; stato.ricercatiNome = f.name; }, function (e) { stato.messaggio = e.message; })
        .then(function () { ric.value = ''; ricalcola(true); renderRicercati(); });
    });
    c.appendChild(h('p', null, h('label', null, 'Capi ricercati (CSV codice;nota;azione;segno) ', ric), ' ',
      stato.ricercatiNome ? [stato.ricercatiNome, ' ', bottone('Togli', function () { stato.ricercatiCsv = ''; stato.ricercatiNome = ''; ricalcola(true); renderRicercati(); })] : 'nessuno'));
    c.appendChild(h('p', { class: 'fej-tenue' }, 'Facoltativo: i capi da cercare in campo (marcare col segno, isolare), col motivo e cosa fare. La Regia ne aggiunge altri anche durante il lavoro.'));
  }

  function renderStabilimenti() {
    var c = sez.stabilimenti; svuota(c);
    var e = stato.esito || {}, codici = e.codici || [];
    if (!codici.length) { c.appendChild(h('p', { class: 'fej-tenue' }, 'Gli stabilimenti compaiono dopo i registri.')); return; }
    var scelti = stato.stabilimenti || (e.piu_popoloso ? [e.piu_popoloso] : []);
    var principale = stato.principale || scelti[0] || '';
    c.appendChild(h('p', null, 'Stabilimenti di lavoro (con più stabilimenti ogni provetta porta la lettera cerchiata del suo stabilimento):'));
    codici.forEach(function (s) {
      var sel = scelti.indexOf(s.codice) >= 0;
      var cb = h('input', { type: 'checkbox', checked: sel, name: 'stab', value: s.codice });
      cb.addEventListener('change', function () {
        var lista = (stato.stabilimenti || scelti).slice();
        if (cb.checked) { if (lista.indexOf(s.codice) < 0) lista.push(s.codice); } else lista = lista.filter(function (x) { return x !== s.codice; });
        stato.stabilimenti = lista; if (stato.principale && lista.indexOf(stato.principale) < 0) stato.principale = '';
        ricalcola(true); renderStabilimenti();
      });
      var rb = h('input', { type: 'radio', name: 'principale', value: s.codice, checked: sel && principale === s.codice, disabled: !sel });
      rb.addEventListener('change', function () { stato.principale = s.codice; ricalcola(true); renderStabilimenti(); });
      c.appendChild(h('p', null, h('label', null, cb, ' ', s.codice, s.denominazione ? ' · ' + s.denominazione : '', ' · ', s.pecore + ' pecore, ' + s.capre + ' capre presenti'),
        ' ', h('label', { class: 'fej-tenue' }, rb, ' principale')));
    });
    var descr = campo('Descrizione del progetto', stato.descrizione, 'text', { maxlength: 120 });
    descr.input.addEventListener('input', function () { stato.descrizione = descr.input.value; ricalcola(); });
    var data = campo('Data (AAAA-MM-GG)', stato.data, 'text', { maxlength: 10 });
    data.input.addEventListener('input', function () { stato.data = data.input.value.trim(); ricalcola(); });
    c.appendChild(h('p', null, descr.label)); c.appendChild(h('p', null, data.label));
  }

  function renderScelte() {
    var c = sez.scelte; svuota(c);
    var e = stato.esito || {};
    // con più stabilimenti: la lettera cerchiata anche sul principale, sì o no (utente, 2026-11-12)
    if ((e.stabilimenti || []).length > 1) {
      var princ = e.stabilimenti.filter(function (x) { return x.principale; })[0];
      var conLettera = stato.cerchiettoPrincipale === null ? !!(princ && princ.cerchietto) : stato.cerchiettoPrincipale;
      var lp = h('p', null, 'Lettera dello stabilimento anche sul principale' + (princ ? ' (' + princ.codice + ')' : '') + ': ');
      [[true, 'Sì'], [false, 'No']].forEach(function (o) {
        var r = h('input', { type: 'radio', name: 'lettera-principale', value: o[0] ? 'si' : 'no', checked: conLettera === o[0] });
        r.addEventListener('change', function () { stato.cerchiettoPrincipale = o[0]; ricalcola(true); });
        lp.appendChild(h('label', null, r, ' ' + o[1], ' '));
      });
      lp.appendChild(h('span', { class: 'fej-tenue' }, conLettera ? 'tutte le provette hanno la lettera cerchiata' : 'le provette del principale senza lettera, gli altri con la loro'));
      c.appendChild(lp);
    }
    var eta = h('p', null, 'Età diagnostica (profilo di rischio dello stabilimento): ');
    [[6, '6 mesi (vagante / rischio)'], [12, '12 mesi (stanziale)'], [0, 'tutti i presenti']].forEach(function (o) {
      var r = h('input', { type: 'radio', name: 'eta', value: o[0], checked: stato.etaMesi === o[0] });
      r.addEventListener('change', function () { stato.etaMesi = o[0]; ricalcola(true); });
      eta.appendChild(h('label', null, r, ' ' + o[1], ' '));
    });
    c.appendChild(eta);
    var opz = [['', 'Specie meno numerosa (predefinita' + (e.lettere_predefinite ? ': ' + (e.lettere_predefinite === 'solo_c' ? 'C sulle capre' : 'P sulle pecore') : '') + ')'],
      ['solo_c', 'Solo capre (C)'], ['solo_p', 'Solo pecore (P)'], ['entrambe', 'Ambedue (C e P)']];
    if (!e.due_specie) opz.push(['nessuna', 'Nessuna']);
    var lett = scelta('Lettera di specie', opz, stato.lettere);
    lett.input.addEventListener('change', function () { stato.lettere = lett.input.value; ricalcola(true); });
    c.appendChild(h('p', null, lett.label));
    var seq = h('input', { type: 'checkbox', checked: stato.problematiciInSequenza });
    seq.addEventListener('change', function () { stato.problematiciInSequenza = seq.checked; ricalcola(true); });
    c.appendChild(h('p', null, h('label', null, seq, ' Fuori registro in una sola sequenza (un plateau dei fuori registro sul tavolo alla volta)')));
    c.appendChild(h('p', { class: 'fej-tenue' }, 'Queste scelte si scrivono prima dei registri: fissano la numerazione (i capi fuori età non si numerano). Sul tablet si congelano all’avvio del campionamento.'));
  }

  function renderConfigurazione() {
    var c = sez.configurazione; svuota(c);
    var e = stato.esito || {};
    var verso = scelta('Verso di riempimento dei plateau', [['alto_basso', 'Dall’alto verso il basso (predefinito)'], ['basso_alto', 'Dal basso verso l’alto']], stato.verso);
    verso.input.addEventListener('change', function () { stato.verso = verso.input.value; ricalcola(); });
    c.appendChild(h('p', null, verso.label));
    // sigle e priorità, dall'elenco dei veterinari
    var vets = e.veterinari || [];
    var box = h('div', { id: 'crea-veterinari' });
    if (!vets.length) box.appendChild(h('p', { class: 'fej-tenue' }, 'Sigle e priorità della regia si scelgono dall’elenco dei veterinari (sezione 2); senza elenco la Regia le assegna in campo.'));
    else {
      box.appendChild(h('h3', null, 'Sigle dei veterinari (due lettere, mai confondibili)'));
      vets.forEach(function (v) {
        var s = campo(v.nome + ' (' + v.id + ')', stato.sigle[v.id] || '', 'text', { maxlength: 2, placeholder: v.proposta, size: 3, 'data-vet': v.id });
        s.input.addEventListener('input', function () { stato.sigle[v.id] = s.input.value.toUpperCase(); ricalcola(); });
        box.appendChild(h('p', null, s.label, ' ', h('span', { class: 'fej-tenue', 'data-proposta': v.id }, 'vuota: la Regia assegna ' + v.proposta)));
      });
      box.appendChild(h('h3', null, 'Priorità per la regia d’emergenza'));
      var lista = h('ol');
      stato.priorita.forEach(function (id, i) {
        var v = vets.filter(function (x) { return x.id === id; })[0];
        lista.appendChild(h('li', null, (v ? v.nome : id) + ' ', bottone('Su', function () { if (i > 0) { stato.priorita.splice(i - 1, 0, stato.priorita.splice(i, 1)[0]); ricalcola(true); renderConfigurazione(); } }, { disabled: i === 0 }), ' ',
          bottone('Togli', function () { stato.priorita.splice(i, 1); ricalcola(true); renderConfigurazione(); })));
      });
      box.appendChild(lista);
      var liberi = vets.filter(function (v) { return stato.priorita.indexOf(v.id) < 0; });
      if (liberi.length) {
        var agg = scelta('Aggiungi', [['', '—']].concat(liberi.map(function (v) { return [v.id, v.nome]; })), '');
        agg.input.addEventListener('change', function () { if (agg.input.value) { stato.priorita.push(agg.input.value); ricalcola(true); renderConfigurazione(); } });
        box.appendChild(h('p', null, agg.label, ' ', h('span', { class: 'fej-tenue' }, 'il primo è di solito il telefono del coordinatore; esauriti questi vale il criterio automatico')));
      }
    }
    c.appendChild(box);
    // reti del progetto
    c.appendChild(h('h3', null, 'Reti Wi-Fi del progetto'));
    c.appendChild(h('p', { class: 'fej-tenue' }, 'I nomi delle reti (router da viaggio, hotspot del tablet) da salvare sui device prima del lavoro. La password è facoltativa: se la lasci vuota non finisce nel file e la Regia la scrive sul tablet.'));
    stato.reti.forEach(function (r, i) {
      var ssid = campo('Nome (SSID)', r.ssid, 'text', { maxlength: 32 });
      ssid.input.addEventListener('input', function () { r.ssid = ssid.input.value; ricalcola(); });
      var sic = scelta('Sicurezza', [['WPA', 'WPA2'], ['SAE', 'WPA3'], ['APERTA', 'aperta']], r.sicurezza);
      sic.input.addEventListener('change', function () { r.sicurezza = sic.input.value; ricalcola(); });
      var pw = campo('Password', r.password, 'password', { maxlength: 63, autocomplete: 'off' });
      pw.input.addEventListener('input', function () { r.password = pw.input.value; ricalcola(); });
      c.appendChild(h('p', null, ssid.label, ' ', sic.label, ' ', pw.label, ' ', bottone('Togli', function () { stato.reti.splice(i, 1); ricalcola(true); renderConfigurazione(); })));
    });
    var csvReti = h('input', { type: 'file', accept: '.csv,.txt,text/csv,text/plain' });
    csvReti.addEventListener('change', function () {
      var f = csvReti.files && csvReti.files[0]; if (!f) return;
      leggiTesto(f).then(function (t) {
        var lette = retiDaCsv(t);
        lette.forEach(function (r) {
          var i = stato.reti.findIndex(function (x) { return x.ssid === r.ssid; });
          if (i >= 0) stato.reti[i] = r; else stato.reti.push(r);
        });
        stato.messaggio = lette.length ? 'Reti caricate dal CSV: ' + lette.length + '.' : 'Nel CSV non ci sono reti (serve almeno la colonna SSID).';
      }, function (e) { stato.messaggio = e.message; }).then(function () { csvReti.value = ''; ricalcola(true); renderConfigurazione(); });
    });
    c.appendChild(h('p', null, bottone('Aggiungi una rete', function () { stato.reti.push({ ssid: '', password: '', sicurezza: 'WPA' }); renderConfigurazione(); }), ' ',
      h('label', null, 'oppure caricale da un CSV ', csvReti), ' ',
      bottone('Esporta le reti (CSV)', function () {
        if (!stato.reti.some(function (r) { return r.ssid.trim(); })) { stato.messaggio = 'Nessuna rete da esportare: scrivine almeno una.'; aggiorna(); return; }
        scarica('reti_progetto.csv', '\uFEFF' + retiInCsv(stato.reti), 'text/csv;charset=utf-8');
      })));
    c.appendChild(h('p', { class: 'fej-tenue' }, 'Scrivi le reti la prima volta ed esportale: negli altri progetti sulle stesse reti si ricaricano dal CSV. Colonne SSID;password;note;sicurezza (WPA2, WPA3 o aperta): lo stesso reti.csv delle reti salvate dell’app, con la sicurezza in più. Il file contiene le password: tienilo per te.'));
    // niente regole dei problematici: tutti in coda, ARVET a mano (utente, 2026-11-12: «non è accettabile eliminare
    // sistematicamente dei campioni di sangue»); la singola provetta si decide in sistemazione
    c.appendChild(h('p', { class: 'fej-tenue' }, 'Le provette fuori registro vanno tutte in coda, ARVET a mano: in sistemazione si decide provetta per provetta, anche l’eliminazione di una singola provetta.'));
  }

  function renderAnteprima() {
    var c = sez.anteprima; svuota(c);
    var e = stato.esito;
    if (!e) { c.appendChild(h('p', null, 'Carica i registri per vedere la numerazione.')); return; }
    (e.errori || []).forEach(function (t) { c.appendChild(h('p', { class: 'fej-errore', role: 'alert' }, t)); });
    (e.avvisi || []).forEach(function (t) { c.appendChild(h('p', { class: 'fej-avviso' }, t)); });
    if (!e.ok) { if (!(e.errori || []).length) c.appendChild(h('p', null, 'Completa le scelte.')); return; }
    var r = e.riepilogo, p = e.pacchetto;
    c.appendChild(h('p', null, h('strong', null, 'Progetto ' + p.nome + (p.descrizione ? ' · ' + p.descrizione : '')), ' · codice di creazione ' + p.codice_creazione +
      ' · ' + p.veterinari + ' veterinari nel pacchetto' + (p.ricercati ? ' · ' + p.ricercati + ' ricercati' : '')));
    c.appendChild(h('p', null, r.presenti_pecore + ' pecore e ' + r.presenti_capre + ' capre presenti · ' + r.numerati + ' capi numerati (' + r.maschi + ' maschi in testa) · ' +
      r.fuori_eta + ' fuori età diagnostica (senza numero: fuori registro se prelevati) · ' + (r.usciti_pecore + r.usciti_capre) + ' usciti · ' + (r.marche_pecore + r.marche_capre) + ' marche disponibili' +
      (r.altri_stabilimenti ? ' · ' + r.altri_stabilimenti + ' capi di altri stabilimenti nei registri' : '')));
    var tab = h('table', { class: 'fej-tabella-scorre' }, h('thead', null, h('tr', null, ['Stabilimento', 'Specie', 'Prefisso', 'Presenti', 'Numerati', 'Maschi', 'Numeri', 'Fuori età'].map(function (t) { return h('th', null, t); }))));
    var tb = h('tbody');
    e.serie.forEach(function (s) {
      tb.appendChild(h('tr', null, [s.stabilimento, s.specie, s.prefisso || '—', s.presenti, s.numerati, s.maschi, s.numerati ? s.da + '–' + s.a : '—', s.fuori_eta].map(function (t) { return h('td', null, String(t)); })));
    });
    tab.appendChild(tb); c.appendChild(tab);
    c.appendChild(h('p', null, e.stabilimenti.map(function (s) { return (s.principale ? 'Principale ' : 'Secondario ') + s.codice + (s.lettera ? ' (lettera ' + s.lettera + ' ' + s.cerchietto + ')' : '') + (s.denominazione ? ' · ' + s.denominazione : ''); }).join(' · ')));
    var imp = e.impostazioni;
    c.appendChild(h('p', null, 'Età ' + (imp.eta_diagnostica_mesi === 0 ? 'tutti i presenti' : imp.eta_diagnostica_mesi + ' mesi') + ' · lettere di specie «' + imp.lettere_specie + '» · verso ' + imp.verso_riempimento +
      ' · sigle: ' + (Object.keys(imp.sigle).length || 'automatiche') + ' · priorità regia: ' + (imp.priorita_regia.length ? imp.priorita_regia.join(', ') : 'nessuna') +
      ' · reti: ' + (imp.reti.length ? imp.reti.join(', ') : 'nessuna') + ' · ' + e.eventi + ' eventi · pronto per l’avvio: ' + (imp.pronto_per_avvio ? 'sì' : 'no')));
    c.appendChild(h('p', null, bottone('Scarica la tabella della numerazione (numerazione_chiave.csv)', function () { scarica('numerazione_chiave.csv', e.numerazione_csv, 'text/csv;charset=utf-8'); })));
    // le stampe già fatte (foglio A3, 2/33) sono la seconda copia fisica: si dice subito se valgono ancora
    if (stato.numerazioneRipresa) {
      var cf = confrontaNumerazione(stato.numerazioneRipresa, e.numerazione_csv);
      c.appendChild(cf.uguale
        ? h('p', { class: 'fej-ok', id: 'crea-confronto' }, 'Numerazione identica a quella del progetto ripreso: il foglio A3 e i 2/33 già stampati restano validi.')
        : h('p', { class: 'fej-avviso', role: 'alert', id: 'crea-confronto' }, 'La numerazione è cambiata rispetto al progetto ripreso (' + cf.nuove + ' righe della chiave nuove o cambiate, ' + cf.tolte + ' tolte): ristampa il foglio A3 e i 2/33 e butta quelli vecchi.'));
    }
  }

  /* Un progetto cambiato dopo uno snapshot già scaricato (o ripreso) prende un codice di creazione nuovo: sul tablet non
     esistono mai due progetti diversi con lo stesso codice. Con le stesse scelte e gli stessi file resta quello di prima. */
  function fissaIdentita() {
    var e = stato.esito;
    if (!e || !e.ok) return null;
    if (stato.riferimento && stato.riferimento.impronta !== e.impronta) {
      stato.id = uuid(w); stato.creatoIl = isoSenzaMillisecondi(deps.adesso ? deps.adesso() : new Date());
      calcola(); e = stato.esito;
      if (!e.ok) return null;
      stato.avvisoIdentita = 'Progetto cambiato rispetto allo snapshot di prima: ha un codice di creazione nuovo (' + e.pacchetto.codice_creazione + '). Sul tablet apri questo snapshot; quello vecchio, se l’avevi già aperto, non usarlo più.';
      aggiorna();
    }
    stato.riferimento = { impronta: e.impronta };
    return e;
  }
  function salvaProgetto() {
    var e = stato.esito && stato.esito.ok ? fissaIdentita() : null;
    var nome = e ? e.nome_file.replace(/^fejalog_backup_/, 'fejalog_progetto_').replace(/_sito_R\.zip$/, '.json') : 'fejalog_progetto_bozza_' + stato.data + '.json';
    var o = { formato: FORMATO_SALVATO, versione: 1, salvato_il: isoSenzaMillisecondi(deps.adesso ? deps.adesso() : new Date()),
      nota: 'Da riaprire in «Crea il progetto» sul sito di Fejalog. Contiene i file della BDN, l’elenco dei veterinari coi codici fiscali e le password delle reti: tienilo per te.',
      scelte: scelteCorrenti(),
      riferimento: { id: stato.id, creato_il: stato.creatoIl, impronta: e ? e.impronta : (stato.riferimento ? stato.riferimento.impronta : ''),
        numerazione_csv: e ? e.numerazione_csv : stato.numerazioneRipresa } };
    scarica(nome, JSON.stringify(o), 'application/json');
    stato.messaggio = 'Progetto salvato: ' + nome + '. Per cambiarlo, riprendilo al passo 0.'; aggiornaMessaggio();
  }

  function renderSnapshot() {
    var c = sez.snapshot; svuota(c);
    var e = stato.esito, ok = !!(e && e.ok);
    c.appendChild(h('p', null, bottone('Scarica lo snapshot per la Regia (zip)', function () {
      var x = fissaIdentita();
      if (!x) return;
      var files = Object.keys(x.files).sort().map(function (n) { return { name: n, data: x.files[n] }; });
      scarica(x.nome_file, Zip.scrivi(files), 'application/zip');
      stato.messaggio = 'Snapshot scaricato: ' + x.nome_file + '. Aprilo sul tablet della Regia con Progetto › Apri.'; aggiornaMessaggio();
    }, { disabled: !ok, class: 'md-button md-button--primary', id: 'crea-scarica' }), ok ? ' ' + e.nome_file : ''));
    if (stato.avvisoIdentita) c.appendChild(h('p', { class: 'fej-avviso' }, stato.avvisoIdentita));
    if (ok) c.appendChild(h('p', { class: 'fej-tenue' }, 'Impronta del registro ' + e.impronta.slice(0, 6).toUpperCase() + ' · pacchetto ' + e.pacchetto.sha256.slice(0, 8) + '. Lo stesso file apre lo stesso progetto su qualunque tablet; non modificarlo.'));
    c.appendChild(h('ol', null,
      h('li', null, 'Copia lo zip sul tablet (cavo, chiavetta, condivisione).'),
      h('li', null, 'Sul tablet: menu ☰ › Progetto › Apri, scegli lo zip, «Riprendi».'),
      h('li', null, 'Controlla la Checklist e avvio, apri la rete come Regia, mostra il QR: i palmari entrano come sempre.')));
  }

  function renderSalva() {
    var c = sez.salva; svuota(c);
    var qualcosa = stato.file.length || stato.veterinariCsv || stato.reti.some(function (r) { return r.ssid.trim(); });
    c.appendChild(h('p', null, bottone('Salva il progetto per cambiarlo dopo (JSON)', salvaProgetto, { disabled: !qualcosa, class: 'md-button', id: 'crea-salva' })));
    c.appendChild(h('p', { class: 'fej-tenue' }, 'Un file da riprendere al passo 0 per cambiare reti, veterinari, scelte o file della BDN (per esempio coi registri riscaricati il giorno del lavoro), senza rifare tutto. Contiene i file della BDN, i codici fiscali dei veterinari e le password delle reti: tienilo per te.'));
  }

  var msg = h('div', { role: 'status', class: 'fej-msg', 'aria-live': 'polite' });
  function aggiornaMessaggio() { msg.textContent = stato.messaggio || (stato.occupato ? 'Operazione in corso…' : ''); }
  function aggiorna() {
    aggiornaMessaggio();
    var e = stato.esito || {};
    var codici = JSON.stringify((e.codici || []).map(function (c) { return c.codice; })) + '|' + JSON.stringify(stato.stabilimenti) + '|' + stato.principale;
    if (codici !== codiciVisti) { codiciVisti = codici; renderStabilimenti(); }
    var vets = JSON.stringify((e.veterinari || []).map(function (v) { return v.id; })) + '|' + (e.tipologie || []).length + '|' + stato.priorita.join(',');
    if (vets !== veterinariVisti) { veterinariVisti = vets; renderConfigurazione(); }
    // le proposte cambiano con le sigle scritte a mano: si aggiornano al loro posto, senza ridisegnare il campo in uso
    (e.veterinari || []).forEach(function (v) {
      var i = d.querySelector('#crea-veterinari input[data-vet="' + v.id + '"]'), t = d.querySelector('#crea-veterinari [data-proposta="' + v.id + '"]');
      if (i) i.setAttribute('placeholder', v.proposta);
      if (t) t.textContent = 'vuota: la Regia assegna ' + v.proposta;
    });
    renderScelte();
    renderAnteprima(); renderSnapshot(); renderSalva(); aggiornaStampe();
  }

  /* Le stampe pre-campo come seconda scheda (utente, 12/11: «unirei la pagina delle stampe alla precedente, così da non
     dover dare altri input»): ricevono lo snapshot ogni volta che il progetto creato qui cambia. */
  var Stampe = deps.stampe || w.FejPrimaDelCampo, apiStampe = null, chiaveStampe = '';
  var retiStampe = '';
  function aggiornaStampe() {
    var e = stato.esito;
    if (apiStampe && apiStampe.impostaReti) {
      var rr = stato.reti.filter(function (r) { return r.ssid.trim(); }), kr = JSON.stringify(rr);
      if (kr !== retiStampe) { retiStampe = kr; apiStampe.impostaReti(rr); }
    }
    if (!apiStampe || !e || !e.ok) return;
    var k = e.impronta + '|' + e.pacchetto.sha256;
    if (k === chiaveStampe) return;
    chiaveStampe = k;
    apiStampe.caricaBackup(Zip.scrivi(Object.keys(e.files).sort().map(function (n) { return { name: n, data: e.files[n] }; })));
  }

  svuota(radice);
  var pannelloCrea = h('div', { id: 'crea-scheda-progetto' }), pannelloStampe = h('div', { id: 'crea-scheda-stampe', hidden: 'hidden' });
  var tastoCrea, tastoStampe;
  function scheda(quale) {
    pannelloCrea.hidden = quale !== 'crea'; pannelloStampe.hidden = quale !== 'stampe';
    tastoCrea.className = 'md-button' + (quale === 'crea' ? ' md-button--primary' : ''); tastoCrea.setAttribute('aria-selected', String(quale === 'crea'));
    tastoStampe.className = 'md-button' + (quale === 'stampe' ? ' md-button--primary' : ''); tastoStampe.setAttribute('aria-selected', String(quale === 'stampe'));
  }
  tastoCrea = bottone('1 · Crea il progetto', function () { scheda('crea'); }, { role: 'tab' });
  tastoStampe = bottone('2 · Stampe pre-campo e 2/33', function () { scheda('stampe'); }, { role: 'tab' });
  if (Stampe) {
    radice.appendChild(h('p', { role: 'tablist', class: 'fej-schede' }, tastoCrea, ' ', tastoStampe));
    radice.appendChild(pannelloCrea); radice.appendChild(pannelloStampe);
    var contenitore = h('div', { id: 'fejalog-prima-incorporata' });
    pannelloStampe.appendChild(h('p', { class: 'fej-tenue' }, 'Le stampe usano il progetto creato nella scheda 1: chiave della numerazione, foglio A3, materiale, QR Wi-Fi e i 2/33 precompilati (carica i .htm o lo zip dello snippet per ARVET).'));
    pannelloStampe.appendChild(contenitore);
    apiStampe = Stampe.monta(contenitore, { progetto: true });
    scheda('crea');
  } else radice.appendChild(pannelloCrea);
  pannelloCrea.appendChild(msg);
  function ricomincia() {
    Object.assign(stato, { file: [], specieFile: {}, veterinariCsv: '', veterinariNome: '', ricercatiCsv: '', ricercatiNome: '', stabilimenti: null, principale: '', descrizione: '',
      etaMesi: 6, lettere: '', problematiciInSequenza: true, verso: 'alto_basso', sigle: {}, priorita: [], reti: [], regole: {}, cerchiettoPrincipale: null, id: uuid(w),
      creatoIl: isoSenzaMillisecondi(deps.adesso ? deps.adesso() : new Date()), messaggio: '', esito: null,
      riferimento: null, numerazioneRipresa: '', ripresoDa: '', avvisoIdentita: '' });
    codiciVisti = veterinariVisti = ''; calcola(); aggiorna(); renderFile(); renderElenco(); renderRicercati(); renderRiprendi();
  }
  pannelloCrea.appendChild(h('p', null, bottone('Ricomincia da capo', ricomincia)));
  pannelloCrea.appendChild(sezione('riprendi', '0 · Riprendi un progetto (facoltativo)'));
  pannelloCrea.appendChild(sezione('file', '1 · File della BDN'));
  pannelloCrea.appendChild(sezione('elenco', '2 · Elenco dei veterinari'));
  pannelloCrea.appendChild(sezione('ricercati', '3 · Capi ricercati (facoltativo)'));
  pannelloCrea.appendChild(sezione('stabilimenti', '4 · Stabilimenti e progetto'));
  pannelloCrea.appendChild(sezione('scelte', '5 · Regole di numerazione'));
  pannelloCrea.appendChild(sezione('configurazione', '6 · Configurazione della Regia'));
  pannelloCrea.appendChild(sezione('anteprima', '7 · Anteprima della numerazione'));
  pannelloCrea.appendChild(sezione('snapshot', '8 · Snapshot per la Regia'));
  pannelloCrea.appendChild(sezione('salva', '9 · Salva il progetto per cambiarlo dopo'));
  calcola(); aggiorna(); renderFile(); renderElenco(); renderRicercati(); renderRiprendi();
  return { stato: stato, ricalcola: function () { ricalcola(true); } };
}

return { monta: monta, latin1: latin1, eZip: eZip, sceltaDaBackup: sceltaDaBackup, confrontaNumerazione: confrontaNumerazione, chiavePersona: chiavePersona, FORMATO_SALVATO: FORMATO_SALVATO };
});
