/* «Scarica i registri dalla BDN»: prepara lo snippet (bdn-scarico-motore.js) da incollare nella console della BDN.
   Ingressi: i codici degli stabilimenti da campionare (il minimo), l'export dello storico pascoli della BDN (.xls che è
   una tabella HTML, anche gzippato: .gz) e/o un elenco aggiuntivo «codice;specie;cf». Tutto nel browser: niente esce.
   FejScaricaBdn.leggiPascoli(testo) / .leggiAggiuntivi(testo) / .leggiCodici(testo) / .configurazione(...) sono pure
   (provate in Node, sito/prove/scarica-bdn.cjs); .monta(radice) disegna la pagina. Niente ?. e ?? (browser datati). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FejScaricaBdn = factory();
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';

function pulisci(s) { return String(s == null ? '' : s).replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim(); }
function specieBreve(s) {
  var t = pulisci(s).toLowerCase();
  // solo parole intere: «CAVALLI» o «ASINI» non sono caprini (12/11: lo snippet apriva i cavalli come capre)
  if (/^(o|ov|ovin[io]|ovino|pecor[ae]|pecora)$/.test(t)) return 'ovini';
  if (/^(c|cap|caprin[io]|capr[ae]|capra)$/.test(t)) return 'caprini';
  return '';
}
var CODICE = /^[0-9]{3}[A-Z]{2}[0-9A-Z]{3}$/;
function decodificaEntita(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#(\d+);/g, function (m, n) { return String.fromCharCode(+n); });
}

/** Codici di stabilimento da un testo libero (righe, virgole, spazi). Restituisce {codici, scartati}. */
function leggiCodici(testo) {
  var codici = [], scartati = [], visti = {};
  String(testo || '').split(/[\s,;]+/).forEach(function (x) {
    var c = x.trim().toUpperCase();
    if (!c) return;
    if (!CODICE.test(c)) { scartati.push(x.trim()); return; }
    if (!visti[c]) { visti[c] = true; codici.push(c); }
  });
  return { codici: codici, scartati: scartati };
}

/** L'export «Registro Pascolo Ovicaprini» della BDN (tabella HTML): allevamenti distinti (stabilimento, specie, CF)
    con quanti capi e transiti, e il codice del pascolo. Restituisce {pascoli, allevamenti, righe, errore}. */
function leggiPascoli(testo) {
  var righe = String(testo || '').match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  var celle = function (r) { return (r.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) || []).map(function (c) { return pulisci(decodificaEntita(c.replace(/<[^>]+>/g, ' '))); }); };
  var intest = null, iCod, iSp, iCf, iPas, iCapo;
  var per = {}, ordine = [], pascoli = {}, n = 0;
  for (var k = 0; k < righe.length; k++) {
    var c = celle(righe[k]);
    if (!intest) {
      if (c.indexOf('Azienda Provenienza') >= 0 && c.indexOf('Codice Fiscale Allev') >= 0) {
        intest = c; iCod = c.indexOf('Azienda Provenienza'); iCf = c.indexOf('Codice Fiscale Allev');
        iSp = c.indexOf('Specie Allevata'); iPas = c.indexOf('Codice Pascolo'); iCapo = c.indexOf('Codice Capo');
      }
      continue;
    }
    if (c.length <= iCf) continue;
    var cod = (c[iCod] || '').toUpperCase(), cf = (c[iCf] || '').toUpperCase(), sp = specieBreve(iSp >= 0 ? c[iSp] : '');
    if (!cod || !cf || !sp) continue;
    n++;
    if (iPas >= 0 && c[iPas]) pascoli[c[iPas].toUpperCase()] = true;
    var key = cod + '|' + sp + '|' + cf;
    if (!per[key]) { per[key] = { codice: cod, specie: sp, cf: cf, transiti: 0, capi: {} }; ordine.push(key); }
    per[key].transiti++;
    if (iCapo >= 0 && c[iCapo]) per[key].capi[c[iCapo]] = true;
  }
  if (!intest) return { errore: 'Non trovo la tabella del registro pascolo: servono le colonne «Azienda Provenienza», «Specie Allevata» e «Codice Fiscale Allev».' };
  return {
    righe: n,
    pascoli: Object.keys(pascoli),
    allevamenti: ordine.map(function (key) { var a = per[key]; return { codice: a.codice, specie: a.specie, cf: a.cf, transiti: a.transiti, capi: Object.keys(a.capi).length }; }),
  };
}

/** Elenco aggiuntivo scritto a mano: «codice;specie;cf» per riga (anche tab, virgole o spazi). {allevamenti, scartate}. */
function leggiAggiuntivi(testo) {
  var out = [], scartate = [];
  String(testo || '').split(/\r?\n/).forEach(function (riga) {
    var r = riga.trim();
    if (!r || r.charAt(0) === '#') return;
    var p = r.split(/[;\t,]+|\s+/).filter(Boolean);
    var cod = (p[0] || '').toUpperCase(), sp = specieBreve(p[1]), cf = (p[2] || '').toUpperCase();
    if (!CODICE.test(cod) || !sp || cf.length < 11) { scartate.push(r); return; }
    out.push({ codice: cod, specie: sp, cf: cf });
  });
  return { allevamenti: out, scartate: scartate };
}

/** La configurazione dello snippet: stabilimenti da campionare e allevamenti aggiuntivi senza doppioni. Gli aggiuntivi
    di uno stabilimento da campionare si tolgono (quello stabilimento si scarica già tutto). */
function configurazione(codici, aggiuntivi, data) {
  var camp = {}, visti = {}, agg = [];
  codici.forEach(function (c) { camp[c] = true; });
  aggiuntivi.forEach(function (a) {
    if (camp[a.codice]) return;
    var k = a.codice + '|' + a.specie + '|' + a.cf;
    if (visti[k]) return;
    visti[k] = true; agg.push({ codice: a.codice, specie: a.specie, cf: a.cf });
  });
  return { campionare: codici.slice(), aggiuntivi: agg, data: data };
}
function oggi() { var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; }; return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()); }
function testoSnippet(cfg, motore) { return 'window.__BDN_SCARICO__ = ' + JSON.stringify(cfg) + ';\n' + motore; }

/* ---------- la pagina ---------- */
function h(tag, attr) {
  var e = document.createElement(tag), k;
  for (k in attr || {}) if (Object.prototype.hasOwnProperty.call(attr, k)) {
    if (k === 'class') e.className = attr[k]; else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attr[k]); else e.setAttribute(k, attr[k]);
  }
  for (var i = 2; i < arguments.length; i++) { var x = arguments[i]; if (x == null) continue; e.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); }
  return e;
}
/** Testo di un file: .gz decompresso nel browser (DecompressionStream), latin1 come lo scrive la BDN. */
function leggiFile(file) {
  return file.arrayBuffer().then(function (buf) {
    var u = new Uint8Array(buf);
    if (u[0] === 0x1f && u[1] === 0x8b) {
      if (typeof DecompressionStream === 'undefined') throw new Error('Questo browser non sa aprire i .gz: decomprimi il file e scegli il .xls.');
      return new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    }
    return buf;
  }).then(function (b) { return new TextDecoder('latin1').decode(b); });
}

function monta(radice, opz) {
  var base = (opz && opz.base) || '';
  var st = { codici: '', aggiuntivi: '', pascoli: null, nomePascoli: '', motore: null, errore: '' };
  fetch(base + 'bdn-scarico-motore.js').then(function (r) { return r.text(); }).then(function (t) { st.motore = t; disegna(); },
    function () { st.errore = 'Non riesco a caricare lo snippet dal sito.'; disegna(); });

  var areaCodici = h('textarea', { rows: '3', style: 'width:100%;font-family:monospace', placeholder: 'es. 888TO999 888TO888' });
  areaCodici.addEventListener('input', function () { st.codici = areaCodici.value; disegna(); });
  var areaAgg = h('textarea', { rows: '4', style: 'width:100%;font-family:monospace', placeholder: 'codice;specie;codice fiscale dell\'operatore\n888TO777;ovini;RSSMRA80A01L219X' });
  areaAgg.addEventListener('input', function () { st.aggiuntivi = areaAgg.value; disegna(); });
  var filePas = h('input', { type: 'file', accept: '.gz,.xls,.htm,.html' });
  filePas.addEventListener('change', function () {
    var f = filePas.files[0];
    if (!f) { st.pascoli = null; disegna(); return; }
    st.nomePascoli = f.name;
    leggiFile(f).then(function (t) { st.pascoli = leggiPascoli(t); disegna(); }, function (e) { st.pascoli = { errore: e.message }; disegna(); });
  });
  var uscita = h('div');
  radice.textContent = '';
  radice.appendChild(h('div', null,
    h('h3', null, '1. Stabilimenti da campionare'),
    h('p', { class: 'fej-tenue' }, 'I codici degli stabilimenti del risanamento (il minimo): di ognuno si scaricano tutti gli allevamenti ovini e caprini, anche chiusi.'),
    areaCodici,
    h('h3', null, '2. Pascoli comuni (facoltativo)'),
    h('p', { class: 'fej-tenue' }, 'L\'export «Registro Pascolo Ovicaprini» che hai scaricato dalla BDN (Interrogazioni › Pascoli, storia, con i parametri che scegli tu): il file .gz o il .xls. Si aggiungono gli allevamenti che vi hanno mandato animali.'),
    filePas,
    h('h3', null, '3. Altri allevamenti (facoltativo)'),
    h('p', { class: 'fej-tenue' }, 'Uno per riga: codice dello stabilimento, specie (ovini o caprini), codice fiscale dell\'operatore.'),
    areaAgg,
    uscita));

  function disegna() {
    uscita.textContent = '';
    var c = leggiCodici(st.codici), a = leggiAggiuntivi(st.aggiuntivi);
    var dalPascolo = st.pascoli && st.pascoli.allevamenti ? st.pascoli.allevamenti : [];
    if (st.pascoli && st.pascoli.errore) uscita.appendChild(h('p', { class: 'fej-avviso' }, st.nomePascoli + ': ' + st.pascoli.errore));
    if (st.pascoli && st.pascoli.allevamenti) uscita.appendChild(h('p', null, st.nomePascoli + ': pascolo ' + (st.pascoli.pascoli.join(', ') || '?') + ', ' +
      st.pascoli.righe + ' transiti, ' + dalPascolo.length + ' allevamenti.'));
    if (c.scartati.length) uscita.appendChild(h('p', { class: 'fej-avviso' }, 'Codici non validi, ignorati: ' + c.scartati.join(', ')));
    if (a.scartate.length) uscita.appendChild(h('p', { class: 'fej-avviso' }, 'Righe non valide negli altri allevamenti, ignorate: ' + a.scartate.join(' | ')));
    var cfg = configurazione(c.codici, dalPascolo.concat(a.allevamenti), oggi());
    uscita.appendChild(h('h3', null, '4. Che cosa scarica lo snippet'));
    if (!cfg.campionare.length && !cfg.aggiuntivi.length) { uscita.appendChild(h('p', { class: 'fej-tenue' }, 'Scrivi almeno un codice di stabilimento.')); return; }
    var tab = h('table', null, h('tr', null, h('th', null, 'Stabilimento'), h('th', null, 'Specie'), h('th', null, 'Operatore (CF)'), h('th', null, 'Perché')));
    cfg.campionare.forEach(function (x) { tab.appendChild(h('tr', null, h('td', null, x), h('td', null, 'tutte'), h('td', null, 'tutti'), h('td', null, 'da campionare'))); });
    cfg.aggiuntivi.forEach(function (x) {
      var p = dalPascolo.filter(function (y) { return y.codice === x.codice && y.specie === x.specie && y.cf === x.cf; })[0];
      tab.appendChild(h('tr', null, h('td', null, x.codice), h('td', null, x.specie), h('td', null, x.cf), h('td', null, p ? 'pascolo comune (' + p.capi + ' capi)' : 'aggiunto a mano')));
    });
    uscita.appendChild(tab);
    uscita.appendChild(h('p', null, 'Lo zip si chiamerà bdn_' + cfg.data + '.zip; dentro, per ogni allevamento, <stabilimento>_<specie>_<cf>_' + cfg.data +
      '.txt (registro storico ASCII dall\'apertura a oggi) e marche_… se ha marche a magazzino, più riepilogo.txt.'));
    if (st.errore) { uscita.appendChild(h('p', { class: 'fej-avviso' }, st.errore)); return; }
    if (!st.motore) { uscita.appendChild(h('p', null, 'Carico lo snippet…')); return; }
    var testo = testoSnippet(cfg, st.motore), esito = h('span', { class: 'fej-tenue' });
    uscita.appendChild(h('p', null,
      h('button', { type: 'button', class: 'md-button md-button--primary', onclick: function () {
        navigator.clipboard.writeText(testo).then(function () { esito.textContent = ' Copiato: incollalo nella console della BDN.'; },
          function () { esito.textContent = ' Non riesco a copiare: usa «Scarica lo snippet».'; });
      } }, 'Copia lo snippet'), ' ',
      h('button', { type: 'button', class: 'md-button', onclick: function () {
        var u = URL.createObjectURL(new Blob([testo], { type: 'text/javascript' })), l = h('a', { href: u, download: 'snippet_bdn_' + cfg.data + '.js' });
        document.body.appendChild(l); l.click(); l.remove();
      } }, 'Scarica lo snippet'), esito));
  }
  disegna();
}

return { leggiCodici: leggiCodici, leggiPascoli: leggiPascoli, leggiAggiuntivi: leggiAggiuntivi, configurazione: configurazione,
  testoSnippet: testoSnippet, monta: monta, specieBreve: specieBreve };
});
