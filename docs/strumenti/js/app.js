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
function compattaAttuale() { return !!(S.ap && S.ap.impostazioni.chiudi_buchi); }
function riordinoIniziato() { return !!(S.ap && S.ap.impostazioni.riordino_iniziato); }
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

/* ---- lo stato e il calcolo ---- */
function ricalcola() {
  if (!S.P) return;
  try {
    S.dueTrentatreFinali = []; // I numeri finali dipendono da tutte le azioni.
    S.ap = Az.applica(S.P, S.stato.azioni());
    modelloPlateau.aggiorna(S.ap.plateauAttuale || [], {serie: S.ap.seriePlateau, verso: S.ap.impostazioni.verso_riempimento, sequenza: S.ap.impostazioni.problematici_in_sequenza});
    S.esito = Az.calcola(S.P, S.stato.azioni(), { FineLavori: FL, M: M, motoreArvet: S.motoreArvet, proiezione: S.ap });
  } catch (e) { S.messaggio = 'Calcolo non riuscito: ' + e.message; S.esito = null; }
  disegna();
}
function azione(tipo, dati) {
  var a = Object.assign({ id: Stato.uuid(), tipo: tipo, ts: new Date().toISOString() }, dati);
  var azioni = S.stato.azioni().concat([a]);
  try {
    var ap = Az.applica(S.P, azioni);
    var errore = ap.rifiutate.filter(function (x) { return x.id === a.id; })[0];
    if (errore) { S.messaggio = errore.motivo; messaggio(); return false; }
    S.stato.sostituisci(azioni); ricalcola(); return true;
  } catch (e) { S.messaggio = e.message; messaggio(); return false; }
}
function togli(id) { S.stato.rimuovi(id); ricalcola(); }

/* ---- schede ---- */
var SCHEDE = [['carica', 'Carica'], ['avvisi', 'Avvisi'], ['provette', 'Provette'], ['problemi', 'Problemi'], ['nontrovati', 'Non trovati'], ['riordino', 'Riordino'], ['plateau', 'Plateau'], ['statistiche', 'Statistiche'], ['snippet', 'Snippet ARVET'], ['uscite', 'Uscite'], ['esporta', 'Esporta per l\'app']];
var tabs = h('div', { class: 'fej-tabs', role: 'tablist' });
var corpo = h('div', { class: 'fej-corpo' });
radice.appendChild(tabs); radice.appendChild(msgEl); radice.appendChild(corpo);

function disegna() {
  if (plateauPrincipale) { plateauPrincipale.ferma(); plateauPrincipale = null; }
  tabs.textContent = '';
  SCHEDE.forEach(function (s) {
    tabs.appendChild(h('button', { type: 'button', role: 'tab', 'aria-selected': S.scheda === s[0] ? 'true' : 'false', class: S.scheda === s[0] ? 'fej-tab fej-attiva' : 'fej-tab',
      disabled: s[0] !== 'carica' && (!S.P || !verificaAmmessa()), onclick: function () { S.scheda = s[0]; disegna(); } }, s[1]));
  });
  corpo.textContent = '';
  var f = { carica: schedaCarica, avvisi: schedaAvvisi, provette: schedaProvette, problemi: schedaProblemi, nontrovati: schedaNonTrovati, riordino: schedaRiordino, plateau: schedaPlateau, statistiche: schedaStatistiche, snippet: schedaSnippet, uscite: schedaUscite, esporta: schedaEsporta }[S.scheda];
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
  if (S.P && S.P.pacchetto.id !== P.pacchetto.id) riordinoUI = {destinazioni: {}, selezionate: {}, esiti: {}, conferma: null};
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
  S.filtroStabProvette = ''; S.ap = null; S.esito = null;
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
  if (S.ap && S.ap.backupFiles) {
    pBottoni.appendChild(h('button', {
      type: 'button',
      onclick: function () {
        var voci = Object.keys(S.ap.backupFiles).sort().map(function (k) { return { name: k, data: S.ap.backupFiles[k] }; });
        var nomeZip = 'fejalog_backup_' + String((P.manifesto.seduta && P.manifesto.seduta.nome) || 'progetto').replace(/[^A-Za-z0-9_-]+/g, '_') + '_aggiornato.zip';
        scarica(nomeZip, 'application/zip', Zip.scrivi(voci));
      }
    }, 'Scarica backup e modifiche (zip)'));
    pBottoni.appendChild(document.createTextNode(' '));
  }
  pBottoni.appendChild(h('button', { type: 'button', onclick: function () { if (confirm('Ricominciare da capo? Si perdono le azioni fatte su questo backup.')) { S.stato.azzera(); ricalcola(); } } }, 'Ricomincia da capo'));
  d.appendChild(pBottoni);
  return d;
}

function schedaAvvisi() {
  var d = h('div', { class: 'fej-scheda-avvisi' });
  d.appendChild(h('p', null, 'Gli avvisi di seduta: doppi contrassegni scoperti dopo il prelievo, capi ricercati trovati, collisioni di etichette, provette con controllo doppi incompleto e dispositivi rimasti fuori rete. La presa visione («Visto») si salva in locale e si riporta nell\'app dalla scheda «Esporta per l\'app».'));

  var avv = (S.ap && S.ap.avvisi) || { doppiScoperti: [], ricercatiTrovati: [], collisioni: [], controlloIncompleto: [], deviceMaiRientrati: [] };

  // 1. Doppi contrassegni scoperti
  var secDoppi = h('div', { class: 'fej-sezione' });
  secDoppi.appendChild(h('h3', null, 'Doppi contrassegni scoperti (' + avv.doppiScoperti.length + ')'));
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
  var secRic = h('div', { class: 'fej-sezione', style: 'margin-top: 1.2rem;' });
  secRic.appendChild(h('h3', null, 'Capi ricercati trovati (' + avv.ricercatiTrovati.length + ')'));
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
  var secColl = h('div', { class: 'fej-sezione', style: 'margin-top: 1.2rem;' });
  secColl.appendChild(h('h3', null, 'Collisioni di etichette (' + avv.collisioni.length + ')'));
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
  var secInc = h('div', { class: 'fej-sezione', style: 'margin-top: 1.2rem;' });
  secInc.appendChild(h('h3', null, 'Controllo doppi incompleto (' + avv.controlloIncompleto.length + ')'));
  if (!avv.controlloIncompleto.length) {
    secInc.appendChild(h('p', { class: 'fej-tenue' }, 'Tutte le provette sono state prelevate con controllo doppi completo.'));
  } else {
    avv.controlloIncompleto.forEach(function (inc) {
      var riga = h('div', { class: 'fej-riga' });
      riga.appendChild(h('strong', null, inc.etichetta));
      riga.appendChild(document.createTextNode(' '));
      if (inc.contrassegno) {
        riga.appendChild(h('code', null, inc.contrassegno));
        riga.appendChild(document.createTextNode(' '));
        riga.appendChild(bottoneCopia(inc.contrassegno));
      }
      riga.appendChild(h('span', { class: 'fej-tenue' }, ' · Operatore: ' + inc.operatore + (inc.nonVisti ? ' (dispositivi non verificati: ' + inc.nonVisti + ')' : '')));
      secInc.appendChild(riga);
    });
  }
  d.appendChild(secInc);

  // 5. Dispositivi mai rientrati
  var secDev = h('div', { class: 'fej-sezione', style: 'margin-top: 1.2rem;' });
  secDev.appendChild(h('h3', null, 'Dispositivi mai rientrati (' + avv.deviceMaiRientrati.length + ')'));
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
    ['problematiche', 'Problematiche'],
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
    apriProgetto(P); S.ignoraVerifica = false; S.messaggio = P.verifica.ok ? 'Backup letto e verificato.' : 'Backup letto, ma la verifica ha trovato problemi: per usarlo serve la conferma qui sotto.';
    if (P.verifica.ok) attendiMotore(); else { S.esito = null; S.ap = null; disegna(); }
  });
}
function caricaDalTablet() {
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
  d.appendChild(h('p', null, 'Le provette che non vanno in ARVET da sole, per tipologia. Scegli che cosa farne; la scelta vale per i file che produci qui e si può riportare nell\'app dalla scheda «Esporta per l\'app».'));
  var recs = tuttiRecord().filter(function (r) { return S.ap.problemi[r.uid]; });
  d.appendChild(h('input', { type: 'search', placeholder: 'Cerca: etichetta, contrassegno, cifre', value: S.cerca, 'aria-label': 'Cerca', oninput: function (ev) { S.cerca = ev.target.value; disegna(); var i = corpo.querySelector('input[type=search]'); if (i) { i.focus(); i.setSelectionRange(S.cerca.length, S.cerca.length); } } }));
  var q = S.cerca.trim().toLowerCase();
  var filtrate = recs.filter(function (r) {
    if (!q) return true;
    if (typeof Dominio !== 'undefined' && Dominio.corrispondeRicerca && Dominio.corrispondeRicerca(r.etichetta, q)) return true;
    return [r.etichetta, r.contrassegno, r.operatore, r.note].join(' ').toLowerCase().indexOf(q) >= 0;
  });
  if (!recs.length) d.appendChild(h('p', null, 'Nessuna provetta problematica.'));
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
var riordinoUI = { destinazioni: {}, selezionate: {}, esiti: {}, conferma: null };
function righeRiordino() {
  var out = [];
  Dominio.riordino(S.P, S.stato.azioni()).forEach(function (serie) {
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
    var lista = S.stato.azioni().slice();
    azioni.forEach(function (a) {
      try {
        var ap = Az.applica(S.P, lista.concat([a])), no = ap.rifiutate.filter(function (x) { return x.id === a.id; })[0];
        riordinoUI.esiti[a.uid] = no ? 'Scartata: ' + no.motivo : 'Applicata';
        if (!no) { lista.push(a); delete riordinoUI.selezionate[a.uid]; }
      } catch (e) { riordinoUI.esiti[a.uid] = 'Scartata: ' + e.message; }
    });
    S.stato.sostituisci(lista); ricalcola(); return;
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
    if (!window.confirm('Lo spostamento modifica un plateau completo. Confermi?')) return;
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
  var batch = righe.filter(function (r) { return riordinoUI.selezionate[r.g.uid] && !modificataRiordino(r.g) && !r.g.fatta; });
  d.appendChild(h('button', {type: 'button', disabled: occupatoPc || !batch.length, onclick: function () {
    inviaRiordino(batch.map(function (r) { return azioneRiordino(r, true); }));
  }}, pc ? 'Invia le selezionate' : 'Applica le selezionate'));
  d.appendChild(h('p', {role: 'status', 'data-riordino-contatore': true}, righe.filter(function (r) { return r.g.fatta; }).length + ' di ' + righe.length + ' fatte.'));
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
      h('td', null, g.da, h('small', null, ' · plateau ' + g.plateau_da + ', posto ' + g.pos_da)),
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
    var serie = Dominio.riordino(S.P, S.stato.azioni()).filter(function (s) { return s.codice + ':' + s.specie === c.serie; })[0];
    if (!serie) return null;
    var g = serie.guida.filter(function (g) { return g.uid === c.uid; })[0];
    return g ? g.a_n : null;
  } catch (e) { return null; }
}
function spostaPlateau(c, numero, altro, completo) {
  try {
    var serie = Dominio.riordino(S.P, S.stato.azioni()).filter(function (s) { return s.codice + ':' + s.specie === c.serie; })[0];
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
  return Dominio.cercaCapiGestione(S.P, S.stato.azioni(), c.serie.split(':')[1], query);
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
    righeAnom.push(['  di cui problematiche', str(s.problematiche)]);
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
      h('tr', null, ['Persona / Operatore', 'Stato', 'Provette', 'Problematiche', 'Ritmo medio (all\'ora)', 'Ritmo 20 min', 'Ultimo prelievo', 'Tempo lavoro'].map(function (t) { return h('th', null, t); }))
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
        'Plateau completi: ' + stAv.plateauCompleti + ' · Da completare: ' + stAv.plateauDaCompletare + ' · Problematici da svuotare: ' + stAv.plateauDaSvuotare + ' · ' +
        'Problematici sistemati: ' + stAv.problematiciSistemati + ' / ' + stAv.totaleProblematiciIniziali + ' (residui: ' + stAv.problematiciResidui + ')'
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
    d.appendChild(h('h3', null, 'Riepilogo problematici e modifiche tardive'));
    d.appendChild(h('p', null,
      'Totale problematici gestiti: ' + riep.totaleProblematici + ' · Registrazioni tardive: ' + riep.totaleRegistrazioniTardive + ' · Modifiche tardive: ' + riep.totaleModificheTardive
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
      try { datiFinali = Dominio.numerazioneFinaleStampe(S.P, S.stato.azioni(), sistMappa); }
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
  d.appendChild(h('p', null, 'Il file con le azioni fatte qui, da importare nell\'app (Regia, a campionamento chiuso: Gestione campioni › Importa modifiche dal sito). L\'app mostra un\'anteprima, scarta ciò che non è più coerente e scrive solo eventi nuovi. Il sito non scrive mai nel registro.'));
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

/* ---- avvio: carica il testo dello snippet (arvet_fill.min.js) dal sito e disegna ---- */
var base = document.currentScript ? document.currentScript.src.replace(/[^/]*$/, '') : 'js/';
var promessaMotore = (typeof fetch === 'function' ? fetch(base + 'vendor/arvet_fill.min.js').then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.text(); }) : Promise.reject(new Error('fetch assente')))
  .then(function (t) { S.motoreArvet = t; }, function () { S.erroreMotore = true; S.motoreArvet = ''; });
/* Gli snippet si calcolano solo quando lo script di ARVET è caricato: se non lo è, si dice. */
function attendiMotore() { promessaMotore.then(function () { if (S.erroreMotore) { S.messaggio = 'Non riesco a caricare lo script di ARVET: gli snippet non si possono preparare, ricarica la pagina.'; } ricalcola(); }); }
disegna();
if (pc) pc.stato().then(function () { collegatoPc = true; caricaDalTablet(); }, function () { /* primo accesso: chiede il codice */ });
})();
