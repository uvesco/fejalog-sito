# Il kit di prova con dati fittizi

> **A chi serve**: a chiunque desideri provare Fejalog prima di andare in campo, da soli nel browser o in squadra con telefoni reali o emulatori, senza alcun rischio per i dati ufficiali.  
> **Tempo di lettura**: 4 minuti.

Fejalog mette a disposizione **due kit di simulazione completi** basati su greggi e archivi interamente fittizi. Nessun codice di stabilimento reale, nessun codice fiscale reale e nessun contrassegno reale sono presenti nei file di prova.

I pacchetti sono archiviati in modo ripetibile e possono essere scaricati direttamente per essere importati nell'applicazione Android, aperti negli strumenti di fine lavori sul computer o stampati su carta.

---

## File scaricabili dal sito

Tutti i pacchetti sono pronti per il download:

| Archivio scaricabile | Dimensione | Contenuto principale | Modalità consigliata |
|---|---|---|---|
| [**`kit_prova_888TO999.zip`**](provalo/kit/kit_prova_888TO999.zip) | ~310 KB | Stabilimento singolo `888TO999`: registri BDN, pacchetto, ricercati, schede pronte in PDF (29 pag.), acquisto con DDA in corsa, backup di esempio. | **Modo B** (telefoni veri) e **Modo C** (emulatori) |
| [**`kit_cinque_stabilimenti_dati.zip`**](provalo/kit/kit_cinque_stabilimenti_dati.zip) | ~426 KB | Dati completi per 5 stabilimenti: registri BDN di 5 stabilimenti, pacchetto multi-stabilimento, modelli 2/33 di ARVET, foglio A3 orizzontale in HTML, schede HTML, backup di esempio. | **Modo A** (browser) e preparazione Regia |
| [**`kit_cinque_stabilimenti_pdf.zip`**](provalo/kit/kit_cinque_stabilimenti_pdf.zip) | ~3,0 MB | Solo documenti pronti per la stampa in PDF: 2.576 schede capo (180 pagine), tutti i modelli 2/33 con provette e foglio A3 orizzontale. | Sessioni di addestramento avanzate su carta |
| [**`backup_esempio_888TO999.zip`**](provalo/kit/backup_esempio_888TO999.zip) | ~26 KB | Singolo file di backup di Fejalog con provette già campionate e registro verificato: pronto da trascinare negli strumenti on line. | **Modo A** (solo browser) |

Le impronte crittografiche SHA-256 di tutti gli archivi sono pubblicate nel file [**`sha256sum.txt`**](provalo/kit/sha256sum.txt).

---

## 1. Kit 1: Stabilimento singolo `888TO999` («AZ. AGR. ESEMPIO»)

È il kit storico di Fejalog, calibrato per sessioni rapide di simulazione (15–60 minuti) con un tablet di Regia e uno o due palmari:

- **Stabilimento di lavoro**: `888TO999`, denominazione convenzionale «AZ. AGR. ESEMPIO».
- **Stabilimento di riferimento**: `888TO888` (pascolo confinante condiviso: i suoi capi compaiono come «altro stabilimento»).
- **Consistenza del gregge**:
    - 220 pecore presenti;
    - 12 montoni presenti (con numeri di provetta riservati in testa);
    - 40 capre presenti (inclusi 2 becchi);
    - 48 pecore uscite (due capi per ciascuna causale di uscita BDN: macello, morte, vendita, furto, smarrimento, ecc.);
    - 4 capre uscite;
    - 15 contrassegni disponibili, non registrati su un capo (10 pecore e 5 capre);
    - 5 contrassegni in nessun registro caricato;
    - 4 capi ricercati (bordo viola sulle schede);
    - 6 capi di un venditore esterno (`888TO777`), il cui registro si carica come riferimento per provare la dichiarazione individuale di acquisto con DDA;
    - 1 contrassegno estero francese (`FR...`);
    - 3 capi con doppio prelievo simulato.

### Contenuto dettagliato di `kit_prova_888TO999.zip`

- `bdn/registri/`: i file di testo fittizi nel tracciato BDN per pecore e capre di `888TO999` e `888TO888`;
- `bdn/contrassegni/`: i file dei contrassegni disponibili non applicati;
- `pacchetto_888TO999_kit.json`: il medesimo progetto già convertito in pacchetto JSON;
- `ricercati_888TO999.csv`: l'elenco dei quattro capi ricercati con la motivazione sanitaria;
- `in_corsa/`: i file BDN per simulare variazioni in corso d'opera (acquisto con DDA e capo venduto dopo lo scarico BDN);
- `schede_kit_prova_888TO999.pdf` e `.html`: 29 pagine A4 con le schede dei capi, complete di barcode microchip e istruzioni su cosa deve accadere;
- `elenco_kit_prova.csv`: tabella riepilogativa di tutte le schede;
- `backup_esempio_888TO999.zip`: backup derivato dal pacchetto del kit, con catene di hash, provette registrate e pose complete.

---

## 2. Kit 2: Cinque stabilimenti di lavoro

È il kit avanzato per simulare una profilassi complessa multi-stabilimento:

| Stabilimento | Ruolo | Lettera | Ovini | Caprini | Usciti nello storico |
|---|---|---|---|---|---|
| **888TO999** | Principale | Nessuna | 500 | 100 | 902 |
| **888TO888** | Secondario | X | 120 | 24 | 216 |
| **888TO777** | Secondario | Y | 80 | 16 | 144 |
| **888TO666** | Secondario | W | 60 | 12 | 108 |
| **888TO555** | Secondario | V | 40 | Nessuno | 60 |
| **888TO444** | Chiuso | — | — | — | 160 |
| **888TO333** | Chiuso | — | — | — | 60 |
| **888TO222** | Riferimento (pascolo) | — | 8 | — | 6 |

### Particolarità del kit a cinque stabilimenti

1. **Lettere di specie nel pacchetto di prova**: le capre usano la lettera `C`, generando etichette come `12` e `C12` nel principale, `X12` e `XC12` nel secondario X, e così via.
2. **Stabilimenti chiusi**: distingue capi che risultano solo usciti dai chiusi (movimentazione da chiarire) da capi con una vecchia uscita dal chiuso e una presenza già registrata nello stabilimento di lavoro. La storia da sola non implica un ingresso mancante.
3. **Modelli 2/33 fittizi**:
    - `2-33/ingresso/`: i 9 file `.htm` sintetici che riproducono la struttura del modello ARVET, senza dati veri;
    - `2-33/con_provette/`: i modelli 2/33 precompilati con numerazione assegnata a 12 mesi e maschi evidenziati in grigio;
    - `prima_del_campo/provette_contrassegni_12mesi_A3.html` e `.pdf`: foglio orizzontale A3 con le colonne Provetta e Contrassegno;
    - `2-33/numerazione_attesa_12mesi.csv`: i 796 numeri assegnati per la verifica automatica.

---

## Quali anomalie provare

**La presenza delle schede nel kit non equivale a una prova eseguita.** Usa questa tabella come lista di controllo, insieme al [quadro completo delle anomalie](anomalie.md). Il kit singolo copre le causali d'uscita alfabetiche delle sue schede; il kit a cinque stabilimenti aggiunge giovani, stabilimenti chiusi e confronti fra serie di lavoro e di riferimento.

I codici sotto sono interamente fittizi. Nel kit singolo il prefisso è `IT066000000`; per esempio **401** significa `IT066000000401`. Per i fuori età conserva la data della seduta del kit avanzato, **24/10/2026**, e la soglia **12 mesi**: le età non sono riferite al giorno in cui leggi questa pagina.

| Da spuntare | Schede o azione da scegliere | Risultato da controllare |
|---|---|---|
| ☐ **Smarriti, rubati, furto/smarrimento** | Singolo: **401** (`W`), **403** (`H`), **405** (`F`); anche capre **449**, **450** | Sempre problematici, senza numero ordinario preassegnato; il ritrovamento non corregge la BDN. |
| ☐ **Morti, abbattuti, presunti morti** | Singolo: **407–414**, incluse urgenza e macellazione domiciliare | Avviso di uscito con causale/data; verifica dell'identità e soluzione della Regia. |
| ☐ **Trasferiti, macello e altre uscite** | Singolo: **415–436**, **437–440**, **441–448** | Problematici anche se il capo è fisicamente presente. Prova una scheda per ciascuna causale, non solo una per sezione. |
| ☐ **Stabilimento non campionato** | Singolo: **501–506** di `888TO888` | Viola «Altro stabilimento»; scartare non registra, inserire e confermare produce una problematica. |
| ☐ **Altro stabilimento di lavoro** | Cinque: un adulto di `888TO888`; poi un capo di `888TO222` prima e uno dopo l'aggiunta come secondario | L'adulto del secondario già attivo è ordinario nella sua serie; il riferimento è problematico. Numeri già scritti invariati. |
| ☐ **Stabilimenti chiusi e storia dei trasferimenti** | Cinque: capitoli `888TO444`/`888TO333`; confronta un capo solo uscito con un capo già presente in uno stabilimento di lavoro | Non confondere provenienza storica e ingresso mancante; il presente attuale prevale sulla vecchia uscita. |
| ☐ **Marche disponibili** | Singolo: **601–610** e **651–655** | Blu, anagrafica obbligatoria, etichetta problematica; la marca disponibile non è un capo già censito. |
| ☐ **Contrassegno in nessun registro** | Singolo: **701–705** | Forzato col codice completo; sesso, razza e nascita obbligatori, soluzione da verificare. |
| ☐ **Anagrafica oltre sei mesi** | Su una marca o un forzato inserisci una nascita più vecchia di sei mesi rispetto alla seduta | Avviso giallo non bloccante; è diverso dal fuori età diagnostica. |
| ☐ **DDA individuale** | Singolo: **801**, dopo aver caricato il registro del venditore `888TO777`; poi **802** | DDA dichiarato solo su **801**; resta da verificare. Prova valido/da rifare e ingresso registrato prima della normalizzazione. **802** non eredita la spunta. |
| ☐ **Specie discordante** | Singolo: **341–342**, capre cercate nella pagina Pecore | Errore di specie; cambiando pagina risolvi una ricerca errata, confermando la discordanza registri una problematica. |
| ☐ **Fuori età diagnostica** | Cinque: `IT066000010007`, nato 11/12/2025; anche una scheda «sotto i 6 mesi» | Con soglia 12 mesi, se prelevato è problematico; predefinita **Eliminata**, niente numero finale né ARVET. |
| ☐ **Senza contrassegno e successiva comparsa delle marche** | Simula l'assenza delle marche su un presente non ancora prelevato; dopo l'attribuzione cerca e preleva quel candidato con il codice | Identificazione attribuita, DX/SX da sostituire; se arriva il prelievo col contrassegno letto, la precedente attribuita è da verificare. Prova fisica sul campo ancora da fare. |
| ☐ **DX, SX, bolo e sesso discordante** | Su un adulto presente prova le spunte e il sesso corretto | Segnalazioni conservate in Ultime e nelle uscite; DX o bolo alimentano i senza transponder. |
| ☐ **Doppi e collisioni** | Singolo: seconde schede **003**, **150**, **225**; [lezione 8](tutorial/08-doppi-rete.md) | Rifiuto senza nuovo campione oppure doppio distinto; fuori rete verifica al rientro, con controllo e rinomina fisica se richiesta. |
| ☐ **Diventata problematica / ora in lista** | Preleva **010**, poi carica il registro aggiornato `_1100`; per il percorso inverso prova un acquisto verificato della [lezione 9](tutorial/09-registri-in-corsa.md) | Riclassificazione senza cambiare la scritta già emessa; normalizzazione solo quando ammessa. |
| ☐ **Persa, ripetuta, ritrovata** | Su un presente registrato usa Persa, ripeti il prelievo, poi Ritrovata | Il vecchio numero resta impegnato; il ritrovamento dopo la ripetizione crea un doppio da risolvere. |
| ☐ **Ricercati, accantonate e tardive** | Ricercati **005**, **017**, **222**, **703**; poi [lezione 11](tutorial/11-problemi.md) e [incidenti programmati](provalo/incidenti-programmati.md) | Banner e istruzioni anche su forzati; accantonate risolte; tardiva solo con provetta fisica riconosciuta, etichetta e nota. |
| ☐ **Annullata ed eliminata** | Su due campioni di prova usa annullo e soluzione Eliminata | Storia conservata, campioni da mettere da parte, niente numero finale né ARVET; l'etichetta annullata non viene riemessa. |
| ☐ **Casi di confronto senza anomalia anagrafica** | Estero `FR066000000950`; adulto ordinario prelevato da isolato | Codice estero riconosciuto; etichetta da isolato conservata al rientro, senza presumere che sia una problematica. |

Le **provvisorie storiche** e il gruppo residuo **Altre problematiche** si controllano se presenti in un progetto pregresso: i backup di esempio non dimostrano da soli tutte le fattispecie. Per le prove di questa tabella avvia un progetto dal pacchetto o dai file BDN, come nel tutorial.

Prima di calcolare il riordino controlla **regole per tipologia ed eccezioni individuali**: in coda, eliminata oppure normalizzata quando ammessa. Annota build, dispositivi, data della seduta e risultato. Nel **LEGGIMI incluso in ciascun archivio** trovi anche le istruzioni per le anomalie da consultare senza sito.

---

## Come leggere una scheda di prova

Le schede stampate o visualizzate a schermo contengono tutte le informazioni per simulare il lavoro del veterinario:

- **Con lettore ottico di codici a barre in modalità tastiera**:  
  Il codice a barre riporta le cifre che manderebbe il lettore di microchip (`0380` seguito da 12 cifre, oppure `0250` per il capo francese). Il lettore ottico le scrive nell’app come una tastiera. Un lettore di microchip legge il transponder fisico e non il codice a barre stampato.
- **Inserimento manuale a tastiera**:  
  Sul tastierino dell'app si digitano le **ultime 3 o 4 cifre** del contrassegno, evidenziate in grassetto sulla scheda.
- **Esito atteso**:  
  Ogni sezione delle schede specifica cosa deve fare l'applicazione (provetta ordinaria nella serie, provetta problematica, avviso ricercato, richiesta anagrafica). Se l'app si comporta diversamente, è un'anomalia.

---

## Rigenerazione e verifica dei dati

I kit fittizi sono generati con codice R a seme fisso per garantire la totale riproducibilità:

- `Rscript strumenti/genera_kit_prova.R`: rigenera il kit a stabilimento singolo `kit_prova/`;
- `Rscript strumenti/genera_kit_cinque_stabilimenti.R`: rigenera il kit a cinque stabilimenti `kit_prova/cinque_stabilimenti/`;
- `strumenti/pacchetti_sito_kit.sh`: rigenera entrambi i backup tramite `KitBackupEsempioTest` (le API JVM dell'app), poi confeziona gli archivi e `sha256sum.txt` con Python. Richiede JDK 21, Android SDK, Node, Python e `pdftotext`. Non legge altre cartelle di dati e non modifica svet-tools.

Dalla radice del repository:

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export ANDROID_HOME="$HOME/Android/Sdk"
strumenti/pacchetti_sito_kit.sh
./gradlew -PsoloFixture=true :shared:jvmTest --tests '*KitSitoTest' --tests '*KitBackupEsempioTest'
```

Il backup singolo proviene da `pacchetto_888TO999_kit.json`, quello multiplo da `pacchetto_888TO999_cinque_stabilimenti.json`: entrambi hanno campioni già registrati, una problematica, pose della Regia e campionamento chiuso. La data e le scelte del generatore sono fisse. A parità di sorgenti gli archivi sono identici anche nei metadati; i test confrontano l'inventario completo e gli hash dei file interni.

I 2/33 precompilati e il foglio A3 del kit sono esempi **iniziali** a 12 mesi. Il 2/33 finale si ottiene invece dal backup campionato seguendo il [Modo A](provalo/tre-modalita.md).

La suite di test automatica di Fejalog (`KitSitoTest` e `KitProvaTest`) controlla costantemente che:

1. Gli archivi scaricabili sul sito coincidano esattamente con i file sorgente di `kit_prova/` (confronto dell'hash SHA-256 dei singoli file interni);
2. L'importazione dei file BDN fittizi produca lo stesso pacchetto e gli stessi numeri assegnati calcolati da svet-tools;
3. Il confezionamento ammetta solo le famiglie di codici sintetici del kit, anche nei backup annidati e nel testo estratto dai PDF. Nelle intestazioni dei 2/33 ci sono identificativi fiscali numerici fittizi con prefisso `888000`; nelle provette e negli export non ci sono codici fiscali. Il controllo non sostituisce la revisione prima della pubblicazione.
