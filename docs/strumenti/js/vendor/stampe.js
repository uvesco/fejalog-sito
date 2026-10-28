/* Stampe prima del campo — UMD, ES5, senza DOM; solo qrcode-generator incluso per il QR Wi-Fi.
 * leggi(html): riconosce titolo OVINI/CAPRINI, «Codice azienda» e tabelle caccia
 *   di ARVET; ritorna {ok, avvisi, righe, errore?} (9 celle: N., Provetta, Contrassegno, Razza, Sesso, Nascita,
 *   Proprietario, Detentore, Genotipo). Gli indici servono a cambiare solo le celle.
 * precompila(html, dati): {ok, stabilimento, specie, html, avvisi, errore?}.
 * foglioA3(dati): {ok, html, avvisi, fogli, colonne} (8 colonne × 52 righe).
 * daCsv(csv): dati da numerazione_chiave.csv UTF-8, separatore ;, anche quotato.
 * eseguiJson(stringa): ponte WebView {azione:'233'|'a3', html?, dati} → JSON.
 * dati = {serie:[{stabilimento, specie:'pecore'|'capre', lettera:'',
 *   capi:[{contrassegno, sesso:'M'|'F', numero:intero|null, etichetta:stringa|null}]}],
 *   avvisi:[]}. I capi comprendono TUTTI i presenti BDN; solo quelli in età hanno
 *   numero/etichetta. Non si ricalcolano numeri in JS. Nel CSV ci sono solo i numerati:
 *   le assenze si segnalano come non verificabili, senza dichiararle assenti dalla BDN.
 * Le uscite si salvano in UTF-8: si aggiorna solo l’eventuale dichiarazione di codifica.
 * Un formato diverso viene rifiutato. Non si aggiungono righe se le bianche non bastano:
 *   il file è rifiutato con l'elenco dei capi che non vi entrerebbero.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./qrcode.js'));
  else if (typeof define === 'function' && define.amd) define(['./qrcode'], factory);
  else root.Stampe = factory(root.qrcode);
}(this, function (QR) {
  'use strict';
  var GRIGIO = '<style>tr.maschio td { background-color: #c8c8c8; -webkit-print-color-adjust: exact; print-color-adjust: exact; }</style>';
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function etStampa(c) {
    if (!c) return '';
    var et = c.etichetta != null ? String(c.etichetta) : (c.numero != null ? String(c.numero) : '');
    return et.replace(/[Ⓐ-Ⓩ]/g, '');
  }
  function testo(s) {
    return s.replace(/<[^>]*>/g, '').replace(/&(#x[0-9a-f]+|#\d+|nbsp|amp|lt|gt|quot|apos);/gi, function (_, e) {
      if (e.charAt(0) === '#') return String.fromCharCode(e.charAt(1).toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
      return {nbsp:' ', amp:'&', lt:'<', gt:'>', quot:'"', apos:"'"}[e.toLowerCase()];
    }).replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
  }
  function chiave(s) { return String(s).toUpperCase().replace(/\s/g, ''); }
  function celle(r) {
    var re = /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]\s*>/gi, m, a = [];
    while ((m = re.exec(r))) a.push({testo:testo(m[1]), da:m.index + m[0].indexOf('>') + 1, a:m.index + m[0].lastIndexOf('<')});
    return a;
  }
  function leggiInterno(html) {
    var piano = testo(html), cod = /Codice azienda\s*:\s*([^\s<]+)/i.exec(piano);
    var sp = /BONIFICA SANITARIA DEGLI ALLEVAMENTI\s+(OVINI|CAPRINI)\b/i.exec(piano);
    if (!cod || !sp) throw new Error('Titolo o codice dello stabilimento non riconosciuti nel 2/33.');
    var t = /<table\b[^>]*\bclass\s*=\s*["'][^"']*\bcaccia\b[^"']*["'][^>]*>([\s\S]*?)<\/table\s*>/gi;
    var tab, righe = [], viste = Object.create(null);
    while ((tab = t.exec(html))) {
      var corpo = tab[1], base = tab.index + tab[0].indexOf('>') + 1;
      if (/<table\b/i.test(corpo)) throw new Error('Tabella dei capi non riconosciuta.');
      var re = /<tr\b[^>]*>[\s\S]*?<\/tr\s*>/gi, r, intestazione = false;
      while ((r = re.exec(corpo))) {
        var cc = celle(r[0]);
        if (/<th\b/i.test(r[0]) && cc.length === 9 && chiave(cc[1].testo) === 'PROVETTA' && /CONTRASSEGNO/i.test(cc[2].testo)) intestazione = true;
        else if (cc.length) {
          if (!intestazione || cc.length !== 9 || !/^\d+$/.test(cc[0].testo)) throw new Error('Riga dei capi non riconosciuta.');
          var c = chiave(cc[2].testo);
          if (c && viste[c]) throw new Error('Contrassegno ripetuto nel 2/33: ' + cc[2].testo + '.');
          if (c) viste[c] = true;
          righe.push({contrassegno:cc[2].testo, sesso:cc[4].testo.toUpperCase(), provetta:cc[1].testo,
            da:base+r.index, a:base+r.index+r[0].length, originale:r[0], celle:cc,
            maschio:/\bclass\s*=\s*["'][^"']*\bmaschio\b/i.test(r[0].split('>')[0])});
        }
      }
      if (!intestazione) throw new Error('Colonna Provetta non riconosciuta.');
    }
    if (!righe.length) throw new Error('Nessuna tabella dei capi riconosciuta.');
    return {ok:true,stabilimento:cod[1].toUpperCase(), specie:sp[1].toUpperCase() === 'OVINI' ? 'pecore' : 'capre', righe:righe, avvisi:[]};
  }
  function leggi(html) {
    try { return leggiInterno(html); }
    catch(e) { return {ok:false,righe:[],avvisi:[],errore:e.message}; }
  }
  function serie(dati) {
    if (!dati || !Array.isArray(dati.serie) || !dati.serie.length) throw new Error('Carica prima la numerazione del progetto.');
    var viste = Object.create(null);
    dati.serie.forEach(function (s) {
      var id = s.stabilimento + ':' + s.specie, capi = Object.create(null), numeri = Object.create(null);
      if (!s.stabilimento || ['pecore','capre'].indexOf(s.specie) < 0 || !Array.isArray(s.capi) || viste[id]) throw new Error('Serie della numerazione non valida o ripetuta.');
      viste[id] = true;
      s.capi.forEach(function (c) {
        var k = chiave(c.contrassegno || '');
        if (!k || capi[k]) throw new Error('Contrassegno vuoto o ripetuto nella numerazione.');
        capi[k] = true;
        if (c.numero != null) {
          if (typeof c.numero !== 'number' || c.numero <= 0 || c.numero % 1 || !c.etichetta || numeri[c.numero]) throw new Error('Numero o etichetta non validi nella numerazione.');
          numeri[c.numero] = true;
        }
      });
    });
    return dati.serie;
  }
  function numerati(s) { return s.capi.filter(function (c) { return c.numero != null; }).sort(function (a,b) { return a.numero-b.numero; }); }
  function grigia(r) {
    if (r.maschio) return r.originale;
    return r.originale.replace(/<tr\b[^>]*>/i, function (tag) {
      if (/\bclass\s*=/i.test(tag)) return tag.replace(/(\bclass\s*=\s*["'])/i, '$1maschio ');
      return tag.replace(/>$/, ' class="maschio">');
    });
  }
  function cambia(r, valori, maschio) {
    var h = maschio ? grigia(r) : r.originale, delta = h.length-r.originale.length;
    Object.keys(valori).map(Number).sort(function(a,b){return b-a;}).forEach(function (i) {
      h = h.slice(0,r.celle[i].da+delta) + valori[i] + h.slice(r.celle[i].a+delta);
    });
    return h;
  }
  function precompila(html, dati) {
    var avvisi = (dati && dati.avvisi || []).slice(), p;
    try {
      var ss = serie(dati); p = leggiInterno(html);
      var s = ss.filter(function (x) { return x.stabilimento === p.stabilimento && x.specie === p.specie; })[0];
      if (!s) throw new Error('Stabilimento o specie non presenti nel progetto: ' + p.stabilimento + ' · ' + p.specie + '.');
      var indice = Object.create(null), presenti = Object.create(null), vuote = [], modifiche = [];
      s.capi.forEach(function(c){indice[chiave(c.contrassegno)] = c;});
      p.righe.forEach(function (r) {
        if (!r.contrassegno) { vuote.push(r); return; }
        var k = chiave(r.contrassegno), c = indice[k]; presenti[k] = true;
        if (!c) avvisi.push(s.registroCompleto === false ? r.contrassegno + ': senza numero nella chiave CSV; verifica nel registro BDN.' : r.contrassegno + ': assente dal registro BDN caricato; Provetta vuota.');
        modifiche.push({r:r, h:cambia(r, {1:c && c.numero != null ? '<b style="font-size: 16px;">'+esc(etStampa(c))+'</b>' : '&nbsp;'}, p.specie === 'pecore' && r.sesso === 'M')});
      });
      var mancanti = numerati(s).filter(function(c){return !presenti[chiave(c.contrassegno)];});
      mancanti.forEach(function(c){avvisi.push(c.contrassegno + ': assente dal 2/33; aggiunto nelle righe bianche con provetta ' + etStampa(c) + '.');});
      if (mancanti.length > vuote.length) {
        avvisi = avvisi.slice(0, avvisi.length-mancanti.length);
        mancanti.forEach(function(c){avvisi.push(c.contrassegno + ': assente dal 2/33, provetta ' + etStampa(c) + '.');});
        throw new Error('Righe bianche insufficienti: servono ' + mancanti.length + ', disponibili ' + vuote.length + '. File non prodotto.');
      }
      mancanti.forEach(function(c,i){var r=vuote[i]; modifiche.push({r:r,h:cambia(r,{1:'<b style="font-size: 16px;">'+esc(etStampa(c))+'</b>',2:esc(c.contrassegno)},p.specie==='pecore' && c.sesso==='M')});});
      modifiche.sort(function(a,b){return b.r.da-a.r.da;}).forEach(function(m){html=html.slice(0,m.r.da)+m.h+html.slice(m.r.a);});
      if (p.specie === 'pecore') {
        if (!/<\/head\s*>/i.test(html)) throw new Error('Testata HTML mancante.');
        if (html.indexOf(GRIGIO) < 0) html = html.replace(/<\/head\s*>/i, GRIGIO+'\n</head>');
      }
      // Il testo è già decodificato dall'ingresso; Blob e Android scrivono UTF-8.
      html = html.replace(/<meta\b[^>]*>/gi, function(tag) {
        return tag.replace(/(\bcharset\s*=\s*["']?)[a-z0-9_-]+/i, '$1UTF-8');
      });
      return {ok:true,stabilimento:p.stabilimento,specie:p.specie,html:html,avvisi:avvisi};
    } catch(e) { return {ok:false,stabilimento:p && p.stabilimento,specie:p && p.specie,html:null,avvisi:avvisi,errore:e.message}; }
  }
  function foglioA3(dati) {
    var avvisi = (dati && dati.avvisi || []).slice();
    try {
      var ss=serie(dati), colonne=[], cur=[];
      function chiudi(){if(cur.length) colonne.push(cur);cur=[];}
      ss.forEach(function(s){
        var nn=numerati(s); if(!nn.length) return;
        var titolo=s.stabilimento+(s.lettera ? ' ('+s.lettera+')' : '')+' · '+(s.specie==='pecore'?'OVINI':'CAPRINI')+' · '+nn.length;
        if(cur.length>=51) chiudi(); cur.push('<tr class="tit"><td colspan="2">'+esc(titolo)+'</td></tr>');
        nn.forEach(function(c){
          if(cur.length>=52) chiudi();
          if(!cur.length) cur.push('<tr class="tit"><td colspan="2">'+esc(titolo)+' (segue)</td></tr>');
          cur.push('<tr'+(s.specie==='pecore' && c.sesso==='M'?' class="maschio"':'')+'><td class="p">'+esc(etStampa(c))+'</td><td class="c">'+esc(c.contrassegno)+'</td></tr>');
        });
      });
      chiudi();
      if(!colonne.length) throw new Error('Nessun capo con numero assegnato.');
      var haCerchietto = ss.some(function(s) {
        return (s.lettera && /[Ⓐ-Ⓩ]/.test(s.lettera)) || (s.cerchietto && s.cerchietto !== false) ||
          (s.capi && s.capi.some(function(c) { return c.etichetta && /[Ⓐ-Ⓩ]/.test(c.etichetta); }));
      });
      var legendaCerchietto = haCerchietto ? ' · il cerchietto identifica lo stabilimento' : '';
      var fogli=Math.ceil(colonne.length/8), pagine=[];
      for(var k=0;k<fogli;k++) pagine.push('<div class="pagina"><div class="testa"><span><b>Provette e contrassegni</b> · ovini: maschi in grigio'+legendaCerchietto+'</span><span>pagina '+(k+1)+' di '+fogli+'</span></div><div class="colonne">'+colonne.slice(k*8,k*8+8).map(function(c){return '<table class="col"><thead><tr><th>Provetta</th><th>Contrassegno</th></tr></thead><tbody>'+c.join('')+'</tbody></table>';}).join('')+'</div></div>');
      var css='@page{size:A3 landscape;margin:8mm}body{font-family:Verdana,Arial,sans-serif;margin:0;color:#222}'+
        '.pagina{break-after:page}.pagina:last-child{break-after:auto}.testa{display:flex;justify-content:space-between;font-size:10pt;margin-bottom:2mm}'+
        '.colonne{display:flex;gap:3mm;align-items:flex-start}table.col{border-collapse:collapse;width:47mm;font-size:9pt}'+
        'table.col th{background:#b5cfd2;border:1px solid #999;padding:.5mm 1mm;font-size:8pt}table.col td{border:1px solid #999;padding:.3mm 1mm;height:4.2mm;white-space:nowrap}'+
        'td.p{font-weight:bold;text-align:right;width:12mm}td.c{font-family:"DejaVu Sans Mono",monospace}tr.tit td{background:#eee;font-weight:bold;font-size:7.5pt}'+
        'tr.maschio td{background-color:#c8c8c8;-webkit-print-color-adjust:exact;print-color-adjust:exact}';
      return {ok:true,html:'<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><title>Provette e contrassegni</title><style>'+css+'</style></head><body>'+pagine.join('')+'</body></html>',avvisi:avvisi,fogli:fogli,colonne:colonne.length};
    } catch(e){return {ok:false,html:null,avvisi:avvisi,errore:e.message};}
  }
  function daCsv(csv) {
    var righe=[], r=[], cella='', quote=false, i, ch;
    csv=csv.replace(/^\uFEFF/,'');
    for(i=0;i<=csv.length;i++) {
      ch=csv.charAt(i);
      if(ch==='"') {if(quote && csv.charAt(i+1)==='"'){cella+='"';i++;}else quote=!quote;}
      else if(!quote && (ch===';' || ch==='\n' || ch==='\r' || i===csv.length)) {
        r.push(cella);cella='';
        if(ch!==';'){if(r.some(function(v){return v!=='';}))righe.push(r);r=[];if(ch==='\r' && csv.charAt(i+1)==='\n')i++;}
      } else cella+=ch;
    }
    if(quote)throw new Error('Virgolette non chiuse nel CSV.');
    if(!righe.length)throw new Error('CSV vuoto.');
    var intest=righe.shift().map(function(v){return v.toLowerCase().trim();});
    function pos(n){var p=intest.indexOf(n);if(p<0)throw new Error('Colonna CSV mancante: '+n+'.');return p;}
    var st=pos('stabilimento'),sp=pos('specie'),co=pos('contrassegno'),nu=pos('numero'),et=pos('etichetta'),se=intest.indexOf('sesso');
    var ss=[], perId=Object.create(null);
    righe.forEach(function(r){
      var specie=r[sp], stab=String(r[st] || '').trim().toUpperCase(), id=stab+':'+specie, n=Number(r[nu]);
      if(!/^\d+$/.test(r[nu]) || !r[et] || !r[co] || n<1)throw new Error('Riga CSV senza numero, etichetta o contrassegno.');
      var pref=r[et].slice(0,r[et].length-String(n).length), lettera=pref.replace(/[CP]$/,'');
      if(!perId[id]){perId[id]={stabilimento:stab,specie:specie,lettera:lettera,registroCompleto:false,capi:[]};ss.push(perId[id]);}
      perId[id].capi.push({contrassegno:r[co],sesso:se>=0?String(r[se]).trim().toUpperCase():'',numero:n,etichetta:r[et]});
    });
    function ordine(s){
      var l = s.lettera;
      if (l && l.length === 1 && l.charCodeAt(0) >= 0x24B6 && l.charCodeAt(0) <= 0x24CF) {
        l = String.fromCharCode(l.charCodeAt(0) - 0x24B6 + 65);
      }
      var p='XYWVURNKH'.indexOf(l);return !s.lettera?-1:p<0?99:p;
    }
    ss.sort(function(a,b){return ordine(a)-ordine(b) || (a.stabilimento<b.stabilimento?-1:a.stabilimento>b.stabilimento?1:0) || (a.specie===b.specie?0:a.specie==='pecore'?-1:1);});
    var dati={serie:ss,avvisi:['La chiave CSV contiene solo i capi numerati: non permette di distinguere i fuori età dai capi assenti dal registro BDN.']};
    if(se<0)dati.avvisi.push('Sesso assente dal CSV: nel foglio A3 i maschi non possono essere evidenziati; per questa stampa usa il backup. Nel 2/33 si usa il sesso della riga.');
    serie(dati);return dati;
  }
  function a4(titolo, corpo) {
    return '<!doctype html><html lang="it"><head><meta charset="utf-8"><title>'+esc(titolo)+'</title><style>'+
      '@page{size:A4 portrait;margin:10mm}body{margin:0;color:#111;background:white;font-family:Arial,sans-serif;font-size:12pt}'+
      'h1{font-size:20pt}h2{font-size:16pt}.pagina{break-after:page;page-break-after:always}.pagina:last-child{break-after:auto;page-break-after:auto}'+
      'svg{display:block;width:100%;max-width:100%;height:auto}.griglia{width:180mm}'+
      'svg text{fill:#111}.qr{width:155mm;margin:8mm auto}.piccolo{font-size:10pt}'+
      '*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>'+corpo+'</body></html>';
  }
  function successo(titolo, corpo, extra) {
    var r={ok:true,html:a4(titolo,corpo),avvisi:[]};
    Object.keys(extra || {}).forEach(function(k){r[k]=extra[k];});return r;
  }
  function fallimento(e){return {ok:false,html:null,avvisi:[],errore:e.message || String(e)};}
  // Plateau fisico 10x10 (smussi in basso-sx e alto-dx, file dispari dall'alto sfalsate di 0,48 passi a destra).
  // Cambia solo la posizione dei numeri 1..100 secondo il verso di riempimento ('alto_basso' o 'basso_alto').
  function grigliaGenerica(verso) {
    var altoBasso=verso!=='basso_alto', out=[], rAlto, c, rLogica, rBasso, sfalsata, n, x, y, dx=169.2/10.5, dy=141/10;
    var etichettaAria=altoBasso?'100 pozzetti, numero 1 in alto a sinistra':'100 pozzetti, numero 1 in basso a sinistra';
    out.push('<svg class="griglia" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 150" role="img" aria-label="'+etichettaAria+'">'+
      '<path class="bordo-plateau" d="M3 2 H165 L177 14 V148 H15 L3 136 Z" fill="white" stroke="black"/>');
    for(rAlto=0;rAlto<10;rAlto++)for(c=0;c<10;c++){
      rLogica=altoBasso?rAlto:(9-rAlto);
      rBasso=9-rAlto;
      sfalsata=(rAlto%2===1);
      n=rLogica*10+c+1;
      x=5.4+(c+0.5+(sfalsata?0.48:0))*dx;
      y=4.5+(rAlto+0.5)*dy;
      out.push('<g class="pozzetto" data-numero="'+n+'" data-riga-alto="'+(rAlto+1)+'" data-riga="'+(rBasso+1)+'" data-colonna="'+(c+1)+'" data-sfalsata="'+(sfalsata?'1':'0')+'"><circle cx="'+x+'" cy="'+y+'" r="6.2" fill="white" stroke="black"/>'+
        '<text x="'+x+'" y="'+(y+1.6)+'" text-anchor="middle" font-size="4.3">'+n+'</text></g>');
    }
    return out.join('')+'</svg>';
  }
  function foglioRiempimento(verso, opzioni) {
    try {
      if(verso!=null && verso!=='alto_basso' && verso!=='basso_alto')throw new Error('Verso di riempimento non valido.');
      var v=verso==='basso_alto'?'basso_alto':'alto_basso', altoBasso=v==='alto_basso';
      var larghezza=(opzioni && opzioni.larghezzaPlateau) || 18;
      var sottotitolo=altoBasso?'Dall’alto verso il basso (numero 1 in alto a sinistra)':'Dal basso verso l’alto (numero 1 in basso a sinistra)';
      var estremi=altoBasso?'Numero 1 in alto a sinistra · numero 100 in basso a destra':'Numero 1 in basso a sinistra · numero 100 in alto a destra';
      var pagina='<section class="pagina" data-verso="'+v+'"><h1>Foglio di riempimento del plateau (1–100)</h1><h2>'+sottotitolo+'</h2>'+
        '<p class="didascalia"><b>Riempi dal numero 1 al 100, in ordine, file per file, mai a serpente.</b></p>'+
        grigliaGenerica(v)+
        '<p>'+estremi+' · '+larghezza+' cm sul lato delle righe.</p></section>';
      return successo('Foglio di riempimento 1–100',pagina,{fogli:1,verso:v});
    }catch(e){return fallimento(e);}
  }
  function stringaWifi(w) {
    if(!w || typeof w.ssid!=='string' || !w.ssid.trim())throw new Error('Scrivi il nome della rete (SSID).');
    if(w.tipo!=='WPA' && w.tipo!=='nopass')throw new Error('Scegli WPA oppure rete aperta.');
    if(w.tipo==='WPA' && (typeof w.password!=='string' || !w.password))throw new Error('Scrivi la password della rete.');
    if(/[\r\n\x00]/.test(w.ssid+(w.password||'')))throw new Error('SSID e password devono stare su una riga.');
    function q(t){return String(t).replace(/[\\;,:\"]/g,'\\$&');}
    return 'WIFI:S:'+q(w.ssid)+';T:'+w.tipo+';P:'+q(w.tipo==='nopass'?'':w.password)+';;';
  }
  function qrWifi(w) {
    var contenuto=stringaWifi(w);
    if(!QR)throw new Error('Libreria QR non caricata.');
    QR.stringToBytes=QR.stringToBytesFuncs['UTF-8'];
    var qr=QR(0,'M');qr.addData(contenuto,'Byte');qr.make();
    var n=qr.getModuleCount(), matrice=[], path=[], r,c;
    for(r=0;r<n;r++){
      matrice[r]=[];
      for(c=0;c<n;c++){
        var scuro=qr.isDark(r,c);matrice[r][c]=scuro?1:0;
        if(scuro)path.push('M'+(c+4)+' '+(r+4)+'h1v1h-1z');
      }
    }
    // Quattro moduli bianchi di quiet zone, anche nella stampa di Android, senza risorse esterne.
    return {contenuto:contenuto,matrice:matrice,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 '+(n+8)+' '+(n+8)+'" role="img" aria-label="QR della rete Wi-Fi" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="white"/><path d="'+path.join('')+'" fill="black"/></svg>'};
  }
  function foglioWifi(w) {
    try {
      var q=qrWifi(w);
      return successo('Collegamento Wi-Fi','<h1>Collegamento alla rete Wi-Fi</h1><h2>'+esc(w.ssid)+'</h2><div class="qr">'+q.svg+'</div><p>'+
        (w.tipo==='nopass'?'Rete aperta.':'Password: <b>'+esc(w.password)+'</b>')+'</p><p>Inquadra il QR con la fotocamera. Poi apri Fejalog, scegli «Chiedi di entrare» e attendi la Regia.</p>');
    }catch(e){return fallimento(e);}
  }
  function schemaTavolo(m, verso) {
    try {
      var o=m.opzioni, w=Math.max(m.larghezza,1), h=Math.max(m.profondita,1), svg=[];
      var v=(verso || m.verso)==='basso_alto'?'basso_alto':'alto_basso';
      var descrVerso=v==='basso_alto'?'dal basso verso l’alto (pozzetto 1 in basso a sinistra)':'dall’alto verso il basso (pozzetto 1 in alto a sinistra)';
      svg.push('<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="-1 -1 '+(w+2)+' '+(h+2)+'" role="img" aria-label="Disposizione dei plateau sul tavolo">');
      var haCerchietto = (m.serie || []).some(function(s) {
        return (s.lettera && /[Ⓐ-Ⓩ]/.test(s.lettera)) || (s.cerchietto && s.cerchietto !== false);
      }) || (m.disposizione || []).some(function(p) {
        return (p.lettera && /[Ⓐ-Ⓩ]/.test(p.lettera)) || (p.stabilimento && /[Ⓐ-Ⓩ]/.test(p.stabilimento));
      });
      m.disposizione.forEach(function(p){
        var tit = p.problematici ? 'Problematici' : ((p.lettera && /[Ⓐ-Ⓩ]/.test(p.lettera) ? p.lettera + ' ' : '') + p.stabilimento);
        svg.push('<g class="posto-plateau" data-fila="'+p.fila+'" data-colonna="'+p.colonna+'"><rect x="'+p.x+'" y="'+p.y+'" width="'+o.larghezzaPlateau+'" height="'+o.profonditaPlateau+'" fill="'+(p.problematici?'#eee':'white')+'" stroke="black" stroke-width=".2"/>'+
          '<text text-anchor="middle" font-size="1.7" x="'+(p.x+o.larghezzaPlateau/2)+'" y="'+(p.y+4)+'">'+esc(tit)+'</text>'+
          '<text text-anchor="middle" font-size="1.5" x="'+(p.x+o.larghezzaPlateau/2)+'" y="'+(p.y+8)+'">'+(p.problematici?'in uso':(p.specie==='pecore'?'Ovini':'Caprini')+' · '+p.plateau)+'</text>'+
          '<text text-anchor="middle" font-size="1.5" x="'+(p.x+o.larghezzaPlateau/2)+'" y="'+(p.y+12)+'">'+p.da+'–'+p.a+'</text></g>');
      });
      svg.push('</svg>');
      var riassunto=m.capi+' capi in età diagnostica · '+m.provette+' provette non scritte ('+m.provetteMargine+' di margine + '+m.provetteScorta+' di scorta).';
      var notaCerchietto = haCerchietto ? '<p class="piccolo">Sulle provette, la lettera cerchiata in testa identifica lo stabilimento.</p>' : '';
      var corpo='<h1>Materiale e schema del tavolo</h1><p>'+riassunto+'</p><p>'+m.veterinari+' veterinari · '+m.pennarelli+' pennarelli.</p>'+
        '<p>'+m.ordinari+' plateau ordinari, tutti sul tavolo nel Riordino. Problematici: '+m.problematiciUso+' in uso + '+m.problematiciScorta+' di scorta fuori tavolo. Totale da portare: '+m.plateauTotali+'.</p>'+
        '<p>Verso di riempimento dei plateau: <b>'+descrVerso+'</b>.</p>'+
        notaCerchietto+
        '<p>Una fila: '+m.larghezzaUnaFila+' cm · due file: '+m.larghezzaDueFile+' cm.</p>'+
        '<p>Disposizione in '+m.file+' file: '+m.larghezza+' × '+m.profondita+' cm. Plateau '+o.larghezzaPlateau+' × '+o.profonditaPlateau+' cm; spazio '+o.spazio+' cm.</p>'+
        (m.tavoloSufficiente?'':'<p><b>La larghezza scelta ('+o.larghezzaTavolo+' cm) non basta neppure su due file. Serve un tavolo più largo.</b></p>')+svg.join('');
      return successo('Materiale e schema del tavolo',corpo,{svg:svg.join(''),riassunto:riassunto,verso:v});
    }catch(e){return fallimento(e);}
  }
  function eseguiJson(t) {
    try {
      var i=JSON.parse(t);
      return JSON.stringify(i.azione==='233'?precompila(i.html,i.dati):i.azione==='a3'?foglioA3(i.dati):
        (i.azione==='foglio' || i.azione==='foglio_riempimento')?foglioRiempimento(i.verso,(i.materiale && i.materiale.opzioni) || i.opzioni):
        i.azione==='wifi'?foglioWifi(i.wifi):
        i.azione==='tavolo'?schemaTavolo(i.materiale,i.verso):{ok:false,avvisi:[],errore:'Azione non riconosciuta.'});
    }catch(e){return JSON.stringify(fallimento(e));}
  }
  return {leggi:leggi,precompila:precompila,foglioA3:foglioA3,daCsv:daCsv,eseguiJson:eseguiJson,
    foglioRiempimento:foglioRiempimento,stringaWifi:stringaWifi,qrWifi:qrWifi,foglioWifi:foglioWifi,schemaTavolo:schemaTavolo};
}));
