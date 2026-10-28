/* Simulatore del riempimento dei plateau: rivede, provetta dopo provetta, come si sono riempiti, dal registro del backup.
   Una provetta registrata va dove l'ha posata la Regia (evento PROVETTA_POSATA, il posto vero); se il backup non ha la posa,
   si mostra il posto calcolato dalle regole (serie ordinaria e isolati al loro numero; problematici in fila per operatore),
   segnato come «indicativo». Parte pura (sequenza, statoA) provata in Node; parte DOM (crea) per la pagina e per la
   finestra staccata. Niente ?. e ?? */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    var dom = null;
    try { dom = require('./dominio.js'); } catch (e) {}
    module.exports = factory(dom);
  } else root.FejPlateau = factory(root.FejDominio);
})(typeof self !== 'undefined' ? self : this, function (Dominio) {
'use strict';

var DIM = 100, COLONNE = 10;

function ordina(eventi) {
  return eventi.slice().sort(function (a, b) {
    return (a.lamport - b.lamport) || (a.feed < b.feed ? -1 : a.feed > b.feed ? 1 : 0) || (a.seq - b.seq);
  });
}
function s(x) { return x == null ? '' : String(x); }

function analizza(et) {
  var dom = (typeof Dominio !== 'undefined' && Dominio) ? Dominio : ((typeof self !== 'undefined' && self.FejDominio) || (typeof window !== 'undefined' && window.FejDominio) || null);
  if (dom && dom.analizzaEtichetta) return dom.analizzaEtichetta(et);
  return null;
}

/* Il tipo di una provetta registrata: ordinaria, isolato, problematica o provvisoria. */
function tipoDi(d, etLetta) {
  // Le etichette storiche sono ambigue senza il contesto (A7, XP7): i dati registrati prevalgono.
  if (d.problematica) return 'problematica';
  if (d.provvisoria) return 'provvisoria';
  if (d.isolato === true || d.isolato === 'true' || s(d.origine_numero) === 'assegnata_isolato') return 'isolato';
  if (d.numero != null && (!etLetta || etLetta.tipo !== 'ISOLATO')) return 'ordinaria';
  if (etLetta && etLetta.valida) return etLetta.tipo.toLowerCase();
  return 'ordinaria';
}

/* → [{tipo: 'registrata'|'posata'|'annullata'|'persa'|'ritrovata', ts, uid, cella?, posto?}] nell'ordine del registro.
   `posto` = {serie, vista, plateau, pozzetto, indicativo?} */
function sequenza(eventi) {
  var ev = ordina(eventi), posate = {}, reg = {}, out = [], righe = {};
  ev.forEach(function (e) { if (e.tipo === 'PROVETTA_POSATA' && e.dati && !posate[e.dati.uid]) posate[e.dati.uid] = e; });
  ev.forEach(function (e) {
    var d = e.dati || {}, uid = s(d.uid);
    if (e.tipo === 'PROVETTA_REGISTRATA') {
      if (!uid || reg[uid]) return;
      var etichettaRaw = s(d.etichetta_campo || d.problematica || d.provvisoria || d.numero);
      var letta = analizza(etichettaRaw);
      var tipo = tipoDi(d, letta);
      var contr = (letta && letta.valida && letta.contrassegnoEsteso) ? letta.contrassegnoEsteso : s(d.contrassegno);
      var num = d.numero != null ? d.numero : ((letta && letta.valida) ? letta.numero : null);
      var cella = { uid: uid, tipo: tipo, etichetta: etichettaRaw, codiceBreve: (letta && letta.valida) ? letta.codiceBreve : etichettaRaw,
        contrassegno: contr, operatore: e.op, lettera: s(d.lettera), sigla: (letta && letta.siglaVeterinario) || '',
        ts: e.ts, serie: s(d.serie), numero: num, tardiva: s(d.tardiva) === 'true' };
      reg[uid] = cella;
      var posto = null;
      if (!posate[uid]) {
        if ((cella.tipo === 'ordinaria' || cella.tipo === 'isolato') && cella.numero != null && cella.numero >= 1) {
          posto = { serie: cella.serie, vista: 'serie', plateau: Math.ceil(cella.numero / DIM), pozzetto: ((cella.numero - 1) % DIM) + 1, indicativo: true };
        } else if (cella.tipo === 'problematica') {
          var k = cella.serie + '|' + (e.op || ''); righe[k] = (righe[k] || 0) + 1;
          // Senza posa si conserva la proposta pregressa: il progressivo della sigla non è un pozzetto.
          var posPozzetto = righe[k];
          posto = { serie: cella.serie, vista: 'problematici', plateau: Math.ceil(posPozzetto / DIM), pozzetto: ((posPozzetto - 1) % DIM) + 1, riga: e.op, indicativo: true };
        }
      }
      out.push({ tipo: 'registrata', ts: e.ts, uid: uid, cella: cella, posto: posto });
    } else if (e.tipo === 'PROVETTA_POSATA') {
      if (posate[uid] !== e) return;
      var p = parseInt(d.plateau, 10), z = parseInt(d.pozzetto, 10);
      if (isNaN(p) || isNaN(z)) return;
      out.push({ tipo: 'posata', ts: e.ts, uid: uid, posto: { serie: s(d.serie), vista: s(d.vista) || 'problematici', plateau: p, pozzetto: z, riga: d.riga == null ? undefined : d.riga } });
    } else if (e.tipo === 'PROVETTA_ANNULLATA') out.push({ tipo: 'annullata', ts: e.ts, uid: uid });
    else if (e.tipo === 'PROVETTA_PERSA') out.push({ tipo: 'persa', ts: e.ts, uid: uid });
    else if (e.tipo === 'PROVETTA_RITROVATA') out.push({ tipo: 'ritrovata', ts: e.ts, uid: uid });
  });
  return out;
}

function chiave(p) { return p.serie + '|' + p.vista + '|' + p.plateau; }

/* Posizione fisica nel disegno del plateau (righe 0..9 dall'alto, colonne 0..9 da sinistra, file dispari dall'alto sfalsate a destra). */
function coordinatePozzetto(pozzetto, verso) {
  var idx = pozzetto - 1, rLogica = Math.floor(idx / COLONNE), col = idx % COLONNE;
  var rAlto = verso === 'alto_basso' ? rLogica : (DIM / COLONNE - 1 - rLogica);
  return { pozzetto: pozzetto, rigaDallAlto: rAlto, rigaDalBasso: (DIM / COLONNE - 1 - rAlto), colonna: col, sfalsataADestra: (rAlto % 2 === 1) };
}

/* Lo stato dopo i primi n passi: {plateau: {chiave: {serie, vista, plateau, pozzetti: {1..100: [celle]}}}, inAttesa: [celle], registrate, posate} */
function statoA(passi, n) {
  var celle = {}, plateau = {}, stato = {}, posizione = {}, i;
  function metti(uid, posto) {
    var c = celle[uid]; if (!c) return;
    var vecchio = posizione[uid];
    if (vecchio) { var l = plateau[chiave(vecchio)].pozzetti[vecchio.pozzetto]; l.splice(l.indexOf(c), 1); }
    var k = chiave(posto);
    var pl = plateau[k] = plateau[k] || { serie: posto.serie, vista: posto.vista, plateau: posto.plateau, pozzetti: {} };
    (pl.pozzetti[posto.pozzetto] = pl.pozzetti[posto.pozzetto] || []).push(c);
    posizione[uid] = posto; c.posto = posto;
  }
  for (i = 0; i < n && i < passi.length; i++) {
    var p = passi[i];
    if (p.tipo === 'registrata') { celle[p.uid] = Object.assign({ stato: 'ok' }, p.cella); if (p.posto) metti(p.uid, p.posto); }
    else if (p.tipo === 'posata') metti(p.uid, p.posto);
    else if (celle[p.uid]) celle[p.uid].stato = p.tipo === 'annullata' ? 'annullata' : p.tipo === 'persa' ? 'persa' : 'ok';
  }
  var inAttesa = Object.keys(celle).map(function (u) { return celle[u]; }).filter(function (c) { return !c.posto; });
  var tutte = Object.keys(celle);
  return { plateau: plateau, inAttesa: inAttesa, registrate: tutte.length, posate: tutte.length - inAttesa.length };
}

var NOMI_VISTA = { serie: 'Serie ordinaria', problematici: 'Problematici' };
function elencoPlateau(passi) {
  var visti = {}, out = [];
  passi.forEach(function (p) {
    if (!p.posto) return;
    var k = chiave(p.posto);
    if (!visti[k]) { visti[k] = true; out.push({ chiave: k, serie: p.posto.serie, vista: p.posto.vista, plateau: p.posto.plateau }); }
  });
  return out.sort(function (a, b) { return a.chiave < b.chiave ? -1 : a.chiave > b.chiave ? 1 : 0; });
}

/* ---- DOM: il simulatore in doc/radice (la pagina, o la finestra staccata) ---- */
var COLORI = { ordinaria: '#2f8f4e', isolato: '#e08a1e', problematica: '#c0392b', provvisoria: '#d9b800', annullata: '#9aa0a6', persa: '#222' };

function crea(doc, radice, passi, opzioni) {
  opzioni = opzioni || {};
  var finestra = doc.defaultView || window;
  var n = passi.length, pos = n, timer = null, scelto = '', info = null;
  function h(tag, attrs) {
    var e = doc.createElement(tag), i, k;
    for (k in (attrs || {})) { if (k === 'class') e.className = attrs[k]; else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]); else if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k] === true ? '' : attrs[k]); }
    for (i = 2; i < arguments.length; i++) { aggiungi(e, arguments[i]); }
    return e;
  }
  function aggiungi(e, a) {
    if (a == null || a === false) return;
    if (Array.isArray(a)) { a.forEach(function (x) { aggiungi(e, x); }); return; }
    e.appendChild(typeof a === 'string' || typeof a === 'number' ? doc.createTextNode(String(a)) : a);
  }
  var lista = elencoPlateau(passi);
  var cima = h('div', { class: 'fej-sim' });
  radice.textContent = '';
  radice.appendChild(cima);

  function disegna() {
    var st = statoA(passi, pos);
    cima.textContent = '';
    if (!passi.length) { cima.appendChild(h('p', null, 'Il registro non ha ancora provette.')); return; }
    var ultimo = pos > 0 ? passi[pos - 1] : null;
    var cel = ultimo && st.plateau && ultimo.uid ? null : null;
    var barra = h('div', { class: 'fej-sim-barra' },
      h('button', { type: 'button', 'aria-label': 'Indietro di un passo', onclick: function () { ferma(); pos = Math.max(0, pos - 1); disegna(); } }, '◀'),
      h('button', { type: 'button', 'aria-label': timer ? 'Ferma' : 'Avvia', onclick: function () { timer ? ferma() : avvia(); } }, timer ? '❚❚' : '▶'),
      h('button', { type: 'button', 'aria-label': 'Avanti di un passo', onclick: function () { ferma(); pos = Math.min(n, pos + 1); disegna(); } }, '▶|'),
      h('input', { type: 'range', min: 0, max: n, value: pos, 'aria-label': 'Passo', class: 'fej-sim-cursore', oninput: function (ev) { ferma(); pos = parseInt(ev.target.value, 10); disegna(); } }),
      h('span', { class: 'fej-tenue' }, pos + ' / ' + n + (ultimo ? ' · ' + ultimo.ts.replace('T', ' ').slice(0, 19) : '')));
    cima.appendChild(barra);
    cima.appendChild(h('p', { class: 'fej-tenue' }, st.registrate + ' provette registrate, ' + st.posate + ' al loro posto' + (st.inAttesa.length ? ', ' + st.inAttesa.length + ' in attesa di un posto' : '') + '.'));
    var sel = h('select', { 'aria-label': 'Plateau', onchange: function (ev) { scelto = ev.target.value; disegna(); } });
    lista.forEach(function (p) {
      sel.appendChild(h('option', { value: p.chiave, selected: (scelto || lista[0].chiave) === p.chiave ? true : null }, p.serie.split(':').pop() + ' · ' + (NOMI_VISTA[p.vista] || p.vista) + ' · plateau ' + p.plateau));
    });
    cima.appendChild(h('p', null, 'Plateau: ', sel));
    var k = scelto || (lista[0] && lista[0].chiave);
    var pl = st.plateau[k];
    var ref = lista.filter(function (x) { return x.chiave === k; })[0];
    if (ref) cima.appendChild(griglia(pl || { pozzetti: {} }, ref));
    var leg = h('p', { class: 'fej-sim-legenda' });
    [['ordinaria', 'ordinaria'], ['isolato', 'da isolato'], ['problematica', 'problematica'], ['provvisoria', 'provvisoria'], ['annullata', 'annullata'], ['persa', 'persa']].forEach(function (x) {
      leg.appendChild(h('span', { class: 'fej-sim-chiave' }, h('i', { style: 'background:' + COLORI[x[0]] }), ' ' + x[1] + '  '));
    });
    cima.appendChild(leg);
    if (info) cima.appendChild(h('div', { class: 'fej-scheda' }, info));
    if (st.inAttesa.length) cima.appendChild(h('details', null, h('summary', null, 'In attesa di un posto (' + st.inAttesa.length + ')'),
      h('p', { class: 'fej-tenue' }, st.inAttesa.slice(0, 60).map(function (c) { return c.etichetta; }).join(' · '))));
    if (lista.some(function (x) { return passi.some(function (p) { return p.posto && p.posto.indicativo; }); })) {
      cima.appendChild(h('p', { class: 'fej-tenue' }, 'Il backup non ha la posa fatta dalla Regia per tutte le provette: dove manca, il posto è quello che danno le regole (indicativo).'));
    }
    if (!opzioni.staccata && opzioni.staccabile) cima.appendChild(h('p', null, h('button', { type: 'button', onclick: opzioni.staccabile }, 'Apri in una finestra')));
  }

  function pozzetto(pl, num) {
    var celle = pl.pozzetti[num] || [], cella = celle[celle.length - 1];
    var col = cella ? COLORI[cella.stato !== 'ok' ? cella.stato : cella.tipo] : '#e3e6e8';
    return h('button', { type: 'button', class: 'fej-poz' + (celle.length > 1 ? ' fej-poz-contesa' : ''), style: 'background:' + col, title: cella ? (cella.codiceBreve || cella.etichetta) + ' · ' + cella.contrassegno : 'pozzetto ' + num,
      'aria-label': 'Pozzetto ' + num + (cella ? ': ' + cella.etichetta : ' vuoto'), onclick: function () {
        var opIdent = cella ? (cella.sigla ? ' (sigla ' + cella.sigla + ')' : (cella.lettera ? ' (' + cella.lettera + ')' : '')) : '';
        info = cella ? [h('strong', null, cella.etichetta), ' ' + cella.contrassegno + ' · ' + cella.operatore + opIdent + ' · ' + cella.ts.replace('T', ' ').slice(0, 19) +
          (cella.stato !== 'ok' ? ' · ' + cella.stato : '') + (cella.tardiva ? ' · registrazione tardiva' : '') + (cella.posto && cella.posto.indicativo ? ' · posto indicativo' : '') + (celle.length > 1 ? ' · ATTENZIONE: ' + celle.length + ' provette in questo pozzetto' : '')]
          : ['Pozzetto ' + num + ': vuoto'];
        disegna();
      } }, celle.length > 1 ? '!' : '');
  }

  function griglia(pl, ref) {
    var righe = DIM / COLONNE, altoBasso = opzioni.verso === 'alto_basso';
    var tab = h('div', { class: 'fej-pl', role: 'img', 'data-verso': altoBasso ? 'alto_basso' : 'basso_alto', 'aria-label': 'Plateau ' + ref.plateau }), rAlto, c;
    for (rAlto = 0; rAlto < righe; rAlto++) {
      var rLogica = altoBasso ? rAlto : (righe - 1 - rAlto);
      var riga = h('div', { class: 'fej-pl-riga' + (rAlto % 2 === 1 ? ' fej-pl-sfalsata' : '') });
      for (c = 0; c < COLONNE; c++) {
        riga.appendChild(pozzetto(pl, rLogica * COLONNE + c + 1));
      }
      tab.appendChild(riga);
    }
    return tab;
  }
  function avvia() { if (pos >= n) pos = 0; timer = finestra.setInterval(function () { if (pos >= n) { ferma(); disegna(); return; } pos++; disegna(); }, opzioni.passoMs || 400); disegna(); }
  function ferma() { if (timer) { finestra.clearInterval(timer); timer = null; } }
  disegna();
  return { ferma: ferma, vaiA: function (i) { ferma(); pos = Math.max(0, Math.min(n, i)); disegna(); } };
}

/* Modello condiviso dalla scheda e dalla finestra staccata; nessun registro parallelo. */
function modelloAttuale() {
  var ascoltatori = [];
  var m = {celle: [], serieDisponibili: [], verso: 'basso_alto', serie: '', vista: 'serie', query: '', plateauRicerca: '1', postoRicerca: '1', evidenza: null, zoom: 1, messaggio: '', centro: 0, viste: {}};
  m.notifica = function () { ascoltatori.slice().forEach(function (f) { f(); }); };
  m.iscrivi = function (f) { ascoltatori.push(f); return function () { ascoltatori = ascoltatori.filter(function (x) { return x !== f; }); }; };
  m.aggiorna = function (celle, opzioni) {
    opzioni = opzioni || {}; m.celle = celle;
    m.serieDisponibili = opzioni.serie || celle.map(function (p) { return p.serie; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
    m.verso = opzioni.verso || m.verso; m.sequenza = opzioni.sequenza === true;
    if (m.serieDisponibili.indexOf(m.serie) < 0) m.serie = m.serieDisponibili[0] || '';
    if (m.evidenza && m.evidenza.uid) {
      var nuova = celle.filter(function (p) { return p.uid === m.evidenza.uid; })[0];
      if (nuova) {
        var spostata = ['serie', 'vista', 'plateau', 'pozzetto'].some(function (k) { return nuova[k] !== m.evidenza[k]; });
        m.evidenza = nuova; m.serie = nuova.serie; m.vista = nuova.vista;
        if (spostata) m.centro++;
      }
      else m.evidenza = null;
    }
    m.notifica();
  };
  return m;
}

function calcolaBordoPlateauJs(celle, serie, vista, numero, sequenzaUnica) {
  var bordo = Dominio.bordoPlateau(celle, serie, vista, numero, sequenzaUnica);
  bordo.colore = bordo.coloreHex; bordo.desc = bordo.descrizioneAccessibile;
  return bordo;
}

/* Vista attuale: categorie, ricerca e coordinate arrivano dal dominio Kotlin. */
function creaAttuale(doc, radice, celle, opzioni) {
  var finestra = doc.defaultView;
  opzioni = opzioni || {};
  var m = opzioni.modello || modelloAttuale();
  if (!opzioni.modello) m.aggiorna(celle, opzioni);
  // Ogni finestra conserva il proprio scorrimento anche quando app.js rimonta la scheda.
  var chiaveVista = opzioni.staccata ? 'staccata' : 'principale';
  var statoVista = m.viste[chiaveVista] || (m.viste[chiaveVista] = {x: 0, y: 0, centro: -1});
  var viewport = null, drag = null, trascinato = false;
  function h(tag, attrs, testo) {
    var e = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    });
    if (testo != null) e.textContent = testo;
    return e;
  }
  function campo(testo, nodo) { var l = h('label', {}, testo); l.appendChild(nodo); return l; }
  function bottone(testo, f, nome) { return h('button', {type: 'button', onclick: f, 'aria-label': nome}, testo); }
  function centro(p) {
    if (!p.uid) {
      var presenti = m.celle.filter(function (c) { return (c.serie === p.serie || m.sequenza && p.vista === 'problematici') && c.vista === p.vista && c.plateau === p.plateau && c.pozzetto === p.pozzetto; });
      var attive = presenti.filter(function (c) { return c.attiva; });
      if (attive.length === 1) p = attive[0]; else if (presenti.length === 1) p = presenti[0];
    }
    m.serie = p.serie; m.vista = p.vista; m.evidenza = p; m.messaggio = '';
    m.plateauRicerca = String(p.plateau); m.postoRicerca = String(p.pozzetto); m.centro++; m.notifica();
  }
  function cambiaZoom(z, x, y) {
    var prima = m.zoom, sx = viewport ? viewport.scrollLeft : 0, sy = viewport ? viewport.scrollTop : 0;
    m.zoom = Math.max(0.5, Math.min(4, z)); m.notifica();
    if (viewport) { viewport.scrollLeft = (sx + (x || 0)) * m.zoom / prima - (x || 0); viewport.scrollTop = (sy + (y || 0)) * m.zoom / prima - (y || 0); }
  }
  function scheda(c, contenitore) {
    var d = h('section', {class: 'fej-scheda', 'aria-label': 'Scheda provetta', 'data-scheda-uid': c.uid});
    d.appendChild(h('strong', {}, c.etichetta + ' · ' + c.contrassegno));
    d.appendChild(h('p', {}, c.categoria + ' · ' + c.serie.replace(':', ' · ') + ' · Plateau ' + c.plateau + ', pozzetto ' + c.pozzetto + (c.indicativa ? ' · posto indicativo' : '')));
    if (c.capo) d.appendChild(h('p', {}, c.capo));
    if (c.veterinario) d.appendChild(h('p', {}, 'Veterinario: ' + c.veterinario));
    if (c.note) d.appendChild(h('p', {}, 'Note: ' + c.note));
    d.appendChild(bottone('Copia contrassegno', function () {
      if (opzioni.copia) opzioni.copia(c.contrassegno, doc);
      else {
        var input = h('textarea', {}, c.contrassegno); doc.body.appendChild(input); input.select();
        if (doc.execCommand) doc.execCommand('copy'); input.remove();
      }
    }));
    if (opzioni.applicaAzione) {
      d.appendChild(bottone('Modifica registrazione', function () {
        var form = h('form', {'data-riattribuzione': c.uid});
        var codice = h('input', {type: 'text', value: c.contrassegno, 'aria-label': 'Nuovo contrassegno'});
        var sesso = h('input', {type: 'text', 'aria-label': 'Sesso M/F'});
        var razza = h('input', {type: 'text', 'aria-label': 'Razza'});
        var nascita = h('input', {type: 'text', 'aria-label': 'Data di nascita gg/mm/aaaa'});
        var doppio = h('input', {type: 'checkbox', 'aria-label': 'Confermo come doppio prelievo'});
        form.appendChild(campo('Nuovo contrassegno ', codice));
        var risultati = h('div'); form.appendChild(risultati);
        codice.addEventListener('input', function () {
          risultati.textContent = '';
          (opzioni.cercaCapi ? opzioni.cercaCapi(codice.value, c) : []).slice(0, 30).forEach(function (capo) {
            risultati.appendChild(bottone(capo, function () { codice.value = capo; risultati.textContent = ''; }));
          });
        });
        form.appendChild(h('p', {}, 'Se il capo non ha anagrafe: sesso, razza e data di nascita sono obbligatori. Se è già prelevato occorre confermare il doppio.'));
        form.appendChild(campo('Sesso M/F ', sesso)); form.appendChild(campo('Razza ', razza));
        form.appendChild(campo('Data di nascita gg/mm/aaaa ', nascita));
        form.appendChild(campo('Confermo come doppio prelievo ', doppio));
        form.appendChild(h('button', {type: 'submit'}, 'Applica modifica'));
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var nuovo = codice.value.trim().toUpperCase().replace(/\s+/g, '');
          if (!nuovo || nuovo === c.contrassegno) return;
          var gia = m.celle.filter(function (x) { return x.uid !== c.uid && x.attiva && x.contrassegno === nuovo; })[0];
          if (gia && !doppio.checked) { m.messaggio = 'Il capo ha già una provetta valida: conferma il doppio prelievo.'; m.notifica(); return; }
          opzioni.applicaAzione({tipo: 'riattribuzione', uid: c.uid, contrassegno: nuovo, conferma_doppio: doppio.checked,
            sesso: sesso.value.trim().toUpperCase(), razza: razza.value.trim(), nascita: nascita.value.trim()});
        });
        d.appendChild(form); codice.focus();
      }));
      if (opzioni.destinazione && opzioni.destinazione(c) != null) d.appendChild(bottone('Sposta al posto ' + opzioni.destinazione(c), function () {
        var n = opzioni.destinazione(c);
        sposta(c, {serie: c.serie, vista: 'serie', plateau: Math.ceil(n / 100), pozzetto: (n - 1) % 100 + 1});
      }));
      d.appendChild(bottone(m.modalitaSpostaUid === c.uid ? 'Annulla sposta' : 'Sposta', function () {
        m.modalitaSpostaUid = (m.modalitaSpostaUid === c.uid ? null : c.uid);
        m.notifica();
      }));
      if (c.categoria === 'esclusa') {
        d.appendChild(bottone('Annulla scarto', function () {
          opzioni.applicaAzione({ tipo: 'annulla_scarto', uid: c.uid });
        }));
      } else {
        d.appendChild(bottone('Scarto definitivo', function () {
          var mot = (finestra.prompt('Motivo dello scarto definitivo (obbligatorio):') || '').trim();
          if (mot) opzioni.applicaAzione({ tipo: 'scarto', uid: c.uid, motivo: mot });
        }));
      }
      if (c.tipo === 'persa' || c.stato === 'persa') {
        d.appendChild(bottone('Ritrovata', function () {
          opzioni.applicaAzione({ tipo: 'ritrovata', uid: c.uid });
        }));
      } else {
        d.appendChild(bottone('Smarrimento', function () {
          var mot = (finestra.prompt('Motivo dello smarrimento (obbligatorio):') || '').trim();
          if (mot) opzioni.applicaAzione({ tipo: 'persa', uid: c.uid, motivo: mot });
        }));
      }
    }
    contenitore.appendChild(d);
  }
  function sposta(sorgente, dest) {
    if (dest.serie !== sorgente.serie || dest.vista !== 'serie') {
      m.messaggio = 'Scegli un posto nella serie ordinaria della stessa serie.'; m.notifica(); return;
    }
    var altro = m.celle.filter(function (x) { return x.attiva && x.uid !== sorgente.uid && x.serie === dest.serie && x.vista === dest.vista && x.plateau === dest.plateau && x.pozzetto === dest.pozzetto; })[0];
    if (altro && !finestra.confirm('Il posto è occupato dalla provetta ' + altro.etichetta + '. Confermi lo scambio?')) return;
    var completo = [sorgente, dest].some(function (p) { return calcolaBordoPlateauJs(m.celle, p.serie, p.vista, p.plateau, m.sequenza).codice === 'completo'; });
    if (completo && !finestra.confirm('Lo spostamento modifica un plateau completo. Confermi?')) return;
    opzioni.sposta(sorgente, (dest.plateau - 1) * 100 + dest.pozzetto, altro ? altro.uid : '', completo);
    m.modalitaSpostaUid = null;
  }
  function disegna() {
    var attivo = doc.activeElement, etichettaFocus = attivo && radice.contains(attivo) ? attivo.getAttribute('aria-label') : null;
    var selezione = attivo && typeof attivo.selectionStart === 'number' ? [attivo.selectionStart, attivo.selectionEnd, attivo.selectionDirection] : null;
    var sx = viewport ? viewport.scrollLeft : statoVista.x, sy = viewport ? viewport.scrollTop : statoVista.y;
    radice.textContent = '';
    var controlli = h('div', {class: 'fej-plateau-controlli'});
    var specie = h('select', {'aria-label': 'Serie e specie', onchange: function (e) { m.serie = e.target.value; m.evidenza = null; m.notifica(); }});
    m.serieDisponibili.forEach(function (x) { specie.appendChild(h('option', {value: x, selected: x === m.serie}, x.replace(':', ' · '))); });
    var label = h('label', {}, 'Stabilimento e specie '); label.appendChild(specie); controlli.appendChild(label);
    var v = h('select', {'aria-label': 'Vista plateau', onchange: function (e) { m.vista = e.target.value; m.evidenza = null; m.notifica(); }});
    [['serie', 'Serie ordinaria'], ['problematici', 'Problematici']].forEach(function (x) { v.appendChild(h('option', {value: x[0], selected: x[0] === m.vista}, x[1])); });
    label = h('label', {}, 'Vista '); label.appendChild(v); controlli.appendChild(label);
    var ricerca = h('input', {type: 'search', value: m.query, 'aria-label': 'Cerca contrassegno o etichetta', oninput: cerca, onchange: cerca});
    function cerca(e) { if (m.query !== e.target.value) { m.query = e.target.value; m.notifica(); } }
    label = h('label', {}, 'Numero, etichetta o contrassegno '); label.appendChild(ricerca); controlli.appendChild(label);
    var risultati = Dominio.cercaPlateau(m.celle, m.query);
    if (m.query.trim()) {
      var elenco = h('div', {class: 'fej-plateau-risultati', 'aria-label': 'Risultati ricerca'});
      elenco.appendChild(h('p', {role: 'status'}, risultati.length + ' risultati'));
      risultati.forEach(function (p) { elenco.appendChild(bottone(p.etichetta + ' · ' + p.contrassegno + ' · ' + p.plateau + '/' + p.pozzetto, function () { centro(p); })); });
      controlli.appendChild(elenco);
    }
    controlli.appendChild(h('p', {class: 'fej-tenue'}, 'Posizione: plateau / pozzetto nella serie e vista scelte.'));
    var posizione = h('form', {class: 'fej-plateau-posizione', onsubmit: function (e) {
      e.preventDefault();
      var p = Dominio.posizionePlateau(m.serie, m.vista, pl.value, po.value);
      if (p) centro(p); else { m.messaggio = 'Scrivi un plateau da 1 a 10000 e un pozzetto da 1 a 100.'; m.notifica(); }
    }});
    var pl = h('input', {type: 'text', inputmode: 'numeric', value: m.plateauRicerca, 'aria-label': 'Numero plateau', size: '5', oninput: function (e) { m.plateauRicerca = e.target.value; }});
    var po = h('input', {type: 'text', inputmode: 'numeric', value: m.postoRicerca, 'aria-label': 'Posto da 1 a 100', size: '3', oninput: function (e) { m.postoRicerca = e.target.value; }});
    label = h('label', {}, 'Plateau '); label.appendChild(pl); posizione.appendChild(label);
    label = h('label', {}, 'Pozzetto '); label.appendChild(po); posizione.appendChild(label);
    posizione.appendChild(h('button', {type: 'submit'}, 'Cerca posizione')); controlli.appendChild(posizione);
    var zoom = h('div', {class: 'fej-plateau-zoom'});
    zoom.appendChild(bottone('−', function () { cambiaZoom(m.zoom / 1.25); }, 'Riduci'));
    zoom.appendChild(bottone('Ripristina', function () { cambiaZoom(1); viewport.scrollLeft = 0; viewport.scrollTop = 0; }, 'Ripristina zoom'));
    zoom.appendChild(bottone('+', function () { cambiaZoom(m.zoom * 1.25); }, 'Ingrandisci'));
    zoom.appendChild(h('span', {role: 'status'}, Math.round(m.zoom * 100) + '%')); controlli.appendChild(zoom);
    radice.appendChild(controlli);
    var dettagli = h('div');
    if (m.evidenza) {
      var selezionate = m.evidenza.uid ? m.celle.filter(function (c) { return c.uid === m.evidenza.uid; }) : m.celle.filter(function (c) { return (c.serie === m.serie || m.sequenza && m.vista === 'problematici') && c.vista === m.vista && c.plateau === m.evidenza.plateau && c.pozzetto === m.evidenza.pozzetto; });
      selezionate.forEach(function (c) { scheda(c, dettagli); });
      if (!selezionate.length) dettagli.appendChild(h('p', {role: 'status'}, 'Pozzetto ' + m.evidenza.plateau + '/' + m.evidenza.pozzetto + ': vuoto'));
    }
    radice.appendChild(dettagli);
    viewport = h('div', {class: 'fej-plateau-viewport', tabindex: '0', 'aria-label': 'Tavolo dei plateau', 'data-zoom': m.zoom});
    var colonne = (radice.clientWidth || 980) >= 700 ? 2 : 1;
    var tavolo = h('div', {class: 'fej-tavolo-attuale', style: 'grid-template-columns:repeat(' + colonne + ',' + (480 * m.zoom) + 'px)'});
    var qui = m.celle.filter(function (p) { return (p.serie === m.serie || m.sequenza && m.vista === 'problematici') && p.vista === m.vista; });
    var numeri = qui.map(function (p) { return p.plateau; });
    if (m.evidenza) numeri.push(m.evidenza.plateau);
    if (!numeri.length) numeri.push(1);
    numeri.filter(function (x, i, a) { return a.indexOf(x) === i; }).sort(function (a, b) { return a - b; }).forEach(function (numero) {
      var articolo = h('section', {'data-plateau': numero, class: 'fej-plateau-attuale', 'data-verso': m.verso});
      var bordo = calcolaBordoPlateauJs(m.celle, m.serie, m.vista, numero, m.sequenza);
      articolo.style.border = '4px solid ' + bordo.colore;
      var intestazione = h('div', {class: 'fej-plateau-intestazione', style: 'display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;align-items:center;margin-bottom:8px'});
      intestazione.appendChild(h('h3', {style: 'margin:0'}, (m.sequenza && m.vista === 'problematici' ? 'Progetto' : m.serie.replace(':', ' · ')) + ' · ' + (NOMI_VISTA[m.vista] || m.vista) + ' · Plateau ' + numero));
      intestazione.appendChild(h('span', {class: 'fej-badge-bordo', style: 'color:inherit;border:1px solid ' + bordo.colore + ';padding:2px 8px;border-radius:4px;font-weight:bold;font-size:12px', 'aria-label': bordo.desc}, bordo.etichetta));
      articolo.appendChild(intestazione);
      var griglia = h('div', {class: 'fej-plateau-griglia'});
      for (var fila = 0; fila < 10; fila++) {
        var riga = h('div', {class: 'fej-plateau-fila', style: 'margin-left:' + (fila % 2 ? 22 * m.zoom : 0) + 'px'});
        for (var c = 0; c < 10; c++) (function () {
          var posto = (m.verso === 'alto_basso' ? fila : 9 - fila) * 10 + c + 1;
          var campioni = qui.filter(function (p) { return p.plateau === numero && p.pozzetto === posto; });
          var occupanti = campioni.filter(function (p) { return p.attiva; }), scelta = occupanti[0] || campioni[0];
          var ev = m.evidenza && m.evidenza.serie === m.serie && m.evidenza.vista === m.vista && m.evidenza.plateau === numero && m.evidenza.pozzetto === posto;
          var b = h('button', {type: 'button', 'data-posto': posto, 'data-uids': campioni.map(function (p) { return p.uid; }).join(' '), 'data-tipo': scelta ? scelta.tipo : 'vuoto', 'data-occupanti': occupanti.length,
            class: 'fej-plateau-pozzetto', 'aria-label': 'Plateau ' + numero + ', pozzetto ' + posto + (campioni.length ? ': ' + campioni.map(function (p) { return p.etichetta + ', ' + p.categoria; }).join('; ') : ' vuoto'), 'aria-pressed': ev ? 'true' : 'false',
            style: 'width:' + (44 * m.zoom) + 'px;height:' + (44 * m.zoom) + 'px;font-size:' + (14 * m.zoom) + 'px;background:' + (occupanti.length > 1 ? '#ad1457' : scelta ? scelta.colore : '#f5f5f5') + ';color:' + (scelta ? scelta.testo : '#333'),
            onclick: function (e) {
              if (trascinato && e.detail !== 0) return;
              trascinato = false;
              if (m.modalitaSpostaUid && opzioni.sposta) {
                var sorgente = m.celle.filter(function (x) { return x.uid === m.modalitaSpostaUid; })[0];
                if (sorgente) { sposta(sorgente, {serie: m.serie, vista: m.vista, plateau: numero, pozzetto: posto}); return; }
              }
              centro({serie: m.serie, vista: m.vista, plateau: numero, pozzetto: posto});
            }}, occupanti.length > 1 ? '!' : posto);
          riga.appendChild(b);
        })();
        griglia.appendChild(riga);
      }
      articolo.appendChild(griglia); tavolo.appendChild(articolo);
    });
    viewport.appendChild(tavolo); radice.appendChild(viewport);
    viewport.scrollLeft = sx; viewport.scrollTop = sy;
    viewport.addEventListener('wheel', function (e) { e.preventDefault(); var rect = viewport.getBoundingClientRect(); cambiaZoom(m.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX - rect.left, e.clientY - rect.top); }, {passive: false});
    viewport.addEventListener('pointerdown', function (e) { if (e.button !== 0) return; trascinato = false; drag = {id: e.pointerId, x: e.clientX, y: e.clientY, sx: viewport.scrollLeft, sy: viewport.scrollTop}; });
    viewport.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 5) trascinato = true;
      if (trascinato) { if (viewport.setPointerCapture) viewport.setPointerCapture(e.pointerId); viewport.scrollLeft = drag.sx - e.clientX + drag.x; viewport.scrollTop = drag.sy - e.clientY + drag.y; }
    });
    ['pointerup', 'pointercancel'].forEach(function (tipo) { viewport.addEventListener(tipo, function () { drag = null; }); });
    var leg = h('p', {class: 'fej-plateau-legenda'});
    [['ordinaria', '#1b8a3a'], ['da isolato', '#e65100'], ['problematica', '#c62828'], ['provvisoria', '#f9d84a'], ['annullata', '#9aa0a6'], ['persa', '#212121']].forEach(function (x) {
      var voce = h('span'); voce.appendChild(h('i', {style: 'background:' + x[1]})); voce.appendChild(doc.createTextNode(x[0])); leg.appendChild(voce);
    });
    radice.appendChild(leg);
    radice.appendChild(h('p', {class: 'fej-tenue', style: 'font-weight:bold'}, 'Bordi dei plateau: Verde = completo · giallo = da completare · rosso = da svuotare'));
    radice.appendChild(h('p', {class: 'fej-tenue'}, 'Annullate e perse indicano l’ultimo posto noto; il pozzetto è libero. Il verso è quello del progetto. Rotella per lo zoom, trascina per spostare la vista.'));
    if (m.celle.some(function (p) { return p.indicativa; })) radice.appendChild(h('p', {class: 'fej-tenue'}, 'Dove manca la posa registrata, il posto è indicativo, calcolato dalle regole.'));
    radice.appendChild(h('p', {role: 'status'}, m.messaggio));
    if (!opzioni.staccata && opzioni.staccabile) radice.appendChild(bottone('Apri in una finestra', opzioni.staccabile));
    if (statoVista.centro !== m.centro && m.evidenza) {
      var bersaglio = radice.querySelector('[data-plateau="' + m.evidenza.plateau + '"] [data-posto="' + m.evidenza.pozzetto + '"]');
      if (bersaglio && bersaglio.isConnected !== false) {
        statoVista.centro = m.centro;
        if (bersaglio.scrollIntoView) bersaglio.scrollIntoView({block: 'center', inline: 'center'});
        bersaglio.focus({preventScroll: true});
      }
    } else if (etichettaFocus) {
      var campi = radice.querySelectorAll('[aria-label]');
      for (var i = 0; i < campi.length; i++) if (campi[i].getAttribute('aria-label') === etichettaFocus) {
        campi[i].focus({preventScroll: true});
        if (selezione && campi[i].setSelectionRange) campi[i].setSelectionRange(selezione[0], selezione[1], selezione[2]);
        break;
      }
    }
  }
  var disiscrivi = m.iscrivi(disegna);
  disegna();
  return {ferma: function () {
    if (viewport) { statoVista.x = viewport.scrollLeft; statoVista.y = viewport.scrollTop; }
    disiscrivi();
  }, aggiorna: m.aggiorna, centra: centro, monta: disegna};
}

return { modelloAttuale: modelloAttuale, creaAttuale: creaAttuale, sequenza: sequenza, statoA: statoA, elencoPlateau: elencoPlateau, coordinatePozzetto: coordinatePozzetto, crea: crea, COLORI: COLORI, calcolaBordo: calcolaBordoPlateauJs };
});
