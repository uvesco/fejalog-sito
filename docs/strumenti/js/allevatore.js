/* L'esito del risanamento per l'allevatore (utente, 2026-11-17, dopo il campo del 16/11): per stabilimento una parte
   discorsiva, in parole semplici, e gli elenchi capo per capo. Parla degli animali, non delle provette (provette e
   numeri stanno solo nell'appendice per l'ufficio); non parla apertamente di cambiare orecchini; toni neutri: le non
   conformità le valuta il veterinario. Se c'è la pagina di ARVET salvata, dove campo e ARVET differiscono vale ARVET.
   Modulo puro (browser e Node): riceve i dati già calcolati dal dominio. Niente ?. e ?? */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FejAllevatore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';

var SP = { pecore: 'ovini', capre: 'caprini' }, UNO = { pecore: 'pecora', capre: 'capra' };
function maiusc(c) { return String(c == null ? '' : c).replace(/\s+/g, '').toUpperCase(); }
function sigla(v) { return String(v.etichetta || '').split(' ')[0]; }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/* La tabella dei capi di una pagina «Campionamento per profilassi» di ARVET salvata dal browser: contrassegno, razza,
   sesso, nascita e numero campione. [doc] è un Document (DOMParser nel browser). */
function leggiArvet(doc) {
  var tabelle = doc.querySelectorAll('table'), out = null, i, j;
  for (i = 0; i < tabelle.length && !out; i++) {
    var th = tabelle[i].querySelectorAll('th'), nomi = [];
    for (j = 0; j < th.length; j++) nomi.push(th[j].textContent.replace(/\s+/g, ' ').trim());
    var ic = nomi.indexOf('Contrassegno'), inum = nomi.indexOf('Numero campione');
    if (ic < 0 || inum < 0) continue;
    out = [];
    var tr = tabelle[i].querySelectorAll('tr');
    for (j = 0; j < tr.length; j++) {
      var td = tr[j].querySelectorAll('td'); if (td.length <= Math.max(ic, inum)) continue;
      var cella = function (nome) { var k = nomi.indexOf(nome); return k >= 0 && td[k] ? td[k].textContent.replace(/\s+/g, ' ').trim() : ''; };
      var n = parseInt(cella('Numero campione'), 10);
      if (maiusc(cella('Contrassegno'))) out.push({ contrassegno: maiusc(cella('Contrassegno')), razza: cella('Razza'), sesso: cella('Sesso'), nascita: cella('Data di nascita'), numero: isNaN(n) ? null : n });
    }
  }
  var testo = doc.body ? doc.body.textContent : '';
  return { righe: out || [], specie: /\bCAPRINI\b/.test(testo) && !/\bOVINI\b/.test(testo) ? 'capre' : /\bOVINI\b/.test(testo) ? 'pecore' : '' };
}

/* opz: { data, stabilimento: {codice, denominazione}, provette, eventi, voci, scheda(uid), assenti,
          arvet: {pecore: [righe]|null, capre: [righe]|null}, precisazioni: {solaProvetta: [sigle], note: {sigla: testo},
          altri: [righe della sezione 5], attribuzioneManuale: testo} } */
function crea(opz) {
  var stab = opz.stabilimento.codice, DATA = opz.data || '', pre = opz.precisazioni || {};
  var reg = {}; (opz.eventi || []).forEach(function (e) { if (e.tipo === 'PROVETTA_REGISTRATA' && e.dati) reg[e.dati.uid] = e.dati; });
  var provette = (opz.provette || []).filter(function (p) { return !p.annullata; });
  var mie = provette.filter(function (p) { return p.stabilimento === stab; });
  var mieVoci = (opz.voci || []).filter(function (v) { return v.stabilimento === stab; });
  var assenti = (opz.assenti || []).filter(function (a) { return a.stabilimento === stab; });
  var arvet = {};
  ['pecore', 'capre'].forEach(function (sp) {
    var r = opz.arvet && opz.arvet[sp]; if (!r || !r.length) return;
    arvet[sp] = {}; r.forEach(function (x) { arvet[sp][x.contrassegno] = x; });
  });
  function inArvet(sp, c) { return arvet[sp] ? arvet[sp][maiusc(c)] || null : null; }
  function dati(uid) { return reg[uid] || {}; }
  function scheda(uid) { try { return (opz.scheda && opz.scheda(uid)) || {}; } catch (e) { return {}; } }
  function capo(c, sp) {
    var k = maiusc(c), a = inArvet(sp, k), n = assenti.filter(function (x) { return maiusc(x.contrassegno) === k; })[0];
    if (a) return { contrassegno: k, sesso: a.sesso, razza: a.razza, nascita: a.nascita };
    if (n) return { contrassegno: k, sesso: n.sesso, razza: n.razza, nascita: n.dataNascita };
    var p = provette.filter(function (x) { return maiusc(x.contrassegno) === k; })[0], d = p ? dati(p.uid) : {};
    return { contrassegno: k, sesso: d.sesso || '', razza: d.razza || '', nascita: d.data_nascita || '' };
  }
  /* Come si riconosce l'animale prelevato: ciò che è stato scritto in campo. */
  function animale(v) {
    var d = dati(v.uid), rg = scheda(v.uid).registrato || {}, letto = maiusc(d.contrassegno);
    var descr = [rg.classe_eta ? 'età dai denti: ' + rg.classe_eta.toLowerCase() : '', d.razza ? 'razza ' + d.razza : '', d.sesso ? 'sesso ' + d.sesso : ''].filter(Boolean).join(', ');
    var prov = [rg.provvisoria ? 'identificazione provvisoria: ' + rg.provvisoria : '', 'sigla scritta sull’animale e sulla provetta: ' + sigla(v)].filter(Boolean).join('; ');
    switch (v.tipo) {
      case 'SENZA_CONTRASSEGNO': return 'Animale trovato senza marche (' + descr + '); ' + prov;
      case 'DOPPI': case 'DA_RIATTRIBUIRE': return 'Animale che porta la marca ' + letto + ', la stessa di un altro animale già prelevato; ' + prov;
      case 'MORTI_MACELLATI': case 'TRASFERITI':
        return 'Animale che porta la marca ' + letto + ', di un capo che in BDN risulta uscito' +
          (d.motivo_uscita_dec ? ' (' + String(d.motivo_uscita_dec).toLowerCase() + (d.data_uscita ? ', ' + d.data_uscita : '') + ')' : '') + '; ' + prov;
      case 'MARCHE': return 'Animale trovato senza marche registrate (' + descr + '); ' + prov;
      default: return 'Animale con la marca ' + letto + '; ' + prov;
    }
  }

  var sez = [], specie = ['pecore', 'capre'].filter(function (sp) { return mie.some(function (p) { return p.specie === sp; }) || assenti.some(function (a) { return a.specie === sp; }); });
  function nonConsiderato(a) { return !inArvet(a.specie, a.contrassegno); }

  // 1. riepilogo
  var riep = specie.map(function (sp) {
    var r = { Specie: SP[sp], 'Animali prelevati': mie.filter(function (p) { return p.specie === sp && p.soluzione !== 'esclusa'; }).length,
      'Capi del registro non prelevati': assenti.filter(function (a) { return a.specie === sp && nonConsiderato(a); }).length };
    if (opz.arvet) r['Inviati al laboratorio (ARVET)'] = arvet[sp] ? Object.keys(arvet[sp]).length : 'non confrontato';
    return r;
  });
  sez.push({ titolo: 'Riepilogo', nota: 'Risanamento del ' + DATA + '. I capi sono quelli del registro di stalla della BDN, in età diagnostica.', colonne: riep.length ? Object.keys(riep[0]) : ['Specie'], righe: riep });

  // 2. capi assenti considerati presenti
  var attribuiti = mieVoci.filter(function (v) { return v.capo && v.stato === 'decisa'; }).map(function (v) {
    var c = capo(v.capo, v.specie);
    return { 'Capo del registro': c.contrassegno, Specie: SP[v.specie], Sesso: c.sesso, Razza: c.razza, Nascita: c.nascita, 'Animale prelevato al suo posto': animale(v) };
  });
  // capi presenti in ARVET senza una provetta registrata in Fejalog: attribuzione fatta a mano in ARVET
  Object.keys(arvet).forEach(function (sp) { Object.keys(arvet[sp]).forEach(function (k) {
    if (mie.some(function (p) { return p.specie === sp && maiusc(p.contrassegno) === k; })) return;
    var a = arvet[sp][k];
    attribuiti.push({ 'Capo del registro': k, Specie: SP[sp], Sesso: a.sesso, Razza: a.razza, Nascita: a.nascita,
      'Animale prelevato al suo posto': pre.attribuzioneManuale || 'Attribuzione fatta in ufficio: animale da precisare (DA CONFERMARE)' });
  }); });
  sez.push({ titolo: 'Capi del registro non trovati con le loro marche, considerati presenti',
    nota: 'Per ognuno di questi capi è stato inviato al laboratorio il sangue di un animale presente e compatibile (specie, sesso, età, razza), trovato senza marche o con una marca che non poteva essere la sua. L’animale si riconosce dalla sigla scritta in campo.',
    colonne: ['Capo del registro', 'Specie', 'Sesso', 'Razza', 'Nascita', 'Animale prelevato al suo posto'], righe: attribuiti });

  // 3. marche da ordinare
  var ordine = {}, chiaviOrdine = [];
  function metti(c, sp, dx, sx, bolo, perche) {
    var k = maiusc(c); if (!k) return;
    if (!ordine[k]) { ordine[k] = { Capo: k, Specie: SP[sp], 'Destro (elettronico)': '', Sinistro: '', Bolo: '', Motivo: [] }; chiaviOrdine.push(k); }
    var o = ordine[k];
    if (dx) o['Destro (elettronico)'] = 'sì'; if (sx) o.Sinistro = 'sì'; if (bolo) o.Bolo = 'sì';
    if (o.Motivo.indexOf(perche) < 0) o.Motivo.push(perche);
  }
  attribuiti.forEach(function (a) { metti(a['Capo del registro'], a.Specie === 'caprini' ? 'capre' : 'pecore', true, true, false, 'capo considerato presente (vedi sopra)'); });
  mie.forEach(function (p) { if (p.orecchino_dx || p.orecchino_sx || p.bolo) metti(p.contrassegno, p.specie, p.orecchino_dx, p.orecchino_sx, p.bolo, 'segnalato in campo: manca o non si legge'); });
  var ordinati = chiaviOrdine.sort().map(function (k) { var o = ordine[k], r = {}; Object.keys(o).forEach(function (x) { r[x] = x === 'Motivo' ? o.Motivo.join('; ') : o[x]; }); return r; });
  sez.push({ titolo: 'Marche da ordinare', nota: 'Per ogni capo, quali identificativi ordinare (destro elettronico, sinistro, bolo).',
    colonne: ['Capo', 'Specie', 'Destro (elettronico)', 'Sinistro', 'Bolo', 'Motivo'], righe: ordinati });

  // 4. marche non registrate in BDN
  var nonReg = mieVoci.filter(function (v) { return v.tipo === 'MARCHE' || v.tipo === 'MARCATI_IN_CAMPO'; }).map(function (v) {
    var d = dati(v.uid), vb = scheda(v.uid).verifica_bdn;
    return { 'Marca trovata sull’animale': maiusc(d.contrassegno || v.contrassegno), Specie: SP[v.specie], 'Sesso rilevato': d.sesso || '', 'Razza rilevata': d.razza || '',
      'Nascita rilevata o stimata': d.data_nascita || '', 'In BDN': vb && vb.sintesi && !/Non ancora cercato/.test(vb.sintesi) ? vb.sintesi : 'marca mai registrata su un capo',
      Esito: v.capo ? 'animale considerato come il capo ' + v.capo : 'da registrare in BDN coi dati rilevati' };
  });
  sez.push({ titolo: 'Marche non registrate in BDN trovate su animali', nota: 'Animali che portano una marca assegnata allo stabilimento ma mai registrata su un capo. I dati sono quelli rilevati in campo dal veterinario.',
    colonne: ['Marca trovata sull’animale', 'Specie', 'Sesso rilevato', 'Razza rilevata', 'Nascita rilevata o stimata', 'In BDN', 'Esito'], righe: nonReg });

  // 5. animali che non risultano dello stabilimento
  var altri = mieVoci.filter(function (v) { return v.tipo === 'ALTRO_STABILIMENTO' || v.tipo === 'NON_IN_ELENCO' || v.tipo === 'DDA'; }).map(function (v) {
    var d = dati(v.uid);
    return { Marca: maiusc(d.contrassegno), Specie: SP[v.specie], Sesso: d.sesso || '', Razza: d.razza || '', Nascita: d.data_nascita || '', Situazione: v.titolo,
      'Stabilimento in BDN': d.codice_stabilimento && d.codice_stabilimento !== stab ? d.codice_stabilimento : '' };
  }).concat(pre.altri || []);
  sez.push({ titolo: 'Animali che non risultano dello stabilimento', nota: 'Marche che non sono nel registro di questo stabilimento.',
    colonne: ['Marca', 'Specie', 'Sesso', 'Razza', 'Nascita', 'Situazione', 'Stabilimento in BDN'], righe: altri });

  // 6. prelevati che in BDN risultano usciti
  var usciti = mieVoci.filter(function (v) { return ['MORTI_MACELLATI', 'TRASFERITI', 'SMARRITI', 'RUBATI'].indexOf(v.tipo) >= 0; }).map(function (v) {
    var d = dati(v.uid);
    return { 'Marca trovata sull’animale': maiusc(d.contrassegno), Specie: SP[v.specie], 'In BDN risulta': String(d.motivo_uscita_dec || '').toLowerCase(), Dal: d.data_uscita || '',
      Esito: v.capo ? 'animale considerato come il capo ' + v.capo + ' (vedi sopra)' : (v.tipo === 'SMARRITI' || v.tipo === 'RUBATI' ? 'animale ritrovato: prelevato con la sua marca' : 'prelevato con la sua marca') };
  });
  sez.push({ titolo: 'Animali presenti con la marca di un capo che in BDN risulta uscito', nota: 'La posizione in BDN di questi capi va regolarizzata.',
    colonne: ['Marca trovata sull’animale', 'Specie', 'In BDN risulta', 'Dal', 'Esito'], righe: usciti });

  // 7. marche trovate su due animali
  var doppie = [], sola = pre.solaProvetta || [];
  mieVoci.filter(function (v) { return (v.tipo === 'DOPPI' || v.tipo === 'DA_RIATTRIBUIRE' || v.tipo === 'SPECIE') && sola.indexOf(sigla(v)) < 0; }).forEach(function (v) {
    var d = dati(v.uid), k = maiusc(d.contrassegno);
    if (!k || doppie.some(function (x) { return x.Marca === k; })) return;
    var stesse = provette.filter(function (p) { return maiusc(dati(p.uid).contrassegno) === k; });
    if (stesse.length < 2) return;
    doppie.push({ Marca: k, 'Animali trovati con questa marca': stesse.length,
      Note: stesse.map(function (p) { return UNO[p.specie] + ' ' + (p.sesso || ''); }).join(' e ') + (stesse.some(function (p) { return p.specie !== stesse[0].specie; }) ? ' (specie diverse: in BDN ' + String(d.specie_bdn || '').toLowerCase() + ')' : ''),
      Esito: v.capo ? 'il secondo animale è stato considerato come il capo ' + v.capo : 'da valutare' });
  });
  sez.push({ titolo: 'Marche trovate su due animali', nota: 'La stessa marca è stata letta su due animali diversi. Il numero di ristampa stampato sull’auricolare (0 per l’originale) dice quale dei due è il capo registrato.',
    colonne: ['Marca', 'Animali trovati con questa marca', 'Note', 'Esito'], righe: doppie });

  // 8. sesso da correggere
  var sesso = mie.filter(function (p) { return p.sesso_corretto; }).map(function (p) { return { Capo: maiusc(p.contrassegno), Specie: SP[p.specie], 'Sesso in BDN': dati(p.uid).sesso || '', 'Sesso rilevato': p.sesso_corretto }; });
  sez.push({ titolo: 'Sesso da correggere in BDN', nota: '', colonne: ['Capo', 'Specie', 'Sesso in BDN', 'Sesso rilevato'], righe: sesso });

  // 9. non prelevati
  var nonProvati = assenti.filter(nonConsiderato).map(function (a) { return { Capo: maiusc(a.contrassegno), Specie: SP[a.specie], Sesso: a.sesso, Razza: a.razza, Nascita: a.dataNascita }; });
  sez.push({ titolo: 'Capi del registro non prelevati', nota: 'Presenti in BDN, in età diagnostica, non trovati il giorno del risanamento e non considerati presenti: la loro posizione in BDN va verificata.',
    colonne: ['Capo', 'Specie', 'Sesso', 'Razza', 'Nascita'], righe: nonProvati });

  // 10. sotto l'età diagnostica
  var fuori = mieVoci.filter(function (v) { return v.tipo === 'FUORI_ETA'; }).map(function (v) { var d = dati(v.uid); return { Capo: maiusc(d.contrassegno), Specie: SP[v.specie], Sesso: d.sesso || '', Nascita: d.data_nascita || '' }; });
  sez.push({ titolo: 'Animali prelevati sotto l’età diagnostica', nota: '', colonne: ['Capo', 'Specie', 'Sesso', 'Nascita'], righe: fuori });

  // appendice per l'ufficio
  var note = pre.note || {};
  var app = mieVoci.map(function (v) {
    var d = dati(v.uid), p = provette.filter(function (x) { return x.uid === v.uid; })[0], fin = p ? maiusc(p.contrassegno) : '', a = inArvet(v.specie, fin);
    var r = { Provetta: v.etichetta, Veterinario: v.operatore, Tipologia: v.titolo, 'Marca letta': maiusc(d.contrassegno), 'Esito in Fejalog': v.esito, 'Capo finale': fin };
    if (opz.arvet) r['Numero in ARVET'] = a ? a.numero : (arvet[v.specie] ? 'non in ARVET' : 'non confrontato');
    r.Precisazione = note[sigla(v)] || '';
    return r;
  });
  var numeri = mie.filter(function (p) { var a = inArvet(p.specie, p.contrassegno); return a && p.numero != null && Number(p.numero) !== a.numero; })
    .map(function (p) { return { Capo: maiusc(p.contrassegno), 'Numero scritto in campo': p.etichetta, 'Numero in ARVET': inArvet(p.specie, p.contrassegno).numero }; })
    .sort(function (a, b) { return a['Numero in ARVET'] - b['Numero in ARVET']; });

  return { sezioni: sez, ufficio: { provette: app, numeri: numeri, confrontato: Object.keys(arvet).map(function (sp) { return SP[sp]; }) },
    html: pagina(opz.stabilimento, DATA, sez, app, numeri, Object.keys(arvet), pre.notaUfficio || ''), fogli: fogli(sez, app, numeri) };
}

/* La parte discorsiva: che cosa è emerso, in parole semplici, coi numeri e il rimando agli elenchi. */
function narrativa(z, DATA) {
  var P = [];
  function n(i) { return z[i].righe.length; }
  function quanti(k, uno, tanti) { return k === 1 ? uno : k + ' ' + tanti; }
  var riep = z[0].righe.map(function (r) { return r['Animali prelevati'] + ' ' + r.Specie; }).join(' e ');
  P.push('Il ' + DATA + ' il Servizio veterinario ha fatto il prelievo di sangue per la profilassi della brucellosi sugli animali del suo stabilimento: ' + riep +
    '. Qui sotto trova, in parole semplici, che cosa è stato riscontrato; più avanti ci sono gli elenchi completi, capo per capo.');
  if (n(1)) P.push('<strong>Capi non trovati con le loro marche.</strong> ' + quanti(n(1), 'Un capo del suo registro non è stato trovato', 'capi del suo registro non sono stati trovati') +
    ' con le marche. Nel gregge c’erano però altrettanti animali senza marche, oppure con una marca che non poteva essere la loro (già letta su un altro animale, o di un capo che in BDN risulta uscito). ' +
    'Per specie, sesso, età e razza questi animali corrispondono ai capi mancanti: il loro sangue è stato inviato al laboratorio a nome di quei capi, che quindi risultano controllati. ' +
    'Gli animali si riconoscono dalla sigla scritta il giorno del prelievo (elenco 2).');
  if (n(2)) {
    var tutte = z[2].righe.filter(function (r) { return r['Destro (elettronico)'] && r.Sinistro; }).length;
    P.push('<strong>Marche da ordinare.</strong> Vanno ordinate le marche per ' + quanti(n(2), 'un capo', 'capi') + ': ' +
      (tutte ? 'per ' + tutte + ' sia la destra elettronica sia la sinistra' + (n(2) > tutte ? '; per gli altri ' + (n(2) - tutte) + ' solo quella indicata, perché il giorno del prelievo mancava o non si leggeva' : '') :
        'solo quella indicata per ciascuno, perché il giorno del prelievo mancava o non si leggeva') + ' (elenco 3).');
  }
  if (n(3)) P.push('<strong>Marche mai registrate.</strong> ' + quanti(n(3), 'Un animale porta', 'animali portano') +
    ' una marca assegnata al suo stabilimento ma mai registrata in BDN su un capo. I dati (sesso, razza, età) sono stati rilevati dal veterinario: la registrazione in BDN va completata (elenco 4).');
  if (n(4)) P.push('<strong>Animali non suoi.</strong> ' + quanti(n(4), 'Un animale presente nel gregge non risulta', 'animali presenti nel gregge non risultano') + ' del suo stabilimento (elenco 5).');
  if (n(5)) P.push('<strong>Capi che in BDN risultano usciti.</strong> ' + quanti(n(5), 'Un animale presente porta', 'animali presenti portano') +
    ' la marca di un capo che in BDN risulta uscito (morto, macellato, ceduto o smarrito). La posizione in BDN di questi capi va regolarizzata (elenco 6).');
  if (n(6)) P.push('<strong>Stessa marca su due animali.</strong> ' + quanti(n(6), 'Una marca è stata letta', 'marche sono state lette') +
    ' su due animali diversi. Il numero di ristampa stampato sull’auricolare dice quale dei due è il capo registrato: 0 è l’originale (elenco 7).');
  if (n(7)) P.push('<strong>Sesso da correggere.</strong> Per ' + quanti(n(7), 'un capo', 'capi') + ' il sesso registrato in BDN è diverso da quello dell’animale (elenco 8).');
  if (n(8)) P.push('<strong>Capi non prelevati.</strong> ' + quanti(n(8), 'Un capo presente in BDN non è stato trovato e non risulta controllato', 'capi presenti in BDN non sono stati trovati e non risultano controllati') +
    '. Va verificato se sono ancora nello stabilimento; se non ci sono più, la loro uscita va registrata in BDN (elenco 9).');
  if (n(9)) P.push('<strong>Animali giovani.</strong> ' + quanti(n(9), 'Un animale è stato prelevato', 'animali sono stati prelevati') + ' anche se sotto l’età prevista per il controllo (elenco 10).');
  if (P.length === 1) P.push('Non è stata riscontrata nessuna situazione da segnalare.');
  P.push('Queste situazioni saranno valutate dal Servizio veterinario, a cui può rivolgersi per ogni chiarimento.');
  return '<section class="breve"><h2>In breve</h2>' + P.map(function (x) { return '<p>' + x + '</p>'; }).join('') + '</section><h2 class="elenchi">Elenchi, capo per capo</h2>';
}
function tabella(colonne, righe) {
  return '<table><thead><tr>' + colonne.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
    righe.map(function (r) { return '<tr>' + colonne.map(function (c) { return '<td>' + esc(r[c]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
}
function pagina(st, DATA, sez, app, numeri, confrontate, notaUfficio) {
  var corpo = sez.map(function (s, i) {
    return '<section><h2>' + (i + 1) + '. ' + esc(s.titolo) + (s.righe.length && i > 0 ? ' <span class="n">(' + s.righe.length + ')</span>' : '') + '</h2>' +
      (s.nota ? '<p class="nota">' + esc(s.nota) + '</p>' : '') + (s.righe.length ? tabella(s.colonne, s.righe) : '<p class="vuoto">Nessuno.</p>') + '</section>';
  }).join('\n');
  var ufficio = '<section class="ufficio"><h2>Appendice per l’ufficio (non per l’allevatore)</h2>' +
    '<h3>Provette fuori registro e loro esito</h3>' + (app.length ? tabella(Object.keys(app[0]), app) : '<p class="vuoto">Nessuna.</p>') +
    '<h3>Numeri cambiati in ARVET rispetto al campo</h3>' + (numeri.length ? tabella(Object.keys(numeri[0]), numeri) : '<p class="vuoto">Nessuno, o accettazione non confrontata.</p>') +
    '<p class="nota">' + (confrontate.length ? 'Confronto con ARVET fatto per: ' + confrontate.map(function (sp) { return SP[sp]; }).join(', ') + '. ' : 'Nessuna pagina di ARVET caricata: i dati sono quelli di Fejalog. ') + esc(notaUfficio) + '</p></section>';
  return '<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Esito del risanamento · ' + esc(st.codice) + '</title><style>' +
    'body{font-family:system-ui,Arial,sans-serif;font-size:11pt;color:#111;max-width:1000px;margin:1.5em auto;padding:0 1em}h1{font-size:18pt;margin-bottom:.1em}h2{font-size:13pt;margin:1.3em 0 .2em;border-bottom:1px solid #999}' +
    'h3{font-size:11pt}table{border-collapse:collapse;width:100%;margin:.4em 0}th,td{border:1px solid #999;padding:3px 6px;text-align:left;vertical-align:top}th{background:#e6efe6}' +
    '.nota{color:#333;font-size:10pt;margin:.2em 0}.vuoto{color:#555}.breve p{font-size:11.5pt;line-height:1.45;margin:.5em 0}.elenchi{page-break-before:always;border:0;font-size:14pt}.n{font-weight:normal;color:#555}' +
    '.ufficio{page-break-before:always;border-top:3px double #555;margin-top:2em}.firma{margin-top:2.5em;display:flex;gap:3em}.firma div{flex:1;border-top:1px solid #555;padding-top:.3em;font-size:10pt}' +
    '@media print{body{margin:0;max-width:none}tr{break-inside:avoid}}</style></head><body><h1>Esito del risanamento del ' + esc(DATA) + '</h1><p><strong>' + esc(st.denominazione || '') + '</strong> · stabilimento ' + esc(st.codice) +
    ' · profilassi della brucellosi ovicaprina</p><p class="nota">Elenco delle situazioni riscontrate sugli animali il giorno del prelievo e di come sono state trattate. La valutazione delle non conformità spetta al Servizio veterinario.</p>' +
    narrativa(sez, DATA) + corpo + '<div class="firma"><div>Il veterinario ufficiale</div><div>Per ricevuta, l’operatore</div></div>' + ufficio + '</body></html>';
}
/* I fogli per xlsx.js (AccXlsx.xlsxBuild): uno per elenco non vuoto, più l'appendice. */
function fogli(sez, app, numeri) {
  var f = [];
  sez.forEach(function (s, i) { if (s.righe.length) f.push({ nome: (i + 1) + '_' + s.titolo.slice(0, 24), colonne: s.colonne, righe: s.righe, testo: s.colonne.filter(function (c) { return /Capo|Marca/.test(c); }) }); });
  if (app.length) f.push({ nome: 'ufficio_provette', colonne: Object.keys(app[0]), righe: app, testo: ['Marca letta', 'Capo finale'] });
  if (numeri.length) f.push({ nome: 'ufficio_numeri_ARVET', colonne: Object.keys(numeri[0]), righe: numeri, testo: ['Capo'] });
  return f;
}

return { crea: crea, leggiArvet: leggiArvet };
});
