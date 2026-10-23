/* Strumenti «dopo il campo» di Fejalog: l'interfaccia. Carica il backup, lo verifica e permette tutte le azioni dopo il
   campionamento, nel browser: niente parte verso nessun server. Moduli: zip, registro, progetto, confronto, stato,
   modifiche, azioni (e il motore: motore.js, xlsx.js, fine_lavori.js). Niente ?. e ?? */
(function () {
'use strict';
var Conf = window.FejConfronto, Zip = window.FejZip, Progetto = window.FejProgetto, Stato = window.FejStato,
  Mod = window.FejModifiche, Az = window.FejAzioni, M = window.AccMotore, FL = window.FineLavori;

var S = { P: null, stato: null, ap: null, esito: null, motoreArvet: '', scheda: 'carica', cerca: '', tipoAperto: null, aperta: null,
  confr: { etichetta: '', cifre: '', sesso: '', specie: '' }, attribuendo: null, messaggio: '', ignoraVerifica: false };
var radice = document.getElementById('fejalog-strumenti');
if (!radice) return;

function h(tag, attrs) {
  var e = document.createElement(tag), i, a, k;
  if (attrs) for (k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
  }
  for (i = 2; i < arguments.length; i++) {
    a = arguments[i];
    if (a == null || a === false) continue;
    if (Array.isArray(a)) a.forEach(function (x) { if (x != null && x !== false) e.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); });
    else e.appendChild(typeof a === 'string' || typeof a === 'number' ? document.createTextNode(String(a)) : a);
  }
  return e;
}

function copia(testo, dove) {
  function fatto(ok) { S.messaggio = ok ? 'Copiato: ' + (testo.length > 60 ? testo.slice(0, 60) + '…' : testo) : 'Non riesco a usare gli appunti: seleziona e copia a mano.'; messaggio(); }
  if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(testo).then(function () { fatto(true); }, function () { vecchio(); }); return; }
  vecchio();
  function vecchio() {
    var t = h('textarea', { style: 'position:fixed;opacity:0' }); t.value = testo; document.body.appendChild(t); t.select();
    var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(t); fatto(ok);
  }
}
function bottoneCopia(testo, etichetta) {
  return h('button', { type: 'button', class: 'fej-copia', title: 'Copia ' + testo, 'aria-label': 'Copia il contrassegno ' + testo, onclick: function () { copia(testo); } }, etichetta || '⧉ Copia');
}
function scarica(nome, mime, dati) {
  var a = h('a', { href: URL.createObjectURL(new Blob([dati], { type: mime })), download: nome });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
function b64(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
function datiFile(f) { return f.base64 ? b64(f.base64) : f.testo; }

var msgEl = h('div', { class: 'fej-msg', role: 'status' });
function messaggio() { msgEl.textContent = S.messaggio; }

/* ---- lo stato e il calcolo ---- */
function ricalcola() {
  if (!S.P) return;
  try {
    var r = Az.calcola(S.P, S.stato.azioni(), { FineLavori: FL, M: M, motoreArvet: S.motoreArvet });
    S.esito = r;
    S.ap = Az.applica(S.P, S.stato.azioni(), M);
  } catch (e) { S.messaggio = 'Calcolo non riuscito: ' + e.message; S.esito = null; }
  disegna();
}
function azione(tipo, dati) { S.stato.aggiungi(tipo, dati); ricalcola(); }
function togli(id) { S.stato.rimuovi(id); ricalcola(); }

/* ---- schede ---- */
var SCHEDE = [['carica', 'Carica'], ['problemi', 'Problemi'], ['nontrovati', 'Non trovati'], ['riordino', 'Riordino'], ['snippet', 'Snippet ARVET'], ['uscite', 'Uscite'], ['esporta', 'Esporta per l\'app']];
var tabs = h('div', { class: 'fej-tabs', role: 'tablist' });
var corpo = h('div', { class: 'fej-corpo' });
radice.appendChild(tabs); radice.appendChild(msgEl); radice.appendChild(corpo);

function disegna() {
  tabs.textContent = '';
  SCHEDE.forEach(function (s) {
    tabs.appendChild(h('button', { type: 'button', role: 'tab', 'aria-selected': S.scheda === s[0] ? 'true' : 'false', class: S.scheda === s[0] ? 'fej-tab fej-attiva' : 'fej-tab',
      disabled: !S.P && s[0] !== 'carica', onclick: function () { S.scheda = s[0]; disegna(); } }, s[1]));
  });
  corpo.textContent = '';
  var f = { carica: schedaCarica, problemi: schedaProblemi, nontrovati: schedaNonTrovati, riordino: schedaRiordino, snippet: schedaSnippet, uscite: schedaUscite, esporta: schedaEsporta }[S.scheda];
  corpo.appendChild(f());
  messaggio();
}

function nomeUtente() { try { return localStorage.getItem('fejalog:nome') || ''; } catch (e) { return ''; } }
function salvaNome(v) { try { localStorage.setItem('fejalog:nome', v); } catch (e) { /* niente */ } }

function schedaCarica() {
  var d = h('div');
  d.appendChild(h('p', null, 'Scegli il file zip di backup di Fejalog (quello salvato dalla Regia o lo zip di fine lavori). Il file resta sul tuo computer: la pagina lo legge qui, senza mandarlo da nessuna parte.'));
  d.appendChild(h('p', { class: 'fej-avviso' }, 'Il backup contiene la chiave della seduta: tienilo per te.'));
  d.appendChild(h('input', { type: 'file', accept: '.zip,application/zip', 'aria-label': 'File di backup', onchange: function (ev) {
    var f = ev.target.files[0]; if (!f) return;
    S.messaggio = 'Leggo e verifico il backup…'; messaggio();
    f.arrayBuffer().then(Progetto.leggiBackup).then(function (P) {
      S.P = P; S.stato = Stato.crea(P.chiave); S.ignoraVerifica = P.verifica.ok; S.messaggio = P.verifica.ok ? 'Backup letto e verificato.' : 'Backup letto, ma la verifica ha trovato problemi.';
      ricalcola();
    }).catch(function (e) { S.messaggio = 'Non riesco a leggere il backup: ' + e.message; messaggio(); });
  } }));
  d.appendChild(h('p', null, h('label', null, 'Il tuo nome (firma le registrazioni tardive): ', h('input', { type: 'text', value: nomeUtente(), oninput: function (ev) { salvaNome(ev.target.value); } }))));
  var P = S.P;
  if (!P) return d;
  var v = P.verifica;
  d.appendChild(h('h3', null, 'Verifica del registro'));
  if (v.ok) d.appendChild(h('p', { class: 'fej-ok' }, '✓ Registro intatto: ' + v.eventi + ' eventi di ' + v.device + ' device, impronta ' + v.impronta.slice(0, 6).toUpperCase() + '.'));
  else {
    d.appendChild(h('p', { class: 'fej-errore' }, '✗ Il backup non torna: qualcosa è stato modificato o è incompleto.'));
    d.appendChild(h('ul', null, v.errori.slice(0, 12).map(function (e) { return h('li', null, e); })));
    d.appendChild(h('label', null, h('input', { type: 'checkbox', checked: S.ignoraVerifica, onchange: function (ev) { S.ignoraVerifica = ev.target.checked; } }), ' Ho capito, voglio usarlo lo stesso'));
  }
  d.appendChild(h('h3', null, 'Progetto'));
  var m = P.manifesto;
  d.appendChild(h('ul', null,
    h('li', null, (m.seduta && m.seduta.nome) + ' · ' + ((m.seduta && m.seduta.descrizione) || '')),
    h('li', null, 'Salvato da ' + ((m.salvato_da && m.salvato_da.nome) || '?') + (m.salvato_da && m.salvato_da.ruolo === 'R' ? ' (Regia)' : '') + ' il ' + (m.creato_il || '')),
    P.esporti.map(function (e) { return h('li', null, e.codice + ': ' + (e.export.records || []).length + ' provette'); })));
  d.appendChild(h('p', null, h('button', { type: 'button', onclick: function () { if (confirm('Ricominciare da capo? Si perdono le azioni fatte su questo backup.')) { S.stato.azzera(); ricalcola(); } } }, 'Ricomincia da capo')));
  return d;
}

function tuttiRecord() {
  var out = [];
  ((S.ap && S.ap.esporti) || []).forEach(function (e) { (e.export.records || []).forEach(function (r) { out.push(r); }); });
  return out;
}
var NOMI_SOL = { '': 'Predefinita', coda: 'In coda, ARVET a mano', esclusa: 'Eliminata', normalizzata: 'Normalizzata', ricollocata: 'Ricollocata (dall\'app)' };

function schedaProblemi() {
  var d = h('div');
  d.appendChild(h('p', null, 'Le provette che non vanno in ARVET da sole, per tipologia. Scegli che cosa farne; la scelta vale per i file che produci qui e si può riportare nell\'app dalla scheda «Esporta per l\'app».'));
  var recs = tuttiRecord().filter(function (r) { return M.tipologiaProblema(r); });
  d.appendChild(h('input', { type: 'search', placeholder: 'Cerca: etichetta, contrassegno, cifre', value: S.cerca, 'aria-label': 'Cerca', oninput: function (ev) { S.cerca = ev.target.value; disegna(); var i = corpo.querySelector('input[type=search]'); if (i) { i.focus(); i.setSelectionRange(S.cerca.length, S.cerca.length); } } }));
  var q = S.cerca.trim().toLowerCase();
  var filtrate = recs.filter(function (r) { return !q || [r.etichetta, r.contrassegno, r.operatore, r.note].join(' ').toLowerCase().indexOf(q) >= 0; });
  if (!recs.length) d.appendChild(h('p', null, 'Nessuna provetta problematica.'));
  M.TIPOLOGIE_PROBLEMI.forEach(function (t) {
    var righe = filtrate.filter(function (r) { return M.tipologiaProblema(r) === t[0]; });
    if (!righe.length) return;
    var det = h('details', { open: q || S.tipoAperto === t[0] ? true : null });
    det.addEventListener('toggle', function () { if (det.open) S.tipoAperto = t[0]; });
    det.appendChild(h('summary', null, t[1] + ' (' + righe.length + ')'));
    det.appendChild(h('p', null, 'Per tutta la tipologia: ', soluzioneSelect('', function (v) { righe.forEach(function (r) { S.stato.aggiungi('soluzione', { uid: r.uid, etichetta: r.etichetta, contrassegno: r.contrassegno, specie: r.specie, stabilimento: r.codice_stabilimento, soluzione: v }); }); ricalcola(); }, true)));
    righe.forEach(function (r) { det.appendChild(rigaProblema(r)); });
    d.appendChild(det);
  });
  return d;
}
function soluzioneSelect(attuale, onCambia, conVuoto) {
  var sel = h('select', { 'aria-label': 'Soluzione', onchange: function (ev) { if (ev.target.value !== '?') onCambia(ev.target.value); } });
  if (conVuoto) sel.appendChild(h('option', { value: '?' }, 'Scegli…'));
  ['', 'coda', 'esclusa', 'normalizzata'].forEach(function (v) { sel.appendChild(h('option', { value: v, selected: !conVuoto && v === attuale ? true : null }, NOMI_SOL[v])); });
  if (attuale === 'ricollocata') sel.appendChild(h('option', { value: 'ricollocata', selected: true, disabled: true }, NOMI_SOL.ricollocata));
  return sel;
}
function rigaProblema(r) {
  var aperta = S.aperta === r.uid;
  var div = h('div', { class: 'fej-riga' },
    h('strong', null, r.etichetta), ' ', h('code', null, r.contrassegno || '(senza contrassegno)'), ' ',
    r.contrassegno ? bottoneCopia(r.contrassegno) : null, ' ',
    h('span', { class: 'fej-tenue' }, [r.sesso, r.razza, r.data_nascita, r.operatore].filter(Boolean).join(' · ')), ' ',
    soluzioneSelect(str(r.soluzione), function (v) { azione('soluzione', { uid: r.uid, etichetta: r.etichetta, contrassegno: r.contrassegno, specie: r.specie, stabilimento: r.codice_stabilimento, soluzione: v }); }), ' ',
    h('button', { type: 'button', onclick: function () { S.aperta = aperta ? null : r.uid; disegna(); } }, aperta ? 'Chiudi scheda' : 'Scheda'));
  if (aperta) div.appendChild(schedaProvetta(r));
  return div;
}
function str(x) { return x == null ? '' : String(x); }
function schedaProvetta(r) {
  var s = Progetto.scheda(S.P, r);
  return h('div', { class: 'fej-scheda' },
    h('table', null, s.campi.map(function (c) { return h('tr', null, h('th', null, c[0]), h('td', null, str(c[1]))); })),
    s.storia.length ? h('p', null, 'Storia dei numeri: ' + s.storia.map(function (x) { return x[0] + ' ' + x[1]; }).join(' · ')) : null,
    s.eventi.length ? h('p', null, 'Eventi del registro: ' + s.eventi.map(function (x) { return x.tipo + ' (' + x.op + ')'; }).join(', ')) : null);
}

function schedaNonTrovati() {
  var d = h('div'), capi = S.ap ? S.ap.nonPrelevati : [];
  d.appendChild(h('p', null, 'I capi presenti non prelevati, aggiornati a ogni registrazione tardiva. Se hai una provetta con il numero incompleto, sbagliato o illeggibile, scrivi quello che si legge: l\'elenco dice il perché di ogni candidato.'));
  var c = S.confr;
  d.appendChild(h('h3', null, 'Confronto'));
  function campo(et, k, tipo) { return h('label', null, et + ' ', h('input', { type: 'text', value: c[k], oninput: function (ev) { c[k] = ev.target.value; ricarica(); } })); }
  d.appendChild(h('div', { class: 'fej-form' }, campo('Numero scritto (? se illeggibile)', 'etichetta'), campo('Cifre del contrassegno', 'cifre'),
    h('label', null, 'Sesso ', h('select', { onchange: function (ev) { c.sesso = ev.target.value; ricarica(); } }, [['', '?'], ['F', 'F'], ['M', 'M']].map(function (o) { return h('option', { value: o[0], selected: c.sesso === o[0] ? true : null }, o[1]); }))),
    h('label', null, 'Specie ', h('select', { onchange: function (ev) { c.specie = ev.target.value; ricarica(); } }, [['', 'tutte'], ['pecore', 'pecore'], ['capre', 'capre']].map(function (o) { return h('option', { value: o[0], selected: c.specie === o[0] ? true : null }, o[1]); })))));
  var elenco = h('div', { id: 'fej-candidati' });
  d.appendChild(elenco);
  function ricarica() {
    elenco.textContent = '';
    if (!c.etichetta && !c.cifre && !c.sesso) return;
    var cand = Conf.confronta({ cifre: c.cifre, etichetta: c.etichetta, sesso: c.sesso || null, specie: c.specie || null, dataRiferimento: (S.P.pacchetto.sessione || {}).data || '' }, capi);
    if (!cand.length) elenco.appendChild(h('p', null, 'Nessun candidato.'));
    cand.forEach(function (x) { elenco.appendChild(rigaCapo(x.capo, x, cand.length)); });
  }
  ricarica();
  d.appendChild(h('h3', null, 'Registrazioni tardive fatte qui'));
  var tardive = S.stato.azioni().filter(function (a) { return a.tipo === 'tardiva'; });
  if (!tardive.length) d.appendChild(h('p', { class: 'fej-tenue' }, 'Nessuna.'));
  tardive.forEach(function (a) { d.appendChild(h('div', { class: 'fej-riga' }, h('code', null, a.contrassegno), ' → provetta ' + a.etichetta + ' · ' + a.nota + ' ', h('button', { type: 'button', onclick: function () { togli(a.id); } }, 'Annulla'))); });
  d.appendChild(h('h3', null, 'Non trovati: ' + capi.length));
  d.appendChild(h('p', null, h('button', { type: 'button', onclick: function () { copia(capi.map(function (x) { return [x.numeroAssegnato == null ? '' : x.numeroAssegnato, x.contrassegno, [x.sesso, x.razza, x.dataNascita, x.stabilimento].filter(Boolean).join(' · ')].join('\t'); }).join('\n')); } }, '⧉ Copia la distinta'), ' ',
    h('button', { type: 'button', onclick: function () { scarica('non_trovati.csv', 'text/csv;charset=utf-8', '﻿numero;contrassegno;specie;sesso;razza;nascita;stabilimento\r\n' + capi.map(function (x) { return [x.numeroAssegnato == null ? '' : x.numeroAssegnato, x.contrassegno, x.specie, x.sesso, x.razza, x.dataNascita, x.stabilimento].join(';'); }).join('\r\n') + '\r\n'); } }, 'Scarica CSV')));
  capi.slice(0, 400).forEach(function (x) { d.appendChild(rigaCapo(x, null, 0)); });
  if (capi.length > 400) d.appendChild(h('p', { class: 'fej-tenue' }, '… e altri ' + (capi.length - 400) + ': usa il confronto o scarica il CSV.'));
  return d;
}
function rigaCapo(capo, match, nCand) {
  var div = h('div', { class: 'fej-riga' },
    h('span', null, capo.numeroAssegnato == null ? '' : capo.numeroAssegnato + ' · '), h('code', null, capo.contrassegno), ' ', bottoneCopia(capo.contrassegno), ' ',
    h('span', { class: 'fej-tenue' }, [capo.sesso, capo.razza, capo.dataNascita, capo.stabilimento].filter(Boolean).join(' · ')),
    match ? h('div', { class: 'fej-motivi' }, match.punteggio + ' punti: ' + match.motivi.join(', ')) : null, ' ',
    h('button', { type: 'button', onclick: function () { S.attribuendo = { capo: capo, nCand: nCand, et: S.confr.etichetta || (capo.numeroAssegnato == null ? '' : String(capo.numeroAssegnato)) }; disegna(); } }, 'Attribuisci'));
  if (S.attribuendo && S.attribuendo.capo === capo) {
    var A = S.attribuendo, nota = h('input', { type: 'text', 'aria-label': 'Nota', placeholder: 'Come hai riconosciuto il capo' });
    var et = h('input', { type: 'text', 'aria-label': 'Etichetta', value: A.et });
    div.appendChild(h('div', { class: 'fej-attribuisci' }, h('label', null, 'Etichetta sulla provetta ', et), ' ', h('label', null, 'Nota ', nota), ' ',
      h('button', { type: 'button', onclick: function () {
        if (!nota.value.trim() || !et.value.trim()) { S.messaggio = 'Servono l\'etichetta e la nota.'; messaggio(); return; }
        try { Az.campiEtichetta(et.value, capo); } catch (e) { S.messaggio = e.message; messaggio(); return; }
        S.attribuendo = null;
        azione('tardiva', { contrassegno: capo.contrassegno, specie: capo.specie, stabilimento: capo.stabilimento, etichetta: et.value.trim(), nota: nota.value.trim(), candidati: A.nCand, nome: nomeUtente() });
        S.messaggio = 'Registrata tardi ' + capo.contrassegno + ' come ' + et.value.trim() + '.'; messaggio();
      } }, 'Registra'), ' ', h('button', { type: 'button', onclick: function () { S.attribuendo = null; disegna(); } }, 'Annulla')));
  }
  return div;
}

function schedaRiordino() {
  var d = h('div');
  d.appendChild(h('p', null, 'La guida al riposizionamento: ogni provetta va al suo numero finale una volta sola. Spunta quelle fatte. ', h('strong', null, 'Dalla prima spunta, una volta riportata nell\'app, il campionamento non si riapre più.')));
  var righe = [];
  ((S.esito && S.esito.uscite) || []).forEach(function (u) {
    var sp = (u.uscita.dati && u.uscita.dati.specie) || {};
    Object.keys(sp).forEach(function (specie) { (sp[specie].guida || []).forEach(function (g) { righe.push({ u: u, specie: specie, g: g }); }); });
  });
  var spunte = {};
  S.stato.azioni().filter(function (a) { return a.tipo === 'spunta'; }).forEach(function (a) { spunte[a.specie + '|' + a.contrassegno] = a; });
  if (!righe.length) d.appendChild(h('p', null, 'Nessuno spostamento da fare: le provette sono già ai loro numeri.'));
  else {
    var fatte = righe.filter(function (r) { var s = spunte[r.specie + '|' + r.g.contrassegno]; return s && s.fatto; }).length;
    d.appendChild(h('p', null, fatte + ' di ' + righe.length + ' fatte.'));
    var tb = h('table', { class: 'fej-guida' }, h('tr', null, ['', 'Specie', 'Contrassegno', 'Da', 'Plateau/pos', 'A', 'Plateau/pos', 'Motivo'].map(function (t) { return h('th', null, t); })));
    righe.forEach(function (r) {
      var g = r.g, k = r.specie + '|' + g.contrassegno, s = spunte[k];
      tb.appendChild(h('tr', null,
        h('td', null, h('input', { type: 'checkbox', 'aria-label': 'Fatta', checked: s && s.fatto ? true : null, onchange: function (ev) {
          azione('spunta', { stabilimento: r.u.codice, specie: r.specie, contrassegno: g.contrassegno, da: str(g.da), a: str(g.a_n), fatto: ev.target.checked }); } })),
        h('td', null, r.specie), h('td', null, h('code', null, g.contrassegno), ' ', bottoneCopia(g.contrassegno, '⧉')), h('td', null, str(g.da)), h('td', null, str(g.plateau_da) + '/' + str(g.pos_da)),
        h('td', null, str(g.a_n)), h('td', null, str(g.plateau_a) + '/' + str(g.pos_a)), h('td', null, str(g.motivo))));
    });
    d.appendChild(tb);
  }
  d.appendChild(h('h3', null, 'Fatto a mano, non secondo la guida'));
  var cod = h('input', { type: 'text', 'aria-label': 'Contrassegno', placeholder: 'contrassegno' }), num = h('input', { type: 'text', 'aria-label': 'Numero', placeholder: 'numero', size: 6 });
  var spec = h('select', { 'aria-label': 'Specie' }, h('option', { value: 'pecore' }, 'pecore'), h('option', { value: 'capre' }, 'capre'));
  var quando = h('select', { 'aria-label': 'Quando' }, h('option', { value: 'dopo' }, 'dopo la guida'), h('option', { value: 'prima' }, 'prima della guida'));
  d.appendChild(h('p', null, 'La provetta ', cod, ' sta al numero ', num, ' ', spec, ' ', quando, ' ', h('button', { type: 'button', onclick: function () {
    var n = parseInt(num.value, 10), c = cod.value.replace(/\s/g, '').toUpperCase();
    if (!c || isNaN(n)) { S.messaggio = 'Scrivi il contrassegno e il numero.'; messaggio(); return; }
    azione('spostamento', { stabilimento: S.P.esporti[0].codice, specie: spec.value, contrassegno: c, provetta: n, quando: quando.value });
  } }, 'Aggiungi')));
  var a = h('input', { type: 'text', 'aria-label': 'Primo contrassegno', placeholder: 'contrassegno A' }), b = h('input', { type: 'text', 'aria-label': 'Secondo contrassegno', placeholder: 'contrassegno B' });
  var spec2 = h('select', { 'aria-label': 'Specie' }, h('option', { value: 'pecore' }, 'pecore'), h('option', { value: 'capre' }, 'capre'));
  d.appendChild(h('p', null, 'Scambio: ', a, ' prende il posto di ', b, ' ', spec2, ' ', h('button', { type: 'button', onclick: function () {
    var x = a.value.replace(/\s/g, '').toUpperCase(), y = b.value.replace(/\s/g, '').toUpperCase();
    if (!x || !y) { S.messaggio = 'Scrivi i due contrassegni.'; messaggio(); return; }
    azione('scambio', { stabilimento: S.P.esporti[0].codice, specie: spec2.value, a: x, b: y });
  } }, 'Aggiungi')));
  S.stato.azioni().filter(function (x) { return x.tipo === 'spostamento' || x.tipo === 'scambio'; }).forEach(function (x) {
    d.appendChild(h('div', { class: 'fej-riga' }, x.tipo === 'scambio' ? x.a + ' ⇄ ' + x.b : x.contrassegno + ' → ' + x.provetta + ' (' + x.quando + ')', ' ', h('button', { type: 'button', onclick: function () { togli(x.id); } }, 'Togli')));
  });
  return d;
}

function filesDi(estensione, prefisso) {
  var out = [];
  ((S.esito && S.esito.uscite) || []).forEach(function (u) { (u.uscita.file || []).forEach(function (f) { if ((!prefisso || f.nome.indexOf(prefisso) === 0) && (!estensione || f.nome.slice(-estensione.length) === estensione)) out.push({ u: u, f: f }); }); });
  return out;
}
function schedaSnippet() {
  var d = h('div');
  d.appendChild(h('p', { class: 'fej-avviso' }, 'Prove: prima dello snippet scrivi window.__ARVET_PROVA__=true; nella console di ARVET, così prepara i campi senza confermare. In ARVET vero non salvare mai durante le prove.'));
  var snip = filesDi('.txt', 'snippet_arvet_');
  if (!snip.length) d.appendChild(h('p', null, 'Nessuno snippet: non ci sono provette da inviare.'));
  snip.forEach(function (x) {
    d.appendChild(h('h3', null, x.u.codice + ' · ' + x.f.nome.replace(/^snippet_arvet_/, '').replace(/_\d{4}-.*$/, '')));
    d.appendChild(h('p', null, h('button', { type: 'button', onclick: function () { copia(x.f.testo); } }, '⧉ Copia lo snippet'), ' ', h('button', { type: 'button', onclick: function () { scarica(x.f.nome, 'text/plain;charset=utf-8', x.f.testo); } }, 'Scarica .txt')));
    d.appendChild(h('textarea', { readonly: true, rows: 4, class: 'fej-snippet', 'aria-label': 'Snippet ' + x.f.nome }, x.f.testo.slice(0, 2000) + (x.f.testo.length > 2000 ? '…' : '')));
  });
  d.appendChild(h('h3', null, 'File per i 3 invii'));
  filesDi('', 'arvet_').concat(filesDi('.csv', 'provette_arvet_')).forEach(function (x) { d.appendChild(rigaFile(x.f)); });
  return d;
}
function rigaFile(f) { return h('div', { class: 'fej-riga' }, h('code', null, f.nome), ' ', h('button', { type: 'button', onclick: function () { scarica(f.nome, f.mime, datiFile(f)); } }, 'Scarica')); }
function schedaUscite() {
  var d = h('div');
  d.appendChild(h('p', null, 'Tutti i file di fine lavori, calcolati con le azioni fatte qui.'));
  var tutti = filesDi('', '');
  d.appendChild(h('p', null, h('button', { type: 'button', disabled: !tutti.length, onclick: function () {
    var voci = tutti.map(function (x) { return { name: x.f.nome, data: datiFile(x.f) }; });
    S.ap.esporti.forEach(function (e) { voci.push({ name: 'export_modificato_' + e.codice + '.json', data: JSON.stringify(e.export, null, 1) }); });
    voci.push({ name: 'numerazione_chiave.csv', data: S.P.numerazioneCsv });
    voci.push({ name: 'LEGGIMI.txt', data: 'Fine lavori calcolata dagli strumenti on line di Fejalog (dal backup ' + S.P.manifesto.seduta.nome + ', impronta ' + S.P.verifica.impronta.slice(0, 6).toUpperCase() + ').\r\nIl backup originale resta quello della Regia.\r\n' });
    scarica('fejalog_fine_lavori_' + S.esito.stamp + '.zip', 'application/zip', Zip.scrivi(voci));
  } }, 'Scarica tutto (zip)')));
  S.esito && S.esito.uscite.forEach(function (u) { if (u.errori.length) d.appendChild(h('div', { class: 'fej-errore' }, u.codice + ': ' + u.errori.join(' · '))); });
  tutti.forEach(function (x) { d.appendChild(rigaFile(x.f)); });
  return d;
}
function schedaEsporta() {
  var d = h('div'), az = S.stato.azioni().filter(function (a) { return Mod.TIPI.indexOf(a.tipo) >= 0; });
  d.appendChild(h('p', null, 'Il file con le azioni fatte qui, da importare nell\'app (Regia, a campionamento chiuso: Gestione campioni › Importa modifiche dal sito). L\'app mostra un\'anteprima, scarta ciò che non è più coerente e scrive solo eventi nuovi. Il sito non scrive mai nel registro.'));
  var conta = {}; az.forEach(function (a) { conta[a.tipo] = (conta[a.tipo] || 0) + 1; });
  d.appendChild(h('ul', null, Object.keys(conta).map(function (k) { return h('li', null, conta[k] + ' × ' + k); })));
  if (!az.length) d.appendChild(h('p', { class: 'fej-tenue' }, 'Nessuna azione da riportare.'));
  d.appendChild(h('p', null, h('button', { type: 'button', disabled: !az.length, onclick: function () {
    var ora = new Date().toISOString();
    scarica(Mod.nomeFile(S.P, ora), 'application/json', JSON.stringify(Mod.esporta(S.P, az, nomeUtente(), ora), null, 1));
  } }, 'Scarica fejalog-modifiche')));
  return d;
}

/* ---- avvio: carica il testo dello snippet (arvet_fill.min.js) dal sito e disegna ---- */
var base = document.currentScript ? document.currentScript.src.replace(/[^/]*$/, '') : 'js/';
if (typeof fetch === 'function') fetch(base + 'vendor/arvet_fill.min.js').then(function (r) { return r.text(); }).then(function (t) { S.motoreArvet = t; }, function () { S.motoreArvet = ''; });
disegna();
})();
