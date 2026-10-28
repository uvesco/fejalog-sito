/* ============================================================================
   Fejalog — fine lavori (§8): dall'export di uno stabilimento a tutti i file, fino agli snippet ARVET.

   Usa il motore «dopo il campo» di svet-tools (motore.js + xlsx.js, vendorizzati in ../motore/ e MAI modificati
   qui) esattamente come la sua pagina per tablet: pipeline → numerazione finale → guida → xlsx per i 3 invii,
   Excel definitivi, report allevatore, schede dei problematici. In più la pagina degli snippet ARVET con «Copia».
   Gira nella WebView dell'app (AccMotore, AccXlsx globali) e in Node per i test (require).

   Ingresso (oggetto):
     stabilimento {codice, lettera, denominazione}, export (formato 4, un solo stabilimento: porta anche gli
     spostamenti fatti a mano della pagina Riordino), regs {pecore, capre} (righe dei registri del pacchetto),
     marche {pecore, capre} (contrassegni), decodifica, ordine (fattispecie, null = predefinito), compatta (chiudi tutti
     i buchi), stamp, data (gg/mm/aaaa), motoreArvet (testo di arvet_fill.min.js), soloDati (niente file: per la pagina
     Riordino e per le cose da fare in campo), ricercati [{contrassegno, specie, provetta, cosa}] (i ricercati trovati,
     per le cose da fare), generatoIl (ora ISO del file delle anomalie),
     partenze {uid: {specie, etichetta, vista: "serie" | "problematici", plateau, pozzetto}}:
     posti fisici dal dominio Kotlin (StatoPosati/SchemaPlateau), anche per le escluse. Se presenti devono coprire
     tutte le provette della numerazione. Senza questo ingresso resta la guida del motore per i chiamanti pregressi.
   Uscita: {file: [{nome, mime, base64 | testo}], riepilogo, dati (numerazione, invii, guida per specie, esiti degli
   spostamenti fatti a mano)}.
   Niente ?. e ?? : deve girare anche su WebView vecchie.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../motore/motore.js'), require('../motore/xlsx.js'));
  } else {
    root.FineLavori = factory(root.AccMotore, root.AccXlsx);
  }
})(typeof self !== 'undefined' ? self : this, function (M, X) {
'use strict';

var SPECIE = ['pecore', 'capre'];
var MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
var COL_PC = ['provetta', 'contrassegno'];
var COL_MARCHE = ['contrassegno', 'specie', 'orecchino_dx_elettronico', 'orecchino_sx_accessorio', 'bolo'];
var COL_SENZA_TRANSPONDER = ['contrassegno', 'specie', 'provette', 'orecchino_dx_elettronico', 'bolo', 'note'];
var COL_GUIDA = ['fatta', 'uid', 'contrassegno', 'da', 'vista_da', 'plateau_da', 'pos_da', 'a_n', 'plateau_a', 'pos_a', 'ruolo', 'motivo', 'fattispecie'];
var COL_COPERTURA = ['voce', 'n', 'pct'];

function str(x) { return x == null ? '' : String(x); }
function esc(x) { return str(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function foglio(nome, colonne, righe, testo) { return { nome: nome, colonne: colonne, righe: righe, testo: testo || [] }; }

/* La numerazione del motore conserva l'UID: non si ricostruisce l'identità dal numero di campo, che è numerico
   anche per PA1, né dal solo contrassegno, che può avere più provette. Si produce un solo passo per UID. */
function partenza(inp, r) {
  var p = Object.prototype.hasOwnProperty.call(inp.partenze, r.uid) ? inp.partenze[r.uid] : null;
  if (!p || p.specie !== r.specie || (p.vista !== 'serie' && p.vista !== 'problematici') ||
      p.plateau < 1 || p.plateau !== Math.floor(p.plateau) || p.pozzetto < 1 || p.pozzetto > M.PLATEAU_SIZE ||
      p.pozzetto !== Math.floor(p.pozzetto) || !p.etichetta) throw new Error('Partenza fisica mancante o non valida per una provetta di ' + r.specie);
  return p;
}
function guidaFisica(inp, numerazione, guidaMotore) {
  var visti = Object.create(null);
  return numerazione.map(function (r) {
    var p = partenza(inp, r);
    if (visti[r.uid]) throw new Error('UID ripetuto nella numerazione della guida');
    visti[r.uid] = true;
    if (p.vista === 'serie' && (p.plateau - 1) * M.PLATEAU_SIZE + p.pozzetto === r.provetta) return null;
    var g = guidaMotore.filter(function (g) { return g.a_n === r.provetta; })[0];
    // da_n/corsia_da restano l'origine letta dal motore: i resolver Kotlin pregressi le usano per l'abbinamento.
    // La vista e i pozzetti fisici sono distinti e vengono soltanto dall'ingresso per UID.
    return Object.assign({}, g || { da_n: r.provetta_campo, coda_da: '', corsia_da: '',
      a_n: r.provetta, plateau_a: Math.floor((r.provetta - 1) / M.PLATEAU_SIZE) + 1,
      pos_a: (r.provetta - 1) % M.PLATEAU_SIZE + 1, contrassegno: r.contrassegno, ruolo: r.gruppo,
      motivo: p.vista === 'problematici' ? 'problematici' : 'riordino', fattispecie: r.fattispecie }, {
        uid: r.uid, da: p.etichetta, campo: p.etichetta, fisica: true, vista_da: p.vista,
        plateau_da: p.plateau, pos_da: p.pozzetto, motivo: p.tipologia || (p.vista === 'problematici' ? r.fattispecie : 'Ordinaria'), fattispecie: p.tipologia || r.fattispecie
      });
  }).filter(function (g) { return g != null; });
}
function daTesto(r, lettera) {
  return (r.fisica || r.da) ? r.da : r.da_n == null ? '' : (r.coda_da === 'prob' ? r.corsia_da : (lettera || '')) + r.da_n;
}

/* base64 di un Uint8Array, senza Buffer né btoa sui byte grezzi (vale in WebView e in Node) */
var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function base64(u8) {
  var out = [], i, n;
  for (i = 0; i + 2 < u8.length; i += 3) {
    n = (u8[i] << 16) | (u8[i + 1] << 8) | u8[i + 2];
    out.push(B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63]);
  }
  if (i < u8.length) {
    n = u8[i] << 16; if (i + 1 < u8.length) n |= u8[i + 1] << 8;
    out.push(B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < u8.length ? B64[(n >> 6) & 63] : '=') + '=');
  }
  return out.join('');
}

/* Controlli dello snippet come «Registra campioni in ARVET» (svet-tools, arvet_campioni_controlla):
   bloccanti i numeri non interi o < 1, i numeri ripetuti e lo stesso contrassegno su due provette, anche fra i capi
   dell'elenco e i [nuovi] (non nell'elenco di ARVET). */
function controllaInvio(righe, nuovi) {
  var errori = [], visti = {}, contr = {};
  righe.concat(nuovi || []).forEach(function (r) {
    var n = r.provetta;
    if (typeof n !== 'number' || n !== Math.floor(n) || n < 1) errori.push('numero di provetta non valido: ' + str(n));
    else if (visti[n]) errori.push('numero ripetuto: ' + n); else visti[n] = true;
    if (contr[r.contrassegno]) errori.push('contrassegno su due provette: ' + r.contrassegno); else contr[r.contrassegno] = true;
  });
  return errori;
}

/* Lo snippet per la console di ARVET: dati serializzati in JSON (niente filtri sulla forma del contrassegno, che è
   opaco), poi il motore arvet_fill di svet-tools, che compila i numeri e NON salva. Dalla 2.0 (2026-10-14) anche i
   [nuovi], i capi che non sono nell'elenco di ARVET (motore: arvetNuoviFinale): il motore li aggiunge con «Inserisci
   capo» della pagina, con sesso, razza e nascita se ARVET non li conosce. Gemello: arvet_campioni_snippet (R). */
function snippet(righe, motoreArvet, nuovi) {
  var testa = 'window.__ARVET_DATI__=' + JSON.stringify(righe.map(function (r) { return [r.provetta, r.contrassegno]; })) + ';';
  if (nuovi && nuovi.length) testa += 'window.__ARVET_NUOVI__=' + JSON.stringify(nuovi.map(function (r) {
    return [r.provetta, r.contrassegno, str(r.sesso), str(r.razza), str(r.data_nascita)];
  })) + ';';
  return '(function(){' + testa + '\n' + motoreArvet + '\n})();';
}

function paginaSnippet(inp, invii, aMano) {
  var s = inp.stabilimento;
  var lettera = s.lettera ? ' (provette ' + esc(s.lettera) + '…: in ARVET va solo il numero)' : '';
  var blocchi = invii.map(function (v, i) {
    var nn = v.nuovi.length;
    var testa = '<h2>' + esc(v.titolo) + ' — ' + (v.righe.length + nn) + ' provette</h2><p class="nota">' + esc(v.cosa) +
      (nn ? ' Di queste <b>' + nn + '</b> non sono nell\'elenco di ARVET: lo snippet le aggiunge con «Inserisci capo» (elenco qui sotto).' : '') + '</p>';
    if (!v.righe.length && !nn) return '<section>' + testa + '<p>Nessuna provetta per questo invio.</p></section>';
    if (v.errori.length) return '<section class="no">' + testa + '<p><b>Snippet non generato</b>: ' +
      v.errori.map(esc).join(' · ') + '. Correggere prima in Fejalog.</p></section>';
    return '<section>' + testa + '<button type="button" onclick="copia(\'s' + i + '\', this)">Copia lo snippet</button>' +
      ' <span class="nota">' + Math.round(v.snippet.length / 1024) + ' kB</span>' +
      '<textarea id="s' + i + '" readonly>' + esc(v.snippet) + '</textarea></section>';
  }).join('\n');
  function tabella(righe) {
    return '<table><thead><tr><th>Specie</th><th>N° finale</th><th>Contrassegno</th><th>Fattispecie</th><th>Anagrafica</th></tr></thead><tbody>' +
      righe.map(function (r) {
        return '<tr><td>' + esc(r.specie) + '</td><td>' + esc(r.provetta) + '</td><td>' + esc(r.contrassegno) + '</td><td>' + esc(r.fattispecie) +
          '</td><td>' + esc(r.anagrafica) + '</td></tr>';
      }).join('') + '</tbody></table>';
  }
  var colSnippet = aMano.filter(function (r) { return r.snippet; }), soloMano = aMano.filter(function (r) { return !r.snippet; });
  var mano = (colSnippet.length ? '<section><h2>Non nell\'elenco di ARVET: le aggiunge lo snippet — ' + colSnippet.length + ' provette</h2>' +
    '<p class="nota">Problematici: lo snippet fa per ognuno «Inserisci capo» → Cerca → Conferma, col numero finale (i montoni anche ' +
    'nell\'invio dei maschi). Se ARVET conosce il capo valgono i suoi sesso, razza e nascita; se no quelli stimati in campo, qui sotto. ' +
    'Prima fare quanto dicono le schede. Quelli che lo snippet non riesce ad aggiungere li elenca col motivo: si fanno a mano.</p>' +
    tabella(colSnippet) + '</section>' : '') +
    (soloMano.length ? '<section><h2>Da inserire a mano in ARVET — ' + soloMano.length + ' provette</h2>' +
    '<p class="nota">Doppi di contrassegno: il capo è già nell\'elenco di ARVET con l\'altra provetta. Decidere a mano, dopo aver ' +
    'visto le schede e completato le verifiche DDA eventualmente richieste.</p>' + tabella(soloMano) + '</section>' : '');
  return '<!DOCTYPE html>\n<html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Snippet ARVET ' + esc(s.codice) + '</title><style>' +
    'body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;margin:0 auto;max-width:960px;padding:16px;color:#1a1a1a}' +
    'h1{font-size:22px;margin:0 0 4px}h2{font-size:18px;margin:0 0 6px}.nota{color:#555;font-size:14px}' +
    'section{border:1px solid #bbb;border-radius:8px;padding:12px 14px;margin:14px 0}section.no{border-color:#c62828;background:#fdecea}' +
    'button{font-size:16px;padding:8px 16px;border-radius:6px;border:0;background:#1b8a3a;color:#fff;cursor:pointer}' +
    'textarea{display:block;width:100%;height:70px;margin-top:8px;font-family:monospace;font-size:11px}' +
    'ol{padding-left:22px}li{margin:4px 0}table{border-collapse:collapse;width:100%;font-size:14px}' +
    'th,td{border-bottom:1px solid #ddd;padding:4px 6px;text-align:left}th{background:#f4f5f7}' +
    '.footer{margin-top:16px;font-size:12px;color:#666;border-top:1px solid #ddd;padding-top:6px}</style></head><body>' +
    '<h1>Snippet ARVET — ' + esc(s.codice) + lettera + '</h1><div class="nota">' + esc(s.denominazione) + ' · ' + esc(inp.data) + '</div>' +
    '<section><h2>Come si usa (da un PC, in Chrome o Edge)</h2><ol>' +
    '<li>In ARVET inserire il <b>campionamento</b> e la <b>profilassi</b> dell\'invio (brucellosi ovicaprina, oppure «DIAGNOSI BRUCELLA OVIS ARIETI» per i maschi).</li>' +
    '<li>Aprire la pagina di <b>inserimento dei numeri di provetta</b>.</li>' +
    '<li>Qui sotto toccare <b>«Copia lo snippet»</b> dell\'invio giusto.</li>' +
    '<li>In ARVET premere <b>F12</b>, scheda <b>Console</b>, incollare e premere <b>Invio</b> (la prima volta Chrome chiede di scrivere «consenti incollare»).</li>' +
    '<li>Lo snippet scrive i numeri accanto ai contrassegni e dice quanti ne ha scritti e quali contrassegni non ha trovato: <b>non salva</b>.</li>' +
    '<li>Se l\'invio ha provette <b>non nell\'elenco</b>, lo snippet le aggiunge con «Inserisci capo» (queste <b>sono scritte</b> in ARVET) e il ' +
    'resoconto offre <b>«Ricarica la pagina coi capi aggiunti»</b>: premerlo, poi incollare di nuovo lo stesso snippet, che controlla i numeri.</li>' +
    '<li>Controllare e salvare (il campionamento non si conferma da solo).</li>' +
    '</ol><p class="nota">I maschi (<i>Brucella ovis</i>) hanno gli stessi numeri dell\'invio delle pecore: è una seconda accettazione sulle stesse provette.</p></section>' +
    blocchi + mano +
    '<div class="footer">Documento di lavoro interno del Servizio Veterinario: contiene dati dell\'allevamento. Generato da Fejalog con il motore di svet-tools.</div>' +
    '<script>function copia(id,b){var t=document.getElementById(id);t.focus();t.select();var ok=false;' +
    'try{ok=document.execCommand("copy");}catch(e){}' +
    'if(!ok&&navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t.value);ok=true;}' +
    'b.textContent=ok?"Copiato ✓":"Seleziona e copia a mano (Ctrl+C)";setTimeout(function(){b.textContent="Copia lo snippet";},2500);}</script>' +
    '</body></html>';
}

/* La guida al riposizionamento in HTML, **a spunta**: ogni riga si spunta quando la provetta è riscritta e messa al
   suo posto; le spunte restano nel browser (localStorage, per stabilimento e data) e un contatore dice quante mancano.
   Si stampa anche (le caselle vuote si spuntano a penna). */
function paginaGuida(inp, guida, escluse) {
  var s = inp.stabilimento, L = s.lettera || '';
  var tot = 0, corpo = '';
  function chiaveRiga(sp, r, esclusa) {
    return esc(JSON.stringify([s.codice, sp, esclusa ? 'esclusa' : 'spostamento', r.uid || r.contrassegno,
      esclusa ? r.provetta_campo : r.a_n, r.vista_da || '', r.plateau_da, r.pos_da]));
  }
  function posto(r) {
    return ' <span class="nota">(' + (r.vista_da === 'problematici' ? 'problematici, ' : '') +
      'plateau ' + esc(r.plateau_da) + ', pos ' + esc(r.pos_da) + ')</span>';
  }
  // le provette eliminate (formato 4): si tolgono dai plateau e si mettono da parte, senza numero finale
  if (escluse && escluse.length) corpo += '<h2>Da mettere da parte — ' + escluse.length + ' provette eliminate</h2><table><thead><tr>' +
    '<th>✓</th><th>Specie</th><th>Provetta (campo)</th><th>Contrassegno</th><th>Perché</th></tr></thead><tbody>' +
    escluse.map(function (r) {
      return '<tr data-k="' + chiaveRiga(r.specie, r, true) + '"><td class="spunta"><input type="checkbox" aria-label="messa da parte"></td><td>' + esc(r.specie) +
        '</td><td><b>' + esc(r.provetta_campo) + '</b>' + (r.plateau_da != null ? posto(r) : '') + '</td><td>' + esc(r.contrassegno) +
        '</td><td class="nota">' + esc(r.fattispecie) + '</td></tr>';
    }).join('') + '</tbody></table>';
  SPECIE.forEach(function (sp) {
    var g = guida[sp]; if (!g.length) return; tot += g.length;
    corpo += '<h2>' + esc(sp) + ' — ' + g.length + ' provette da spostare</h2><table><thead><tr><th>✓</th><th>Contrassegno</th>' +
      '<th>Da (campo)</th><th></th><th>A (finale)</th><th>Perché</th></tr></thead><tbody>' +
      g.map(function (r) {
        var da = (r.fisica || r.da) ? '<b>' + esc(r.da) + '</b>' + posto(r) : r.da_n == null ? '— (provetta nuova)' : (r.coda_da === 'prob'
          ? esc(r.corsia_da) + r.da_n + ' <span class="nota">(plateau problematici ' + esc(r.corsia_da) + ', pos ' + r.pos_da + ')</span>'
          : esc(L) + r.da_n + ' <span class="nota">(plateau ' + r.plateau_da + ', pos ' + r.pos_da + ')</span>');
        var k = chiaveRiga(sp, r, false);
        return '<tr data-k="' + k + '"><td class="spunta"><input type="checkbox" aria-label="spostata"></td><td>' + esc(r.contrassegno) +
          '<div class="nota">' + esc(r.ruolo + (r.fattispecie ? ' · ' + r.fattispecie : '')) +
          '</div></td><td>' + da + '</td><td>→</td><td><b>' + esc(L) + r.a_n + '</b> <span class="nota">(plateau ' + r.plateau_a + ', pos ' + r.pos_a +
          ')</span></td><td class="nota">' + esc(r.motivo) + '</td></tr>';
      }).join('') + '</tbody></table>';
  });
  if (!tot) corpo += '<p>Nessuna provetta da spostare.</p>';
  var chiave = 'fejalog-guida:' + s.codice + ':' + str(inp.stamp).slice(0, 10);
  return '<!DOCTYPE html>\n<html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Guida al riposizionamento ' + esc(s.codice) + '</title><style>' +
    'body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;margin:0;padding:14px;color:#1a1a1a}' +
    'h1{font-size:20px;margin:0 0 4px}h2{font-size:17px;margin:16px 0 4px}.nota{color:#555;font-size:12px}' +
    'table{border-collapse:collapse;width:100%;font-size:14px}th,td{border-bottom:1px solid #ccc;padding:4px 6px;text-align:left;vertical-align:top}' +
    'th{background:#f4f5f7}.spunta{width:34px}.spunta input{width:26px;height:26px}tr.fatta td{color:#888;text-decoration:line-through}' +
    'tr.fatta td.spunta{text-decoration:none}#barra{position:sticky;top:0;background:#e8eaf6;padding:8px;margin:8px 0;font-weight:700;color:#283593}' +
    '.nascosta tr.fatta{display:none}@media print{tr{page-break-inside:avoid}#barra{position:static}}</style></head><body>' +
    '<h1>Guida al riposizionamento — ' + esc(s.codice) + (L ? ' (lettera ' + esc(L) + ')' : '') + '</h1>' +
    '<div class="nota">' + esc(s.denominazione) + ' · ' + esc(inp.data) + ' · ' + tot + ' provette da spostare. Ogni provetta va ' +
    '<b>direttamente al numero finale, una volta sola</b>: non cancellare e non coprire il numero di campo, barralo con una riga sola ' +
    'che resti leggibile e scrivi accanto il numero finale (il numero di campo è registrato a parte: da lì si risale sempre al capo). ' +
    'Metti da parte le provette eliminate elencate nella sezione dedicata. Le altre provette non elencate restano ferme. Plateau da ' +
    M.PLATEAU_SIZE + '. Spunta ogni riga quando la provetta è al suo posto: le spunte restano in questo browser.</div>' +
    (tot || (escluse && escluse.length) ? '<div id="barra"><span id="conta"></span> · <label><input type="checkbox" id="nascondi"> nascondi le fatte</label></div>' : '') +
    '<div id="corpo">' + corpo + '</div>' +
    '<script>(function(){var K=' + JSON.stringify(chiave) + ',S={};try{S=JSON.parse(localStorage.getItem(K)||"{}")||{};}catch(e){S={};}' +
    'var righe=[].slice.call(document.querySelectorAll("tr[data-k]"));' +
    'function conta(){var f=righe.filter(function(r){return r.classList.contains("fatta");}).length;var c=document.getElementById("conta");' +
    'if(c)c.textContent=f+" di "+righe.length+" completate"+(f===righe.length?" ✓ finito":"");}' +
    'righe.forEach(function(r){var b=r.querySelector("input");b.checked=!!S[r.getAttribute("data-k")];r.classList.toggle("fatta",b.checked);' +
    'b.addEventListener("change",function(){var k=r.getAttribute("data-k");if(b.checked)S[k]=1;else delete S[k];r.classList.toggle("fatta",b.checked);' +
    'try{localStorage.setItem(K,JSON.stringify(S));}catch(e){}conta();});});' +
    'var n=document.getElementById("nascondi");if(n)n.addEventListener("change",function(){document.getElementById("corpo").classList.toggle("nascosta",n.checked);});' +
    'conta();})();</script></body></html>';
}

/* «Cose da fare per l'allevatore» (utente, 2026-10-07): il report per l'allevatore in testo semplice, da condividere
   già in campo (WhatsApp, email). La STESSA funzione sta nella pagina da campo di svet-tools
   (assets/accettazione/app.js, testoAllevatore): se cambia qui, si cambia anche là. Ingresso: intestazione e le righe
   dei report del motore (marche, sesso, smarriti, non provati), i senza transponder per specie e i ricercati trovati;
   dal 2026-10-13 anche gli acquisti con DDA da registrare in BDN e le marche da cambiare (provette ricollocate, se
   la Regia ha scelto di dirlo). */
function testoAllevatore(t) {
  var R = ['COSE DA FARE PER L\'OPERATORE (ALLEVATORE)', [t.denominazione, t.codice, t.data].filter(function (x) { return !!x; }).join(' · ')];
  var SP = { pecore: 'pecora', capre: 'capra' };
  var vuoto = true;
  function capo(r) { return r.contrassegno + ' (' + (SP[r.specie] || r.specie) + ')'; }
  function sez(titolo, righe, riga) {
    if (!righe || !righe.length) return;
    vuoto = false;
    R.push('', titolo + ': ' + righe.length);
    righe.slice(0, 200).forEach(function (r) { R.push('- ' + riga(r)); });
    if (righe.length > 200) R.push('- … e altri ' + (righe.length - 200));
  }
  sez('Acquisti con DDA: verifica e ingresso', t.ddaIndividuali, function (r) {
    return capo(r) + ', provetta ' + r.etichetta + ': ' + r.attivita + (r.dda_nota ? ' Nota: ' + r.dda_nota : '');
  });
  sez('Capi ricercati trovati' , t.ricercati, function (r) {
    return capo(r) + (r.provetta ? ', provetta ' + r.provetta : '') + (r.cosa ? ': ' + r.cosa : '');
  });
  sez('Orecchini e boli da sostituire', t.marche, function (r) {
    return capo(r) + ': ' + [r.orecchino_dx_elettronico ? 'DX elettronico' : '', r.orecchino_sx_accessorio ? 'SX accessorio' : '',
      r.bolo ? 'bolo' : ''].filter(function (x) { return !!x; }).join(', ');
  });
  (t.senzaTransponder || []).forEach(function (x) {
    if (x.n > 0) { vuoto = false; R.push((x.specie === 'capre' ? 'Capre ' : 'Pecore ') + M.testoSenzaTransponder(x.n, x.capi)); }
  });
  sez('Sesso da correggere in BDN', t.sesso, function (r) { return capo(r) + ': in BDN ' + (r.sesso_bdn || '?') + ', è ' + r.sesso_corretto; });
  sez('Smarriti ritrovati (da comunicare)', t.smarriti, function (r) {
    return capo(r) + (r.data_smarrimento ? ', smarrito il ' + r.data_smarrimento : '');
  });
  sez('Ingressi da registrare in BDN prima dell\'invio ARVET (acquisti con DDA)', t.acquistiDda, function (g) {
    return 'da ' + g.codice + (g.motivo ? ' (' + g.motivo + ')' : '') + ': ' + g.capi.length + (g.capi.length === 1 ? ' capo, ' : ' capi, ') +
      g.capi.map(function (r) { return r.contrassegno; }).join(', ');
  });
  sez('Marche da cambiare', t.marcheDaCambiare, function (r) {
    return 'al capo che porta ' + r.da + ' (' + (SP[r.specie] || r.specie) + ') vanno messe le marche di ' + r.a +
      (r.provetta ? ' (provetta ' + r.provetta + ')' : '');
  });
  sez('Presenti in BDN non provati', t.nonProvati, capo);
  if (vuoto) R.push('', 'Niente da fare.');
  return R.join('\n') + '\n';
}

/* Spostamenti fatti a mano (Fejalog, pagina Riordino; 2026-10-07): «la provetta C sta al numero N» e gli scambi «C dove
   sta adesso D», nell'ordine del registro. Viaggiano nell'export formato 3 (campo `spostamenti`) e li applica il motore
   di svet-tools dopo la numerazione finale (applicaSpostamenti), come «Dopo il campo»: numeri, guida, definitivo e
   snippet li seguono, e gli esiti dicono quali non valgono e perché. */

function calcola(inp) {
  var cod = inp.stabilimento.codice;
  var suff = '_' + cod.replace(/[^A-Za-z0-9_-]+/g, '_') + '_' + inp.stamp;
  var ordine = inp.ordine && inp.ordine.length ? inp.ordine : M.ORDINE_DEFAULT;
  var compatta = !!inp.compatta;
  var regs = { pecore: inp.regs && inp.regs.pecore && inp.regs.pecore.length ? inp.regs.pecore : null,
               capre: inp.regs && inp.regs.capre && inp.regs.capre.length ? inp.regs.capre : null };
  var marche = { pecore: (inp.marche && inp.marche.pecore) || [], capre: (inp.marche && inp.marche.capre) || [] };
  var decod = inp.decodifica || M.DECODIFICA_DEFAULT;

  var letto = M.leggiExport(JSON.stringify(inp.export), 'fejalog.json');
  var base = letto.records, spost = letto.spostamenti;
  // i registri caricati in corsa (formato 4): già nei registri del pacchetto effettivo; si riapplicano (non cambia niente)
  // per avere gli acquisti con DDA anche da un export letto da solo
  var caricati = letto.registri_caricati || [];
  var ar = M.applicaRegistriCaricati(regs, marche, caricati);
  regs = ar.regs; marche = ar.marche;
  var P = M.pipeline(base, { regs: regs, codiceLavoro: cod, decodifica: decod, correzioni: [], rimuovi: [], aggiungi: [] });
  var fin = P.fin, escluse = M.reportEscluse(P.escluse);
  var presenti = { pecore: M.presentiDiLavoro(regs.pecore, cod), capre: M.presentiDiLavoro(regs.capre, cod) };
  var nf = {}, arvet = {}, definitivo = {}, guida = {}, schede = [], esitiSp = [];
  SPECIE.forEach(function (sp) {
    nf[sp] = M.numerazioneFinale(fin, sp, ordine, compatta, spost);
    arvet[sp] = M.arvetDfFinale(fin, sp, ordine, compatta, spost);
    // i «presenti non provati» in coda al definitivo: solo dello stabilimento di lavoro (svet-tools prende tutto il
    // registro, compresi i pascoli condivisi: progetto.md, Appendice B, punto 3)
    definitivo[sp] = M.exportDefinitivo(fin, regs[sp] && regs[sp].filter(function (r) {
      return !r.codice_stabilimento || r.codice_stabilimento === cod;
    }), sp, ordine, compatta, spost);
    guida[sp] = fin.some(function (r) { return r.specie === sp; }) ? M.guidaRiposizionamento(fin, sp, ordine, compatta, spost) : [];
    if (inp.partenze != null) guida[sp] = guidaFisica(inp, nf[sp], guida[sp]);
    schede = schede.concat(M.schedeProblematici(fin, regs[sp], sp, ordine, compatta, decod));
    esitiSp = esitiSp.concat(M.esitiSpostamenti(fin, sp, ordine, compatta, spost));
  });
  if (inp.partenze != null) escluse = escluse.map(function (r, i) {
    var originale = P.escluse[i], p = partenza(inp, originale);
    return Object.assign({}, r, { uid: originale.uid, provetta_campo: p.etichetta,
      vista_da: p.vista, plateau_da: p.plateau, pos_da: p.pozzetto, motivo: p.tipologia || (p.vista === 'problematici' ? r.fattispecie : 'Ordinaria'), fattispecie: p.tipologia || r.fattispecie });
  });
  var bo = M.brucellaOvisArvet(fin, ordine, compatta, spost);
  var cs = M.reportCorrezioniSesso(fin), np = M.reportNonProvati(presenti.pecore, presenti.capre, fin);
  var sr = M.reportSmarritiRitrovati(fin), ms = M.reportMarcheDaSostituire(fin), st = M.reportSenzaTransponder(fin);
  var copertura = M.analisiCopertura(base, presenti.pecore, presenti.capre);   // come svet-tools: sul canon di base
  var ignoti = M.capiSenzaTraccia(fin, regs, marche, ordine, compatta);

  var file = [], soloDati = !!inp.soloDati;
  function xlsx(nome, fogli) { if (!soloDati) file.push({ nome: nome, mime: MIME_XLSX, base64: base64(X.xlsxBuild(fogli)) }); }
  function testo(nome, mime, t) { if (!soloDati) file.push({ nome: nome, mime: mime, testo: t }); }

  // i capi che non sono nell'elenco di ARVET: lo snippet li aggiunge con «Inserisci capo» (arvet_fill 2.0, 2026-10-14)
  var nuovi = { pecore: M.arvetNuoviFinale(fin, 'pecore', ordine, compatta, spost), capre: M.arvetNuoviFinale(fin, 'capre', ordine, compatta, spost),
    maschi: M.arvetNuoviFinale(fin, 'pecore', ordine, compatta, spost, true) };
  // Un DDA dichiarato non autorizza un inserimento automatico prima della verifica e della normalizzazione.
  var ddaDaRisolvere = new Set((inp.export.records || []).filter(function (r) {
    return r.dda_dichiarato && (r.dda_stato !== 'ingresso_registrato' || r.soluzione !== 'normalizzata');
  }).map(function (r) { return r.specie + '|' + r.contrassegno; }));
  nuovi.pecore = nuovi.pecore.filter(function (r) { return !ddaDaRisolvere.has('pecore|' + r.contrassegno); });
  nuovi.capre = nuovi.capre.filter(function (r) { return !ddaDaRisolvere.has('capre|' + r.contrassegno); });
  nuovi.maschi = nuovi.maschi.filter(function (r) { return !ddaDaRisolvere.has('pecore|' + r.contrassegno); });
  var invii = [
    { titolo: 'Invio 1 · pecore', cosa: 'Profilassi brucellosi ovicaprina, accettazione delle pecore (maschi compresi).', righe: arvet.pecore, nuovi: nuovi.pecore, file: 'arvet_pecore' },
    { titolo: 'Invio 2 · capre', cosa: 'Profilassi brucellosi ovicaprina, accettazione delle capre.', righe: arvet.capre, nuovi: nuovi.capre, file: 'arvet_capre' },
    { titolo: 'Invio 3 · maschi Brucella ovis', cosa: '«DIAGNOSI BRUCELLA OVIS ARIETI»: i montoni, con gli stessi numeri dell\'invio delle pecore.', righe: bo, nuovi: nuovi.maschi, file: 'arvet_maschi_brucella_ovis' }
  ];
  invii.forEach(function (v) {
    v.errori = controllaInvio(v.righe, v.nuovi);
    v.snippet = v.errori.length || (!v.righe.length && !v.nuovi.length) ? '' : snippet(v.righe, inp.motoreArvet || '', v.nuovi);
    if (v.righe.length) xlsx(v.file + suff + '.xlsx', [foglio('dati', COL_PC, v.righe, ['contrassegno'])]);
    // CSV provetta,contrassegno per uso fuori dal Piemonte (senza intestazione, UTF-8, CRLF)
    if (v.righe.length) {
      var csvRighe = v.righe.map(function (r) { return r.provetta + ',' + r.contrassegno; }).join('\r\n') + '\r\n';
      testo('provette_' + v.file + suff + '.csv', 'text/csv', csvRighe);
    }
    // lo snippet anche da solo, in .txt: si condivide dal telefono e non parte con un doppio clic (piano interfaccia §8)
    if (v.snippet) testo('snippet_' + v.file + suff + '.txt', 'text/plain', v.snippet);
  });
  // i dati del capo come li ha la provetta: dalla BDN, o stimati in campo per i capi che la BDN non conosce
  var datiCapo = {};
  fin.forEach(function (r) { var k = r.specie + '|' + r.contrassegno; if (!datiCapo[k]) datiCapo[k] = r; });
  var aMano = [];
  SPECIE.forEach(function (sp) {
    nf[sp].filter(function (r) { return !M.effInArvet(r); }).forEach(function (r) {
      var c = datiCapo[sp + '|' + r.contrassegno] || r;
      // utente, 2026-10-14: un capo che è in un registro (anche dello stabilimento d'origine, caricato dopo) ARVET lo
      // conosce già, con sesso, razza e nascita: si inserisce solo il contrassegno. Marca disponibile o capo non in nessun
      // registro: l'anagrafica stimata in campo va scritta
      var inBdn = c.categoria === 'verde' || c.categoria === 'giallo';
      var colSnippet = nuovi[sp].some(function (x) { return x.contrassegno === r.contrassegno && x.provetta === r.provetta; });
      aMano.push({ specie: sp, provetta: r.provetta, contrassegno: r.contrassegno, fattispecie: r.fattispecie, inBdn: inBdn, capo: c,
        snippet: colSnippet,
        anagrafica: inBdn ? 'in BDN: ARVET la ha già' : 'da scrivere (stimata in campo): ' +
          [M.sessoEff(c), str(c.razza), str(c.data_nascita)].filter(function (x) { return !!x; }).join(' · ') });
    });
  });
  testo('snippet_arvet' + suff + '.html', 'text/html', paginaSnippet(inp, invii, aMano));
  // le provette da inserire a mano in ARVET, coi dati del capo (le eliminate non ci sono: non hanno numero finale)
  if (aMano.length) {
    xlsx('da_inserire_a_mano_in_arvet' + suff + '.xlsx', [foglio('a_mano',
      ['specie', 'provetta', 'contrassegno', 'come', 'anagrafica', 'sesso', 'razza', 'data_nascita', 'fattispecie'], aMano.map(function (r) {
        var c = r.inBdn ? {} : r.capo;
        return { specie: r.specie, provetta: r.provetta, contrassegno: r.contrassegno,
          come: r.snippet ? 'snippet (Inserisci capo)' : 'a mano', anagrafica: r.inBdn ? r.anagrafica : 'da scrivere (stimata in campo)',
          sesso: M.sessoEff(c) || '', razza: c.razza || '', data_nascita: c.data_nascita || '', fattispecie: r.fattispecie };
      }), ['contrassegno'])]);
  }

  SPECIE.forEach(function (sp) {
    if (nf[sp].length) xlsx('accettazione_definitiva_' + sp + suff + '.xlsx',
      [foglio('dati', M.COLONNE_DEFINITIVO, definitivo[sp], ['contrassegno', 'nuovo_contrassegno'])]);
  });
  var fogliGuida = [];
  SPECIE.forEach(function (sp) {
    if (!guida[sp].length) return;
    fogliGuida.push(foglio('guida_' + sp, COL_GUIDA, guida[sp].map(function (r) {
      return { fatta: '☐', uid: r.uid || '', contrassegno: r.contrassegno, da: daTesto(r, inp.stabilimento.lettera),
        vista_da: r.vista_da || (r.coda_da === 'prob' ? 'problematici' : 'serie'),
        plateau_da: r.plateau_da, pos_da: r.pos_da, a_n: r.a_n, plateau_a: r.plateau_a, pos_a: r.pos_a,
        ruolo: r.ruolo, motivo: r.motivo, fattispecie: r.fattispecie };
    }), ['uid', 'contrassegno', 'da']));
  });
  if (escluse.length) fogliGuida.push(foglio('da_mettere_da_parte', ['fatta', 'uid', 'specie', 'provetta_campo', 'vista_da', 'plateau_da', 'pos_da', 'contrassegno', 'fattispecie'],
    escluse.map(function (r) { return Object.assign({ fatta: '☐' }, r); }), ['uid', 'provetta_campo', 'contrassegno']));
  if (fogliGuida.length) xlsx('guida_riposizionamento' + suff + '.xlsx', fogliGuida);
  testo('guida_riposizionamento' + suff + '.html', 'text/html', paginaGuida(inp, guida, escluse));
  if (schede.length) testo('schede_problematici' + suff + '.html', 'text/html', M.renderSchedeProblematici(schede,
    { codice_stabilimento: cod, denominazione: inp.stabilimento.denominazione }, new Date()));

  // dal formato 4 (motore di svet-tools): gli acquisti con DDA (ingressi da registrare in BDN) e le marche da cambiare
  // delle ricollocate, col numero finale
  var finale = function (sp, c) { var x = nf[sp].filter(function (r) { return r.contrassegno === c; })[0]; return x ? x.provetta : ''; };
  var ATTIVITA_DDA = {
    da_verificare: "Verificare il DDA; se valido registrare o forzare l'ingresso in BDN, altrimenti rifare il DDA.",
    valido: "Registrare o forzare l'ingresso in BDN a cura dell'operatore o del delegato.",
    da_rifare: "Rifare il DDA, verificarlo e registrare l'ingresso in BDN.",
    ingresso_registrato: "Ingresso registrato: attività completata."
  };
  var ddaIndividuali = (inp.export.records || []).filter(function (r) { return r.dda_dichiarato && r.soluzione !== 'esclusa'; }).map(function (r) {
    return Object.assign({}, r, { attivita: ATTIVITA_DDA[r.dda_stato] || ATTIVITA_DDA.da_verificare });
  });
  var individuali = new Set(ddaIndividuali.map(function (r) { return r.uid; }));
  var ddaRighe = M.reportAcquistiDda(fin.filter(function (r) { return !individuali.has(r.uid); }), caricati);
  var mc = M.reportMarcheDaCambiare(fin).map(function (r) { return { specie: r.specie, da: r.porta, a: r.mettere, provetta: finale(r.specie, r.mettere) }; });
  var dda = [];
  ddaRighe.forEach(function (r) {
    var g = dda.filter(function (x) { return x.codice === r.venditore; })[0];
    if (!g) { g = { codice: r.venditore, motivo: r.motivo, capi: [] }; dda.push(g); }
    g.capi.push(r);
  });
  var fa = [];
  if (ddaIndividuali.length) fa.push(foglio("verifica_dda", ["contrassegno", "specie", "etichetta", "dda_stato", "dda_nota", "attivita"], ddaIndividuali, ["contrassegno"]));
  if (ddaRighe.length) fa.push(foglio('acquisti_dda', ['venditore', 'motivo', 'contrassegno', 'specie'], ddaRighe, ['contrassegno']));
  if (mc.length) fa.push(foglio('marche_da_cambiare', ['specie', 'porta', 'mettere', 'provetta'], mc.map(function (r) {
    return { specie: r.specie, porta: r.da, mettere: r.a, provetta: r.provetta };
  }), ['porta', 'mettere']));
  if (escluse.length) fa.push(foglio('provette_eliminate', ['specie', 'provetta_campo', 'contrassegno', 'fattispecie'], escluse, ['contrassegno']));
  if (cs.length) fa.push(foglio('correzioni_sesso', ['contrassegno', 'specie', 'sesso_bdn', 'sesso_corretto'], cs, ['contrassegno']));
  if (np.length) fa.push(foglio('presenti_non_provati', ['contrassegno', 'specie', 'sesso', 'razza'], np, ['contrassegno']));
  if (sr.length) fa.push(foglio('smarriti_ritrovati', ['contrassegno', 'specie', 'data_smarrimento'], sr, ['contrassegno']));
  if (ms.length) fa.push(foglio('marche_da_sostituire', COL_MARCHE, ms, ['contrassegno']));
  if (st.length) fa.push(foglio('senza_transponder', COL_SENZA_TRANSPONDER, st, ['contrassegno']));
  if (!fa.length) fa.push(foglio('vuoto', ['nota'], [{ nota: 'nessuna segnalazione per l\'allevatore' }], []));
  xlsx('report_allevatore' + suff + '.xlsx', fa);

  var fr = [];
  SPECIE.forEach(function (sp) {
    if (definitivo[sp].length) fr.push(foglio(sp + '_definitivo', M.COLONNE_DEFINITIVO, definitivo[sp], ['contrassegno', 'nuovo_contrassegno']));
  });
  if (bo.length) fr.push(foglio('maschi_brucella_ovis', COL_PC, bo, ['contrassegno']));
  fa.forEach(function (f) { if (f.nome !== 'vuoto') fr.push(f); });
  var sd = M.schedeProblematiciDf(schede);
  if (sd.length) fr.push(foglio('problematici_storia', M.COLONNE_SCHEDE, sd, ['contrassegno']));
  SPECIE.forEach(function (sp) {
    var c = copertura[sp]; if (!c) return;
    fr.push(foglio('copertura_' + sp, COL_COPERTURA, c.righe.map(function (r) {
      return { voce: r.voce, n: r.n, pct: r.pct == null ? '' : r.pct };
    }), []));
  });
  if (ignoti.length) fr.push(foglio('capi_senza_traccia', ['specie', 'contrassegno', 'provetta_campo', 'provetta', 'fattispecie'], ignoti, ['contrassegno']));
  var gestione = inp.riepilogoGestione;
  if (gestione) {
    var righeGestione = [{voce: 'Problematici avuti nel progetto', numero: gestione.totaleProblematici},
      {voce: 'Registrazioni tardive', numero: gestione.totaleRegistrazioniTardive},
      {voce: 'Modifiche tardive', numero: gestione.totaleModificheTardive}];
    Object.keys(gestione.perFattispecie || {}).forEach(function (t) { righeGestione.push({voce: t, numero: gestione.perFattispecie[t]}); });
    Object.keys(gestione.perEsito || {}).forEach(function (t) { righeGestione.push({voce: t, numero: gestione.perEsito[t]}); });
    (gestione.modificheGestione || []).forEach(function (t) { righeGestione.push({voce: t.titolo, numero: t.totale}); });
    fr.push(foglio('gestione_progetto', ['voce', 'numero'], righeGestione, []));
    fr.push(foglio('problematici_esiti', ['etichetta', 'contrassegno', 'specie', 'stabilimento', 'fattispecie', 'esitoFinale', 'siglaVeterinario'], gestione.problematici || [], ['contrassegno']));
  }
  if (!fr.length) fr.push(foglio('vuoto', ['nota'], [{ nota: 'nessun dato' }], []));
  xlsx('riepilogo_accettazione' + suff + '.xlsx', fr);

  var stx = [];
  SPECIE.forEach(function (sp) {
    if (!base.some(function (r) { return r.specie === sp; })) return;
    var rp = M.riepilogoPost(base, sp);
    stx.push({ specie: sp, n: rp.senza_transponder, capi: rp.capi });
  });
  var allevatore = testoAllevatore({ denominazione: inp.stabilimento.denominazione, codice: cod, data: inp.data, marche: ms, sesso: cs,
    smarriti: sr, nonProvati: np, senzaTransponder: stx, ricercati: inp.ricercati || [], ddaIndividuali: ddaIndividuali, acquistiDda: dda, marcheDaCambiare: mc });
  testo('cose_da_fare' + suff + '.txt', 'text/plain', allevatore);
  // le anomalie per l'analisi fra stabilimenti e fra anni (contratti/anomalie.schema.json): lo stesso JSON di svet-tools
  var anomalie = M.anomalieStabilimento(fin, presenti.pecore, presenti.capre, { codice: cod,
    denominazione: inp.stabilimento.denominazione, origine: 'fejalog', completo: true, generato_il: inp.generatoIl || '' });
  testo('anomalie' + suff + '.json', 'application/json', JSON.stringify(anomalie, null, 1));

  var riep = { stabilimento: cod, file: file.length, specie: {}, maschi: bo.length, problematici: aMano.length,
    capi_senza_traccia: ignoti.length, invii: invii.map(function (v) { return { titolo: v.titolo, provette: v.righe.length + v.nuovi.length, nuovi: v.nuovi.length, errori: v.errori }; }) };
  SPECIE.forEach(function (sp) {
    if (!base.some(function (r) { return r.specie === sp; })) return;
    var r = M.riepilogoPost(base, sp);
    r.arvet = arvet[sp].length; r.da_spostare = guida[sp].length;
    r.testo_senza_transponder = M.testoSenzaTransponder(r.senza_transponder, r.capi);
    riep.specie[sp] = r;
  });
  if (gestione) riep.gestione_progetto = {problematici: gestione.totaleProblematici,
    registrazioni_tardive: gestione.totaleRegistrazioniTardive, modifiche_tardive: gestione.totaleModificheTardive};
  // i dati della sistemazione, per l'app (guida a spunta) e per i test di parità con «Dopo il campo» di svet-tools
  var dati = { specie: {}, maschi: bo.map(function (r) { return { provetta: r.provetta, contrassegno: r.contrassegno }; }),
    spostamenti: esitiSp, allevatore: allevatore, anomalie: anomalie, escluse: escluse };
  SPECIE.forEach(function (sp) {
    if (!nf[sp].length) return;
    dati.specie[sp] = {
      numerazione: nf[sp].map(function (r) {
        return { uid: r.uid, provetta: r.provetta, provetta_campo: r.provetta_campo, contrassegno: r.contrassegno, gruppo: r.gruppo,
          fattispecie: r.fattispecie };
      }),
      arvet: arvet[sp].map(function (r) { return { provetta: r.provetta, contrassegno: r.contrassegno }; }),
      guida: guida[sp].map(function (r) {
        var g = { da_n: r.da_n, coda_da: r.coda_da, corsia_da: r.corsia_da, plateau_da: r.plateau_da, pos_da: r.pos_da,
          a_n: r.a_n, plateau_a: r.plateau_a, pos_a: r.pos_a, contrassegno: r.contrassegno, ruolo: r.ruolo, motivo: r.motivo,
          fattispecie: r.fattispecie };
        if (r.fisica) Object.assign(g, { uid: r.uid, da: r.da, campo: r.campo, fisica: true, vista_da: r.vista_da });
        return g;
      })
    };
  });
  return { file: file, riepilogo: riep, dati: dati };
}

/* Per la WebView: ingresso e uscita come testo JSON. */
function calcolaJson(testo) { return JSON.stringify(calcola(JSON.parse(testo))); }

return { calcola: calcola, calcolaJson: calcolaJson, base64: base64, controllaInvio: controllaInvio, snippet: snippet,
  testoAllevatore: testoAllevatore };
});
