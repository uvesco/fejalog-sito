# Il kit di prova con dati fittizi

> **A chi serve**: a chi prova Fejalog nel browser, con telefoni o emulatori, prima del campo.
> **Tempo di lettura**: 5 minuti.

Il kit pubblico comprende **cinque stabilimenti di lavoro**, uno grande con **1.200 presenti** e uno piccolo con
**10 presenti**, tutte le causali d'uscita scrivibili nel tracciato BDN e le altre fattispecie descritte sotto.
Usa pochi capi per una prova breve; i dati completi servono anche per verificare numerazioni oltre mille.

## File scaricabili dal sito

| File | Dimensione | Contenuto |
|---|---|---|
| [kit_cinque_stabilimenti_dati.zip](provalo/kit/kit_cinque_stabilimenti_dati.zip) | 0,63 MiB | Registri BDN, pacchetto, ricercati, schede HTML, modelli 2/33 di ingresso, stampe HTML e backup di esempio. |
| [kit_cinque_stabilimenti_pdf.zip](provalo/kit/kit_cinque_stabilimenti_pdf.zip) | 4,50 MiB | Schede A4 (4265 schede, 307 pagine), dieci 2/33 precompilati e foglio A3 in quattro pagine. |
| [backup_esempio_cinque_stabilimenti.zip](provalo/kit/backup_esempio_cinque_stabilimenti.zip) | 0,17 MiB | Pochi campioni già registrati e posati nelle dieci serie, una problematica, campionamento chiuso: pronto per il browser. |

[Impronte SHA-256](provalo/kit/sha256sum.txt). Nessun file supera 10 MiB; il PDF delle schede è circa 6,9 MiB.
Il kit storico singolo resta nel repository per i test e non viene più pubblicato.

## Gli stabilimenti e i casi

È il kit pubblico di Fejalog (aggiornato il 30/10/2026), con cinque stabilimenti di lavoro e registri storici.
Tutto è inventato: codici `888TO…`, denominazioni «AZ. AGR. ESEMPIO…», contrassegni `IT0660000NNNNN`
da 10001 a 14277. Un solo codice francese fittizio `FR066000010030` sostituisce un ovino del principale,
per provare il lettore estero (`0250…`); tutti gli altri sono italiani (`0380…`). Nessun codice coincide con il kit singolo.

Ci sono **4.277 identità distinte**, comprese le marche non stampate e i sei capi DDA caricabili in corsa:
meno dei 10.000 suffissi disponibili. Le ultime **quattro cifre sono uniche fra tutte le identità del kit**;
le ultime tre possono ripetersi. Una scheda discordante o doppia ripete intenzionalmente lo stesso animale.

Le frequenze di base (usciti per presente 1,5; maschi, età e razze) derivano soltanto da aggregati di due greggi.
Sono integrate con esempi sintetici: **tutti i 32 motivi di uscita della BDN**, almeno due per codice e
specie nel principale, e almeno due per codice e specie distribuiti fra gli altri quattro stabilimenti di lavoro.
Non sono quindi più una distribuzione puramente percentuale.

- In uso: **A C E G H I J K L M P R S T U V W 8 9**.
- Morte/macellazione in stabilimento: **D N Q Y Y3 2 3 4 5 6**.
- Non più in uso: **F X Z**.
- **Y3** (presunto morto) è scritto intero: il motivo occupa le colonne 538-539. Le descrizioni complete sono
  quelle di `CodiciBdn.USCITE`.
- I codici per insiemi **L** e **8** sono simulati su righe individuali del tracciato per provarne la decodifica;
  non rappresentano una movimentazione reale di un insieme.



| Codice | Ruolo | Lettera | Ovini | Capre | Usciti nel registro |
|---|---|---|---|---|---|
| 888TO999 | principale | nessuna | 1050 | 150 | 1930 |
| 888TO888 | secondario | X | 120 | 24 | 248 |
| 888TO777 | secondario | Y | 80 | 16 | 176 |
| 888TO666 | secondario | W | 60 | 12 | 140 |
| 888TO555 | secondario | V | 8 | 2 | 47 |
| 888TO444 | chiuso il 30/06/2025 |  | 0 | 0 | 160 |
| 888TO333 | chiuso il 15/11/2023 |  | 0 | 0 | 60 |
| 888TO222 | riferimento (pascolo e venditore DDA) |  | 8 | 0 | 6 |

- **Lettera di specie predefinita**: C sulle capre. Così le etichette sono `12` e `C12` nel principale, `X12` e `XC12`
  nel secondario X, e così via.
- **Chiusi**: una parte delle loro vendite è finita negli stabilimenti di lavoro. Sono capi presenti oggi, con la loro
  storia nel registro del chiuso.
- **Fra 888TO999 e 888TO888**: due pecore risultano uscite (V) dal primo e presenti nel secondo.
- **In corsa**: `in_corsa/888TO888_pecore_…_1100.txt` è il registro di 888TO888 aggiornato, con un capo venduto dopo lo
  scarico.
- **Marche disponibili**: 21 ovine e 6 caprine, in cinque stabilimenti.
- **DDA individuale**: sei ovini (IT066000014241–IT066000014246), solo nel registro `in_corsa/888TO222_pecore_…_1100.txt`. Il file conserva anche gli otto presenti e i sei usciti del riferimento.
- **Specie discordante**: due capre già presenti del principale, IT066000011082 e IT066000011106, riproposte in schede dedicate da cercare fra le pecore.
- **Codice estero**: FR066000010030, già compreso nei 1050 ovini del principale.
- **Ricercati**: uno per stabilimento, in `ricercati_cinque_stabilimenti.csv`.
- **Doppi**: uno per stabilimento.
- **Capi in nessun registro**: quattro.

## Contenuto degli archivi

| File | A che cosa serve |
|---|---|
| `bdn/registri/` (15 file), `bdn/contrassegni/` (7) | i file della BDN per Nuovo › file BDN (si possono scegliere tutti insieme, anche in uno zip) |
| `pacchetto_888TO999_cinque_stabilimenti.json` | lo stesso progetto come pacchetto, come lo fa svet-tools |
| `schede_kit_cinque_stabilimenti.pdf` (e `.html`) | 4265 schede col barcode del codice elettronico, 307 pagine (4258 animali stampati distinti). Per ogni stabilimento prima i presenti (pecore, montoni, capre, giovani), poi un capitolo per ogni motivo d'uscita; in fondo marche, capi in nessun registro e doppi. Ogni sezione dice cosa deve succedere |
| `elenco_kit_cinque_stabilimenti.csv` | ogni scheda: sezione, contrassegno, codice elettronico, anagrafica, cosa deve succedere (per filtrare e stampare solo una parte) |
| `2-33/ingresso/` | i 2/33 come li stampa ARVET, uno per stabilimento e specie (10 file `.htm`): sono quelli da dare all'app |
| `2-33/con_provette/` | il risultato atteso (`.html` e `.pdf`): lo stesso 2/33 precompilato, con l'età diagnostica di 12 mesi. Stesso ordine di ARVET, il numero nella colonna «Provetta», negli ovini la riga dei maschi grigia; i fuori età restano senza numero |
| `prima_del_campo/provette_contrassegni_12mesi_A3.pdf` (e `.html`) | il foglio A3 orizzontale atteso, Provetta \| Contrassegno: i numeri assegnati con 12 mesi in ordine di provetta, serie per serie, maschi degli ovini in grigio (quattro fogli). prodotto fra le stampe pre-campo |
| `2-33/numerazione_attesa_12mesi.csv` | i 1291 numeri assegnati che l'app deve dare con 12 mesi e la C sulle capre |

## I 2/33

- **Il 2/33 precompilato si produce in configurazione**, fra le stampe pre-campo, partendo dai file fittizi di ingresso. I file con le provette sono esempi del risultato iniziale a 12 mesi. Il sito produce anche il 2/33 finale a partire dal backup campionato, in Uscite, caricando i modelli fittizi di ingresso.
- **Sono fatti sullo schema dei 2/33 ovicaprini veri** della prova del 22 ottobre (solo la struttura, nessun dato):
  - testata della bonifica col codice dello stabilimento e il suo codice a barre;
  - proprietari e detentori; 888TO999 ne ha due, e una parte delle sue capre è del secondo;
  - tabella dei capi a pagine di 40 righe, coi soli presenti in ordine di contrassegno;
  - la colonna «Provetta» vuota;
  - la razza con la sigla di ARVET (BLS, MTT, TCL; nei registri BDN BIE, MET, TAC);
  - il genotipo scrapie dei montoni;
  - in coda righe vuote numerate, il 10% dei capi più 3.
- **I maschi sono sparsi** nell'ordine di contrassegno, come nei 2/33 veri: i numeri della colonna «Provetta» non
  seguono l'ordine delle righe (fra le pecore i maschi hanno i primi numeri).
- Il lettore di svet-tools (`R/fabbisogno_tubercolina.R`) legge questi file come quelli veri.

## Quali anomalie provare

Usa data della seduta **24/10/2026**, soglia **12 mesi**, e copia le etichette effettive della conferma.
I giovani delle schede restano giovani alla data del kit, non a qualunque data successiva.

| Prova | Schede / azione | Esito atteso |
|---|---|---|
| ☐ Usciti ritrovati | Per ogni stabilimento, tutti i 32 capitoli di causale dove presenti, compresi 2, 3, 4, 5, 6, 8, 9 | Smarriti e rubati sempre problematici; controlla identità, data e causale anche per morti, macello e trasferiti. |
| ☐ Fuori età | IT066000010012 (19/11/2025), più una scheda sotto sei mesi | Con soglia 12 mesi sono problematici se prelevati, senza numero ordinario; predefinita Eliminata, niente numero finale né ARVET. Confronta i 2/33 iniziali senza numero. |
| ☐ Secondario già campionato | Un adulto presente di 888TO888 | Ordinario nella serie dello stabilimento di lavoro, distinta da quella del principale. |
| ☐ Stabilimento non campionato | Un presente di 888TO222 prima di aggiungerlo | Avviso viola, problematico; il solo registro non lo include nella profilassi. |
| ☐ Nuovo secondario | Aggiungi 888TO222 solo per simularne il risanamento contemporaneo; poi preleva un altro adulto | Nuovi capi nella sua serie; scritte già emesse invariate, da controllare prima del riordino. |
| ☐ Stabilimento chiuso | Capi solo usciti di 888TO444/888TO333, poi un capo già presente in uno di lavoro con vecchia uscita dal chiuso | Il primo richiede verifica di provenienza/ingresso; il secondo non è problematico per la sola storia, perché prevale il presente. |
| ☐ Trasferimento fra due di lavoro | Sezione «888TO888 · arrivate da 888TO999» | Presente in 888TO888, serie X; la precedente uscita da 888TO999 non lo duplica. |
| ☐ Marche e forzati | Sezioni Marche disponibili / In nessun registro | Sesso, razza, nascita obbligatori; per il forzato codice completo e destinazione verificata. Una nascita oltre sei mesi genera un avviso non bloccante. |
| ☐ Registro aggiornato | Preleva prima il capo poi venduto nel file `in_corsa/888TO888_pecore_…_1100.txt`, quindi carica quel file | Diventata problematica; scritta fisica e assegnazione iniziale conservate, soluzione guidata. |
| ☐ Ricercati e doppi | Ricercati del CSV; seconde schede da un altro palmare, anche dopo isolamento | Banner con azione; Già fatto non registra, la conferma come doppio crea una distinta problematica. Al rientro verifica tutte le provette coinvolte. |
| ☐ Senza marche, orecchini/bolo e sesso | Simula un presente non prelevato senza identificativi; prova anche le spunte e il sesso corretto su altre schede | Attribuzione per anagrafica tracciata, DX/SX da sostituire; se poi arriva il prelievo col contrassegno letto, l'attribuita va verificata. DX o bolo segnalati alimentano i senza transponder. |
| ☐ Perdite, accantonate e tardive | Persa → ripeti → Ritrovata; Accantona; provetta scritta e non confermata | Doppio dopo il ritrovamento; accantonata da registrare/scartare; tardiva solo dalla Regia a campionamento chiuso con etichetta verificata e nota. |
| ☐ DDA individuale | Carica `in_corsa/888TO222_pecore_…_1100.txt`, dichiara DDA su IT066000014241, poi cerca IT066000014242 | Il secondo non eredita il DDA; prova documento valido/da rifare e ingresso registrato prima di normalizzare. Il venditore resta riferimento. |
| ☐ Specie discordante | Cerca IT066000011082 e IT066000011106 nella pagina Pecore | Sono capre già nel registro; verificare specie e animale. |
| ☐ Codice estero | Barcode di FR066000010030, `0250066000010030` | Riconosciuto come presente ovino del principale; il paese estero non è di per sé un'anomalia. |

Il DDA non è un ruolo da applicare all'intero venditore: si dichiara per singolo prelievo. Fejalog non scrive nella BDN.
Esegui la prova DDA prima di aggiungere 888TO222 ai luoghi di lavoro, oppure riparti dal pacchetto iniziale.
Il kit singolo resta soltanto nel repository per le regressioni e non è più distribuito.

Controlla le soluzioni prima del riordino: in coda, eliminata oppure normalizzata quando ammessa. Le eliminate vanno
messe da parte. Queste sono prove da eseguire e annotare, non certificazioni di esecuzione su dispositivi fisici.

## Percorso e rigenerazione

Segui le [tre modalità di simulazione](provalo/tre-modalita.md), gli [incidenti programmati](provalo/incidenti-programmati.md)
o il [tutorial](tutorial/index.md). I 2/33 precompilati sono esempi iniziali; il 2/33 finale deriva dal backup campionato.
Nel LEGGIMI di ogni archivio trovi anche la lista di prova da consultare senza sito.

Dalla radice del repository, con JDK 21 e Android SDK:

```bash
Rscript strumenti/genera_kit_cinque_stabilimenti.R
strumenti/pacchetti_sito_kit.sh
./gradlew -PsoloFixture=true :shared:jvmTest --tests '*KitSitoTest' --tests '*KitBackupEsempioTest' --tests '*KitProvaTest'
```

`KitProvaTest` confronta importazione BDN, pacchetto e numerazione con svet-tools, usato in sola lettura.
`KitSitoTest` verifica inventario completo e SHA-256 di ogni file; i backup sono generati con le API dell'app,
con data e scelte fisse. Il confezionamento verifica gli identificativi sintetici anche nei PDF e negli ZIP annidati.
A parità di sorgenti gli archivi sono identici anche nei metadati. Il kit singolo continua a essere verificato dai test.

Le etichette degli esempi indicano serie e numeri: sul campo copia sempre la scritta effettiva mostrata dall'app.
