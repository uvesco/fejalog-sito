/* Interfaccia delle stampe: gli HTML sono prodotti solo da stampe.js, identico all'app. */
(function () {
  'use strict';
  var root = document.getElementById('fejalog-prima');
  if (!root) return;
  var base = document.currentScript.src.replace(/[^/]*$/, '');
  var elenco=['vendor/fejalog-shared.js','dominio.js','vendor/qrcode.js','vendor/stampe.js','vendor/xlsx.js','zip.js','registro.js','progetto.js'];
  (function avanti(i){
    if(i===elenco.length){avvia();return;}
    var script=document.createElement('script');script.src=base+elenco[i];
    script.onload=function(){avanti(i+1);};script.onerror=function(){root.textContent='Non riesco a caricare il motore delle stampe.';};document.head.appendChild(script);
  })(0);
  function avvia() {
    root.innerHTML = '<div class="fej-form"><p><label>Chiave della numerazione (CSV) o backup (ZIP)<input id="prima-csv" type="file" accept=".csv,.zip,text/csv,application/zip"></label></p>' +
      '<p><label>2/33 di ARVET (.htm, anche più file)<input id="prima-htm" type="file" accept=".htm,.html,text/html" multiple disabled></label></p></div>' +
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
    el('materiale').innerHTML='<h2>Materiale</h2><p>Tutti i plateau ordinari devono stare sul tavolo nel Riordino. La scorta dei problematici resta fuori tavolo.</p><div id="prima-parametri" class="fej-form">'+
      '<p><label>Verso di riempimento dei plateau<select id="prima-verso"><option value="alto_basso">Dall’alto verso il basso (predefinito: 1 in alto a sinistra)</option><option value="basso_alto">Dal basso verso l’alto (1 in basso a sinistra)</option></select></label></p>'+
      '</div><div id="prima-calcolo" role="status" aria-live="polite"></div><div id="prima-schema"></div><div id="prima-stampe-materiale"></div>'+
      '<h3>Wi-Fi per il foglio d’ingresso</h3><p>SSID e password restano nella pagina e vengono inseriti solo nel foglio richiesto.</p><div class="fej-form">'+
      '<p><label>Nome della rete (SSID)<input id="prima-ssid" type="text" autocomplete="off"></label></p>'+
      '<p><label>Tipo di rete<select id="prima-tipo"><option value="WPA">WPA</option><option value="nopass">Aperta, senza password</option></select></label></p>'+
      '<p><label>Password Wi-Fi<input id="prima-password" type="password" autocomplete="off"></label></p></div><div id="prima-wifi-stato" role="status"></div><div id="prima-wifi"></div>';
    campi.forEach(function(c){var p=document.createElement('p'),l=document.createElement('label'),i=document.createElement('input');l.textContent=c[1];i.id='prima-'+c[0];i.type='number';i.value=c[2];i.min=c[3];i.max=c[4];i.step=1;i.oninput=aggiornaMateriale;l.appendChild(i);p.appendChild(l);el('parametri').appendChild(p);});
    el('verso').onchange=aggiornaMateriale;
    function aggiornaWifi(){
      el('wifi').textContent='';el('wifi-stato').textContent='';el('password').disabled=el('tipo').value==='nopass';
      if(!el('ssid').value.trim())return;
      var r=Stampe.foglioWifi({ssid:el('ssid').value,tipo:el('tipo').value,password:el('password').value});
      if(r.ok)scarica(el('wifi'),'rete_wifi_A4.html',r.html);else el('wifi-stato').textContent=r.errore;
    }
    ['ssid','password','tipo'].forEach(function(n){el(n).oninput=aggiornaWifi;});
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
        el('calcolo').textContent=r.riassunto+' '+m.veterinari+' veterinari · '+m.pennarelli+' pennarelli. '+m.ordinari+' plateau ordinari; problematici '+m.problematiciUso+' in uso + '+m.problematiciScorta+' di scorta fuori tavolo. Totale da portare: '+m.plateauTotali+'. Una fila: '+m.larghezzaUnaFila+' cm; due file: '+m.larghezzaDueFile+' cm. Disposizione: '+m.larghezza+' × '+m.profondita+' cm.';
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
          .then(function(buf){return FejProgetto.leggiBackup(buf);}).then(function(P){if(!P.verifica.ok)throw new Error('Verifica del backup non riuscita: scegli una copia integra.');return FejDominio.numerazioneStampe(P);});
      } else carica=leggi(file).then(function(t){return Stampe.daCsv(t);});
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
    el('htm').onchange=function(){
      var files=Array.prototype.slice.call(this.files), v=++versione, dd=dati;
      el('esiti').textContent='';
      if(!dd)return;
      el('stato').textContent='Lettura dei 2/33…';
      Promise.all(files.map(function(file){return leggi(file).then(function(t){return {nome:file.name,r:Stampe.precompila(t,dd)};},function(e){return {nome:file.name,r:{ok:false,errore:e.message,avvisi:[]}};});})).then(function(rr){
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
        el('stato').textContent=ok+' file riconosciuti · '+(rr.length-ok)+' rifiutati.';
      });
    };
  }
}());
