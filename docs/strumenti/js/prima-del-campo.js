/* Interfaccia delle stampe: gli HTML sono prodotti solo da stampe.js, identico all'app. */
(function () {
  'use strict';
  /* Montabile anche dentro «Crea il progetto» (utente, 12/11: le stampe come scheda di quella pagina, senza ridare la
     numerazione): FejPrimaDelCampo.monta(radice, {progetto: true}) → { caricaBackup(byte dello snapshot) }. */
  window.FejPrimaDelCampo = { monta: function (r, opz) { return avvia(r, opz || {}); } };
  var radice = document.getElementById('fejalog-prima');
  if (!radice) return;
  var base = document.currentScript.src.replace(/[^/]*$/, '');
  var elenco=['vendor/fejalog-shared.js','dominio.js','vendor/qrcode.js','vendor/stampe.js','vendor/xlsx.js','zip.js','registro.js','progetto.js','reti.js'];
  (function avanti(i){
    if(i===elenco.length){window.FejPrimaDelCampo.ultima=avvia(radice,{});return;}
    var script=document.createElement('script');script.src=base+elenco[i];
    script.onload=function(){avanti(i+1);};script.onerror=function(){root.textContent='Non riesco a caricare il motore delle stampe.';};document.head.appendChild(script);
  })(0);
  function avvia(root, opz) {
    root.innerHTML = '<div class="fej-form"><p><label>Chiave della numerazione (CSV) o backup (ZIP)<input id="prima-csv" type="file" accept=".csv,.zip,text/csv,application/zip"></label></p>' +
      '<p><label>2/33 di ARVET (.htm, anche più file, o lo zip dello snippet per ARVET)<input id="prima-htm" type="file" accept=".htm,.html,.zip,text/html,application/zip" multiple disabled></label></p></div>' +
      '<p id="prima-stato" role="status" aria-live="polite"></p><div id="prima-avvisi"></div><div id="prima-a3"></div><div id="prima-esiti"></div><section id="prima-materiale"></section>';
    var dati = null, versione = 0;
    function el(id) { return document.getElementById('prima-' + id); }
    function avvisi(nodo, vv) {
      if (!vv.length) return;
      var lista = document.createElement('ul'); lista.className = 'fej-avviso';
      vv.forEach(function(v){var li=document.createElement('li');li.textContent=v;lista.appendChild(li);}); nodo.appendChild(lista);
    }
    function scarica(nodo, nome, html) {
      var b=document.createElement('button'); b.type='button'; b.className='md-button'; b.textContent='Scarica '+nome;
      b.onclick=function(){var u=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download=nome;a.click();setTimeout(function(){URL.revokeObjectURL(u);},30000);};
      nodo.appendChild(b);
      var stampa=document.createElement('button');stampa.type='button';stampa.className='md-button';stampa.textContent='Stampa '+nome;
      stampa.onclick=function(){var u=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),p=window.open(u,'_blank');if(p)p.addEventListener('load',function(){p.print();},{once:true});setTimeout(function(){URL.revokeObjectURL(u);},60000);};nodo.appendChild(stampa);
    }
    var campi=[['veterinari','Veterinari previsti',1,1,999],['margine','Margine provette (%)',10,0,100],['scorta','Scorta provette (%)',5,0,100],['larghezzaPlateau','Larghezza plateau, lato delle righe (cm)',18,1,100],['profonditaPlateau','Profondità plateau (cm)',15,1,100],['spazio','Spazio fra i plateau (cm)',2,0,100],['larghezzaTavolo','Larghezza massima del tavolo (cm)',180,1,10000]];
    el('materiale').innerHTML='<h2>Materiale</h2><p>Tutti i plateau ordinari devono stare sul tavolo nel Riordino. La scorta dei fuori registro resta fuori tavolo.</p><div id="prima-parametri" class="fej-form">'+
      '<p><label>Verso di riempimento dei plateau<select id="prima-verso"><option value="alto_basso">Dall’alto verso il basso (predefinito: 1 in alto a sinistra)</option><option value="basso_alto">Dal basso verso l’alto (1 in basso a sinistra)</option></select></label></p>'+
      '</div><div id="prima-calcolo" role="status" aria-live="polite"></div><div id="prima-schema"></div><div id="prima-stampe-materiale"></div>'+
      '<h3>Wi-Fi: fogli d’ingresso col QR</h3><p>Un foglio A4 per ogni rete del progetto (router, hotspot del tablet). SSID e password restano nella pagina e finiscono solo nei fogli che scarichi.</p>'+
      '<div id="prima-reti" class="fej-form"></div><p><button type="button" id="prima-rete-aggiungi">Aggiungi una rete</button> '+
      '<label>oppure caricale da un CSV (reti_progetto.csv) <input id="prima-reti-csv" type="file" accept=".csv,.txt,text/csv,text/plain"></label></p>'+
      '<div id="prima-wifi-stato" role="status"></div><div id="prima-wifi"></div>';
    campi.forEach(function(c){var p=document.createElement('p'),l=document.createElement('label'),i=document.createElement('input');l.textContent=c[1];i.id='prima-'+c[0];i.type='number';i.value=c[2];i.min=c[3];i.max=c[4];i.step=1;i.oninput=aggiornaMateriale;l.appendChild(i);p.appendChild(l);el('parametri').appendChild(p);});
    el('verso').onchange=aggiornaMateriale;
    /* Le reti dei fogli Wi-Fi (utente, 13/11: «dalla pagina dopo non si possono importare i csv»): quelle del progetto
       (dalla scheda «Crea il progetto» o dal backup), quelle del CSV e quelle scritte qui; un foglio per rete. */
    var Reti=window.FejReti, reti=[{ssid:'',sicurezza:'WPA',password:'',origine:'qui'}];
    function nomeFoglio(ssid){return 'rete_wifi_'+(String(ssid).trim().replace(/[^A-Za-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'')||'rete')+'_A4.html';}
    function aggiornaWifi(){
      el('wifi').textContent='';el('wifi-stato').textContent='';
      var buoni=[],errori=[];
      reti.forEach(function(r){
        if(!r.ssid.trim())return;
        var f=Stampe.foglioWifi({ssid:r.ssid.trim(),tipo:Reti.tipoQr(r),password:r.password});
        if(f.ok)buoni.push({nome:nomeFoglio(r.ssid),html:f.html,ssid:r.ssid.trim()});else errori.push(r.ssid.trim()+': '+f.errore);
      });
      if(buoni.length>1){var cima=document.createElement('p');var b=document.createElement('button');b.type='button';b.className='md-button md-button--primary';
        b.textContent='Scarica tutti i fogli Wi-Fi ('+buoni.length+' reti, zip)';
        b.onclick=function(){var u=URL.createObjectURL(new Blob([window.FejZip.scrivi(buoni.map(function(x){return {name:x.nome,data:x.html};}))],{type:'application/zip'})),a=document.createElement('a');a.href=u;a.download='reti_wifi_A4.zip';a.click();setTimeout(function(){URL.revokeObjectURL(u);},30000);};
        cima.appendChild(b);el('wifi').appendChild(cima);}
      buoni.forEach(function(x){var p=document.createElement('p');p.appendChild(document.createTextNode(x.ssid+' '));scarica(p,x.nome,x.html);el('wifi').appendChild(p);});
      el('wifi-stato').textContent=errori.join(' · ');
    }
    function renderReti(){
      var box=el('reti');box.textContent='';
      reti.forEach(function(r,i){
        var p=document.createElement('p');p.className='prima-rete';
        function etichetta(testo,campo){var l=document.createElement('label');l.textContent=testo+' ';l.appendChild(campo);p.appendChild(l);p.appendChild(document.createTextNode(' '));}
        var ssid=document.createElement('input');ssid.type='text';ssid.className='prima-rete-ssid';ssid.maxLength=32;ssid.autocomplete='off';ssid.value=r.ssid;
        ssid.oninput=function(){r.ssid=ssid.value;r.origine='qui';aggiornaWifi();};etichetta('Nome della rete (SSID)',ssid);
        var tipo=document.createElement('select');tipo.className='prima-rete-tipo';
        [['WPA','WPA2'],['SAE','WPA3'],['APERTA','aperta, senza password']].forEach(function(o){var op=document.createElement('option');op.value=o[0];op.textContent=o[1];op.selected=r.sicurezza===o[0];tipo.appendChild(op);});
        var pw=document.createElement('input');pw.type='password';pw.className='prima-rete-password';pw.maxLength=63;pw.autocomplete='off';pw.value=r.password;pw.disabled=r.sicurezza==='APERTA';
        tipo.oninput=tipo.onchange=function(){r.sicurezza=tipo.value;pw.disabled=r.sicurezza==='APERTA';aggiornaWifi();};etichetta('Sicurezza',tipo);
        pw.oninput=function(){r.password=pw.value;aggiornaWifi();};etichetta('Password',pw);
        var togli=document.createElement('button');togli.type='button';togli.textContent='Togli';
        togli.onclick=function(){reti.splice(i,1);if(!reti.length)reti.push({ssid:'',sicurezza:'WPA',password:'',origine:'qui'});renderReti();aggiornaWifi();};p.appendChild(togli);
        box.appendChild(p);
      });
    }
    /* Aggiunge o aggiorna per SSID; le righe vuote spariscono. Con «progetto» sostituisce le reti arrivate dal progetto. */
    function unisciReti(nuove,origine){
      if(origine==='progetto')reti=reti.filter(function(r){return r.origine!=='progetto';});
      reti=reti.filter(function(r){return r.ssid.trim();});
      nuove.forEach(function(n){
        var r={ssid:String(n.ssid||''),sicurezza:Reti.SICUREZZE[n.sicurezza]?n.sicurezza:'WPA',password:String(n.password||''),origine:origine};
        var i=reti.findIndex(function(x){return x.ssid.trim()===r.ssid.trim();});
        if(i>=0){if(origine!=='progetto'||reti[i].origine==='progetto')reti[i]=r;}else reti.push(r);
      });
      if(!reti.length)reti.push({ssid:'',sicurezza:'WPA',password:'',origine:'qui'});
      renderReti();aggiornaWifi();
    }
    el('rete-aggiungi').onclick=function(){reti.push({ssid:'',sicurezza:'WPA',password:'',origine:'qui'});renderReti();};
    el('reti-csv').onchange=function(){
      var file=this.files[0],input=this;if(!file)return;
      leggi(file).then(function(t){var lette=Reti.daCsv(t);unisciReti(lette,'qui');el('wifi-stato').textContent=lette.length?'Reti caricate dal CSV: '+lette.length+'.':'Nel CSV non ci sono reti (serve almeno la colonna SSID).';},
        function(e){el('wifi-stato').textContent=e.message;}).then(function(){input.value='';});
    };
    renderReti();
    function aggiornaMateriale(){
      el('calcolo').textContent='';el('schema').textContent='';el('stampe-materiale').textContent='';
      var verso=el('verso').value==='basso_alto'?'basso_alto':'alto_basso';
      var altroVerso=verso==='alto_basso'?'basso_alto':'alto_basso';
      // Il foglio 1–100 è generico: non richiede registri, né il calcolo del materiale.
      [verso,altroVerso].forEach(function(v){
        var foglio=Stampe.foglioRiempimento(v);
        if(foglio.ok)scarica(el('stampe-materiale'),'foglio_riempimento_1-100_'+v+'_A4.html',foglio.html);
      });
      if(!dati)return;
      try{
        var o={};campi.forEach(function(c){var v=el(c[0]).value;if(!/^\d+$/.test(v))throw new Error('Completa le impostazioni con numeri interi.');o[c[0]]=Number(v);});
        var m=FejDominio.materiale(dati,o),r=Stampe.schemaTavolo(m,verso);
        if(!r.ok)throw new Error(r.errore);
        el('calcolo').textContent=r.riassunto+' '+m.veterinari+' veterinari · '+m.pennarelli+' pennarelli. '+m.ordinari+' plateau ordinari; fuori registro '+m.problematiciUso+' in uso + '+m.problematiciScorta+' di scorta fuori tavolo. Totale da portare: '+m.plateauTotali+'. Una fila: '+m.larghezzaUnaFila+' cm; due file: '+m.larghezzaDueFile+' cm. Disposizione: '+m.larghezza+' × '+m.profondita+' cm.';
        m.serie.forEach(function(s){var p=document.createElement('p');p.textContent=s.stabilimento+' · '+s.specie+': '+s.capi+' capi, '+s.ordinari+' plateau ordinari.';el('calcolo').appendChild(p);});
        if(!m.tavoloSufficiente){var av=document.createElement('p');av.className='fej-avviso';av.textContent='La larghezza scelta non basta neppure su due file. Serve un tavolo più largo.';el('calcolo').appendChild(av);}
        el('schema').innerHTML=r.svg;
        scarica(el('stampe-materiale'),'schema_tavolo_A4.html',r.html);
      }catch(e){el('calcolo').textContent=e.message;}
    }
    aggiornaMateriale();
    function leggi(file) {
      return new Promise(function(resolve,reject){
        var r=new FileReader();r.onerror=function(){reject(new Error('File non leggibile: '+file.name));};
        r.onload=function(){
          if(String(r.result).indexOf('\ufffd')>=0){var altro=new FileReader();altro.onload=function(){resolve(String(altro.result));};altro.onerror=r.onerror;altro.readAsText(file,'windows-1252');}
          else resolve(String(r.result));
        }; r.readAsText(file,'UTF-8');
      });
    }
    el('csv').onchange=function(){
      var file=this.files[0], v=++versione;
      dati=null;el('htm').disabled=true;el('htm').value='';el('esiti').textContent='';el('a3').textContent='';el('avvisi').textContent='';aggiornaMateriale();
      if(!file){el('stato').textContent='Scegli la chiave della numerazione.';return;}
      el('stato').textContent='Lettura della numerazione…';
      var carica;
      if(/\.zip$/i.test(file.name)) {
        carica=new Promise(function(resolve,reject){var r=new FileReader();r.onerror=function(){reject(new Error('Backup non leggibile.'));};r.onload=function(){resolve(r.result);};r.readAsArrayBuffer(file);})
          .then(function(buf){return FejProgetto.leggiBackup(buf);}).then(function(P){if(!P.verifica.ok)throw new Error('Verifica del backup non riuscita: scegli una copia integra.');
            if(v===versione)unisciReti(Reti.daEventi(P.eventi),'progetto');return FejDominio.numerazioneStampe(P);});
      } else carica=leggi(file).then(function(t){return Stampe.daCsv(t);});
      usa(carica,v);
    };
    function usa(carica,v){
      carica.then(function(d){
        if(v!==versione)return;
        dati=d;el('htm').disabled=false;
        if(d.veterinari)el('veterinari').value=d.veterinari;
        if(d.verso_riempimento==='alto_basso' || d.verso_riempimento==='basso_alto')el('verso').value=d.verso_riempimento;
        aggiornaMateriale();
        el('stato').textContent='Numerazione caricata: '+dati.serie.length+' serie.';
        avvisi(el('avvisi'),dati.avvisi);
        var a3=Stampe.foglioA3(dati);
        if(a3.ok){scarica(el('a3'),'provette_contrassegni_A3.html',a3.html);var p=document.createElement('p');p.textContent=a3.fogli+' fogli A3 orizzontali · '+a3.colonne+' colonne. Apri il file scaricato per stamparlo o salvarlo come PDF.';el('a3').appendChild(p);}
        else el('a3').textContent=a3.errore;
      }).catch(function(e){if(v===versione){dati=null;el('stato').textContent=e.message;el('htm').disabled=true;}});
    };
    /* I 2/33 anche dentro uno zip (utente, 12/11: lo snippet per ARVET li scarica tutti in uno zip). Testo come leggi():
       UTF-8, e se non lo è windows-1252. */
    function testoDa(u){var t=new TextDecoder('utf-8').decode(u);return t.indexOf('\ufffd')>=0?new TextDecoder('windows-1252').decode(u):t;}
    function byte(file){return new Promise(function(resolve,reject){var r=new FileReader();r.onerror=function(){reject(new Error('File non leggibile: '+file.name));};r.onload=function(){resolve(new Uint8Array(r.result));};r.readAsArrayBuffer(file);});}
    function voci233(file){
      if(!/\.zip$/i.test(file.name))return leggi(file).then(function(t){return [{nome:file.name,testo:t}];});
      return byte(file).then(function(u){return window.FejZip.leggi(u);}).then(function(vv){
        var nomi=Object.keys(vv).filter(function(n){return /\.html?$/i.test(n)&&n.indexOf('__MACOSX')<0;}).sort();
        if(!nomi.length)throw new Error('Nello zip non ci sono file .htm del 2/33.');
        return nomi.map(function(n){return {nome:file.name+' › '+n.replace(/^.*\//,''),testo:testoDa(vv[n])};});
      });
    }
    function scaricaZip(nodo,nome,voci){
      var b=document.createElement('button');b.type='button';b.className='md-button md-button--primary';b.textContent='Scarica tutti i 2/33 precompilati ('+voci.length+' file, '+nome+')';
      b.onclick=function(){var u=URL.createObjectURL(new Blob([window.FejZip.scrivi(voci)],{type:'application/zip'})),a=document.createElement('a');a.href=u;a.download=nome;a.click();setTimeout(function(){URL.revokeObjectURL(u);},30000);};
      nodo.appendChild(b);
    }
    el('htm').onchange=function(){
      var files=Array.prototype.slice.call(this.files), v=++versione, dd=dati;
      el('esiti').textContent='';
      if(!dd)return;
      el('stato').textContent='Lettura dei 2/33…';
      Promise.all(files.map(function(file){return voci233(file).then(function(vv){return vv.map(function(x){return {nome:x.nome,r:Stampe.precompila(x.testo,dd)};});},function(e){return [{nome:file.name,r:{ok:false,errore:e.message,avvisi:[]}}];});})).then(function(gruppi){
        var rr=[].concat.apply([],gruppi);
        if(v!==versione)return;
        var ok=0, conti=Object.create(null);
        rr.forEach(function(f){if(f.r.ok){var id=f.r.stabilimento+':'+f.r.specie;conti[id]=(conti[id]||0)+1;}});
        rr.forEach(function(f){if(f.r.ok && conti[f.r.stabilimento+':'+f.r.specie]>1){f.r.ok=false;f.r.html=null;f.r.errore='Più file per la stessa serie: scegli un solo 2/33 per stabilimento e specie.';}});
        rr.forEach(function(f){
          var div=document.createElement('section');div.className='fej-riga';
          var h=document.createElement('h2');h.textContent=f.nome;div.appendChild(h);
          var p=document.createElement('p');p.textContent=f.r.ok?'Riconosciuto: '+f.r.stabilimento+' · '+f.r.specie:'Rifiutato: '+f.r.errore;div.appendChild(p);
          avvisi(div,f.r.avvisi.filter(function(a){return dd.avvisi.indexOf(a)<0;}));
          if(f.r.ok){ok++;scarica(div,'2-33_provette_'+f.r.stabilimento+'_'+f.r.specie+'.html',f.r.html);}
          el('esiti').appendChild(div);
        });
        var buoni=rr.filter(function(f){return f.r.ok;});
        if(buoni.length>1){var d=new Date(),p2=function(n){return (n<10?'0':'')+n;},cima=document.createElement('p');
          scaricaZip(cima,'2-33_provette_'+d.getFullYear()+p2(d.getMonth()+1)+p2(d.getDate())+'.zip',buoni.map(function(f){return {name:'2-33_provette_'+f.r.stabilimento+'_'+f.r.specie+'.html',data:f.r.html};}));
          el('esiti').insertBefore(cima,el('esiti').firstChild);}
        el('stato').textContent=ok+' file riconosciuti · '+(rr.length-ok)+' rifiutati.';
      });
    };
    if(opz.progetto){var pc=el('csv').closest('p');if(pc)pc.hidden=true;el('stato').textContent='Crea prima il progetto nella scheda «Crea il progetto»: la numerazione arriva da lì.';}
    return {
      /** Le reti del progetto creato nella pagina (con le password scritte là): sostituiscono quelle arrivate prima dal progetto. */
      impostaReti: function(lista){unisciReti(lista||[],'progetto');},
      /** La numerazione dallo snapshot creato nella pagina (byte dello zip fejalog-backup), al posto del CSV o del backup scelto a mano. */
      caricaBackup: function(byteZip){
        var v=++versione;
        dati=null;el('htm').disabled=true;el('htm').value='';el('esiti').textContent='';el('a3').textContent='';el('avvisi').textContent='';aggiornaMateriale();
        el('stato').textContent='Lettura della numerazione del progetto…';
        usa(Promise.resolve(byteZip).then(function(b){return FejProgetto.leggiBackup(b);}).then(function(P){if(!P.verifica.ok)throw new Error('Verifica del progetto non riuscita.');return FejDominio.numerazioneStampe(P);}),v);
      }
    };
  }
}());
