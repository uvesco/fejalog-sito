/* Configurazione sul device dalla sessione USB: solo richieste, mai eventi o password nel browser. */
(function (root) {
'use strict';
function monta(radice, pc) {
  var d = radice.ownerDocument, stato, occupato = false, scheda = 'parametri', messaggio = '', erroreAttivo = false;
  var titolo = d.querySelector('main > h1'); if (titolo) titolo.textContent = 'Progetto dal PC via USB';
  function h(tag, attrs) {
    var e = d.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? '' : String(attrs[k]));
    });
    Array.prototype.slice.call(arguments, 2).forEach(function (x) {
      (Array.isArray(x) ? x : [x]).forEach(function (v) { if (v != null) e.appendChild(typeof v === 'object' ? v : d.createTextNode(String(v))); });
    });
    return e;
  }
  function bottone(testo, azione) { return h('button', {type:'button', disabled:occupato, onclick:azione}, testo); }
  function campo(testo, valore, tipo) {
    var input = h('input', {type:tipo || 'text', value:valore == null ? '' : valore, disabled:occupato});
    return {input:input, label:h('label', null, testo + ' ', input)};
  }
  function scelta(testo, opzioni, valore) {
    var select = h('select', {disabled:occupato});
    opzioni.forEach(function (o) { select.appendChild(h('option', {value:o[0], selected:String(o[0]) === String(valore)}, o[1])); });
    return {input:select, label:h('label', null, testo + ' ', select)};
  }
  function check(testo, valore) {
    var input = h('input', {type:'checkbox', checked:!!valore, disabled:occupato});
    return {input:input, label:h('label', null, input, ' ' + testo)};
  }
  function download(nome, mime, testo) {
    var url = root.URL.createObjectURL(new root.Blob([testo], {type:mime}));
    var a = h('a', {href:url, download:nome}); d.body.appendChild(a); a.click(); a.remove(); root.URL.revokeObjectURL(url);
  }
  function errore(e) { erroreAttivo = true; messaggio = e.message; if (e.statoHttp === 403) { stato = null; root.location.reload(); } }
  function aggiorna() {
    occupato = true; disegna();
    return pc.configurazione().then(function (s) { stato = s; }, errore).then(function () { occupato = false; disegna(); });
  }
  function lavoro(p) {
    occupato = true; erroreAttivo = false; disegna();
    return p.then(function (r) { if (!r.ok) throw Error(r.messaggio); messaggio = r.messaggio || 'Anteprima pronta sul device e sul PC.'; }, errore)
      .then(function () { return pc.configurazione(); }).then(function (s) { stato = s; }, errore)
      .then(function () { occupato = false; disegna(); });
  }
  function invia(azione, dati) { return lavoro(pc.configura(Object.assign({azione:azione}, dati || {}))); }
  function salvaForm(el, invio) { el.addEventListener('submit', function (ev) { ev.preventDefault(); if (!occupato) invio(); }); return el; }
  function form() { return h('form', {class:'fej-form'}); }
  function parametri() {
    var f = form(), campi = {}, opzioni = {
      lettere_specie:[['','Da scegliere'],['solo_c','Solo capre (C)'],['solo_p','Solo pecore (P)'],['entrambe','Ambedue (C e P)']],
      verso_riempimento:[['alto_basso','Dall’alto verso il basso'],['basso_alto','Dal basso verso l’alto']]
    };
    if (!stato.due_specie) opzioni.lettere_specie.push(['nessuna','Nessuna']);
    [['eta_diagnostica_mesi','Età diagnostica'],['lettere_specie','Lettere di specie'],['verso_riempimento','Verso di riempimento'],
      ['backup_ogni_eventi','Backup ogni quanti eventi'],['passo_cifra_tonda','Cifra tonda (0 per disattivarla)']].forEach(function (r) {
      var c = opzioni[r[0]] ? scelta(r[1],opzioni[r[0]],stato[r[0]]) : campo(r[1],stato[r[0]],'number');
      c.input.required = true;
      if (!opzioni[r[0]]) { c.input.min = r[0] === 'backup_ogni_eventi' ? 1 : 0; if(r[0]!=='eta_diagnostica_mesi') c.input.max = 10000; c.input.step = 1; }
      campi[r[0]] = c.input; f.appendChild(h('p',null,c.label));
    });
    [['smarriti_in_serie','Smarriti in serie'],['rubati_in_serie','Rubati in serie'],['copia_backup','Copia i backup nella cartella del progetto'],
      ['copia_uscite','Copia le uscite nella cartella del progetto'],['chiudi_buchi','Chiudi i buchi nel Riordino'],['cerchietto_principale','Cerchietto anche sul principale (con più stabilimenti)']].forEach(function (r) {
      var c = check(r[1],stato[r[0]]); campi[r[0]] = c.input; f.appendChild(h('p',null,c.label));
    });
    f.appendChild(h('p',null,'All’avvio si congelano i parametri di numerazione. Cartelle e credenziali si gestiscono sul device.'));
    f.appendChild(h('button',{type:'submit',disabled:occupato},'Salva parametri'));
    salvaForm(f,function () {
      var valori = {}; Object.keys(campi).forEach(function (k) { var c=campi[k]; valori[k] = c.type==='checkbox' ? c.checked : c.type==='number' || k==='eta_diagnostica_mesi' ? Number(c.value) : c.value; });
      invia('parametri',{valori:valori});
    });
    var box=h('section',null,h('h2',null,'Parametri e regole'),f,h('h3',null,'Soluzioni dei problematici'));
    (stato.regole || []).forEach(function (r) {
      var sol=scelta(r.nome,[['regola','Regola predefinita']].concat(r.soluzioni || []),r.soluzione);
      box.appendChild(h('p',null,sol.label,' ',bottone('Salva regola',function () { invia('regola',{tipo:r.codice,soluzione:sol.input.value}); })));
    }); return box;
  }
  function dati() {
    var tipo=scelta('Contenuto',[['bdn','Registri e contrassegni BDN (anche ZIP)'],['ricercati','Capi ricercati CSV']],'bdn');
    var file=campo('File dal PC','','file'); file.input.multiple=true;
    var box=h('section',null,h('h2',null,'Dati d’ingresso'),h('p',null,'Massimo 8 MiB per file; ZIP fino a 24 MiB decompressi. Il device riconosce i file e prepara l’anteprima. La conferma salva nuovi eventi.'),tipo.label,h('p',null,file.label));
    box.appendChild(bottone('Carica e mostra anteprima',function () {
      var files=Array.prototype.slice.call(file.input.files || []), t=tipo.input.value;
      if (!files.length) { messaggio='Scegli almeno un file.'; disegna(); return; }
      if (t!=='bdn' && files.length>1) { messaggio='Per questo contenuto scegli un file alla volta.'; disegna(); return; }
      if (files.some(function (f) { return f.size>8*1024*1024; })) { messaggio='File troppo grande (massimo 8 MiB).'; disegna(); return; }
      occupato=true; disegna();
      var p=Promise.resolve(); files.forEach(function (f) { p=p.then(function () { return pc.fileIngresso(t,f); }).then(function (r) { if(!r.ok) throw Error(r.messaggio); }); });
      lavoro(p.then(function () { return {ok:true,messaggio:'Anteprima pronta. Controlla e conferma l’importazione.'}; }));
    }));
    var a=stato.anteprima;
    if (a) {
      box.appendChild(h('h3',null,'Anteprima sul device'));
      box.appendChild(h('ul',null,(a.righe || []).map(function (r) { return h('li',null,r); })));
      (a.file || []).filter(function(f){return f.tipo==='MARCHE';}).forEach(function (f) {
        var sp=scelta('Specie di '+f.nome,[['','Da scegliere'],['pecore','Pecore'],['capre','Capre']],f.specie);
        box.appendChild(h('p',null,sp.label,' ',bottone('Applica specie',function () { invia('specie_file',{indice:f.indice,specie:sp.input.value}); })));
      });
      var importa=bottone('Conferma importazione',function () { invia('importa',{id:a.id}); }); importa.disabled=occupato || !a.confermabile;
      box.appendChild(h('p',null,importa,' ',bottone('Svuota anteprima',function(){invia('svuota');})));
    }
    box.appendChild(h('p',null,stato.esito || ''));
    return box;
  }
  function sigle() {
    var box=h('section',null,h('h2',null,'Sigle stabilimenti e veterinari'));
    var principale=scelta('Stabilimento principale',stato.stabilimenti.map(function(s){return [s.codice,s.codice+' '+s.denominazione];}),stato.principale);
    box.appendChild(h('p',null,principale.label,' ',bottone('Salva principale',function(){invia('principale',{codice:principale.input.value});})));
    stato.stabilimenti.forEach(function(s){
      var lettera=campo(s.codice+' '+s.cerchietto+' · Lettera',s.lettera);lettera.input.maxLength=1;
      if(stato.stabilimenti.length>1)box.appendChild(h('p',null,lettera.label,' ',bottone('Modifica',function(){invia('stabilimento',{codice:s.codice,lettera:lettera.input.value});})));
    });
    if(!stato.veterinari.length)box.appendChild(h('p',null,'L’elenco dei veterinari entra nel pacchetto quando si crea il progetto (scheda Nuovo progetto, fuori progetto).'));
    stato.veterinari.forEach(function(v){
      var sigla=campo(v.nome+' · Sigla',v.sigla || v.proposta);sigla.input.maxLength=2;
      box.appendChild(h('p',null,sigla.label,' ',bottone('Modifica',function(){invia('veterinario',{persona:v.persona,sigla:sigla.input.value});})));
    });return box;
  }
  function rete() {
    var op=[['','Nessuna']].concat((stato.reti || []).map(function(r){return [r,r];}));
    var principale=scelta('Rete principale',op,stato.rete_principale), riserva=scelta('Rete di riserva',op,stato.rete_riserva);
    return h('section',null,h('h2',null,'Rete del progetto'),h('p',null,'Scegli le reti già salvate sul device. Le password restano sul dispositivo Android. Per aggiungere una rete usa le impostazioni del device.'),
      h('p',null,principale.label),h('p',null,riserva.label),bottone('Salva reti',function(){invia('reti',{principale:principale.input.value,riserva:riserva.input.value});}));
  }
  function stampe() {
    var box=h('section',null,h('h2',null,'Numerazione e stampe'));
    box.appendChild(bottone('Scarica tabella della numerazione CSV',function(){pc.numerazione().then(function(t){download('numerazione_chiave.csv','text/csv;charset=utf-8',t);},errore);}));
    function stampa(nome,r){if(!r.ok){messaggio=r.errore;disegna();return;}download(nome,'text/html;charset=utf-8',r.html);}
    box.appendChild(h('p',null,bottone('Scarica foglio A3',function(){stampa('provette_contrassegni_A3.html',root.Stampe.foglioA3(stato.numerazione));}),' ',
      bottone('Scarica foglio generico 1–100',function(){stampa('foglio_riempimento_1-100.html',root.Stampe.foglioRiempimento(stato.verso));})));
    var file=campo('2/33 di ARVET (.htm)','','file');file.input.accept='.htm,.html';
    box.appendChild(h('h3',null,'2/33 precompilato'));box.appendChild(file.label);
    box.appendChild(bottone('Precompila e scarica',function(){
      var f=file.input.files[0]; if(!f)return;
      if(f.size>8*1024*1024){messaggio='File troppo grande.';disegna();return;}
      var r=new root.FileReader();r.onload=function(){stampa('2-33_precompilato.html',root.Stampe.precompila(String(r.result),stato.numerazione));};
      r.onerror=function(){messaggio='Non riesco a leggere il 2/33.';disegna();};r.readAsText(f);
    }));return box;
  }
  function checklist() {
    var box=h('section',null,h('h2',null,'Checklist e avvio'),h('ul',null,stato.checklist.map(function(r){return h('li',null,r.titolo+': '+(r.pronto?'pronto':'da completare'));})));
    box.appendChild(h('p',null,'Per passare la regia al tablet, completa la Checklist, fai entrare il tablet col QR e cedi la regia dall’A55. Avvia poi dal tablet.'));
    box.appendChild(h('p',null,'Il campionamento si avvia dal tablet, dalla Checklist: così si salvano anche la chiave dei numeri e il backup.'));return box;
  }
  function nuovo() {
    var box=h('section',null,h('h2',null,'Nuovo progetto'),
      h('p',null,'Il device crea il progetto e poi lo configuri da qui. Veterinari conservati sul device: '+(stato.veterinari||0)+'.'));
    function caricaFile(tipo,f,aggiungi){
      if(!f||!f.length){messaggio='Scegli almeno un file.';disegna();return Promise.resolve();}
      occupato=true;disegna();
      var p=Promise.resolve();Array.prototype.slice.call(f).forEach(function(x){p=p.then(function(){return pc.fileIngresso(tipo,x);}).then(function(r){if(!r.ok)throw Error(r.messaggio);});});
      return lavoro(p.then(function(){return {ok:true,messaggio:'Anteprima pronta sul device.'};}));
    }
    var vet=campo('Elenco veterinari CSV (id;cognome;nome;codice_fiscale)','','file');
    box.appendChild(h('h3',null,'Elenco dei veterinari'));box.appendChild(h('p',null,vet.label,' ',bottone('Conserva sul device',function(){caricaFile('veterinari',vet.input.files);})));
    var cod=campo('Codici degli stabilimenti (il primo è il principale)',''),dat=campo('Data (AAAA-MM-GG)',stato.oggi||''),des=campo('Descrizione','');
    var fv=form();fv.appendChild(h('h3',null,'Progetto vuoto'));[cod,dat,des].forEach(function(c){fv.appendChild(h('p',null,c.label));});
    fv.appendChild(h('button',{type:'submit',disabled:occupato},'Crea progetto vuoto'));
    salvaForm(fv,function(){invia('crea',{da:'vuoto',codici:cod.input.value,data:dat.input.value,descrizione:des.input.value});});box.appendChild(fv);
    var bd=campo('File BDN (registri, contrassegni, ZIP)','','file');bd.input.multiple=true;
    var ric=campo('Capi ricercati CSV (facoltativo)','','file');
    box.appendChild(h('h3',null,'Dai file BDN'));box.appendChild(h('p',null,bd.label,' ',bottone('Carica',function(){caricaFile('bdn',bd.input.files);})));
    box.appendChild(h('p',null,ric.label,' ',bottone('Carica ricercati',function(){caricaFile('ricercati',ric.input.files);})));
    var a=stato.anteprima;
    if(a){box.appendChild(h('ul',null,(a.righe||[]).map(function(r){return h('li',null,r);})));
      (a.file||[]).filter(function(f){return f.tipo==='MARCHE';}).forEach(function(f){
        var sp=scelta('Specie di '+f.nome,[['','Da scegliere'],['pecore','Pecore'],['capre','Capre']],f.specie);
        box.appendChild(h('p',null,sp.label,' ',bottone('Applica specie',function(){invia('specie_file',{indice:f.indice,specie:sp.input.value});})));});}
    box.appendChild(h('p',null,bottone('Crea dai file BDN',function(){invia('crea',{da:'bdn'});}),' ',bottone('Svuota anteprima',function(){invia('svuota');})));
    var pk=campo('Pacchetto di svet-tools (JSON)','','file');
    box.appendChild(h('h3',null,'Da pacchetto di svet-tools'));
    box.appendChild(h('p',null,pk.label,' ',bottone('Carica pacchetto',function(){caricaFile('pacchetto',pk.input.files);}),' ',bottone('Crea dal pacchetto',function(){invia('crea',{da:'pacchetto'});})));
    box.appendChild(h('p',null,stato.esito||''));return box;
  }
  function disegna() {
    radice.textContent='';
    var msg=h('div',{role:'status',class:'fej-msg',tabindex:'-1'},messaggio || (occupato?'Operazione in corso…':''));
    radice.appendChild(msg);
    if(erroreAttivo && !occupato){msg.setAttribute('role','alert');msg.focus();}
    if(!stato){radice.appendChild(h('p',null,'Caricamento della configurazione…'));return;}
    if(stato.fuori_progetto){
      if(stato.modifiche_accettate===false){radice.appendChild(h('p',null,'Sul device premi «Accetta le modifiche dal PC per questa sessione», poi Aggiorna dal device.'));radice.appendChild(bottone('Aggiorna dal device',aggiorna));return;}
      radice.appendChild(nuovo());return;
    }
    radice.appendChild(h('p',null,stato.data+' · '+stato.descrizione));
    radice.appendChild(bottone('Aggiorna dal device',aggiorna));
    if(stato.modifiche_accettate===false){radice.appendChild(h('p',null,'Sul device premi «Accetta le modifiche dal PC per questa sessione», poi Aggiorna dal device.'));return;}
    if(stato.avviato){
      radice.appendChild(h('p',null,'Configurazione conclusa. Il campionamento si svolge sui dispositivi. A campionamento chiuso puoi usare la Gestione dal PC.'));
      radice.appendChild(bottone('Apri la pagina della fase corrente',function(){root.location.reload();}));return;
    }
    var tabs=h('div',{class:'fej-tabs',role:'tablist'});
    [['parametri','Parametri e regole'],['dati','Dati'],['sigle','Sigle'],['rete','Rete'],['stampe','Stampe'],['checklist','Checklist e avvio']].forEach(function(s){
      tabs.appendChild(h('button',{type:'button',role:'tab','aria-selected':scheda===s[0]?'true':'false',class:scheda===s[0]?'fej-tab fej-attiva':'fej-tab',disabled:occupato,
        onclick:function(){scheda=s[0];disegna();}},s[1]));
    });radice.appendChild(tabs);
    var corpo=h('div',{class:'fej-corpo'});corpo.appendChild({parametri:parametri,dati:dati,sigle:sigle,rete:rete,stampe:stampe,checklist:checklist}[scheda]());radice.appendChild(corpo);
  }
  aggiorna();
}
root.FejConfigurazionePc={monta:monta};
})(typeof self !== 'undefined' ? self : this);
