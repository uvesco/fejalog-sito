/* ============================================================================
   Accettazione campioni ovicaprini — FASE 3 (dopo il campo): motore puro.

   Port in JavaScript della post-elaborazione di R/parse_bdn.R (unione degli
   export, correzione dei contrassegni, spostamento definitivo, numerazione
   finale, guida al riposizionamento, Excel definitivo, schede e report per
   l'allevatore). Nessun accesso al DOM: gira identico in un browser (tablet) e
   in Node, dove i test lo confrontano con l'implementazione R a parità di input.

   DA TENERE ALLINEATO con R/parse_bdn.R: ogni funzione qui ha la sua gemella lì
   (stesso nome in camelCase → snake_case). Se cambia una regola, cambia in entrambe.

   Convenzioni: i record hanno gli stessi campi delle colonne R (`specie`,
   `progressivo`, `coda`, `corsia`, `contrassegno`, `categoria`, `in_arvet`…);
   i flag `.nuovo`/`.riassegnato` di R diventano `_nuovo`/`_riassegnato`.
   Un numero di provetta assente è `null` (NA in R).
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AccMotore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';

const PLATEAU_SIZE = 100;

/* Decodifica dei codici di USCITA della BDN (2026-10-07: tutti, anche quelli non più in uso e le cause di morte e
   macellazione in stabilimento). Nel registro ASCII il motivo è un carattere: «Y3» arriva come «Y». Gemella di
   BDN_DECODIFICA_USCITE_DEFAULT in R/parse_bdn.R e di CodiciBdn.USCITE in Fejalog. */
const DECODIFICA_DEFAULT = {
  // in uso
  'A': "CEDUTO PER AUTOCONSUMO",
  'C': "CANCELLAZIONE AMMINISTRATIVA (SOLO ASL)",
  'E': "TRASFERITO A UN PAESE ESTERO",
  'G': "USCITO VERSO CENTRO GENETICO",
  'H': "OGGETTO DI FURTO",
  'I': "USCITO VERSO STABULARIO",
  'J': "USCITA DA PASCOLO A PASCOLO",
  'K': "USCITO VERSO CENTRO DI RACCOLTA",
  'L': "IDENTIFICATI SINGOLARMENTE (PER INSIEMI SUINI E OVICAPRINI)",
  'M': "USCITO VERSO MACELLO",
  'P': "USCITO VERSO PASCOLO",
  'R': "USCITO VERSO CIRCO",
  'S': "USCITO VERSO STALLA DI TRANSITO",
  'T': "TRASFERITO PER SUBENTRO",
  'U': "USCITO VERSO UNA FIERA",
  'V': "TRASFERITO VERSO ALLEV. ITALIANO",
  'W': "OGGETTO DI SMARRIMENTO",
  '8': "DECREMENTO DEL 5% (PER INSIEMI SUINI E OVICAPRINI)",
  '9': "USCITA VERSO MACELLO ESTERO",
  // morte o macellazione in stabilimento
  'D': "MORTO/ABBAT./MAC. IN AZIENDA",
  'N': "MACELLAZIONE SPECIALE D'URGENZA",
  'Q': "MACELLAZIONE DOMICILIARE PER AUTOCONSUMO",
  'Y': "PRESUNTO MORTO, ART. 7, COMMA 7, D.LGS. 134/22, ETÀ > 20 ANNI",
  'Y3': "PRESUNTO MORTO, ART. 7, COMMA 7, D.LGS. 134/22, ETÀ > 20 ANNI",
  '2': "MORTO IN STABILIMENTO",
  '3': "ABBATTUTO IN STABILIMENTO PER PROVVEDIMENTO SANITARIO",
  '4': "EUTANASIA PER MOTIVI DI BENESSERE",
  '5': "MORTO IN STABILIMENTO PER PREDAZIONE",
  '6': "MORTE DURANTE IL TRASPORTO VERSO ALTRO STABILIMENTO",
  // causali non più in uso
  'F': "OGGETTO DI FURTO/SMARRIMENTO (CAUSALE NON PIÙ IN USO)",
  'X': "DETTAGLIO USCITA DA COMPLETARE (CAUSALE NON PIÙ IN USO)",
  'Z': "CANCELLAZIONE EFFETTUATA DALL'OPERATORE PER CAPI CHE DICHIARA NON PRESENTI IN STABILIMENTO (CAUSALE NON PIÙ IN USO)"
};
/* Decodifica dei codici di INGRESSO (di riferimento: il registro ASCII letto oggi non li porta). */
const DECODIFICA_INGRESSI = {
  // in uso
  'E': "PROVENIENTE DA PAESI UE",
  'F': "PROVENIENTE DA FIERA O MERCATO",
  'G': "PROVENIENTE DA CENTRO GENETICO",
  'L': "PROVENIENTE DA STALLA DI TRANSITO",
  'M': "PROVENIENTE DA ALL. ITALIANO",
  'N': "NATO IN STALLA",
  'O': "ISCRIZIONE NON DPA",
  'P': "RIENTRO DA PASCOLO",
  'Q': "TRASFERITO PER SUBENTRO",
  'S': "RIENTRO DA PAESE ESTERO",
  'T': "PROVENIENTE DA PAESI TERZI",
  'V': "RIENTRO FIERA MANCATA VENDITA",
  'W': "NATO IN STALLA (PARTO GEMELLARE)",
  '2': "INCREMENTO AMMINISTRATIVO (PER INSIEMI SUINI E OVICAPRINI)",
  '3': "INCREMENTO DEL 5% (PER INSIEMI SUINI O OVICAPRINI)",
  // causali non più in uso
  'B': "CAPO CONTROLLATO (CAUSALE NON PIÙ IN USO)",
  'C': "ACQUISTATO DA PAESI UE CON CEDOLA (CAUSALE NON PIÙ IN USO)",
  'D': "DEPOPOLAMENTO AREE PROTETTE (CAUSALE NON PIÙ IN USO)",
  'I': "ACQUISTATO DA STABULARIO (CAUSALE NON PIÙ IN USO)",
  'K': "PROVENIENTE DA CENTRO DI RACCOLTA (CAUSALE NON PIÙ IN USO)",
  'R': "PRIMA ISCRIZIONE (CAUSALE NON PIÙ IN USO)",
  'Z': "SCONOSCIUTO (CAPI TRANSITORIA) (CAUSALE NON PIÙ IN USO)"
};
/* La fattispecie di un capo uscito dal codice di uscita (gemella di .USCITA_FATTISPECIE in R); gli altri → morto. */
const USCITA_FATTISPECIE = { 'W': 'smarrito', 'H': 'smarrito', 'F': 'smarrito', '2': 'morto', '3': 'morto', '4': 'morto', '5': 'morto', '6': 'morto', 'D': 'morto', 'N': 'morto', 'Q': 'morto', 'Y': 'morto', 'Y3': 'morto', 'V': 'trasferito', 'E': 'trasferito', 'G': 'trasferito', 'I': 'trasferito', 'J': 'trasferito', 'K': 'trasferito', 'P': 'trasferito', 'R': 'trasferito', 'S': 'trasferito', 'T': 'trasferito', 'U': 'trasferito', 'M': 'macello', '9': 'macello', 'A': 'macello' };
/* Furto o smarrimento: un capo così che si preleva è ritrovato (report «smarriti ritrovati»). */
const USCITE_SMARRITO = ['W', 'H', 'F'];

/* Ordine predefinito delle fattispecie problematiche (= ordine nel blocco in fondo). */
const ORDINE_DEFAULT = ['smarrito', 'altro_stabilimento', 'doppia_provetta', 'marca_disponibile',
                        'specie_discordante', 'morto', 'trasferito', 'macello', 'eccezione'];
const LABEL = {
  smarrito: 'smarrito (ritrovato)',
  altro_stabilimento: 'altro stabilimento (codice diverso)',
  doppia_provetta: 'doppia provetta (stesso contrassegno)',
  marca_disponibile: 'marca disponibile (mai in BDN)',
  specie_discordante: 'specie discordante',
  morto: 'morto / abbattuto',
  trasferito: 'trasferito ad altro allevamento',
  macello: 'macello',
  eccezione: 'eccezione (non in elenco)'
};
const AZIONE = {
  smarrito: "L'allevatore denuncia il ritrovamento alle Forze dell'Ordine e ne dà comunicazione alla ASL per l'allineamento in BDN; poi la provetta si registra a mano in ARVET.",
  altro_stabilimento: "Correggere in BDN l'appartenenza del capo allo stabilimento effettivo, registrando uscita dallo stabilimento errato ed entrata in quello reale; il campione va sotto l'accettazione di quello reale.",
  doppia_provetta: "L'operatore responsabile decide quale provetta tenere: l'altra si scarta o si riassegna al capo giusto.",
  marca_disponibile: "Capo mai registrato in BDN: l'allevatore deve registrarlo, poi inserimento a mano in ARVET.",
  specie_discordante: "Verificare quale sia la specie reale e spostare la provetta nella coda giusta (rimuovi da una specie, aggiungi all'altra).",
  morto: "Ricontrollare la lettura del contrassegno; se il prelievo è reale, inserimento a mano e segnalazione dell'incongruenza all'allevatore.",
  trasferito: "Ricontrollare la lettura; verificare con l'allevatore il trasferimento dichiarato in BDN, poi inserimento a mano.",
  macello: "Ricontrollare la lettura; se il capo è ancora in azienda va sistemata la posizione in BDN, poi inserimento a mano.",
  eccezione: "Contrassegno che non risulta in nessun elenco: ricontrollarlo (spesso è un errore di lettura correggibile nel riquadro dedicato); se confermato, inserimento a mano."
};

/* ---------- utilità ------------------------------------------------------- */
const str = (x) => (x == null ? '' : String(x));
const nz = (x) => str(x).length > 0;
const trim = (x) => str(x).trim();
const isNA = (x) => x == null || x !== x;
const uniq = (a) => Array.from(new Set(a));

function truthy(x) {
  return ['SI', 'TRUE', 'VERO', '1', 'YES', 'Y'].indexOf(trim(x).toUpperCase()) >= 0;
}
/* as.integer() di R: NA se non numerico */
function toInt(x) {
  if (typeof x === 'number') return Number.isFinite(x) ? Math.trunc(x) : null;
  const s = trim(x);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
function cmp(x, y) {
  const nx = isNA(x), ny = isNA(y);
  if (nx || ny) return nx && ny ? 0 : (nx ? 1 : -1);        // NA in coda, come order() di R
  if (typeof x === 'boolean') { x = +x; y = +y; }
  if (typeof x === 'string') return x < y ? -1 : (x > y ? 1 : 0);
  return x - y;
}
/* order() di R: indici ordinati per più chiavi (funzioni indice → valore), stabile. */
function orderIdx(n, ...keys) {
  const idx = Array.from({ length: n }, (_, i) => i);
  idx.sort((a, b) => {
    for (const k of keys) { const c = cmp(k(a), k(b)); if (c) return c; }
    return a - b;
  });
  return idx;
}
function ordinaPer(arr, ...keys) {
  return orderIdx(arr.length, ...keys.map((k) => (i) => k(arr[i]))).map((i) => arr[i]);
}
function range(a, b) {                     // seq.int(a, b) NON decrescente: vuoto se a > b
  const o = []; for (let v = a; v <= b; v++) o.push(v); return o;
}
function setdiff(a, b) { const s = new Set(b); return a.filter((v) => !s.has(v)); }
function numSort(a) { return a.slice().sort((x, y) => x - y); }
function maxOr0(a) { let m = 0; for (const v of a) if (!isNA(v) && v > m) m = v; return m; }

/* ---------- corsie (coda / corsia) ---------------------------------------- */
function normCoda(x) {
  const s = trim(x).toLowerCase();
  return (s === 'main' || s === 'prob') ? s : '';
}
function normCorsia(x) {
  const s = trim(x).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 1);
  return s || 'P';
}
const codaOf = (r) => normCoda(r.coda);
const corsiaOf = (r) => (codaOf(r) === 'prob' ? normCorsia(r.corsia) : '');
const laneOf = (r) => (codaOf(r) === 'prob' ? 'prob:' + corsiaOf(r) : 'main');
const numLabel = (r) => corsiaOf(r) + str(r.progressivo);
const hasCorsie = (rows) => rows.some((r) => nz(codaOf(r)));
const plateauDi = (n) => Math.ceil(n / PLATEAU_SIZE);
const posizioneDi = (n) => ((((n - 1) % PLATEAU_SIZE) + PLATEAU_SIZE) % PLATEAU_SIZE) + 1;
const mergePlateauOf = (n) => Math.floor((n - 1) / 100) + 1;

/* ---------- classificazione di un record ---------------------------------- */
const sessoEff = (r) => (nz(r.sesso_corretto) ? str(r.sesso_corretto) : str(r.sesso));
const effInArvet = (r) => !!r.in_arvet && !r.duplicato && !r.altro_stabilimento;

function fattispecie(r) {
  let out = '';
  if (r.categoria === 'giallo')
    out = nz(r.motivo_uscita_dec) ? r.motivo_uscita_dec : (nz(r.motivo_uscita) ? r.motivo_uscita : 'uscito');
  if (r.categoria === 'blu') out = 'marca disponibile (mai registrato in BDN)';
  if (r.categoria === 'rosso') out = 'eccezione (non in elenco)';
  if (r.specie_discordante) out = (out + ' · specie discordante').trim();
  if (r.duplicato) out = 'doppia provetta (stesso contrassegno)';
  if (r.altro_stabilimento)
    out = ('altro stabilimento' + (nz(r.codice_stabilimento) ? ' (' + r.codice_stabilimento + ')' : '')).trim();
  return out;
}
function fattispecieKey(r) {
  let key = '';
  if (r.categoria === 'giallo') {
    const m = USCITA_FATTISPECIE[str(r.motivo_uscita).toUpperCase()];
    key = m || 'morto';
  }
  if (r.categoria === 'blu') key = 'marca_disponibile';
  if (r.categoria === 'rosso') key = 'eccezione';
  if (r.specie_discordante) key = 'specie_discordante';
  if (r.duplicato) key = 'doppia_provetta';
  if (r.altro_stabilimento) key = 'altro_stabilimento';
  return key;
}
function gravita(r, ordine) {
  const key = fattispecieKey(r);
  if (!key) return 0;
  const i = ordine.indexOf(key);
  return i < 0 ? ordine.length + 1 : i + 1;
}

/* ---------- lettura degli export della pagina da campo -------------------- */
function parseCsv(text) {
  const lines = str(text).replace(/^﻿/, '').split(/\r\n|\n|\r/);
  const head = (lines[0] || '').split(';');
  const rows = [];
  for (const l of lines.slice(1)) {
    if (!trim(l)) continue;
    const p = l.split(';'), o = {};
    head.forEach((h, i) => { o[h] = p[i] == null ? '' : p[i]; });
    rows.push(o);
  }
  return { head, rows };
}
/* pick_col_by_name: primo candidato (in ordine) presente fra le intestazioni, senza maiuscole */
function pickCol(head, cands) {
  const cl = head.map((h) => trim(h).toLowerCase());
  for (const c of cands) { const i = cl.indexOf(c.toLowerCase()); if (i >= 0) return head[i]; }
  return null;
}

/* Normalizza record grezzi nello schema della pagina (=.normalizza_record_pagina). */
/* bolo…data_nascita vengono da Fejalog (export formato 2): la pagina da campo non li scrive; acquisto_da…sostituisci_marche
   dall'export formato 4 (2026-10-13): acquisto con DDA, soluzione dei problemi, ricollocazione. */
const CAMPI_NOTI = ['uid', 'specie', 'progressivo', 'coda', 'corsia', 'contrassegno', 'categoria', 'sesso',
  'sesso_corretto', 'specie_bdn', 'data_uscita', 'motivo_uscita', 'motivo_uscita_dec', 'note', 'orecchino_dx',
  'orecchino_sx', 'specie_discordante', 'duplicato', 'codice_stabilimento', 'altro_stabilimento', 'in_arvet', 'ts',
  'bolo', 'senza_transponder', 'razza', 'data_nascita', 'acquisto_da', 'soluzione', 'ricollocata_da', 'sostituisci_marche'];
function normalizzaRecord(raw, src, n) {
  /* Fejalog: per un capo inserito a mano (non in elenco) sesso, razza e nascita arrivano anche in
     `anagrafica_forzata` ({sesso, razza, data_nascita}, null per gli altri): valgono dove il record è vuoto. */
  const af = (raw.anagrafica_forzata && typeof raw.anagrafica_forzata === 'object') ? raw.anagrafica_forzata : {};
  const g = (k) => trim(raw[k]) || (k === 'sesso' || k === 'razza' || k === 'data_nascita' ? trim(af[k]) : '');
  let uid = str(raw.uid).trim();
  if (!uid) uid = src + '#' + n;
  /* Campi che la pagina da campo scrive ma R non conosce (es. `denominazione`, l'allevamento di
     afferenza): si conservano SOLO per riscriverli nel file unito, così quel file si può riaprire
     nella pagina da campo senza perdere nulla. Non entrano in nessun calcolo. */
  const extra = {};
  Object.keys(raw).forEach((k) => { if (CAMPI_NOTI.indexOf(k) < 0 && k.charAt(0) !== '.') extra[k] = raw[k]; });
  return {
    _extra: extra,
    uid,
    specie: g('specie'),
    progressivo: toInt(raw.progressivo),
    coda: normCoda(raw.coda),
    corsia: normCorsia(raw.corsia),
    contrassegno: g('contrassegno'),
    categoria: g('categoria'),
    sesso: g('sesso').toUpperCase(),
    sesso_corretto: g('sesso_corretto').toUpperCase(),
    specie_bdn: g('specie_bdn'),
    data_uscita: g('data_uscita'),
    motivo_uscita: g('motivo_uscita').toUpperCase(),
    motivo_uscita_dec: g('motivo_uscita_dec'),
    note: g('note'),
    orecchino_dx: truthy(raw.orecchino_dx),
    orecchino_sx: truthy(raw.orecchino_sx),
    specie_discordante: truthy(raw.specie_discordante),
    duplicato: truthy(raw.duplicato),
    codice_stabilimento: g('codice_stabilimento'),
    altro_stabilimento: truthy(raw.altro_stabilimento),
    in_arvet: truthy(raw.in_arvet),
    ts: str(raw.ts).trim(),
    /* Fejalog: orecchino DX = elettronico (col transponder), SX = accessorio, bolo che il lettore non legge;
       senza transponder = DX o bolo da sostituire (la pagina da campo non lo scrive: si ricava). */
    bolo: truthy(raw.bolo),
    senza_transponder: truthy(raw.senza_transponder) || truthy(raw.orecchino_dx) || truthy(raw.bolo),
    razza: g('razza'),
    data_nascita: g('data_nascita'),
    /* Fejalog, export formato 4: venditore dell'acquisto con DDA (il capo è nella serie, in ARVET); soluzione scelta per
       una problematica ('' o 'coda', 'esclusa', 'normalizzata', 'ricollocata'); per la ricollocata, il capo da cui la
       provetta è stata prelevata davvero e se il report per l'allevatore dice di cambiargli le marche. */
    acquisto_da: g('acquisto_da'),
    soluzione: g('soluzione').toLowerCase(),
    ricollocata_da: g('ricollocata_da'),
    sostituisci_marche: truthy(raw.sostituisci_marche),
    _src: src
  };
}
function normalizzaRecords(recs, src) {
  const out = [];
  recs.forEach((raw, i) => {
    const r = normalizzaRecord(raw, src, i + 1);
    if (nz(r.contrassegno) && r.progressivo != null) out.push(r);
  });
  return out;
}

/* Legge un export (JSON di backup o CSV operativo) → record normalizzati con uid.
   Lancia Error con messaggio leggibile se il file non è utilizzabile. */
function leggiExport(text, nome) {
  const t = str(text);
  const isJson = /\.json$/i.test(nome || '') || /^\s*\{/.test(t.slice(0, 256));
  let recs, spostamenti = { pecore: [], capre: [] }, registriCaricati = [];
  if (isJson) {
    let obj;
    try { obj = JSON.parse(t.replace(/^﻿/, '')); } catch (e) { throw new Error('JSON non valido'); }
    recs = Array.isArray(obj) ? obj : (obj && obj.records);
    if (!recs || !recs.length) throw new Error('Backup JSON senza record.');
    spostamenti = normalizzaSpostamenti(obj && obj.spostamenti);
    registriCaricati = normalizzaRegistriCaricati(obj && obj.registri_caricati);
  } else {
    const { head, rows } = parseCsv(t);
    const col = (c) => pickCol(head, [].concat(c));
    const cols = {
      specie: col(['specie_flusso', 'specie']), progressivo: col('progressivo'), coda: col('coda'),
      corsia: col('corsia'), contrassegno: col(['contrassegno', 'codice capo', 'codice_capo']),
      categoria: col('categoria'), sesso: col('sesso'), sesso_corretto: col('sesso_corretto'),
      specie_bdn: col('specie_bdn'), data_uscita: col('data_uscita'), motivo_uscita: col('motivo_uscita'),
      motivo_uscita_dec: col('motivo_uscita_dec'), note: col('note'), orecchino_dx: col('orecchino_dx'),
      orecchino_sx: col('orecchino_sx'), specie_discordante: col('specie_discordante'),
      duplicato: col('duplicato'), codice_stabilimento: col('codice_stabilimento'),
      altro_stabilimento: col('altro_stabilimento'), in_arvet: col('in_arvet'),
      ts: col(['timestamp', 'ts']), bolo: col('bolo'), senza_transponder: col('senza_transponder'),
      razza: col('razza'), data_nascita: col('data_nascita')
    };
    recs = rows.map((r) => {
      const o = {};
      for (const k in cols) o[k] = cols[k] ? r[cols[k]] : '';
      return o;
    });
  }
  return { records: normalizzaRecords(recs, nome || 'export'), json: isJson, spostamenti, registri_caricati: registriCaricati };
}

/* ---------- registri di stalla caricati in corsa (Fejalog, export formato 4; 2026-10-13) ----------------------
   In campo la Regia sostituisce il registro di uno stabilimento di lavoro (ruolo «lavoro») o aggiunge quello di un altro
   stabilimento, come «altro» (i suoi capi fra i problematici) o come acquisto con DDA («dda»: i capi presenti dal
   venditore, o usciti da lì da vivi, nella serie di «verso», in ARVET). L'export li porta in `registri_caricati`, con le
   righe come nel pacchetto: si aggiungono ai registri caricati in ufficio (applicaRegistriCaricati), così presenti,
   non provati, storico e copertura tornano con quelli del campo. Gemelle: leggi_registri_caricati_export(),
   applica_registri_caricati() in R/parse_bdn.R. */
function rigaRegistroNorm(r) {
  const du = trim(r && r.data_uscita);
  return { contrassegno: trim(r && r.contrassegno), specie_bdn: trim(r && r.specie_bdn), sesso: trim(r && r.sesso),
    razza: trim(r && r.razza), data_nascita: trim(r && r.data_nascita), data_uscita: du,
    motivo_uscita: trim(r && r.motivo_uscita), codice_stabilimento: trim(r && r.codice_stabilimento),
    denominazione: trim(r && r.denominazione), presente: r && typeof r.presente === 'boolean' ? r.presente : !nz(du) };
}
function normalizzaRegistriCaricati(x) {
  if (!Array.isArray(x)) return [];
  const lista = (v) => (Array.isArray(v) ? v.map(trim).filter(nz) : []);
  return x.filter((g) => g && nz(trim(g.codice))).map((g) => ({
    codice: trim(g.codice), ruolo: trim(g.ruolo).toLowerCase(), verso: trim(g.verso), motivo: trim(g.motivo),
    fonte: trim(g.fonte), righe: (Array.isArray(g.righe) ? g.righe : []).map(rigaRegistroNorm).filter((r) => nz(r.contrassegno)),
    marche_pecore: lista(g.marche_pecore), marche_capre: lista(g.marche_capre) }));
}
/* Da più export: per stabilimento vale l'ultimo letto (righe e marche che non porta restano quelle di prima). */
function unisciRegistriCaricati(liste) {
  const per = new Map();
  (liste || []).forEach((l) => (l || []).forEach((g) => {
    const prima = per.get(g.codice);
    per.set(g.codice, Object.assign({}, g, {
      righe: g.righe.length ? g.righe : (prima ? prima.righe : []),
      marche_pecore: g.marche_pecore.length ? g.marche_pecore : (prima ? prima.marche_pecore : []),
      marche_capre: g.marche_capre.length ? g.marche_capre : (prima ? prima.marche_capre : []) }));
  }));
  return Array.from(per.values());
}
const specieRiga = (r) => { const s = trim(r.specie_bdn).toUpperCase(); return s === 'OVINI' ? 'pecore' : (s === 'CAPRINI' ? 'capre' : ''); };
/* regs = {pecore, capre} (righe del registro o null), marche = {pecore: [..], capre: [..]}: le righe di ogni stabilimento
   caricato sostituiscono quelle dello stesso codice; le marche si aggiungono. acquistiDda = {venditore: chi compra}. */
function applicaRegistriCaricati(regs, marche, caricati) {
  const out = { regs: { pecore: regs && regs.pecore ? regs.pecore.slice() : null, capre: regs && regs.capre ? regs.capre.slice() : null },
    marche: { pecore: ((marche && marche.pecore) || []).slice(), capre: ((marche && marche.capre) || []).slice() }, acquistiDda: {} };
  (caricati || []).forEach((g) => {
    if (g.ruolo === 'dda') out.acquistiDda[g.codice] = g.verso;
    if (g.righe.length) ['pecore', 'capre'].forEach((sp) => {
      const nuove = g.righe.filter((r) => specieRiga(r) === sp);
      const resto = (out.regs[sp] || []).filter((r) => trim(r.codice_stabilimento) !== g.codice);
      out.regs[sp] = resto.length || nuove.length ? resto.concat(nuove) : out.regs[sp];
    });
    out.marche.pecore = uniq(out.marche.pecore.concat(g.marche_pecore));
    out.marche.capre = uniq(out.marche.capre.concat(g.marche_capre));
  });
  return out;
}

/* ---------- provette eliminate (soluzione «esclusa», Fejalog formato 4; 2026-10-13) -------------------------
   Messe da parte: niente numero finale né ARVET. Escono dal canon prima della numerazione (i buchi si chiudono come per
   le perse); la guida e i report le elencano a parte. Gemella: togli_escluse(). */
const esclusa = (r) => str(r.soluzione).toLowerCase() === 'esclusa';
function togliEscluse(canon) {
  const via = ordinaPer(canon.filter(esclusa), (r) => r.specie, (r) => codaOf(r) === 'prob', (r) => corsiaOf(r), (r) => r.progressivo);
  return { canon: canon.filter((r) => !esclusa(r)), escluse: via };
}
/* ---------- soluzione dei problemi per tipologia e per provetta (2026-10-13) --------------------------------
   Per ogni provetta che non va in ARVET da sola: «coda» (in coda fra i problematici, ARVET a mano: come sempre),
   «esclusa» (eliminata: messa da parte, niente numero finale né ARVET), «normalizzata» (il capo è presente nei registri
   dello stabilimento di lavoro, o di un acquisto con DDA: dati nuovi e ARVET automatico, in coda col numero nuovo).
   Le sceglie chi rifinisce, per tipologia (regola) e provetta per provetta (eccezione); le soluzioni scritte da Fejalog
   nell'export valgono se qui non se ne sceglie un'altra. Gemelle: tipologia_problema(), applica_soluzioni(),
   parse_eccezioni_soluzioni() in R/parse_bdn.R; le stesse tipologie di Fejalog (TipologieProblemi). */
const TIPOLOGIE_PROBLEMI = [['DOPPI', 'Doppi contrassegni'], ['SPECIE', 'Specie discordante'], ['ALTRO_STABILIMENTO', 'Altro stabilimento'],
  ['SMARRITI', 'Smarriti'], ['RUBATI', 'Rubati'], ['MORTI_MACELLATI', 'Usciti: morti o macellati'], ['TRASFERITI', 'Usciti: trasferiti o altro'],
  ['MARCHE', 'Marche disponibili'], ['NON_IN_ELENCO', 'Non in elenco e inserimenti forzati'], ['ALTRE', 'Altre problematiche']];
const USCITE_MORTE_MACELLO = ['D', 'N', 'Q', 'Y', 'Y3', '2', '3', '4', '5', '6', 'M', '9', 'A'];
const TRASFERIMENTI_VIVO = ['V', 'T', 'S', 'U', 'K'];
function tipologiaProblema(r) {
  if (effInArvet(r)) return '';
  const m = str(r.motivo_uscita).toUpperCase(), c = str(r.categoria).toLowerCase();
  if (r.duplicato) return 'DOPPI';
  if (r.specie_discordante) return 'SPECIE';
  if (r.altro_stabilimento) return 'ALTRO_STABILIMENTO';
  if (c === 'giallo' && m === 'W') return 'SMARRITI';
  if (c === 'giallo' && (m === 'H' || m === 'F')) return 'RUBATI';
  if (c === 'giallo' && USCITE_MORTE_MACELLO.indexOf(m) >= 0) return 'MORTI_MACELLATI';
  if (c === 'giallo') return 'TRASFERITI';
  if (c === 'blu') return 'MARCHE';
  if (c === 'rosso' || !nz(c)) return 'NON_IN_ELENCO';
  return 'ALTRE';
}
/* la riga del registro con cui la provetta si può normalizzare: il capo presente nello stabilimento di lavoro (o da un
   venditore con DDA, anche uscito da lì da vivo), mai per i doppi o la specie discordante; null altrimenti */
function rigaNormalizza(r, regs, codiceLavoro, acquistiDda) {
  if (!nz(tipologiaProblema(r)) || r.duplicato || r.specie_discordante) return null;
  const reg = (regs && regs[r.specie]) || [];
  const dda = acquistiDda || {};
  const righe = reg.filter((g) => g.contrassegno === r.contrassegno);
  const pres = righe.filter((g) => g.presente === true);
  const mia = (g) => !nz(codiceLavoro) || !nz(g.codice_stabilimento) || g.codice_stabilimento === codiceLavoro;
  return pres.find(mia) || pres.find((g) => nz(dda[g.codice_stabilimento])) ||
    righe.find((g) => g.presente !== true && nz(dda[g.codice_stabilimento]) && TRASFERIMENTI_VIVO.indexOf(str(g.motivo_uscita).toUpperCase()) >= 0) || null;
}
/* «A3 elimina», «57 coda», «A5 normalizza»: una riga per provetta (numero di campo; la lettera per i problematici) */
function parseEccezioniSoluzioni(testo, specie) {
  const parole = { elimina: 'esclusa', eliminata: 'esclusa', esclusa: 'esclusa', escludi: 'esclusa', coda: 'coda',
    normalizza: 'normalizzata', normalizzata: 'normalizzata' };
  const out = [];
  str(testo).split(/\r?\n/).map(trim).filter(nz).forEach((riga) => {
    const p = riga.split(/[\s;,:]+/).filter(nz);
    if (p.length < 2) return;
    const sol = parole[p[p.length - 1].toLowerCase()];
    const et = p.slice(0, -1).join('').toUpperCase();
    if (sol && /^[A-Z]?\d+$/.test(et)) out.push({ specie, etichetta: et, soluzione: sol });
  });
  return out;
}
/* opz = {perTipo: {TIPO: soluzione}, perProvetta: [{specie, etichetta, soluzione}], regs, codiceLavoro, acquistiDda} */
function applicaSoluzioni(canon, opz) {
  const perTipo = (opz && opz.perTipo) || {}, perProv = (opz && opz.perProvetta) || [];
  return canon.map((r0) => {
    const t = tipologiaProblema(r0);
    if (!nz(t)) return r0;
    const ecc = perProv.filter((e) => e.specie === r0.specie && e.etichetta === numLabel(r0)).pop();
    const sol = ecc ? ecc.soluzione : (nz(perTipo[t]) ? perTipo[t] : '');
    if (!nz(sol)) return r0;
    const r = Object.assign({}, r0);
    if (sol === 'esclusa' || sol === 'coda') { r.soluzione = sol; return r; }
    if (sol !== 'normalizzata') return r0;
    const g = rigaNormalizza(r0, opz.regs, opz.codiceLavoro, opz.acquistiDda);
    if (!g) return r0;
    const dda = nz(opz.codiceLavoro) && nz(g.codice_stabilimento) && g.codice_stabilimento !== opz.codiceLavoro;
    Object.assign(r, { categoria: 'verde', in_arvet: true, altro_stabilimento: false, motivo_uscita: '', motivo_uscita_dec: '',
      data_uscita: '', codice_stabilimento: str(g.codice_stabilimento), soluzione: 'normalizzata',
      acquisto_da: dda ? str(g.codice_stabilimento) : r.acquisto_da });
    ['sesso', 'razza', 'data_nascita'].forEach((k) => { if (nz(g[k])) r[k] = str(g[k]); });
    return r;
  });
}
function reportEscluse(escluse) {
  return (escluse || []).map((r) => ({ specie: r.specie, provetta_campo: numLabel(r), contrassegno: r.contrassegno, fattispecie: fattispecie(r) }));
}

/* ---------- spostamenti manuali (2026-10-07) ----------------------------------
   «La provetta C sta al numero N»: fatto al tavolo dei plateau senza seguire la guida, quando conviene (per esempio
   per non spostare un plateau intero). Si registrano in Fejalog (Riordino) e qui («Dopo il campo»); l'export di Fejalog
   dal formato 3 li porta nel campo `spostamenti` {pecore: [{contrassegno, provetta}], capre: […]}, nell'ordine in cui
   sono stati fatti. Uno scambio fra due provette della serie si scrive {contrassegno, con}: «C dove sta adesso D».
   Due momenti (utente, 2026-10-08), `quando`:
   - 'dopo' (predefinito): dopo la guida, anche più volte: cambia il numero finale (applicaSpostamenti, dopo la
     numerazione);
   - 'prima': prima della guida o al posto della guida: la provetta è stata riscritta col numero N e messa lì, ed è il
     suo nuovo punto di partenza; la numerazione finale si calcola da lì (applicaSpostamentiPrima), e se la
     disposizione rispetta già le regole non si sposta più.
   Gemelli R: applica_spostamenti(), applica_spostamenti_prima(). */
function normalizzaSpostamenti(x) {
  const out = { pecore: [], capre: [] };
  if (!x || typeof x !== 'object') return out;
  ['pecore', 'capre'].forEach((sp) => {
    (Array.isArray(x[sp]) ? x[sp] : []).forEach((s) => {
      const c = str(s && s.contrassegno).replace(/\s/g, '').toUpperCase(), n = toInt(s && s.provetta);
      const con = str(s && s.con).replace(/\s/g, '').toUpperCase();
      const quando = str(s && s.quando).toLowerCase() === 'prima' ? 'prima' : 'dopo';
      if (nz(c) && n != null) out[sp].push({ contrassegno: c, provetta: n, con: '', quando });
      else if (nz(c) && nz(con)) out[sp].push({ contrassegno: c, provetta: null, con, quando });
    });
  });
  return out;
}
/* Gli spostamenti di più file, uno dopo l'altro (nell'ordine dei file). */
function unisciSpostamenti(liste) {
  const out = { pecore: [], capre: [] };
  (liste || []).forEach((l) => { const n = normalizzaSpostamenti(l); out.pecore = out.pecore.concat(n.pecore); out.capre = out.capre.concat(n.capre); });
  return out;
}
/* Il campo di testo: una riga per spostamento, «contrassegno numero» (o le ultime cifre del contrassegno, se bastano a
   riconoscerlo). Separatori: spazi, «;», «,», tabulazione, «→» o «->». */
function parseSpostamenti(testo, quando) {
  const q = quando === 'prima' ? 'prima' : 'dopo';
  return str(testo).split(/\r?\n/).map(trim).filter(nz).map((riga) => {
    const p = riga.replace(/->|→/g, ' ').split(/[\s;,]+/).filter(nz);
    const n = p.length >= 2 ? toInt(p[p.length - 1]) : null;
    return { contrassegno: p.slice(0, -1).join('').toUpperCase(), provetta: n, riga };
  }).filter((s) => nz(s.contrassegno) && s.provetta != null).map((s) => ({ contrassegno: s.contrassegno, provetta: s.provetta, con: '', quando: q }));
}
/* La provetta della serie (in ARVET) col contrassegno [c], o la sola che finisce con quelle cifre (almeno 3). */
function trovaInSerie(righe, c) {
  const esatta = righe.filter((r) => effInArvet(r) && r.contrassegno === c);
  if (esatta.length) return { riga: esatta[0] };
  if (!/^\d{3,}$/.test(c)) return { riga: null, motivo: 'provetta non trovata fra quelle della serie (in ARVET)' };
  const fine = righe.filter((r) => effInArvet(r) && str(r.contrassegno).replace(/\D/g, '').endsWith(c));
  if (fine.length === 1) return { riga: fine[0] };
  return { riga: null, motivo: fine.length ? 'ambiguo: ' + fine.length + ' provette della serie finiscono con ' + c : 'provetta non trovata fra quelle della serie (in ARVET)' };
}
/* Maschi in testa (Brucella ovis): quante coppie maschio / non maschio della serie sono fuori ordine (0 = blocco dei
   maschi intero in testa). Il motore non lo garantisce sempre: con «chiudi i buchi» un buco fra i maschi lo tappa
   l'ultima provetta. Uno spostamento non deve peggiorarlo. */
function inversioniMaschi(righe) {
  const m = [], a = [];
  righe.forEach((r) => { if (effInArvet(r)) (r.gruppo === 'maschio (ovino)' ? m : a).push(r.provetta); });
  let k = 0;
  m.forEach((x) => a.forEach((y) => { if (x > y) k++; }));
  return k;
}
/* Applica gli spostamenti [lista] alla numerazione finale [nf] di una specie, uno dopo l'altro. Se al numero N c'è già
   una provetta della serie, prende il numero lasciato libero (scambio); se N è libero, la provetta ci va e il suo numero
   resta libero. Solo provette della serie, dello stesso gruppo (maschio con maschio), senza rompere i maschi in testa né
   andare oltre l'inizio dei problematici, che restano in coda come li fa il motore. Uno spostamento non valido si salta
   e lo si dice negli esiti. Le provette toccate hanno _manuale (motivo nella guida). */
function applicaSpostamenti(nf, lista, specie) {
  const righe = (nf || []).map((r) => Object.assign({}, r));
  const esiti = [];
  (lista || []).forEach((s) => {
    const c = str(s.contrassegno).replace(/\s/g, '').toUpperCase(), con = str(s.con).replace(/\s/g, '').toUpperCase();
    const t = trovaInSerie(righe, c), a = t.riga;
    let motivo = t.motivo || '', n = toInt(s.provetta);
    if (nz(con)) {                       // scambio: «C dove sta adesso D»
      const d = trovaInSerie(righe, con);
      n = d.riga ? d.riga.provetta : null;
      if (!motivo && !d.riga) motivo = 'la provetta con cui scambiare non è fra quelle della serie (' + con + ')';
    }
    if (!motivo && (n == null || n < 1)) motivo = 'numero non valido';
    if (!motivo && a.provetta === n) motivo = 'è già al numero ' + n;
    const occ = !motivo ? righe.find((r) => r !== a && r.provetta === n) || null : null;
    if (!motivo && occ && !effInArvet(occ)) motivo = 'al numero ' + n + ' c\'è una provetta problematica';
    if (!motivo && occ && occ.gruppo !== a.gruppo) motivo = 'un maschio con un non maschio: si romperebbe il blocco dei maschi in testa';
    if (!motivo && !occ) {
      // la coda dei problematici comincia dopo l'ultima provetta della serie (quelli nel mezzo, come gli smarriti
      // dello stesso stabilimento, non contano)
      let maxS = -Infinity, coda = Infinity;
      righe.forEach((r) => { if (effInArvet(r) && r.provetta > maxS) maxS = r.provetta; });
      righe.forEach((r) => { if (!effInArvet(r) && r.provetta > maxS && r.provetta < coda) coda = r.provetta; });
      if (n > coda) motivo = 'oltre l\'inizio dei problematici in coda (' + coda + ')';
      else {
        const prima = inversioniMaschi(righe), da = a.provetta; a.provetta = n;
        const dopo = inversioniMaschi(righe); a.provetta = da;
        if (dopo > prima) motivo = 'si romperebbe il blocco dei maschi in testa';
      }
    }
    esiti.push({ specie, contrassegno: a ? a.contrassegno : c, provetta: n, da: a ? a.provetta : null, da_corsia: '',
      con: occ ? occ.contrassegno : '', applicato: !motivo, motivo, quando: 'dopo' });
    if (motivo) return;
    if (occ) { occ.provetta = a.provetta; occ._manuale = true; }
    a.provetta = n; a._manuale = true;
  });
  return { righe: ordinaPer(righe, (r) => r.provetta), esiti };
}

/* Concatena i record di più file e deduplica per uid. */
function mergeConcatRecords(liste) {
  const seen = new Set(), out = [];
  for (const l of liste) for (const r of (l || [])) {
    if (seen.has(r.uid)) continue;
    seen.add(r.uid); out.push(r);
  }
  return out;
}

/* ---------- unione: anomalie e risoluzione dei numeri duplicati ----------- */
function mergeAnomalie(records) {
  const dup_numeri = [], dup_contrassegni = [], buchi = [];
  const specie = uniq(records.map((r) => r.specie));
  for (const sp of ['pecore', 'capre']) {
    if (specie.indexOf(sp) < 0) continue;
    const rs = records.filter((r) => r.specie === sp);
    const lanesSp = uniq(rs.map(laneOf));
    const lanes = ['main'].concat(setdiff(lanesSp, ['main']).sort());
    for (const ln of lanes) {
      const r = rs.filter((x) => laneOf(x) === ln);
      if (!r.length) continue;
      const isProb = ln !== 'main';
      const codaOut = isProb ? 'prob' : '';
      const sigOut = isProb ? ln.replace(/^prob:/, '') : '';
      const conta = new Map();
      r.forEach((x) => conta.set(x.progressivo, (conta.get(x.progressivo) || 0) + 1));
      const dn = numSort(Array.from(conta.keys()).filter((k) => conta.get(k) > 1));
      for (const p of dn) {
        const g = r.filter((x) => x.progressivo === p);
        dup_numeri.push({ specie: sp, coda: codaOut, corsia: sigOut, progressivo: p, n: g.length,
          contrassegni: uniq(g.map((x) => x.contrassegno)).join(', '), uids: g.map((x) => x.uid).join(', ') });
      }
      /* Buchi: solo nella SERIE principale (nei plateau problematici la numerazione è provvisoria) */
      if (!isProb) {
        const nums = numSort(uniq(r.map((x) => x.progressivo)));
        const perPlateau = new Map();
        nums.forEach((v) => { const k = mergePlateauOf(v); if (!perPlateau.has(k)) perPlateau.set(k, []); perPlateau.get(k).push(v); });
        for (const k of numSort(Array.from(perPlateau.keys()))) {
          const v = perPlateau.get(k);
          const miss = setdiff(range(v[0], v[v.length - 1]), v);
          miss.forEach((m) => buchi.push({ specie: sp, coda: codaOut, corsia: sigOut,
            plateau: mergePlateauOf(v[0]), progressivo: m }));
        }
      }
    }
    /* contrassegni su più provette (attraverso serie e plateau problematici) */
    const etich = new Map();
    rs.forEach((x) => {
      if (!etich.has(x.contrassegno)) etich.set(x.contrassegno, []);
      etich.get(x.contrassegno).push(x);
    });
    const nomi = Array.from(etich.keys()).sort();
    for (const cc of nomi) {
      const g = etich.get(cc);
      const labels = uniq(g.map(numLabel));
      if (labels.length <= 1) continue;
      const o = ordinaPer(g, (x) => laneOf(x) !== 'main', (x) => laneOf(x), (x) => x.progressivo);
      dup_contrassegni.push({ specie: sp, contrassegno: cc,
        progressivi: uniq(o.map(numLabel)).join(', '), n: labels.length });
    }
  }
  return { dup_numeri, dup_contrassegni, buchi };
}

/* Risolve i NUMERI duplicati, per corsia. `azioni` = {chiave: 'rinumera'|'elimina'} con
   chiave "<specie>:<coda>:<corsia>:<progressivo>" (default: rinumera). */
function mergeRisolviNumeri(records, azioni) {
  azioni = azioni || {};
  const res = records.map((r) => Object.assign({}, r));
  const keep = res.map(() => true);
  const log = [];
  const lane = res.map(laneOf);
  const specie = uniq(res.map((r) => r.specie));
  for (const sp of ['pecore', 'capre']) {
    if (specie.indexOf(sp) < 0) continue;
    const lanesSp = uniq(res.filter((r) => r.specie === sp).map(laneOf));
    for (const ln of ['main'].concat(setdiff(lanesSp, ['main']).sort())) {
      const idxSp = res.map((r, i) => i).filter((i) => res[i].specie === sp && lane[i] === ln);
      if (!idxSp.length) continue;
      const isProb = ln !== 'main';
      const codaOut = isProb ? 'prob' : '';
      const sigOut = isProb ? ln.replace(/^prob:/, '') : '';
      const used = new Set(idxSp.map((i) => res[i].progressivo));
      const conta = new Map();
      idxSp.forEach((i) => conta.set(res[i].progressivo, (conta.get(res[i].progressivo) || 0) + 1));
      const dn = numSort(Array.from(conta.keys()).filter((k) => conta.get(k) > 1));
      for (const p of dn) {
        let grp = idxSp.filter((i) => res[i].progressivo === p);
        grp = orderIdx(grp.length, (k) => res[grp[k]].ts, (k) => res[grp[k]].uid).map((k) => grp[k]);
        const others = grp.slice(1);
        const keys = [sp + ':' + codaOut + ':' + sigOut + ':' + p, sp + ':' + codaOut + ':' + p];
        if (!isProb) keys.push(sp + ':' + p);
        let act = 'rinumera';
        for (const k of keys) if (azioni[k]) { act = azioni[k]; break; }
        for (const o of others) {
          if (act === 'elimina') {
            keep[o] = false;
            log.push({ specie: sp, coda: codaOut, corsia: sigOut, azione: 'elimina',
              uid: res[o].uid, contrassegno: res[o].contrassegno, da: p, a: null });
          } else {
            let nn = 1; while (used.has(nn)) nn++;
            res[o].progressivo = nn; used.add(nn);
            log.push({ specie: sp, coda: codaOut, corsia: sigOut, azione: 'rinumera',
              uid: res[o].uid, contrassegno: res[o].contrassegno, da: p, a: nn });
          }
        }
      }
    }
  }
  return { records: res.filter((r, i) => keep[i]), log };
}

function mergePagina(records, azioni) {
  const ord = ordinaPer(records, (r) => r.specie, (r) => laneOf(r) !== 'main', (r) => laneOf(r), (r) => r.progressivo);
  const anomPre = mergeAnomalie(ord);
  const ris = mergeRisolviNumeri(ord, azioni);
  return { records: ris.records, log: ris.log, anomalie: anomPre, anomalie_post: mergeAnomalie(ris.records),
           n_input: ord.length, n_output: ris.records.length };
}

const PAGINA_REC_COLS = ['uid', 'specie', 'progressivo', 'coda', 'corsia', 'contrassegno', 'categoria',
  'sesso', 'sesso_corretto', 'specie_bdn', 'data_uscita', 'motivo_uscita', 'motivo_uscita_dec', 'note',
  'orecchino_dx', 'orecchino_sx', 'specie_discordante', 'duplicato', 'codice_stabilimento',
  'altro_stabilimento', 'in_arvet', 'ts', 'bolo', 'senza_transponder', 'razza', 'data_nascita',
  'acquisto_da', 'soluzione', 'ricollocata_da', 'sostituisci_marche'];
/* Formato-backup della pagina da campo ({app, backup_ts, meta, records}), rileggibile
   da importBackup() della pagina e da leggiExport(). */
function mergeToBackupJson(records, meta, postazione) {
  const recs = records.map((r) => {
    const o = {}; PAGINA_REC_COLS.forEach((c) => { o[c] = r[c]; });
    Object.keys(r._extra || {}).forEach((k) => { o[k] = r._extra[k]; });      // superset di R: nessuna perdita
    return o;
  });
  return JSON.stringify({ app: 'accettazione_campioni', backup_ts: new Date().toISOString().slice(0, 19),
    postazione: postazione || 'merge', merge: true, meta: meta || {}, records: recs }, null, 1);
}

/* ---------- arricchimento col registro ------------------------------------ */
/* regs = {pecore: righe|null, capre: righe|null} (righe grezze del registro storico) */
function arricchisciCanon(canon, regs) {
  const out = canon.map((r) => Object.assign({}, r, {
    sesso: str(r.sesso), razza: str(r.razza), data_nascita: str(r.data_nascita) }));
  for (const sp of ['pecore', 'capre']) {
    const reg = regs && regs[sp];
    if (!reg || !reg.length) continue;
    const primo = new Map();
    reg.forEach((r) => { if (!primo.has(r.contrassegno)) primo.set(r.contrassegno, r); });
    out.forEach((rec) => {
      if (rec.specie !== sp) return;
      const m = primo.get(rec.contrassegno);
      if (!m) return;
      ['sesso', 'razza', 'data_nascita'].forEach((c) => { if (!nz(rec[c]) && nz(m[c])) rec[c] = str(m[c]); });
    });
  }
  return out;
}

/* ---------- modifiche operative (rimuovi / aggiungi) ---------------------- */
const RIGA_VUOTA = {
  specie: '', progressivo: null, coda: '', corsia: '', contrassegno: '', categoria: '', in_arvet: false,
  specie_discordante: false, duplicato: false, sesso: '', sesso_corretto: '', motivo_uscita: '',
  motivo_uscita_dec: '', data_uscita: '', orecchino_dx: false, orecchino_sx: false, bolo: false,
  senza_transponder: false, codice_stabilimento: '', altro_stabilimento: false, note: '', razza: '',
  data_nascita: '', uid: '', ts: '', acquisto_da: '', soluzione: '', ricollocata_da: '', sostituisci_marche: false
};
/* rimuovi = [{specie, progressivo, coda, corsia}], aggiungi = [{specie, contrassegno}] */
function applicaModifiche(canon, rimuovi, aggiungi) {
  let out = canon.map((r) => Object.assign({ _nuovo: false }, r));
  for (const rm of (rimuovi || [])) {
    const sp = str(rm.specie), pr = toInt(rm.progressivo);
    if (pr == null || !sp) continue;
    let ln = 'main';
    if (normCoda(rm.coda) === 'prob') ln = 'prob:' + normCorsia(rm.corsia);
    out = out.filter((r) => !(r.specie === sp && r.progressivo === pr && laneOf(r) === ln));
  }
  for (const ad of (aggiungi || [])) {
    const sp = str(ad.specie), cod = trim(ad.contrassegno);
    if (!sp || !cod) continue;
    const maxn = maxOr0(out.filter((r) => r.specie === sp && laneOf(r) === 'main').map((r) => r.progressivo));
    const tmpl = out.length ? out[0] : RIGA_VUOTA;
    const row = {};
    for (const k of Object.keys(tmpl)) {
      const v = tmpl[k];
      row[k] = typeof v === 'boolean' ? false : (typeof v === 'number' || v === null ? null : '');
    }
    row.specie = sp; row.contrassegno = cod; row.progressivo = maxn + 1;
    row.coda = hasCorsie(out.filter((r) => r.specie === sp)) ? 'main' : '';
    row.categoria = 'verde'; row.in_arvet = true; row._nuovo = true;
    out.push(row);
  }
  return out;
}

/* ---------- correzione del contrassegno ----------------------------------- */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = new Array(n + 1), cur = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const c = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + c);
    }
    const t = prev; prev = cur; cur = t;
  }
  return prev[n];
}

/* Candidati alla correzione: per ogni provetta problematica, i capi PRESENTI non campionati
   a distanza ≤ maxDist. Ritorna righe {coda, corsia, progressivo, etichetta, contrassegno,
   fattispecie, candidato, distanza, info}. */
function suggerisciCorrezioni(canon, regSp, specie, opz) {
  opz = opz || {};
  const maxDist = opz.maxDist == null ? 1 : opz.maxDist;
  const maxPer = opz.maxPerProvetta == null ? 8 : opz.maxPerProvetta;
  const codiceLavoro = opz.codiceLavoro || '';
  const sub = canon.filter((r) => r.specie === specie);
  if (!sub.length || !regSp || !regSp.length) return [];
  const prob = sub.filter((r) => !effInArvet(r));
  if (!prob.length) return [];
  let pres = regSp.filter((r) => r.presente === true);
  if (nz(codiceLavoro)) pres = pres.filter((r) => !nz(r.codice_stabilimento) || r.codice_stabilimento === codiceLavoro);
  const campionati = new Set(sub.map((r) => r.contrassegno));
  const visti = new Set();
  const liberi = pres.filter((r) => {
    if (campionati.has(r.contrassegno) || visti.has(r.contrassegno)) return false;
    visti.add(r.contrassegno); return true;
  });
  if (!liberi.length) return [];
  const out = [];
  for (const p of prob) {
    const hit = [];
    liberi.forEach((l, j) => {
      if (Math.abs(l.contrassegno.length - p.contrassegno.length) > maxDist) return;
      const d = levenshtein(p.contrassegno, l.contrassegno);
      if (d <= maxDist) hit.push({ l, d });
    });
    if (!hit.length) continue;
    const ord = ordinaPer(hit, (h) => h.d, (h) => h.l.contrassegno).slice(0, maxPer);
    for (const h of ord) {
      const info = [str(h.l.sesso), str(h.l.razza), 'nato ' + str(h.l.data_nascita)].join(' ').trim();
      out.push({ coda: codaOf(p), corsia: corsiaOf(p), progressivo: p.progressivo,
        etichetta: corsiaOf(p) + p.progressivo, contrassegno: p.contrassegno,
        fattispecie: fattispecie(p), candidato: h.l.contrassegno, distanza: h.d, info });
    }
  }
  return out;
}

/* correzioni = [{specie, coda, corsia, progressivo, nuovo_contrassegno}] */
function correggiContrassegni(canon, correzioni, regs, codiceLavoro, decodifica) {
  if (!correzioni || !correzioni.length) return canon;
  decodifica = decodifica || DECODIFICA_DEFAULT;
  const out = canon.map((r) => Object.assign({ coda_orig: '', corsia_orig: '', progressivo_orig: null, _riassegnato: false }, r));
  for (const c of correzioni) {
    const sp = str(c.specie), nuovo = trim(c.nuovo_contrassegno), pr = toInt(c.progressivo);
    if (!sp || !nuovo || pr == null) continue;
    const cd = normCoda(c.coda), sg = normCorsia(c.corsia);
    const laneTarget = cd === 'prob' ? 'prob:' + sg : 'main';
    const j = out.findIndex((r) => r.specie === sp && r.progressivo === pr && laneOf(r) === laneTarget);
    if (j < 0) continue;
    const rec = out[j];
    if (!nz(rec.coda_orig)) {                     // provenienza fisica: solo la prima volta
      rec.coda_orig = codaOf(rec); rec.corsia_orig = corsiaOf(rec); rec.progressivo_orig = rec.progressivo;
    }
    const vecchio = rec.contrassegno;
    rec.contrassegno = nuovo;

    const reg = regs && regs[sp];
    const riga = reg ? reg.find((r) => r.contrassegno === nuovo) : null;
    const trovato = !!riga;
    const presente = trovato && riga.presente === true;
    const esterno = trovato && nz(codiceLavoro) && nz(riga.codice_stabilimento) && riga.codice_stabilimento !== codiceLavoro;
    const giaCampionato = out.some((r, i) => i !== j && r.specie === sp && r.contrassegno === nuovo);

    rec.specie_discordante = false;
    rec.duplicato = giaCampionato;
    rec.altro_stabilimento = !!esterno;
    if (trovato && riga.codice_stabilimento !== undefined) rec.codice_stabilimento = str(riga.codice_stabilimento);
    ['sesso', 'razza', 'data_nascita'].forEach((cc) => { if (trovato && riga[cc] !== undefined) rec[cc] = str(riga[cc]); });

    if (presente) {
      rec.categoria = 'verde';
      rec.motivo_uscita = ''; rec.motivo_uscita_dec = ''; rec.data_uscita = '';
      rec.in_arvet = !giaCampionato && !esterno;
    } else if (trovato) {                          // capo uscito: resta manuale
      rec.categoria = 'giallo'; rec.in_arvet = false;
      if (riga.motivo_uscita !== undefined) rec.motivo_uscita = str(riga.motivo_uscita);
      if (riga.data_uscita !== undefined) rec.data_uscita = str(riga.data_uscita);
      rec.motivo_uscita_dec = decodifica[rec.motivo_uscita] || '';
    } else {                                       // contrassegno non in elenco
      rec.categoria = 'rosso'; rec.in_arvet = false;
    }
    const nota = 'contrassegno corretto da ' + vecchio + ' (era ' + rec.corsia_orig + rec.progressivo_orig + ')';
    rec.note = (rec.note ? rec.note + ' · ' : '') + nota;
    rec.note = rec.note.trim();

    if (effInArvet(rec)) {                         // rientra nella SERIE, con numero temporaneo
      const maxn = maxOr0(out.filter((r) => r.specie === sp && laneOf(r) === 'main').map((r) => r.progressivo));
      rec.progressivo = maxn + 1;
      rec.coda = hasCorsie(out) ? 'main' : '';
      rec.corsia = '';
      rec._riassegnato = true;
    }
  }
  return out;
}

/* ---------- numerazione finale -------------------------------------------- */
function riordinaScambi(canon, specie, ordine, compatta) {
  ordine = ordine && ordine.length ? ordine : ORDINE_DEFAULT;
  const sub = canon.filter((r) => r.specie === specie && r.progressivo != null).map((r) => Object.assign({}, r));
  if (!sub.length) return { mapping: [] };
  const n = sub.length;
  const nums = sub.map((r) => r.progressivo);
  const grav = sub.map((r) => gravita(r, ordine));
  sub.forEach((r) => { r.fattispecie = fattispecie(r); });
  const eff = sub.map(effInArvet);
  const isM = sub.map((r, i) => specie === 'pecore' && sessoEff(r).toUpperCase() === 'M' && eff[i]);
  const isProb = eff.map((e) => !e);
  const lanceProb = sub.map((r) => laneOf(r) !== 'main');
  const gruppo = (i) => (isM[i] ? 'maschio (ovino)' : (isProb[i] ? 'problematico' : 'in azienda'));
  const chiudi = (prov) => {
    sub.forEach((r, i) => { r.provetta_campo = nums[i]; r.provetta = prov[i]; r.gruppo = gruppo(i); r.gravita = grav[i]; });
    return { mapping: ordinaPer(sub, (r) => r.provetta) };
  };

  if (hasCorsie(sub)) {
    /* MODALITÀ CORSIE: serie principale ferma; in fondo la corsia dei problematici e i
       problematici legacy (coda ''). Gli smarriti dello stesso stabilimento restano nel mezzo. */
    const toTail = sub.map((r, i) => lanceProb[i] || (!nz(codaOf(r)) && isProb[i]));
    const prov = nums.slice();
    const mainr = [];
    toTail.forEach((t, i) => { if (!t) mainr.push(i); });
    if (mainr.length) {
      /* 1) maschi in testa, con scambio 1-a-1 */
      const slots = numSort(mainr.map((i) => prov[i]));
      const male = orderIdx(mainr.length, (k) => nums[mainr[k]]).map((k) => mainr[k]).filter((i) => isM[i]);
      male.forEach((r, i) => {
        const target = slots[i];
        if (prov[r] === target) return;
        const other = mainr.filter((j) => prov[j] === target);
        other.forEach((o) => { prov[o] = prov[r]; });
        prov[r] = target;
      });
      /* 2) chiusura buchi tirando su le ULTIME provette della serie */
      const k = male.length;
      const occ = numSort(mainr.map((i) => prov[i]));
      let gaps = [];
      if (compatta) {
        gaps = setdiff(range(occ[0], occ[occ.length - 1]), occ);
      } else if (k > 0) {
        const dopo = occ.filter((v) => v > occ[k - 1]);
        if (dopo.length) gaps = setdiff(range(occ[k - 1] + 1, Math.min.apply(null, dopo) - 1), occ);
      }
      for (const g of numSort(gaps)) {
        let mx = -Infinity; mainr.forEach((i) => { if (prov[i] > mx) mx = prov[i]; });
        if (mx <= g) break;
        const rmax = mainr.find((i) => prov[i] === mx);
        prov[rmax] = g;
      }
    }
    /* 3) problematici in fondo, per gravità */
    let base = 0; toTail.forEach((t, i) => { if (!t && prov[i] > base) base = prov[i]; });
    const tail = []; toTail.forEach((t, i) => { if (t) tail.push(i); });
    if (tail.length) {
      const op = orderIdx(tail.length, (k) => grav[tail[k]], (k) => nums[tail[k]]);
      op.forEach((k, pos) => { prov[tail[k]] = base + pos + 1; });
    }
    return chiudi(prov);
  }

  if (compatta) {
    /* numerazione contigua 1..n: maschi in testa, problematici in coda per gravità */
    const ordKey = (i) => (isM[i] ? 1 : (isProb[i] ? 3 : 2));
    const o = orderIdx(n, ordKey, (i) => grav[i], (i) => nums[i]);
    const finalpos = new Array(n);
    o.forEach((i, pos) => { finalpos[i] = pos + 1; });
    return chiudi(finalpos);
  }

  /* LEGACY (export senza corsie): riordino per scambi singoli */
  const slots = numSort(nums);
  const at = new Array(n).fill(-1);                 // at[j] = riga che occupa lo slot j (nome slots[j])
  const primo = (v) => slots.indexOf(v);            // indice del PRIMO slot con quel nome, come at["nome"] in R
  for (let i = 0; i < n; i++) at[primo(nums[i])] = i;
  const curpos = (row) => { const j = at.indexOf(row); return j < 0 ? null : slots[j]; };
  const place = (target, want) => {
    const cur = at[primo(target)];
    if (cur === want) return;
    const j = curpos(want);
    at[primo(target)] = want;
    if (j != null) at[primo(j)] = cur;
  };
  const male = orderIdx(n, (i) => nums[i]).filter((i) => isM[i]);
  male.forEach((r, i) => place(slots[i], r));
  const prob = orderIdx(n, (i) => grav[i], (i) => nums[i]).filter((i) => isProb[i]);
  const p = prob.length;
  prob.forEach((r, t) => place(slots[n - p + t], r));
  const finalpos = new Array(n).fill(null);
  for (const s of slots) finalpos[at[primo(s)]] = s;
  return chiudi(finalpos);
}
/* La provetta della specie col contrassegno [c] (in qualunque plateau), o la sola che finisce con quelle cifre. */
function trovaInCampo(righe, c) {
  const esatte = righe.filter((r) => r.contrassegno === c);
  if (esatte.length === 1) return { riga: esatte[0] };
  if (esatte.length > 1) return { riga: null, motivo: 'più provette con questo contrassegno (' + c + ')' };
  if (!/^\d{3,}$/.test(c)) return { riga: null, motivo: 'provetta non trovata (' + c + ')' };
  const fine = righe.filter((r) => str(r.contrassegno).replace(/\D/g, '').endsWith(c));
  if (fine.length === 1) return { riga: fine[0] };
  return { riga: null, motivo: fine.length ? 'ambiguo: ' + fine.length + ' provette finiscono con ' + c : 'provetta non trovata (' + c + ')' };
}
/* Gli spostamenti «prima» di una specie (vedi sopra): sul canon, prima della numerazione. La provetta C prende il
   numero N nella serie (anche dal plateau problematici); se N era di un'altra provetta della serie e C era nella serie,
   si scambiano; dal plateau problematici si va solo su un numero libero. Il numero di campo resta in campo_orig (nel
   definitivo, per ricostruire l'abbinamento). Restituisce il canon nuovo e gli esiti. */
function applicaSpostamentiPrima(canon, lista, specie) {
  const out = canon.map((r) => (r.specie === specie ? Object.assign({}, r) : r));
  const righe = out.filter((r) => r.specie === specie && r.progressivo != null);
  const corsie = hasCorsie(righe);
  const esiti = [];
  (lista || []).forEach((s) => {
    const c = str(s.contrassegno).replace(/\s/g, '').toUpperCase(), con = str(s.con).replace(/\s/g, '').toUpperCase();
    const t = trovaInCampo(righe, c), a = t.riga;
    let motivo = t.motivo || '', n = toInt(s.provetta);
    if (nz(con)) {                       // «C dove sta adesso D», nella serie
      const d = trovaInCampo(righe, con);
      n = d.riga && laneOf(d.riga) === 'main' ? d.riga.progressivo : null;
      if (!motivo && !d.riga) motivo = 'la provetta con cui scambiare non si trova (' + con + ')';
      else if (!motivo && laneOf(d.riga) !== 'main') motivo = 'la provetta con cui scambiare è nel plateau problematici';
    }
    if (!motivo && (n == null || n < 1)) motivo = 'numero non valido';
    if (!motivo && laneOf(a) === 'main' && a.progressivo === n) motivo = 'è già al numero ' + n;
    const occ = !motivo ? righe.find((r) => r !== a && laneOf(r) === 'main' && r.progressivo === n) || null : null;
    if (!motivo && occ && laneOf(a) !== 'main') motivo = 'al numero ' + n + ' c\'è già una provetta: spostala prima';
    esiti.push({ specie, contrassegno: a ? a.contrassegno : c, provetta: n, da: a ? a.progressivo : null,
      da_corsia: a ? corsiaOf(a) : '', con: occ ? occ.contrassegno : '', applicato: !motivo, motivo, quando: 'prima' });
    if (motivo) return;
    if (!nz(a.campo_orig)) a.campo_orig = numLabel(a);
    if (occ) {
      if (!nz(occ.campo_orig)) occ.campo_orig = numLabel(occ);
      occ.progressivo = a.progressivo;
    }
    a.progressivo = n;
    if (laneOf(a) !== 'main') { a.coda = corsie ? 'main' : ''; a.corsia = ''; }
  });
  return { canon: out, esiti };
}
/* La numerazione finale, con gli spostamenti manuali {pecore: […], capre: […]} se ci sono: i «prima» sul punto di
   partenza, i «dopo» sul risultato. */
function divideSpostamenti(spostamenti, specie) {
  const lista = (spostamenti && spostamenti[specie]) || [];
  return { lista, prima: lista.filter((s) => s.quando === 'prima'), dopo: lista.filter((s) => s.quando !== 'prima') };
}
function numerazioneFinale(canon, specie, ordine, compatta, spostamenti) {
  const d = divideSpostamenti(spostamenti, specie);
  const base = d.prima.length ? applicaSpostamentiPrima(canon, d.prima, specie).canon : canon;
  const nf = riordinaScambi(base, specie, ordine, compatta).mapping;
  return d.dopo.length ? applicaSpostamenti(nf, d.dopo, specie).righe : nf;
}
/* Com'è andato ogni spostamento manuale della specie, nell'ordine in cui sono scritti: per la pagina, che dice quali
   non valgono e perché. */
function esitiSpostamenti(canon, specie, ordine, compatta, spostamenti) {
  const d = divideSpostamenti(spostamenti, specie);
  if (!d.lista.length) return [];
  const P = applicaSpostamentiPrima(canon, d.prima, specie);
  const D = applicaSpostamenti(riordinaScambi(d.prima.length ? P.canon : canon, specie, ordine, compatta).mapping, d.dopo, specie);
  let ip = 0, id = 0;
  return d.lista.map((s) => (s.quando === 'prima' ? P.esiti[ip++] : D.esiti[id++]));
}

/* per il modulo «Registra campioni in ARVET»: solo i capi in azienda, numerazione definitiva */
function arvetDfFinale(canon, specie, ordine, compatta, spostamenti) {
  return numerazioneFinale(canon, specie, ordine, compatta, spostamenti).filter(effInArvet)
    .map((r) => ({ provetta: r.provetta, contrassegno: r.contrassegno }));
}
function brucellaOvisArvet(canon, ordine, compatta, spostamenti) {
  return numerazioneFinale(canon, 'pecore', ordine, compatta, spostamenti)
    .filter((r) => effInArvet(r) && sessoEff(r).toUpperCase() === 'M')
    .map((r) => ({ provetta: r.provetta, contrassegno: r.contrassegno }));
}
/* I capi che non sono nell'elenco di ARVET e lo snippet aggiunge con «Inserisci capo» (arvet_fill 2.0, 2026-10-14): i
   problematici della numerazione finale (non vanno in ARVET da soli), tranne i doppi di contrassegno (il capo è già
   nell'elenco con l'altra provetta: si decide a mano). Coi dati del capo, che servono solo se ARVET non lo conosce.
   soloMaschi: i montoni, per l'invio Brucella ovis (stessi numeri delle pecore). Gemella: arvet_nuovi_finale (R). */
function arvetNuoviFinale(canon, specie, ordine, compatta, spostamenti, soloMaschi) {
  const nf = numerazioneFinale(canon, specie, ordine, compatta, spostamenti);
  const nellElenco = new Set(nf.filter(effInArvet).map((r) => r.contrassegno));
  return nf.filter((r) => !effInArvet(r) && !truthy(r.duplicato) && !nellElenco.has(r.contrassegno) &&
      (!soloMaschi || sessoEff(r).toUpperCase() === 'M'))
    .map((r) => ({ provetta: r.provetta, contrassegno: r.contrassegno, sesso: sessoEff(r).toUpperCase(), razza: str(r.razza).trim(),
      data_nascita: str(r.data_nascita).trim() }));
}

/* Guida agli spostamenti a destinazione diretta. */
function guidaRiposizionamento(canon, specie, ordine, compatta, spostamenti) {
  const nf = numerazioneFinale(canon, specie, ordine, compatta, spostamenti);
  const mov = ordinaPer(nf.filter((r) => r.provetta !== r.provetta_campo || codaOf(r) === 'prob' || r._nuovo === true || r._riassegnato === true),
                        (r) => r.provetta);
  return mov.map((r0) => {
    const nuovo = r0._nuovo === true, riass = r0._riassegnato === true;
    const daProb = codaOf(r0) === 'prob' || (riass && str(r0.coda_orig) === 'prob');
    const pc = (riass && r0.progressivo_orig != null) ? r0.progressivo_orig : r0.provetta_campo;
    const motivo = nuovo ? 'provetta aggiunta in ufficio'
      : riass ? 'contrassegno corretto: rientra nella serie'
      : daProb ? 'dal plateau problematici alla serie'
      : r0._manuale === true ? 'spostamento manuale'
      : !effInArvet(r0) && r0.provetta > pc ? 'problematica: in coda'
      : r0.gruppo === 'maschio (ovino)' ? 'maschio portato in testa (Brucella ovis)'
      : r0.provetta < pc ? 'chiusura buco (tirata su dalla coda)'
      : 'spostata per far posto';
    const sigla = riass ? normCorsia(r0.corsia_orig) : corsiaOf(r0);
    return {
      da_n: nuovo ? null : pc,
      coda_da: nuovo ? '' : (daProb ? 'prob' : ''),
      corsia_da: (nuovo || !daProb) ? '' : sigla,
      plateau_da: nuovo ? null : plateauDi(pc),
      pos_da: nuovo ? null : posizioneDi(pc),
      a_n: r0.provetta, plateau_a: plateauDi(r0.provetta), pos_a: posizioneDi(r0.provetta),
      contrassegno: r0.contrassegno,
      ruolo: nuovo ? 'NUOVA · ' + r0.gruppo : r0.gruppo,
      motivo, fattispecie: r0.fattispecie
    };
  });
}

const COLONNE_DEFINITIVO = ['provetta', 'contrassegno', 'nuovo_contrassegno', 'in_arvet', 'gruppo', 'fattispecie',
  'sesso', 'data_nascita', 'razza', 'data_uscita', 'note', 'n_provetta_iniziale'];

/* Excel completo per specie + in coda i PRESENTI non campionati (senza provetta). */
function exportDefinitivo(canon, regSp, specie, ordine, compatta, spostamenti) {
  const nf = numerazioneFinale(canon, specie, ordine, compatta, spostamenti);
  const primo = new Map();
  (regSp || []).forEach((r) => { if (!primo.has(r.contrassegno)) primo.set(r.contrassegno, r); });
  const daReg = (cod, col) => { const m = primo.get(cod); return m && m[col] != null ? str(m[col]) : ''; };
  const colOReg = (r, col) => (nz(r[col]) ? str(r[col]) : daReg(r.contrassegno, col));
  const righe = nf.map((r) => {
    const riass = r._riassegnato === true, nuovo = r._nuovo === true;
    const cod = riass ? normCoda(r.coda_orig) : codaOf(r);
    const sig = riass ? normCorsia(r.corsia_orig) : corsiaOf(r);
    const num = (riass && r.progressivo_orig != null) ? r.progressivo_orig : r.provetta_campo;
    return {
      provetta: r.provetta, contrassegno: r.contrassegno, nuovo_contrassegno: r.contrassegno,
      in_arvet: effInArvet(r) ? 'SI' : 'NO', gruppo: r.gruppo, fattispecie: r.fattispecie,
      sesso: nz(r.sesso_corretto) ? r.sesso_corretto : colOReg(r, 'sesso'),
      data_nascita: colOReg(r, 'data_nascita'), razza: colOReg(r, 'razza'),
      data_uscita: str(r.data_uscita), note: str(r.note),
      // il numero scritto in campo, anche se poi la provetta è stata spostata a mano prima della guida (campo_orig)
      n_provetta_iniziale: nuovo ? '' : nz(r.campo_orig) ? str(r.campo_orig) : (cod === 'prob' ? sig + num : String(num))
    };
  });
  if (regSp && regSp.length) {
    const campionati = new Set(canon.filter((r) => r.specie === specie).map((r) => r.contrassegno));
    regSp.filter((r) => r.presente === true && !campionati.has(r.contrassegno)).forEach((d) => righe.push({
      provetta: null, contrassegno: d.contrassegno, nuovo_contrassegno: '', in_arvet: '',
      gruppo: 'non campionato (disponibile)', fattispecie: 'presente non provato',
      sesso: str(d.sesso), data_nascita: str(d.data_nascita), razza: str(d.razza),
      data_uscita: '', note: '', n_provetta_iniziale: null }));
  }
  return righe;
}

/* ---------- storia dei capi e schede dei problematici --------------------- */
function storicoCapo(reg, contrassegno, decodifica) {
  decodifica = decodifica || DECODIFICA_DEFAULT;
  if (!reg || !reg.length) return [];
  const r0 = reg.filter((r) => r.contrassegno === contrassegno);
  if (!r0.length) return [];
  const dmy = (x) => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str(x)); return m ? (+m[3]) * 10000 + (+m[2]) * 100 + (+m[1]) : 0; };
  const r = ordinaPer(r0, (x) => nz(x.data_uscita) ? 0 : 1, (x) => dmy(x.data_uscita));
  return r.map((x) => {
    const presente = !nz(x.data_uscita);
    const mot = decodifica[str(x.motivo_uscita).toUpperCase()];
    return { allevamento: nz(x.denominazione) ? x.denominazione : '—',
      codice_stabilimento: str(x.codice_stabilimento),
      data_uscita: presente ? '' : x.data_uscita,
      motivo: presente ? '' : (mot != null ? mot : str(x.motivo_uscita)),
      stato: presente ? 'in allevamento' : 'uscito' };
  });
}

function schedeProblematici(canon, regSp, specie, ordine, compatta, decodifica) {
  const nf = numerazioneFinale(canon, specie, ordine, compatta);
  return nf.filter((r) => !effInArvet(r)).map((r) => {
    const chiave = fattispecieKey(r);
    return {
      contrassegno: r.contrassegno, specie,
      provetta_campo: (codaOf(r) === 'prob' ? corsiaOf(r) : '') + r.provetta_campo,
      provetta_finale: r.provetta, fattispecie: r.fattispecie, fattispecie_key: chiave,
      azione: AZIONE[chiave] || '',
      sesso: nz(r.sesso_corretto) ? r.sesso_corretto : str(r.sesso),
      sesso_corretto: str(r.sesso_corretto), razza: str(r.razza), data_nascita: str(r.data_nascita),
      orecchino_dx: !!r.orecchino_dx, orecchino_sx: !!r.orecchino_sx, bolo: r.bolo === true, note: str(r.note),
      riassegnato: r._riassegnato === true,
      storico: storicoCapo(regSp, r.contrassegno, decodifica)
    };
  });
}

const esc = (x) => str(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const gmaGma = (d) => { const p = (v) => String(v).padStart(2, '0'); return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear(); };

/* Pagina HTML stampabile: una scheda per capo problematico. */
function renderSchedeProblematici(schede, meta, data) {
  meta = meta || {};
  const css = [
    "body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;margin:0;padding:14px}",
    '.scheda{border:1px solid #bbb;border-radius:8px;padding:12px 14px;margin-bottom:14px;page-break-inside:avoid}',
    '.scheda h2{margin:0 0 2px;font-size:20px;font-variant-numeric:tabular-nums}',
    '.prov{font-size:14px;color:#283593;font-weight:700;margin-bottom:8px}',
    '.fatt{background:#fdecea;border:1px solid #f5c6cb;border-radius:6px;padding:7px 10px;margin-bottom:8px}',
    '.fatt b{color:#c62828}',
    '.azione{background:#e8f5e9;border:1px solid #c8e6c9;border-radius:6px;padding:7px 10px;margin-bottom:8px;font-size:14px}',
    '.ana{font-size:14px;color:#333;margin-bottom:8px}',
    'table{border-collapse:collapse;width:100%;font-size:13px}',
    'th,td{border-bottom:1px solid #ddd;padding:4px 6px;text-align:left}',
    'th{background:#f4f5f7}', '.seg{font-size:13px;color:#7a5b00;margin-top:6px}',
    'h1{font-size:19px;margin:0 0 2px}.sub{color:#555;font-size:13px;margin-bottom:12px}',
    '.footer{margin-top:16px;font-size:11px;color:#666;border-top:1px solid #ddd;padding-top:6px}',
    '@media print{.scheda{page-break-after:always}}'
  ].join('\n');
  const blocchi = schede.map((s) => {
    const righe = !s.storico.length
      ? "<tr><td colspan='4'>Nessuna riga nel registro per questo contrassegno.</td></tr>"
      : s.storico.map((k) => '<tr><td>' + esc(k.allevamento) + '</td><td>' + esc(k.codice_stabilimento) + '</td><td>' +
          esc(nz(k.data_uscita) ? k.data_uscita : '—') + '</td><td>' + esc(nz(k.motivo) ? k.motivo : k.stato) + '</td></tr>').join('');
    const seg = [];
    if (s.orecchino_dx) seg.push('orecchino DX (elettronico) da sostituire');
    if (s.orecchino_sx) seg.push('orecchino SX (accessorio) da sostituire');
    if (s.bolo) seg.push('bolo da sostituire');
    if (nz(s.sesso_corretto)) seg.push('sesso corretto sul campo: ' + s.sesso_corretto);
    if (s.riassegnato) seg.push('contrassegno corretto in ufficio');
    if (nz(s.note)) seg.push('note: ' + s.note);
    return "<div class='scheda'><h2>" + esc(s.contrassegno) + '</h2>' +
      "<div class='prov'>provetta di campo " + esc(s.provetta_campo) + ' &rarr; n&deg; ' + s.provetta_finale + ' &middot; ' + esc(s.specie) + '</div>' +
      "<div class='fatt'><b>" + esc(s.fattispecie) + '</b></div>' +
      "<div class='azione'><b>Cosa fare:</b> " + esc(s.azione) + '</div>' +
      "<div class='ana'>sesso " + esc(nz(s.sesso) ? s.sesso : '?') + ' &middot; razza ' + esc(nz(s.razza) ? s.razza : '?') +
      ' &middot; nato ' + esc(nz(s.data_nascita) ? s.data_nascita : '?') + '</div>' +
      '<table><thead><tr><th>Allevamento</th><th>Stabilimento</th><th>Data uscita</th><th>Motivo / stato</th></tr></thead><tbody>' +
      righe + '</tbody></table>' +
      (seg.length ? "<div class='seg'>" + seg.map(esc).join(' &middot; ') + '</div>' : '') + '</div>';
  });
  return '<!DOCTYPE html>\n<html lang="it"><head><meta charset="UTF-8"><title>Schede capi problematici</title><style>' + css + '</style></head><body>' +
    '<h1>Capi problematici &mdash; ' + esc(meta.codice_stabilimento) + "</h1><div class='sub'>" + esc(meta.denominazione) +
    ' &middot; ' + schede.length + ' schede &middot; ' + gmaGma(data || new Date()) + '</div>' +
    blocchi.join('\n') +
    "<div class='footer'>Documento di lavoro interno del Servizio Veterinario: contiene dati dell'allevamento e va trattato di conseguenza. " +
    'La storia dei capi è ricavata dai registri storici scaricati dalla BDN e vale alla data dell\'estrazione.</div></body></html>';
}

const COLONNE_SCHEDE = ['contrassegno', 'provetta_campo', 'provetta', 'fattispecie', 'azione', 'sesso', 'razza',
  'data_nascita', 'allevamento', 'codice_stabilimento', 'data_uscita', 'motivo', 'note'];
function schedeProblematiciDf(schede) {
  const out = [];
  schede.forEach((s) => {
    const st = s.storico.length ? s.storico
      : [{ allevamento: '—', codice_stabilimento: '', data_uscita: '', motivo: 'nessun dato in registro', stato: '' }];
    st.forEach((k) => out.push({
      contrassegno: s.contrassegno, provetta_campo: s.provetta_campo, provetta: s.provetta_finale,
      fattispecie: s.fattispecie, azione: s.azione, sesso: s.sesso, razza: s.razza, data_nascita: s.data_nascita,
      allevamento: k.allevamento, codice_stabilimento: k.codice_stabilimento, data_uscita: k.data_uscita,
      motivo: nz(k.motivo) ? k.motivo : k.stato, note: s.note }));
  });
  return out;
}

/* Capi problematici di cui non c'è traccia in nessun dato caricato (registri + marche). */
function capiSenzaTraccia(canon, regs, marche, ordine, compatta) {
  const out = [];
  for (const sp of ['pecore', 'capre']) {
    if (!canon.some((r) => r.specie === sp)) continue;
    const prob = numerazioneFinale(canon, sp, ordine, compatta).filter((r) => !effInArvet(r));
    if (!prob.length) continue;
    const noti = new Set([].concat((regs && regs[sp] || []).map((r) => r.contrassegno), (marche && marche[sp]) || []));
    prob.filter((r) => !noti.has(r.contrassegno)).forEach((r) => out.push({
      specie: sp, contrassegno: r.contrassegno,
      provetta_campo: (codaOf(r) === 'prob' ? corsiaOf(r) : '') + r.provetta_campo,
      provetta: r.provetta, fattispecie: r.fattispecie }));
  }
  return out;
}

/* ---------- report per l'allevatore --------------------------------------- */
const perSpecieProg = (canon) => ordinaPer(canon, (r) => r.specie, (r) => r.progressivo);
function reportCorrezioniSesso(canon) {
  return perSpecieProg(canon.filter((r) => nz(r.sesso_corretto) && str(r.sesso_corretto).toUpperCase() !== str(r.sesso).toUpperCase()))
    .map((r) => ({ contrassegno: r.contrassegno, specie: r.specie, sesso_bdn: str(r.sesso), sesso_corretto: r.sesso_corretto }));
}
/* presenti = righe grezze del registro (già filtrate sullo stabilimento di lavoro) */
function reportNonProvati(presentiPecore, presentiCapre, canon) {
  const out = [];
  const one = (pres, sp) => {
    if (!pres || !pres.length) return;
    const campionati = new Set(canon.filter((r) => r.specie === sp).map((r) => r.contrassegno));
    pres.filter((r) => !campionati.has(r.contrassegno)).forEach((r) =>
      out.push({ contrassegno: r.contrassegno, specie: sp, sesso: str(r.sesso), razza: str(r.razza) }));
  };
  one(presentiPecore, 'pecore'); one(presentiCapre, 'capre');
  return out;
}
function reportSmarritiRitrovati(canon) {
  return perSpecieProg(canon.filter((r) => USCITE_SMARRITO.indexOf(str(r.motivo_uscita).toUpperCase()) >= 0))
    .map((r) => ({ contrassegno: r.contrassegno, specie: r.specie, data_smarrimento: str(r.data_uscita) }));
}
/* Segnalazioni sull'identificazione: l'orecchino DESTRO è l'ELETTRONICO (col transponder), il SINISTRO
   l'ACCESSORIO, il bolo si controlla col lettore. Vero = da sostituire (manca o non si legge). */
const seg = (r, k) => r[k] === true;
const senzaTransponder = (r) => seg(r, 'senza_transponder') || seg(r, 'orecchino_dx') || seg(r, 'bolo');
const daSost = (b) => (b ? 'DA SOSTITUIRE' : '');
function reportMarcheDaSostituire(canon) {
  return perSpecieProg(canon.filter((r) => seg(r, 'orecchino_dx') || seg(r, 'orecchino_sx') || seg(r, 'bolo')))
    .map((r) => ({ contrassegno: r.contrassegno, specie: r.specie,
      orecchino_dx_elettronico: daSost(seg(r, 'orecchino_dx')), orecchino_sx_accessorio: daSost(seg(r, 'orecchino_sx')),
      bolo: daSost(seg(r, 'bolo')) }));
}
/* Capi senza transponder (DX elettronico o bolo): una riga per capo (specie + contrassegno), con le etichette
   delle provette di campo e le note. Per specie e contrassegno. */
function reportSenzaTransponder(canon) {
  const sub = canon.filter(senzaTransponder);
  const perCapo = new Map();
  sub.forEach((r) => {
    const k = r.specie + '\r' + r.contrassegno;
    if (!perCapo.has(k)) perCapo.set(k, []);
    perCapo.get(k).push(r);
  });
  const capi = ordinaPer(Array.from(perCapo.values()), (g) => g[0].specie, (g) => g[0].contrassegno);
  return capi.map((g) => {
    const rr = ordinaPer(g, (r) => r.progressivo, (r) => numLabel(r));
    const note = uniq(rr.map((r) => str(r.note)).filter((x) => nz(x.trim())));
    return { contrassegno: rr[0].contrassegno, specie: rr[0].specie, provette: rr.map(numLabel).join(' '),
      orecchino_dx_elettronico: daSost(rr.some((r) => seg(r, 'orecchino_dx'))),
      bolo: daSost(rr.some((r) => seg(r, 'bolo'))), note: note.join(' \u00b7 ') };
  });
}
/* «senza transponder: 12 su 480 (2,5%)», arrotondato con interi come in Fejalog (Transponder.kt). */
function testoSenzaTransponder(n, capi) {
  const decimi = capi > 0 ? Math.floor((n * 1000 + Math.floor(capi / 2)) / capi) : 0;
  return 'senza transponder: ' + n + ' su ' + capi + ' (' + Math.floor(decimi / 10) + ',' + (decimi % 10) + '%)';
}
/* Acquisti con DDA (Fejalog formato 4): i capi nella serie col venditore, da registrare in BDN prima dell'invio ARVET;
   `caricati` (registri_caricati) dà il motivo («DDA n. 12 del …»). Gemella: report_acquisti_dda(). */
function reportAcquistiDda(canon, caricati) {
  const motivo = {};
  (caricati || []).forEach((g) => { if (g.ruolo === 'dda') motivo[g.codice] = g.motivo; });
  return perSpecieProg(canon.filter((r) => nz(r.acquisto_da)))
    .map((r) => ({ venditore: r.acquisto_da, motivo: str(motivo[r.acquisto_da]), contrassegno: r.contrassegno, specie: r.specie }));
}
/* Marche da cambiare (Fejalog formato 4): le provette ricollocate su un altro capo, se il report lo dice: al capo che
   porta `porta` vanno messe le marche di `mettere`. Gemella: report_marche_da_cambiare(). */
function reportMarcheDaCambiare(canon) {
  return perSpecieProg(canon.filter((r) => r.sostituisci_marche === true && nz(r.ricollocata_da)))
    .map((r) => ({ specie: r.specie, porta: r.ricollocata_da, mettere: r.contrassegno }));
}
/* presenti dello stabilimento DI LAVORO (i presenti di altri stabilimenti non sono di questo allevatore) */
function presentiDiLavoro(reg, codiceLavoro) {
  if (!reg) return null;
  let out = reg.filter((r) => r.presente === true);
  if (nz(codiceLavoro)) out = out.filter((r) => !nz(r.codice_stabilimento) || r.codice_stabilimento === codiceLavoro);
  return out;
}

function riepilogoPost(canon, specie) {
  const sub = canon.filter((r) => r.specie === specie);
  const man = sub.filter((r) => !r.in_arvet);
  const inA = sub.filter((r) => r.in_arvet);
  const visti = new Set(); let dup = 0;
  inA.forEach((r) => { if (visti.has(r.contrassegno)) dup++; else visti.add(r.contrassegno); });
  return { totale: sub.length, in_arvet: inA.length, manuali: man.length,
    usciti: man.filter((r) => r.categoria === 'giallo').length,
    disponibili: man.filter((r) => r.categoria === 'blu').length,
    eccezioni: man.filter((r) => r.categoria === 'rosso').length,
    discordanti: sub.filter((r) => r.specie_discordante).length,
    duplicati: sub.filter((r) => r.duplicato).length, dup_arvet: dup,
    /* capi (un contrassegno = un capo, anche con più provette) e quanti senza transponder */
    capi: uniq(sub.map((r) => r.contrassegno)).length,
    senza_transponder: uniq(sub.filter(senzaTransponder).map((r) => r.contrassegno)).length };
}

/* ---------- anomalie per il confronto fra stabilimenti e fra anni (2026-10-07) ----------------------------
   Gemello di anomalie_stabilimento() in R/parse_bdn.R. Lo producono la pagina da campo (parziale: un dispositivo),
   «Dopo il campo» (R e tablet) e Fejalog; lo legge il modulo «Analisi delle anomalie». Contratto:
   fejalog/contratti/anomalie.schema.json (copia in tests/fixtures/fejalog/). Le fattispecie si contano per provetta
   (fattispecieKey), le segnalazioni per capo; `capi` elenca le provette con qualcosa, per specie e progressivo. */
const ANOMALIE_FATTISPECIE = ['smarrito', 'morto', 'trasferito', 'macello', 'marca_disponibile', 'eccezione',
  'specie_discordante', 'doppia_provetta', 'altro_stabilimento'];
const ANOMALIE_SEGNALAZIONI = ['sesso_corretto', 'orecchino_dx', 'orecchino_sx', 'bolo', 'senza_transponder'];
function anomalieStabilimento(canon, presentiPecore, presentiCapre, opz) {
  opz = opz || {};
  const date = canon.map((r) => str(r.ts).slice(0, 10)).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  const data = date.length ? date[0] : '';
  const sessoCorretto = (r) => nz(r.sesso_corretto) && str(r.sesso_corretto).toUpperCase() !== str(r.sesso).toUpperCase();
  const segnalazioni = (r) => ANOMALIE_SEGNALAZIONI.filter((k) => (k === 'sesso_corretto' ? sessoCorretto(r)
    : k === 'senza_transponder' ? senzaTransponder(r) : seg(r, k)));
  const specie = {}, capi = [];
  for (const sp of ['pecore', 'capre']) {
    const sub = canon.filter((r) => r.specie === sp);
    const pres = sp === 'pecore' ? presentiPecore : presentiCapre;
    if (!sub.length && !(pres && pres.length)) continue;
    const provati = new Set(sub.map((r) => r.contrassegno));
    const fatt = {}; ANOMALIE_FATTISPECIE.forEach((k) => { fatt[k] = 0; });
    const sg = {}; ANOMALIE_SEGNALAZIONI.forEach((k) => { sg[k] = new Set(); });
    perSpecieProg(sub).forEach((r) => {
      const k = fattispecieKey(r);
      if (k) fatt[k] = (fatt[k] || 0) + 1;
      const s = segnalazioni(r);
      s.forEach((x) => sg[x].add(r.contrassegno));
      if (k || s.length) capi.push({ specie: sp, contrassegno: r.contrassegno, fattispecie: k, segnalazioni: s,
        motivo_uscita: str(r.motivo_uscita), data_uscita: str(r.data_uscita), codice_stabilimento: str(r.codice_stabilimento) });
    });
    const segn = {}; ANOMALIE_SEGNALAZIONI.forEach((k) => { segn[k] = sg[k].size; });
    specie[sp] = { capi_bdn: pres ? pres.length : null, provette: sub.length, capi_provati: provati.size,
      presenti_non_provati: pres ? pres.filter((r) => !provati.has(r.contrassegno)).length : null,
      fattispecie: fatt, segnalazioni: segn };
  }
  return { formato: 'anomalie-accettazione', versione: 1, origine: str(opz.origine), completo: !!opz.completo,
    generato_il: str(opz.generato_il), stabilimento: { codice: str(opz.codice), denominazione: str(opz.denominazione) },
    data_prelievo: data, anno: data ? parseInt(data.slice(0, 4), 10) : null, specie, capi };
}

/* Specchietto di copertura per specie: righe {voce, n, pct, livello}. */
function analisiCopertura(canon, presentiPecore, presentiCapre) {
  const out = {};
  const specie = uniq(canon.map((r) => r.specie));
  for (const sp of ['pecore', 'capre']) {
    if (specie.indexOf(sp) < 0) continue;
    const cc = canon.filter((r) => r.specie === sp);
    if (!cc.length) continue;
    const pr = sp === 'pecore' ? presentiPecore : presentiCapre;
    const d = pr ? pr.length : null;
    const pf = (n) => (d == null || d <= 0) ? null : Math.round(1000 * n / d * 10 / 10) / 10;
    const an = mergeAnomalie(cc);
    const rows = [];
    const push = (voce, n, livello) => rows.push({ voce, n, pct: pf(n), livello });
    push('Catalogate (provette)', cc.length, 0);
    push('🟢 In azienda → ARVET auto', cc.filter((r) => r.in_arvet).length, 1);
    push('✋ Da inserire a mano in ARVET', cc.filter((r) => !r.in_arvet).length, 1);
    const gialli = cc.filter((r) => r.categoria === 'giallo');
    if (gialli.length) {
      const conta = new Map();
      gialli.forEach((r) => {
        const lab = nz(r.motivo_uscita_dec) ? r.motivo_uscita_dec : (nz(r.motivo_uscita) ? r.motivo_uscita : 'uscita (motivo ignoto)');
        conta.set(lab, (conta.get(lab) || 0) + 1);
      });
      const nomi = Array.from(conta.keys()).sort((a, b) => a.localeCompare(b, 'it'));
      const ord = orderIdx(nomi.length, (i) => -conta.get(nomi[i])).map((i) => nomi[i]);
      ord.forEach((k) => push('• ' + k.toLowerCase(), conta.get(k), 2));
    }
    push('🔵 Marche disponibili', cc.filter((r) => r.categoria === 'blu').length, 2);
    push('🔴 Eccezioni / sconosciuti', cc.filter((r) => r.categoria === 'rosso').length, 2);
    push('Specie discordante', cc.filter((r) => r.specie_discordante).length, 2);
    push('Doppioni di contrassegno', cc.filter((r) => r.duplicato).length, 1);
    if (hasCorsie(cc)) push('Nei plateau problematici (A1, A2…)', cc.filter((r) => laneOf(r) !== 'main').length, 1);
    push('Sovrapposizioni (numeri duplicati)', an.dup_numeri.length, 1);
    push('Buchi nella sequenza', an.buchi.length, 1);
    push('Sostituzione orecchino DX (elettronico)', cc.filter((r) => seg(r, 'orecchino_dx')).length, 1);
    push('Sostituzione orecchino SX (accessorio)', cc.filter((r) => seg(r, 'orecchino_sx')).length, 1);
    push('Sostituzione bolo', cc.filter((r) => seg(r, 'bolo')).length, 1);
    push('Capi senza transponder (DX o bolo)', uniq(cc.filter(senzaTransponder).map((r) => r.contrassegno)).length, 1);
    out[sp] = { denominatore: d, righe: rows };
  }
  return out;
}

/* Orchestratore: dagli export normalizzati al canon definitivo.
   opz = {regs, codiceLavoro, decodifica, correzioni, rimuovi, aggiungi} */
function pipeline(canon0, opz) {
  const def = arricchisciCanon(canon0, opz.regs);
  const corr = correggiContrassegni(def, opz.correzioni, opz.regs, opz.codiceLavoro, opz.decodifica);
  // le soluzioni dei problemi (per tipologia e per provetta); le provette eliminate non entrano nella numerazione
  const mod = applicaModifiche(corr, opz.rimuovi, opz.aggiungi);
  const sol = opz.soluzioni ? applicaSoluzioni(mod, Object.assign({ regs: opz.regs, codiceLavoro: opz.codiceLavoro }, opz.soluzioni)) : mod;
  const t = togliEscluse(sol);
  return { def, corr, fin: t.canon, escluse: t.escluse };
}

/* Interpreta il campo «numeri da rimuovere» ("50, 51, A3": A3 = plateau problematici di A). */
/* ---------- file della BDN nel browser (2026-10-13) -------------------------------------------------------------
   Registro storico di stalla in ASCII (record a larghezza fissa) e marche disponibili, letti come testo ISO-8859-1
   (FileReader.readAsText(f, 'ISO-8859-1')), poi classificati per specie: gemelli di parse_registro_stalla(),
   parse_marche_disponibili(), split_registro_per_specie() e classifica_ovicaprini() di R/parse_bdn.R, con gli stessi
   errori. Servono alle pagine per sostituire o aggiungere registri a lavori in corsa. */
const BDN_REG = { codice_stabilimento: [7, 8], denominazione: [51, 40], specie_allevata: [31, 20], contrassegno: [298, 20],
  data_nascita: [358, 10], specie_bdn: [368, 10], sesso: [378, 1], razza: [379, 3], data_uscita: [528, 10], motivo_uscita: [538, 1] };
const bdnTrim = (x) => str(x).replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, '');
function bdnRighe(testo) {
  return str(testo).replace(/^\uFEFF/, '').split('\n').map((l) => l.replace(/\r$/, '')).filter((l) => nz(bdnTrim(l)));
}
const bdnCampo = (l, pos) => bdnTrim(l.substr(pos[0] - 1, pos[1]));
function leggiRegistroStalla(testo) {
  const L = bdnRighe(testo);
  if (!L.length) throw new Error('Registro di stalla vuoto o illeggibile.');
  if (Math.max.apply(null, L.map((l) => l.length)) < 538)
    throw new Error('Il file non è un registro di stalla in formato ASCII. In BDN: «Stampa registro di stalla» ' +
      '→ «Registro storico capi identificati singolarmente» → formato ASCII (non PDF, HTML o Excel).');
  const righe = L.map((l) => ({
    contrassegno: bdnCampo(l, BDN_REG.contrassegno), specie_bdn: bdnCampo(l, BDN_REG.specie_bdn), sesso: bdnCampo(l, BDN_REG.sesso),
    razza: bdnCampo(l, BDN_REG.razza), data_nascita: bdnCampo(l, BDN_REG.data_nascita), data_uscita: bdnCampo(l, BDN_REG.data_uscita),
    motivo_uscita: bdnCampo(l, BDN_REG.motivo_uscita), codice_stabilimento: bdnCampo(l, BDN_REG.codice_stabilimento),
    denominazione: bdnCampo(l, BDN_REG.denominazione) })).filter((r) => nz(r.contrassegno));
  if (!righe.length)
    throw new Error('Nessun capo riconosciuto nel file: controlla che sia il «Registro storico capi identificati singolarmente» in formato ASCII.');
  righe.forEach((r) => { r.presente = r.data_uscita === ''; });
  return { meta: { codice_stabilimento: bdnCampo(L[0], BDN_REG.codice_stabilimento), denominazione: bdnCampo(L[0], BDN_REG.denominazione),
    specie_allevata: bdnCampo(L[0], BDN_REG.specie_allevata) }, righe };
}
function leggiMarcheDisponibili(testo) {
  return uniq(bdnRighe(testo).map((l) => bdnCampo(l, [29, 16])).filter(nz));
}
function splitRegistroPerSpecie(righe) {
  const sp = (r) => bdnTrim(r.specie_bdn).toUpperCase();
  const sub = (m) => { const x = (righe || []).filter((r) => sp(r) === m); return x.length ? x : null; };
  return { pecore: sub('OVINI'), capre: sub('CAPRINI'), scartati: (righe || []).filter((r) => sp(r) !== 'OVINI' && sp(r) !== 'CAPRINI').length };
}
function dmyKey(x) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str(x));
  return m ? parseInt(m[3], 10) * 10000 + parseInt(m[2], 10) * 100 + parseInt(m[1], 10) : 0;
}
/* presenti (prima riga di ogni capo), usciti (l'ultima uscita, solo se non presente), disponibili (marche non usate) */
function classificaOvicaprini(registro, marche) {
  const reg = registro || [];
  const pres = []; const visti = new Set();
  reg.filter((r) => r.presente === true).forEach((r) => { if (!visti.has(r.contrassegno)) { visti.add(r.contrassegno); pres.push(r); } });
  const uscRows = reg.filter((r) => r.presente !== true && !visti.has(r.contrassegno))
    .map((r, i) => ({ r, i, k: dmyKey(r.data_uscita) })).sort((a, b) => b.k - a.k || a.i - b.i).map((x) => x.r);
  const usc = []; const vu = new Set();
  uscRows.forEach((r) => { if (!vu.has(r.contrassegno)) { vu.add(r.contrassegno); usc.push(r); } });
  const usati = new Set(pres.map((r) => r.contrassegno).concat(usc.map((r) => r.contrassegno)));
  const disp = marche ? uniq(marche).filter((c) => !usati.has(c)) : [];
  return {
    presenti: pres.map((r) => ({ contrassegno: r.contrassegno, specie_bdn: r.specie_bdn, sesso: r.sesso, razza: r.razza,
      data_nascita: str(r.data_nascita), codice_stabilimento: str(r.codice_stabilimento), denominazione: str(r.denominazione) })),
    usciti: usc.map((r) => ({ contrassegno: r.contrassegno, specie_bdn: r.specie_bdn, data_uscita: r.data_uscita, motivo_uscita: r.motivo_uscita,
      codice_stabilimento: str(r.codice_stabilimento), denominazione: str(r.denominazione) })),
    disponibili: disp.map((c) => ({ contrassegno: c }))
  };
}

function parseRimuovi(testo, specie) {
  const toks = str(testo).replace(/\s/g, '').toUpperCase().split(',').filter(nz);
  const out = [];
  toks.forEach((t) => {
    const sig = /^([A-Z]?)/.exec(t)[1];
    const num = toInt(t.replace(/^[A-Z]/, ''));
    if (num != null) out.push({ specie, progressivo: num, coda: sig ? 'prob' : '', corsia: sig });
  });
  return out;
}
function parseAggiungi(testo, specie) {
  return str(testo).split(',').map(trim).filter(nz).map((c) => ({ specie, contrassegno: c }));
}

return {
  PLATEAU_SIZE, DECODIFICA_DEFAULT, DECODIFICA_INGRESSI, USCITA_FATTISPECIE, USCITE_SMARRITO, ORDINE_DEFAULT, LABEL, AZIONE, COLONNE_DEFINITIVO, COLONNE_SCHEDE, PAGINA_REC_COLS,
  truthy, toInt, normCoda, normCorsia, codaOf, corsiaOf, laneOf, numLabel, hasCorsie, effInArvet, sessoEff,
  fattispecie, fattispecieKey, gravita,
  parseCsv, leggiExport, mergeConcatRecords, mergeAnomalie, mergeRisolviNumeri, mergePagina, mergeToBackupJson,
  arricchisciCanon, applicaModifiche, suggerisciCorrezioni, correggiContrassegni, levenshtein,
  riordinaScambi, numerazioneFinale, arvetDfFinale, brucellaOvisArvet, arvetNuoviFinale, guidaRiposizionamento, exportDefinitivo,
  normalizzaSpostamenti, unisciSpostamenti, parseSpostamenti, applicaSpostamenti, applicaSpostamentiPrima, esitiSpostamenti,
  inversioniMaschi,
  storicoCapo, schedeProblematici, renderSchedeProblematici, schedeProblematiciDf, capiSenzaTraccia,
  reportCorrezioniSesso, reportNonProvati, reportSmarritiRitrovati, reportMarcheDaSostituire, reportSenzaTransponder,
  testoSenzaTransponder, senzaTransponder, presentiDiLavoro, ANOMALIE_FATTISPECIE, ANOMALIE_SEGNALAZIONI, anomalieStabilimento,
  riepilogoPost, analisiCopertura, pipeline, parseRimuovi, parseAggiungi,
  normalizzaRegistriCaricati, unisciRegistriCaricati, applicaRegistriCaricati, togliEscluse, reportEscluse,
  TIPOLOGIE_PROBLEMI, tipologiaProblema, rigaNormalizza, parseEccezioniSoluzioni, applicaSoluzioni,
  reportAcquistiDda, reportMarcheDaCambiare,
  leggiRegistroStalla, leggiMarcheDisponibili, splitRegistroPerSpecie, classificaOvicaprini
};
});
