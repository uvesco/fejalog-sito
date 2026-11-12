/* =============================================================================
 * FEJALOG SIMULATORE — il gregge a schermo e il tutorial a slide
 * Il sito fa una cosa sola nella simulazione (utente, 2026-11-11): dopo lo snapshot creato sul sito (o un backup, o
 * «Di prova») e le percentuali di errore, presenta gli animali uno alla volta, come se si prendessero dal gregge; il
 * veterinario li registra sul suo device vero (app vera, tablet Regia vero, Wi-Fi vera). Niente parti dell'app o della
 * rete imitate qui. Alla fine la chiave delle soluzioni, da confrontare col backup della Regia.
 * ============================================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./code128.js'),
      require('./progetto.js'),
      require('./zip.js'),
      require('./registro.js'),
      require('./dominio.js')
    );
  } else {
    root.FejSimulatore = factory(
      root.FejCode128,
      root.FejProgetto,
      root.FejZip,
      root.FejRegistro,
      root.FejDominio
    );
  }
})(typeof self !== 'undefined' ? self : this, function (Code128, Progetto, Zip, Registro, Dominio) {
  'use strict';

  /* PRNG deterministico Mulberry32 con seme */
  function creaRng(seme) {
    var s = 0;
    if (typeof seme === 'number') s = seme >>> 0;
    else if (typeof seme === 'string') {
      for (var i = 0; i < seme.length; i++) s = (Math.imul(31, s) + seme.charCodeAt(i)) >>> 0;
    } else {
      s = 123456789;
    }
    return function () {
      s |= 0; s = s + 0x6D2B79F5 | 0;
      var t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function mescola(arr, rng) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  /* Calcolo del codice elettronico da contrassegno (16 cifre come nelle schede del kit) */
  function calcolaElettronico(contrassegno) {
    var c = String(contrassegno || '').toUpperCase().trim();
    if (c.indexOf('IT') === 0) {
      var cifre = c.slice(2).replace(/[^0-9]/g, '');
      while (cifre.length < 12) cifre = '0' + cifre;
      return '0380' + cifre.slice(-12);
    }
    if (c.indexOf('FR') === 0) {
      var cifreFr = c.slice(2).replace(/[^0-9]/g, '');
      while (cifreFr.length < 12) cifreFr = '0' + cifreFr;
      return '0250' + cifreFr.slice(-12);
    }
    return '0380' + (c.replace(/[^0-9]/g, '') + '000000000000').slice(0, 12);
  }

  /* Estrazione capi dal pacchetto: presenti degli stabilimenti di lavoro e degli altri stabilimenti nei registri,
     marche disponibili, usciti (col motivo BDN), ricercati. */
  function estraiCapiPacchetto(pacchetto) {
    var pecore = (pacchetto.specie_dati && pacchetto.specie_dati.pecore) || {};
    var capre = (pacchetto.specie_dati && pacchetto.specie_dati.capre) || {};
    var lavoro = {};
    ((pacchetto.config && pacchetto.config.stabilimenti_lavoro) || []).forEach(function (st) { lavoro[st.codice] = true; });
    var senzaLavoro = !Object.keys(lavoro).length;
    var presenti = [], altri = [];
    function aggiungi(c, specie, razzaDefault) {
      var capo = {
        contrassegno: c.contrassegno,
        specie: specie,
        sesso: c.sesso || 'F',
        razza: c.razza || razzaDefault,
        data_nascita: c.data_nascita || '01/01/2022',
        elettronico: c.codice_elettronico || calcolaElettronico(c.contrassegno),
        codice_stabilimento: c.codice_stabilimento || ''
      };
      if (senzaLavoro || lavoro[capo.codice_stabilimento]) presenti.push(capo); else altri.push(capo);
    }
    (pecore.presenti || []).forEach(function (c) { aggiungi(c, 'pecore', 'BIE'); });
    (capre.presenti || []).forEach(function (c) { aggiungi(c, 'capre', 'CAM'); });
    function usciti(lista, specie) {
      return (lista || []).map(function (u) {
        return {
          contrassegno: u.contrassegno, specie: specie, sesso: u.sesso || 'F', razza: u.razza || (specie === 'capre' ? 'CAM' : 'BIE'),
          data_nascita: u.data_nascita || '12/04/2020', motivo: String(u.motivo_uscita || u.motivo || '').toUpperCase(),
          codice_stabilimento: u.codice_stabilimento || ''
        };
      });
    }
    var disponibili = [].concat((pecore.disponibili || []).map(function (m) { return { contrassegno: m.contrassegno, specie: 'pecore' }; }))
      .concat((capre.disponibili || []).map(function (m) { return { contrassegno: m.contrassegno, specie: 'capre' }; }));
    var ricercati = {};
    (pacchetto.ricercati || []).forEach(function (r) { if (r && r.codice) ricercati[String(r.codice).toUpperCase()] = r; });
    return { presenti: presenti, altri: altri, disponibili: disponibili, usciti: usciti(pecore.usciti, 'pecore').concat(usciti(capre.usciti, 'capre')), ricercati: ricercati };
  }

  /* Profilo degli errori predefinito: le prime voci dal profilo realistico; le voci in STIME sono valori di base
     piccoli, dichiarati come stima (non vengono dalla prova reale). Percentuali sui capi in età degli stabilimenti di
     lavoro; le voci che pescano altrove (usciti, marche, altri stabilimenti, ricercati) si fermano a quanto c'è. */
  var STIME = ['bolo_mancante', 'sesso_sbagliato', 'razza_diversa', 'marca_disponibile', 'altro_stabilimento', 'rubato', 'sotto_eta', 'ricercato'];
  var PROFILO_DEFAULT = {
    formato: 'fejalog-profilo-errori',
    versione: 2,
    nome: 'profilo realistico',
    percentuali: {
      doppio: 1.0,
      non_in_elenco: 1.1,
      smarrito: 0.6,
      uscito: 0.7,
      contrassegno_sbagliato: 2.0,
      marca_da_sostituire_dx: 3.0,
      marca_da_sostituire_sx: 2.0,
      bolo: 0.0,
      senza_orecchini: 0.5,
      non_campionato: 5.0,
      annullata: 1.0,
      bolo_mancante: 0.2,
      sesso_sbagliato: 0.5,
      razza_diversa: 0.5,
      marca_disponibile: 0.3,
      altro_stabilimento: 0.3,
      rubato: 0.2,
      sotto_eta: 1.5,
      ricercato: 0.3
    },
    stime: STIME.slice()
  };
  /* Le fattispecie, con la descrizione a schermo e la soluzione attesa sul device vero. */
  var FATTISPECIE = {
    normale: { titolo: 'Capo regolare', atteso: 'Leggi il barcode dell’orecchino destro col lettore, o digita le ultime cifre del sinistro sul palmare; conferma.' },
    marca_da_sostituire_dx: { titolo: 'Orecchino destro mancante o illeggibile', atteso: 'Digita le cifre dell’orecchino sinistro; nel foglio segna «orecchino DX da sostituire».' },
    marca_da_sostituire_sx: { titolo: 'Orecchino sinistro mancante o illeggibile', atteso: 'Leggi il barcode dell’orecchino destro; nel foglio segna «orecchino SX da sostituire».' },
    bolo: { titolo: 'Bolo endoruminale', atteso: 'Il transponder è nel bolo: leggi il barcode sull’addome (o digita le cifre del sinistro).' },
    bolo_mancante: { titolo: 'Bolo mancante o illeggibile', atteso: 'Né transponder auricolare né bolo leggibile: digita le cifre del sinistro e segna «bolo da sostituire».' },
    senza_orecchini: { titolo: 'Senza orecchini, non identificato', atteso: 'Niente da leggere: registra come «senza contrassegno» con specie, sesso, dentizione, razza stimata e segno provvisorio; si risolve dopo la chiusura.' },
    contrassegno_sbagliato: { titolo: 'Cifre dell’orecchino sinistro abrase', atteso: 'Le cifre si leggono male: controlla sul capo, preferisci il barcode del destro; se le cifre portano a un capo diverso l’app lo mostra, verifica prima di confermare.' },
    doppio: { titolo: 'Doppio: capo già prelevato', atteso: 'L’app dice «DOPPIO CONTRASSEGNO: provetta … prelevata da …»: scegli «Già fatto: non prelevare», o «Preleva come doppio» se davvero serve.' },
    uscito: { titolo: 'Uscito in BDN, ma è nel gregge', atteso: 'Il capo risulta uscito (venduto, macellato…): l’app lo mette fra i fuori registro; preleva e scrivi tutto sulla provetta.' },
    smarrito: { titolo: 'Smarrito in BDN', atteso: 'Uscito per smarrimento (W): fuori registro, scrivi il contrassegno completo sulla provetta.' },
    rubato: { titolo: 'Rubato in BDN', atteso: 'Uscito per furto (H/F): fuori registro, scrivi il contrassegno completo sulla provetta.' },
    altro_stabilimento: { titolo: 'Registrato in un altro stabilimento', atteso: 'Banda viola: capo di un altro stabilimento nei registri; fuori registro (o DDA se c’è il documento).' },
    marca_disponibile: { titolo: 'Marca disponibile, mai registrata', atteso: 'Contrassegno assegnato ma mai applicato in BDN (banda blu): sesso, razza e nascita obbligatori; fuori registro.' },
    non_in_elenco: { titolo: 'Contrassegno in nessun registro', atteso: 'Non in elenco: inserimento forzato con sesso, razza e nascita; fuori registro, scrivi tutto sulla provetta.' },
    sotto_eta: { titolo: 'Sotto l’età diagnostica', atteso: 'Capo giovane, senza numero: di norma non si preleva; se lo fai va fra i fuori registro (fuori età).' },
    sesso_sbagliato: { titolo: 'Sesso diverso dalla BDN', atteso: 'L’animale non è del sesso che dice la BDN: registra e nel foglio segna il sesso corretto.' },
    razza_diversa: { titolo: 'Razza diversa dalla BDN', atteso: 'La razza osservata non è quella in BDN: registra e scrivilo nelle note (serve all’allevatore per la BDN).' },
    ricercato: { titolo: 'Capo ricercato', atteso: 'L’app avvisa (banner viola, vibrazione) con il motivo e cosa fare (marcare, isolare): fallo, poi conferma.' },
    annullata: { titolo: 'Provetta rotta o emolizzata', atteso: 'Registra, poi annulla la provetta da Ultime e ripeti il prelievo: la nuova va fra i fuori registro.' },
    non_campionato: { titolo: 'Capo del registro rimasto nel gregge', atteso: 'Non compare a schermo: resterà fra i non prelevati.' }
  };
  var DENTIZIONI = ['denti da latte', '2 denti permanenti', '4 denti permanenti', '6 denti permanenti', 'bocca piena', 'bocca consumata'];
  var SEGNI = ['spray blu sul dorso n. 3', 'orecchino provvisorio ASL n. 12', 'collare rosso', 'spray verde sul collo n. 8', 'numero 21 sulla schiena'];

  /* Il gregge a schermo, diviso fra n schermi (gli schermi mostrano gli animali: non sono device).
     opzioni.etaMesi: l'età diagnostica del progetto (0 = tutti), per i capi sotto età; opzioni.dataRiferimento la data del progetto. */
  function generaGregge(pacchetto, profilo, seme, nTotaleSchermi, opzioni) {
    profilo = profilo || PROFILO_DEFAULT;
    opzioni = opzioni || {};
    var perc = (profilo && profilo.percentuali) || PROFILO_DEFAULT.percentuali;
    var rng = creaRng(seme);
    nTotaleSchermi = Math.max(1, parseInt(nTotaleSchermi || 1, 10));
    var etaMesi = parseInt(opzioni.etaMesi || 0, 10) || 0;
    var riferimento = opzioni.dataRiferimento || (pacchetto.sessione && pacchetto.sessione.data) || '';

    var dati = estraiCapiPacchetto(pacchetto);
    var inEta = function (c) {
      if (!etaMesi || !riferimento || !Dominio || !Dominio.inEta) return true;
      try { return Dominio.inEta(c.data_nascita, riferimento, etaMesi) === true; } catch (e) { return true; }
    };
    var capiBase = dati.presenti.filter(inEta);
    var capiGiovani = dati.presenti.filter(function (c) { return !inEta(c); });
    if (!capiBase.length && !dati.presenti.length) {
      // Fallback gregge sintetico se vuoto
      for (var b = 1; b <= 100; b++) {
        var cod = 'IT06600000' + (b < 10 ? '00' : (b < 100 ? '0' : '')) + b;
        capiBase.push({
          contrassegno: cod, specie: (b <= 80 ? 'pecore' : 'capre'), sesso: (b % 15 === 0 ? 'M' : 'F'),
          razza: (b <= 80 ? 'BIE' : 'CAM'), data_nascita: '15/03/2021', elettronico: calcolaElettronico(cod), codice_stabilimento: ''
        });
      }
    }

    var N = capiBase.length;
    function quota(nome) {
      var p = (perc[nome] != null) ? perc[nome] : 0;
      return Math.round(N * p / 100.0);
    }

    var nNonCampionato = quota('non_campionato');
    var nDoppio = quota('doppio');
    var nNonInElenco = quota('non_in_elenco');
    var nSmarrito = quota('smarrito');
    var nUscito = quota('uscito');
    var nRubato = quota('rubato');
    var nContrSbagliato = quota('contrassegno_sbagliato');
    var nDxMancante = quota('marca_da_sostituire_dx');
    var nSxMancante = quota('marca_da_sostituire_sx');
    var nBolo = quota('bolo');
    var nBoloMancante = quota('bolo_mancante');
    var nSenzaOrecchini = quota('senza_orecchini');
    var nAnnullata = quota('annullata');
    var nSessoSbagliato = quota('sesso_sbagliato');
    var nRazzaDiversa = quota('razza_diversa');
    var nMarcaDisponibile = quota('marca_disponibile');
    var nAltroStabilimento = quota('altro_stabilimento');
    var nSottoEta = quota('sotto_eta');
    var nRicercato = quota('ricercato');

    var shuffled = mescola(capiBase.slice(), rng);
    var indice = 0;
    function prelevaCapi(q) {
      var res = [];
      for (var i = 0; i < q && indice < shuffled.length; i++) res.push(shuffled[indice++]);
      return res;
    }
    function base(c, fattispecie, extra) {
      var capo = {
        contrassegno: c.contrassegno, specie: c.specie, sesso: c.sesso, razza: c.razza, data_nascita: c.data_nascita,
        elettronico: c.elettronico, codice_stabilimento: c.codice_stabilimento || '',
        fattispecie: fattispecie, titolo: FATTISPECIE[fattispecie].titolo, atteso: FATTISPECIE[fattispecie].atteso,
        orecchino_dx_presente: true, orecchino_sx_presente: true, bolo: false, bolo_mancante: false, senza_orecchini: false,
        contrassegno_usurato: false, annullata: false, sesso_mostrato: c.sesso, razza_mostrata: c.razza
      };
      Object.keys(extra || {}).forEach(function (k) { capo[k] = extra[k]; });
      return capo;
    }

    // 1. I ricercati del pacchetto presenti in età: sono i primi ad avere la loro fattispecie
    var ricercatiPresenti = shuffled.filter(function (c) { return dati.ricercati[String(c.contrassegno).toUpperCase()]; });
    var capiRicercati = [];
    ricercatiPresenti.slice(0, nRicercato).forEach(function (c) {
      var i = shuffled.indexOf(c);
      if (i >= indice) { shuffled.splice(i, 1); shuffled.splice(indice++, 0, c); capiRicercati.push(c); }
    });
    // 2. Capi non campionati (non compaiono a schermo, ma restano nella chiave)
    var capiNonCampionati = prelevaCapi(nNonCampionato);
    // 3. Capi con anomalie fisiche o anagrafiche
    var capiDxMancante = prelevaCapi(nDxMancante);
    var capiSxMancante = prelevaCapi(nSxMancante);
    var capiBolo = prelevaCapi(nBolo);
    var capiBoloMancante = prelevaCapi(nBoloMancante);
    var capiSenzaOrecchini = prelevaCapi(nSenzaOrecchini);
    var capiContrSbagliato = prelevaCapi(nContrSbagliato);
    var capiAnnullata = prelevaCapi(nAnnullata);
    var capiSessoSbagliato = prelevaCapi(nSessoSbagliato);
    var capiRazzaDiversa = prelevaCapi(nRazzaDiversa);
    // 4. Capi normali rimanenti
    var capiNormali = [];
    while (indice < shuffled.length) capiNormali.push(shuffled[indice++]);

    var gregge = [];
    capiNormali.forEach(function (c) { gregge.push(base(c, 'normale')); });
    capiRicercati.forEach(function (c) {
      var r = dati.ricercati[String(c.contrassegno).toUpperCase()] || {};
      gregge.push(base(c, 'ricercato', { ricercato_nota: r.nota || '', ricercato_azione: r.azione || '' }));
    });
    capiDxMancante.forEach(function (c) { gregge.push(base(c, 'marca_da_sostituire_dx', { orecchino_dx_presente: false })); });
    capiSxMancante.forEach(function (c) { gregge.push(base(c, 'marca_da_sostituire_sx', { orecchino_sx_presente: false })); });
    capiBolo.forEach(function (c) { gregge.push(base(c, 'bolo', { orecchino_dx_presente: false, bolo: true })); });
    capiBoloMancante.forEach(function (c) { gregge.push(base(c, 'bolo_mancante', { orecchino_dx_presente: false, bolo_mancante: true })); });
    capiSenzaOrecchini.forEach(function (c, idx) {
      gregge.push(base(c, 'senza_orecchini', {
        elettronico: null, orecchino_dx_presente: false, orecchino_sx_presente: false, senza_orecchini: true,
        dentizione: DENTIZIONI[idx % DENTIZIONI.length], razza_mostrata: (idx % 3 === 0 ? 'MET' : c.razza), segno_provvisorio: SEGNI[idx % SEGNI.length]
      }));
    });
    capiContrSbagliato.forEach(function (c) { gregge.push(base(c, 'contrassegno_sbagliato', { contrassegno_usurato: true })); });
    capiAnnullata.forEach(function (c) { gregge.push(base(c, 'annullata', { annullata: true })); });
    capiSessoSbagliato.forEach(function (c) { gregge.push(base(c, 'sesso_sbagliato', { sesso_mostrato: c.sesso === 'M' ? 'F' : 'M' })); });
    capiRazzaDiversa.forEach(function (c) { gregge.push(base(c, 'razza_diversa', { razza_mostrata: c.razza === 'MET' ? (c.specie === 'capre' ? 'CAM' : 'BIE') : 'MET' })); });

    // 5. Capi sotto l'età diagnostica, presenti nel gregge
    capiGiovani.slice(0, nSottoEta).forEach(function (c) { gregge.push(base(c, 'sotto_eta')); });
    // 6. Altri stabilimenti (presenti nei registri caricati, non di lavoro)
    mescola(dati.altri.slice(), rng).slice(0, nAltroStabilimento).forEach(function (c) { gregge.push(base(c, 'altro_stabilimento')); });
    // 7. Marche disponibili (mai registrate su un capo) e contrassegni in nessun registro
    mescola(dati.disponibili.slice(), rng).slice(0, nMarcaDisponibile).forEach(function (m, i) {
      gregge.push(base({ contrassegno: m.contrassegno, specie: m.specie, sesso: 'F', razza: 'MET', data_nascita: '10/05/2023', elettronico: calcolaElettronico(m.contrassegno) }, 'marca_disponibile'));
    });
    for (var ie = 0; ie < nNonInElenco; ie++) {
      var codExt = 'IT0660000099' + (ie < 10 ? '0' : '') + ie;
      gregge.push(base({ contrassegno: codExt, specie: (ie % 2 === 0 ? 'pecore' : 'capre'), sesso: 'F', razza: 'MET', data_nascita: '10/05/2023', elettronico: calcolaElettronico(codExt) }, 'non_in_elenco'));
    }
    // 8. Usciti: smarriti (W), rubati (H/F), altri motivi
    var uscitiMescolati = mescola(dati.usciti.slice(), rng);
    function prendiUsciti(n, filtro) {
      var out = [];
      for (var i = 0; i < uscitiMescolati.length && out.length < n; i++) { if (filtro(uscitiMescolati[i])) out.push(uscitiMescolati.splice(i--, 1)[0]); }
      for (var j = 0; j < uscitiMescolati.length && out.length < n; j++) out.push(uscitiMescolati.splice(j--, 1)[0]);
      return out;
    }
    prendiUsciti(nSmarrito, function (u) { return u.motivo === 'W'; }).forEach(function (u) { gregge.push(base(u, 'smarrito', { motivo_uscita: u.motivo })); });
    prendiUsciti(nRubato, function (u) { return u.motivo === 'H' || u.motivo === 'F'; }).forEach(function (u) { gregge.push(base(u, 'rubato', { motivo_uscita: u.motivo })); });
    prendiUsciti(nUscito, function (u) { return u.motivo !== 'W' && u.motivo !== 'H' && u.motivo !== 'F'; }).forEach(function (u) { gregge.push(base(u, 'uscito', { motivo_uscita: u.motivo })); });

    mescola(gregge, rng);
    for (var g = 0; g < gregge.length; g++) gregge[g].schermoPrimario = (g % nTotaleSchermi) + 1;

    // 9. I doppi: lo stesso capo, mostrato una seconda volta più avanti (su un altro schermo se ce n'è più d'uno)
    var candidatiDoppi = gregge.filter(function (c) { return c.fattispecie === 'normale'; });
    var doppiCreati = [];
    for (var d = 0; d < nDoppio && d < candidatiDoppi.length; d++) {
      var orig = candidatiDoppi[d];
      orig.haDoppio = true;
      var copia = base(orig, 'doppio', { schermoPrimario: (orig.schermoPrimario % nTotaleSchermi) + 1, doppioDi: orig.contrassegno });
      doppiCreati.push(copia);
    }

    var perSchermo = {};
    for (var sIdx = 1; sIdx <= nTotaleSchermi; sIdx++) perSchermo[sIdx] = [];
    gregge.forEach(function (c) { perSchermo[c.schermoPrimario].push(c); });
    doppiCreati.forEach(function (dp) {
      var lista = perSchermo[dp.schermoPrimario];
      var pos = Math.min(lista.length, Math.floor(lista.length / 2) + Math.floor(rng() * Math.max(1, Math.floor(lista.length / 2))));
      lista.splice(pos, 0, dp);
    });
    for (var sNum = 1; sNum <= nTotaleSchermi; sNum++) {
      perSchermo[sNum].forEach(function (c, idx) {
        c.schermo = sNum;
        c.ordine_schermo = idx + 1;
        c.ultime_cifre = c.contrassegno ? c.contrassegno.slice(-3) : '---';
      });
    }

    // La chiave delle soluzioni: che cosa era ogni animale e che cosa si doveva registrare
    var chiaveGlobale = [];
    var ordineGlob = 1;
    function voce(c, schermo, ordine, fattispecie, nota) {
      return {
        ordine_globale: ordineGlob++, schermo: schermo, ordine_schermo: ordine,
        contrassegno: c.contrassegno, elettronico: c.elettronico, ultime_cifre: c.contrassegno ? c.contrassegno.slice(-3) : '---',
        specie: c.specie, sesso: c.sesso, sesso_mostrato: c.sesso_mostrato || c.sesso, razza: c.razza, razza_mostrata: c.razza_mostrata || c.razza,
        fattispecie: fattispecie, titolo: FATTISPECIE[fattispecie].titolo,
        dentizione: c.dentizione || '', segno_provvisorio: c.segno_provvisorio || '', note: nota
      };
    }
    for (var sc = 1; sc <= nTotaleSchermi; sc++) {
      perSchermo[sc].forEach(function (c) { chiaveGlobale.push(voce(c, c.schermo, c.ordine_schermo, c.fattispecie, c.atteso)); });
    }
    capiNonCampionati.forEach(function (nc) { chiaveGlobale.push(voce(nc, 0, 0, 'non_campionato', FATTISPECIE.non_campionato.atteso)); });

    var conta = {};
    chiaveGlobale.forEach(function (v) { conta[v.fattispecie] = (conta[v.fattispecie] || 0) + 1; });
    return {
      nSchermi: nTotaleSchermi,
      perSchermo: perSchermo,
      chiaveGlobale: chiaveGlobale,
      etaMesi: etaMesi,
      statistiche: {
        totaleBase: N,
        totaleMostrati: chiaveGlobale.filter(function (x) { return x.schermo > 0; }).length,
        nonCampionati: nNonCampionato,
        doppi: doppiCreati.length,
        nonInElenco: nNonInElenco,
        smarriti: conta.smarrito || 0,
        usciti: conta.uscito || 0,
        rubati: conta.rubato || 0,
        contrSbagliati: nContrSbagliato,
        dxMancanti: nDxMancante,
        sxMancanti: nSxMancante,
        boli: nBolo,
        boliMancanti: nBoloMancante,
        senzaOrecchini: nSenzaOrecchini,
        annullate: nAnnullata,
        sessoSbagliato: nSessoSbagliato,
        razzaDiversa: nRazzaDiversa,
        marcheDisponibili: conta.marca_disponibile || 0,
        altroStabilimento: conta.altro_stabilimento || 0,
        sottoEta: conta.sotto_eta || 0,
        ricercati: conta.ricercato || 0,
        perFattispecie: conta
      }
    };
  }

  /* Disegno SVG di pecora o capra con orecchini e barcode Code 128 */
  function disegnaAnimaleSvg(capo, opzioni) {
    opzioni = opzioni || {};
    var isCapra = capo.specie === 'capre';
    var isMaschio = (capo.sesso_mostrato || capo.sesso) === 'M';
    var giovane = capo.fattispecie === 'sotto_eta';

    var width = 640;
    var height = 380;

    // Colori di base
    var coloreCorpo = isCapra ? '#bcaaa4' : '#f5f5f5';
    var coloreTratto = '#455a64';
    var coloreMuso = isCapra ? '#a1887f' : '#eeeeee';
    var coloreCorna = '#4e342e';

    var svgContent = '';

    // Sfondo decorativo tenue
    svgContent += '<rect width="' + width + '" height="' + height + '" fill="#fafbfb" rx="8"/>';

    // 1. Corpo dell'animale (un capo sotto età è più piccolo)
    if (giovane) svgContent += '<g transform="translate(96, 96) scale(0.7)">';
    if (isCapra) {
      // Corpo capra (slanciato)
      svgContent += '<ellipse cx="320" cy="270" rx="140" ry="85" fill="' + coloreCorpo + '" stroke="' + coloreTratto + '" stroke-width="3"/>';
    } else {
      // Corpo pecora (lanoso a onde)
      svgContent += '<g fill="' + coloreCorpo + '" stroke="' + coloreTratto + '" stroke-width="3">' +
        '<circle cx="230" cy="240" r="45"/>' +
        '<circle cx="280" cy="225" r="50"/>' +
        '<circle cx="340" cy="220" r="50"/>' +
        '<circle cx="400" cy="235" r="48"/>' +
        '<circle cx="420" cy="275" r="45"/>' +
        '<circle cx="380" cy="305" r="50"/>' +
        '<circle cx="320" cy="315" r="50"/>' +
        '<circle cx="260" cy="305" r="48"/>' +
        '<circle cx="220" cy="275" r="42"/>' +
        '<ellipse cx="320" cy="265" rx="130" ry="70" stroke="none"/>' +
        '</g>';
    }

    if (giovane) svgContent += '</g>';
    // 2. Addome con BOLO se presente, o bolo mancante
    if (capo.bolo_mancante) {
      svgContent += '<g transform="translate(195, 240)">' +
        '<rect x="-10" y="-18" width="270" height="52" rx="6" fill="#ffebee" stroke="#d32f2f" stroke-width="2"/>' +
        '<text x="125" y="2" font-size="11" font-weight="bold" fill="#c62828" text-anchor="middle">BOLO ASSENTE O ILLEGGIBILE</text>' +
        '<text x="125" y="20" font-size="10" fill="#b71c1c" text-anchor="middle">Il lettore non risponde: segna «bolo da sostituire»</text>' +
        '</g>';
    }
    if (capo.bolo && capo.elettronico) {
      var boloBarcodeSvg = Code128.svg(capo.elettronico, { modulo: 1.6, altezza: 40, fondo: '#ffffff' });
      svgContent += '<g transform="translate(195, 235)">' +
        '<rect x="-10" y="-18" width="270" height="85" rx="6" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/>' +
        '<text x="125" y="-4" font-size="11" font-weight="bold" fill="#1b5e20" text-anchor="middle">BOLO ENDORUMINALE · TRANSPONDER RETICOLARE</text>' +
        '<g transform="translate(0, 5)">' + boloBarcodeSvg + '</g>' +
        '</g>';
    }

    // 3. Collo e Testa
    svgContent += '<ellipse cx="320" cy="180" rx="45" ry="55" fill="' + coloreCorpo + '" stroke="' + coloreTratto + '" stroke-width="3"/>';
    svgContent += '<ellipse cx="320" cy="140" rx="55" ry="60" fill="' + coloreMuso + '" stroke="' + coloreTratto + '" stroke-width="3"/>';

    // 4. Corna (per capra o montone maschio)
    if (isCapra) {
      // Corna arcuate
      svgContent += '<path d="M 300 95 Q 280 40 255 30 Q 275 55 305 92" fill="' + coloreCorna + '" stroke="' + coloreTratto + '" stroke-width="2"/>';
      svgContent += '<path d="M 340 95 Q 360 40 385 30 Q 365 55 335 92" fill="' + coloreCorna + '" stroke="' + coloreTratto + '" stroke-width="2"/>';
      // Barbetta
      svgContent += '<path d="M 312 195 L 320 220 L 328 195 Z" fill="' + coloreCorna + '"/>';
    } else if (isMaschio) {
      // Corna a spirale montone
      svgContent += '<path d="M 285 110 C 240 80 230 140 260 150 C 245 135 250 95 290 105" fill="' + coloreCorna + '" stroke="' + coloreTratto + '" stroke-width="2"/>';
      svgContent += '<path d="M 355 110 C 400 80 410 140 380 150 C 395 135 390 95 350 105" fill="' + coloreCorna + '" stroke="' + coloreTratto + '" stroke-width="2"/>';
    }

    // 5. Occhi, Narici e Muso
    svgContent += '<ellipse cx="295" cy="130" rx="5" ry="7" fill="#212121"/>';
    svgContent += '<ellipse cx="345" cy="130" rx="5" ry="7" fill="#212121"/>';
    svgContent += '<ellipse cx="314" cy="170" rx="3" ry="2" fill="#424242"/>';
    svgContent += '<ellipse cx="326" cy="170" rx="3" ry="2" fill="#424242"/>';
    svgContent += '<path d="M 312 180 Q 320 186 328 180" stroke="#424242" stroke-width="2" fill="none"/>';

    // Capo senza orecchini: ciò che il veterinario vede e scrive (specie, sesso, dentizione, razza stimata, segno provvisorio)
    if (capo.senza_orecchini) {
      svgContent += '<g transform="translate(170, 300)">' +
        '<rect x="0" y="0" width="300" height="72" rx="6" fill="#fff3e0" stroke="#e65100" stroke-width="1.5"/>' +
        '<text x="150" y="16" font-size="11" font-weight="bold" fill="#b71c1c" text-anchor="middle">NON IDENTIFICATO · niente da leggere</text>' +
        '<text x="150" y="34" font-size="11" fill="#4e342e" text-anchor="middle">' + (isCapra ? 'Capra' : 'Pecora') + ' · ' + (isMaschio ? 'maschio' : 'femmina') + ' · ' + (capo.dentizione || '') + '</text>' +
        '<text x="150" y="50" font-size="11" fill="#4e342e" text-anchor="middle">Razza stimata: ' + (capo.razza_mostrata || capo.razza) + '</text>' +
        '<text x="150" y="65" font-size="11" font-weight="bold" fill="#e65100" text-anchor="middle">Segno provvisorio: ' + (capo.segno_provvisorio || '') + '</text>' +
        '</g>';
    }

    // 6. Orecchie (Destra anatomica a SINISTRA dell'immagine, Sinistra anatomica a DESTRA)
    // Orecchio Destro dell'animale (a sinistra per l'osservatore)
    svgContent += '<path d="M 275 125 C 230 115 190 140 215 160 C 245 155 265 145 275 135" fill="' + coloreMuso + '" stroke="' + coloreTratto + '" stroke-width="2"/>';
    // Orecchio Sinistro dell'animale (a destra per l'osservatore)
    svgContent += '<path d="M 365 125 C 410 115 450 140 425 160 C 395 155 375 145 365 135" fill="' + coloreMuso + '" stroke="' + coloreTratto + '" stroke-width="2"/>';

    // 7. Cartellini e Dettagli Orecchini
    // Riquadro etichetta ORECCHIO DESTRO (Elettronico)
    svgContent += '<g transform="translate(10, 20)">' +
      '<rect x="0" y="0" width="220" height="24" rx="4" fill="#006b5b"/>' +
      '<text x="110" y="16" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">ORECCHIO DX · ELETTRONICO</text>' +
      '</g>';

    if (capo.orecchino_dx_presente && !capo.bolo && capo.elettronico) {
      // Orecchino giallo con barcode
      var barcodeSvg = Code128.svg(capo.elettronico, { modulo: 1.5, altezza: 44, fondo: '#fffde7' });
      svgContent += '<g transform="translate(15, 52)">' +
        '<rect x="-5" y="-5" width="230" height="96" rx="8" fill="#fffde7" stroke="#fbc02d" stroke-width="2"/>' +
        '<circle cx="215" cy="15" r="6" fill="#fbc02d"/>' +
        '<text x="105" y="12" font-size="10" font-weight="bold" fill="#7f0000" text-anchor="middle">TRANSPONDER 134.2 kHz</text>' +
        '<g transform="translate(5, 18)">' + barcodeSvg + '</g>' +
        '</g>';
      // Linea di collegamento all'orecchio destro
      svgContent += '<path d="M 215 120 Q 230 145 240 145" stroke="#fbc02d" stroke-width="3" fill="none" stroke-dasharray="3,3"/>';
    } else if (capo.bolo) {
      svgContent += '<g transform="translate(15, 52)">' +
        '<rect x="-5" y="-5" width="230" height="50" rx="8" fill="#e8f5e9" stroke="#4caf50" stroke-width="2"/>' +
        '<text x="110" y="18" font-size="11" font-weight="bold" fill="#1b5e20" text-anchor="middle">BOLO (vedi addome)</text>' +
        '<text x="110" y="34" font-size="10" fill="#2e7d32" text-anchor="middle">Nessun transponder auricolare</text>' +
        '</g>';
    } else {
      // Orecchino DX mancante
      svgContent += '<g transform="translate(15, 52)">' +
        '<rect x="-5" y="-5" width="230" height="50" rx="8" fill="#ffebee" stroke="#d32f2f" stroke-width="2"/>' +
        '<text x="110" y="20" font-size="12" font-weight="bold" fill="#c62828" text-anchor="middle">⚠️ ' + (capo.senza_orecchini ? 'NESSUN ORECCHINO' : capo.bolo_mancante ? 'NIENTE DA LEGGERE' : 'ORECCHINO MANCANTE O ILLEGGIBILE') + '</text>' +
        '<text x="110" y="36" font-size="10" fill="#b71c1c" text-anchor="middle">' + (capo.senza_orecchini ? 'Registra senza contrassegno' : 'Digita le cifre del sinistro') + '</text>' +
        '</g>';
      svgContent += '<circle cx="230" cy="145" r="4" fill="#c62828"/>';
    }

    // Riquadro etichetta ORECCHIO SINISTRO (Marca visuale)
    svgContent += '<g transform="translate(410, 20)">' +
      '<rect x="0" y="0" width="220" height="24" rx="4" fill="#006b5b"/>' +
      '<text x="110" y="16" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">ORECCHIO SX · MARCA VISUALE</text>' +
      '</g>';

    if (capo.orecchino_sx_presente) {
      var cStr = String(capo.contrassegno || 'IT000000000000');
      var baseCod = cStr.slice(0, -3);
      var endCod = cStr.slice(-3);

      svgContent += '<g transform="translate(415, 52)">' +
        '<rect x="-5" y="-5" width="220" height="85" rx="8" fill="#fffde7" stroke="#fbc02d" stroke-width="2"/>' +
        '<circle cx="10" cy="15" r="6" fill="#fbc02d"/>' +
        '<text x="105" y="16" font-size="10" font-weight="bold" fill="#5d4037" text-anchor="middle">MINISTERO SALUTE · BDN</text>' +
        '<text x="105" y="38" font-size="13" font-family="monospace" fill="#37474f" text-anchor="middle">' + baseCod + '</text>' +
        '<text x="105" y="68" font-size="26" font-weight="bold" font-family="monospace" fill="#000000" text-anchor="middle">' + endCod + '</text>';

      // Se contrassegno usurato / abraso
      if (capo.contrassegno_usurato) {
        svgContent += '<path d="M 85 52 L 125 72" stroke="#d32f2f" stroke-width="3" stroke-linecap="round"/>' +
          '<rect x="15" y="48" width="180" height="22" fill="#ffebee" opacity="0.4"/>' +
          '<text x="105" y="78" font-size="9" font-weight="bold" fill="#b71c1c" text-anchor="middle">⚠️ CIFRA ABRASA / USURATA</text>';
      }

      svgContent += '</g>';
      // Linea di collegamento all'orecchio sinistro
      svgContent += '<path d="M 415 110 Q 405 140 395 145" stroke="#fbc02d" stroke-width="3" fill="none" stroke-dasharray="3,3"/>';
    } else {
      // Orecchino SX mancante
      svgContent += '<g transform="translate(415, 52)">' +
        '<rect x="-5" y="-5" width="220" height="50" rx="8" fill="#ffebee" stroke="#d32f2f" stroke-width="2"/>' +
        '<text x="105" y="20" font-size="12" font-weight="bold" fill="#c62828" text-anchor="middle">⚠️ ' + (capo.senza_orecchini ? 'NESSUN ORECCHINO' : 'ORECCHINO MANCANTE O ILLEGGIBILE') + '</text>' +
        '<text x="105" y="36" font-size="10" fill="#b71c1c" text-anchor="middle">' + (capo.senza_orecchini ? 'Niente marca auricolare' : 'Leggi il barcode del destro') + '</text>' +
        '</g>';
      svgContent += '<circle cx="410" cy="145" r="4" fill="#c62828"/>';
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height + '" width="100%" height="auto" shape-rendering="geometricPrecision">' +
      svgContent + '</svg>';
  }

  /* Esportazione chiave in formato JSON */
  function esportaChiaveJson(chiave) {
    return JSON.stringify(chiave, null, 2);
  }

  /* Esportazione chiave in formato CSV (punto e virgola, UTF-8 BOM) */
  function esportaChiaveCsv(chiave) {
    var righe = ['\uFEFFordine_globale;schermo;ordine_schermo;contrassegno;elettronico;ultime_cifre;specie;sesso_bdn;sesso_mostrato;razza_bdn;razza_mostrata;fattispecie;titolo;dentizione;segno_provvisorio;soluzione_attesa'];
    chiave.forEach(function (r) {
      function q(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }
      righe.push([
        r.ordine_globale, r.schermo, r.ordine_schermo, r.contrassegno || '', r.elettronico || '', r.ultime_cifre || '',
        r.specie || '', r.sesso || '', r.sesso_mostrato || r.sesso || '', r.razza || '', r.razza_mostrata || r.razza || '',
        r.fattispecie || '', q(r.titolo), q(r.dentizione), q(r.segno_provvisorio), q(r.note)
      ].join(';'));
    });
    return righe.join('\r\n');
  }

  /* Confronto fra la chiave delle soluzioni e il backup finale della Regia: per ogni animale mostrato, che cosa risulta
     registrato (provette per contrassegno, segnalazioni di orecchini e bolo, sesso corretto, annulli). */
  function confrontaChiaveBackup(chiaveGlobale, progettoBackup) {
    var eventi = (progettoBackup && progettoBackup.eventi) || [];
    var esporti = (progettoBackup && progettoBackup.esporti) || [];
    var provette = [], annullati = {};
    eventi.forEach(function (e) {
      if (e.tipo === 'PROVETTA_REGISTRATA') provette.push(e.dati || {});
      if (e.tipo === 'PROVETTA_ANNULLATA' && e.dati && e.dati.uid) annullati[e.dati.uid] = true;
    });
    if (!provette.length && esporti.length) {
      esporti.forEach(function (esp) { ((esp.export && esp.export.records) || []).forEach(function (r) { provette.push(r); }); });
    }
    var perContr = {}, nonIdentificati = [];
    provette.forEach(function (p) {
      var c = String(p.contrassegno || p.capo_contrassegno || '').toUpperCase();
      if (c) (perContr[c] = perContr[c] || []).push(p); else nonIdentificati.push(p);
    });
    var resoconto = { totaleChiave: chiaveGlobale.length, totaleProvetteRegistrate: provette.length, fattispecie: {}, dettagli: [] };
    Object.keys(FATTISPECIE).forEach(function (t) { resoconto.fattispecie[t] = { titolo: FATTISPECIE[t].titolo, iniettati: 0, trovatiNelBackup: 0, esitoCorretto: 0 }; });
    function vero(p, k) { return p[k] === true || p[k] === 'true'; }
    chiaveGlobale.forEach(function (item) {
      var t = item.fattispecie;
      if (!resoconto.fattispecie[t]) resoconto.fattispecie[t] = { titolo: t, iniettati: 0, trovatoNelBackup: 0, esitoCorretto: 0 };
      resoconto.fattispecie[t].iniettati++;
      var sue = perContr[String(item.contrassegno || '').toUpperCase()] || [];
      var nLetti = sue.length;
      if (nLetti > 0) resoconto.fattispecie[t].trovatiNelBackup++;
      var corretto = false, esitoTesto = '';
      function registrata(testoOk) { if (nLetti >= 1) { corretto = true; esitoTesto = testoOk || ('Registrata (' + nLetti + ')'); } else esitoTesto = 'Non registrata'; }
      function conSegno(campo, cosa) {
        if (nLetti >= 1 && sue.some(function (p) { return vero(p, campo); })) { corretto = true; esitoTesto = 'Registrata con ' + cosa; }
        else if (nLetti >= 1) esitoTesto = 'Registrata, ma senza ' + cosa;
        else esitoTesto = 'Non registrata';
      }
      switch (t) {
        case 'doppio':
          if (nLetti >= 2) { corretto = true; esitoTesto = 'Rilevato il doppio (' + nLetti + ' prelievi)'; }
          else if (nLetti === 1) { corretto = true; esitoTesto = 'Una sola provetta: «Già fatto» scelto bene'; }
          else esitoTesto = 'Non campionato'; break;
        case 'non_campionato':
          if (nLetti === 0) { corretto = true; esitoTesto = 'Correttamente non prelevato'; } else esitoTesto = 'Anomalia: trovato nel backup'; break;
        case 'senza_orecchini':
          if (nonIdentificati.length > 0) { corretto = true; esitoTesto = 'Registrato senza contrassegno'; } else esitoTesto = 'Nessun prelievo senza contrassegno'; break;
        case 'marca_da_sostituire_dx': conSegno('orecchino_dx', 'orecchino DX da sostituire'); break;
        case 'marca_da_sostituire_sx': conSegno('orecchino_sx', 'orecchino SX da sostituire'); break;
        case 'bolo_mancante': conSegno('bolo', 'bolo da sostituire'); break;
        case 'sesso_sbagliato':
          if (nLetti >= 1 && sue.some(function (p) { return String(p.sesso_corretto || '') !== ''; })) { corretto = true; esitoTesto = 'Registrata col sesso corretto'; }
          else if (nLetti >= 1) esitoTesto = 'Registrata, ma senza il sesso corretto'; else esitoTesto = 'Non registrata'; break;
        case 'annullata':
          if (nLetti >= 2 && sue.some(function (p) { return annullati[p.uid]; })) { corretto = true; esitoTesto = 'Annullata e ripetuta'; }
          else if (nLetti >= 1) esitoTesto = 'Registrata, non annullata o non ripetuta'; else esitoTesto = 'Non registrata'; break;
        case 'sotto_eta':
          if (nLetti === 0) { corretto = true; esitoTesto = 'Non prelevato (sotto età)'; } else { corretto = true; esitoTesto = 'Prelevato: fra i fuori registro (fuori età)'; } break;
        case 'contrassegno_sbagliato': registrata('Identificato bene nonostante le cifre abrase'); break;
        default: registrata();
      }
      if (corretto) resoconto.fattispecie[t].esitoCorretto++;
      resoconto.dettagli.push({ contrassegno: item.contrassegno, specie: item.specie, fattispecie: t, titolo: item.titolo, schermo: item.schermo, trovato: nLetti > 0, volte: nLetti, esito: esitoTesto, corretto: corretto });
    });
    return resoconto;
  }

  /* Figure delle slide: schemi semplici, mai schermate dell'app spacciate per interattive. */
  function figura(tipo, testo, sotto) {
    var testa = '<svg viewBox="0 0 400 200" width="100%" height="100%">';
    var fine = '<text x="200" y="186" font-size="12" font-weight="bold" fill="#37474f" text-anchor="middle">' + (sotto || '') + '</text></svg>';
    switch (tipo) {
      case 'sito': return testa + '<rect x="50" y="20" width="300" height="140" rx="10" fill="#37474f"/><rect x="62" y="34" width="276" height="112" rx="4" fill="#ffffff"/><rect x="62" y="34" width="276" height="18" fill="#eceff1"/><circle cx="74" cy="43" r="4" fill="#ef5350"/><circle cx="88" cy="43" r="4" fill="#ffca28"/><circle cx="102" cy="43" r="4" fill="#66bb6a"/><text x="200" y="85" font-size="15" font-weight="bold" fill="#006b5b" text-anchor="middle">' + testo + '</text><rect x="120" y="100" width="160" height="30" rx="6" fill="#006b5b"/><text x="200" y="120" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">nel browser, senza rete</text>' + fine;
      case 'file': return testa + '<g fill="#ffffff" stroke="#90a4ae" stroke-width="2"><rect x="70" y="30" width="80" height="110" rx="4"/><rect x="160" y="30" width="80" height="110" rx="4"/><rect x="250" y="30" width="80" height="110" rx="4"/></g><g font-size="11" fill="#37474f" text-anchor="middle"><text x="110" y="80">registro</text><text x="110" y="96">pecore</text><text x="200" y="80">registro</text><text x="200" y="96">capre</text><text x="290" y="80">contrassegni</text><text x="290" y="96">disponibili</text></g><text x="200" y="165" font-size="13" font-weight="bold" fill="#006b5b" text-anchor="middle">' + testo + '</text>' + fine;
      case 'tablet': return testa + '<rect x="70" y="25" width="260" height="150" rx="12" fill="#37474f"/><rect x="85" y="38" width="230" height="124" rx="6" fill="#ffffff"/><text x="200" y="80" font-size="14" font-weight="bold" fill="#006b5b" text-anchor="middle">' + testo + '</text><rect x="120" y="100" width="160" height="34" rx="6" fill="#2e7d32"/><text x="200" y="122" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">' + (sotto || '') + '</text><text x="200" y="186" font-size="12" font-weight="bold" fill="#37474f" text-anchor="middle">sul tablet della Regia (app vera)</text></svg>';
      case 'qr': return testa + '<rect x="70" y="30" width="90" height="140" rx="8" fill="#37474f"/><rect x="78" y="45" width="74" height="105" fill="#ffffff"/><path d="M 165 90 L 225 90" stroke="#006b5b" stroke-width="3" stroke-dasharray="4,4"/><polygon points="225,85 235,90 225,95" fill="#006b5b"/><rect x="240" y="40" width="100" height="100" rx="4" fill="#f4f6f7" stroke="#37474f" stroke-width="2"/><rect x="255" y="55" width="70" height="70" fill="#212121"/><text x="200" y="165" font-size="13" font-weight="bold" fill="#006b5b" text-anchor="middle">' + testo + '</text>' + fine;
      case 'animale': return testa + '<g fill="#f5f5f5" stroke="#455a64" stroke-width="3"><circle cx="150" cy="105" r="35"/><circle cx="190" cy="95" r="38"/><circle cx="230" cy="105" r="35"/><ellipse cx="190" cy="115" rx="75" ry="38" stroke="none"/></g><ellipse cx="190" cy="62" rx="26" ry="28" fill="#eeeeee" stroke="#455a64" stroke-width="3"/><rect x="255" y="40" width="110" height="46" rx="6" fill="#fffde7" stroke="#fbc02d" stroke-width="2"/><text x="310" y="58" font-size="9" fill="#5d4037" text-anchor="middle">orecchino DX</text><text x="310" y="76" font-size="12" font-family="monospace" text-anchor="middle">||| | |||| |||</text><text x="200" y="165" font-size="13" font-weight="bold" fill="#006b5b" text-anchor="middle">' + testo + '</text>' + fine;
      case 'tavolo': return testa + '<rect x="50" y="50" width="140" height="90" rx="6" fill="#efebe9" stroke="#8d6e63" stroke-width="2"/><g fill="#006b5b"><circle cx="75" cy="75" r="8"/><circle cx="100" cy="75" r="8"/><circle cx="125" cy="75" r="8"/><circle cx="150" cy="75" r="8"/><circle cx="75" cy="105" r="8"/><circle cx="100" cy="105" r="8"/></g><rect x="220" y="40" width="130" height="110" rx="6" fill="#ffffff" stroke="#37474f" stroke-width="2"/><circle cx="240" cy="65" r="6" fill="#2e7d32"/><text x="255" y="70" font-size="11" fill="#37474f">tablet · Regia</text><circle cx="240" cy="90" r="6" fill="#2e7d32"/><text x="255" y="95" font-size="11" fill="#37474f">palmare 1 · attivo</text><circle cx="240" cy="115" r="6" fill="#fbc02d"/><text x="255" y="120" font-size="11" fill="#37474f">palmare 2 · in pausa</text><text x="200" y="165" font-size="13" font-weight="bold" fill="#006b5b" text-anchor="middle">' + testo + '</text>' + fine;
      case 'confronto': return testa + '<rect x="50" y="30" width="300" height="130" rx="8" fill="#ffffff" stroke="#006b5b" stroke-width="2"/><text x="200" y="58" font-size="14" font-weight="bold" fill="#006b5b" text-anchor="middle">' + testo + '</text><text x="80" y="88" font-size="12" fill="#2e7d32">✓ capi regolari registrati</text><text x="80" y="110" font-size="12" fill="#2e7d32">✓ doppi riconosciuti</text><text x="80" y="132" font-size="12" fill="#2e7d32">✓ senza contrassegno registrati</text><circle cx="300" cy="110" r="28" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/><text x="300" y="118" font-size="18" fill="#2e7d32" text-anchor="middle">OK</text>' + fine;
      default: return testa + '<text x="200" y="100" font-size="14" font-weight="bold" fill="#006b5b" text-anchor="middle">' + testo + '</text>' + fine;
    }
  }
  var TESTI_SLIDE = [
    { parte: 'Parte 1 · Creare il progetto sul sito e aprirlo sui device veri', titolo: '1. Apri «Crea il progetto sul sito»',
      frase: 'Nel menu Chi dirige › Crea il progetto sul sito. Usa i file BDN fittizi del kit di prova (cartella bdn/: registri e contrassegni) o i tuoi file veri: tutto resta nel browser.',
      figura: figura('sito', 'Crea il progetto sul sito', 'kit di prova o file propri') },
    { titolo: '2. I file della BDN',
      frase: 'Carica registri di stalla e contrassegni disponibili di pecore e capre, anche più file per stabilimento e allevamento, anche uno zip. La pagina li riconosce dal contenuto; se un file di contrassegni non dice la specie, scegli Pecore o Capre.',
      figura: figura('file', 'riconosciuti dal contenuto', 'registri a 538 colonne, contrassegni') },
    { titolo: '3. Veterinari e stabilimenti',
      frase: 'Carica l’elenco dei veterinari (CSV id;cognome;nome;codice_fiscale: entra nel pacchetto, mai nel registro). Spunta gli stabilimenti di lavoro: il più popoloso è il principale, gli altri hanno la lettera cerchiata. Scrivi descrizione e data.',
      figura: figura('sito', 'Stabilimenti di lavoro', 'principale senza lettera') },
    { titolo: '4. Età e lettere di specie, prima dei registri',
      frase: 'Scegli l’età diagnostica (6 mesi, 12 mesi o tutti) e la lettera di specie (per predefinita sulla specie meno numerosa). Fissano la numerazione: i capi fuori età non hanno numero. Sul tablet si congelano all’avvio del campionamento.',
      figura: figura('sito', 'Età 12 mesi · lettera C sulle capre', 'numerazione fissata') },
    { titolo: '5. La configurazione della Regia',
      frase: 'Verso di riempimento dei plateau, sigle dei veterinari (due lettere non confondibili), priorità per la regia d’emergenza, reti Wi-Fi del progetto (password facoltativa) e regole dei fuori registro. Si possono cambiare anche dopo, sul tablet.',
      figura: figura('sito', 'Sigle · priorità · reti · regole', 'modificabili sul tablet') },
    { titolo: '6. Anteprima e snapshot',
      frase: 'Controlla l’anteprima: capi numerati per stabilimento e specie, maschi in testa, fuori età, usciti, marche. Scarica numerazione_chiave.csv (la seconda copia) e lo snapshot per la Regia: uno zip fejalog_backup_…_sito_R.zip. Copialo sul tablet (cavo, chiavetta o condivisione).',
      figura: figura('sito', 'Scarica lo snapshot per la Regia', 'fejalog_backup_…_sito_R.zip') },
    { titolo: '7. Sul tablet: Progetto › Apri progetto',
      frase: 'Sul tablet vero, con Fejalog: menu ☰ › Progetto › Apri progetto › «Riprendi da un backup», scegli lo zip, «Riprendi». Il progetto si apre uguale a quello del sito: non c’è nessun device da far uscire. Poi «Configura il progetto» o «Apri la rete come Regia».',
      figura: figura('tablet', 'Apri progetto', 'Riprendi da un backup') },
    { titolo: '8. Rete vera e QR Wi-Fi',
      frase: 'Wi-Fi vera: il router da viaggio o l’hotspot del tablet. Prima del lavoro ogni telefono salva la rete inquadrando il QR Wi-Fi che la Regia mostra in Configurazione › Rete del progetto (o il foglio stampato). In Rete tocca «Apri la rete» come Regia.',
      figura: figura('qr', 'QR Wi-Fi della rete del progetto', 'router o hotspot, prima del lavoro') },
    { titolo: '9. Checklist e avvio',
      frase: 'Nella Checklist e avvio del tablet controlla registri, stabilimenti, età e lettere, reti e veterinari, poi «Avvia campionamento e blocca numerazione». Da qui età e lettere non cambiano più (l’età solo con la conferma multipla).',
      figura: figura('tablet', 'Checklist e avvio', 'Avvia campionamento e blocca numerazione') },
    { titolo: '10. I palmari veri entrano col QR',
      frase: 'La Regia mostra il QR d’ingresso (Configurazione › QR d’ingresso o Gestione dispositivi). Ogni veterinario, sul suo telefono: Progetto › Entra col QR, inquadra, sceglie il proprio nome dall’elenco. Icona della rete verde: doppi controllati.',
      figura: figura('qr', 'Progetto › Entra col QR', 'sul telefono di ogni veterinario') },
    { parte: 'Parte 2 · Il gregge a schermo, il campionamento sui device veri', titolo: '11. Qui: lo snapshot e gli errori',
      frase: 'Nella scheda «Gregge a schermo» carica lo stesso snapshot (o un backup, o «Di prova»), scegli il profilo degli errori (realistico, o percentuali a mano) e quanti schermi mostreranno il gregge. Tutto il resto avviene sui device veri.',
      figura: figura('sito', 'Snapshot + profilo degli errori', 'poi «Avvia il gregge»') },
    { titolo: '12. Un animale alla volta',
      frase: 'Lo schermo mostra un animale: specie, sesso, orecchino destro col barcode e sinistro con le cifre. Sul palmare vero leggi il barcode col lettore (o digita le ultime cifre), controlla il foglio di conferma, conferma. Poi «Prossimo».',
      figura: figura('animale', 'Leggi, conferma sul palmare, avanti', 'lettore o cifre del sinistro') },
    { titolo: '13. Le fattispecie',
      frase: 'Compaiono anche: orecchino destro o sinistro mancante, bolo (barcode sull’addome) o bolo mancante, animale senza orecchini (specie, sesso, dentizione, razza stimata, segno provvisorio), doppio, uscito, smarrito, rubato, altro stabilimento, marca disponibile, contrassegno in nessun registro, sotto età, sesso o razza diversi dalla BDN, cifre abrase, ricercato. Con «Mostra cosa deve succedere» vedi la soluzione attesa.',
      figura: figura('animale', 'Ogni fattispecie è disegnata e descritta', 'la soluzione attesa va nella chiave') },
    { titolo: '14. Consegne, pause, chiusura',
      frase: 'Come in campo: le provette si portano al tavolo e la Regia le registra nelle Consegne e nei plateau; Gestione dispositivi segue chi è al lavoro, in pausa o escluso. Finiti gli animali, la Regia chiude il campionamento dalla Checklist.',
      figura: figura('tavolo', 'Consegne · Gestione dispositivi · chiusura', 'come in campo') },
    { titolo: '15. Gestione e confronto con la chiave',
      frase: 'Dopo la chiusura: Problemi da risolvere, Riordino, snippet (solo nella pagina di prova di ARVET, mai in quella vera). Salva il backup dal tablet e caricalo qui: il confronto dice, fattispecie per fattispecie, che cosa è stato registrato rispetto alla chiave delle soluzioni.',
      figura: figura('confronto', 'Chiave delle soluzioni ↔ backup', 'fattispecie per fattispecie') }
  ];
  var FIGURE_SLIDE = TESTI_SLIDE.map(function (t) { return t.figura; });

  /* Interfaccia utente (HTML e montaggio DOM) */
  function avvia(root) {
    if (!root) return;
    var doc = root.ownerDocument || (typeof document !== 'undefined' ? document : null);

    // Stato locale dell'interfaccia
    var stato = {
      tabAttiva: 'simulatore', // 'simulatore' | 'tutorial'
      seme: 'sim-' + Math.floor(Math.random() * 10000),
      nSchermi: 1,
      kSchermo: 1,
      mostraAtteso: false,
      indiceCapo: 0,
      slideCorrente: 0,
      progetto: null,
      etaMesi: 0,
      nomeProgetto: '',
      profilo: JSON.parse(JSON.stringify(PROFILO_DEFAULT)),
      simulazione: null,
      resocontoConfronto: null
    };

    function render() {
      var html = '<div class="fej-sim-contenitore">';

      // Selettore Schede (Simulatore vs Tutorial)
      html += '<div class="fej-sim-modalita-tabs">' +
        '<button type="button" class="fej-sim-tab-btn ' + (stato.tabAttiva === 'simulatore' ? 'fej-sim-tab-attiva' : '') + '" id="fej-tab-sim">🐑 Gregge a schermo</button>' +
        '<button type="button" class="fej-sim-tab-btn ' + (stato.tabAttiva === 'tutorial' ? 'fej-sim-tab-attiva' : '') + '" id="fej-tab-tut">📖 Tutorial a slide (' + TESTI_SLIDE.length + ' passi)</button>' +
        '</div>';

      if (stato.tabAttiva === 'tutorial') {
        html += renderTutorial();
      } else {
        html += renderSimulatore();
      }

      html += '</div>';
      root.innerHTML = html;
      collegaEventi();
    }

    function renderTutorial() {
      var sl = TESTI_SLIDE[stato.slideCorrente];
      var fig = FIGURE_SLIDE[stato.slideCorrente];

      var parte = '';
      for (var pi = stato.slideCorrente; pi >= 0; pi--) if (TESTI_SLIDE[pi].parte) { parte = TESTI_SLIDE[pi].parte; break; }
      var html = '<div class="fej-sim-slide-box">' +
        '<div class="fej-sim-slide-testata">' +
        '<span class="fej-sim-slide-passo">' + parte + ' · passo ' + (stato.slideCorrente + 1) + ' di ' + TESTI_SLIDE.length + '</span>' +
        '<strong>' + sl.titolo + '</strong>' +
        '</div>' +
        '<div class="fej-sim-slide-figura">' + fig + '</div>' +
        '<div class="fej-sim-slide-frase">' + sl.frase + '</div>' +
        '<div class="fej-sim-slide-dots">';

      for (var d = 0; d < TESTI_SLIDE.length; d++) {
        html += '<button type="button" class="fej-sim-dot ' + (d === stato.slideCorrente ? 'attivo' : '') + '" data-slide="' + d + '" title="Passo ' + (d + 1) + '"></button>';
      }

      html += '</div>' +
        '<div class="fej-sim-nav-controlli" style="width:100%;max-width:500px;">' +
        '<button type="button" class="fej-sim-btn-secondario fej-sim-nav-btn" id="tut-prev" ' + (stato.slideCorrente === 0 ? 'disabled' : '') + '>◀ Indietro</button>' +
        '<button type="button" class="fej-sim-btn-primario fej-sim-nav-btn" id="tut-next" ' + (stato.slideCorrente === TESTI_SLIDE.length - 1 ? 'disabled' : '') + '>Avanti ▶</button>' +
        '</div>' +
        '</div>';

      return html;
    }

    function renderSimulatore() {
      var html = '';

      // Box Configurazione se la simulazione non è attiva o aperta
      html += '<div class="fej-sim-config-box">' +
        '<h3>1. Dati di partenza, errori, schermi</h3>' +
        '<p style="font-size:0.9rem;margin:0 0 0.6rem 0;">Il sito mostra solo gli animali, uno alla volta. Il campionamento si fa sui device veri: tablet Regia col progetto aperto dallo snapshot, palmari entrati col QR, Wi-Fi vera.</p>' +
        '<div class="fej-sim-griglia-config">' +
        '<div class="fej-sim-campo">' +
        '<label>Progetto di partenza</label>' +
        '<div style="display:flex;gap:0.4rem;flex-wrap:wrap;">' +
        '<label class="fej-sim-btn-primario" style="font-size:0.9rem;padding:0.4rem 0.8rem;cursor:pointer;">Carica lo snapshot creato sul sito o un backup (.zip)<input type="file" id="sim-file-backup" accept=".zip" style="display:none;"></label>' +
        '<button type="button" class="fej-sim-btn-secondario" id="sim-btn-fittizio" style="font-size:0.9rem;padding:0.4rem 0.8rem;">Usa «Di prova» (888TO999)</button>' +
        '</div>' +
        '<span id="sim-lbl-progetto" style="font-size:0.85rem;color:#006b5b;font-weight:600;margin-top:0.25rem;">' +
        (stato.progetto ? ('Progetto caricato: ' + (stato.nomeProgetto || stato.progetto.id || '888TO999') + (stato.etaMesi ? ' · età diagnostica ' + stato.etaMesi + ' mesi' : ' · tutti i presenti')) : 'Nessun progetto caricato') +
        '</span>' +
        '</div>' +
        '<div class="fej-sim-campo">' +
        '<label>Profilo degli errori</label>' +
        '<select id="sim-sel-profilo">' +
        '<option value="realistico">Profilo realistico (le voci «stima» sono valori di base, non dalla prova reale)</option>' +
        '<option value="personalizzato">Personalizzato (percentuali a mano)</option>' +
        '</select>' +
        '<label class="fej-sim-btn-secondario" style="font-size:0.8rem;padding:0.25rem 0.5rem;margin-top:0.25rem;cursor:pointer;width:fit-content;">Carica JSON profilo<input type="file" id="sim-file-profilo" accept=".json" style="display:none;"></label>' +
        '</div>' +
        '<div class="fej-sim-campo">' +
        '<label>Schermi che mostrano il gregge (n)</label>' +
        '<input type="number" id="sim-input-n" min="1" max="12" value="' + stato.nSchermi + '">' +
        '</div>' +
        '<div class="fej-sim-campo">' +
        '<label>Numero di questo schermo (k)</label>' +
        '<input type="number" id="sim-input-k" min="1" max="' + stato.nSchermi + '" value="' + stato.kSchermo + '">' +
        '</div>' +
        '<div class="fej-sim-campo">' +
        '<label>Seme casuale (deterministico)</label>' +
        '<input type="text" id="sim-input-seme" value="' + stato.seme + '">' +
        '</div>' +
        '</div>';

      // Percentuali modificabili a mano se profilo personalizzato
      html += '<details id="sim-dettaglio-percentuali" style="margin-bottom:0.75rem;">' +
        '<summary style="cursor:pointer;font-weight:600;color:#006b5b;font-size:0.9rem;">Visualizza / modifica percentuali anomalie del profilo</summary>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.5rem;margin-top:0.5rem;background:#ffffff;padding:0.75rem;border-radius:6px;border:1px solid #cfd8dc;">';

      var pMap = stato.profilo.percentuali;
      var chiaviP = Object.keys(PROFILO_DEFAULT.percentuali).concat(Object.keys(pMap).filter(function (k) { return !(k in PROFILO_DEFAULT.percentuali); }));
      var stime = stato.profilo.stime || STIME;
      chiaviP.forEach(function (k) {
        if (pMap[k] == null) pMap[k] = 0;
        var nomeF = FATTISPECIE[k === 'marca_da_sostituire_dx' ? 'marca_da_sostituire_dx' : k] ? FATTISPECIE[k].titolo : k;
        html += '<div style="display:flex;flex-direction:column;font-size:0.8rem;">' +
          '<label style="font-weight:600;" title="' + k + '">' + nomeF + ' (%)' + (stime.indexOf(k) >= 0 ? ' <span style="color:#8d6e63;font-weight:400;">stima</span>' : '') + '</label>' +
          '<input type="number" step="0.1" min="0" max="100" class="sim-perc-input" data-chiave="' + k + '" value="' + pMap[k] + '" style="padding:0.25rem;font-size:0.85rem;">' +
          '</div>';
      });

      html += '</div></details>';

      html += '<div class="fej-sim-azioni-config">' +
        '<button type="button" class="fej-sim-btn-primario" id="sim-btn-avvia">▶ Avvia il gregge</button>' +
        '<label style="display:inline-flex;align-items:center;gap:0.4rem;font-size:0.9rem;cursor:pointer;">' +
        '<input type="checkbox" id="sim-chk-atteso" ' + (stato.mostraAtteso ? 'checked' : '') + '> Mostra cosa deve succedere (addestramento)' +
        '</label>' +
        '</div>' +
        '</div>';

      // Area Visualizzazione Schermo Capo se simulazione avviata
      if (stato.simulazione) {
        var capi = stato.simulazione.perSchermo[stato.kSchermo] || [];
        var totCapi = capi.length;

        if (!totCapi) {
          html += '<div class="fej-sim-schermo-box"><p>Nessun capo assegnato allo schermo ' + stato.kSchermo + '.</p></div>';
        } else {
          var capoCorr = capi[stato.indiceCapo] || capi[0];

          html += '<div class="fej-sim-schermo-box">' +
            '<div class="fej-sim-barra-capo">' +
            '<div class="fej-sim-contatore-capo">Capo ' + (stato.indiceCapo + 1) + ' di ' + totCapi + ' (Schermo ' + stato.kSchermo + ' di ' + stato.nSchermi + ')</div>' +
            '<div class="fej-sim-badge-info">' +
            '<span class="fej-sim-pill fej-sim-pill-specie">' + (capoCorr.specie === 'capre' ? 'Capra' : 'Pecora') + (capoCorr.fattispecie === 'sotto_eta' ? ' giovane' : '') + '</span>' +
            '<span class="fej-sim-pill fej-sim-pill-sesso">' + ((capoCorr.sesso_mostrato || capoCorr.sesso) === 'M' ? '♂ Maschio' : '♀ Femmina') + '</span>' +
            '<span class="fej-sim-pill">Razza' + (capoCorr.senza_orecchini ? ' stimata' : '') + ': ' + (capoCorr.razza_mostrata || capoCorr.razza) + '</span>' +
            (capoCorr.senza_orecchini ? '<span class="fej-sim-pill">' + (capoCorr.dentizione || '') + '</span>' : '') +
            '</div>' +
            '</div>';

          // Animale SVG
          html += '<div class="fej-sim-animale-display">' +
            '<div class="fej-sim-svg-wrapper">' +
            disegnaAnimaleSvg(capoCorr) +
            '</div>';

          // Riga cosa aspettarsi se attiva
          if (stato.mostraAtteso) {
            html += '<div class="fej-sim-attesa-box">' +
              '<strong>' + (capoCorr.titolo || capoCorr.fattispecie) + '.</strong> ' + capoCorr.atteso +
              (capoCorr.fattispecie === 'ricercato' && capoCorr.ricercato_nota ? ' (' + capoCorr.ricercato_nota + ')' : '') +
              '</div>';
          }

          html += '</div>';

          // Controlli Navigazione
          html += '<div class="fej-sim-nav-controlli">' +
            '<button type="button" class="fej-sim-btn-secondario fej-sim-nav-btn" id="capo-prev" ' + (stato.indiceCapo === 0 ? 'disabled' : '') + '>◀ Indietro (←)</button>' +
            '<div class="fej-sim-nav-salto">' +
            '<span>Vai al capo:</span>' +
            '<input type="number" id="capo-goto" min="1" max="' + totCapi + '" value="' + (stato.indiceCapo + 1) + '">' +
            '<span>/ ' + totCapi + '</span>' +
            '</div>' +
            '<button type="button" class="fej-sim-btn-primario fej-sim-nav-btn" id="capo-next" ' + (stato.indiceCapo >= totCapi - 1 ? 'disabled' : '') + '>Prossimo ▶ (Spazio/→)</button>' +
            '</div>' +
            '</div>';
        }

        // Sezione Chiave e Confronto Finale
        html += '<div class="fej-sim-sez-confronto">' +
          '<h3 style="margin-top:0;color:#006b5b;">2. Chiave delle soluzioni e confronto col backup della Regia</h3>' +
          '<p style="font-size:0.9rem;margin-bottom:0.75rem;">La chiave dice che cosa era ogni animale e che cosa si doveva registrare. A fine prova salva il backup dal tablet (Salva, o la chiusura) e caricalo qui: il confronto è fattispecie per fattispecie.</p>' +
          '<div style="display:flex;flex-wrap:wrap;gap:0.6rem;margin-bottom:1rem;">' +
          '<button type="button" class="fej-sim-btn-secondario" id="btn-scarica-json">📥 Chiave delle soluzioni (JSON)</button>' +
          '<button type="button" class="fej-sim-btn-secondario" id="btn-scarica-csv">📥 Chiave delle soluzioni (CSV)</button>' +
          '<label class="fej-sim-btn-primario" style="cursor:pointer;">📊 Carica il backup finale della Regia (.zip) per il confronto<input type="file" id="file-backup-confronto" accept=".zip" style="display:none;"></label>' +
          '</div>';

        // Risultato del confronto se presente
        if (stato.resocontoConfronto) {
          html += renderTabellaConfronto(stato.resocontoConfronto);
        }

        html += '</div>';
      }

      return html;
    }

    function renderTabellaConfronto(res) {
      var html = '<div style="margin-top:1rem;background:#f9fbe7;border:1px solid #c0ca33;border-radius:6px;padding:1rem;">' +
        '<h4 style="margin:0 0 0.5rem 0;color:#33691e;">Esito del confronto: ' + res.totaleProvetteRegistrate + ' provette nel backup su ' + res.totaleChiave + ' capi simulati</h4>' +
        '<table class="fej-sim-tabella-confronto">' +
        '<thead><tr><th>Fattispecie</th><th>Capi iniettati</th><th>Presenti nel backup</th><th>Riconciliati / Risolti</th><th>Esito</th></tr></thead>' +
        '<tbody>';

      var chiavi = Object.keys(res.fattispecie);
      chiavi.forEach(function (k) {
        var f = res.fattispecie[k];
        if (f.iniettati > 0) {
          var percOk = Math.round((f.esitoCorretto / f.iniettati) * 100);
          var classeEsito = percOk >= 90 ? 'fej-sim-esito-verde' : (percOk >= 50 ? 'fej-sim-esito-giallo' : 'fej-sim-esito-rosso');
          html += '<tr>' +
            '<td><strong>' + (f.titolo || k) + '</strong></td>' +
            '<td>' + f.iniettati + '</td>' +
            '<td>' + f.trovatiNelBackup + '</td>' +
            '<td>' + f.esitoCorretto + ' (' + percOk + '%)</td>' +
            '<td class="' + classeEsito + '">' + (percOk >= 90 ? '✓ Conforme' : (percOk >= 50 ? '⚠️ Parziale' : '✗ Difformità')) + '</td>' +
            '</tr>';
        }
      });

      html += '</tbody></table></div>';
      return html;
    }

    function scaricaFile(nome, contenuto, tipo) {
      var blob = new Blob([contenuto], { type: tipo });
      var url = URL.createObjectURL(blob);
      var a = doc.createElement('a');
      a.href = url;
      a.download = nome;
      doc.body.appendChild(a);
      a.click();
      setTimeout(function () {
        doc.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 500);
    }

    function collegaEventi() {
      // Cambio Tab
      var tabSim = doc.getElementById('fej-tab-sim');
      if (tabSim) tabSim.onclick = function () { stato.tabAttiva = 'simulatore'; render(); };
      var tabTut = doc.getElementById('fej-tab-tut');
      if (tabTut) tabTut.onclick = function () { stato.tabAttiva = 'tutorial'; render(); };

      // Tutorial nav
      var tPrev = doc.getElementById('tut-prev');
      if (tPrev) tPrev.onclick = function () { if (stato.slideCorrente > 0) { stato.slideCorrente--; render(); } };
      var tNext = doc.getElementById('tut-next');
      if (tNext) tNext.onclick = function () { if (stato.slideCorrente < TESTI_SLIDE.length - 1) { stato.slideCorrente++; render(); } };

      var dots = root.querySelectorAll('.fej-sim-dot');
      dots.forEach(function (dt) {
        dt.onclick = function () {
          stato.slideCorrente = parseInt(dt.getAttribute('data-slide'), 10);
          render();
        };
      });

      // Caricamento Progetto Fittizio
      var btnFittizio = doc.getElementById('sim-btn-fittizio');
      if (btnFittizio) {
        btnFittizio.onclick = function () {
          if (root.ownerDocument.defaultView.FEJALOG_PROGETTO_888TO999) {
            stato.progetto = root.ownerDocument.defaultView.FEJALOG_PROGETTO_888TO999;
          } else if (typeof require === 'function') {
            try { stato.progetto = require('./progetto-fittizio.js'); } catch (e) {}
          }
          if (!stato.progetto) {
            // Sintetico di ripiego
            stato.progetto = { id: '888TO999', specie_dati: { pecore: { presenti: [] }, capre: { presenti: [] } } };
          }
          render();
        };
      }

      // Caricamento Progetto da Backup ZIP
      var fileBackup = doc.getElementById('sim-file-backup');
      if (fileBackup) {
        fileBackup.onchange = function (e) {
          var f = e.target.files && e.target.files[0];
          if (!f) return;
          var reader = new FileReader();
          reader.onload = function (ev) {
            Progetto.leggiBackup(ev.target.result).then(function (P) {
              if (!P.verifica || !P.verifica.ok) throw new Error('verifica non riuscita: ' + ((P.verifica && P.verifica.errori) || []).join('; '));
              stato.progetto = P.pacchetto || P;
              stato.etaMesi = P.etaMesi || 0;
              stato.nomeProgetto = (P.manifesto && P.manifesto.seduta && P.manifesto.seduta.nome) || (P.pacchetto && P.pacchetto.id) || '';
              render();
            }).catch(function (err) {
              alert('Non riesco a leggere lo snapshot o il backup: ' + err.message);
            });
          };
          reader.readAsArrayBuffer(f);
        };
      }

      // Input parametri
      var inN = doc.getElementById('sim-input-n');
      if (inN) inN.onchange = function () {
        stato.nSchermi = Math.max(1, parseInt(inN.value || 1, 10));
        if (stato.kSchermo > stato.nSchermi) stato.kSchermo = stato.nSchermi;
        render();
      };
      var inK = doc.getElementById('sim-input-k');
      if (inK) inK.onchange = function () {
        stato.kSchermo = Math.max(1, Math.min(stato.nSchermi, parseInt(inK.value || 1, 10)));
        stato.indiceCapo = 0;
        render();
      };
      var inSeme = doc.getElementById('sim-input-seme');
      if (inSeme) inSeme.onchange = function () { stato.seme = inSeme.value; };

      var chkAtt = doc.getElementById('sim-chk-atteso');
      if (chkAtt) chkAtt.onchange = function () { stato.mostraAtteso = chkAtt.checked; render(); };

      // Input percentuali
      var pInputs = root.querySelectorAll('.sim-perc-input');
      pInputs.forEach(function (inp) {
        inp.onchange = function () {
          var k = inp.getAttribute('data-chiave');
          stato.profilo.percentuali[k] = parseFloat(inp.value) || 0;
        };
      });

      // Carica Profilo JSON
      var fileProf = doc.getElementById('sim-file-profilo');
      if (fileProf) {
        fileProf.onchange = function (e) {
          var f = e.target.files && e.target.files[0];
          if (!f) return;
          var reader = new FileReader();
          reader.onload = function (ev) {
            try {
              var pj = JSON.parse(ev.target.result);
              if (pj.percentuali) {
                stato.profilo = pj;
                render();
              }
            } catch (err) {
              alert('JSON non valido: ' + err.message);
            }
          };
          reader.readAsText(f);
        };
      }

      // Avvia simulazione
      var btnAvvia = doc.getElementById('sim-btn-avvia');
      if (btnAvvia) {
        btnAvvia.onclick = function () {
          if (!stato.progetto) {
            if (root.ownerDocument.defaultView.FEJALOG_PROGETTO_888TO999) {
              stato.progetto = root.ownerDocument.defaultView.FEJALOG_PROGETTO_888TO999;
            } else {
              stato.progetto = { id: '888TO999', specie_dati: { pecore: { presenti: [] }, capre: { presenti: [] } } };
            }
          }
          stato.simulazione = generaGregge(stato.progetto, stato.profilo, stato.seme, stato.nSchermi, { etaMesi: stato.etaMesi || 0 });
          stato.indiceCapo = 0;
          stato.resocontoConfronto = null;
          render();
        };
      }

      // Navigazione Capi
      var cPrev = doc.getElementById('capo-prev');
      if (cPrev) cPrev.onclick = function () {
        if (stato.indiceCapo > 0) { stato.indiceCapo--; render(); }
      };
      var cNext = doc.getElementById('capo-next');
      if (cNext) {
        cNext.onclick = function () {
          var tot = (stato.simulazione && stato.simulazione.perSchermo[stato.kSchermo] || []).length;
          if (stato.indiceCapo < tot - 1) { stato.indiceCapo++; render(); }
        };
      }
      var cGoto = doc.getElementById('capo-goto');
      if (cGoto) {
        cGoto.onchange = function () {
          var tot = (stato.simulazione && stato.simulazione.perSchermo[stato.kSchermo] || []).length;
          var val = parseInt(cGoto.value, 10) - 1;
          stato.indiceCapo = Math.max(0, Math.min(tot - 1, val));
          render();
        };
      }

      // Tasti scelta rapida da tastiera
      root.ownerDocument.onkeydown = function (e) {
        if (stato.tabAttiva !== 'simulatore' || !stato.simulazione) return;
        var tag = (e.target && e.target.tagName || '').toUpperCase();
        if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
          var tot = (stato.simulazione.perSchermo[stato.kSchermo] || []).length;
          if (stato.indiceCapo < tot - 1) {
            e.preventDefault();
            stato.indiceCapo++;
            render();
          }
        } else if (e.key === 'ArrowLeft') {
          if (stato.indiceCapo > 0) {
            e.preventDefault();
            stato.indiceCapo--;
            render();
          }
        }
      };

      // Scarica Chiave JSON
      var btnJson = doc.getElementById('btn-scarica-json');
      if (btnJson) {
        btnJson.onclick = function () {
          if (!stato.simulazione) return;
          var jsStr = esportaChiaveJson(stato.simulazione.chiaveGlobale);
          scaricaFile('fejalog-chiave-simulazione.json', jsStr, 'application/json');
        };
      }

      // Scarica Chiave CSV
      var btnCsv = doc.getElementById('btn-scarica-csv');
      if (btnCsv) {
        btnCsv.onclick = function () {
          if (!stato.simulazione) return;
          var csvStr = esportaChiaveCsv(stato.simulazione.chiaveGlobale);
          scaricaFile('fejalog-chiave-simulazione.csv', csvStr, 'text/csv;charset=utf-8');
        };
      }

      // Carica Backup per Confronto
      var fileConf = doc.getElementById('file-backup-confronto');
      if (fileConf) {
        fileConf.onchange = function (e) {
          var f = e.target.files && e.target.files[0];
          if (!f || !stato.simulazione) return;
          var reader = new FileReader();
          reader.onload = function (ev) {
            Progetto.leggiBackup(ev.target.result).then(function (P) {
              stato.resocontoConfronto = confrontaChiaveBackup(stato.simulazione.chiaveGlobale, P);
              render();
            }).catch(function (err) {
              alert('Errore nella lettura del backup per il confronto: ' + err.message);
            });
          };
          reader.readAsArrayBuffer(f);
        };
      }
    }

    // Inizializza con il progetto fittizio pre-caricato se disponibile
    if (root.ownerDocument.defaultView && root.ownerDocument.defaultView.FEJALOG_PROGETTO_888TO999) {
      stato.progetto = root.ownerDocument.defaultView.FEJALOG_PROGETTO_888TO999;
    }
    render();
  }

  return {
    PROFILO_DEFAULT: PROFILO_DEFAULT,
    FATTISPECIE: FATTISPECIE,
    STIME: STIME,
    creaRng: creaRng,
    calcolaElettronico: calcolaElettronico,
    estraiCapiPacchetto: estraiCapiPacchetto,
    generaGregge: generaGregge,
    disegnaAnimaleSvg: disegnaAnimaleSvg,
    esportaChiaveJson: esportaChiaveJson,
    esportaChiaveCsv: esportaChiaveCsv,
    confrontaChiaveBackup: confrontaChiaveBackup,
    TESTI_SLIDE: TESTI_SLIDE,
    FIGURE_SLIDE: FIGURE_SLIDE,
    avvia: avvia
  };
});
