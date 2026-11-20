/* Strumenti «dopo il campo» di Fejalog: l'interfaccia. Carica il backup, lo verifica e permette tutte le azioni dopo il
   campionamento, nel browser: niente parte verso nessun server. Moduli: zip, registro, progetto, confronto, stato,
   modifiche, azioni (e il motore: motore.js, xlsx.js, fine_lavori.js). Niente ?. e ?? */
(function () {
'use strict';
var Dominio = window.FejDominio, Conf = window.FejConfronto, Plateau = window.FejPlateau, Zip = window.FejZip, Progetto = window.FejProgetto, Stato = window.FejStato,
  Mod = window.FejModifiche, Az = window.FejAzioni, M = window.AccMotore, FL = window.FineLavori;

Az.configuraDriver(FL);
var S = { P: null, stato: null, ap: null, esito: null, motoreArvet: '', scheda: 'carica', cerca: '', tipoAperto: null, aperta: null,
  confr: { etichetta: '', cifre: '', sesso: '', specie: '' }, attribuendo: null, erroreMotore: false, messaggio: '', ignoraVerifica: false,
  cercaProvette: '', filtroSpecieProvette: '', filtroStabProvette: '', filtroStatoProvette: '', filtroCategoriaProvette: '',
  apertaProvetta: null, modificandoProvetta: null, annullandoProvetta: null,
  dueTrentatreFinali: [], backupRiconciliatoZip: null, resocontoRiconciliazione: null };
function compattaAttuale() { return impostazioneAttuale('chiudi_buchi'); }
function riordinoIniziato() { return impostazioneAttuale('riordino_iniziato'); }
/* Dal risultato completo se è aggiornato, altrimenti dalle impostazioni lette col backup e dalle azioni applicate: così la
   Sistemazione non rifà il risultato (secondi sul PC dell'ASL) per sapere due impostazioni. */
function impostazioneAttuale(k) {
  if (S.ap && !S.apVecchio) return !!S.ap.impostazioni[k];
  var v = !!(S.P && S.P.impostazioniIniziali && S.P.impostazioniIniziali[k]), az = [];
  try { az = S.banco ? S.banco.azioni() : []; } catch (e) { az = []; }
  az.forEach(function (a) {
    if (k === 'chiudi_buchi' && a.tipo === 'chiudi_buchi') v = !!a.valore;
    if (k === 'riordino_iniziato' && ['riordino', 'spostamento', 'scambio', 'spunta', 'annullo_scambio'].indexOf(a.tipo) >= 0) v = true;
  });
  return v;
}
var radice = document.getElementById('fejalog-strumenti');
if (!radice) return;
var pc = radice.getAttribute('data-regia-locale') === 'true' ? window.FejRegiaPc.crea(window.fetch.bind(window)) : null;
var collegatoPc = false, occupatoPc = false;
function errorePc(e) {
  if (e.statoHttp === 403) { collegatoPc = false; S.scheda = 'carica'; }
  S.messaggio = e.message;
}

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
  var doc = dove || document, nav = doc.defaultView ? doc.defaultView.navigator : navigator;
  function fatto(ok) { S.messaggio = ok ? 'Copiato: ' + (testo.length > 60 ? testo.slice(0, 60) + '…' : testo) : 'Non riesco a usare gli appunti: seleziona e copia a mano.'; messaggio(); }
  if (nav.clipboard && nav.clipboard.writeText) { nav.clipboard.writeText(testo).then(function () { fatto(true); }, function () { vecchio(); }); return; }
  vecchio();
  function vecchio() {
    var t = doc.createElement('textarea'); t.style.cssText = 'position:fixed;opacity:0'; t.value = testo; doc.body.appendChild(t); t.select();
    var ok = false; try { ok = doc.execCommand('copy'); } catch (e) { ok = false; }
    doc.body.removeChild(t); fatto(ok);
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

/* ---- lo stato e il calcolo ----
   Una sessione sola sul backup (S.banco, 2026-11-13): si apre una volta, ogni azione scrive solo i suoi eventi. Il risultato
   completo (S.ap) si ricalcola solo per le schede che lo mostrano; i file di fine lavori (S.esito) solo per Snippet,
   Uscite ed Esporta. Prima ogni clic rigiocava tutte le azioni due volte e rifaceva tutti i file. */
function ricalcola(completo) {
  if (!S.P) return;
  try {
    S.dueTrentatreFinali = []; // I numeri finali dipendono da tutte le azioni.
    // la sessione aperta leggendo il backup si usa una volta; dopo un «Annulla» se ne apre una nuova sullo stesso backup,
    // senza rileggere il progetto
    var az = S.stato.azioni();
    if (S.P._banco) { S.banco = S.P._banco; S.P._banco = null; S.banco.applicaSalvate(az); }
    else if (S.banco && S.bancoDi === S.P) S.banco = S.banco.riparti(az);
    else S.banco = Dominio.apriBanco(S.P, az);
    S.bancoDi = S.P;
    bancoUI.dest = {}; // la sessione è nuova: i posti calcolati prima non valgono più
    var tenute = S.banco.azioni().map(function (a) { return a.id; });
    var scartate = S.stato.azioni().filter(function (a) { return tenute.indexOf(a.id) < 0; });
    if (scartate.length) S.messaggio = scartate.length === 1 ? 'Un\'azione salvata non si applica più a questo backup.' : scartate.length + ' azioni salvate non si applicano più a questo backup.';
    // in Sistemazione e Soluzioni il risultato completo si rifà solo quando una scheda lo chiede (preparaScheda), salvo che
    // l'azione tolta cambiasse le impostazioni lette da qui
    if (!completo && SENZA_RISULTATO[S.scheda]) { S.apVecchio = !!S.ap; S.esito = null; S.riordinoCache = null; plateauStaccatoAggiornato(); }
    else aggiornaRisultato();
    sistUI.doveMov = {};
  } catch (e) { S.messaggio = 'Calcolo non riuscito: ' + e.message; S.esito = null; }
  disegna();
}
function aggiornaRisultato() {
  S.ap = S.banco.risultato(); S.apVecchio = false; S.esito = null; S.riordinoCache = null;
  modelloPlateau.aggiorna(S.ap.plateauAttuale || [], {serie: S.ap.seriePlateau, verso: S.ap.impostazioni.verso_riempimento, sequenza: S.ap.impostazioni.problematici_in_sequenza});
}
/* La finestra del plateau staccata (secondo schermo) mostra le posizioni attuali anche mentre si lavora in Sistemazione:
   se è aperta, il risultato si rifà a ogni azione (revisione 8). */
function plateauStaccatoAggiornato() {
  if (typeof finestraPlateau !== 'undefined' && finestraPlateau && !finestraPlateau.closed && S.banco) aggiornaRisultato();
}
/* Risultato e file di fine lavori solo quando la scheda li mostra. */
var SENZA_RISULTATO = { carica: true, sistema: true, banco: true };
function preparaScheda() {
  if (!S.banco) return;
  try {
    // Carica, Soluzioni e Sistemazione lavorano sulla sessione aperta: il risultato completo (secondi sul PC dell'ASL) solo
    // quando serve, e le altre schede lo rifanno se è vecchio o non c'è
    if ((S.apVecchio || !S.ap) && !SENZA_RISULTATO[S.scheda]) aggiornaRisultato();
    if (!S.esito && S.ap && ['snippet', 'uscite', 'esporta'].indexOf(S.scheda) >= 0)
      S.esito = Az.calcola(S.P, S.stato.azioni(), { FineLavori: FL, M: M, motoreArvet: S.motoreArvet, proiezione: S.ap });
  } catch (e) { S.messaggio = 'Calcolo non riuscito: ' + e.message; S.esito = null; }
}
function guidaRiordino() {
  if (!S.riordinoCache) S.riordinoCache = S.banco.riordino();
  return S.riordinoCache;
}
/* Un'azione sulla sessione aperta: se il dominio la rifiuta non lascia traccia. */
function applicaSullaSessione(a) {
  var r = S.banco.applica(a);
  if (!r.ok) return r.motivo || 'azione rifiutata';
  S.stato.sostituisci(S.stato.azioni().concat([a]));
  S.dueTrentatreFinali = []; S.esito = null; S.riordinoCache = null; S.apVecchio = true;
  bancoUI.dest = {}; // con «chiudi i buchi» i posti delle altre provette possono cambiare
  sistUI.doveMov = {};
  plateauStaccatoAggiornato();
  Disco.azione();
  return null;
}
function azione(tipo, dati) {
  var a = Object.assign({ id: Stato.uuid(), tipo: tipo, ts: new Date().toISOString() }, dati);
  try {
    var no = applicaSullaSessione(a);
    if (no) { S.messaggio = no; messaggio(); return false; }
    disegna(); return true;
  } catch (e) { S.messaggio = e.message; messaggio(); return false; }
}
/* Togliere un'azione già fatta riapre la sessione dalle azioni rimaste. */
function togli(id) {
  var a = S.stato.azioni().filter(function (x) { return x.id === id; })[0];
  S.stato.rimuovi(id); Disco.azione();
  ricalcola(!!a && ['chiudi_buchi', 'riordino', 'spostamento', 'scambio', 'spunta', 'annullo_scambio'].indexOf(a.tipo) >= 0);
}

/* ---- schede ---- */
/* Le schede (revisione dell'utente, 2026-11-13: «troppo complesso»; seconda revisione del 14/11: «Problemi» diventa
   «Tipologie», il colpo d'occhio, coi «Non trovati» come sezione «Assenti»; il Banco si chiama «Soluzioni»; Provette e
   Statistiche sotto «Altri strumenti»). Gli identificativi interni delle schede restano. */
/* Dopo il campo del 16/11 (utente, 2026-11-17: «troppe interfacce per fare la stessa cosa»): una sola scheda
   «Sistemazione», in quattro fasi; Tipologie, Soluzioni, Riordino e Plateau restano fra gli altri strumenti durante la
   prova. */
var SCHEDE = [['carica', 'Carica'], ['avvisi', 'Avvisi'], ['sistema', 'Sistemazione'], ['fuori', 'Fuori progetto'], ['snippet', 'Snippet ARVET'], ['uscite', 'Uscite'], ['esporta', 'Esporta per l\'app']];
var SCHEDE_ALTRE = [['problemi', 'Tipologie'], ['banco', 'Soluzioni'], ['riordino', 'Riordino'], ['plateau', 'Plateau'], ['provette', 'Provette'], ['statistiche', 'Statistiche']];
var tabs = h('div', { class: 'fej-tabs', role: 'tablist' });
var corpo = h('div', { class: 'fej-corpo' });
var barra = h('div', { class: 'fej-barra', id: 'fej-barra' });
radice.appendChild(tabs); radice.appendChild(barra); radice.appendChild(msgEl); radice.appendChild(corpo);

function disegna() {
  preparaScheda();
  if (plateauPrincipale) { plateauPrincipale.ferma(); plateauPrincipale = null; }
  tabs.textContent = '';
  function tastoScheda(dove, s) {
    dove.appendChild(h('button', { type: 'button', role: 'tab', 'aria-selected': S.scheda === s[0] ? 'true' : 'false', class: S.scheda === s[0] ? 'fej-tab fej-attiva' : 'fej-tab',
      disabled: s[0] !== 'carica' && (!S.P || !verificaAmmessa()), onclick: function () { S.scheda = s[0]; disegna(); } }, s[1]));
  }
  SCHEDE.filter(function (s) { return !pc || !!S.P || s[0] === 'carica'; }).forEach(function (s) { tastoScheda(tabs, s); });
  if (S.P) {
    var altre = h('div', { class: 'fej-tabs-altre', role: 'tablist', 'aria-label': 'Altri strumenti' }, h('span', { class: 'fej-guida' }, 'Altri strumenti: '));
    SCHEDE_ALTRE.forEach(function (s) { tastoScheda(altre, s); });
    tabs.appendChild(altre);
  }
  corpo.textContent = '';
  // Campionamento dimenticato aperto sul tablet (utente, 13/11): si lavora lo stesso; la chiusura resta del tablet,
  // che la propone quando importa le modifiche del sito
  // le impostazioni del risultato, o quelle lette col backup se il risultato non è ancora calcolato (Carica, Sistemazione)
  var impD = S.ap && S.ap.impostazioni || S.P && S.P.impostazioniIniziali;
  if (S.P && impD && impD.chiusura_virtuale_non_riuscita && !pc)
    corpo.appendChild(h('p', { class: 'fej-avviso', role: 'status', id: 'fej-campionamento-aperto' }, 'Nel backup il campionamento è ancora aperto e qui non si può chiudere ' +
      '(la Regia di questo backup non può farlo). Si può guardare, ma per lavorare chiudi il campionamento sul tablet e salva un backup nuovo.'));
  else if (S.P && impD && impD.fase === 'campionamento_aperto' && !pc)
    corpo.appendChild(h('p', { class: 'fej-avviso', role: 'status', id: 'fej-campionamento-aperto' }, 'Nel backup il campionamento è ancora aperto: qui puoi lavorare lo stesso, come se fosse chiuso. ' +
      'Per riportare le modifiche nell’app il campionamento va chiuso sul tablet, con la sua conferma: dalla 0.5.7 te lo propone l’importazione. ' +
      'Se dopo questo backup qualcuno ha prelevato ancora, salva un backup nuovo dal tablet.'));
  aggiornaBarra();
  var f = { carica: schedaCarica, avvisi: schedaAvvisi, sistema: schedaSistemazione, fuori: schedaFuoriProgetto, banco: schedaBanco, provette: schedaProvette, problemi: schedaProblemi, nontrovati: schedaNonTrovati, riordino: schedaRiordino, plateau: schedaPlateau, statistiche: schedaStatistiche, snippet: schedaSnippet, uscite: schedaUscite, esporta: schedaEsporta }[S.scheda];
  corpo.appendChild(f());
  if (plateauPrincipale) plateauPrincipale.monta();
  messaggio();
}

/* Con la verifica fallita si lavora solo dopo la conferma esplicita nella scheda Carica. */
function verificaAmmessa() { return !!S.P && (S.P.verifica.ok || S.ignoraVerifica); }
function nomeUtente() { try { return localStorage.getItem('fejalog:nome') || ''; } catch (e) { return ''; } }
function salvaNome(v) { try { localStorage.setItem('fejalog:nome', v); } catch (e) { /* niente */ } }

function apriProgetto(P) {
  var precedenti = pc && S.P && S.P.pacchetto.id === P.pacchetto.id && S.P.pacchetto.sha256 === P.pacchetto.sha256 && S.stato ? S.stato.azioni() : [];
  if (S.P && S.P.pacchetto.id !== P.pacchetto.id) riordinoUI = {destinazioni: {}, selezionate: {}, esiti: {}, conferma: null, inMano: ''};
  if (S.P && (S.P.pacchetto.id !== P.pacchetto.id || S.P.pacchetto.sha256 !== P.pacchetto.sha256)) {
    if (plateauPrincipale) plateauPrincipale.ferma();
    if (plateauStaccato) plateauStaccato.ferma();
    if (finestraPlateau && !finestraPlateau.closed) finestraPlateau.close();
    plateauPrincipale = null; plateauStaccato = null; finestraPlateau = null;
    modelloPlateau = Plateau.modelloAttuale();
  }
  S.P = P; S.stato = Stato.crea(P.chiave);
  if (pc) {
    var importate = Object.create(null), unite = [], viste = Object.create(null);
    P.eventi.forEach(function (e) { if (e.dati && e.dati.id_modifica) importate[e.dati.id_modifica] = true; });
    S.stato.azioni().concat(precedenti).forEach(function (a) {
      if (!importate[a.id] && !viste[a.id]) { viste[a.id] = true; unite.push(a); }
    });
    S.stato.sostituisci(unite);
  }
  S.dueTrentatreFinali = []; S.apertaProvetta = null; S.modificandoProvetta = null; S.annullandoProvetta = null;
  S.filtroStabProvette = ''; S.ap = null; S.esito = null; S.banco = null; S.riordinoCache = null; S.apVecchio = false; S.verificaBdnTesti = []; S.cambiBdn = null;
  bancoUI.uid = null; bancoUI.cerca = ''; bancoUI.risultati = null; bancoUI.dest = {}; bancoUI.aperto = null; bancoUI.motivo = '';
  var pendenti = P.modifichePendenti;
  if (pendenti) {
    if (pendenti.formato !== 'fejalog-modifiche' || !pendenti.origine ||
        pendenti.origine.pacchetto_id !== P.pacchetto.id || pendenti.origine.pacchetto_sha256 !== P.pacchetto.sha256) throw new Error('Le modifiche allegate sono di un altro progetto.');
    var azioni = S.stato.azioni().slice(), perId = Object.create(null);
    azioni.forEach(function (a) { perId[a.id] = a; });
    (pendenti.azioni || []).forEach(function (a) {
      if (perId[a.id] && window.FejRegistro.jcs(perId[a.id]) !== window.FejRegistro.jcs(a)) throw new Error('Conflitto fra le modifiche allegate e quelle nel browser.');
      if (!perId[a.id]) { azioni.push(a); perId[a.id] = a; }
    });
    S.stato.sostituisci(azioni);
  }
}

function schedaCarica() {
  var d = h('div');
  if (pc) {
    d.appendChild(h('p', null, 'Pagina dal tablet: carica il backup corrente e invia le modifiche alla Regia. Dopo il PIN, accetta le modifiche per questa sessione sul tablet.'));
    if (!collegatoPc) {
      var pin = window.FejRegiaPc.campiPin(document);
      d.appendChild(h('form', { onsubmit: function (ev) {
        ev.preventDefault(); if (occupatoPc) return;
        var valore = pin.valore(); pin.svuota(); occupatoPc = true;
        pc.accesso(valore).then(function () { collegatoPc = true; caricaDalTablet(); }, function (e) { occupatoPc = false; errorePc(e); disegna(); });
      } }, pin.elemento, ' ', h('button', { type: 'submit', disabled: occupatoPc }, 'Collega al tablet')));
    } else d.appendChild(h('button', { type: 'button', disabled: occupatoPc, onclick: caricaDalTablet }, 'Carica il backup corrente dal tablet'));
    if (occupatoPc) d.appendChild(h('p', { role: 'status' }, 'Collegamento al tablet…'));
  }
  d.appendChild(h('p', null, 'Scegli uno o più file zip di backup di Fejalog (quello salvato dalla Regia, lo zip di fine lavori, oppure più backup di device che hanno lavorato isolati da riconciliare). I file restano sul tuo computer: la pagina li legge qui, senza mandarli da nessuna parte.'));
  d.appendChild(h('p', { class: 'fej-avviso' }, 'Il backup contiene la chiave della seduta: tienilo per te.'));
  d.appendChild(h('input', { type: 'file', multiple: true, accept: '.zip,application/zip', 'aria-label': 'File di backup', onchange: function (ev) {
    var files = Array.prototype.slice.call(ev.target.files || []);
    if (!files.length) return;
    if (files.length === 1) {
      S.messaggio = 'Leggo e verifico il backup…'; messaggio();
      S.resocontoRiconciliazione = null; S.backupRiconciliatoZip = null;
      files[0].arrayBuffer().then(leggiBackup).catch(function (e) { S.messaggio = 'Non riesco a leggere il backup: ' + e.message; messaggio(); });
    } else {
      S.messaggio = 'Riconcilio i ' + files.length + ' backup dello stesso progetto…'; messaggio();
      Promise.all(files.map(function (f) { return f.arrayBuffer(); })).then(function (buffers) {
        return Progetto.riconciliaBackup(buffers, { nome: nomeUtente() });
      }).then(function (ris) {
        apriProgetto(ris.P);
        S.ignoraVerifica = false;
        S.resocontoRiconciliazione = ris.resoconto;
        S.backupRiconciliatoZip = ris.zipBytes;
        S.messaggio = '✓ Riconciliati ' + ris.resoconto.backupUniti + ' backup: ' + ris.resoconto.eventiTotali + ' eventi consolidati (impronta ' + ris.resoconto.impronta.slice(0, 6).toUpperCase() + ').';
        if (ris.P.verifica.ok) attendiMotore(); else { S.esito = null; S.ap = null; disegna(); }
      }).catch(function (e) { S.messaggio = 'Riconciliazione non riuscita: ' + e.message; messaggio(); });
    }
  } }));
  d.appendChild(h('p', null, h('label', null, 'Il tuo nome (firma le registrazioni tardive e le azioni): ', h('input', { type: 'text', value: nomeUtente(), oninput: function (ev) { salvaNome(ev.target.value); } }))));
  
  if (S.resocontoRiconciliazione && S.backupRiconciliatoZip) {
    var boxRic = h('div', { class: 'fej-ok', style: 'padding: .6rem; margin-bottom: 1rem; border: 1px solid currentColor;' });
    boxRic.appendChild(h('strong', null, '✓ Riconciliazione completata con successo: '));
    boxRic.appendChild(document.createTextNode(S.resocontoRiconciliazione.backupUniti + ' backup uniti, ' + S.resocontoRiconciliazione.eventiTotali + ' eventi consolidati da ' + S.resocontoRiconciliazione.device + ' device (impronta ' + S.resocontoRiconciliazione.impronta.slice(0, 6).toUpperCase() + '). '));
    boxRic.appendChild(h('button', {
      type: 'button',
      onclick: function () {
        scarica('fejalog_backup_riconciliato_' + S.resocontoRiconciliazione.impronta.slice(0, 6).toUpperCase() + '.zip', 'application/zip', S.backupRiconciliatoZip);
      }
    }, 'Scarica backup riconciliato (zip)'));
    d.appendChild(boxRic);
  }

  var P = S.P;
  if (!P) return d;
  var v = P.verifica;
  d.appendChild(h('h3', null, 'Verifica del registro'));
  if (v.ok) d.appendChild(h('p', { class: 'fej-ok' }, '✓ Registro intatto: ' + v.eventi + ' eventi di ' + v.device + ' device, impronta ' + v.impronta.slice(0, 6).toUpperCase() + '.'));
  else {
    d.appendChild(h('p', { class: 'fej-errore' }, '✗ Il backup non torna: qualcosa è stato modificato o è incompleto.'));
    d.appendChild(h('ul', null, v.errori.slice(0, 12).map(function (e) { return h('li', null, e); })));
    d.appendChild(h('label', null, h('input', { type: 'checkbox', checked: S.ignoraVerifica, onchange: function (ev) { S.ignoraVerifica = ev.target.checked; if (S.ignoraVerifica) attendiMotore(); else { S.esito = null; S.ap = null; disegna(); } } }), ' Ho capito, voglio usarlo lo stesso'));
  }
  d.appendChild(h('h3', null, 'Progetto'));
  var m = P.manifesto;
  d.appendChild(h('ul', null,
    h('li', null, (m.seduta && m.seduta.nome) + ' · ' + ((m.seduta && m.seduta.descrizione) || '')),
    h('li', null, 'Salvato da ' + ((m.salvato_da && m.salvato_da.nome) || '?') + (m.salvato_da && m.salvato_da.ruolo === 'R' ? ' (Regia)' : '') + ' il ' + (m.creato_il || '')),
    P.esporti.map(function (e) { return h('li', null, e.codice + ': ' + (e.export.records || []).length + ' provette'); })));
  
  var pBottoni = h('p');
  if (S.banco || (S.ap && S.ap.backupFiles)) {
    pBottoni.appendChild(h('button', {
      type: 'button',
      onclick: function () {
        if (S.banco && (S.apVecchio || !S.ap)) aggiornaRisultato();
        if (!S.ap || !S.ap.backupFiles) return;
        var voci = Object.keys(S.ap.backupFiles).sort().map(function (k) { return { name: k, data: S.ap.backupFiles[k] }; });
        var nomeZip = 'fejalog_backup_' + String((P.manifesto.seduta && P.manifesto.seduta.nome) || 'progetto').replace(/[^A-Za-z0-9_-]+/g, '_') + '_aggiornato.zip';
        scarica(nomeZip, 'application/zip', Zip.scrivi(voci));
      }
    }, 'Scarica backup e modifiche (zip)'));
    pBottoni.appendChild(document.createTextNode(' '));
  }
  pBottoni.appendChild(h('button', { type: 'button', onclick: function () { if (confirm('Ricominciare da capo? Si perdono le azioni fatte su questo backup.')) { S.stato.azzera(); ricalcola(); } } }, 'Ricomincia da capo'));
  d.appendChild(pBottoni);
  if (S.banco) d.appendChild(sezioneBdnUnica());
  if (S.banco) d.appendChild(h('details', { class: 'fej-bdn-separati', id: 'fej-bdn-separati' }, h('summary', null, 'Gli snippet separati (verifica, uscite), se serve'),
    sezioneUsciteModello(), sezioneVerificaBdn()));
  return d;
}

/* Un file della BDN, qualunque dei due: si riconosce dal «formato» (uscite per modello o verifica dei contrassegni), così non
   importa in quale dei due campi lo si mette. */
/* Il giorno del campionamento (gg/mm/aaaa): quello del primo prelievo registrato nel backup. */
function giornoCampionamento() {
  var ev = (S.P && S.P.eventi) || (S.ap && S.ap.eventiEfficaci) || [], primo = '';
  ev.forEach(function (e) { if (e.tipo === 'PROVETTA_REGISTRATA' && e.ts && (!primo || String(e.ts) < primo)) primo = String(e.ts); });
  var g = primo.slice(0, 10).split('-');
  return g.length === 3 ? g[2] + '/' + g[1] + '/' + g[0] : '';
}
function dopoIlCampionamento(r) {
  return r && r.dopo_il_campionamento ? ' ATTENZIONE: ' + r.dopo_il_campionamento + ' uscite hanno una data successiva al campionamento' + (r.giorno ? ' (' + r.giorno + ')' : '') + ' e non valgono: quei capi c’erano.' : '';
}
function caricaDallaBdn(t, daDove) {
  var formato = '';
  try { formato = JSON.parse(String(t).replace(/^\uFEFF/, '')).formato || ''; } catch (e) { /* lo dice il dominio */ }
  var r;
  if (formato === 'fejalog-uscite-modello') {
    r = S.banco.caricaUsciteModello(t);
    if (r.errore) { S.messaggio = r.errore; messaggio(); return null; }
    aggiornaAnagrafeBdn();
    S.cambiBdn = { titolo: 'Uscite per modello ' + (daDove || 'caricate') + ' (' + r.caricate + ' capi): che cosa è cambiato', cambi: r.cambi, dove: 'uscite' };
    S.messaggio = '✓ Uscite per modello caricate: ' + r.caricate + ' capi (in tutto ' + r.totale + ').' + dopoIlCampionamento(r);
  } else {
    r = S.banco.caricaVerificaBdn(t);
    if (r.errore) { S.messaggio = r.errore; messaggio(); return null; }
    aggiornaAnagrafeBdn();
    S.cambiBdn = { titolo: 'Verifica in BDN ' + (daDove || 'caricata') + ' (' + r.caricati + ' contrassegni): che cosa è cambiato', cambi: r.cambi, dove: 'verifica' };
    S.messaggio = '✓ Dati della BDN caricati: ' + r.caricati + ' contrassegni. Li trovi nella scheda di ogni provetta.';
  }
  disegna();
  return r;
}
/* Il file scelto in uno dei due campi: il .json dello snippet, oppure il modello .xlsx/.csv compilato a mano (utente, 2026-11-18:
   «un file intermedio che, se la BDN cambia e lo snippet non serve più, si riempie a mano copiando dalla BDN»). */
function leggiFileBdn(f) {
  if (!f) return;
  if (!f.name || /\.json$/i.test(f.name)) { f.text().then(function (t) { caricaDallaBdn(t); }); return; }
  var Tab = window.FejTabella;
  if (!Tab) { S.messaggio = 'La lettura dei modelli compilati a mano non è disponibile in questa pagina.'; messaggio(); return; }
  f.arrayBuffer().then(function (b) { return Tab.leggi(f.name, b); }).then(function (righe) {
    var tipo = Tab.riconosci(righe);
    if (!tipo) throw new Error(righe.length ? 'non riconosco le colonne: usa il modello scaricato da qui' : 'nessuna riga compilata (le righe ESEMPIO non contano)');
    var d = new Date(), p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    var timbro = '' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '_' + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds());
    var r = tipo === 'uscite' ? Tab.usciteModello(righe, timbro) : Tab.verificaBdn(righe, timbro);
    if (r.errori.length) { S.messaggio = 'Il file compilato ha ' + r.errori.length + ' righe da correggere (non ho caricato niente): ' + r.errori.slice(0, 5).join('; ') + (r.errori.length > 5 ? '…' : '') + '.'; messaggio(); return; }
    caricaDallaBdn(JSON.stringify(r.file), 'compilate a mano');
  }).catch(function (e) { S.messaggio = 'Non riesco a leggere ' + f.name + ': ' + e.message + '.'; messaggio(); });
}
/* Il modello .xlsx da compilare a mano, generato qui (stesse colonne ed esempi dei file in strumenti/modelli/). */
function tastoModello(tipo) {
  return h('button', { type: 'button', class: 'fej-copia', onclick: function () {
    var Tab = window.FejTabella, X = window.AccXlsx;
    if (!Tab || !X) { S.messaggio = 'Modello non disponibile in questa pagina.'; messaggio(); return; }
    scarica(Tab.MODELLI[tipo].nome + '.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', X.xlsxBuild(Tab.fogliModello(tipo)));
  } }, 'Scarica il modello da compilare a mano (.xlsx)');
}
/* Che cosa è cambiato nei dati dopo un caricamento dalla BDN (utente, 2026-11-18): resta in pagina finché non se ne carica un altro. */
function riquadroCambi(titolo, c) {
  var d = h('div', { class: 'fej-banco-proposta', id: 'fej-cambi-bdn', role: 'status' });
  d.appendChild(h('p', null, h('strong', null, titolo)));
  if (!c) { d.appendChild(h('p', null, 'Riepilogo non disponibile.')); return d; }
  var righe = [];
  righe.push('Capi assenti: ' + c.assenti_prima + ' → ' + c.assenti_dopo + (c.non_piu_assenti.length ? ' (non più assenti: ' + c.non_piu_assenti.join(', ') + ')' : '') + (c.nuovi_assenti.length ? ' (nuovi assenti: ' + c.nuovi_assenti.join(', ') + ')' : ''));
  if (c.capi_aggiunti) righe.push('Capi aggiunti all’anagrafe del progetto: ' + c.capi_aggiunti);
  if (c.entrate.length) righe.push('Provette entrate fra i fuori registro: ' + c.entrate.map(function (x) { return x.etichetta + ' (' + x.dopo + ')'; }).join('; '));
  if (c.uscite.length) righe.push('Provette non più fuori registro: ' + c.uscite.map(function (x) { return x.etichetta + ' (era: ' + x.prima + ')'; }).join('; '));
  c.cambiate.forEach(function (x) { righe.push('Provetta ' + x.etichetta + ': ' + x.prima + ' → ' + x.dopo + (x.attribuzione_caduta ? ' — l’attribuzione di prima non vale più: va decisa di nuovo' : '')); });
  if (!c.non_piu_assenti.length && !c.nuovi_assenti.length && !c.capi_aggiunti && !c.entrate.length && !c.uscite.length && !c.cambiate.length) righe.push('Nessun cambiamento nei dati del progetto.');
  d.appendChild(h('ul', null, righe.map(function (r) { return h('li', null, r); })));
  return d;
}

/* ---- Uscite per modello degli ultimi 7 giorni (utente, 2026-11-18) ----
   La BDN si aggiorna fino a 7 giorni dopo il modello di accompagnamento: un capo mandato via da pochi giorni risulta ancora
   presente nel registro e gli si potrebbe attribuire la provetta di un animale senza marche. Lo snippet per ogni stabilimento
   estrae dalla BDN i modelli dell'ultima settimana; il file (fejalog-uscite-modello) si carica qui: quei capi escono dai
   presenti, quindi non sono più capi assenti compatibili. Meglio caricarlo prima della Sistemazione. */
/* Gli stabilimenti e la finestra delle uscite e degli ingressi per modello: finisce il giorno del campionamento (primo
   prelievo), non oggi, e comincia 7 giorni prima della preparazione del pacchetto (i registri sono di quel giorno). */
function finestraModelli() {
  var stabilimenti = (S.P.pacchetto.config && S.P.pacchetto.config.stabilimenti_lavoro || []).map(function (x) { return x.codice; });
  if (!stabilimenti.length) stabilimenti = (S.P.esporti || []).map(function (x) { return x.codice; });
  var prep = String(S.P.pacchetto.creato_il || '').slice(0, 10).split('-'), dal = '';
  if (prep.length === 3) { var dp = new Date(+prep[0], +prep[1] - 1, +prep[2]); dp.setDate(dp.getDate() - 7); dal = ('0' + dp.getDate()).slice(-2) + '/' + ('0' + (dp.getMonth() + 1)).slice(-2) + '/' + dp.getFullYear(); }
  return { stabilimenti: stabilimenti, giorni: 7, dal: dal, al: giornoCampionamento() };
}
/* Un file della BDN (lo snippet unico, o uno dei tre separati): prima le uscite, poi la verifica con gli ingressi (utente,
   2026-11-20: «un solo json da caricare»). Gli ingressi già nei registri del progetto non si aggiungono. */
function caricaFileBdn(testo, daDove) {
  var F = window.FejBdnFile, parti;
  if (!F) return caricaDallaBdn(typeof testo === 'string' ? testo : JSON.stringify(testo), daDove);
  try { parti = F.scomponi(testo); } catch (e) { S.messaggio = e.message; messaggio(); return null; }
  if (parti.formato !== F.FORMATO && !parti.ingressi) return caricaDallaBdn(typeof testo === 'string' ? testo : JSON.stringify(testo), daDove);
  var detti = [], cambi = [];
  if (parti.uscite && parti.uscite.uscite && parti.uscite.uscite.length) {
    var ru = S.banco.caricaUsciteModello(JSON.stringify(parti.uscite));
    if (ru.errore) detti.push('uscite non caricate: ' + ru.errore);
    else { detti.push(ru.caricate + ' capi usciti per modello' + dopoIlCampionamento(ru)); cambi = cambi.concat(ru.cambi || []); }
  } else if (parti.uscite) detti.push('nessuna uscita per modello');
  var noti = [];
  ['pecore', 'capre'].forEach(function (sp) { ((S.P.pacchetto.registri || {})[sp] || []).forEach(function (r) { noti.push(String(r.codice_stabilimento || '').toUpperCase() + '|' + String(r.contrassegno || '').replace(/\s+/g, '').toUpperCase()); }); });
  var vi = F.verificaConIngressi(parti, noti);
  if (vi.file) {
    var rv = S.banco.caricaVerificaBdn(JSON.stringify(vi.file));
    if (rv.errore) detti.push('verifica non caricata: ' + rv.errore);
    else {
      detti.push((parti.verifica ? (parti.verifica.risultati || []).length + ' contrassegni verificati' : 'nessuna verifica') + (parti.ingressi ? ', ' + vi.ingressi + ' capi arrivati per modello' : '') +
        (rv.cambi && rv.cambi.capi_aggiunti != null ? ' (' + rv.cambi.capi_aggiunti + ' righe nell’anagrafe del progetto: i registri caricati hanno la precedenza)' : ''));
      cambi = cambi.concat(rv.cambi || []);
    }
  } else if (parti.ingressi) detti.push('nessun capo arrivato da aggiungere');
  if (parti.ingressi && (vi.saltati.noti || vi.saltati.ripartiti)) detti.push('ingressi già nei registri dello stabilimento d’arrivo: ' + vi.saltati.noti + (vi.saltati.ripartiti ? ', ripartiti dopo: ' + vi.saltati.ripartiti : ''));
  var err = parti.errori || [];
  aggiornaAnagrafeBdn();
  S.cambiBdn = { titolo: 'Dati della BDN ' + (daDove || 'caricati') + ': che cosa è cambiato', cambi: cambi, dove: 'unico' };
  // un errore (sessione scaduta, stabilimento non letto) non deve sembrare «nessuna uscita»: si dice prima di tutto
  S.messaggio = (err.length ? '⚠ ATTENZIONE, la BDN non ha dato tutto: ' + err.join('; ') + '. Rientra nella BDN e rilancia lo snippet. Caricato il resto: ' : '✓ Dati della BDN ' + (daDove || 'caricati') + ': ') + detti.join('; ') + '.';
  disegna();
  return { testo: detti.join('; ') };
}
/* Lo snippet unico (utente, 2026-11-20): verifica dei contrassegni fuori registro, uscite e ingressi per modello, un solo file. */
function sezioneBdnUnica() {
  var d = h('div', { id: 'fej-bdn-unica' });
  d.appendChild(h('h3', null, 'Dati dalla BDN: verifica, uscite e ingressi'));
  var elenco = [];
  try { elenco = S.banco.daVerificareBdn(!!S.verificaBdnTutte); } catch (e) { elenco = []; }
  var fin = finestraModelli();
  d.appendChild(h('p', null, 'Uno snippet solo, da incollare nella console della BDN: cerca i contrassegni fuori registro (' + elenco.length + '), poi legge le uscite e gli ingressi per modello di ' +
    (fin.stabilimenti.join(', ') || 'nessuno stabilimento') + (fin.dal ? ' dal ' + fin.dal : '') + (fin.al ? ' al ' + fin.al + ' (giorno del campionamento)' : ' a oggi') +
    ': la BDN aggiorna il registro fino a 7 giorni dopo il modello. Un solo file da caricare qui sotto; se la BDN è aperta da qui, arriva da solo.'));
  d.appendChild(h('label', null, h('input', { type: 'checkbox', checked: !!S.verificaBdnTutte, onchange: function (ev) { S.verificaBdnTutte = ev.target.checked; disegna(); } }),
    ' Verifica anche le altre provette fuori registro (smarriti, rubati, doppi…)'));
  var cfg = Object.assign({ codici: elenco.map(function (v) { return { contrassegno: v.contrassegno, etichette: v.etichette }; }), data: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    origine: location.origin, base: new URL(base, location.href).href }, fin);
  var url = new URL(base + 'bdn-unico-motore.js', location.href).href, esito = h('span', { role: 'status' });
  var corto = 'window.__BDN_UNICO__ = ' + JSON.stringify(cfg) + ';\nfetch(' + JSON.stringify(url + '?v=' + cfg.data) + ').then(function (r) { if (!r.ok) throw new Error(\'HTTP \' + r.status); return r.text(); }).then(function (t) { new Function(t)(); }).catch(function (e) { console.log(\'Fejalog: non riesco a caricare lo snippet dal sito (\' + e.message + \')\'); });\n';
  d.appendChild(h('p', null,
    h('button', { type: 'button', class: 'md-button md-button--primary', id: 'fej-apri-bdn-unica', onclick: function () { S.finestraBdn = window.open('https://www.vetinfo.it/ovicaprini/home2.pl', 'fejalog_bdn'); } }, '1 · Apri la BDN in una scheda'), ' ',
    h('button', { type: 'button', class: 'md-button md-button--primary', id: 'fej-copia-snippet-unico', onclick: function () {
      navigator.clipboard.writeText(corto).then(function () { esito.textContent = ' Copiato: incollalo nella console della BDN (F12 › Console) e premi Invio.'; }, function () { esito.textContent = ' Non riesco a copiare: usa «Scarica lo snippet».'; });
    } }, '2 · Copia lo snippet'), ' ',
    h('button', { type: 'button', class: 'md-button', onclick: function () { scarica('snippet_bdn_' + cfg.data + '.js', 'text/javascript', corto); } }, 'Scarica lo snippet'), esito));
  if (S.cambiBdn && S.cambiBdn.dove === 'unico') d.appendChild(riquadroCambi(S.cambiBdn.titolo, S.cambiBdn.cambi));
  d.appendChild(h('p', null, h('label', null, 'Il file della BDN (fejalog_bdn_….json, o uno dei file separati): ', h('input', { type: 'file', id: 'fej-bdn-unica-file', accept: '.json,application/json', onchange: function (ev) {
    var f = ev.target.files && ev.target.files[0]; if (f) f.text().then(function (t) { caricaFileBdn(t); });
  } }))));
  var incolla = h('textarea', { id: 'fej-bdn-unica-incolla', rows: 2, style: 'width:100%;box-sizing:border-box', placeholder: 'Oppure incolla qui il risultato copiato dallo snippet («Copia il risultato»)', 'aria-label': 'Risultato della BDN incollato' });
  d.appendChild(incolla);
  d.appendChild(h('p', null, h('button', { type: 'button', onclick: function () { var t = incolla.value.trim(); if (!t) { S.messaggio = 'Incolla prima il risultato copiato dallo snippet.'; messaggio(); return; } caricaFileBdn(t); } }, 'Carica il risultato incollato')));
  return d;
}
/* Il risultato dello snippet unico, se arriva dalla scheda della BDN aperta da qui. */
window.addEventListener('message', function (ev) {
  if (ev.origin !== 'https://www.vetinfo.it' || !ev.data || ev.data.fejalog !== 'bdn-unico' || !ev.data.file) return;
  if (!S.banco) { S.messaggio = 'Dati della BDN arrivati, ma prima carica il backup.'; messaggio(); return; }
  var r = caricaFileBdn(ev.data.file, 'arrivati dalla BDN');
  try { ev.source.postMessage({ fejalog: 'bdn-unico-ricevuto', testo: r ? r.testo : '' }, ev.origin); } catch (e) { /* la scheda può essere chiusa */ }
});
function sezioneUsciteModello() {
  var d = h('div', { id: 'fej-uscite-modello' });
  d.appendChild(h('h3', null, 'Uscite per modello negli ultimi 7 giorni'));
  d.appendChild(h('p', null, 'La BDN si aggiorna fino a 7 giorni dopo il modello di accompagnamento: un capo mandato via da pochi giorni può risultare ancora presente. ' +
    'Per non attribuire la provetta di un animale senza marche (o di un doppio) a un capo che non c’è più, carica qui le uscite per modello dell’ultima settimana di ogni stabilimento: ' +
    'quei capi non sono più proposti come assenti, e se hanno già una provetta vanno fra gli usciti. Meglio prima della Sistemazione. ' +
    'Il file (fejalog_uscite_modello_….json) lo prepara lo snippet per la BDN, uno per stabilimento o tutti insieme.'));
  function carica(t) { caricaDallaBdn(t); }
  if (S.cambiBdn && S.cambiBdn.dove === 'uscite') d.appendChild(riquadroCambi(S.cambiBdn.titolo, S.cambiBdn.cambi));
  d.appendChild(h('p', null, h('label', null, 'Uscite per modello (il .json dello snippet, oppure il modello .xlsx o .csv compilato a mano): ', h('input', { type: 'file', id: 'fej-uscite-modello-file', accept: '.json,.xlsx,.csv,application/json', onchange: function (ev) {
    leggiFileBdn(ev.target.files && ev.target.files[0]);
  } })), ' ', tastoModello('uscite')));
  d.appendChild(h('p', { class: 'fej-tenue' }, 'Se lo snippet non funziona (la BDN cambia), le stesse righe si copiano a mano dalla BDN nel modello: Movimentazioni › Ricerca modelli › Origine, poi i capi di ogni modello.'));
  // lo snippet per la BDN: legge la sezione Movimentazioni (modelli di accompagnamento in uscita), non il registro di stalla
  var stabilimenti = (S.P.pacchetto.config && S.P.pacchetto.config.stabilimenti_lavoro || []).map(function (x) { return x.codice; });
  if (!stabilimenti.length) stabilimenti = (S.P.esporti || []).map(function (x) { return x.codice; });
  // la finestra finisce il giorno del campionamento (primo prelievo), non oggi: un capo uscito dopo c'era ed è stato controllato
  var giornoCamp = giornoCampionamento();
  // dopo il campionamento si va indietro a 7 giorni dalla preparazione del pacchetto (i registri sono di quel giorno), che può
  // essere precedente al campionamento (utente, 2026-11-18)
  var prep = String(S.P.pacchetto.creato_il || '').slice(0, 10).split('-'), dalU = '';
  if (prep.length === 3) { var dp = new Date(+prep[0], +prep[1] - 1, +prep[2]); dp.setDate(dp.getDate() - 7); dalU = ('0' + dp.getDate()).slice(-2) + '/' + ('0' + (dp.getMonth() + 1)).slice(-2) + '/' + dp.getFullYear(); }
  var cfgU = { stabilimenti: stabilimenti, giorni: 7, dal: dalU, al: giornoCamp, data: new Date().toISOString().slice(0, 10).replace(/-/g, ''), origine: location.origin };
  var urlU = new URL(base + 'bdn-uscite-modello-motore.js', location.href).href, esitoU = h('span', { role: 'status' });
  d.appendChild(h('p', { class: 'fej-guida' }, 'Il registro di stalla non è ancora aggiornato nemmeno dai modelli dell’ultima settimana: lo snippet legge la sezione Movimentazioni della BDN, uno stabilimento alla volta (' + (stabilimenti.join(', ') || 'nessuno') + '): i modelli ' + (dalU ? 'dal ' + dalU + ' (7 giorni prima della preparazione del pacchetto) ' : 'dei 7 giorni prima ') + (giornoCamp ? 'al giorno del campionamento (' + giornoCamp + ')' : 'a oggi') + '. Un’uscita con data successiva al campionamento non vale: quel capo c’era.'));
  d.appendChild(h('p', null,
    h('button', { type: 'button', class: 'md-button', id: 'fej-copia-snippet-uscite', onclick: function () {
      var t = 'window.__BDN_USCITE_MODELLO__ = ' + JSON.stringify(cfgU) + ';\nfetch(' + JSON.stringify(urlU + '?v=' + cfgU.data) + ').then(function (r) { if (!r.ok) throw new Error(\'HTTP \' + r.status); return r.text(); }).then(function (t) { new Function(t)(); }).catch(function (e) { console.log(\'Fejalog: non riesco a caricare lo snippet dal sito (\' + e.message + \')\'); });\n';
      navigator.clipboard.writeText(t).then(function () { esitoU.textContent = ' Copiato: incollalo nella console della BDN.'; }, function () { esitoU.textContent = ' Non riesco a copiare: usa «Scarica lo snippet completo».'; });
    } }, 'Copia lo snippet per la BDN'), ' ',
    h('button', { type: 'button', class: 'md-button', onclick: function () {
      fetch(urlU).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); }).then(function (t) {
        scarica('snippet_bdn_uscite_modello_' + cfgU.data + '.js', 'text/javascript', 'window.__BDN_USCITE_MODELLO__ = ' + JSON.stringify(cfgU) + ';\n' + t);
      }).catch(function (e) { esitoU.textContent = ' Non riesco a preparare lo snippet: ' + e.message; });
    } }, 'Scarica lo snippet completo'), ' ',
    h('button', { type: 'button', class: 'md-button', onclick: function () { S.finestraBdn = window.open('https://www.vetinfo.it/ovicaprini/home2.pl', 'fejalog_bdn'); } }, 'Apri la BDN in una scheda'), esitoU));
  var elenco = [];
  try { elenco = S.banco.usciteModello(); } catch (e) { d.appendChild(h('p', { class: 'fej-errore' }, 'Elenco non disponibile: ' + e.message)); return d; }
  if (!elenco.length) { d.appendChild(h('p', { class: 'fej-tenue' }, 'Nessuna uscita per modello caricata.')); return d; }
  var prelevati = elenco.filter(function (u) { return u.prelevato; }), nei = elenco.filter(function (u) { return u.nei_registri; });
  d.appendChild(h('p', { class: prelevati.length ? 'fej-avviso' : 'fej-ok', role: 'status', id: 'fej-uscite-modello-esito' },
    elenco.length + ' capi usciti per modello; ' + nei.length + ' nei registri caricati' + (prelevati.length ? ', di cui ' + prelevati.length + ' già prelevati (la provetta è di un capo che non c’è più: la trovi fra gli usciti).' : ', nessuno già prelevato.')));
  var t = h('table', { class: 'fej-banco-dati' }, h('thead', null, h('tr', null, ['Contrassegno', 'Stabilimento', 'Data modello', 'Uscita', 'Nel progetto'].map(function (x) { return h('th', { scope: 'col' }, x); }))));
  var tb = h('tbody');
  elenco.slice(0, 60).forEach(function (u) {
    tb.appendChild(h('tr', null, h('td', null, u.contrassegno), h('td', null, u.stabilimento), h('td', null, u.data), h('td', null, (u.testo || u.tipo) + (u.destinazione ? ' · ' + u.destinazione : ''), u.modello ? ' ' : '', u.modello ? h('button', { type: 'button', class: 'fej-copia', title: 'Copia il numero del documento', onclick: function () { copia(u.modello); } }, '⧉') : ''),
      h('td', null, u.prelevato ? 'già prelevato (' + u.etichetta.split(' ')[0] + ')' : u.nei_registri ? 'non più fra gli assenti' : 'non nei registri')));
  });
  t.appendChild(tb); d.appendChild(h('div', { class: 'fej-tabella-scorre' }, t));
  if (elenco.length > 60) d.appendChild(h('p', { class: 'fej-tenue' }, 'Primi 60 di ' + elenco.length + '.'));
  return d;
}
/* Il risultato dello snippet delle uscite per modello, se arriva dalla scheda della BDN aperta da qui. */
window.addEventListener('message', function (ev) {
  if (ev.origin !== 'https://www.vetinfo.it' || !ev.data || ev.data.fejalog !== 'uscite-modello' || !ev.data.file) return;
  if (!S.banco) { S.messaggio = 'Uscite per modello arrivate, ma prima carica il backup.'; messaggio(); return; }
  var r = S.banco.caricaUsciteModello(JSON.stringify(ev.data.file));
  if (r.errore) { S.messaggio = r.errore; messaggio(); return; }
  aggiornaAnagrafeBdn();
  S.cambiBdn = { titolo: 'Uscite per modello arrivate dalla BDN (' + r.caricate + ' capi): che cosa è cambiato', cambi: r.cambi, dove: 'uscite' };
  S.messaggio = '✓ Uscite per modello arrivate dalla BDN: ' + r.caricate + ' capi.' + dopoIlCampionamento(r);
  try { ev.source.postMessage({ fejalog: 'uscite-modello-ricevute', caricate: r.caricate }, ev.origin); } catch (e) { /* la scheda può essere chiusa */ }
  disegna();
});

/* ---- Contrassegni fuori progetto (utente, 2026-11-18) ----
   I campioni raccolti con un contrassegno che il progetto non conosce: non è fra i presenti, né fra gli usciti, né negli altri
   stabilimenti caricati. Una tabella con ciò che è stato rilevato in campo e, sotto, lo snippet per completare l'anagrafica
   dalla BDN (lo stesso della scheda Carica) col caricamento del risultato. */
var TIPI_FUORI_PROGETTO = ['NON_IN_ELENCO', 'MARCHE', 'MARCATI_IN_CAMPO', 'ALTRE'];
function schedaFuoriProgetto() {
  var d = h('div', { id: 'fej-fuori-progetto' }), voci = [], ver = {};
  d.appendChild(h('p', { class: 'fej-guida' }, 'Campioni raccolti con un contrassegno che il progetto non conosce: non è fra i presenti, né fra gli usciti, né negli altri stabilimenti caricati. ' +
    'Qui c’è ciò che è stato rilevato in campo; lo snippet qui sotto cerca ogni contrassegno nella BDN e completa l’anagrafica del progetto. Finché l’anagrafica manca, in ARVET vanno inseriti a mano.'));
  try { voci = S.banco.coda().voci.filter(function (v) { return TIPI_FUORI_PROGETTO.indexOf(v.tipo) >= 0 && v.contrassegno && v.stato !== 'tolta' && v.stato !== 'persa'; }); ver = S.banco.verificheBdn(); }
  catch (e) { d.appendChild(h('p', { class: 'fej-errore' }, 'Elenco non disponibile: ' + e.message)); return d; }
  var perCodice = {}, ordine = [];
  voci.forEach(function (v) { var k = v.contrassegno; if (!perCodice[k]) { perCodice[k] = []; ordine.push(k); } perCodice[k].push(v); });
  var cercati = ordine.filter(function (k) { return perCodice[k].some(function (v) { return ver[v.uid] && ver[v.uid].cercato; }); }).length;
  d.appendChild(h('p', { id: 'fej-fuori-progetto-conto', role: 'status', class: ordine.length && cercati < ordine.length ? 'fej-avviso' : 'fej-ok' },
    ordine.length ? ordine.length + ' contrassegni fuori progetto (' + voci.length + ' provette): ' + cercati + ' già cercati in BDN, ' + (ordine.length - cercati) + ' da cercare.' : 'Nessun contrassegno fuori progetto.'));
  if (ordine.length) {
    var t = h('table', { class: 'fej-banco-dati', id: 'fej-fuori-progetto-tabella' }, h('thead', null, h('tr', null, ['Contrassegno', 'Provette', 'Fattispecie', 'Rilevato in campo', 'In BDN', ''].map(function (x) { return h('th', { scope: 'col' }, x); }))));
    var tb = h('tbody');
    ordine.sort().forEach(function (k) {
      var gruppo = perCodice[k], v = gruppo[0], rg = {};
      try { rg = (S.banco.scheda(v.uid, '') || {}).registrato || {}; } catch (e) { rg = {}; }
      var campo = [rg.sesso_corretto || rg.sesso, rg.razza, rg.data_nascita || rg.classe_eta, rg.note].filter(Boolean).join(' · ') || 'niente';
      var esito = ver[v.uid], bdn = esito && esito.cercato ? esito.sintesi + (esito.discordanze && esito.discordanze.length ? ' — ' + esito.discordanze.join('; ') : '') : 'non ancora cercato';
      tb.appendChild(h('tr', null,
        h('td', null, h('code', null, k), ' ', h('button', { type: 'button', class: 'fej-copia', title: 'Copia il contrassegno', 'aria-label': 'Copia il contrassegno ' + k, onclick: function () { copia(k); } }, '⧉'),
          esito && esito.formato ? h('div', { class: 'fej-avviso' }, esito.formato) : ''),
        h('td', null, gruppo.map(function (x) { return x.etichetta.split(' ')[0]; }).join(', ')), h('td', null, gruppo.map(function (x) { return x.titolo; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(', ')),
        h('td', null, campo), h('td', { class: esito && esito.cercato ? null : 'fej-tenue' }, bdn),
        h('td', null, h('button', { type: 'button', class: 'fej-copia', onclick: function () { S.scheda = 'banco'; bancoUI.uid = v.uid; bancoUI.aperto = null; disegna(); } }, 'Apri la scheda'))));
    });
    t.appendChild(tb); d.appendChild(h('div', { class: 'fej-tabella-scorre' }, t));
  }
  d.appendChild(sezioneVerificaBdn());
  return d;
}

/* ---- Verifica dei contrassegni in BDN (utente, 2026-11-14) ----
   L'elenco dei contrassegni fuori registro senza anagrafica BDN nell'app, lo snippet da incollare nella console della BDN
   (bdn-verifica-motore.js: Interrogazioni › Capi e › Identificativi, uno alla volta, sola lettura) e il caricamento del
   file che scarica. I dati compaiono nella scheda di ogni provetta, accanto a quelli scritti in campo. */
function aggiornaAnagrafeBdn() {
  S.stato.sostituisci(S.banco.azioni());
  S.dueTrentatreFinali = []; bancoUI.dest = {};
  aggiornaRisultato();
}
function sezioneVerificaBdn() {
  var d = h('div');
  d.appendChild(h('h3', null, 'Verifica dei contrassegni in BDN'));
  var elenco = [];
  try { elenco = S.banco.daVerificareBdn(!!S.verificaBdnTutte); } catch (e) { d.appendChild(h('p', { class: 'fej-errore' }, 'Elenco non disponibile: ' + e.message)); return d; }
  d.appendChild(h('p', null, 'Per le provette fuori registro di cui l\'app non ha i dati della BDN (contrassegni non registrati, non in elenco, ' +
    'nuove identificazioni in campo, altri stabilimenti, DDA) e per i capi che il registro dà usciti (morti, macellati, trasferiti: la BDN dice se oggi sono vivi, e dove, o morti) lo snippet cerca ogni contrassegno nella BDN, fra i capi e fra gli ' +
    'identificativi, e scarica un file da caricare qui sotto: i capi e le marche disponibili si aggiungono all’anagrafe del progetto. I registri già caricati hanno precedenza. Il confronto coi dati del campo resta nella scheda; l’integrazione va in «Esporta per l’app».'));
  d.appendChild(h('label', null, h('input', { type: 'checkbox', checked: !!S.verificaBdnTutte, onchange: function (ev) { S.verificaBdnTutte = ev.target.checked; disegna(); } }),
    ' Anche le altre provette fuori registro (smarriti, rubati, doppi…)'));
  var cercati = elenco.filter(function (v) { return v.cercato; }).length, strani = elenco.filter(function (v) { return v.avviso_formato; });
  d.appendChild(h('p', null, elenco.length + ' contrassegni da cercare' + (cercati ? ', ' + cercati + ' già cercati' : '') +
    (strani.length ? '; ' + strani.length + ' con un formato inusuale (controlla la lettura)' : '') + '.'));
  if (strani.length) d.appendChild(h('ul', { class: 'fej-avviso' }, strani.slice(0, 20).map(function (v) {
    return h('li', null, v.contrassegno + ' (' + v.etichette.join(', ') + '): ' + v.avviso_formato);
  })));
  if (elenco.length) {
    var cfg = { codici: elenco.map(function (v) { return { contrassegno: v.contrassegno, etichette: v.etichette }; }), data: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      origine: location.origin };
    var urlMotore = new URL(base + 'bdn-verifica-motore.js', location.href).href;
    var esito = h('span', { role: 'status' });
    d.appendChild(h('p', null,
      h('button', { type: 'button', class: 'md-button', onclick: function () {
        navigator.clipboard.writeText(testoCortoVerifica(cfg, urlMotore)).then(function () { esito.textContent = ' Copiato: incollalo nella console della BDN.'; },
          function () { esito.textContent = ' Non riesco a copiare: usa «Scarica lo snippet completo».'; });
      } }, 'Copia lo snippet per la BDN'), ' ',
      h('button', { type: 'button', class: 'md-button', onclick: function () {
        fetch(urlMotore).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); }).then(function (t) {
          scarica('snippet_bdn_verifica_' + cfg.data + '.js', 'text/javascript', 'window.__BDN_VERIFICA__ = ' + JSON.stringify(cfg) + ';\n' + t);
        }).catch(function (e) { esito.textContent = ' Non riesco a preparare lo snippet: ' + e.message; });
      } }, 'Scarica lo snippet completo'), esito));
    d.appendChild(h('p', null, h('button', { type: 'button', class: 'md-button', id: 'fej-apri-bdn', onclick: function () {
      // senza «noopener»: la scheda della BDN deve poter rimandare qui il risultato (postMessage verso questa origine)
      S.finestraBdn = window.open('https://www.vetinfo.it/ovicaprini/home2.pl', 'fejalog_bdn');
    } }, 'Apri la BDN in una scheda'), ' ', h('span', { class: 'fej-tenue' }, 'Aperta da qui, la BDN rimanda il risultato a questa pagina da sola.')));
    d.appendChild(h('p', { class: 'fej-tenue' }, 'Sul PC entra nella BDN ovicaprini col ruolo di Servizio Veterinario (meglio dalla scheda aperta col tasto qui sopra), ' +
      'apri la console (F12 › Console), incolla e premi Invio. Lo snippet fa solo letture, una alla volta: circa 3 secondi per contrassegno. ' +
      'Alla fine il risultato arriva qui da solo; se non arriva, il file .json scaricato o «Copia il risultato» del riquadro dello snippet.'));
  }
  function caricaRisultato(t) { caricaDallaBdn(t); }
  if (S.cambiBdn && S.cambiBdn.dove === 'verifica') d.appendChild(riquadroCambi(S.cambiBdn.titolo, S.cambiBdn.cambi));
  d.appendChild(h('p', null, h('label', null, 'Risultato della BDN (fejalog_verifica_bdn_….json): ', h('input', { type: 'file', id: 'fej-verifica-file', accept: '.json,.xlsx,.csv,application/json', onchange: function (ev) {
    leggiFileBdn(ev.target.files && ev.target.files[0]);
  } })), ' ', tastoModello('verifica')));
  // se il file non è stato scaricato: «Copia il risultato» nel riquadro dello snippet e qui «Incolla»
  var incolla = h('textarea', { id: 'fej-verifica-incolla', rows: 3, style: 'width:100%;box-sizing:border-box', placeholder: 'Oppure incolla qui il risultato copiato dallo snippet («Copia il risultato»)', 'aria-label': 'Risultato della BDN incollato' });
  d.appendChild(incolla);
  d.appendChild(h('p', null, h('button', { type: 'button', id: 'fej-verifica-carica-incollato', onclick: function () {
    var t = incolla.value.trim();
    if (!t) { S.messaggio = 'Incolla prima il risultato copiato dallo snippet.'; messaggio(); return; }
    caricaRisultato(t);
  } }, 'Carica il risultato incollato')));
  return d;
}
/* Il risultato dello snippet che arriva da solo dalla scheda della BDN aperta qui («Apri la BDN»). */
window.addEventListener('message', function (ev) {
  if (ev.origin !== 'https://www.vetinfo.it' || !ev.data || ev.data.fejalog !== 'verifica-bdn' || !ev.data.file) return;
  if (!S.banco) { S.messaggio = 'Risultato della BDN arrivato, ma prima carica il backup.'; messaggio(); return; }
  var t = JSON.stringify(ev.data.file), r = S.banco.caricaVerificaBdn(t);
  if (r.errore) { S.messaggio = r.errore; messaggio(); return; }
  aggiornaAnagrafeBdn();
  S.cambiBdn = { titolo: 'Verifica in BDN arrivata dalla BDN (' + r.caricati + ' contrassegni): che cosa è cambiato', cambi: r.cambi, dove: 'verifica' };
  S.messaggio = '✓ Dati della BDN arrivati dalla scheda della BDN: ' + r.caricati + ' contrassegni. Li trovi nella scheda di ogni provetta.';
  try { ev.source.postMessage({ fejalog: 'verifica-bdn-ricevuta', caricati: r.caricati }, ev.origin); } catch (e) { /* la scheda può essere chiusa */ }
  disegna();
});
function testoCortoVerifica(cfg, urlMotore) {
  return 'window.__BDN_VERIFICA__ = ' + JSON.stringify(cfg) + ';\n' +
    "fetch(" + JSON.stringify(urlMotore + '?v=' + cfg.data) + ").then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })" +
    ".then(function (t) { new Function(t)(); })" +
    ".catch(function (e) { console.log('Fejalog: non riesco a caricare lo snippet dal sito (' + e.message + '): usa «Scarica lo snippet completo».'); });\n";
}

function schedaAvvisi() {
  var d = h('div', { class: 'fej-scheda-avvisi' });
  d.appendChild(h('p', null, 'Che cosa controllare prima di sistemare le provette. Ogni tipo si apre e si chiude dal titolo. ' +
    '«Visto» dice soltanto che la Regia ha controllato l\'avviso: non cambia la provetta. I doppi si decidono in Soluzioni.'));

  var avv = (S.ap && S.ap.avvisi) || { doppiScoperti: [], ricercatiTrovati: [], collisioni: [], controlloIncompleto: [], deviceMaiRientrati: [] };
  /* Ogni tipo di avviso si apre e si chiude dal titolo (utente, 2026-11-13), con una riga che dice a che cosa serve. */
  function sezione(titolo, n, aperta, aCheServe) {
    var det = h('details', { class: 'fej-sezione fej-avvisi-tipo', open: aperta ? true : null, style: 'margin-top: .8rem;' },
      h('summary', null, h('h3', { style: 'display: inline;' }, titolo + ' (' + n + ')')));
    det.appendChild(h('p', { class: 'fej-guida' }, aCheServe));
    return det;
  }

  // 1. Doppi contrassegni scoperti
  var secDoppi = sezione('Doppi contrassegni scoperti', avv.doppiScoperti.length, avv.doppiScoperti.length > 0,
    'Lo stesso contrassegno su due provette, visto riunendo i registri dei device: la seconda va decisa in Soluzioni (di solito si toglie, se era lo stesso animale).');
  if (!avv.doppiScoperti.length) {
    secDoppi.appendChild(h('p', { class: 'fej-tenue' }, 'Nessun doppio contrassegno scoperto dopo il prelievo.'));
  } else {
    avv.doppiScoperti.forEach(function (dop) {
      var riga = h('div', { class: 'fej-riga' });
      riga.appendChild(h('strong', null, dop.contrassegno));
      riga.appendChild(document.createTextNode(' '));
      riga.appendChild(bottoneCopia(dop.contrassegno));
      riga.appendChild(document.createTextNode(' '));
      riga.appendChild(h('span', null, 'Provetta ' + dop.prima.etichetta + ' (' + dop.prima.operatore + ') e provetta ' + dop.doppia.etichetta + ' (' + dop.doppia.operatore + ')'));
      riga.appendChild(document.createTextNode(' '));
      if (S.banco) { riga.appendChild(h('button', { type: 'button', onclick: function () { apriNelBanco(dop.doppia.uid); } }, 'Apri in Soluzioni')); riga.appendChild(document.createTextNode(' ')); }
      if (dop.visto) {
        riga.appendChild(h('span', { class: 'fej-ok', style: 'margin-left: .5rem;' }, '✓ Visto'));
      } else {
        riga.appendChild(h('button', {
          type: 'button',
          id: 'fej-visto-doppio-' + dop.contrassegno,
          onclick: function () {
            azione('visto_doppio', { uid: dop.doppia.uid, contrassegno: dop.contrassegno });
          }
        }, '✓ Visto'));
      }
      secDoppi.appendChild(riga);
    });
  }
  d.appendChild(secDoppi);

  // 2. Capi ricercati trovati
  var secRic = sezione('Capi ricercati trovati', avv.ricercatiTrovati.length, avv.ricercatiTrovati.length > 0,
    'Capi dell\'elenco dei ricercati che sono stati prelevati: c\'è scritto che cosa fare (marcare, isolare, avvisare).');
  if (!avv.ricercatiTrovati.length) {
    secRic.appendChild(h('p', { class: 'fej-tenue' }, 'Nessun capo ricercato campionato in questa seduta.'));
  } else {
    avv.ricercatiTrovati.forEach(function (ric) {
      var riga = h('div', { class: 'fej-riga' });
      riga.appendChild(h('strong', null, ric.contrassegno));
      riga.appendChild(document.createTextNode(' '));
      riga.appendChild(bottoneCopia(ric.contrassegno));
      riga.appendChild(document.createTextNode(' '));
      riga.appendChild(h('span', null, 'Provetta ' + ric.provetta + ' (' + ric.operatore + ') · ' + ric.nota + (ric.cosaFare ? ' · ' + ric.cosaFare : '')));
      riga.appendChild(document.createTextNode(' '));
      if (ric.visto) {
        riga.appendChild(h('span', { class: 'fej-ok', style: 'margin-left: .5rem;' }, '✓ Visto'));
      } else {
        riga.appendChild(h('button', {
          type: 'button',
          id: 'fej-visto-ricercato-' + ric.contrassegno,
          onclick: function () {
            azione('visto_ricercato', { uid: ric.uid, contrassegno: ric.contrassegno });
          }
        }, '✓ Visto'));
      }
      secRic.appendChild(riga);
    });
  }
  d.appendChild(secRic);

  // 3. Collisioni di etichette
  var secColl = sezione('Collisioni di etichette', avv.collisioni.length, avv.collisioni.length > 0,
    'Due provette con la stessa scritta: una va rinominata, perché non devono esistere provette omonime.');
  if (!avv.collisioni.length) {
    secColl.appendChild(h('p', { class: 'fej-tenue' }, 'Nessuna collisione di etichette.'));
  } else {
    avv.collisioni.forEach(function (c) {
      var riga = h('div', { class: 'fej-riga' });
      riga.appendChild(h('span', { class: 'fej-errore' }, 'Etichetta in collisione: ' + c.etichetta));
      riga.appendChild(document.createTextNode(' '));
      if (c.contrassegno) {
        riga.appendChild(h('code', null, c.contrassegno));
        riga.appendChild(document.createTextNode(' '));
        riga.appendChild(bottoneCopia(c.contrassegno));
      }
      riga.appendChild(h('span', { class: 'fej-tenue' }, ' (operatore ' + c.operatore + ') — da rinominare nella scheda Provette'));
      secColl.appendChild(riga);
    });
  }
  d.appendChild(secColl);

  // 4. Provette con controllo dei doppi incompleto
  /* A campionamento chiuso il registro è intero: i doppi veri sono già fra i doppi scoperti (utente, 2026-11-13: «se non ci
     sono collisioni tra i controlli doppi incompleti le provette non sono un problema»). Resta una riga, con l'elenco a parte. */
  var secInc = sezione('Controllo doppi incompleto', avv.controlloIncompleto.length, false,
    'Provette prese mentre qualche device non rispondeva (da isolato): in campo il doppio non si poteva controllare. Sul registro intero il controllo si rifà: i doppi veri sono quelli qui sopra.');
  if (!avv.controlloIncompleto.length) {
    secInc.appendChild(h('p', { class: 'fej-tenue' }, 'Tutte le provette sono state prelevate con controllo doppi completo.'));
  } else {
    secInc.appendChild(h('p', { id: 'fej-incompleti-riepilogo' }, avv.controlloIncompleto.length + ' provette prese col controllo incompleto, ricontrollate sul registro intero: ' +
      (avv.doppiScoperti.length ? avv.doppiScoperti.length + (avv.doppiScoperti.length === 1 ? ' doppio vero, in Soluzioni.' : ' doppi veri, in Soluzioni.') : 'nessun doppio. Non serve fare altro.')));
    var elencoInc = h('details', null, h('summary', null, 'Elenco delle provette'));
    secInc.appendChild(elencoInc);
    avv.controlloIncompleto.forEach(function (inc) {
      var riga = h('div', { class: 'fej-riga' });
      riga.appendChild(h('strong', null, inc.etichetta));
      riga.appendChild(document.createTextNode(' '));
      if (inc.contrassegno) {
        riga.appendChild(h('code', null, inc.contrassegno));
        riga.appendChild(document.createTextNode(' '));
        riga.appendChild(bottoneCopia(inc.contrassegno));
      }
      riga.appendChild(h('span', { class: 'fej-tenue' }, ' · ' + inc.operatore));
      elencoInc.appendChild(riga);
    });
  }
  d.appendChild(secInc);

  // 5. Dispositivi mai rientrati
  var secDev = sezione('Dispositivi mai rientrati', avv.deviceMaiRientrati.length, avv.deviceMaiRientrati.length > 0,
    'Device rimasti esclusi o fuori rete fino alla fine: le loro provette sono nel backup solo se è stato unito il loro registro.');
  if (!avv.deviceMaiRientrati.length) {
    secDev.appendChild(h('p', { class: 'fej-tenue' }, 'Nessun dispositivo è rimasto escluso o fuori rete.'));
  } else {
    avv.deviceMaiRientrati.forEach(function (dev) {
      var riga = h('div', { class: 'fej-riga' });
      riga.appendChild(h('strong', null, dev.operatore));
      riga.appendChild(h('span', { class: 'fej-tenue' }, ' · dispositivo «' + dev.dispositivo + '» (identificativo ' + dev.device.slice(0, 8) + ')'));
      secDev.appendChild(riga);
    });
  }
  d.appendChild(secDev);

  return d;
}

function schedaProvette() {
  var d = h('div');
  d.appendChild(h('p', null, 'L\'elenco completo di tutte le provette del progetto, con ricerca, filtri e le modifiche consentite alla Regia. Le modifiche si salvano in locale e si riportano nell\'app dalla scheda «Esporta per l\'app».'));

  var tutte = (S.ap && S.ap.provette) || [];
  var stabs = (S.ap && S.ap.stabilimenti) || [];

  var boxFiltri = h('div', { class: 'fej-form', style: 'margin-bottom: .6rem;' });
  boxFiltri.appendChild(h('input', {
    type: 'search',
    id: 'fej-ricerca-provette',
    placeholder: 'Cerca: numero, etichetta, contrassegno, note, operatore',
    value: S.cercaProvette,
    'aria-label': 'Cerca provette',
    oninput: function (ev) {
      S.cercaProvette = ev.target.value;
      disegna();
      var inp = corpo.querySelector('input[type=search]');
      if (inp) { inp.focus(); inp.setSelectionRange(S.cercaProvette.length, S.cercaProvette.length); }
    }
  }));

  var selSpecie = h('select', {
    id: 'fej-filtro-specie',
    'aria-label': 'Filtro specie',
    onchange: function (ev) { S.filtroSpecieProvette = ev.target.value; disegna(); }
  }, [
    ['', 'Tutte le specie'],
    ['pecore', 'Pecore'],
    ['capre', 'Capre']
  ].map(function (o) { return h('option', { value: o[0], selected: S.filtroSpecieProvette === o[0] ? true : null }, o[1]); }));
  boxFiltri.appendChild(h('label', null, 'Specie: ', selSpecie));

  if (stabs.length > 1) {
    var selStab = h('select', {
      id: 'fej-filtro-stabilimento',
      'aria-label': 'Filtro stabilimento',
      onchange: function (ev) { S.filtroStabProvette = ev.target.value; disegna(); }
    }, [['', 'Tutti gli stabilimenti']].concat(stabs.map(function (st) {
      return [st.codice, (st.lettera ? '[' + st.lettera + '] ' : '') + st.codice];
    })).map(function (o) { return h('option', { value: o[0], selected: S.filtroStabProvette === o[0] ? true : null }, o[1]); }));
    boxFiltri.appendChild(h('label', null, 'Stabilimento: ', selStab));
  }

  var selStato = h('select', {
    id: 'fej-filtro-stato',
    'aria-label': 'Filtro stato',
    onchange: function (ev) { S.filtroStatoProvette = ev.target.value; disegna(); }
  }, [
    ['', 'Tutti gli stati'],
    ['ordinarie', 'Ordinarie'],
    ['problematiche', 'Fuori registro'],
    ['doppi', 'Doppi'],
    ['collisioni', 'Collisioni'],
    ['annullate', 'Annullate'],
    ['perse', 'Perse']
  ].map(function (o) { return h('option', { value: o[0], selected: S.filtroStatoProvette === o[0] ? true : null }, o[1]); }));
  boxFiltri.appendChild(h('label', null, 'Stato: ', selStato));
  boxFiltri.appendChild(h('label', null, 'Categoria: ', h('select', {'aria-label':'Filtro categoria',onchange:function(ev){S.filtroCategoriaProvette=ev.target.value;disegna();}},
    [['','Tutte'],['verde','Verde'],['giallo','Giallo'],['blu','Blu'],['rosso','Rosso']].map(function(v){return h('option',{value:v[0],selected:S.filtroCategoriaProvette===v[0]},v[1]);}))));

  d.appendChild(boxFiltri);

  var q = S.cercaProvette.trim().toLowerCase();
  var filtrate = tutte.filter(function (r) {
    if (S.filtroSpecieProvette && r.specie !== S.filtroSpecieProvette) return false;
    if (S.filtroCategoriaProvette && r.categoria !== S.filtroCategoriaProvette) return false;
    if (S.filtroStabProvette && r.stabilimento !== S.filtroStabProvette) return false;
    if (S.filtroStatoProvette) {
      if (S.filtroStatoProvette === 'ordinarie' && (r.fraIProblematici || r.persa || r.annullata || r.doppia || r.doppioScoperto)) return false;
      if (S.filtroStatoProvette === 'problematiche' && !(r.fraIProblematici || r.problematica)) return false;
      if (S.filtroStatoProvette === 'doppi' && !(r.doppia || r.doppioScoperto)) return false;
      if (S.filtroStatoProvette === 'annullate' && !r.annullata) return false;
      if (S.filtroStatoProvette === 'perse' && !r.persa) return false;
      if (S.filtroStatoProvette === 'collisioni' && !r.collisione) return false;
    }
    if (q) {
      if (typeof Dominio !== 'undefined' && Dominio.corrispondeRicerca && Dominio.corrispondeRicerca(r.etichetta, q)) return true;
      var testo = [r.etichetta, str(r.numero), r.contrassegno, r.operatore, r.note, (r.descrizione && r.descrizione.capo) || ''].join(' ').toLowerCase();
      if (testo.indexOf(q) < 0) return false;
    }
    return true;
  });

  d.appendChild(h('p', { class: 'fej-tenue' }, 'Provette trovate: ' + filtrate.length + ' su ' + tutte.length + ' totali.'));

  if (!filtrate.length) {
    d.appendChild(h('p', null, 'Nessuna provetta corrisponde ai filtri impostati.'));
    return d;
  }

  var limite = 400;
  var elencoEl = h('div', { class: 'fej-provette-lista' });
  filtrate.slice(0, limite).forEach(function (r) {
    elencoEl.appendChild(rigaProvettaScheda(r, stabs));
  });
  d.appendChild(elencoEl);

  if (filtrate.length > limite) {
    d.appendChild(h('p', { class: 'fej-tenue' }, '… e altre ' + (filtrate.length - limite) + ': restringi la ricerca.'));
  }

  return d;
}

function rigaProvettaScheda(r, stabs) {
  var div = h('div', { class: 'fej-riga fej-riga-provetta', 'data-uid': r.uid, style: 'margin-bottom: .6rem;' });
  var etLetta = (typeof Dominio !== 'undefined' && Dominio.analizzaEtichetta) ? Dominio.analizzaEtichetta(r.etichetta) : null;
  var contr = (etLetta && etLetta.valida && etLetta.contrassegnoEsteso) ? etLetta.contrassegnoEsteso : (r.contrassegno || '');
  var etichettaMostrata = (etLetta && etLetta.valida && etLetta.codiceBreve) ? etLetta.codiceBreve : r.etichetta;

  var desc = r.descrizione || {};
  var tonoCls = desc.tono ? ' fej-tono-' + desc.tono : '';

  var header = h('div', { style: 'display:flex; flex-wrap:wrap; align-items:center; gap:.4rem;' },
    h('strong', { style: 'font-size:1.15em;' }, etichettaMostrata),
    h('code', null, contr || '(senza contrassegno)'),
    contr ? bottoneCopia(contr) : null,
    h('span', { class: 'fej-tenue' }, (r.specie === 'capre' ? 'CAPRA' : 'PECORA') + (r.stabilimento ? ' · ' + r.stabilimento : '')),
    h('span', { class: 'fej-esito' + tonoCls }, desc.esito || ''),
    r.annullata ? h('span', { class: 'fej-errore' }, 'ANNULLATA') : null,
    r.persa ? h('span', { class: 'fej-errore' }, 'PERSA') : null
  );
  div.appendChild(header);

  var sub = h('div', { class: 'fej-tenue', style: 'margin:.2rem 0;' },
    [desc.capo, desc.chi, r.note ? 'Note: ' + r.note : ''].filter(Boolean).join(' · ')
  );
  div.appendChild(sub);

  var azioniBar = h('div', { style: 'margin-top:.2rem;' });
  var aperta = S.apertaProvetta === r.uid;
  var modificando = S.modificandoProvetta === r.uid;
  var annullando = S.annullandoProvetta === r.uid;

  azioniBar.appendChild(h('button', {
    type: 'button',
    class: 'fej-btn-dettaglio',
    onclick: function () { S.apertaProvetta = aperta ? null : r.uid; disegna(); }
  }, aperta ? 'Chiudi scheda' : 'Scheda'));

  if (!r.annullata) {
    azioniBar.appendChild(h('button', {
      type: 'button',
      class: 'fej-btn-modifica',
      onclick: function () {
        S.modificandoProvetta = modificando ? null : r.uid;
        S.annullandoProvetta = null;
        disegna();
      }
    }, modificando ? 'Chiudi modifica' : 'Modifica'));

    azioniBar.appendChild(h('button', {
      type: 'button',
      class: 'fej-btn-elimina',
      style: 'color: #c0392b;',
      onclick: function () {
        S.annullandoProvetta = annullando ? null : r.uid;
        S.modificandoProvetta = null;
        disegna();
      }
    }, annullando ? 'Annulla' : 'Elimina'));
  }

  if (!r.annullata) {
    azioniBar.appendChild(h('button', {type:'button', class:'fej-btn-persa', onclick:function () {
      if (r.persa) azione('ritrovata', {uid:r.uid});
      else { var motivo = window.prompt('Motivo: rotta, caduta o sporca, non si trova'); if (motivo && motivo.trim()) azione('persa', {uid:r.uid, motivo:motivo.trim()}); }
    }}, r.persa ? 'Ritrovata' : 'Persa'));
  }
  div.appendChild(azioniBar);

  if (aperta) {
    div.appendChild(schedaDettaglioProvetta(r));
  }
  if (modificando) {
    div.appendChild(formModificaProvetta(r, stabs));
  }
  if (annullando) {
    div.appendChild(formAnnulloProvetta(r));
  }

  return div;
}

function schedaDettaglioProvetta(r) {
  var desc = r.descrizione || {};
  var righeTab = [
    ['UID interno', r.uid],
    ['Serie', r.serie],
    ['Etichetta campo', r.etichetta],
    ['Numero assegnato', r.numero != null ? str(r.numero) : '—'],
    ['Contrassegno', r.contrassegno || '—'],
    ['Specie', r.specie],
    ['Stabilimento', r.stabilimento || '—'],
    ['Operatore', r.operatore + (r.device ? ' (' + r.device + ')' : '')],
    ['Data e ora', r.ts || '—'],
    ['Sesso registrato', r.sesso || '—'],
    ['Sesso corretto', r.sesso_corretto || '—'],
    ['Note', r.note || '—'],
    ['Marche da sostituire', [
      r.orecchino_sx ? 'Orecchino sinistro' : '',
      r.orecchino_dx ? 'Orecchino destro' : '',
      r.bolo ? 'Bolo' : ''
    ].filter(Boolean).join(', ') || 'Nessuna'],
    ['Senza transponder', r.senza_transponder ? 'Sì' : 'No'],
    ['Identificazione', (r.identificazione || '—') + (r.candidati ? ' · ' + r.candidati + ' candidati' : '')],
    ['Esito', (desc.esito || '') + (desc.motivo ? ' (' + desc.motivo + ')' : '')]
  ];

  var d = h('div', { class: 'fej-scheda fej-scheda-dettaglio-provetta' });
  var tb = h('table', null, righeTab.map(function (c) {
    return h('tr', null, h('th', null, c[0]), h('td', null, str(c[1])));
  }));
  d.appendChild(tb);
  if (!r.annullata && r.dda) {
    var statoDda = h('select', {'aria-label':'Stato DDA'}, [['da_verificare','Da verificare'],['valido','Valido'],['da_rifare','Da rifare'],['ingresso_registrato','Ingresso registrato']].map(function (v) {
      return h('option',{value:v[0],selected:v[0]===r.dda.stato},v[1]);
    }));
    var notaDda = h('input',{type:'text',value:r.dda.nota,'aria-label':'Nota DDA'});
    d.appendChild(h('div',null,h('label',null,'DDA ',statoDda),h('label',null,'Nota ',notaDda),h('button',{type:'button',onclick:function(){
      azione('verifica_dda',{uid:r.uid,stato:statoDda.value,nota:notaDda.value});
    }},'Salva verifica DDA')));
  }
  if (!r.annullata && r.candidatiSoluzione && r.candidatiSoluzione.length) {
    var scelta = h('select', {'aria-label':'Capo'}, r.candidatiSoluzione.map(function(c) {
      return h('option',{value:c.contrassegno},[c.contrassegno,c.sesso,c.razza,c.dataNascita].join(' · '));
    }));
    var report = h('input',{type:'checkbox',checked:true});
    d.appendChild(h('details',null,h('summary',null,'Ricolloca'),h('label',null,'Capo ',scelta),
      r.candidatiSoluzione.map(function(c){return h('p',null,c.contrassegno,' ',bottoneCopia(c.contrassegno));}),
      h('label',null,report,' Nel report'), h('button',{type:'button',onclick:function(){
        azione('ricollocazione',{uid:r.uid,capo:scelta.value,nel_report:report.checked});
      }},'Conferma')));
  }

  if (S.banco) {
    var nota = h('textarea', { rows: 2 }, S.banco.scheda(r.uid, '').nota_allevatore || '');
    d.appendChild(h('div', null, h('label', null, 'Nota per l’allevatore ', nota),
      h('button', { type: 'button', onclick: function () {
        azione('modifica_provetta', S.banco.notaAllevatore(r.uid, nota.value));
      } }, 'Salva nota per l’allevatore')));
  }

  if (r.eventi && r.eventi.length) {
    d.appendChild(h('h4', null, 'Eventi della provetta'));
    d.appendChild(h('table', null, r.eventi.map(function (ev) {
      return h('tr', null, h('td', null, ev.ts), h('td', null, ev.op), h('td', null, ev.tipo));
    })));
  }
  if (r.storia && r.storia.length > 1) {
    d.appendChild(h('p', null, h('strong', null, 'Storia dei numeri: '), r.storia.join(' → ')));
  }
  if (desc.segnalazioni && desc.segnalazioni.length) {
    d.appendChild(h('p', null, h('strong', null, 'Segnalazioni: '), desc.segnalazioni.join(' · ')));
  }
  if (desc.grezzi && desc.grezzi.length) {
    var det = h('details', null,
      h('summary', null, 'Tutti i dati grezzi del registro (' + desc.grezzi.length + ')'),
      h('table', { style: 'margin-top:.4rem;' }, desc.grezzi.map(function (g) {
        return h('tr', null, h('th', null, g.chiave), h('td', null, g.valore));
      }))
    );
    d.appendChild(det);
  }

  return d;
}

function formModificaProvetta(r, stabs) {
  var d = h('div', { class: 'fej-attribuisci' });
  d.appendChild(h('h4', { style: 'margin:0 0 .4rem 0;' }, 'Modifica provetta ' + r.etichetta));

  var inputEtichetta = h('input', { type: 'text', id: 'fej-mod-etichetta', value: r.etichetta, 'aria-label': 'Nuova etichetta' });
  var inputNote = h('input', { type: 'text', id: 'fej-mod-note', value: r.note || '', placeholder: 'Note sul prelievo o sul capo', 'aria-label': 'Note' });
  var cbSx = h('input', { type: 'checkbox', id: 'fej-mod-cbsx', checked: r.orecchino_sx ? true : null });
  var cbDx = h('input', { type: 'checkbox', id: 'fej-mod-cbdx', checked: r.orecchino_dx ? true : null });
  var cbBolo = h('input', { type: 'checkbox', id: 'fej-mod-cbbolo', checked: r.bolo ? true : null });

  var selSesso = h('select', { id: 'fej-mod-sesso', 'aria-label': 'Sesso corretto' }, [
    ['', 'Come anagrafe (' + (r.sesso || '?') + ')'],
    ['M', 'Maschio (M)'],
    ['F', 'Femmina (F)']
  ].map(function (o) { return h('option', { value: o[0], selected: r.sesso_corretto === o[0] ? true : null }, o[1]); }));

  var selStab = null;
  if (stabs.length > 1) {
    selStab = h('select', { 'aria-label': 'Stabilimento provetta' }, stabs.map(function (st) {
      return h('option', { value: st.codice, selected: r.stabilimento === st.codice ? true : null },
        (st.lettera ? '[' + st.lettera + '] ' : '') + st.codice);
    }));
  }

  var form = h('div', { class: 'fej-form' },
    h('p', null, h('label', null, 'Etichetta fisica (rinomina): ', inputEtichetta),
      h('span', { class: 'fej-tenue' }, ' Deve essere unica: mai provette omonime.')),
    selStab ? h('p', null, h('label', null, 'Stabilimento provetta: ', selStab)) : null,
    h('p', null, h('label', null, 'Note: ', inputNote)),
    h('p', null, h('label', null, 'Sesso corretto: ', selSesso)),
    h('p', null, 'Marche da sostituire: ',
      h('label', null, cbSx, ' Orecchino SX'), ' ',
      h('label', null, cbBolo, ' Bolo'), ' ',
      h('label', null, cbDx, ' Orecchino DX')
    )
  );
  d.appendChild(form);

  var btnSalva = h('button', {
    type: 'button',
    id: 'fej-btn-salva-modifica',
    onclick: function () {
      var nuovaEt = inputEtichetta.value.trim();
      var nuoveNote = inputNote.value.trim();
      var nuovoSx = cbSx.checked;
      var nuovoDx = cbDx.checked;
      var nuovoBolo = cbBolo.checked;
      var nuovoSesso = selSesso.value;
      var nuovoStab = selStab ? selStab.value : r.stabilimento;

      var datiAzione = {
        uid: r.uid,
        contrassegno: r.contrassegno,
        specie: r.specie,
        stabilimento: nuovoStab,
        note: nuoveNote,
        orecchino_sx: nuovoSx,
        orecchino_dx: nuovoDx,
        bolo: nuovoBolo,
        senza_transponder: nuovoDx || nuovoBolo,
        sesso_corretto: nuovoSesso,
        nome: nomeUtente()
      };
      if (nuovaEt && nuovaEt !== r.etichetta) {
        datiAzione.etichetta = nuovaEt;
      }
      var tipoAzione = 'modifica_provetta';
      if (azione(tipoAzione, datiAzione)) {
        S.modificandoProvetta = null;
        S.messaggio = 'Provetta ' + r.etichetta + ' modificata.';
        disegna();
      }
    }
  }, 'Salva modifiche');

  var btnAnnulla = h('button', {
    type: 'button',
    onclick: function () { S.modificandoProvetta = null; disegna(); }
  }, 'Annulla');

  d.appendChild(h('div', null, btnSalva, ' ', btnAnnulla));
  return d;
}

function formAnnulloProvetta(r) {
  var d = h('div', { class: 'fej-attribuisci', style: 'border-left: 4px solid #c0392b;' });
  d.appendChild(h('h4', { style: 'margin:0 0 .4rem 0; color:#c0392b;' }, 'Elimina / annulla provetta ' + r.etichetta));
  d.appendChild(h('p', null, 'Si annulla con un nuovo evento: resta nel registro storico, ma non conta più nei totali e il capo torna da prelevare.'));

  var inputMotivo = h('input', {
    type: 'text',
    id: 'fej-ann-motivo',
    placeholder: 'Motivo dell\'annullamento (es. provetta rotta, annullata)',
    'aria-label': 'Motivo annullo',
    style: 'width: 100%; box-sizing: border-box;'
  });
  d.appendChild(h('p', null, h('label', null, 'Motivo: ', inputMotivo)));

  var btnConferma = h('button', {
    type: 'button',
    id: 'fej-btn-conferma-annullo',
    style: 'color:#c0392b;',
    onclick: function () {
      var mot = inputMotivo.value.trim();
      if (!mot) { S.messaggio = 'Il motivo dell\'annullamento è obbligatorio.'; messaggio(); return; }
      if (azione('annulla_provetta', { uid: r.uid, etichetta: r.etichetta, motivo: mot, specie: r.specie, stabilimento: r.stabilimento, nome: nomeUtente() })) {
        S.annullandoProvetta = null;
        S.messaggio = 'Provetta ' + r.etichetta + ' annullata: ' + mot + '.';
        disegna();
      }
    }
  }, 'Conferma eliminazione');

  var btnIndietro = h('button', {
    type: 'button',
    onclick: function () { S.annullandoProvetta = null; disegna(); }
  }, 'Indietro');

  d.appendChild(h('div', null, btnConferma, ' ', btnIndietro));
  return d;
}

function leggiBackup(byte) {
  S.resocontoRiconciliazione = null; S.backupRiconciliatoZip = null;
  return Progetto.leggiBackup(byte).then(function (P) {
    if (!pc) Memoria.metti('backup', byte); // F5 non perde la sessione: il backup aperto resta nel browser
    apriProgetto(P); S.ignoraVerifica = false; S.messaggio = P.verifica.ok ? 'Backup letto e verificato.' : 'Backup letto, ma la verifica ha trovato problemi: per usarlo serve la conferma qui sotto.';
    if (P.verifica.ok) attendiMotore(); else { S.esito = null; S.ap = null; disegna(); }
  });
}
function caricaDalTablet() {
  if (window.FejConfigurazionePc) {
    occupatoPc = true; disegna();
    pc.stato().then(function (stato) {
      if (stato.configurazione || stato.campionamento_chiuso === false) window.FejConfigurazionePc.monta(radice, pc);
      else caricaBackupDalTablet();
    }, function (e) { occupatoPc = false; errorePc(e); disegna(); });
  } else caricaBackupDalTablet();
}
function caricaBackupDalTablet() {
  if (S.P && !confirm('Caricare il backup corrente? Le azioni su questo backup restano conservate nel browser.')) { occupatoPc = false; disegna(); return; }
  occupatoPc = true; disegna();
  pc.backup().then(leggiBackup).catch(errorePc).then(function () { occupatoPc = false; disegna(); });
}

function tuttiRecord() {
  var out = [];
  ((S.ap && S.ap.esporti) || []).forEach(function (e) { (e.export.records || []).forEach(function (r) { out.push(r); }); });
  return out;
}
var NOMI_SOL = { '': 'Predefinita', coda: 'In coda, ARVET a mano', esclusa: 'Eliminata', normalizzata: 'Normalizzata', ricollocata: 'Ricollocata (dall\'app)' };

function schedaProblemi() {
  var d = h('div');
  d.appendChild(h('p', null, 'Il colpo d\'occhio: le provette fuori registro per tipologia e, in fondo, gli assenti (i capi in età che non hanno una provetta). ' +
    'Ogni provetta si decide in Soluzioni; qui si vedono quante sono, i dati della BDN se li hai caricati (scheda Carica) e la regola per tipologia.'));
  try { S.verificheBdnUid = S.banco ? S.banco.verificheBdn() : {}; } catch (e) { S.verificheBdnUid = {}; }
  var recs = tuttiRecord().filter(function (r) { return S.ap.problemi[r.uid]; });
  d.appendChild(h('input', { type: 'search', placeholder: 'Cerca: etichetta, contrassegno, cifre', value: S.cerca, 'aria-label': 'Cerca', oninput: function (ev) { S.cerca = ev.target.value; disegna(); var i = corpo.querySelector('input[type=search]'); if (i) { i.focus(); i.setSelectionRange(S.cerca.length, S.cerca.length); } } }));
  var q = S.cerca.trim().toLowerCase();
  var filtrate = recs.filter(function (r) {
    if (!q) return true;
    if (typeof Dominio !== 'undefined' && Dominio.corrispondeRicerca && Dominio.corrispondeRicerca(r.etichetta, q)) return true;
    return [r.etichetta, r.contrassegno, r.operatore, r.note].join(' ').toLowerCase().indexOf(q) >= 0;
  });
  if (!recs.length) d.appendChild(h('p', null, 'Nessuna provetta fuori registro.'));
  S.ap.tipologie.forEach(function (t) {
    var righe = filtrate.filter(function (r) { return S.ap.problemi[r.uid].tipo === t.codice; });
    if (!righe.length) return;
    var det = h('details', { open: q || S.tipoAperto === t.codice ? true : null });
    det.addEventListener('toggle', function () { if (det.open) S.tipoAperto = t.codice; });
    det.appendChild(h('summary', null, t.titolo + ' (' + righe.length + ')'));
    det.appendChild(h('p', null, 'Regola della tipologia: ', soluzioneSelect(S.ap.impostazioni.regole[t.codice] || '', function (v) {
      azione('regola_problemi', {tipologia: t.codice, soluzione: v});
    }, false, t.soluzioni)));

    righe.forEach(function (r) { det.appendChild(rigaProblema(r)); });
    d.appendChild(det);
  });
  // Gli assenti (utente, 14/11: «Non trovati rinominerei in "Assenti" e li metterei in una sezione a parte […] gli altri
  // sono provette problematiche, questi provette che mancano»)
  var nAss = (S.ap.nonPrelevati || []).length;
  var detA = h('details', { open: S.tipoAperto === '__assenti' ? true : null, id: 'fej-assenti' });
  detA.addEventListener('toggle', function () { if (detA.open) S.tipoAperto = '__assenti'; });
  detA.appendChild(h('summary', null, 'Assenti: capi in età senza provetta (' + nAss + ')'));
  detA.appendChild(schedaNonTrovati());
  d.appendChild(h('h3', null, 'Assenti'));
  d.appendChild(detA);
  return d;
}
function soluzioneSelect(attuale, onCambia, conVuoto, soluzioni) {
  var sel = h('select', { 'aria-label': 'Soluzione', onchange: function (ev) { if (ev.target.value !== '?') onCambia(ev.target.value); } });
  if (conVuoto) sel.appendChild(h('option', { value: '?' }, 'Scegli…'));
  [''].concat(soluzioni || ['coda', 'esclusa']).forEach(function (v) { sel.appendChild(h('option', { value: v, selected: !conVuoto && v === attuale ? true : null }, NOMI_SOL[v])); });
  if (attuale === 'ricollocata') sel.appendChild(h('option', { value: 'ricollocata', selected: true, disabled: true }, NOMI_SOL.ricollocata));
  return sel;
}
function rigaProblema(r) {
  var aperta = S.aperta === r.uid;
  var etLetta = (typeof Dominio !== 'undefined' && Dominio.analizzaEtichetta) ? Dominio.analizzaEtichetta(r.etichetta) : null;
  var contr = (etLetta && etLetta.valida && etLetta.contrassegnoEsteso) ? etLetta.contrassegnoEsteso : (r.contrassegno || '');
  var etichettaMostrata = (etLetta && etLetta.valida && etLetta.codiceBreve) ? etLetta.codiceBreve : r.etichetta;
  var div = h('div', { class: 'fej-riga' },
    h('strong', null, etichettaMostrata), ' ', h('code', null, contr || '(senza contrassegno)'), ' ',
    contr ? bottoneCopia(contr) : null, ' ',
    h('span', { class: 'fej-tenue' }, [r.sesso, r.razza, r.data_nascita, r.operatore].filter(Boolean).join(' · ')), ' ',
    soluzioneSelect(str(r.soluzione), function (v) { azione('soluzione', { uid: r.uid, etichetta: r.etichetta, contrassegno: r.contrassegno, specie: r.specie, stabilimento: r.codice_stabilimento, soluzione: v }); }, false, S.ap.problemi[r.uid].soluzioni), ' ',
    h('button', { type: 'button', onclick: function () { S.aperta = aperta ? null : r.uid; disegna(); } }, aperta ? 'Chiudi scheda' : 'Scheda'),
    S.banco ? h('button', { type: 'button', onclick: function () { apriNelBanco(r.uid); } }, 'Decidi in Soluzioni') : null);
  var vb = (S.verificheBdnUid || {})[r.uid];
  if (vb) {
    if (vb.formato) div.appendChild(h('div', { class: 'fej-avviso' }, vb.formato));
    if (vb.cercato) div.appendChild(h('div', { class: vb.tono === 'CONFERMA' ? 'fej-ok' : 'fej-avviso' }, 'BDN: ' + vb.sintesi + (vb.discordanze.length ? ' ' + vb.discordanze.join(' ') : '')));
  }
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
    h('button', { type: 'button', onclick: function () { S.attribuendo = { capo: capo, nCand: nCand, et: S.confr.etichetta || capo.etichettaAssegnata || (capo.numeroAssegnato == null ? '' : String(capo.numeroAssegnato)) }; disegna(); } }, 'Attribuisci'));
  if (S.attribuendo && S.attribuendo.capo === capo) {
    var A = S.attribuendo, nota = h('input', { type: 'text', 'aria-label': 'Nota', placeholder: 'Come hai riconosciuto il capo' });
    var et = h('input', { type: 'text', 'aria-label': 'Etichetta', value: A.et });
    div.appendChild(h('div', { class: 'fej-attribuisci' }, h('label', null, 'Etichetta sulla provetta ', et), ' ', h('label', null, 'Nota ', nota), ' ',
      h('button', { type: 'button', onclick: function () {
        if (!nota.value.trim() || !et.value.trim()) { S.messaggio = 'Servono l\'etichetta e la nota.'; messaggio(); return; }
        if (azione('tardiva', { contrassegno: capo.contrassegno, specie: capo.specie, stabilimento: capo.stabilimento, etichetta: et.value.trim(), nota: nota.value.trim(), candidati: A.nCand, nome: nomeUtente() })) {
          S.attribuendo = null;
          S.messaggio = 'Registrata tardi ' + capo.contrassegno + ' come ' + et.value.trim() + '.'; disegna();
        }
      } }, 'Registra'), ' ', h('button', { type: 'button', onclick: function () { S.attribuendo = null; disegna(); } }, 'Annulla')));
  }
  return div;
}

var finestraPlateau = null, plateauStaccato = null, plateauPrincipale = null;
var modelloPlateau = Plateau.modelloAttuale();
var riordinoUI = { destinazioni: {}, selezionate: {}, esiti: {}, conferma: null, inMano: '' };
function righeRiordino() {
  var out = [];
  guidaRiordino().forEach(function (serie) {
    serie.guida.forEach(function (g) { out.push({ serie: serie, g: g }); });
  });
  return out;
}
function modificataRiordino(g) { return riordinoUI.destinazioni[g.uid] != null && riordinoUI.destinazioni[g.uid] !== String(g.a_n); }
function azioneRiordino(r, batch) {
  return {id: Stato.uuid(), tipo: 'riordino', ts: new Date().toISOString(), uid: r.g.uid,
    stabilimento: r.serie.codice, specie: r.serie.specie, contrassegno: r.g.contrassegno,
    suggerita: r.g.a_n, destinazione: Number(riordinoUI.destinazioni[r.g.uid] == null ? r.g.a_n : riordinoUI.destinazioni[r.g.uid]), batch: !!batch};
}
function inviaRiordino(azioni) {
  if (occupatoPc || !azioni.length) return;
  if (!pc) {
    azioni.forEach(function (a) {
      try {
        var no = applicaSullaSessione(a);
        riordinoUI.esiti[a.uid] = no ? 'Scartata: ' + no : 'Applicata';
        if (!no) delete riordinoUI.selezionate[a.uid];
      } catch (e) { riordinoUI.esiti[a.uid] = 'Scartata: ' + e.message; }
    });
    disegna(); return;
  }
  if (S.stato.azioni().length) {
    S.messaggio = 'Invia prima le modifiche locali dalla scheda Esporta per l’app, poi riprova la riga.'; messaggio(); return;
  }
  occupatoPc = true; disegna();
  pc.modifiche(JSON.stringify(Mod.esporta(S.P, azioni, nomeUtente()))).then(function (ris) {
    (ris.esiti || []).forEach(function (e) {
      var a = azioni.filter(function (a) { return a.id === e.id; })[0];
      if (a) { riordinoUI.esiti[a.uid] = e.esito + (e.motivo ? ': ' + e.motivo : ''); delete riordinoUI.selezionate[a.uid]; }
    });
    // Solo il backup con gli eventi applicati dal tablet determina lo stato «fatta».
    return pc.backup().then(leggiBackup);
  }).catch(function (e) {
    azioni.forEach(function (a) { riordinoUI.esiti[a.uid] = 'Invio non riuscito: ' + e.message; }); errorePc(e);
  }).then(function () { occupatoPc = false; disegna(); });
}
function inviaSingolaRiordino(r) {
  var a = azioneRiordino(r, false);
  var fisica = (S.ap.posizioniAttuali || []).filter(function (p) { return p.uid !== a.uid && p.serie === a.stabilimento + ':' + a.specie && p.vista === 'serie' && (p.plateau - 1) * 100 + p.pozzetto === a.destinazione; })[0];
  var occupante = fisica || r.serie.numerazione.filter(function (n) { return n.provetta === a.destinazione && n.contrassegno !== a.contrassegno; })[0];
  var source = (S.ap.plateauAttuale || []).filter(function (c) { return c.uid === a.uid; })[0];
  var dest = {serie: a.stabilimento + ':' + a.specie, vista: 'serie', plateau: Math.ceil(a.destinazione / 100)};
  if ([source, dest].filter(Boolean).some(function (p) { return Plateau.calcolaBordo(S.ap.plateauAttuale || [], p.serie, p.vista, p.plateau, S.ap.impostazioni.problematici_in_sequenza).codice === 'completo'; })) {
    // una conferma sola per sessione: nella chiusura dei buchi quasi ogni passo tocca un plateau completo (prova del 18/11)
    if (!riordinoUI.plateauCompletoOk) {
      if (!window.confirm('Chiudere i buchi sposta provette anche dentro plateau già completi. Confermi? (Non te lo chiedo più in questa sessione.)')) return;
      riordinoUI.plateauCompletoOk = true;
    }
    a.conferma_plateau_completo = true;
  }
  if (occupante) {
    a.conferma_con = occupante.uid;
    riordinoUI.conferma = {azione: a, testo: 'Il numero ' + a.destinazione + ' è occupato dalla provetta ' + occupante.etichetta + '. Confermi lo scambio?'};
    disegna(); return;
  }
  inviaRiordino([a]);
}
function schedaRiordino() {
  var d = h('div');
  d.appendChild(h('p', null, 'Ogni riga ha un invio singolo. La selezione serve solo per inviare in gruppo alle destinazioni suggerite; lo stato fatta viene dalle azioni applicate.'));
  var bloccata = riordinoIniziato();
  d.appendChild(h('p', null, h('label', null, h('input', { type: 'checkbox', checked: compattaAttuale(), disabled: bloccata || occupatoPc, onchange: function (ev) {
    azione('chiudi_buchi', { valore: ev.target.checked });
  } }), ' Chiudi i buchi' + (bloccata ? ': il Riordino è cominciato.' : ': si sceglie prima degli invii.'))));
  var righe;
  try { righe = righeRiordino(); } catch (e) { return h('p', {role: 'alert'}, e.message); }
  // Riordino dalla provetta in mano: etichetta, contrassegno o sue ultime cifre; con più corrispondenze restano tutte.
  var tutteLeRighe = righe;
  var postiBanco = S.banco ? S.banco.coda().conteggi : {};
  d.appendChild(h('p', { role: 'status' }, 'Da posare ' + righe.filter(function (r) { return !r.g.fatta; }).length +
    ' · Nel contenitore ARVET a mano ' + (postiBanco.nel_contenitore || 0)));
  var q = String(riordinoUI.inMano || '').replace(/\s+/g, '').toUpperCase();
  if (q) {
    var grado = function (r) {
      var et = String(r.g.da || '').replace(/\s+/g, '').toUpperCase(), cs = String(r.g.contrassegno || '').toUpperCase();
      if (et === q || cs === q) return 0;
      if (cs.slice(-q.length) === q) return 1;
      return cs.indexOf(q) >= 0 ? 2 : 3;
    };
    var migliore = Math.min.apply(null, righe.map(grado).concat([3]));
    righe = migliore < 3 ? righe.filter(function (r) { return grado(r) === migliore; }) : [];
  }
  d.appendChild(h('p', null, h('label', null, 'Provetta in mano: etichetta o contrassegno ', h('input', {type: 'text', 'data-in-mano': true, value: riordinoUI.inMano || '', maxlength: 40, autocomplete: 'off',
    'aria-label': 'Provetta in mano: etichetta o contrassegno',
    oninput: function (ev) { var cursore = ev.target.selectionStart; riordinoUI.inMano = ev.target.value; disegna();
      var campoNuovo = corpo.querySelector('input[data-in-mano]'); if (campoNuovo) { campoNuovo.focus(); campoNuovo.setSelectionRange(cursore, cursore); } } }))));
  if (q) d.appendChild(h('p', {role: 'status'}, righe.length === 0 ? 'Nessuna provetta trovata.' : righe.length === 1 ? 'Trovata: ' + (righe[0].g.secchio ? 'viene dal secchio.' : 'viene dal plateau.') : righe.length + ' provette possibili: scegli quella che hai in mano.'));
  var seleziona = function (tipo) {
    riordinoUI.selezionate = {};
    righe.forEach(function (r) { if (tipo !== null && !r.g.fatta && !modificataRiordino(r.g) && (tipo === '' || tipo === r.g.motivo)) riordinoUI.selezionate[r.g.uid] = true; }); disegna();
  };
  var barra = h('div', {class: 'fej-riga'}, h('button', {type: 'button', onclick: function () { seleziona(''); }}, 'Tutte'), ' ',
    h('button', {type: 'button', onclick: function () { seleziona(null); }}, 'Nessuna'));
  righe.map(function (r) { return r.g.motivo; }).filter(function (t, i, a) { return a.indexOf(t) === i; }).forEach(function (t) {
    barra.appendChild(h('button', {type: 'button', onclick: function () { seleziona(t); }}, 'Solo ' + t));
  });
  d.appendChild(barra);
  var batch = tutteLeRighe.filter(function (r) { return riordinoUI.selezionate[r.g.uid] && !modificataRiordino(r.g) && !r.g.fatta; });
  d.appendChild(h('button', {type: 'button', disabled: occupatoPc || !batch.length, onclick: function () {
    inviaRiordino(batch.map(function (r) { return azioneRiordino(r, true); }));
  }}, pc ? 'Invia le selezionate' : 'Applica le selezionate'));
  d.appendChild(h('p', {role: 'status', 'data-riordino-contatore': true}, tutteLeRighe.filter(function (r) { return r.g.fatta; }).length + ' di ' + tutteLeRighe.length + ' fatte.'));
  var tb = h('table', {class: 'fej-guida'}, h('tr', null, ['Selezione', 'Specie', 'Contrassegno', 'Da', 'A · numero finale', 'Fattispecie', 'Esito'].map(function (t) { return h('th', null, t); })));
  righe.forEach(function (r) {
    var g = r.g, modificata = modificataRiordino(g), valore = g.fatta && g.applicata_a != null ? String(g.applicata_a) : riordinoUI.destinazioni[g.uid] == null ? String(g.a_n) : riordinoUI.destinazioni[g.uid];
    var campo = h('input', {type: 'text', inputmode: 'numeric', value: valore, maxlength: 8, 'aria-label': 'Destinazione ' + g.da, disabled: occupatoPc || g.fatta,
      oninput: function (ev) { var valore = ev.target.value, cursore = ev.target.selectionStart; riordinoUI.destinazioni[g.uid] = valore; delete riordinoUI.selezionate[g.uid]; disegna(); var campoNuovo = Array.prototype.slice.call(corpo.querySelectorAll('tr[data-uid]')).filter(function (tr) { return tr.getAttribute('data-uid') === g.uid; })[0].querySelector('input[type=text]'); if (campoNuovo) { campoNuovo.focus(); campoNuovo.setSelectionRange(cursore, cursore); } }});
    var n = Number(valore), nValido = /^[0-9]+$/.test(valore) && n > 0 && n < 2147483648;
    tb.appendChild(h('tr', {'data-uid': g.uid},
      h('td', null, h('input', {type: 'checkbox', 'aria-label': 'Seleziona ' + g.da, checked: !!riordinoUI.selezionate[g.uid] && !modificata,
        disabled: occupatoPc || modificata || g.fatta, onchange: function (ev) { riordinoUI.selezionate[g.uid] = ev.target.checked; disegna(); }}),
        modificata ? h('small', null, 'Modificata: invia singolarmente') : null),
      h('td', null, r.serie.specie), h('td', null, h('code', null, g.contrassegno), ' ', bottoneCopia(g.contrassegno, 'Copia')),
      h('td', null, g.da, h('small', null, g.secchio ? ' · dal secchio' : ' · plateau ' + g.plateau_da + ', posto ' + g.pos_da)),
      h('td', null, campo, nValido ? h('small', null, ' · plateau ' + (Math.floor((n - 1) / 100) + 1) + ', posto ' + ((n - 1) % 100 + 1)) : h('small', {role: 'alert'}, 'Scrivi un numero intero positivo'),
        modificata ? h('button', {type: 'button', disabled: occupatoPc, onclick: function () { delete riordinoUI.destinazioni[g.uid]; disegna(); }}, 'Ripristina') : null),
      h('td', null, g.motivo), h('td', {role: 'status'}, g.fatta ? 'Applicata' : (riordinoUI.esiti[g.uid] || 'Da fare'), ' ',
        h('button', {type: 'button', disabled: occupatoPc || g.fatta || !nValido, onclick: function () { inviaSingolaRiordino(r); }}, pc ? 'Invia' : 'Applica'))));
  });
  d.appendChild(tb);
  if (riordinoUI.conferma) {
    var c = riordinoUI.conferma;
    d.appendChild(h('div', {role: 'alertdialog', 'aria-label': 'Conferma scambio', tabindex: '-1'}, h('p', null, c.testo),
      h('button', {type: 'button', onclick: function () { riordinoUI.conferma = null; inviaRiordino([c.azione]); }}, 'Conferma scambio'), ' ',
      h('button', {type: 'button', onclick: function () { riordinoUI.conferma = null; disegna(); }}, 'Annulla scambio')));
  }
  d.appendChild(h('details', null, h('summary', null, 'Spostamenti a mano'), strumentiAManoRiordino()));
  return d;
}

function strumentiAManoRiordino() {
  var d = h('div');
  d.appendChild(h('h3', null, 'Fatto a mano, non secondo la guida'));
  var cod = h('input', { type: 'text', 'aria-label': 'Contrassegno', placeholder: 'contrassegno' }), num = h('input', { type: 'text', 'aria-label': 'Numero', placeholder: 'numero', size: 6 });
  var spec = h('select', { 'aria-label': 'Specie' }, h('option', { value: 'pecore' }, 'pecore'), h('option', { value: 'capre' }, 'capre'));
  var quando = h('select', { 'aria-label': 'Quando' }, h('option', { value: 'dopo' }, 'dopo la guida'), h('option', { value: 'prima' }, 'prima della guida'));
  d.appendChild(h('p', null, 'La provetta ', cod, ' sta al numero ', num, ' ', spec, ' ', quando, ' ', h('button', { type: 'button', onclick: function () {
    var n = parseInt(num.value, 10), c = cod.value.replace(/\s/g, '').toUpperCase();
    if (!c || isNaN(n)) { S.messaggio = 'Scrivi il contrassegno e il numero.'; messaggio(); return; }
    azione('spostamento', { stabilimento: Progetto.stabilimentoDi(S.P, spec.value, c, S.ap.esporti), specie: spec.value, contrassegno: c, provetta: n, quando: quando.value });
  } }, 'Aggiungi')));
  var a = h('input', { type: 'text', 'aria-label': 'Primo contrassegno', placeholder: 'contrassegno A' }), b = h('input', { type: 'text', 'aria-label': 'Secondo contrassegno', placeholder: 'contrassegno B' });
  var spec2 = h('select', { 'aria-label': 'Specie' }, h('option', { value: 'pecore' }, 'pecore'), h('option', { value: 'capre' }, 'capre'));
  d.appendChild(h('p', null, 'Scambio: ', a, ' prende il posto di ', b, ' ', spec2, ' ', h('button', { type: 'button', onclick: function () {
    var x = a.value.replace(/\s/g, '').toUpperCase(), y = b.value.replace(/\s/g, '').toUpperCase();
    if (!x || !y) { S.messaggio = 'Scrivi i due contrassegni.'; messaggio(); return; }
    azione('scambio', { stabilimento: Progetto.stabilimentoDi(S.P, spec2.value, x, S.ap.esporti), specie: spec2.value, a: x, b: y });
  } }, 'Aggiungi')));
  S.stato.azioni().filter(function (x) { return x.tipo === 'spostamento' || x.tipo === 'scambio'; }).forEach(function (x) {
    d.appendChild(h('div', { class: 'fej-riga' }, x.tipo === 'scambio' ? x.a + ' ⇄ ' + x.b : x.contrassegno + ' → ' + x.provetta + ' (' + x.quando + ')', ' ', h('button', { type: 'button', onclick: function () { togli(x.id); } }, 'Togli')));
  });
  return d;
}

function gestisciProvetta(act) {
  if (pc) inviaRiordino([Object.assign({id: Stato.uuid(), ts: new Date().toISOString()}, act)]);
  else azione(act.tipo, act);
}
function destinazionePlateau(c) {
  try {
    var serie = guidaRiordino().filter(function (s) { return s.codice + ':' + s.specie === c.serie; })[0];
    if (!serie) return null;
    var g = serie.guida.filter(function (g) { return g.uid === c.uid; })[0];
    return g ? g.a_n : null;
  } catch (e) { return null; }
}
function spostaPlateau(c, numero, altro, completo) {
  try {
    var serie = guidaRiordino().filter(function (s) { return s.codice + ':' + s.specie === c.serie; })[0];
    if (!serie) throw new Error('Serie non disponibile');
    var g = serie.guida.filter(function (g) { return g.uid === c.uid; })[0];
    var finale = serie.numerazione.filter(function (n) { return n.uid === c.uid; })[0];
    if (!g && !finale) throw new Error('La provetta non ha una destinazione nella serie');
    inviaRiordino([{id: Stato.uuid(), tipo: 'riordino', ts: new Date().toISOString(), uid: c.uid,
      stabilimento: serie.codice, specie: serie.specie, contrassegno: c.contrassegno,
      suggerita: g ? g.a_n : finale.provetta, destinazione: numero, da_plateau: true,
      conferma_con: altro, conferma_plateau_completo: !!completo}]);
  } catch (e) { S.messaggio = e.message; messaggio(); }
}
function cercaCapiPlateau(query, c) {
  return S.banco.cercaCapi(c.serie.split(':')[1], query);
}
function schedaPlateau() {
  var d = h('div');
  d.appendChild(h('p', null, 'Posizione attuale delle provette dopo gli invii applicati. Cerca un contrassegno o una posizione; i risultati centrano il pozzetto. Puoi ingrandire e aprire una finestra a parte.'));
  var box = h('div'); d.appendChild(box);
  var verso = (S.ap && S.ap.impostazioni && S.ap.impostazioni.verso_riempimento) || 'basso_alto';
  plateauPrincipale = Plateau.creaAttuale(document, box, S.ap.plateauAttuale || [], { modello: modelloPlateau, copia: copia, applicaAzione: gestisciProvetta, sposta: spostaPlateau, destinazione: destinazionePlateau, cercaCapi: cercaCapiPlateau, staccabile: function () {
    var w = window.open('', 'fejalog-plateau', 'popup=yes,width=980,height=820');
    if (!w) { S.messaggio = 'Il browser ha bloccato la nuova finestra: consentila per questo sito.'; messaggio(); return; }
    finestraPlateau = w;
    if (plateauStaccato) plateauStaccato.ferma();
    w.document.open();
    w.document.write('<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Plateau · Fejalog</title>' +
      '<link rel="stylesheet" href="' + base + '../css/strumenti.css"><style>body{font-family:system-ui,sans-serif;margin:1rem;color:#222;background:#fff}</style></head><body><h1 style="font-size:1.1rem">Posizione attuale delle provette</h1><div id="sim"></div></body></html>');
    w.document.close();
    w.document.title = 'Plateau · Fejalog';
    plateauStaccato = Plateau.creaAttuale(w.document, w.document.getElementById('sim'), S.ap.plateauAttuale || [], { modello: modelloPlateau, staccata: true, copia: copia, applicaAzione: gestisciProvetta, sposta: spostaPlateau, destinazione: destinazionePlateau, cercaCapi: cercaCapiPlateau });
    w.addEventListener('unload', function () { if (plateauStaccato) { plateauStaccato.ferma(); plateauStaccato = null; } });
  } });
  return d;
}

function schedaStatistiche() {
  var d = h('div', { class: 'fej-statistiche' });
  d.appendChild(h('p', null, 'Statistiche, copertura e andamento calcolate dal registro del backup, in sola lettura.'));

  var stat = (S.ap && S.ap.statistiche) || {};
  var spec = stat.specie || {};
  var coperture = stat.copertura || [];
  var andamento = stat.andamento || {};

  // 1. Tabella Avanzamento
  d.appendChild(h('h3', null, 'Avanzamento del campionamento'));
  var specieChiavi = Object.keys(spec).filter(function (k) { return spec[k].attesi > 0 || spec[k].provette > 0; });
  if (!specieChiavi.length) specieChiavi = ['pecore'];

  var thAv = ['Specie', 'Attesi', 'Campionati', 'Mancanti', '%', 'Provette', 'Maschi att.', 'Maschi fatti', 'Elettronica (%)', 'Senza transponder'];
  var tbAv = h('table', { class: 'fej-guida' }, h('tr', null, thAv.map(function (t) { return h('th', null, t); })));

  var totAttesi = 0, totCapi = 0, totMancanti = 0, totProvette = 0, totMaschiAtt = 0, totMaschiFatti = 0, totCapiCamp = 0, totElettr = 0;

  specieChiavi.forEach(function (k) {
    var s = spec[k];
    totAttesi += s.attesi; totCapi += s.capiFatti; totMancanti += s.mancanti; totProvette += s.provette;
    totMaschiAtt += s.maschiAttesi; totMaschiFatti += s.maschiFatti; totCapiCamp += s.capiCampionati; totElettr += s.lettiElettronicamente;

    var stTr = s.senzaTransponder ? str(s.senzaTransponder.totale) + ' (' + s.senzaTransponder.percentuale + ')' : '—';
    var elettrStr = s.capiCampionati > 0 ? s.lettiElettronicamente + ' (' + s.percentualeElettronica + '%)' : '—';

    tbAv.appendChild(h('tr', null,
      h('td', null, h('strong', null, s.specie)),
      h('td', null, str(s.attesi)),
      h('td', null, str(s.capiFatti)),
      h('td', null, str(s.mancanti)),
      h('td', null, h('strong', null, str(s.percentuale) + '%')),
      h('td', null, str(s.provette)),
      h('td', null, str(s.maschiAttesi)),
      h('td', null, str(s.maschiFatti)),
      h('td', null, elettrStr),
      h('td', null, stTr)
    ));
  });

  if (specieChiavi.length > 1) {
    var percTot = totAttesi > 0 ? Math.round(totCapi * 100 / totAttesi) : 100;
    var elettrTotStr = totCapiCamp > 0 ? totElettr + ' (' + Math.round(totElettr * 100 / totCapiCamp) + '%)' : '—';
    tbAv.appendChild(h('tr', { style: 'font-weight:bold; border-top: 2px solid var(--md-default-fg-color--lighter);' },
      h('td', null, 'Totale'),
      h('td', null, str(totAttesi)),
      h('td', null, str(totCapi)),
      h('td', null, str(totMancanti)),
      h('td', null, str(percTot) + '%'),
      h('td', null, str(totProvette)),
      h('td', null, str(totMaschiAtt)),
      h('td', null, str(totMaschiFatti)),
      h('td', null, elettrTotStr),
      h('td', null, '—')
    ));
  }
  d.appendChild(tbAv);

  if (stat.stabilimenti && stat.stabilimenti.length) {
    d.appendChild(h('h3', null, 'Avanzamento per stabilimento'));
    d.appendChild(h('table', { class: 'fej-guida' },
      h('tr', null, ['Stabilimento', 'Specie', 'Attesi', 'Campionati', 'Mancanti', '%'].map(function (t) { return h('th', null, t); })),
      stat.stabilimenti.map(function (s) { return h('tr', null,
        [s.stabilimento, s.specie, str(s.attesi), str(s.capiFatti), str(s.mancanti), str(s.percentuale) + '%'].map(function (t) { return h('td', null, t); })); })
    ));
  }

  // 2. Tabella Copertura per serie
  if (coperture.length) {
    d.appendChild(h('h3', null, 'Copertura per serie'));
    var tbCop = h('table', { class: 'fej-guida' },
      h('tr', null, ['Serie / Specie', 'Capi attesi', 'Registrati', 'Mancanti', '%'].map(function (t) { return h('th', null, t); }))
    );
    coperture.forEach(function (c) {
      tbCop.appendChild(h('tr', null,
        h('td', null, c.specie),
        h('td', null, str(c.attesi)),
        h('td', null, str(c.registrati)),
        h('td', null, str(c.mancanti.length)),
        h('td', null, h('strong', null, str(c.percentuale) + '%'))
      ));
    });
    d.appendChild(tbCop);
  }

  // 3. Tabella Provette e anomalie
  d.appendChild(h('h3', null, 'Provette e anomalie'));
  var righeAnom = [];
  specieChiavi.forEach(function (k) {
    var s = spec[k];
    righeAnom.push(['Provette totali valide (' + s.specie + ')', str(s.provette)]);
    righeAnom.push(['  di cui fuori registro', str(s.problematiche)]);
    righeAnom.push(['  di cui provvisorie', str(s.provvisorie)]);
    righeAnom.push(['  di cui perse (buchi)', str(s.perse)]);
    if (s.numeriDoppi > 0) righeAnom.push(['  Numeri doppi (anomalia)', str(s.numeriDoppi)]);
    if (s.doppiContrassegno > 0) righeAnom.push(['  Doppi contrassegno scoperti dopo', str(s.doppiContrassegno)]);
    if (s.senzaTransponder) {
      righeAnom.push(['  Senza transponder (' + s.specie + ')', s.senzaTransponder.totale + ' (DX ' + s.senzaTransponder.dx + ', SX ' + s.senzaTransponder.sx + ', bolo ' + s.senzaTransponder.bolo + ')']);
    }
  });

  var tbAnom = h('table', { class: 'fej-guida' },
    h('tr', null, h('th', null, 'Voce'), h('th', null, 'Valore'))
  );
  righeAnom.forEach(function (riga) {
    tbAnom.appendChild(h('tr', null, h('td', null, riga[0]), h('td', null, h('strong', null, riga[1]))));
  });
  d.appendChild(tbAnom);

  // 4. Classifica operatori e andamento
  var ops = andamento.operatori || [];
  d.appendChild(h('h3', null, 'Classifica e andamento per persona'));
  if (!ops.length) {
    d.appendChild(h('p', { class: 'fej-tenue' }, 'Nessun dato di andamento operatori.'));
  } else {
    var tbOps = h('table', { class: 'fej-guida' },
      h('tr', null, ['Persona / Operatore', 'Stato', 'Provette', 'Fuori registro', 'Ritmo medio (all\'ora)', 'Ritmo 20 min', 'Ultimo prelievo', 'Tempo lavoro'].map(function (t) { return h('th', null, t); }))
    );
    ops.forEach(function (op) {
      tbOps.appendChild(h('tr', null,
        h('td', null, h('strong', null, op.operatore)),
        h('td', null, op.stato),
        h('td', null, h('strong', null, str(op.provette))),
        h('td', null, str(op.problematiche)),
        h('td', null, Math.round(op.ritmoMedio) + '/h'),
        h('td', null, Math.round(op.ritmo20) + '/h'),
        h('td', null, op.ultima || '—'),
        h('td', null, op.minutiDiLavoro + ' min')
      ));
    });
    d.appendChild(tbOps);
  }

  var stima = andamento.stima;
  if (stima && stima.mancanti > 0) {
    d.appendChild(h('p', { class: 'fej-avviso' },
      'Stima fine lavori: ' + stima.mancanti + ' capi mancanti, ritmo attuale ' + Math.round(stima.provetteOra) + ' provette/h' +
      (stima.minuti != null ? ' · circa ' + stima.minuti + ' minuti alla fine' : '') + '.'
    ));
  }

  // 3. Produttività della gestione (processo globale, mai per persona)
  var gest = S.ap && S.ap.produttivitaGestione;
  if (gest) {
    d.appendChild(h('h3', null, 'Produttività della gestione campioni'));
    d.appendChild(h('p', { class: 'fej-tenue' }, 'Avanzamento del processo di sistemazione e riordino (globale, non per persona).'));
    var stAv = gest;
    if (stAv) {
      d.appendChild(h('p', null,
        'Plateau completi: ' + stAv.plateauCompleti + ' · Da completare: ' + stAv.plateauDaCompletare + ' · Fuori registro da svuotare: ' + stAv.plateauDaSvuotare + ' · ' +
        'Fuori registro sistemati: ' + stAv.problematiciSistemati + ' / ' + stAv.totaleProblematiciIniziali + ' (residui: ' + stAv.problematiciResidui + ')'
      ));
      if (stAv.stimaMinutiFine != null) {
        d.appendChild(h('p', { class: 'fej-avviso' },
          'Ritmo gestione: ' + Math.round(stAv.azioniOra) + ' azioni/h · circa ' + stAv.stimaMinutiFine + ' minuti al completamento della sistemazione.'
        ));
      }
    }
  }

  if (gest && gest.fasceOrarie && gest.fasceOrarie.length) {
    var massimo = Math.max.apply(null, gest.fasceOrarie.map(function (f) { return f.totale; }));
    d.appendChild(h('h3', null, 'Azioni di gestione nel tempo'));
    gest.fasceOrarie.forEach(function (f) {
      d.appendChild(h('p', null, f.ora + ': ' + f.totale + ' azioni · ' + Object.keys(f.perTipoAzione).map(function (t) { return t + ': ' + f.perTipoAzione[t]; }).join(' · ')));
      var ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg'), rect = document.createElementNS(ns, 'rect');
      svg.setAttribute('viewBox', '0 0 100 4'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', f.ora + ': ' + f.totale + ' azioni');
      rect.setAttribute('width', String(f.totale * 100 / massimo)); rect.setAttribute('height', '4'); rect.setAttribute('fill', '#1b8a3a'); svg.appendChild(rect); d.appendChild(svg);
    });
  }
  // 4. Riepilogo dei problematici e delle modifiche in gestione
  var riep = S.ap && S.ap.riepilogoProblematici;
  if (riep) {
    d.appendChild(h('h3', null, 'Riepilogo fuori registro e modifiche tardive'));
    d.appendChild(h('p', null,
      'Totale fuori registro gestiti: ' + riep.totaleProblematici + ' · Registrazioni tardive: ' + riep.totaleRegistrazioniTardive + ' · Modifiche tardive: ' + riep.totaleModificheTardive
    ));

    d.appendChild(h('button', {type: 'button', onclick: function () {
      scarica('riepilogo_problematici.csv', 'text/csv;charset=utf-8', '\ufeff' + S.ap.riepilogoProblematiciCsv);
    }}, 'Scarica report CSV per l’ufficio'));
    (riep.modificheGestione || []).forEach(function (m) { d.appendChild(h('p', null, m.titolo + ': ' + m.totale)); });
    var tbProb = h('table', { class: 'fej-guida' },
      h('tr', null, [h('th', null, 'Fattispecie'), h('th', null, 'Numero')].concat(Object.keys(riep.perEsito).map(function(e){ return h('th', null, e); })))
    );
    Object.keys(riep.perFattispecie).forEach(function (fat) {
      var probtFat = (riep.problematici || []).filter(function (p) { return p.fattispecie === fat; });
      var riga = [h('td', null, h('strong', null, fat)), h('td', null, String(riep.perFattispecie[fat]))];
      Object.keys(riep.perEsito).forEach(function (esito) {
        var cnt = probtFat.filter(function (p) { return p.esitoFinale === esito; }).length;
        riga.push(h('td', null, String(cnt)));
      });
      tbProb.appendChild(h('tr', null, riga));
    });
    d.appendChild(tbProb);
  }

  Array.prototype.slice.call(d.querySelectorAll('table')).forEach(function (t) {
    var scorre = h('div', { class: 'fej-tabella-scorre', tabindex: '0', role: 'region', 'aria-label': 'Tabella statistiche scorrevole' });
    t.parentNode.insertBefore(scorre, t); scorre.appendChild(t);
  });
  return d;
}

/* Senza lo script di ARVET gli snippet sarebbero incompleti: quei file non si offrono (nemmeno nello zip). */
function conMotore(f) { return !S.erroreMotore || !/^snippet_arvet_/.test(f.nome); }
/* Per l'allevatore (utente, 2026-11-13: «vorrei che anche il sito potesse produrre il report per l'allevatore»): per
   stabilimento le cose da fare e il report in Excel del motore di fine lavori, e i capi da registrare in BDN
   (SchemaBdn, come nello zip dell'app), anche in una pagina da stampare e consegnare. */
function paginaAllevatore(codice, cose, bdn) {
  var e = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  return '<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Per l\u2019allevatore · ' + e(codice) + '</title>' +
    '<style>body{font-family:sans-serif;margin:15mm;color:#000;background:#fff}h1{font-size:15pt;margin:0 0 6mm}pre{white-space:pre-wrap;font:11pt/1.45 sans-serif;margin:0 0 8mm}</style></head><body>' +
    '<h1>Profilassi della brucellosi ovicaprina · stabilimento ' + e(codice) + '</h1>' + (cose ? '<pre>' + e(cose) + '</pre>' : '') + (bdn ? '<pre>' + e(bdn) + '</pre>' : '') +
    (!cose && !bdn ? '<p>Nessuna cosa da fare.</p>' : '') + '</body></html>';
}
/* L'esito del risanamento per l'allevatore (utente, 2026-11-17): discorsivo e con gli elenchi, capo per capo; il modulo
   è allevatore.js. La pagina di ARVET salvata dal browser è facoltativa: se c'è, dove campo e ARVET differiscono vale
   ARVET. */
var arvetPagine = {};
/* Le precisazioni dell'esito che il registro non ha (utente, 2026-11-19: l'esito rivisto «deve poter essere prodotto
   automaticamente»): nota per l'ufficio, animali mai registrati in Fejalog, capo scelto al posto di un capo uscito a cui è
   intestato un campione. Per progetto (il pacchetto, non il backup: restano anche caricando un backup più recente) e per
   stabilimento; stanno nel browser e viaggiano nello zip di fine lavori. Il resto l'esito lo ricava dal registro. */
var precisazioniMem = null;
function chiavePrecisazioni() { return 'fejalog:precisazioni:' + String(S.P.chiave).split(':')[0]; }
function tuttePrecisazioni() {
  var k = chiavePrecisazioni();
  if (precisazioniMem && precisazioniMem.k === k) return precisazioniMem.v;
  var v = {}; try { v = JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { v = {}; }
  precisazioniMem = { k: k, v: v }; return v;
}
function precisazioniDi(cod) { var t = tuttePrecisazioni(); return t[cod] || (t[cod] = { notaUfficio: '', attribuzioneManuale: '', altri: [], alPostoDi: {} }); }
function salvaPrecisazioni() { try { localStorage.setItem(chiavePrecisazioni(), JSON.stringify(tuttePrecisazioni())); } catch (e) { /* in memoria */ } }
function precisazioniPiene(cod) {
  var p = (tuttePrecisazioni()[cod]) || {};
  return (p.notaUfficio ? 1 : 0) + (p.attribuzioneManuale ? 1 : 0) + (p.altri || []).length + Object.keys(p.alPostoDi || {}).filter(function (k) { return p.alPostoDi[k] && p.alPostoDi[k].capo; }).length;
}
/* L'esito di uno stabilimento coi dati della sessione e le precisazioni scritte nella pagina. */
function esitoDi(st) {
  if (S.apVecchio || !S.ap) aggiornaRisultato();
  var primo = (S.ap.eventiEfficaci || []).filter(function (e) { return e.tipo === 'PROVETTA_REGISTRATA'; })[0];
  var g = primo ? String(primo.ts).slice(0, 10).split('-') : [], p = precisazioniDi(st.codice), pre = { altri: p.altri || [], alPostoDi: p.alPostoDi || {} };
  if (p.notaUfficio) pre.notaUfficio = p.notaUfficio;
  if (p.attribuzioneManuale) pre.attribuzioneManuale = p.attribuzioneManuale;
  return window.FejAllevatore.crea({ data: g.length === 3 ? g[2] + '/' + g[1] + '/' + g[0] : '', stabilimento: st, provette: S.ap.provette, eventi: S.ap.eventiEfficaci, voci: S.banco.coda().voci,
    scheda: function (uid) { return S.banco.scheda(uid, ''); }, assenti: S.ap.nonPrelevati, usciteModello: (function () { try { return S.banco.usciteModello(); } catch (e) { return []; } })(),
    arvet: arvetPagine[st.codice] || null, precisazioni: pre });
}
function nomeEsito(st) { return 'esito_risanamento_' + String(st.codice).replace(/[^A-Za-z0-9_-]/g, '_'); }
/* Il riquadro delle precisazioni di uno stabilimento: si apre solo se serve. */
function riquadroPrecisazioni(st) {
  var cod = st.codice, p = precisazioniDi(cod), n = precisazioniPiene(cod);
  var box = h('details', { class: 'fej-blocco fej-precisazioni', 'data-precisazioni': cod }, h('summary', null, 'Precisazioni per l’esito (ciò che il registro non sa)' + (n ? ' · ' + n : '')));
  box.appendChild(h('p', { class: 'fej-guida' }, 'Il resto l’esito lo prende da solo dal registro: il doppio rimasto unico campione («L’altra provetta non esiste» nella scheda della provetta), la nota per l’allevatore scritta nella scheda, le uscite per modello, la pagina di ARVET.'));
  var nota = h('textarea', { rows: 2, id: 'fej-pre-nota-' + cod, onchange: function () { p.notaUfficio = nota.value.trim(); salvaPrecisazioni(); } }, p.notaUfficio || '');
  box.appendChild(h('label', { class: 'fej-blocco' }, 'Nota per l’ufficio (va solo nell’appendice, non all’allevatore)', nota));
  if (arvetPagine[cod]) {
    var man = h('input', { type: 'text', id: 'fej-pre-manuale-' + cod, value: p.attribuzioneManuale || '', onchange: function () { p.attribuzioneManuale = man.value.trim(); salvaPrecisazioni(); } });
    box.appendChild(h('label', { class: 'fej-blocco' }, 'Capi in ARVET senza una provetta in Fejalog: come si riconosce l’animale prelevato al loro posto', man));
    // un campione intestato in ARVET a un capo uscito con modello: all'allevatore si chiede il duplicato di un altro capo assente
    var intestati = []; try { intestati = esitoDi(st).ufficio.intestatiAUsciti || []; } catch (e) { intestati = []; }
    intestati.forEach(function (x) {
      var sc = (p.alPostoDi = p.alPostoDi || {})[x.capo] || { capo: '', animale: '' };
      var sel = h('select', { 'data-al-posto': x.capo, onchange: function () { sc.capo = sel.value; p.alPostoDi[x.capo] = sc; salvaPrecisazioni(); disegna(); } },
        h('option', { value: '' }, '— da scegliere —'));
      x.candidati.forEach(function (c) {
        var o = h('option', { value: c.contrassegno }, [c.contrassegno, c.sesso, c.razza, c.nascita].filter(Boolean).join(' · '));
        if (c.contrassegno === sc.capo) o.selected = true; sel.appendChild(o);
      });
      var an = h('input', { type: 'text', value: sc.animale || '', placeholder: x.animale, onchange: function () { sc.animale = an.value.trim(); p.alPostoDi[x.capo] = sc; salvaPrecisazioni(); } });
      box.appendChild(h('div', { class: 'fej-blocco' }, h('strong', null, 'Campione intestato in ARVET a ' + x.capo + ', uscito con un modello.'),
        h('label', { class: 'fej-blocco' }, 'Capo assente compatibile per cui chiedere il duplicato' + (x.sesso ? ' (il capo uscito è ' + x.sesso + ': guarda il sesso dell’animale prelevato)' : ''), sel),
        h('label', { class: 'fej-blocco' }, 'Come si riconosce l’animale prelevato', an)));
    });
  }
  // animali presenti che non sono dello stabilimento e non sono stati registrati in Fejalog (campione non inviato, marca non letta…)
  box.appendChild(h('h5', null, 'Animali non dello stabilimento, mai registrati in Fejalog'));
  (p.altri || []).forEach(function (r, i) {
    box.appendChild(h('div', { class: 'fej-riga', 'data-pre-altro': String(i) }, [r.Marca, r.Specie, r.Sesso, r.Razza, r.Nascita, r.Situazione, r['Stabilimento in BDN']].filter(Boolean).join(' · '), ' ',
      h('button', { type: 'button', onclick: function () { p.altri.splice(i, 1); salvaPrecisazioni(); disegna(); } }, 'Togli')));
  });
  var campi = {};
  function campo(nome, etichetta, segnaposto) { campi[nome] = h('input', { type: 'text', 'data-pre-campo': nome, placeholder: segnaposto || '' }); return h('label', null, etichetta + ' ', campi[nome]); }
  var specie = h('select', { 'data-pre-campo': 'Specie' }, h('option', { value: 'ovini' }, 'ovini'), h('option', { value: 'caprini' }, 'caprini'));
  box.appendChild(h('div', { class: 'fej-riga' }, campo('Marca', 'Marca', 'se non si sa: DA CONFERMARE'), ' ', h('label', null, 'Specie ', specie), ' ', campo('Sesso', 'Sesso', 'F o M'), ' ',
    campo('Razza', 'Razza'), ' ', campo('Nascita', 'Nascita'), ' ', campo('Stabilimento in BDN', 'Stabilimento in BDN'), h('label', { class: 'fej-blocco' }, 'Situazione ', (campi.Situazione = h('input', { type: 'text', 'data-pre-campo': 'Situazione', placeholder: 'per esempio: rimasta nel gregge dalla demonticazione, campione non inviato' }))),
    h('button', { type: 'button', 'data-pre-aggiungi': cod, onclick: function () {
      if (!campi.Situazione.value.trim() && !campi.Marca.value.trim()) { S.messaggio = 'Scrivi almeno la marca o la situazione dell’animale.'; messaggio(); return; }
      (p.altri = p.altri || []).push({ Marca: campi.Marca.value.trim().toUpperCase() || 'DA CONFERMARE', Specie: specie.value, Sesso: campi.Sesso.value.trim().toUpperCase(), Razza: campi.Razza.value.trim(),
        Nascita: campi.Nascita.value.trim(), Situazione: campi.Situazione.value.trim(), 'Stabilimento in BDN': campi['Stabilimento in BDN'].value.trim().toUpperCase() });
      salvaPrecisazioni(); precisazioniAperte[cod] = true; disegna();
    } }, 'Aggiungi')));
  if (precisazioniAperte[cod]) box.open = true;
  box.addEventListener('toggle', function () { precisazioniAperte[cod] = box.open; });
  return box;
}
var precisazioniAperte = {};
function esitoPerAllevatore() {
  var All = window.FejAllevatore, d = h('div', { id: 'fej-esito-allevatore' });
  d.appendChild(h('h4', null, 'Esito del risanamento (da consegnare)'));
  d.appendChild(h('p', { class: 'fej-guida' }, 'Una pagina per stabilimento: in testa, in parole semplici, che cosa è stato riscontrato; poi gli elenchi capo per capo (capi considerati presenti, marche da ordinare, marche non registrate, usciti, non prelevati). In fondo un’appendice solo per l’ufficio.'));
  var costruisci = esitoDi;
  ((S.ap && S.ap.stabilimenti) || []).forEach(function (st) {
    var nome = nomeEsito(st);
    var caricata = arvetPagine[st.codice] ? Object.keys(arvetPagine[st.codice]).map(function (sp) { return sp + ' ' + arvetPagine[st.codice][sp].length; }).join(', ') : '';
    var file = h('input', { type: 'file', accept: '.html,.htm,text/html', 'aria-label': 'Pagina di ARVET salvata per ' + st.codice, onchange: function (ev) {
      var f = ev.target.files && ev.target.files[0]; if (!f) return;
      f.text().then(function (t) {
        var r = All.leggiArvet(new DOMParser().parseFromString(t, 'text/html'));
        if (!r.righe.length || !r.specie) { S.messaggio = 'In questo file non trovo l’elenco dei capi di un campionamento di ARVET.'; messaggio(); return; }
        arvetPagine[st.codice] = arvetPagine[st.codice] || {}; arvetPagine[st.codice][r.specie] = r.righe;
        S.messaggio = 'Pagina di ARVET letta: ' + r.righe.length + ' capi (' + r.specie + ').'; disegna();
      });
    } });
    d.appendChild(h('div', { class: 'fej-riga', 'data-esito': st.codice }, h('strong', null, st.codice), ' ',
      h('button', { type: 'button', class: 'fej-primario', onclick: function () {
        var html = costruisci(st).html, u = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' })), w = window.open(u, '_blank');
        if (!w) scarica(nome + '.html', 'text/html;charset=utf-8', html);
        setTimeout(function () { URL.revokeObjectURL(u); }, 60000);
      } }, 'Apri l’esito'), ' ',
      h('button', { type: 'button', onclick: function () { scarica(nome + '.html', 'text/html;charset=utf-8', costruisci(st).html); } }, 'Scarica la pagina'), ' ',
      h('button', { type: 'button', onclick: function () { scarica(nome + '.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', window.AccXlsx.xlsxBuild(costruisci(st).fogli)); } }, 'Excel'),
      h('label', { class: 'fej-blocco fej-guida' }, 'Pagina di ARVET salvata (facoltativa, una per specie)' + (caricata ? ' · caricata: ' + caricata : '') + ' ', file),
      riquadroPrecisazioni(st)));
  });
  return d;
}
function sezioneAllevatore(primoStab) {
  var d = h('section', { id: 'fej-allevatore' }, h('h3', null, 'Per l\u2019allevatore'));
  if (window.FejAllevatore && window.AccXlsx && S.ap && S.banco) d.appendChild(esitoPerAllevatore());
  d.appendChild(h('p', null, 'Da consegnare all\u2019allevatore e al suo delegato in BDN, una pagina per stabilimento: marche da sostituire, correzioni di sesso, smarriti ritrovati, capi non provati, ricercati e capi da registrare in BDN (animali senza contrassegno, marche applicate in campo).'));
  var cose = filesDi('.txt', 'cose_da_fare'), report = filesDi('.xlsx', 'report_allevatore'), codici = [];
  cose.concat(report).forEach(function (x) { if (codici.indexOf(x.u.codice) < 0) codici.push(x.u.codice); });
  if (!codici.length) { d.appendChild(h('p', null, 'Nessun file: non ci sono provette da chiudere.')); return d; }
  var perStab = (S.ap && S.ap.daRegistrareInBdnPerStab) || {};
  codici.forEach(function (cod) {
    var c = cose.filter(function (x) { return x.u.codice === cod; })[0], r = report.filter(function (x) { return x.u.codice === cod; })[0];
    var html = paginaAllevatore(cod, c ? c.f.testo : '', perStab[cod] || ''), nome = 'per_allevatore_' + String(cod).replace(/[^A-Za-z0-9_-]/g, '_') + '_' + S.esito.stamp + '.html';
    d.appendChild(h('p', { class: 'fej-riga', 'data-allevatore': cod }, h('strong', null, cod), ' ',
      h('button', { type: 'button', onclick: function () {
        var u = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' })), w = window.open(u, '_blank');
        if (w) w.addEventListener('load', function () { w.print(); }, { once: true });
        setTimeout(function () { URL.revokeObjectURL(u); }, 60000);
      } }, 'Stampa la pagina'), ' ',
      h('button', { type: 'button', onclick: function () { scarica(nome, 'text/html;charset=utf-8', html); } }, 'Scarica la pagina'), ' ',
      r ? h('button', { type: 'button', onclick: function () { scarica(r.f.nome, r.f.mime, datiFile(r.f)); } }, 'Report in Excel') : null, ' ',
      c ? h('button', { type: 'button', onclick: function () { scarica(c.f.nome, 'text/plain;charset=utf-8', c.f.testo); } }, 'Cose da fare (testo)') : null));
  });
  if (S.ap && S.ap.registrazioneBdnCsv) d.appendChild(h('p', null, h('button', { type: 'button', onclick: function () {
    scarica('registrazione_bdn_' + primoStab + '_' + S.esito.stamp + '.csv', 'text/csv;charset=utf-8', '\uFEFF' + S.ap.registrazioneBdnCsv.replace(/\r?\n/g, '\r\n'));
  } }, 'Capi da registrare in BDN (CSV, tutto il progetto)')));
  // la corrispondenza marcatura provvisoria → capo da rimarcare (utente, 2026-11-14)
  if (S.ap && S.ap.animaliDaRimarcareCsv) d.appendChild(h('p', null, h('button', { type: 'button', id: 'fej-btn-rimarcare', onclick: function () {
    scarica('animali_da_rimarcare_' + primoStab + '_' + S.esito.stamp + '.csv', 'text/csv;charset=utf-8', '\uFEFF' + S.ap.animaliDaRimarcareCsv.replace(/\r?\n/g, '\r\n'));
  } }, 'Animali da rimarcare: marcatura provvisoria → capo (CSV)')));
  return d;
}
function filesDi(estensione, prefisso) {
  var out = [];
  ((S.esito && S.esito.uscite) || []).forEach(function (u) { (u.uscita.file || []).filter(conMotore).forEach(function (f) { if ((!prefisso || f.nome.indexOf(prefisso) === 0) && (!estensione || f.nome.slice(-estensione.length) === estensione)) out.push({ u: u, f: f }); }); });
  return out;
}
function schedaSnippet() {
  var d = h('div');
  if (S.erroreMotore) d.appendChild(h('p', { class: 'fej-errore' }, 'Lo script di ARVET non si è caricato: gli snippet qui sotto non sono utilizzabili. Ricarica la pagina.'));
  d.appendChild(h('p', { class: 'fej-avviso' }, 'Prove: prima dello snippet scrivi window.__ARVET_PROVA__=true; nella console di ARVET, così prepara i campi senza confermare. In ARVET vero non salvare mai durante le prove.'));
  var snip = S.erroreMotore ? [] : filesDi('.txt', 'snippet_arvet_');
  if (!snip.length) d.appendChild(h('p', null, 'Nessuno snippet: non ci sono provette da inviare.'));
  snip.forEach(function (x) {
    var nonConforme = /_NON_CONFORME/.test(x.f.nome);
    var invio = ((x.u.uscita.riepilogo && x.u.uscita.riepilogo.invii) || []).filter(function (v) { return v.conforme === false; });
    d.appendChild(h('h3', null, x.u.codice + ' · ' + x.f.nome.replace(/^snippet_arvet_/, '').replace(/_NON_CONFORME/, '').replace(/_\d{4}-.*$/, ''), nonConforme ? h('span', { class: 'fej-non-conforme' }, ' ⚠ NON CONFORME') : null));
    if (nonConforme) d.appendChild(h('p', { class: 'fej-avviso' }, 'Questo snippet non rispetta ancora le regole di ARVET (', invio.map(function (v) { return v.titolo + ': ' + v.errori.slice(0, 6).join(' · ') + (v.errori.length > 6 ? ' …' : ''); }).join('; ') || 'vedi la pagina degli snippet',
      '). Si può usare lo stesso: porta solo le righe sicure; da completare a mano in ARVET: ',
      h('strong', null, invio.map(function (v) { return (v.a_mano || []).map(function (r) { return r.provetta + ' → ' + r.contrassegno; }).join(' · '); }).filter(Boolean).join(' · ') || 'nessuna riga'), '.'));
    d.appendChild(h('p', null, h('button', { type: 'button', onclick: function () { copia(x.f.testo); } }, '⧉ Copia lo snippet'), ' ', h('button', { type: 'button', onclick: function () { scarica(x.f.nome, 'text/plain;charset=utf-8', x.f.testo); } }, 'Scarica .txt')));
    d.appendChild(h('textarea', { readonly: true, rows: 4, class: 'fej-snippet', 'aria-label': 'Snippet ' + x.f.nome }, x.f.testo.slice(0, 2000) + (x.f.testo.length > 2000 ? '…' : '')));
  });
  // lo snippet generico di svet-tools: vuota tutti i «Numero campione» senza togliere i capi né cambiare l'ordine
  d.appendChild(h('h3', null, 'Svuota i numeri (snippet generico)'));
  d.appendChild(h('p', { class: 'fej-guida' }, 'Per la doppia accettazione dei maschi con «Duplica accettazione» di ARVET: 1) duplica l’accettazione; 2) incolla questo snippet, che svuota tutti i «Numero campione» lasciando i capi e l’ordine; 3) incolla lo snippet dei maschi, che riscrive i numeri sui capi già presenti. Non salva niente da solo.'));
  d.appendChild(h('p', null, h('button', { type: 'button', id: 'fej-copia-svuota', onclick: function () {
    fetch(base + 'vendor/arvet_clear.js').then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.text(); })
      .then(function (t) { copia(t); }, function () { S.messaggio = 'Non riesco a caricare lo snippet «Svuota i numeri»: ricarica la pagina.'; messaggio(); });
  } }, '⧉ Copia «Svuota i numeri»')));
  d.appendChild(h('h3', null, 'File per i 3 invii'));
  filesDi('', 'arvet_').concat(filesDi('.csv', 'provette_arvet_')).forEach(function (x) { d.appendChild(rigaFile(x.f)); });
  return d;
}
function rigaFile(f) { return h('div', { class: 'fej-riga' }, h('code', null, f.nome), ' ', h('button', { type: 'button', onclick: function () { scarica(f.nome, f.mime, datiFile(f)); } }, 'Scarica')); }
function schedaUscite() {
  var d = h('div');
  d.appendChild(h('p', null, 'Tutti i file di fine lavori, calcolati con le azioni fatte qui.'));
  var tutti = filesDi('', '');
  if (S.erroreMotore) d.appendChild(h('p', { class: 'fej-errore' }, 'Lo script di ARVET non si è caricato: gli snippet non sono inclusi. Ricarica la pagina.'));

  var primoStab = (S.P.pacchetto.config && S.P.pacchetto.config.stabilimenti_lavoro && S.P.pacchetto.config.stabilimenti_lavoro[0] && S.P.pacchetto.config.stabilimenti_lavoro[0].codice) || (S.P.esporti && S.P.esporti[0] && S.P.esporti[0].codice) || 'stabilimento';
  primoStab = primoStab.replace(/[^A-Za-z0-9_-]/g, '_');

  var btnZipTutto = h('button', {
    type: 'button',
    id: 'fej-btn-scarica-zip-fine-lavori',
    disabled: !tutti.length,
    onclick: function () {
      var voci = tutti.map(function (x) { return { name: x.f.nome, data: datiFile(x.f) }; });
      if (S.ap && S.ap.riepilogoProblematiciCsv) voci.push({name: 'riepilogo_problematici_' + primoStab + '_' + S.esito.stamp + '.csv', data: '\uFEFF' + S.ap.riepilogoProblematiciCsv});
      if (S.ap && S.ap.senzaTransponderCsv) {
        voci.push({
          name: 'senza_transponder_' + primoStab + '_' + S.esito.stamp + '.csv',
          data: '\uFEFF' + S.ap.senzaTransponderCsv.replace(/\n/g, '\r\n')
        });
      }
      if (S.ap && S.ap.registrazioneBdnCsv) {
        voci.push({ name: 'registrazione_bdn_' + primoStab + '_' + S.esito.stamp + '.csv', data: '\uFEFF' + S.ap.registrazioneBdnCsv.replace(/\r?\n/g, '\r\n') });
        voci.push({ name: 'da_registrare_in_bdn_' + primoStab + '_' + S.esito.stamp + '.txt', data: S.ap.daRegistrareInBdnTxt });
        if (S.ap.animaliDaRimarcareCsv) voci.push({ name: 'animali_da_rimarcare_' + primoStab + '_' + S.esito.stamp + '.csv', data: '\uFEFF' + S.ap.animaliDaRimarcareCsv.replace(/\r?\n/g, '\r\n') });
      }
      if (S.ap && S.ap.ricercatiCsv) {
        voci.push({
          name: 'ricercati_' + primoStab + '_' + S.esito.stamp + '.csv',
          data: '\uFEFF' + S.ap.ricercatiCsv.replace(/\n/g, '\r\n')
        });
      }
      S.ap.esporti.forEach(function (e) {
        voci.push({ name: 'export_accettazione_' + e.codice + '_fejalog.json', data: JSON.stringify(e.export, null, 1) });
        voci.push({ name: 'anteprima/export_accettazione_' + e.codice + '_fejalog.json', data: JSON.stringify(e.export, null, 1) });
      });
      Object.keys(S.ap.backupFiles).filter(function (k) { return k === 'pacchetto.json' || k === 'backup.json' || k === 'fejalog-modifiche.json' || /^(registro|export)\//.test(k); }).forEach(function (k) {
        voci.push({ name: k, data: S.ap.backupFiles[k] });
      });
      (S.dueTrentatreFinali || []).forEach(function (d33) {
        if (d33.ok && d33.html) {
          voci.push({ name: d33.nome, data: d33.html });
        }
      });
      voci.push({ name: 'numerazione_chiave.csv', data: S.P.numerazioneCsv });
      // l'esito del risanamento per l'allevatore, uno per stabilimento, e le precisazioni con cui è stato fatto
      if (window.FejAllevatore && window.AccXlsx && S.banco) try {
        ((S.ap && S.ap.stabilimenti) || []).forEach(function (st) {
          var r = esitoDi(st);
          voci.push({ name: 'allevatore/' + nomeEsito(st) + '.html', data: r.html });
          voci.push({ name: 'allevatore/' + nomeEsito(st) + '.xlsx', data: window.AccXlsx.xlsxBuild(r.fogli) });
        });
        if (Object.keys(tuttePrecisazioni()).some(precisazioniPiene)) voci.push({ name: 'allevatore/precisazioni_esito.json', data: JSON.stringify(tuttePrecisazioni(), null, 1) });
      } catch (eEsito) { voci.push({ name: 'allevatore/ERRORE.txt', data: 'Esito per l\u2019allevatore non calcolato: ' + eEsito.message }); }
      voci.push({
        name: 'LEGGIMI.txt',
        data: 'Fine lavori calcolata dagli strumenti on line di Fejalog (dal backup ' + (S.P.manifesto ? S.P.manifesto.seduta.nome : 'seduta') + ', impronta ' + (S.P.verifica ? S.P.verifica.impronta.slice(0, 6).toUpperCase() : '') + ').\r\nIl backup originale resta quello della Regia.\r\n'
      });
      scarica('fejalog_fine_lavori_' + S.esito.stamp + '.zip', 'application/zip', Zip.scrivi(voci));
    }
  }, 'Scarica tutto (zip)');

  var btnBackupAggiornato = h('button', {
    type: 'button',
    id: 'fej-btn-scarica-backup-aggiornato',
    style: 'margin-left: .5rem;',
    disabled: !S.ap || !S.ap.backupFiles,
    onclick: function () {
      if (!S.ap || !S.ap.backupFiles) return;
      var bf = S.ap.backupFiles;
      var voci = [];
      Object.keys(bf).forEach(function (nome) {
        voci.push({ name: nome, data: bf[nome] });
      });
      var nomeSeduta = (S.P.manifesto && S.P.manifesto.seduta && S.P.manifesto.seduta.nome) || 'seduta';
      scarica('fejalog_backup_' + nomeSeduta + '_aggiornato.zip', 'application/zip', Zip.scrivi(voci));
    }
  }, 'Scarica backup e modifiche (zip)');

  d.appendChild(h('p', null, btnZipTutto, btnBackupAggiornato));

  d.appendChild(h('p', { class: 'fej-tenue' }, 'Il backup conserva il registro ricevuto. Il file fejalog-modifiche.json allegato contiene le azioni da importare sulla Regia con anteprima.'));
  d.appendChild(sezioneAllevatore(primoStab));

  // Sezione 2/33 finale
  d.appendChild(h('h3', null, '2/33 finale di ARVET (numeri definitivi)'));
  d.appendChild(h('p', null, 'Carica uno o più file HTML del modello 2/33 salvati da ARVET: il sito compila la colonna Provetta con i numeri definitivi dopo il Riordino (lasciando vuoti i non prelevati ed evidenziando in grigio i maschi ovini).'));

  var inp233 = h('input', {
    type: 'file',
    multiple: true,
    accept: '.htm,.html',
    id: 'fej-input-233-finale',
    'aria-label': 'File 2/33 di ARVET',
    onchange: function (ev) {
      var files = Array.prototype.slice.call(ev.target.files);
      if (!files.length) return;
      var St = typeof window !== 'undefined' && window.Stampe ? window.Stampe : (typeof Stampe !== 'undefined' ? Stampe : null);
      if (!St) {
        S.messaggio = 'Modulo stampe non disponibile.'; messaggio(); return;
      }
      var sistMappa = {};
      ((S.esito && S.esito.uscite) || []).forEach(function (u) {
        var stab = Progetto.stabilimento(S.P, u.codice);
        sistMappa[u.codice] = {
          lettera: stab ? (stab.lettera || '') : '',
          dati: u.uscita.dati
        };
      });
      var datiFinali;
      var progettoLetto = S.P, azioniLette = JSON.stringify(S.stato.azioni());
      try { datiFinali = S.banco.numerazioneFinale(sistMappa); }
      catch (e) { S.messaggio = '2/33 non prodotto: ' + e.message; messaggio(); return; }
      var letture = files.map(function (f) {
        return new Promise(function (resolve) {
          var reader = new FileReader();
          reader.onload = function () {
            var testo = reader.result;
            var res = St.precompila(testo, datiFinali);
            resolve({ nomeOriginale: f.name, res: res });
          };
          reader.onerror = function () {
            resolve({ nomeOriginale: f.name, res: { ok: false, errore: 'Errore nella lettura del file' } });
          };
          reader.readAsText(f, 'utf-8');
        });
      });
      Promise.all(letture).then(function (risultati) {
        if (S.P !== progettoLetto || JSON.stringify(S.stato.azioni()) !== azioniLette) return;
        risultati.forEach(function (r) {
          var res = r.res;
          if (res.ok) {
            var nomeUscita = '2-33_finale_' + res.stabilimento + '_' + res.specie + '.html';
            S.dueTrentatreFinali = S.dueTrentatreFinali.filter(function (x) { return x.chiave !== (res.stabilimento + ':' + res.specie); });
            S.dueTrentatreFinali.push({
              chiave: res.stabilimento + ':' + res.specie,
              nome: nomeUscita,
              nomeOriginale: r.nomeOriginale,
              stabilimento: res.stabilimento,
              specie: res.specie,
              html: res.html,
              avvisi: res.avvisi || [],
              ok: true
            });
          } else {
            S.dueTrentatreFinali.push({
              nomeOriginale: r.nomeOriginale,
              ok: false,
              errore: res.errore || 'Formato 2/33 non riconosciuto'
            });
          }
        });
        S.messaggio = 'Elaborati ' + risultati.length + ' file 2/33.';
        disegna();
      });
    }
  });

  d.appendChild(h('p', null, h('label', null, 'Carica file 2/33 (.htm): ', inp233)));

  if (S.dueTrentatreFinali && S.dueTrentatreFinali.length) {
    var box233 = h('div', { class: 'fej-box-233', style: 'margin-bottom: 1rem;' });
    S.dueTrentatreFinali.forEach(function (item) {
      var riga = h('div', { class: 'fej-riga', style: 'margin-bottom: .4rem;' });
      if (item.ok) {
        riga.appendChild(h('strong', null, item.nomeOriginale + ' → ' + item.nome));
        riga.appendChild(h('span', { class: 'fej-tenue' }, ' (' + item.stabilimento + ' · ' + item.specie + ') '));
        riga.appendChild(h('button', {
          type: 'button',
          onclick: function () { scarica(item.nome, 'text/html;charset=utf-8', item.html); }
        }, 'Scarica ' + item.nome));
        if (item.avvisi && item.avvisi.length) {
          var ul = h('ul', { style: 'margin:.2rem 0 0 1rem; font-size:.9em; color:#d97706;' });
          item.avvisi.forEach(function (avv) { ul.appendChild(h('li', null, avv)); });
          riga.appendChild(ul);
        }
      } else {
        riga.appendChild(h('strong', null, item.nomeOriginale));
        riga.appendChild(h('span', { class: 'fej-errore' }, ' ' + item.errore));
      }
      box233.appendChild(riga);
    });
    d.appendChild(box233);
  }

  d.appendChild(h('h3', null, 'Tutti i singoli file'));

  if (S.esito && S.esito.uscite) {
    S.esito.uscite.forEach(function (u) {
      if (u.errori.length) d.appendChild(h('div', { class: 'fej-errore' }, u.codice + ': ' + u.errori.join(' · ')));
    });
  }

  // File CSV calcolati dal dominio
  if (S.ap && S.ap.senzaTransponderCsv) {
    var nomeCsvSt = 'senza_transponder_' + primoStab + '_' + S.esito.stamp + '.csv';
    d.appendChild(h('div', { class: 'fej-riga' },
      h('code', null, nomeCsvSt), ' ',
      h('button', {
        type: 'button',
        onclick: function () { scarica(nomeCsvSt, 'text/csv;charset=utf-8', '\uFEFF' + S.ap.senzaTransponderCsv.replace(/\n/g, '\r\n')); }
      }, 'Scarica')
    ));
  }
  if (S.ap && S.ap.ricercatiCsv) {
    var nomeCsvRic = 'ricercati_' + primoStab + '_' + S.esito.stamp + '.csv';
    d.appendChild(h('div', { class: 'fej-riga' },
      h('code', null, nomeCsvRic), ' ',
      h('button', {
        type: 'button',
        onclick: function () { scarica(nomeCsvRic, 'text/csv;charset=utf-8', '\uFEFF' + S.ap.ricercatiCsv.replace(/\n/g, '\r\n')); }
      }, 'Scarica')
    ));
  }

  tutti.forEach(function (x) { d.appendChild(rigaFile(x.f)); });
  return d;
}
function schedaEsporta() {
  var d = h('div'), az = S.stato.azioni().filter(function (a) { return Mod.TIPI.indexOf(a.tipo) >= 0; });
  d.appendChild(h('p', null, 'Il file con le azioni fatte qui, da importare nell\'app (Regia, a campionamento chiuso: Gestione campioni › Sul sito › Importa le modifiche dal sito). L\'app mostra un\'anteprima, scarta ciò che non è più coerente e scrive solo eventi nuovi. Il sito non scrive mai nel registro.'));
  var conta = {}; az.forEach(function (a) { conta[a.tipo] = (conta[a.tipo] || 0) + 1; });
  d.appendChild(h('ul', null, Object.keys(conta).map(function (k) { return h('li', null, conta[k] + ' × ' + k); })));
  if (!az.length) d.appendChild(h('p', { class: 'fej-tenue' }, 'Nessuna azione da riportare.'));
  d.appendChild(h('p', null, h('button', { type: 'button', disabled: !az.length, onclick: function () {
    var ora = new Date().toISOString();
    scarica(Mod.nomeFile(S.P, ora), 'application/json', JSON.stringify(Mod.esporta(S.P, az, nomeUtente(), ora), null, 1));
  } }, 'Scarica fejalog-modifiche')));
  if (pc && collegatoPc) d.appendChild(h('p', null, h('button', { type: 'button', disabled: !az.length || occupatoPc, onclick: function () {
    occupatoPc = true; disegna();
    pc.modifiche(JSON.stringify(Mod.esporta(S.P, az, nomeUtente()))).then(function (ris) {
      S.messaggio = 'File ricevuto: ' + (ris.in_attesa ? 'in attesa sul tablet.' : 'esiti: ' + ris.esiti.map(function (e) { return e.esito + (e.motivo ? ': ' + e.motivo : ''); }).join('; '));
      if (!ris.in_attesa) return pc.backup().then(leggiBackup);
    }, errorePc).then(function () { occupatoPc = false; disegna(); });
  } }, 'Invia alla Regia sul tablet')));
  return d;
}

/* ---- Banco: le provette fuori registro una alla volta (utente, 2026-11-13 notte; piano 2026-11-14_banco_fuori_registro) ----
   La provetta in mano (scritta, cifre o lettore) o «Prendi la prossima»; la scheda con la scritta da riconoscere, i dati
   registrati e quelli della BDN, la proposta e le alternative; dopo la scelta, dove metterla. Ogni scelta è un'azione di
   fejalog-modifiche v4 sulla sessione aperta: niente si rigioca da capo. */
var bancoUI = { uid: null, cerca: '', risultati: null, cifre: '', dest: {}, filtro: 'da_decidere', aperto: null, motivo: '', nelReport: null, marca: '' };
var MOTIVI_RIMANDO = ['Aspetto i dati BDN del capo', 'DDA da verificare', 'Da chiedere all’allevatore', 'Provetta da ricontrollare (scritta poco leggibile)'];
var STATI_BANCO = [['da_decidere', 'Da decidere'], ['accantonata', 'Accantonate'], ['decisa', 'Decise'], ['tolta', 'Tolte'], ['persa', 'Perse'], ['tutte', 'Tutte']];
var SEP_ACCANTONATA = ' — ', PREFISSO_ACCANTONATA = 'Accantonata: ';

function apriNelBanco(uid) {
  bancoUI.uid = uid; bancoUI.aperto = null; bancoUI.motivo = ''; bancoUI.cifre = ''; bancoUI.nelReport = null; bancoUI.marca = ''; bancoUI.tutti = false;
  if (S.scheda !== 'sistema') S.scheda = 'banco';
  disegna();
  var t = document.getElementById('fej-banco-scheda'); if (t && t.scrollIntoView) t.scrollIntoView({ block: 'start' });
}
function cercaBanco(q) {
  bancoUI.cerca = q; bancoUI.risultati = null;
  var r = q.trim() ? S.banco.cerca(q) : [];
  var fuori = r.filter(function (x) { return x.stato !== 'ordinaria'; });
  if (fuori.length === 1 && r.length === 1) { apriNelBanco(fuori[0].uid); return; }
  bancoUI.risultati = r; disegna();
}
function prossimaBanco(coda) {
  var libere = coda.voci.filter(function (v) { return v.stato === 'da_decidere'; });
  var i = 0;
  for (var k = 0; k < libere.length; k++) if (libere[k].uid === bancoUI.uid) { i = k + 1; break; }
  var v = libere[i % Math.max(1, libere.length)];
  if (v) apriNelBanco(v.uid);
}
/* Una scelta del Banco: una o più azioni, in ordine; alla prima rifiutata si ferma e lo dice. */
function sceltaBanco(uid, azioni, dopo) {
  var ids = [];
  for (var i = 0; i < azioni.length; i++) {
    var a = Object.assign({ id: Stato.uuid(), ts: new Date().toISOString(), nome: nomeUtente() || 'Sito' }, azioni[i]);
    var no;
    try { no = applicaSullaSessione(a); } catch (e) { no = e.message; }
    if (no) { S.messaggio = 'Non applicata: ' + no; disegna(); return false; }
    ids.push(a.id);
  }
  bancoUI.aperto = null; bancoUI.motivo = ''; bancoUI.dest = {};
  if (S.scheda !== 'sistema') { try { bancoUI.dest[uid] = dopo === false ? null : S.banco.destinazione(uid); } catch (e) { bancoUI.dest[uid] = { cosa: 'Posto non calcolato: ' + e.message }; } }
  else ricordaUltima(uid, ids);
  S.messaggio = 'Scelta registrata.'; disegna(); return true;
}
/* Dopo ogni decisione della Sistemazione, in cima: che cosa si è deciso e dove va adesso quella provetta (utente, 2026-11-20:
   «quando si sistema una provetta deve essere chiaro dove posizionarla»; «dopo Conferma non dice la posizione»). */
function ricordaUltima(uid, ids) {
  var v = null, dest = null;
  try { v = S.banco.coda().voci.filter(function (x) { return x.uid === uid; })[0] || null; } catch (e) { v = null; }
  if (v && v.stato === 'decisa') { try { dest = bancoUI.dest[uid] = S.banco.destinazione(uid); } catch (e) { dest = { cosa: 'Posto non calcolato: ' + e.message }; } }
  sistUI.ultima = { uid: uid, ids: ids, etichetta: v ? v.etichetta.split(' ')[0] : '', titolo: v ? v.titolo : '', esito: v ? v.esito : '', stato: v ? v.stato : '', dest: dest };
}
/* Il riquadro grande «dove va»: da dove si prende la provetta e dove si mette, col tasto «L'ho messa lì» se c'è un numero. */
function riquadroDove(uid, dest, prendi, idTasto) {
  var d = h('div', { class: 'fej-dove' });
  if (prendi) d.appendChild(h('p', { class: 'fej-dove-riga' }, h('span', { class: 'fej-dove-et' }, 'Prendi'), prendi));
  if (dest) {
    d.appendChild(h('p', { class: 'fej-dove-riga fej-dove-a', id: idTasto === 'fej-banco-messa' ? 'fej-banco-dove' : null }, h('span', { class: 'fej-dove-et' }, 'Mettila'), dest.cosa));
    if (dest.azione) d.appendChild(h('button', { type: 'button', class: 'fej-primario', id: idTasto, onclick: function () { sceltaBanco(uid, [dest.azione], false); } },
      'L’ho messa lì (numero ' + dest.numero + ')'));
  }
  return d;
}
function riquadroUltima(senzaPostoPer) {
  var u = sistUI.ultima; if (!u) return null;
  var az = S.stato.azioni(), presenti = u.ids.filter(function (id) { return az.some(function (a) { return a.id === id; }); });
  if (!presenti.length) { sistUI.ultima = null; return null; }
  // il posto si rilegge (è ricordato per ogni stato della sessione): dopo un annullo o un passo dei buchi può essere cambiato
  try {
    var vu = S.banco.coda().voci.filter(function (x) { return x.uid === u.uid; })[0];
    if (vu) { u.stato = vu.stato; u.esito = vu.esito; }
    u.dest = vu && vu.stato === 'decisa' ? S.banco.destinazione(u.uid) : null;
  } catch (e) { /* resta quello di prima */ }
  var d = h('section', { class: 'fej-ultima', id: 'fej-ultima', 'aria-label': 'Ultima decisione' });
  d.appendChild(h('p', { class: 'fej-ultima-testa' }, h('strong', null, 'Ultima decisione: provetta ' + u.etichetta), u.titolo ? ' · ' + u.titolo : '', u.esito ? ' · ' + u.esito : '', ' ',
    h('button', { type: 'button', class: 'fej-ultima-chiudi', title: 'Chiudi', 'aria-label': 'Chiudi il riquadro dell’ultima decisione', onclick: function () { sistUI.ultima = null; disegna(); } }, '×')));
  if (u.dest && u.uid === senzaPostoPer) d.appendChild(h('p', null, 'Il posto è qui sotto.'));
  else if (u.dest) d.appendChild(riquadroDove(u.uid, u.dest, null, 'fej-ultima-messa'));
  else if (u.stato === 'tolta' || u.stato === 'persa') d.appendChild(h('p', null, 'Mettila nel contenitore «Tolte»: non va in ARVET.'));
  else if (u.stato === 'accantonata') d.appendChild(h('p', null, 'Mettila nel contenitore «Accantonate»: si decide dopo.'));
  d.appendChild(h('p', null, h('button', { type: 'button', id: 'fej-ultima-annulla', onclick: function () {
    if (!confirm('Annullare l’ultima decisione sulla provetta ' + u.etichetta + '?')) return;
    var ultime = presenti.slice().reverse(); sistUI.ultima = null;
    S.stato.sostituisci(S.stato.azioni().filter(function (a) { return ultime.indexOf(a.id) < 0; })); Disco.azione(); ricalcola();
  } }, 'Annulla questa decisione')));
  return d;
}
function rigaDati(etichetta, campo, bdn) {
  return h('tr', null, h('th', { scope: 'row' }, etichetta), h('td', null, campo || '—'), h('td', null, bdn || '—'));
}
function schedaBanco() {
  var d = h('div', { class: 'fej-banco', id: 'fej-banco' }), coda;
  try { coda = S.banco.coda(); } catch (e) { d.appendChild(h('p', { class: 'fej-errore' }, 'Soluzioni non disponibile: ' + e.message)); return d; }
  var c = coda.conteggi;
  d.appendChild(h('p', { class: 'fej-guida' }, 'Prendi una provetta dal secchio e scrivi quello che c’è sopra (o leggi il contrassegno col lettore), oppure «Prendi la prossima». ' +
    'Guarda la proposta: conferma o scegli un’alternativa, poi metti la provetta dove dice Soluzioni. Se non sai ancora, «Rimanda»: la provetta va nel contenitore «Accantonate». Al banco servono tre contenitori con il nome scritto: «Accantonate», «Tolte» e, per ogni specie, «ARVET a mano» (più «Da posare», se Soluzioni lo chiede).'));
  d.appendChild(h('p', { class: 'fej-banco-conteggi', id: 'fej-banco-conteggi', role: 'status' },
    h('strong', null, 'Da decidere ' + c.da_decidere), ' · Accantonate ' + c.accantonata + ' · Decise ' + c.decisa + ' · Tolte ' + c.tolta + ' · Perse ' + c.persa + ' · Totale ' + c.totale + ' · Da posare ' + c.da_posare + ' · Nel contenitore ARVET a mano ' + c.nel_contenitore));
  var inp = h('input', { type: 'search', id: 'fej-banco-cerca', value: bancoUI.cerca, autocomplete: 'off', placeholder: 'Scritta della provetta o cifre del contrassegno',
    onkeydown: function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); cercaBanco(inp.value); } } });
  d.appendChild(h('div', { class: 'fej-banco-testa' },
    h('label', { for: 'fej-banco-cerca' }, 'Provetta in mano '), inp, ' ',
    h('button', { type: 'button', onclick: function () { cercaBanco(inp.value); } }, 'Cerca'), ' ',
    h('button', { type: 'button', id: 'fej-banco-prossima', disabled: !c.da_decidere, onclick: function () { prossimaBanco(coda); } }, 'Prendi la prossima')));
  if (bancoUI.risultati) {
    var ris = h('div', { class: 'fej-banco-risultati', id: 'fej-banco-risultati' });
    if (!bancoUI.risultati.length) ris.appendChild(h('p', null, 'Nessuna provetta registrata con questa scritta o queste cifre. Se è una provetta mai registrata (conferma dimenticata), registrala da ',
      h('button', { type: 'button', onclick: function () { S.scheda = 'nontrovati'; disegna(); } }, 'Non trovati (registrazione tardiva)'), '.'));
    bancoUI.risultati.forEach(function (x) {
      ris.appendChild(h('div', { class: 'fej-riga' }, h('strong', null, x.etichetta), ' · ', x.contrassegno || 'senza contrassegno', ' · ', x.titolo || '', ' · ', x.esito || '', ' ',
        x.stato === 'ordinaria' ? null : h('button', { type: 'button', onclick: function () { apriNelBanco(x.uid); } }, 'Apri')));
    });
    d.appendChild(ris);
  }
  if (bancoUI.uid) d.appendChild(schedaProvettaBanco(bancoUI.uid));
  else if (!c.da_decidere) d.appendChild(h('p', { class: 'fej-ok' }, (c.accantonata ? 'Restano solo le accantonate (' + c.accantonata + '): riprendile quando hai le informazioni. ' : 'Nessuna provetta fuori registro da decidere. ') +
    'Poi i posti: ', h('button', { type: 'button', onclick: function () { S.scheda = 'riordino'; disegna(); } }, 'Guida dei posti (Riordino)')));
  d.appendChild(elencoBanco(coda));
  return d;
}
function schedaProvettaBanco(uid, opz) {
  var s;
  try { s = S.banco.scheda(uid, bancoUI.cifre, !!bancoUI.tutti); } catch (e) { return h('p', { class: 'fej-errore' }, 'Scheda non disponibile: ' + e.message); }
  if (s.errore) return h('p', { class: 'fej-errore' }, s.errore);
  var v = s.voce, r = s.registrato, b = s.bdn, box = h('section', { class: 'fej-banco-scheda', id: 'fej-banco-scheda', 'aria-label': 'Provetta ' + v.etichetta });
  box.appendChild(h('h3', null, 'Provetta ', h('span', { class: 'fej-banco-etichetta' }, v.etichetta), ' · ', s.fattispecie.titolo));
  box.appendChild(h('p', { class: 'fej-banco-stato fej-banco-' + v.stato }, 'Stato: ', h('strong', null, v.esito)));
  box.appendChild(h('div', { class: 'fej-banco-scritta' }, h('span', { class: 'fej-guida' }, 'Sulla provetta c’è scritto:'), h('pre', null, s.scritta.join('\n'))));
  box.appendChild(h('p', { class: 'fej-guida' }, s.fattispecie.spiegazione));
  var tab = h('table', { class: 'fej-banco-dati' }, h('thead', null, h('tr', null, h('th', null, ''), h('th', { scope: 'col' }, 'Registrato in campo'), h('th', { scope: 'col' }, b ? 'BDN della marca letta' : 'BDN'))));
  var tb = h('tbody');
  tb.appendChild(rigaDati('Contrassegno', r.contrassegno || 'nessuno (senza marche)', b ? b.contrassegno : (r.contrassegno ? 'non è nei registri caricati' : '')));
  tb.appendChild(rigaDati('Sesso', (r.sesso_corretto ? r.sesso_corretto + ' (corretto dal veterinario)' : r.sesso), b ? b.sesso : ''));
  tb.appendChild(rigaDati('Razza', r.razza, b ? b.razza : ''));
  tb.appendChild(rigaDati(r.classe_eta ? 'Età dai denti' : 'Nascita', r.classe_eta ? r.classe_eta + (r.nascita_dai_denti ? ' (' + r.nascita_dai_denti + ')' : '') : r.data_nascita, b ? b.nascita : ''));
  if (b) tb.appendChild(rigaDati('Stabilimento', s.voce.stabilimento, b.stabilimento));
  if (r.provvisoria) tb.appendChild(rigaDati('Identificazione provvisoria', r.provvisoria, ''));
  if (r.note) tb.appendChild(rigaDati('Note del veterinario', r.note, ''));
  tb.appendChild(rigaDati('Chi e quando', s.descrizione.chi, ''));
  if (s.descrizione.segnalazioni.length) tb.appendChild(rigaDati('Segnalazioni', s.descrizione.segnalazioni.join(' · '), ''));
  tab.appendChild(tb);
  box.appendChild(h('div', { class: 'fej-tabella-scorre' }, tab));
  var notaAllevatore = h('textarea', { id: 'fej-nota-allevatore', rows: 2 }, s.nota_allevatore || '');
  box.appendChild(h('div', null, h('label', { for: 'fej-nota-allevatore' }, 'Nota per l’allevatore'), notaAllevatore,
    h('button', { type: 'button', id: 'fej-salva-nota-allevatore', onclick: function () {
      sceltaBanco(uid, [S.banco.notaAllevatore(uid, notaAllevatore.value)], false);
    } }, 'Salva nota per l’allevatore')));

  if (s.formato_contrassegno) box.appendChild(h('p', { class: 'fej-avviso' }, s.formato_contrassegno));
  var vb = s.verifica_bdn;
  if (vb) {
    var classeVb = vb.tono === 'CONFERMA' ? 'fej-ok' : vb.tono === 'NON_TROVATO' && /Non ancora cercato/.test(vb.sintesi) ? 'fej-tenue' : 'fej-avviso';
    var boxVb = h('div', { class: 'fej-banco-bdn ' + classeVb }, h('p', null, h('strong', null, 'Verifica in BDN: '), vb.sintesi));
    // per i capi usciti: oggi in BDN è vivo (e dove) o morto (utente, 2026-11-18)
    var uscitoBdn = v.tipo === 'MORTI_MACELLATI' || v.tipo === 'TRASFERITI';
    if (vb.stato_capo) boxVb.appendChild(h('p', { id: 'fej-banco-stato-capo' }, h('strong', null, 'Oggi in BDN il capo è: '), h('strong', { class: /^viv/i.test(vb.stato_capo) ? 'fej-ok' : 'fej-errore' }, vb.stato_capo), '.',
      uscitoBdn ? ' La via più ragionevole resta attribuire la provetta a un capo presente e non prelevato: non uscito dal registro storico né con un documento di accompagnamento, caricato prima o dopo il campionamento.' : ''));
    else if (uscitoBdn && /Non ancora cercato/.test(vb.sintesi)) boxVb.appendChild(h('p', { class: 'fej-tenue' }, 'Lo snippet della BDN dice anche se il capo uscito oggi è vivo o morto.'));
    if (vb.righe.length) boxVb.appendChild(h('ul', null, vb.righe.map(function (x) { return h('li', null, x); })));
    if (vb.discordanze.length) boxVb.appendChild(h('ul', { class: 'fej-errore' }, vb.discordanze.map(function (x) { return h('li', null, x); })));
    if (/Non ancora cercato/.test(vb.sintesi)) boxVb.appendChild(h('p', { class: 'fej-tenue' }, 'Lo snippet per la BDN si prepara nella scheda Carica.'));
    box.appendChild(boxVb);
  }
  if (r.doppio_in_campo) box.appendChild(h('p', null, 'In campo il veterinario ha scelto «Preleva come doppio»: ha visto un altro animale con la stessa marca.'));
  if (r.doppio_scoperto && !r.doppio_in_campo) box.appendChild(h('p', null, 'Doppio scoperto alla riunione dei device: di solito lo stesso animale preso due volte.'));
  if (s.altre_provette.length) box.appendChild(h('p', null, 'Stesso contrassegno anche su: ', s.altre_provette.map(function (o) { return o.etichetta + ' (' + o.operatore + (o.ristampa ? ', ristampa ' + o.ristampa : '') + ')'; }).join(', '), '.',
    r.ristampa ? ' Ristampa di questo animale: ' + r.ristampa + '.' : ''));
  if (s.avviso_ristampa) box.appendChild(h('p', { class: 'fej-avviso', id: 'fej-banco-ristampa' }, s.avviso_ristampa));
  // esito già deciso: dove va e come tornare indietro
  if (v.stato !== 'da_decidere' && !(opz && opz.senzaDove)) box.appendChild(esitoBanco(uid, s));
  else if (v.stato !== 'da_decidere') box.appendChild(esitoBanco(uid, s, true));
  if (s.proposta && v.stato === 'da_decidere') box.appendChild(h('div', { class: 'fej-banco-proposta', id: 'fej-banco-proposta' },
    h('p', null, h('strong', null, 'Proposta: '), s.proposta.testo), h('p', { class: 'fej-guida' }, s.proposta.perche),
    h('button', { type: 'button', class: 'fej-primario', id: 'fej-banco-conferma', onclick: function () { sceltaBanco(uid, s.proposta.azioni); } }, 'Conferma')));
  if (v.stato === 'da_decidere') box.appendChild(alternativeBanco(uid, s));
  return box;
}
function esitoBanco(uid, s, senzaDove) {
  var v = s.voce, d = h('div', { class: 'fej-banco-esito' }), dest = bancoUI.dest[uid];
  if (dest === undefined && v.stato === 'decisa' && !senzaDove) { try { dest = bancoUI.dest[uid] = S.banco.destinazione(uid); } catch (e) { dest = { cosa: 'Posto non calcolato: ' + e.message }; } }
  if (dest && !senzaDove) {
    d.appendChild(h('p', { class: 'fej-banco-dove', id: 'fej-banco-dove' }, h('strong', null, 'Dove va: '), dest.cosa));
    // posto occupato o buchi ancora da chiudere: la provetta aspetta con le decise, il Banco non fa spostare altre provette
    if (dest.azione) d.appendChild(h('button', { type: 'button', id: 'fej-banco-messa', onclick: function () { sceltaBanco(uid, [dest.azione], false); } },
      'L’ho messa lì (numero ' + dest.numero + ')'));
  }
  var torna = [];
  if (s.alternative.indexOf('regola') >= 0) torna.push(['Rimetti da decidere', [{ tipo: 'soluzione', uid: uid, soluzione: 'regola' }]]);
  if (s.alternative.indexOf('annulla_scarto') >= 0) torna.push(['Annulla: rimettila fra quelle da decidere', [{ tipo: 'annulla_scarto', uid: uid }]]);
  if (s.alternative.indexOf('ritrovata') >= 0) torna.push(['Ritrovata', [{ tipo: 'ritrovata', uid: uid }]]);
  if (s.alternative.indexOf('riprendi') >= 0) torna.push(['Riprendi dall’accantonamento', [{ tipo: 'modifica_provetta', uid: uid, note: s.registrato.note }]]);
  torna.forEach(function (t) { d.appendChild(h('button', { type: 'button', onclick: function () { sceltaBanco(uid, t[1], false); } }, t[0])); d.appendChild(document.createTextNode(' ')); });
  return d;
}
function alternativeBanco(uid, s) {
  var d = h('div', { class: 'fej-banco-alternative', id: 'fej-banco-alternative' }), alt = s.alternative;
  d.appendChild(h('p', null, h('strong', null, s.proposta ? 'Oppure:' : 'Scegli:')));
  var tasti = h('div', { class: 'fej-banco-tasti' });
  function tasto(chiave, testo, fai) { if (alt.indexOf(chiave) >= 0) { tasti.appendChild(h('button', { type: 'button', 'aria-expanded': bancoUI.aperto === chiave ? 'true' : null, onclick: fai }, testo)); tasti.appendChild(document.createTextNode(' ')); } }
  function apri(k) { return function () { bancoUI.aperto = bancoUI.aperto === k ? null : k; bancoUI.motivo = ''; disegna(); }; }
  // utente, 2026-11-17: un «doppio» la cui prima registrazione era un errore o una provetta mai esistita non è un doppio
  if (s.unico_campione && s.unico_campione.length) {
    tasti.appendChild(h('button', { type: 'button', id: 'fej-banco-unico', title: 'Annulla le altre registrazioni di questa marca: questa provetta resta l’unico campione del capo',
      onclick: function () {
        var altre = s.altre_provette.map(function (o) { return o.etichetta.split(' ')[0]; }).join(', ');
        if (!confirm('La provetta ' + altre + ' non esiste (o era una lettura sbagliata)?\nLa sua registrazione viene annullata e questa provetta resta l’unico campione del capo.')) return;
        sceltaBanco(uid, s.unico_campione, false);
      } }, 'È l’unico campione: l’altra provetta non esiste'));
    tasti.appendChild(document.createTextNode(' '));
  }
  if (s.scambio) {
    tasti.appendChild(h('button', { type: 'button', id: 'fej-banco-scambio', title: s.scambio.perche, onclick: function () { sceltaBanco(uid, s.scambio.azioni); } }, s.scambio.testo));
    tasti.appendChild(document.createTextNode(' '));
  }
  tasto('ricolloca', 'A un capo assente…', apri('ricolloca'));
  tasto('coda', 'In coda, ARVET a mano', function () { sceltaBanco(uid, [{ tipo: 'soluzione', uid: uid, soluzione: 'coda' }]); });
  tasto('normalizza', 'Normalizza', function () { sceltaBanco(uid, [{ tipo: 'soluzione', uid: uid, soluzione: 'normalizzata' }]); });
  tasto('marca', 'Marca disponibile…', apri('marca'));
  tasto('scarto', 'Togli questa provetta…', apri('scarto'));
  tasto('persa', 'Persa…', apri('persa'));
  tasto('rimanda', 'Rimanda…', apri('rimanda'));
  d.appendChild(tasti);
  if (bancoUI.aperto === 'ricolloca') d.appendChild(pannelloCompatibili(uid, s));
  if (bancoUI.aperto === 'marca') {
    var sel = h('select', { 'aria-label': 'Marca disponibile', onchange: function (ev) { bancoUI.marca = ev.target.value; } }, s.marche_libere.map(function (m) { return h('option', { value: m, selected: bancoUI.marca === m }, m); }));
    d.appendChild(h('div', { class: 'fej-banco-pannello' }, h('p', { class: 'fej-guida' }, 'Mai identificato: la provetta si registra su una marca disponibile dello stabilimento (l’allevatore la registra in BDN).'),
      sel, ' ', h('button', { type: 'button', onclick: function () { var m = bancoUI.marca || (s.marche_libere[0] || ''); if (m) sceltaBanco(uid, [{ tipo: 'riattribuzione', uid: uid, contrassegno: m }, { tipo: 'soluzione', uid: uid, soluzione: 'coda' }]); } }, 'Registra su questa marca')));
  }
  if (bancoUI.aperto === 'scarto' || bancoUI.aperto === 'persa' || bancoUI.aperto === 'rimanda') {
    var k = bancoUI.aperto, testo = { scarto: 'Perché la togli (non va in ARVET; si può annullare)', persa: 'Dove o come è stata persa', rimanda: 'Perché rimandi (va nel contenitore «Accantonate»)' }[k];
    var campo = h('input', { type: 'text', id: 'fej-banco-motivo', value: bancoUI.motivo, oninput: function (ev) { bancoUI.motivo = ev.target.value; } });
    var pann = h('div', { class: 'fej-banco-pannello' }, h('label', { for: 'fej-banco-motivo' }, testo + ' '), campo);
    if (k === 'rimanda') pann.appendChild(h('div', null, MOTIVI_RIMANDO.map(function (m) { return h('button', { type: 'button', class: 'fej-copia', onclick: function () { bancoUI.motivo = m; campo.value = m; } }, m); })));
    pann.appendChild(h('button', { type: 'button', onclick: function () {
      var m = (campo.value || '').trim();
      if (!m) { S.messaggio = 'Scrivi il motivo.'; messaggio(); return; }
      if (k === 'scarto') sceltaBanco(uid, [{ tipo: 'scarto', uid: uid, motivo: m }]);
      else if (k === 'persa') sceltaBanco(uid, [{ tipo: 'persa', uid: uid, motivo: m }], false);
      else sceltaBanco(uid, [{ tipo: 'modifica_provetta', uid: uid, note: (s.registrato.note ? s.registrato.note + SEP_ACCANTONATA : '') + PREFISSO_ACCANTONATA + m }], false);
    } }, { scarto: 'Togli questa provetta', persa: 'Segna persa', rimanda: 'Rimanda e accantona' }[k]));
    d.appendChild(pann);
  }
  return d;
}
function pannelloCompatibili(uid, s) {
  var senzaMarche = !s.registrato.contrassegno;
  if (bancoUI.nelReport == null) bancoUI.nelReport = senzaMarche || s.registrato.doppio_in_campo || s.fattispecie.codice === 'DOPPI';
  var p = h('div', { class: 'fej-banco-pannello', id: 'fej-banco-compatibili' });
  p.appendChild(h('p', { class: 'fej-guida' }, 'Capi del registro in età, mai prelevati e non già scelti, della stessa specie e dello stesso sesso' +
    (senzaMarche ? ', con l’età dei denti e la razza compatibili.' : '; per primi quelli che differiscono di una cifra, poi stessa razza ed età vicina.') +
    ' Un capo scelto non si ripropone più.'));
  var filtro = h('input', { type: 'search', inputmode: 'numeric', 'aria-label': 'Cerca fra i compatibili per cifre', value: bancoUI.cifre, placeholder: 'cifre del contrassegno',
    onkeydown: function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); bancoUI.cifre = filtro.value; disegna(); } } });
  p.appendChild(h('div', null, filtro, ' ', h('button', { type: 'button', onclick: function () { bancoUI.cifre = filtro.value; disegna(); } }, 'Filtra')));
  p.appendChild(h('label', null, h('input', { type: 'checkbox', checked: bancoUI.nelReport, onchange: function (ev) { bancoUI.nelReport = ev.target.checked; } }),
    ' Marche da rifare: va nelle cose da fare per l’allevatore'));
  // decide il veterinario (utente, 2026-11-17): con una marca duplicata il sesso registrato è quello del capo della marca
  p.appendChild(h('label', { class: 'fej-blocco' }, h('input', { type: 'checkbox', id: 'fej-banco-tutti', checked: !!bancoUI.tutti, onchange: function (ev) { bancoUI.tutti = ev.target.checked; disegna(); } }),
    ' Mostra anche i capi assenti di altro sesso, razza o età (con l’avviso)'));
  if (!s.compatibili.length) p.appendChild(h('p', null, 'Nessun capo assente compatibile' + (bancoUI.cifre ? ' con queste cifre.' : '.')));
  var t = h('table', { class: 'fej-banco-dati' }, h('thead', null, h('tr', null, ['Contrassegno', 'Sesso', 'Razza', 'Età', 'Numero', 'Perché', ''].map(function (x) { return h('th', { scope: 'col' }, x); }))));
  var tb = h('tbody');
  s.compatibili.forEach(function (c) {
    tb.appendChild(h('tr', { class: c.attenzione ? 'fej-attenzione' : null }, h('td', null, h('code', null, c.contrassegno), ' ', bottoneCopia(c.contrassegno, '⧉')), h('td', null, c.sesso), h('td', null, c.razza), h('td', null, (c.eta || '') + (c.nascita ? ' · ' + c.nascita : '')),
      h('td', null, c.numero == null ? '—' : String(c.numero)), h('td', null, c.motivi.join(' · ')),
      h('td', null, h('button', { type: 'button', onclick: function () { sceltaBanco(uid, [{ tipo: 'ricollocazione', uid: uid, capo: c.contrassegno, nel_report: !!bancoUI.nelReport }]); } }, 'Attribuisci'))));
  });
  t.appendChild(tb);
  if (s.compatibili.length) p.appendChild(h('div', { class: 'fej-tabella-scorre' }, t));
  // un capo scritto a mano: qualunque capo assente del registro, o la marca giusta se la lettura era sbagliata
  var mano = h('input', { type: 'text', id: 'fej-banco-capo-mano', autocomplete: 'off', placeholder: 'contrassegno completo', 'aria-label': 'Contrassegno completo scritto a mano' });
  p.appendChild(h('div', { class: 'fej-banco-mano' }, h('label', { for: 'fej-banco-capo-mano' }, 'Oppure scrivi il contrassegno: '), mano, ' ',
    h('button', { type: 'button', id: 'fej-banco-attribuisci-mano', onclick: function () {
      var c = mano.value.replace(/\s+/g, '').toUpperCase(); if (!c) { S.messaggio = 'Scrivi il contrassegno completo.'; messaggio(); return; }
      if (sceltaBanco(uid, [{ tipo: 'ricollocazione', uid: uid, capo: c, nel_report: !!bancoUI.nelReport }])) {
        var v = S.banco.coda().voci.filter(function (x) { return x.uid === uid; })[0];
        if (v && v.capo !== c) { S.messaggio = 'Non attribuita: ' + c + ' non è un capo assente di questo stabilimento e di questa specie (o vale già per un’altra provetta).'; messaggio(); }
      }
    } }, 'Attribuisci a questo capo assente'), ' ',
    h('button', { type: 'button', id: 'fej-banco-correggi-mano', onclick: function () {
      var c = mano.value.replace(/\s+/g, '').toUpperCase(); if (!c) { S.messaggio = 'Scrivi il contrassegno completo.'; messaggio(); return; }
      sceltaBanco(uid, [{ tipo: 'riattribuzione', uid: uid, contrassegno: c }], false);
    } }, 'La marca letta era sbagliata: è questa')));
  return p;
}
function elencoBanco(coda) {
  var d = h('details', { class: 'fej-banco-elenco', open: bancoUI.filtro !== 'da_decidere' ? true : null });
  d.appendChild(h('summary', null, 'Elenco delle provette fuori registro'));
  var sel = h('select', { 'aria-label': 'Quali mostrare', onchange: function (ev) { bancoUI.filtro = ev.target.value; disegna(); } },
    STATI_BANCO.map(function (x) { return h('option', { value: x[0], selected: bancoUI.filtro === x[0] }, x[1]); }));
  d.appendChild(h('p', null, 'Mostra: ', sel));
  var voci = coda.voci.filter(function (v) { return bancoUI.filtro === 'tutte' || v.stato === bancoUI.filtro; });
  if (!voci.length) d.appendChild(h('p', null, 'Nessuna.'));
  voci.slice(0, 300).forEach(function (v) {
    d.appendChild(h('div', { class: 'fej-riga', 'data-banco': v.uid }, h('strong', null, v.etichetta), ' · ', v.titolo, ' · ', v.esito, ' ',
      h('button', { type: 'button', onclick: function () { apriNelBanco(v.uid); } }, 'Apri')));
  });
  if (voci.length > 300) d.appendChild(h('p', null, 'Le prime 300 di ' + voci.length + ': cerca la provetta in mano per le altre.'));
  return d;
}

/* ---- memoria del browser e salvataggio su disco (utente, 2026-11-17: «basta F5 per perdere traccia») ----
   Memoria: il backup aperto resta in IndexedDB, così ricaricando la pagina la sessione riparte da sola (le azioni sono
   già in localStorage, stato.js). Disco: scelta una cartella (Chrome, Edge), a ogni azione il file delle modifiche si
   riscrive lì; lo zip completo con «Salva backup». Niente va su internet. */
var Memoria = (function () {
  var ok = typeof indexedDB !== 'undefined';
  function db() {
    return new Promise(function (si, no) {
      if (!ok) { no(new Error('IndexedDB assente')); return; }
      var r = indexedDB.open('fejalog-strumenti', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('k'); };
      r.onsuccess = function () { si(r.result); }; r.onerror = function () { no(r.error); };
    });
  }
  function metti(k, v) {
    return db().then(function (d) { return new Promise(function (si, no) {
      var t = d.transaction('k', 'readwrite'); t.objectStore('k').put(v, k); t.oncomplete = function () { si(); }; t.onerror = function () { no(t.error); };
    }); }).catch(function () { /* senza IndexedDB si lavora lo stesso */ });
  }
  function prendi(k) {
    return db().then(function (d) { return new Promise(function (si, no) {
      var q = d.transaction('k').objectStore('k').get(k); q.onsuccess = function () { si(q.result); }; q.onerror = function () { no(q.error); };
    }); }).catch(function () { return null; });
  }
  return { metti: metti, prendi: prendi };
})();
var Disco = (function () {
  var st = { cartella: null, nome: '', ultimo: null, pendenti: 0, errore: '', timer: null, permesso: false };
  var puo = typeof window.showDirectoryPicker === 'function';
  function scriviFile(nome, dati) {
    return st.cartella.getFileHandle(nome, { create: true }).then(function (fh) { return fh.createWritable(); })
      .then(function (w) { return Promise.resolve(w.write(dati)).then(function () { return w.close(); }); });
  }
  function modifiche() {
    if (!S.P || !S.stato) return Promise.resolve();
    if (!st.cartella || !st.permesso) return Promise.resolve();
    var n = st.pendenti;
    return scriviFile(Mod.nomeFile(S.P), JSON.stringify(Mod.esporta(S.P, S.stato.azioni(), nomeUtente()), null, 1)).then(function () {
      st.pendenti = Math.max(0, st.pendenti - n); st.ultimo = new Date(); st.errore = ''; aggiornaBarra();
    }, function (e) { st.errore = 'Non riesco a scrivere nella cartella: ' + e.message; aggiornaBarra(); });
  }
  return {
    stato: st, puo: puo,
    /** Un'azione fatta o annullata: il file delle modifiche si riscrive subito (se c'è la cartella). */
    azione: function () {
      st.pendenti++;
      if (st.timer) clearTimeout(st.timer);
      st.timer = setTimeout(function () { st.timer = null; modifiche(); }, 200);
      aggiornaBarra();
    },
    scegli: function () {
      return window.showDirectoryPicker({ mode: 'readwrite' }).then(function (c) {
        st.cartella = c; st.nome = c.name; st.permesso = true; Memoria.metti('cartella', c); return modifiche();
      }).then(aggiornaBarra, function (e) { if (e && e.name !== 'AbortError') { st.errore = e.message; aggiornaBarra(); } });
    },
    /** Dopo F5 la cartella è ricordata, ma il browser vuole di nuovo il permesso con un tocco. */
    ripristina: function (c) { if (c) { st.cartella = c; st.nome = c.name; st.permesso = false; } },
    riattiva: function () {
      if (!st.cartella || st.permesso) return Promise.resolve(st.permesso);
      return st.cartella.requestPermission({ mode: 'readwrite' }).then(function (p) { st.permesso = p === 'granted'; return st.permesso; }, function () { return false; });
    },
    /** Lo zip completo (backup + modifiche): nella cartella se c'è, altrimenti si scarica. */
    zip: function () {
      if (S.apVecchio || !S.ap) aggiornaRisultato();
      var voci = Object.keys(S.ap.backupFiles).sort().map(function (k) { return { name: k, data: S.ap.backupFiles[k] }; });
      var nomeZip = 'fejalog_backup_' + String((S.P.manifesto.seduta && S.P.manifesto.seduta.nome) || 'progetto').replace(/[^A-Za-z0-9_-]+/g, '_') + '_aggiornato.zip';
      var dati = Zip.scrivi(voci);
      return this.riattiva().then(function (si) {
        if (!si) { scarica(nomeZip, 'application/zip', dati); st.pendenti = 0; st.ultimo = new Date(); return 'scaricato'; }
        return scriviFile(nomeZip, dati).then(function () { return modifiche(); }).then(function () { st.pendenti = 0; st.ultimo = new Date(); return 'nella cartella ' + st.nome; });
      });
    }
  };
})();
function ora(d) { return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
/* La barra sempre in vista: avanzamento, «Salva backup», la cartella e che cosa non è ancora su disco. */
/* La barra si chiude con la × e lascia solo «Salva» (utente, 2026-11-20: «avviso di salvataggio chiudibile e un tasto per
   salvare quando serve»); la scelta resta nel browser. */
var barraChiusa = (function () { try { return localStorage.getItem('fejalog:barra-chiusa') === '1'; } catch (e) { return false; } })();
function chiudiBarra(v) { barraChiusa = v; try { localStorage.setItem('fejalog:barra-chiusa', v ? '1' : '0'); } catch (e) { /* in memoria */ } aggiornaBarra(); }
function salvaBackup() {
  Disco.zip().then(function (dove) { S.messaggio = 'Backup e modifiche salvati (' + dove + ').'; aggiornaBarra(); messaggio(); },
    function (e) { S.messaggio = 'Salvataggio non riuscito: ' + e.message; messaggio(); });
}
function aggiornaBarra() {
  barra.textContent = '';
  if (!S.P || !S.banco || !verificaAmmessa()) { barra.hidden = true; return; }
  barra.hidden = false;
  var st = Disco.stato, c;
  barra.className = 'fej-barra' + (barraChiusa ? ' fej-barra-chiusa' : '');
  if (barraChiusa) {
    barra.appendChild(h('button', { type: 'button', class: 'fej-primario', id: 'fej-salva-backup', title: 'Salva lo zip con il backup e le modifiche', onclick: salvaBackup }, 'Salva'));
    if (st.pendenti || st.errore) barra.appendChild(h('span', { class: st.errore ? 'fej-errore' : 'fej-tenue', id: 'fej-barra-stato' }, st.errore ? 'errore di salvataggio' : st.pendenti + ' non su disco'));
    barra.appendChild(h('button', { type: 'button', class: 'fej-barra-apri', id: 'fej-barra-apri', title: 'Mostra lo stato del salvataggio', 'aria-label': 'Mostra lo stato del salvataggio', onclick: function () { chiudiBarra(false); } }, '▾'));
    return;
  }
  try { c = S.banco.coda().conteggi; } catch (e) { c = null; }
  if (c) barra.appendChild(h('span', { class: 'fej-barra-avanzamento' }, 'Fuori registro: ', h('strong', null, String(c.da_decidere)), ' da decidere · ' + c.decisa + ' decise · ' + S.stato.azioni().length + ' azioni'));
  barra.appendChild(h('button', { type: 'button', class: 'fej-primario', id: 'fej-salva-backup', onclick: salvaBackup }, 'Salva backup'));
  if (Disco.puo) barra.appendChild(h('button', { type: 'button', id: 'fej-scegli-cartella', onclick: function () { Disco.scegli(); } },
    st.cartella ? 'Cartella: ' + st.nome + (st.permesso ? '' : ' (tocca «Salva backup» per riattivarla)') : 'Scegli la cartella di salvataggio'));
  barra.appendChild(h('span', { class: st.errore ? 'fej-errore' : 'fej-guida', id: 'fej-barra-stato', 'aria-live': 'polite' }, st.errore ||
    ((st.ultimo ? 'salvato alle ' + ora(st.ultimo) : 'non ancora salvato su disco') + (st.pendenti ? ' · ' + st.pendenti + (st.pendenti === 1 ? ' azione' : ' azioni') + ' non ancora su disco' : '') +
     (st.cartella && st.permesso ? ' · ogni azione va nella cartella' : ' · le azioni restano in questo browser'))));
  barra.appendChild(h('button', { type: 'button', class: 'fej-barra-chiudi', id: 'fej-barra-chiudi', title: 'Chiudi: resta solo il tasto «Salva»', 'aria-label': 'Chiudi l’avviso del salvataggio', onclick: function () { chiudiBarra(true); } }, '×'));
}

/* ---- Sistemazione: quattro fasi in ordine fisso (utente, 2026-11-17) ----
   A «Di chi è?»: le provette che nascondono un altro animale (senza marche, marche duplicate, marche di capi usciti);
   B «Al loro posto»: quelle che vanno in ARVET da sole, al numero del capo; C «In fondo»: le ARVET a mano; D «Chiudi i
   buchi»: i numeri più alti scendono nei buchi. Il sito propone, decide il veterinario; ogni scelta si annulla dalla
   cronologia. */
var sistUI = { fase: null, inMano: '' };
var FASI = [['analisi', '1 · Analisi e logica'], ['smista', '0 · Smista'], ['identita', 'A · Di chi è?'], ['posto', 'B · Al loro posto'], ['fondo', 'C · In fondo'], ['buchi', 'D · Chiudi i buchi'], ['tabella', 'Tutte in tabella'], ['fine', 'Fine']];
/* Come si riscrive un numero su una provetta (utente, 2026-11-18): l'originale deve restare sempre leggibile. */
var REGOLA_SCRITTA = 'Non cancellare e non coprire mai il numero scritto in campo: tiraci sopra una riga sola e scrivi il numero nuovo accanto, con la biro rossa. L’originale deve restare leggibile.';
var GUIDA_FASE = {
  analisi: 'Prima di toccare le provette: che cosa c’è da sistemare (analisi delle fattispecie), con quali regole (logica) e in che ordine (esecuzione). Il sito propone e spiega; decide sempre il veterinario, e ogni scelta si può annullare dalla cronologia.',
  tabella: 'Tutte le provette fuori registro in una tabella: clicca un’intestazione per ordinare (anche per posto), filtra per testo, fattispecie o stato, clicca una riga per aprire la scheda con la scelta consigliata e quelle manuali.',
  smista: 'Prima di decidere, svuota il secchio una volta sola: ogni provetta fuori registro ha un posto fisso nel plateau dei fuori registro (numerazione unica, uguale per tutti i veterinari), in ordine di fattispecie e di lavoro. Scrivi o leggi la provetta che hai in mano: il sito dice il posto. Poi le fasi le chiamano per posto, nell’ordine giusto, senza cercarle.',
  identita: 'Provette di animali senza marche, con una marca già letta su un altro animale, o con la marca di un capo che in BDN risulta uscito. Per ognuna guarda i capi assenti compatibili e decidi: attribuirla a uno di loro, lasciarla com’è (ARVET a mano) o toglierla. Decidi tu: la proposta è solo un aiuto. Dopo la conferma il riquadro in cima dice dove va: attribuita a un capo assente, va al numero di quel capo, che è un buco.',
  posto: 'Provette che vanno in ARVET da sole. In cima c’è dove prenderla e dove metterla (di solito il buco lasciato dal capo assente): riscrivi il numero sulla provetta, mettila lì e premi «L’ho messa lì». ' + REGOLA_SCRITTA,
  fondo: 'Provette che vanno in ARVET a mano (smarriti ritrovati, marche non registrate, non in elenco, altri stabilimenti). Dopo la conferma il riquadro in cima dice il contenitore e il posto in fila. Non vanno nei buchi: i buchi li chiudono le ultime provette ordinarie, nella fase D. Queste restano in fondo alla serie, nell’ordine del contenitore, e il numero lo prendono alla fine, una volta sola (si vede già in «Tutte in tabella» › «Mostra i numeri definitivi»).',
  buchi: 'I buchi rimasti si chiudono abbassando i numeri più alti: per ogni riga riscrivi il numero nuovo sulla provetta, spostala e invia. Ogni passo resta nella cronologia. ' + REGOLA_SCRITTA,
  fine: 'Controlla che non resti niente da decidere, poi vai agli snippet e alle uscite.'
};
/* Lo smistamento (utente, 2026-11-17: «suddividere le problematiche per fattispecie e poi prenderle su nell'ordine
   corretto», «una numerazione unica per tutti gli operatori»): l'ordine si fissa la prima volta, dallo stato di allora
   (fase, fattispecie, scritta), e resta quello anche quando le decisioni cambiano la fase; una provetta arrivata dopo
   (registrazione tardiva) va in fondo. Si conserva nel browser accanto alle azioni. */
var ORDINE_FASE = { identita: 0, posto: 1, fondo: 2, fuori: 3 };
function chiaveSmista() { return 'fejalog:smista:' + S.P.chiave; }
function leggiSmista() { try { return JSON.parse(localStorage.getItem(chiaveSmista()) || 'null') || { ordine: [], fatto: false }; } catch (e) { return { ordine: [], fatto: false }; } }
function analisiVista() { try { return localStorage.getItem(chiaveSmista() + ':analisi') === '1' || !!sistUI.analisiVista; } catch (e) { return !!sistUI.analisiVista; } }
function segnaAnalisiVista() { sistUI.analisiVista = true; try { localStorage.setItem(chiaveSmista() + ':analisi', '1'); } catch (e) { /* in memoria */ } }
/* Che cosa propone il sito per ogni fattispecie, in una riga (il dettaglio è nella scheda di ogni provetta e nel manuale). */
var COSA_PROPONE = {
  SENZA_CONTRASSEGNO: 'il capo assente più simile (sesso, razza, età dai denti); se non c’è, una marca disponibile',
  DOPPI: 'il capo assente più simile per il secondo animale prelevato; «Scambio» o «È l’unico campione» come alternative',
  DA_RIATTRIBUIRE: 'un altro capo assente compatibile',
  MORTI_MACELLATI: 'il capo assente più simile (di solito è una marca duplicata di cui una copia è uscita)',
  TRASFERITI: 'il capo assente più simile (di solito è una marca duplicata di cui una copia è uscita)',
  SMARRITI: 'tiene la sua identità: ARVET a mano, in fondo', RUBATI: 'tiene la sua identità: ARVET a mano, in fondo',
  MARCHE: 'ARVET a mano, in fondo; il capo va registrato in BDN', MARCATI_IN_CAMPO: 'ARVET a mano, in fondo; registrazione in BDN',
  NON_IN_ELENCO: 'se differisce di una cifra da un capo assente, quel capo; altrimenti ARVET a mano',
  ALTRO_STABILIMENTO: 'ARVET a mano', SPECIE: 'ARVET a mano (o annullo, se era una lettura sbagliata)', DDA: 'in coda finché l’ingresso non è registrato',
  ORA_IN_LISTA: 'normalizzare: va in ARVET come gli altri, al numero del capo', DIVENTATE: 'ARVET a mano: il capo non è più fra i presenti',
  FUORI_ETA: 'nessuna proposta: decide il veterinario (in coda o togliere)'
};
var NOME_FASE = { identita: 'A · Di chi è?', posto: 'B · Al loro posto', fondo: 'C · In fondo', fuori: '—' };
/* Analisi delle fattispecie, logica ed esecuzione, prima di cominciare (utente, 2026-11-18: «deve essere tutto più chiaro e
   spiegato: prima analisi fattispecie, poi impostazione della logica, infine esecuzione»). */
function vistaAnalisi(st, contaBuchi) {
  var d = h('div', { id: 'fej-analisi' }), gruppi = {}, ordine = [];
  st.coda.voci.forEach(function (v) {
    if (v.stato === 'tolta' || v.stato === 'persa') return;
    if (!gruppi[v.tipo]) { gruppi[v.tipo] = { titolo: v.titolo, n: 0, da: 0, fase: v.fase }; ordine.push(v.tipo); }
    gruppi[v.tipo].n++; if (v.stato === 'da_decidere') gruppi[v.tipo].da++;
  });
  d.appendChild(h('h3', null, '1 · Analisi: che cosa c’è da sistemare'));
  if (!ordine.length) d.appendChild(h('p', { class: 'fej-ok' }, 'Nessuna provetta fuori registro.'));
  else {
    var t = h('table', { class: 'fej-banco-dati', id: 'fej-analisi-tabella' }, h('thead', null, h('tr', null, ['Fattispecie', 'Provette', 'Da decidere', 'Che cosa propone il sito', 'Fase'].map(function (x) { return h('th', { scope: 'col' }, x); }))));
    var tb = h('tbody');
    ordine.sort(function (a, b) { return (ORDINE_FASE[gruppi[a].fase] - ORDINE_FASE[gruppi[b].fase]) || (gruppi[a].titolo < gruppi[b].titolo ? -1 : 1); }).forEach(function (k) {
      var g = gruppi[k];
      tb.appendChild(h('tr', null, h('td', null, h('strong', null, g.titolo)), h('td', null, String(g.n)), h('td', null, String(g.da)), h('td', null, COSA_PROPONE[k] || 'ARVET a mano'), h('td', null, NOME_FASE[g.fase] || '')));
    });
    t.appendChild(tb); d.appendChild(h('div', { class: 'fej-tabella-scorre' }, t));
  }
  // gli assenti del risultato di prima: il conto cambia di poco con le attribuzioni, e rifarlo costa secondi sul PC dell'ASL
  if (!S.ap) aggiornaRisultato();
  var assenti = (S.ap && S.ap.nonPrelevati || []).length, usc = [];
  try { usc = S.banco.usciteModello(); } catch (e) { usc = []; }
  d.appendChild(h('p', null, 'Capi del registro non prelevati (assenti): ', h('strong', null, String(assenti)), '. I buchi da chiudere si contano nella fase D, quando le provette sono decise.'));
  d.appendChild(h('p', { class: usc.length ? 'fej-ok' : 'fej-avviso', id: 'fej-analisi-uscite' }, usc.length ? '✓ Uscite per modello degli ultimi 7 giorni caricate: ' + usc.length + ' capi non sono più proposti come assenti.' :
    'Le uscite per modello degli ultimi 7 giorni non sono caricate: la BDN aggiorna il registro fino a 7 giorni dopo il documento di accompagnamento, quindi fra gli assenti possono esserci capi già venduti o macellati. Caricale prima di attribuire provette (scheda Carica).'));
  d.appendChild(h('h3', null, '2 · Logica: con quali regole'));
  d.appendChild(h('ol', { id: 'fej-analisi-logica' }, [
    'Decide sempre il veterinario: il sito propone e spiega, non applica niente da solo; ogni scelta si cambia o si annulla dalla cronologia.',
    'Un capo assente vale per una sola provetta. Sono proposti solo capi dello stesso stabilimento e della stessa specie, mai prelevati, e non usciti con un documento di accompagnamento.',
    'Nei doppi la proposta riguarda il secondo animale prelevato (l’unico marcato con un altro colore, quello che l’allevatore ritrova): il numero di ristampa è un indizio, non decide.',
    'Prima si decide di chi è ogni provetta, poi si toccano i plateau: così ogni provetta si prende in mano una volta per decidere e una per metterla al suo posto.',
    'I buchi si chiudono sempre, abbassando i numeri più alti; lo snippet per ARVET si può prendere in ogni momento e dice se non è ancora conforme.',
    REGOLA_SCRITTA
  ].map(function (x) { return h('li', null, x); })));
  d.appendChild(h('h3', null, '3 · Esecuzione: in che ordine'));
  d.appendChild(h('ol', { start: 0 }, [
    'Smista: ogni provetta fuori registro va al suo posto fisso nel plateau dei fuori registro (' + st.smista.ordine.length + ' provette).',
    'A · Di chi è? (' + st.identita.length + '): le provette di animali che probabilmente sono un altro capo.',
    'B · Al loro posto (' + st.posto.length + '): quelle che vanno in ARVET da sole, al numero del capo.',
    'C · In fondo (' + st.fondo.length + '): quelle che vanno in ARVET a mano.',
    'D · Chiudi i buchi: i numeri più alti scendono nei buchi rimasti.'
  ].map(function (x) { return h('li', null, x); })));
  d.appendChild(h('p', null, h('button', { type: 'button', class: 'fej-primario', id: 'fej-analisi-avanti', onclick: function () { segnaAnalisiVista(); sistUI.fase = null; bancoUI.uid = null; disegna(); } },
    analisiVista() ? 'Torna al lavoro' : 'Ho letto: comincia'), ' ', h('button', { type: 'button', onclick: function () { window.print(); } }, 'Stampa')));
  return d;
}
function salvaSmista(x) { try { localStorage.setItem(chiaveSmista(), JSON.stringify(x)); } catch (e) { /* in memoria */ } sistUI.smista = x; }
function smistamento(coda, posate) {
  var x = sistUI.smista && sistUI.smistaChiave === S.P.chiave ? sistUI.smista : leggiSmista();
  sistUI.smistaChiave = S.P.chiave;
  // I posti dati dal regista sul tablet (utente, 2026-11-18): quelle provette stanno già nel plateau dei fuori registro e non si
  // smistano. Le rimaste nel secchio si smistano come sempre, ma dopo l'ultimo posto mai usato sul tablet: l'ordine è solo in
  // aggiunta e si conserva, così un posto detto una volta non cambia più (revisione del 18/11, P1).
  var dati = coda.posti_fuori_registro || {}, base = coda.prossimo_posto_fuori_registro || 0;
  if (base > 0) {
    var notiT = {}; x.ordine.forEach(function (u) { notiT[u] = true; });
    var nuoveT = coda.voci.filter(function (v) { return !dati[v.uid] && !notiT[v.uid] && v.fase !== 'fuori' && !posate[v.uid]; })
      .sort(function (a, b) { return (ORDINE_FASE[a.fase] - ORDINE_FASE[b.fase]) || (a.priorita - b.priorita) || (a.etichetta < b.etichetta ? -1 : a.etichetta > b.etichetta ? 1 : 0); });
    if (nuoveT.length) { x = { ordine: x.ordine.concat(nuoveT.map(function (v) { return v.uid; })), fatto: false }; salvaSmista(x); }
    var postoT = {}, ordT = [];
    Object.keys(dati).forEach(function (u) { postoT[u] = dati[u]; });
    x.ordine.forEach(function (u, i) { if (!dati[u]) postoT[u] = base + i; });
    Object.keys(postoT).sort(function (a, b) { return postoT[a] - postoT[b]; }).forEach(function (u) { ordT.push(u); });
    var senzaT = x.ordine.filter(function (u) { return !dati[u]; }).length, fattoT = !senzaT || !!x.fatto;
    sistUI.smista = { ordine: x.ordine, fatto: fattoT }; sistUI.smistaPosti = postoT;
    return { posto: postoT, fatto: fattoT, ordine: ordT, dalTablet: true, senzaPosto: senzaT, daSalvare: x.ordine };
  }
  var noti = {}; x.ordine.forEach(function (u) { noti[u] = true; });
  var nuove = coda.voci.filter(function (v) { return !noti[v.uid] && v.fase !== 'fuori' && !posate[v.uid]; })
    .sort(function (a, b) { return (ORDINE_FASE[a.fase] - ORDINE_FASE[b.fase]) || (a.priorita - b.priorita) || (a.etichetta < b.etichetta ? -1 : a.etichetta > b.etichetta ? 1 : 0); });
  if (nuove.length) { x = { ordine: x.ordine.concat(nuove.map(function (v) { return v.uid; })), fatto: x.fatto }; salvaSmista(x); } else sistUI.smista = x;
  var posto = {}; x.ordine.forEach(function (u, i) { posto[u] = i + 1; });
  sistUI.smistaPosti = posto;
  return { posto: posto, fatto: !!x.fatto, ordine: x.ordine };
}
function testoPosto(n) { return n == null ? '' : (n > 100 ? 'plateau ' + (Math.floor((n - 1) / 100) + 1) + ', posto ' + ((n - 1) % 100 + 1) : 'posto ' + n); }
function statoSistemazione() {
  var coda = S.banco.coda(), posate = {};
  (coda.posate || []).forEach(function (u) { posate[u] = true; });
  var sm = smistamento(coda, posate);
  // coi posti del tablet (ordine di consegna) si lavora un tipo di problema alla volta, e dentro il tipo per posto
  var perPosto = function (a, b) { return (sm.dalTablet ? (a.priorita - b.priorita) || (a.titolo < b.titolo ? -1 : a.titolo > b.titolo ? 1 : 0) : 0) || ((sm.posto[a.uid] || 1e9) - (sm.posto[b.uid] || 1e9)); };
  var daDecidere = function (v) { return v.stato === 'da_decidere'; };
  return { coda: coda, posate: posate, smista: sm,
    identita: coda.voci.filter(function (v) { return daDecidere(v) && v.fase === 'identita'; }).sort(perPosto),
    posto: coda.voci.filter(function (v) { return v.fase === 'posto' && (daDecidere(v) || (v.stato === 'decisa' && !posate[v.uid])); }).sort(perPosto),
    fondo: coda.voci.filter(function (v) { return daDecidere(v) && v.fase === 'fondo'; }).sort(perPosto) };
}
/* La tabella dei fuori registro (utente, 2026-11-18: «una tabella delle problematiche ordinabile (anche per posizione), filtrabile e
   cliccabile per aprire la scheda e le opzioni di gestione, consigliata e manuali»). Tutte le provette fuori registro, anche le
   decise; l'ordine e i filtri restano mentre si lavora; la scheda si apre sotto la tabella. */
var tabellaUI = { ordina: 'posto', verso: 1, testo: '', tipo: '', stato: '' };
var COLONNE_TABELLA = [['posto', 'Posto'], ['scritta', 'Scritta'], ['contrassegno', 'Contrassegno'], ['titolo', 'Fattispecie'], ['fase', 'Fase'], ['consigliata', 'Scelta consigliata'], ['esito', 'Stato'], ['operatore', 'Veterinario']];
/* Il numero definitivo di ogni provetta, dalla guida del motore (utente, 2026-11-20: «nella tabella la posizione, dove
   disponibile»): si calcola una volta per ogni stato della sessione, a richiesta, perché costa qualche secondo. */
function numeriDefinitivi() {
  var m = {};
  try { guidaRiordino().forEach(function (sr) { sr.numerazione.forEach(function (n) { if (n.uid) m[n.uid] = n.provetta; }); }); } catch (e) { return null; }
  return m;
}
function vistaTabella(st) {
  var d = h('div', { id: 'fej-tabella' }), nomiFase = { identita: 'A · Di chi è?', posto: 'B · Al loro posto', fondo: 'C · In fondo', fuori: '—' };
  var numeri = tabellaUI.numeri ? numeriDefinitivi() : null;
  var colonne = numeri ? COLONNE_TABELLA.slice(0, 1).concat([['definitivo', 'Numero definitivo']], COLONNE_TABELLA.slice(1)) : COLONNE_TABELLA;
  var righe = st.coda.voci.map(function (v) {
    var posto = st.smista.posto[v.uid] || 0;
    return { v: v, definitivo: numeri ? (numeri[v.uid] == null ? (v.stato === 'tolta' || v.stato === 'persa' ? 'non va in ARVET' : '—') : numeri[v.uid]) : '', posto: st.posate[v.uid] ? 1e9 : (posto || 9e8), dove: st.posate[v.uid] ? 'al suo numero' : posto ? testoPosto(posto) : 'nel secchio',
      scritta: v.etichetta.split(' ')[0], contrassegno: v.contrassegno || 'senza contrassegno', titolo: v.titolo, priorita: v.priorita, fase: nomiFase[v.fase] || '',
      consigliata: v.stato === 'da_decidere' ? (COSA_PROPONE[v.tipo] || 'decide il veterinario') : '—', esito: v.esito, stato: v.stato, operatore: v.operatore || '' };
  });
  var tipi = righe.map(function (r) { return r.titolo; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).sort();
  var q = tabellaUI.testo.trim().toUpperCase();
  var viste = righe.filter(function (r) {
    if (tabellaUI.tipo && r.titolo !== tabellaUI.tipo) return false;
    if (tabellaUI.stato === 'da_decidere' && r.stato !== 'da_decidere') return false;
    if (tabellaUI.stato === 'decise' && (r.stato === 'da_decidere' || r.stato === 'accantonata')) return false;
    if (tabellaUI.stato === 'accantonate' && r.stato !== 'accantonata') return false;
    return !q || [r.scritta, r.contrassegno, r.titolo, r.esito, r.operatore, r.dove].join(' ').toUpperCase().indexOf(q) >= 0;
  });
  var k = tabellaUI.ordina, verso = tabellaUI.verso;
  var valore = function (r) { return k === 'posto' ? r.posto : k === 'definitivo' ? (typeof r.definitivo === 'number' ? r.definitivo : 1e9) : k === 'titolo' ? r.priorita * 1e6 + r.posto : String(r[k] || '').toUpperCase(); };
  viste.sort(function (a, b) { var x = valore(a), y = valore(b); return (x < y ? -1 : x > y ? 1 : (a.posto - b.posto) || (a.scritta < b.scritta ? -1 : 1)) * verso; });
  function ridisegna(fuoco) { disegna(); if (fuoco) { var c = document.getElementById(fuoco); if (c) { c.focus(); if (c.setSelectionRange) c.setSelectionRange(c.value.length, c.value.length); } } }
  var scelta = function (id, valoreAttuale, voci, quando) {
    return h('select', { id: id, onchange: function (ev) { quando(ev.target.value); ridisegna(id); } }, voci.map(function (x) { return h('option', { value: x[0], selected: x[0] === valoreAttuale }, x[1]); }));
  };
  d.appendChild(h('p', { class: 'fej-tabella-filtri' },
    h('label', null, 'Cerca: ', h('input', { type: 'search', id: 'fej-tabella-cerca', value: tabellaUI.testo, autocomplete: 'off', placeholder: 'scritta, contrassegno, fattispecie…',
      oninput: function (ev) { tabellaUI.testo = ev.target.value; ridisegna('fej-tabella-cerca'); } })), ' ',
    h('label', null, 'Fattispecie: ', scelta('fej-tabella-tipo', tabellaUI.tipo, [['', 'tutte']].concat(tipi.map(function (t) { return [t, t]; })), function (x) { tabellaUI.tipo = x; })), ' ',
    h('label', null, 'Stato: ', scelta('fej-tabella-stato', tabellaUI.stato, [['', 'tutte'], ['da_decidere', 'da decidere'], ['decise', 'decise'], ['accantonate', 'accantonate']], function (x) { tabellaUI.stato = x; })), ' ',
    h('span', { class: 'fej-tenue', id: 'fej-tabella-conto', role: 'status' }, viste.length + ' di ' + righe.length), ' ',
    h('button', { type: 'button', id: 'fej-tabella-numeri', 'aria-pressed': tabellaUI.numeri ? 'true' : 'false', title: 'Il numero che la provetta avrà alla fine, coi buchi chiusi (qualche secondo di calcolo)',
      onclick: function () { tabellaUI.numeri = !tabellaUI.numeri; disegna(); } }, tabellaUI.numeri ? 'Nascondi i numeri definitivi' : 'Mostra i numeri definitivi')));
  if (numeri) d.appendChild(h('p', { class: 'fej-tenue' }, 'Numero definitivo: quello che la provetta avrà alla fine, a buchi chiusi, con le decisioni di adesso. Cambia se cambiano le decisioni: si può decidere qui, a tavolino, dove metterle, e spostarle prima di chiudere i buchi.'));
  var t = h('table', { class: 'fej-banco-dati', id: 'fej-tabella-dati' }), tr = h('tr');
  colonne.forEach(function (c) {
    tr.appendChild(h('th', { scope: 'col', 'aria-sort': k === c[0] ? (verso > 0 ? 'ascending' : 'descending') : 'none' },
      h('button', { type: 'button', class: 'fej-ordina', 'data-colonna': c[0], title: 'Ordina per ' + c[1].toLowerCase(), onclick: function () {
        if (tabellaUI.ordina === c[0]) tabellaUI.verso = -tabellaUI.verso; else { tabellaUI.ordina = c[0]; tabellaUI.verso = 1; }
        disegna();
      } }, c[1] + (k === c[0] ? (verso > 0 ? ' ▲' : ' ▼') : ''))));
  });
  t.appendChild(h('thead', null, tr));
  var tb = h('tbody');
  viste.forEach(function (r) {
    var apri = function () { tabellaUI.aperta = r.v.uid; bancoUI.uid = r.v.uid; bancoUI.aperto = r.v.fase === 'identita' && r.v.stato === 'da_decidere' ? 'ricolloca' : null; bancoUI.motivo = ''; bancoUI.cifre = ''; bancoUI.nelReport = null; bancoUI.tutti = false; disegna();
      var s = document.getElementById('fej-tabella-scheda'); if (s && s.scrollIntoView) s.scrollIntoView({ block: 'start' }); };
    tb.appendChild(h('tr', { class: 'fej-riga-cliccabile' + (tabellaUI.aperta === r.v.uid ? ' fej-smista-trovata' : ''), 'data-uid': r.v.uid, onclick: apri },
      h('td', null, h('strong', null, r.dove)), numeri ? h('td', { class: 'fej-definitivo' }, h('strong', null, String(r.definitivo))) : null, h('td', null, h('button', { type: 'button', class: 'fej-copia', title: 'Apri la scheda', onclick: function (ev) { ev.stopPropagation(); apri(); } }, r.scritta)),
      h('td', null, r.contrassegno), h('td', null, r.titolo), h('td', null, r.fase), h('td', null, r.consigliata), h('td', null, r.esito), h('td', null, r.operatore)));
  });
  t.appendChild(tb);
  d.appendChild(h('div', { class: 'fej-tabella-scorre' }, t));
  if (!viste.length) d.appendChild(h('p', { class: 'fej-tenue' }, righe.length ? 'Nessuna provetta con questi filtri.' : 'Nessuna provetta fuori registro.'));
  d.appendChild(h('p', null, h('button', { type: 'button', onclick: function () { window.print(); } }, 'Stampa la tabella')));
  var aperta = tabellaUI.aperta && st.coda.voci.filter(function (v) { return v.uid === tabellaUI.aperta; })[0];
  if (aperta) {
    var box = h('div', { id: 'fej-tabella-scheda' });
    box.appendChild(h('p', null, h('button', { type: 'button', onclick: function () { tabellaUI.aperta = null; bancoUI.uid = null; disegna(); } }, 'Chiudi la scheda')));
    if (st.smista.posto[aperta.uid] && !st.posate[aperta.uid]) box.appendChild(h('p', { class: 'fej-prendi', id: 'fej-prendi' }, 'Prendi la provetta al ', h('strong', null, testoPosto(st.smista.posto[aperta.uid])), ' del plateau dei fuori registro: ', h('strong', null, aperta.etichetta.split(' ')[0]), '.'));
    if (bancoUI.uid !== aperta.uid) bancoUI.uid = aperta.uid;
    box.appendChild(schedaProvettaBanco(aperta.uid));
    d.appendChild(box);
  }
  return d;
}
/* La tabella dello smistamento: posto, scritta, fattispecie; la provetta in mano si cerca per scritta o cifre. */
function vistaSmista(st) {
  var d = h('div', { id: 'fej-smista' }), voci = {}; st.coda.voci.forEach(function (v) { voci[v.uid] = v; });
  var righe = st.smista.ordine.map(function (u) { return voci[u]; }).filter(function (v) { return !!v; });
  if (st.smista.dalTablet) d.appendChild(h('p', { class: 'fej-ok', id: 'fej-smista-tablet', role: 'status' }, 'I posti li ha dati la Regia sul tablet: le provette sono già nel plateau dei fuori registro, nell’ordine in cui le ha prese in mano. ' +
    (st.smista.senzaPosto ? st.smista.senzaPosto + ' non hanno ancora un posto: mettile dopo l’ultima, ai posti indicati qui sotto. ' : 'Non c’è niente da smistare. ') + 'Le fasi le richiamano per posto, un tipo di problema alla volta.'));
  else d.appendChild(h('p', { class: 'fej-tenue' }, 'Se il regista ha già cominciato a dare i posti sul tablet, salva da lì un backup nuovo e carica quello: i posti dati qui restano solo in questo browser, e il tablet riparte dal suo primo posto libero.'));
  var q = String(sistUI.inMano || '').replace(/\s+/g, '').toUpperCase();
  var trovate = q ? righe.filter(function (v) { var et = v.etichetta.replace(/\s+/g, '').toUpperCase(), c = String(v.contrassegno || '').toUpperCase(); return et.indexOf(q) === 0 || (c && c.slice(-q.length) === q); }) : [];
  var campo = h('input', { type: 'search', id: 'fej-smista-in-mano', value: sistUI.inMano || '', autocomplete: 'off', placeholder: 'scritta della provetta o ultime cifre',
    oninput: function (ev) { sistUI.inMano = ev.target.value; disegna(); var c = document.getElementById('fej-smista-in-mano'); if (c) { c.focus(); c.setSelectionRange(c.value.length, c.value.length); } } });
  d.appendChild(h('p', null, h('label', { for: 'fej-smista-in-mano' }, 'Provetta in mano: '), campo));
  if (q) d.appendChild(h('p', { class: trovate.length === 1 ? 'fej-ok fej-smista-esito' : 'fej-avviso fej-smista-esito', id: 'fej-smista-esito', role: 'status' },
    trovate.length === 1 ? 'Mettila al ' + testoPosto(st.smista.posto[trovate[0].uid]) + ' del plateau dei fuori registro (' + trovate[0].etichetta.split(' ')[0] + ' · ' + trovate[0].titolo + ').' :
    trovate.length ? 'Più provette: ' + trovate.map(function (v) { return v.etichetta.split(' ')[0] + ' → ' + testoPosto(st.smista.posto[v.uid]); }).join('; ') + '.' :
    'Nessuna provetta fuori registro con questa scritta: se è ordinaria resta nel suo plateau; se non è mai stata registrata, registrala da Tipologie › Assenti.'));
  var t = h('table', { class: 'fej-banco-dati' }, h('thead', null, h('tr', null, ['Posto', 'Scritta sulla provetta', 'Contrassegno letto', 'Fattispecie', 'Fase', 'Stato'].map(function (x) { return h('th', { scope: 'col' }, x); }))));
  var tb = h('tbody'), nomi = { identita: 'A · Di chi è?', posto: 'B · Al loro posto', fondo: 'C · In fondo', fuori: '—' };
  righe.forEach(function (v) {
    tb.appendChild(h('tr', { class: trovate.indexOf(v) >= 0 ? 'fej-smista-trovata' : null }, h('td', null, h('strong', null, String(st.smista.posto[v.uid]))), h('td', null, v.etichetta.split(' ')[0]),
      h('td', null, v.contrassegno || 'senza contrassegno'), h('td', null, v.titolo), h('td', null, nomi[v.fase] || ''), h('td', null, st.posate[v.uid] ? 'già al suo numero' : v.esito)));
  });
  t.appendChild(tb);
  d.appendChild(h('div', { class: 'fej-tabella-scorre' }, t));
  d.appendChild(h('p', null, h('button', { type: 'button', class: 'fej-primario', id: 'fej-smista-fatto', onclick: function () {
      salvaSmista({ ordine: st.smista.daSalvare || st.smista.ordine, fatto: true }); sistUI.fase = null; sistUI.inMano = ''; bancoUI.uid = null; disegna();
    } }, st.smista.fatto ? 'Smistate: torna alle fasi' : 'Le ho smistate tutte: comincia'), ' ',
    h('button', { type: 'button', onclick: function () { window.print(); } }, 'Stampa l’elenco')));
  return d;
}
function etichettaDi(uid, voci) { for (var i = 0; i < voci.length; i++) if (voci[i].uid === uid) return voci[i].etichetta.split(' ')[0]; return ''; }
function descriviAzione(a, voci) {
  var et = a.uid ? etichettaDi(a.uid, voci) : '';
  switch (a.tipo) {
    case 'ricollocazione': return 'Provetta ' + et + ' attribuita al capo ' + a.capo;
    case 'soluzione': return 'Provetta ' + et + ': ' + ({ coda: 'in coda, ARVET a mano', normalizzata: 'normalizzata (va in ARVET da sola)', regola: 'rimessa da decidere', esclusa: 'tolta' }[a.soluzione] || a.soluzione);
    case 'riattribuzione': return 'Provetta ' + et + ': marca corretta in ' + a.contrassegno;
    case 'scarto': return 'Provetta ' + et + ' tolta: ' + (a.motivo || '');
    case 'annulla_scarto': return 'Provetta ' + et + ' rimessa fra quelle da decidere';
    case 'persa': return 'Provetta ' + et + ' persa: ' + (a.motivo || '');
    case 'ritrovata': return 'Provetta ' + et + ' ritrovata';
    case 'annulla_provetta': return 'Provetta ' + (a.etichetta || et) + ' annullata: ' + (a.motivo || '');
    case 'modifica_provetta': return 'Provetta ' + et + ': nota aggiornata';
    case 'riordino': return 'Provetta di ' + a.contrassegno + ' messa al numero ' + a.destinazione + (String(a.suggerita) !== String(a.destinazione) ? ' (proposto ' + a.suggerita + ')' : '');
    case 'spostamento': return 'Spostamento: ' + a.contrassegno + ' al numero ' + a.provetta;
    case 'scambio': return 'Scambio fra ' + a.a + ' e ' + a.b;
    case 'chiudi_buchi': return 'Chiusura dei buchi: ' + (a.valore ? 'sì' : 'no');
    case 'anagrafe_bdn': return 'Verifica in BDN caricata';
    case 'uscite_modello': return 'Uscite per modello (ultimi 7 giorni) caricate';
    case 'tardiva': return 'Registrazione tardiva: ' + (a.etichetta || '') + ' al capo ' + (a.contrassegno || '');
    default: return a.tipo;
  }
}
/* Le movimentazioni (utente, 2026-11-20: «una lista delle movimentazioni delle provette, modificabile, aperta da un tasto
   apposito come le Ultime del campionamento»): ogni azione, le ultime in cima, con la provetta, che cosa è cambiato, com'è
   adesso, dove va (a richiesta: costa un calcolo del motore) e «Annulla». */
function pannelloMovimentazioni(voci) {
  var az = S.stato.azioni(), perUid = {}, d = h('section', { class: 'fej-movimenti', id: 'fej-movimenti', 'aria-label': 'Movimentazioni' });
  voci.forEach(function (v) { perUid[v.uid] = v; });
  d.appendChild(h('p', { class: 'fej-movimenti-testa' }, h('strong', null, 'Movimentazioni: ' + az.length + (az.length === 1 ? ' azione' : ' azioni')), ' · le ultime in cima ',
    h('button', { type: 'button', onclick: function () { sistUI.movimenti = false; disegna(); } }, 'Chiudi'), ' ',
    h('button', { type: 'button', onclick: paginaSpostamenti }, 'Pagina da stampare')));
  if (!az.length) d.appendChild(h('p', { class: 'fej-tenue' }, 'Ancora nessuna azione.'));
  var t = h('table', { class: 'fej-banco-dati' }, h('thead', null, h('tr', null, ['Ora', 'Provetta', 'Che cosa', 'Adesso', 'Dove va', ''].map(function (x) { return h('th', { scope: 'col' }, x); }))));
  var tb = h('tbody'); sistUI.doveMov = sistUI.doveMov || {};
  az.slice().reverse().slice(0, 200).forEach(function (a) {
    var v = a.uid ? perUid[a.uid] : null, dove = a.uid ? sistUI.doveMov[a.uid + '|' + az.length] : null;
    tb.appendChild(h('tr', { 'data-movimento': a.id }, h('td', null, String(a.ts || '').slice(11, 16)), h('td', null, h('strong', null, v ? v.etichetta.split(' ')[0] : (a.etichetta || '—'))),
      h('td', null, descriviAzione(a, voci)), h('td', null, v ? v.esito : ''),
      h('td', null, dove ? dove.cosa : (v && v.stato === 'decisa' ? h('button', { type: 'button', class: 'fej-copia', onclick: function () {
        try { sistUI.doveMov[a.uid + '|' + az.length] = S.banco.destinazione(a.uid); } catch (e) { sistUI.doveMov[a.uid + '|' + az.length] = { cosa: 'Posto non calcolato: ' + e.message }; }
        disegna(); } }, 'Dove va?') : '')),
      h('td', null, h('button', { type: 'button', onclick: function () { if (confirm('Annullare: ' + descriviAzione(a, voci) + '?\nLe azioni fatte dopo restano, se valgono ancora.')) togli(a.id); } }, 'Annulla'),
        v ? ' ' : '', v ? h('button', { type: 'button', onclick: function () { sistUI.movimenti = false; sistUI.fase = 'tabella'; tabellaUI.aperta = v.uid; bancoUI.uid = v.uid; bancoUI.aperto = null; disegna(); } }, 'Cambia…') : '')));
  });
  t.appendChild(tb); d.appendChild(h('div', { class: 'fej-tabella-scorre' }, t));
  if (az.length > 200) d.appendChild(h('p', { class: 'fej-tenue' }, 'Le ultime 200 di ' + az.length + ': le altre nella pagina da stampare.'));
  return d;
}
function cronologia(voci) {
  var az = S.stato.azioni(), d = h('details', { class: 'fej-cronologia', id: 'fej-cronologia' });
  d.appendChild(h('summary', null, 'Cronologia: ' + az.length + (az.length === 1 ? ' azione' : ' azioni') + ' (ognuna si può annullare)'));
  if (!az.length) d.appendChild(h('p', null, 'Ancora nessuna azione.'));
  az.slice().reverse().forEach(function (a) {
    d.appendChild(h('div', { class: 'fej-riga', 'data-azione': a.id }, h('span', { class: 'fej-tenue' }, String(a.ts || '').slice(11, 16) + ' '), descriviAzione(a, voci), ' ',
      h('button', { type: 'button', onclick: function () { if (confirm('Annullare: ' + descriviAzione(a, voci) + '?\nLe azioni fatte dopo restano, se valgono ancora.')) togli(a.id); } }, 'Annulla')));
  });
  d.appendChild(h('p', null, h('button', { type: 'button', id: 'fej-pagina-spostamenti', onclick: paginaSpostamenti }, 'Schema delle provette con le modifiche (pagina da stampare)')));
  return d;
}
/* Una pagina sola: quale provetta è andata al laboratorio con ciascun numero, e tutte le azioni in ordine. */
function paginaSpostamenti() {
  if (S.apVecchio || !S.ap) aggiornaRisultato();
  var e = function (x) { return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  var voci = S.banco.coda().voci, perUid = {}; voci.forEach(function (v) { perUid[v.uid] = v; });
  var righe = (S.ap.provette || []).filter(function (p) { return !p.annullata; }).map(function (p) {
    var et = String(p.etichetta || '').split(' ')[0], v = perUid[p.uid];
    return { numero: p.numero, et: et, capo: p.contrassegno || '', serie: p.serie, vet: p.operatore, note: p.note || '', cosa: v ? v.titolo + ' · ' + v.esito : (String(p.numero) !== et ? 'numero cambiato' : '') };
  }).filter(function (r) { return r.cosa; }).sort(function (a, b) { return a.serie < b.serie ? -1 : a.serie > b.serie ? 1 : (Number(a.numero) || 1e9) - (Number(b.numero) || 1e9); });
  var html = '<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Sistemazione delle provette</title><style>body{font-family:system-ui,sans-serif;margin:1.2rem;font-size:11pt}table{border-collapse:collapse;width:100%}' +
    'th,td{border:1px solid #999;padding:3px 6px;text-align:left}th{background:#e6efe6}h2{margin-top:1.4em}</style></head><body><h1>Sistemazione delle provette</h1><p>' +
    e((S.P.manifesto.seduta && S.P.manifesto.seduta.nome) || '') + ' · stampato il ' + new Date().toLocaleString('it-IT') + '</p><h2>Provette con una modifica: che cosa è andato al laboratorio</h2>' +
    '<table><thead><tr><th>Serie</th><th>Numero finale</th><th>Scritta in campo</th><th>Capo</th><th>Veterinario</th><th>Che cosa</th><th>Note</th></tr></thead><tbody>' +
    righe.map(function (r) { return '<tr><td>' + e(r.serie) + '</td><td>' + e(r.numero == null ? 'ARVET a mano' : r.numero) + '</td><td>' + e(r.et) + '</td><td>' + e(r.capo) + '</td><td>' + e(r.vet) + '</td><td>' + e(r.cosa) + '</td><td>' + e(r.note) + '</td></tr>'; }).join('') +
    '</tbody></table><h2>Cronologia delle azioni</h2><table><thead><tr><th>Ora</th><th>Azione</th><th>Chi</th></tr></thead><tbody>' +
    S.stato.azioni().map(function (a) { return '<tr><td>' + e(String(a.ts || '').replace('T', ' ').slice(0, 16)) + '</td><td>' + e(descriviAzione(a, voci)) + '</td><td>' + e(a.nome || '') + '</td></tr>'; }).join('') +
    '</tbody></table></body></html>';
  var w = window.open('', '_blank');
  if (!w) { scarica('sistemazione_provette.html', 'text/html;charset=utf-8', html); return; }
  w.document.open(); w.document.write(html); w.document.close();
}
/* Interrogazione (utente, 2026-11-18): per contrassegno, con le provette collegate, o per provetta, col contrassegno collegato.
   Per un capo uscito con un documento non ancora nel registro: «Uscito il … verso … con documento …», copiabile. */
var interrogaUI = { q: '', azione: null, valore: '' };
/* Dove si trova adesso una provetta, dagli eventi (pose, spostamenti, scambi): plateau e pozzetto, o non ancora posata. */
function doveSiTrova(uid) {
  if (S.apVecchio || !S.ap) aggiornaRisultato();
  var p = (S.ap.posizioniAttuali || []).filter(function (x) { return x.uid === uid; })[0];
  var sm = sistUI.smistaPosti ? (sistUI.smistaPosti[uid] || 0) : 0;
  var contenitore = 'non è ancora al suo numero: fuori registro' + (sm ? ', al ' + testoPosto(sm) + ' del plateau dei fuori registro' : ', nel contenitore dei fuori registro');
  if (!p || !p.plateau || !p.pozzetto) return p && p.vista === 'serie' ? 'non ancora posata' : contenitore;
  if (p.vista === 'serie') return 'plateau ' + p.plateau + ', pozzetto ' + p.pozzetto + ' della serie ' + p.serie.replace(':', ' ') + ' (numero ' + ((p.plateau - 1) * 100 + p.pozzetto) + ')';
  return 'plateau dei fuori registro ' + p.plateau + ', posto ' + p.pozzetto;
}
/* Uno spostamento o un abbinamento a un altro capo registrato dalla ricerca: un'azione come le altre, nella cronologia, con «Annulla». */
function azioneDaRicerca(pr) {
  var a = interrogaUI.azione, v = String(interrogaUI.valore || '').replace(/\s+/g, '').toUpperCase(), az, parti = String(pr.serie || '').split(':');
  if (!v) { S.messaggio = a.tipo === 'sposta' ? 'Scrivi il numero di destinazione.' : 'Scrivi il contrassegno del capo.'; messaggio(); return; }
  if (a.tipo === 'sposta') {
    if (!/^\d+$/.test(v)) { S.messaggio = 'Il numero di destinazione deve essere un numero.'; messaggio(); return; }
    // come lo spostamento dal Plateau: la destinazione suggerita è quella della guida (o il numero che la provetta ha già), quella
    // scritta è la destinazione; il numero occupato chiede lo scambio (revisione del 18/11, P2-2)
    var numero = Number(v), serieG = null, gG = null, finaleG = null;
    try { serieG = guidaRiordino().filter(function (s) { return s.codice + ':' + s.specie === pr.serie; })[0]; } catch (e9) { serieG = null; }
    if (serieG) { gG = serieG.guida.filter(function (g) { return g.uid === pr.uid; })[0]; finaleG = serieG.numerazione.filter(function (n) { return n.uid === pr.uid; })[0]; }
    if (!gG && !finaleG) { S.messaggio = 'Non registrata: la provetta non ha un numero nella serie (va prima decisa nella Sistemazione).'; messaggio(); return; }
    var occ = (S.ap.posizioniAttuali || []).filter(function (p) { return p.uid !== pr.uid && p.serie === pr.serie && p.vista === 'serie' && (p.plateau - 1) * 100 + p.pozzetto === numero; })[0] ||
      serieG.numerazione.filter(function (n) { return n.provetta === numero && n.uid !== pr.uid; })[0];
    if (occ && !window.confirm('Il numero ' + numero + ' è occupato dalla provetta ' + String(occ.etichetta || '').split(' ')[0] + '. Confermi lo scambio?')) return;
    az = { tipo: 'riordino', uid: pr.uid, stabilimento: parti[0], specie: parti[1], contrassegno: gG ? gG.contrassegno : finaleG.contrassegno,
      suggerita: gG ? gG.a_n : finaleG.provetta, destinazione: numero, da_plateau: true, batch: false, da_ricerca: true };
    if (occ && occ.uid) az.conferma_con = occ.uid;
  } else {
    // un capo uscito con un documento di accompagnamento non è presente: l'abbinamento si fa solo se chi decide lo conferma
    var usc = []; try { usc = S.banco.usciteModello(); } catch (e0) { usc = []; }
    var u = usc.filter(function (x) { return x.contrassegno === v; })[0];
    if (u && !window.confirm('Il capo ' + v + ' non è presente: ' + (u.testo || 'uscito con un documento di accompagnamento') + '.\nVuoi abbinargli lo stesso la provetta?')) return;
    az = { tipo: 'riattribuzione', uid: pr.uid, contrassegno: v, da_ricerca: true };
  }
  az.id = Stato.uuid(); az.ts = new Date().toISOString(); az.nome = nomeUtente() || 'Sito';
  var no;
  try { no = applicaSullaSessione(az); } catch (e) { no = e.message; }
  if (no && a.tipo === 'sposta' && /plateau completo/i.test(no) && window.confirm('Lo spostamento tocca un plateau completo. Confermi?')) {
    az.conferma_plateau_completo = true; try { no = applicaSullaSessione(az); } catch (e2) { no = e2.message; }
  }
  if (no && a.tipo === 'abbina' && /gi[aà] una provetta|doppio|conferma/i.test(no) && window.confirm(no + '\nConfermi lo stesso l’abbinamento?')) {
    az.conferma_doppio = true; try { no = applicaSullaSessione(az); } catch (e3) { no = e3.message; }
  }
  if (no) { S.messaggio = 'Non registrata: ' + no; messaggio(); return; }
  S.messaggio = a.tipo === 'sposta' ? 'Spostamento registrato: provetta ' + String(pr.etichetta).split(' ')[0] + ' al numero ' + v + '. Lo trovi nella cronologia.' :
    'Abbinamento registrato: provetta ' + String(pr.etichetta).split(' ')[0] + ' al capo ' + v + '. Lo trovi nella cronologia.';
  interrogaUI.azione = null; interrogaUI.valore = ''; aggiornaRisultato(); disegna();
}
function riquadroInterroga() {
  var d = h('div', { class: 'fej-banco-pannello', id: 'fej-interroga' });
  var campo = h('input', { type: 'search', id: 'fej-interroga-campo', value: interrogaUI.q, autocomplete: 'off', placeholder: 'cifre del contrassegno, scritta o numero della provetta',
    oninput: function (ev) { interrogaUI.q = ev.target.value; disegna(); var c = document.getElementById('fej-interroga-campo'); if (c) { c.focus(); c.setSelectionRange(c.value.length, c.value.length); } } });
  d.appendChild(h('p', null, h('label', { for: 'fej-interroga-campo' }, h('strong', null, 'Cerca un capo o una provetta: ')), campo));
  var q = String(interrogaUI.q || '').trim();
  if (q.length < 2) return d;
  var ris = [];
  try { ris = S.banco.interroga(q); } catch (e) { d.appendChild(h('p', { class: 'fej-errore' }, 'Ricerca non disponibile: ' + e.message)); return d; }
  if (!ris.length) { d.appendChild(h('p', { class: 'fej-avviso', role: 'status' }, 'Nessun capo e nessuna provetta con «' + q + '».')); return d; }
  var copiaT = function (t, cosa) { return h('button', { type: 'button', class: 'fej-copia', title: 'Copia ' + cosa, 'aria-label': 'Copia ' + cosa + ' ' + t, onclick: function () { copia(t); } }, '⧉'); };
  var SPU = { pecore: 'pecora', capre: 'capra' };
  ris.slice(0, 12).forEach(function (r) {
    var box = h('div', { class: 'fej-interroga-voce' + (r.stato === 'uscito_modello' ? ' fej-avviso' : '') });
    box.appendChild(h('p', null, r.contrassegno ? h('code', null, r.contrassegno) : h('em', null, 'senza contrassegno'), r.contrassegno ? ' ' : '', r.contrassegno ? copiaT(r.contrassegno, 'il contrassegno') : '',
      ' · ' + [SPU[r.specie] || r.specie, r.sesso, r.razza, r.nascita, r.stabilimento].filter(Boolean).join(' · ') + (r.numero != null ? ' · numero assegnato ' + r.numero : '') +
      (r.per === 'provetta' ? ' · trovato dalla provetta' : '')));
    var stato = h('p', null, h('strong', null, r.descrizione));
    if (r.uscita && r.uscita.modello) { stato.appendChild(document.createTextNode(' ')); stato.appendChild(copiaT(r.uscita.modello, 'il numero del documento')); }
    if (r.uscita && r.uscita.destinazione_codice) { stato.appendChild(document.createTextNode(' ')); stato.appendChild(copiaT(r.uscita.destinazione_codice, 'il codice di destinazione')); }
    box.appendChild(stato);
    if (r.provette.length) box.appendChild(h('ul', null, r.provette.map(function (pr) {
      return h('li', null, 'Provetta ', h('strong', null, String(pr.etichetta).split(' ')[0]), pr.numero != null ? ' (numero ' + pr.numero + ')' : '', ' · ' + pr.stato + (pr.operatore ? ' · ' + pr.operatore : '') +
        (pr.letto_in_campo ? ' · marca letta in campo ' + pr.letto_in_campo + ', ora vale per ' + (pr.capo || '—') : ''), ' ',
        h('button', { type: 'button', class: 'fej-copia', onclick: function () { S.scheda = 'banco'; bancoUI.uid = pr.uid; bancoUI.aperto = null; disegna(); } }, 'Apri la scheda'),
        pr.stato === 'annullata' ? '' : h('div', { class: 'fej-interroga-dove' }, h('span', null, 'Adesso: ' + doveSiTrova(pr.uid) + '. '),
          h('button', { type: 'button', class: 'fej-copia', onclick: function () { interrogaUI.azione = { uid: pr.uid, tipo: 'sposta' }; interrogaUI.valore = ''; disegna(); } }, 'Sposta…'), ' ',
          h('button', { type: 'button', class: 'fej-copia', onclick: function () { interrogaUI.azione = { uid: pr.uid, tipo: 'abbina' }; interrogaUI.valore = ''; disegna(); } }, 'Abbina a un altro capo…'),
          interrogaUI.azione && interrogaUI.azione.uid === pr.uid ? h('div', null,
            h('label', null, interrogaUI.azione.tipo === 'sposta' ? 'Nuovo numero nella serie: ' : 'Contrassegno del capo (intero): ',
              h('input', { type: 'text', id: 'fej-interroga-valore', value: interrogaUI.valore, autocomplete: 'off', inputmode: interrogaUI.azione.tipo === 'sposta' ? 'numeric' : 'text',
                oninput: function (ev) { interrogaUI.valore = ev.target.value; }, onkeydown: function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); azioneDaRicerca(pr); } } })), ' ',
            h('button', { type: 'button', class: 'fej-primario', onclick: function () { azioneDaRicerca(pr); } }, 'Registra'), ' ',
            h('button', { type: 'button', onclick: function () { interrogaUI.azione = null; disegna(); } }, 'Lascia stare')) : ''));
    }))); else box.appendChild(h('p', { class: 'fej-tenue' }, r.stato === 'presente' ? 'Nessuna provetta: capo non prelevato.' : 'Nessuna provetta.'));
    d.appendChild(box);
  });
  if (ris.length > 12) d.appendChild(h('p', { class: 'fej-tenue' }, 'Primi 12 di ' + ris.length + ': scrivi più cifre.'));
  return d;
}
function schedaSistemazione() {
  var d = h('div', { class: 'fej-sistemazione', id: 'fej-sistemazione' }), st;
  // i buchi si chiudono sempre: si scrive una volta, all'inizio, prima di ogni spostamento. Il risultato completo non si rifà
  // a ogni azione: la scheda legge solo la sessione (coda, scheda della provetta, guida dei buchi)
  if (!compattaAttuale() && !riordinoIniziato() && !occupatoPc)
    applicaSullaSessione({ id: Stato.uuid(), tipo: 'chiudi_buchi', ts: new Date().toISOString(), valore: true });
  if (S.banco) d.appendChild(riquadroInterroga());
  try { st = statoSistemazione(); } catch (e) { d.appendChild(h('p', { class: 'fej-errore' }, 'Sistemazione non disponibile: ' + e.message)); return d; }
  var buchi = null;
  function contaBuchi() { if (buchi == null) { try { buchi = righeRiordino().filter(function (r) { return !r.g.fatta; }).length; } catch (e) { buchi = 0; } } return buchi; }
  var n = { identita: st.identita.length, posto: st.posto.length, fondo: st.fondo.length };
  var daSmistare = !st.smista.fatto && (n.identita + n.posto + n.fondo) > 1;
  var qualcosa = st.coda.voci.some(function (v) { return v.stato === 'da_decidere'; });
  var prima = (!analisiVista() && qualcosa) ? 'analisi' : daSmistare ? 'smista' : n.identita ? 'identita' : n.posto ? 'posto' : n.fondo ? 'fondo' : contaBuchi() ? 'buchi' : 'fine';
  var fase = sistUI.fase || prima;
  var barraFasi = h('div', { class: 'fej-fasi', role: 'tablist', 'aria-label': 'Fasi della sistemazione' });
  FASI.forEach(function (f) {
    var quanti = f[0] === 'buchi' ? (prima === 'buchi' || prima === 'fine' || fase === 'buchi' ? contaBuchi() : '…') : (f[0] === 'fine' || f[0] === 'analisi' || f[0] === 'tabella') ? '' : f[0] === 'smista' ? (st.smista.fatto ? 0 : st.smista.ordine.length) : n[f[0]];
    barraFasi.appendChild(h('button', { type: 'button', role: 'tab', 'aria-selected': fase === f[0] ? 'true' : 'false', 'data-fase': f[0],
      class: 'fej-fase' + (fase === f[0] ? ' fej-attiva' : '') + (quanti === 0 ? ' fej-fatta' : ''), onclick: function () { sistUI.fase = f[0]; bancoUI.uid = null; disegna(); } },
      f[1], quanti === '' ? null : h('span', { class: 'fej-fase-n' }, quanti === 0 ? ' ✓' : ' ' + quanti)));
  });
  d.appendChild(barraFasi);
  d.appendChild(h('p', { class: 'fej-sist-strumenti' }, h('button', { type: 'button', id: 'fej-apri-movimenti', 'aria-expanded': sistUI.movimenti ? 'true' : 'false',
    onclick: function () { sistUI.movimenti = !sistUI.movimenti; disegna(); } }, 'Movimentazioni (' + S.stato.azioni().length + ')')));
  if (sistUI.movimenti) d.appendChild(pannelloMovimentazioni(st.coda.voci));
  var postoUltima = h('div'), doveInCima = null; d.appendChild(postoUltima);
  if (fase !== prima && prima !== 'fine' && fase !== 'smista' && fase !== 'analisi' && fase !== 'tabella') d.appendChild(h('p', { class: 'fej-avviso' }, 'Prima andrebbe finita la fase «' + FASI.filter(function (f) { return f[0] === prima; })[0][1] + '»: i posti e i buchi dipendono dalle decisioni che mancano. ',
    h('button', { type: 'button', onclick: function () { sistUI.fase = null; bancoUI.uid = null; disegna(); } }, 'Torna lì')));
  d.appendChild(h('p', { class: 'fej-guida' }, GUIDA_FASE[fase]));
  if (fase === 'analisi') d.appendChild(vistaAnalisi(st, contaBuchi));
  else if (fase === 'smista') d.appendChild(vistaSmista(st));
  else if (fase === 'tabella') d.appendChild(vistaTabella(st));
  else if (fase === 'buchi') d.appendChild(schedaRiordino());
  else if (fase === 'fine') {
    var c = st.coda.conteggi, resto = c.da_decidere + c.accantonata;
    d.appendChild(h('p', { class: resto || contaBuchi() ? 'fej-avviso' : 'fej-ok' }, resto ? 'Restano ' + c.da_decidere + ' provette da decidere e ' + c.accantonata + ' accantonate. ' : 'Tutte le provette fuori registro sono decise. ',
      contaBuchi() ? 'Restano ' + contaBuchi() + ' passi per chiudere i buchi. ' : 'Nessun buco da chiudere. ', 'Gli snippet si possono prendere comunque: se non sono conformi lo dicono.'));
    d.appendChild(h('p', null, h('button', { type: 'button', class: 'fej-primario', onclick: function () { S.scheda = 'snippet'; disegna(); } }, 'Snippet ARVET'), ' ',
      h('button', { type: 'button', onclick: function () { S.scheda = 'uscite'; disegna(); } }, 'Uscite e pagina per l’allevatore')));
  } else {
    var lista = st[fase];
    if (!lista.length) d.appendChild(h('p', { class: 'fej-ok' }, 'Niente da fare in questa fase. ', h('button', { type: 'button', class: 'fej-primario', onclick: function () { sistUI.fase = null; bancoUI.uid = null; disegna(); } }, 'Avanti')));
    else {
      var voluta = bancoUI.prossimo; bancoUI.prossimo = null;
      var attuale = lista.filter(function (v) { return v.uid === (voluta || bancoUI.uid); })[0] || lista[0];
      if (bancoUI.uid !== attuale.uid) { bancoUI.uid = attuale.uid; bancoUI.aperto = fase === 'identita' ? 'ricolloca' : null; bancoUI.motivo = ''; bancoUI.cifre = ''; bancoUI.nelReport = null; bancoUI.tutti = false; }
      var chips = h('div', { class: 'fej-fase-provette', 'aria-label': 'Provette di questa fase' });
      lista.forEach(function (v) {
        chips.appendChild(h('button', { type: 'button', class: 'fej-chip' + (v.uid === attuale.uid ? ' fej-attiva' : ''), title: v.titolo + ' · ' + v.esito,
          onclick: function () { bancoUI.uid = null; bancoUI.prossimo = v.uid; disegna(); } }, (st.smista.posto[v.uid] ? st.smista.posto[v.uid] + ' · ' : '') + v.etichetta.split(' ')[0]));
      });
      d.appendChild(chips);
      if (st.smista.posto[attuale.uid]) d.appendChild(h('p', { class: 'fej-prendi', id: 'fej-prendi' }, 'Prendi la provetta al ', h('strong', null, testoPosto(st.smista.posto[attuale.uid])), ' del plateau dei fuori registro: ', h('strong', null, attuale.etichetta.split(' ')[0]), '.'));
      // in «Al loro posto» il posto sta in cima, i dati della provetta chiusi sotto (utente, 2026-11-20)
      if (fase === 'posto' && attuale.stato === 'decisa') {
        var destB = bancoUI.dest[attuale.uid];
        if (destB === undefined) { try { destB = bancoUI.dest[attuale.uid] = S.banco.destinazione(attuale.uid); } catch (e) { destB = { cosa: 'Posto non calcolato: ' + e.message }; } }
        doveInCima = attuale.uid;
        d.appendChild(riquadroDove(attuale.uid, destB, null, 'fej-banco-messa'));
        d.appendChild(h('details', { class: 'fej-dettagli-provetta' }, h('summary', null, 'Dati della provetta ' + attuale.etichetta.split(' ')[0] + ' · ' + attuale.titolo + ' · ' + attuale.esito),
          schedaProvettaBanco(attuale.uid, { senzaDove: true })));
      } else d.appendChild(schedaProvettaBanco(attuale.uid));
    }
  }
  // l'ultima decisione in cima, senza ripetere il posto se è la stessa provetta del riquadro «dove va»
  var ult = riquadroUltima(doveInCima); if (ult) postoUltima.appendChild(ult);
  d.appendChild(cronologia(st.coda.voci));
  return d;
}

/* ---- avvio: carica il testo dello snippet (arvet_fill.min.js) dal sito e disegna ---- */
var base = document.currentScript ? document.currentScript.src.replace(/[^/]*$/, '') : 'js/';
var promessaMotore = (typeof fetch === 'function' ? fetch(base + 'vendor/arvet_fill.min.js').then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.text(); }) : Promise.reject(new Error('fetch assente')))
  .then(function (t) { S.motoreArvet = t; }, function () { S.erroreMotore = true; S.motoreArvet = ''; });
/* Gli snippet si calcolano solo quando lo script di ARVET è caricato: se non lo è, si dice. */
function attendiMotore() { promessaMotore.then(function () { if (S.erroreMotore) { S.messaggio = 'Non riesco a caricare lo script di ARVET: gli snippet non si possono preparare, ricarica la pagina.'; } ricalcola(); }); }
disegna();
if (!pc) Memoria.prendi('cartella').then(function (c) { Disco.ripristina(c); return Memoria.prendi('backup'); }).then(function (b) {
  if (b && !S.P) leggiBackup(b).then(function () { if (S.P) { S.messaggio = 'Sessione ripresa: backup e azioni di prima.'; messaggio(); } }, function () { /* backup non più leggibile: si ricarica a mano */ });
});
if (pc) pc.stato().then(function () { collegatoPc = true; caricaDalTablet(); }, function () { /* primo accesso: chiede il codice */ });
})();
