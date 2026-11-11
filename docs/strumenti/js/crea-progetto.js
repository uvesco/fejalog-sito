/* «Crea progetto» del sito (utente, 2026-11-11): file BDN, elenco dei veterinari e scelte nel browser; il dominio Kotlin
   compilato in JS (FejDominio.creaProgetto) fa pacchetto, numerazione ed eventi; qui solo lettura dei file, modulo e
   download. Nessun dato esce dal browser. In Node (prove) si monta con jsdom passando dominio, zip e scarica. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FejCreaProgetto = factory();
})(typeof self !== 'undefined' ? self : this, function () {
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

function monta(radice, deps) {
  var d = radice.ownerDocument, w = deps.finestra || d.defaultView;
  var Dominio = deps.dominio, Zip = deps.zip;
  var adesso = deps.adesso ? deps.adesso() : new Date();
  var stato = {
    file: [], specieFile: {}, veterinariCsv: '', veterinariNome: '', ricercatiCsv: '', ricercatiNome: '',
    stabilimenti: null, principale: '', descrizione: '', data: oggi(adesso), etaMesi: 6, lettere: '',
    problematiciInSequenza: true, verso: 'alto_basso', sigle: {}, priorita: [], reti: [], regole: {},
    id: deps.id || uuid(w), creatoIl: deps.creatoIl || isoSenzaMillisecondi(adesso), messaggio: '', esito: null, occupato: false
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
        return base && base.charAt(0) !== '.' && n.indexOf('__MACOSX') < 0;
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
      reti: stato.reti.filter(function (r) { return r.ssid.trim(); }), regole: stato.regole
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
          (f.specie ? ' · ' + f.specie : '') + (f.codici.length ? ' · ' + f.codici.join(', ') : '') + (f.tipo !== 'sconosciuto' ? ' · ' + f.capi + ' righe' : '') + ' ');
        if (f.tipo === 'marche' && !f.specie) {
          var sp = scelta('Specie', [['', 'Da scegliere'], ['pecore', 'Pecore'], ['capre', 'Capre']], stato.specieFile[f.nome] || '');
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

  function renderElenco() {
    var c = sez.elenco; svuota(c);
    var vet = h('input', { type: 'file', accept: '.csv,.txt,text/csv,text/plain' });
    vet.addEventListener('change', function () {
      var f = vet.files && vet.files[0]; if (!f) return;
      leggiTesto(f).then(function (t) { stato.veterinariCsv = t; stato.veterinariNome = f.name; stato.sigle = {}; stato.priorita = []; }, function (e) { stato.messaggio = e.message; })
        .then(function () { vet.value = ''; ricalcola(true); renderElenco(); });
    });
    var ric = h('input', { type: 'file', accept: '.csv,.txt,text/csv,text/plain' });
    ric.addEventListener('change', function () {
      var f = ric.files && ric.files[0]; if (!f) return;
      leggiTesto(f).then(function (t) { stato.ricercatiCsv = t; stato.ricercatiNome = f.name; }, function (e) { stato.messaggio = e.message; })
        .then(function () { ric.value = ''; ricalcola(true); renderElenco(); });
    });
    var e = stato.esito || {};
    c.appendChild(h('p', null, h('label', null, 'Elenco dei veterinari (CSV id;cognome;nome;codice_fiscale) ', vet), ' ',
      stato.veterinariNome ? stato.veterinariNome + ': ' + (e.veterinari || []).length + ' veterinari' + (e.veterinari_scartati ? ', ' + e.veterinari_scartati + ' righe ignorate' : '') : 'nessuno: in campo ognuno si aggiunge a mano',
      stato.veterinariNome ? [' ', bottone('Togli', function () { stato.veterinariCsv = ''; stato.veterinariNome = ''; stato.sigle = {}; stato.priorita = []; ricalcola(true); renderElenco(); })] : null));
    c.appendChild(h('p', null, h('label', null, 'Capi ricercati (CSV codice;nota;azione;segno, facoltativo) ', ric), ' ',
      stato.ricercatiNome ? [stato.ricercatiNome, ' ', bottone('Togli', function () { stato.ricercatiCsv = ''; stato.ricercatiNome = ''; ricalcola(true); renderElenco(); })] : 'nessuno'));
    c.appendChild(h('p', { class: 'fej-tenue' }, 'L’elenco entra nel pacchetto del progetto, mai nel registro: il codice fiscale non va sulle provette né nei file di campo.'));
  }

  function renderStabilimenti() {
    var c = sez.stabilimenti; svuota(c);
    var e = stato.esito || {}, codici = e.codici || [];
    if (!codici.length) { c.appendChild(h('p', { class: 'fej-tenue' }, 'Gli stabilimenti compaiono dopo i registri.')); return; }
    var scelti = stato.stabilimenti || (e.piu_popoloso ? [e.piu_popoloso] : []);
    var principale = stato.principale || scelti[0] || '';
    c.appendChild(h('p', null, 'Stabilimenti di lavoro (il principale non ha la lettera; gli altri la lettera cerchiata):'));
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
    c.appendChild(h('p', null, h('label', null, seq, ' Problematici in una sola sequenza (un plateau dei problematici sul tavolo alla volta)')));
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
        var s = campo(v.nome + ' (' + v.id + ')', stato.sigle[v.id] || '', 'text', { maxlength: 2, placeholder: v.proposta, size: 3 });
        s.input.addEventListener('input', function () { stato.sigle[v.id] = s.input.value.toUpperCase(); ricalcola(); });
        box.appendChild(h('p', null, s.label, ' ', h('span', { class: 'fej-tenue' }, 'vuota: la Regia assegna ' + v.proposta + ' all’ingresso')));
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
    c.appendChild(h('p', null, bottone('Aggiungi una rete', function () { stato.reti.push({ ssid: '', password: '', sicurezza: 'WPA' }); renderConfigurazione(); })));
    // regole dei problematici
    var tipi = e.tipologie || [];
    if (tipi.length) {
      c.appendChild(h('h3', null, 'Regole dei problematici (soluzione di fine lavori per tipologia)'));
      tipi.forEach(function (t) {
        var s = scelta(t.titolo, [['regola', 'Regola predefinita']].concat(t.soluzioni), stato.regole[t.codice] || 'regola');
        s.input.addEventListener('change', function () { if (s.input.value === 'regola') delete stato.regole[t.codice]; else stato.regole[t.codice] = s.input.value; ricalcola(); });
        c.appendChild(h('p', null, s.label));
      });
      c.appendChild(h('p', { class: 'fej-tenue' }, 'Si possono cambiare anche dopo, dal tablet: le provette seguono da sole nella sistemazione.'));
    }
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
      r.fuori_eta + ' fuori età diagnostica (senza numero: problematici se prelevati) · ' + (r.usciti_pecore + r.usciti_capre) + ' usciti · ' + (r.marche_pecore + r.marche_capre) + ' marche disponibili' +
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
  }

  function renderSnapshot() {
    var c = sez.snapshot; svuota(c);
    var e = stato.esito, ok = !!(e && e.ok);
    c.appendChild(h('p', null, bottone('Scarica lo snapshot per la Regia (zip)', function () {
      if (!ok) return;
      var files = Object.keys(e.files).sort().map(function (n) { return { name: n, data: e.files[n] }; });
      scarica(e.nome_file, Zip.scrivi(files), 'application/zip');
      stato.messaggio = 'Snapshot scaricato: ' + e.nome_file + '. Aprilo sul tablet della Regia con Progetto › Apri.'; aggiornaMessaggio();
    }, { disabled: !ok, class: 'md-button md-button--primary', id: 'crea-scarica' }), ok ? ' ' + e.nome_file : ''));
    if (ok) c.appendChild(h('p', { class: 'fej-tenue' }, 'Impronta del registro ' + e.impronta.slice(0, 6).toUpperCase() + ' · pacchetto ' + e.pacchetto.sha256.slice(0, 8) + '. Lo stesso file apre lo stesso progetto su qualunque tablet; non modificarlo.'));
    c.appendChild(h('ol', null,
      h('li', null, 'Copia lo zip sul tablet (cavo, chiavetta, condivisione).'),
      h('li', null, 'Sul tablet: menu ☰ › Progetto › Apri, scegli lo zip, «Riprendi».'),
      h('li', null, 'Controlla la Checklist e avvio, apri la rete come Regia, mostra il QR: i palmari entrano come sempre.')));
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
    renderScelte();
    renderAnteprima(); renderSnapshot();
  }

  svuota(radice);
  radice.appendChild(msg);
  radice.appendChild(h('p', null, bottone('Ricomincia da capo', function () {
    Object.assign(stato, { file: [], specieFile: {}, veterinariCsv: '', veterinariNome: '', ricercatiCsv: '', ricercatiNome: '', stabilimenti: null, principale: '', descrizione: '',
      etaMesi: 6, lettere: '', problematiciInSequenza: true, verso: 'alto_basso', sigle: {}, priorita: [], reti: [], regole: {}, id: uuid(w), messaggio: '', esito: null });
    codiciVisti = veterinariVisti = ''; calcola(); aggiorna(); renderFile(); renderElenco();
  })));
  radice.appendChild(sezione('file', '1 · File della BDN'));
  radice.appendChild(sezione('elenco', '2 · Elenco dei veterinari e ricercati'));
  radice.appendChild(sezione('stabilimenti', '3 · Stabilimenti e progetto'));
  radice.appendChild(sezione('scelte', '4 · Scelte della creazione (prima dei registri)'));
  radice.appendChild(sezione('configurazione', '5 · Configurazione della Regia'));
  radice.appendChild(sezione('anteprima', '6 · Anteprima della numerazione'));
  radice.appendChild(sezione('snapshot', '7 · Snapshot per la Regia'));
  calcola(); aggiorna(); renderFile(); renderElenco();
  return { stato: stato, ricalcola: function () { ricalcola(true); } };
}

return { monta: monta, latin1: latin1, eZip: eZip };
});
