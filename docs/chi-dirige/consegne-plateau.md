# Consegne delle provette e gestione dei plateau

> **A chi serve**: al responsabile della Regia che riceve le provette fisiche al tavolo durante il campionamento aperto · **Tempo di lettura**: 5 minuti

Durante la profilassi, la postazione della Regia opera come centro di smistamento logistico. I veterinari prelevatori si presentano periodicamente al tavolo con i campioni raccolti: la Regia riceve il lotto a video, convalida la presa in carico con il comando «Ricevi» e infila ogni provetta nel rispettivo pozzetto seguendo la guida dello schermo.

---

## 1. La schermata Regia a due pannelli

Sui tablet con schermo panoramico (10–11 pollici), aprendo *Campionamento › Regia*, Fejalog attiva automaticamente la vista a **due pannelli affiancati**:

Il pannello sinistro mostra la squadra e le consegne; quello destro i plateau. La disposizione dipende dalla larghezza disponibile: nelle finestre strette si passa fra le due schede.


- **Pannello di sinistra (Squadra al lavoro)**: elenca tutti i veterinari attivi. I colleghi che hanno provette confermate ma non ancora consegnate compaiono in cima alla lista con il conteggio in evidenza.
- **Pannello di destra (Plateau interattivo)**: riproduce fedelmente il rack fisico da 100 pozzetti, con file sfalsate a quinconce e smussi agli angoli. Supporta lo zoom a due dita (pinch-to-zoom) e il trascinamento con un dito. Toccando qualsiasi pozzetto si visualizzano i dettagli completi del capo (contrassegno, sesso, razza, note, identificazione).
- **Riquadro di ricerca rapida**: digita il numero di provetta, l'etichetta o le ultime cifre del contrassegno: lo schema commuta istantaneamente al plateau pertinente e fa pulsare il pozzetto cercato.

---

## 2. Il flusso di consegna: «Ricevi» e «Metti qui»

> :material-video: **Guarda il micro-video**: [:octicons-arrow-right-24: La Regia riceve e riempie i plateau (circa un minuto)](../inizia-qui/video.md#video-5-la-regia-riceve-e-riempie-i-plateau)

Quando un veterinario si avvicina al tavolo e consegna il lotto di provette:

1. **Tocca «Ricevi (N)»**: accanto al nome del veterinario compare il pulsante verde con il numero esatto di campioni in attesa di consegna. Toccando «Ricevi», la Regia conferma la presa in carico formale dei campioni.
2. **I colori cambiano a video**: sullo schema del Plateau le provette consegnate passano istantaneamente da un colore pastello attenuato a un **colore pieno e brillante**, a testimonianza dell'avvenuta ricezione fisica.
3. **Segui l'elenco «Metti qui»**: in calce al pannello di destra compare l'elenco dettagliato delle provette appena ricevute con l'indicazione precisa:
   - Quale plateau prendere sul tavolo (es. *Plateau 1* o *Plateau Problematici*);
   - In quale pozzetto esatto infilare la provetta (da 1 a 100, secondo il verso di riempimento stabilito).

---

## 3. Regole fisiche di posizionamento: dove va ogni provetta

### Il posto fisico immutabile (`PROVETTA_POSATA`)
Dopo la conferma della ricezione, l'app genera nel registro l'evento immutabile `PROVETTA_POSATA`.  
**Il posto fisico registrato non cambia mai più durante il campionamento aperto per nessun motivo**: né per l'aggiunta successiva di una nota, né per la correzione di una marca, né se in seguito viene scoperto un doppio prelievo. Se una provetta viene persa o annullata, la posa rimane nella storia. Non cambiare di nascosto il posto di altre provette per chiudere il buco.

### Provette ordinarie e provette da isolato non doppie
- **Provette ordinarie**: vanno direttamente nel pozzetto corrispondente al loro numero definitivo preassegnato nella serie ordinaria (es. provetta 47 va al pozzetto 47 del Plateau 1).
- **Provette prelevate da isolato senza duplicati (con il suffisso mostrato dall’app)**: vanno **subito nel pozzetto del loro numero naturale** (pozzetto 28 del Plateau 2) e non nella riga problematici.  
  > *Regola operativa*: collocare subito al loro posto gli isolati che non risultano doppi azzera inutili spostamenti durante il riordino finale di fine seduta.

### Problematici in sequenza unica: «Toglilo dal tavolo»
I campioni problematici (capi smarriti, rubati, fuori età, di altri stabilimenti, doppi confermati e collisioni) seguono un flusso separato:
1. Vanno posizionati nel **primo pozzetto libero disponibile** nel plateau dei problematici, in rigoroso ordine di consegna cronologica (indipendentemente da specie e stabilimento).
2. Sul tavolo della Regia deve essere presente **un solo plateau problematici in uso alla volta**.
3. Quando una consegna completa un plateau problematici, compare il promemoria:  
   **«Plateau problematici N pieno: toglilo dal tavolo»**.
4. Una consegna può interessare più plateau: controlla tutte le destinazioni in «Metti qui». Sposta il plateau colmo fuori dal piano di lavoro, contrassegnalo con la sua etichetta e colloca al suo posto un plateau vuoto per i problematici successivi.

---

## 4. Cosa fare con i capi senza contrassegno

Se durante la profilassi vengono presentati animali che hanno perso entrambi i marchi auricolari o il bolo (lasciati tipicamente alla fine per non rallentare la corsia), si utilizza la funzione **«Senza contrassegno»** (disponibile sul palmare o sul tablet della Regia solo a campionamento aperto):

1. **Tocca «Senza contrassegno»**: si apre la maschera di attribuzione anagrafica.
2. **Imposta i filtri somatici**:
   - Specie e stabilimento di lavoro;
   - Sesso (Maschio o Femmina);
   - Razza (oppure «Non so» se meticcio o non distinguibile);
   - Intervallo di età in anni a scatti di 6 mesi (es. da 2 a 3 anni e mezzo).
3. **Scegli fra i candidati**: Fejalog visualizza l'elenco dei capi presenti in anagrafe non ancora prelevati che rispondono ai criteri indicati.
4. **Conferma normale**: selezionato il capo, si apre il normale foglio di conferma:
   - Il campione riceve il numero ordinario del capo attribuito;
   - La modalità di identificazione viene registrata come `attribuita`;
   - Entrambe le caselle «Orecchino DX» e «Orecchino SX» vengono automaticamente spuntate come «da sostituire».
5. **Cosa succede se in seguito compare il capo reale con le marche?**  
   Se successivamente viene trovato e campionato l'animale vero con il suo contrassegno originale, il sistema dà precedenza assoluta al contrassegno reale letto. La provetta precedentemente attribuita viene riclassificata automaticamente tra i **problematici**, da esaminare a fine lavori. Questo caso non è ancora stato verificato su dispositivi fisici.

---

## 5. Cosa può andare storto

| Problema | Causa | Azione correttiva della Regia |
|---|---|---|
| **Il veterinario consegna provette ma a video risultano 0** | Il palmare ha lavorato isolato e non ha ancora sincronizzato i dati con la Wi-Fi. | Chiedi al veterinario di avvicinarsi al router finché l'icona di rete non diventa verde; non appena compaiono sul tablet, tocca «Ricevi». |
| **Il pozzetto fisico indicato da «Metti qui» è già occupato** | Una provetta precedente è stata infilata per errore nel foro sbagliato. | Tocca il pozzetto sullo schermo del tablet: leggi il contrassegno che dovrebbe trovarsi lì, rintraccia la provetta fuori posto nel plateau e correggi la collocazione fisica prima di posare il nuovo campione. |
| **Provetta problematica arrivata senza scritta completa** | Il veterinario non ha copiato tutto il codice dal riquadro rosso. | Prima di posare la provetta nel plateau, scrivi immediatamente con il pennarello il contrassegno BDN completo e l'etichetta completa mostrata dall'app sul corpo della provetta. |
| **Provette cadute o rovinate durante il passaggio** | Incidente materiale al tavolo. | Se il campione è utilizzabile, asciugalo e riscrivi l'etichetta; se la provetta è rotta, seleziona la provetta su Fejalog e tocca «Annulla provetta». L'etichetta non verrà riutilizzata e il capo andrà riprelevato come problematico. |

---

## Pagine collegate
- [Attrezzatura da campo e calcolo materiale](attrezzatura-materiale.md)
- [Preparare il progetto e avviare la seduta](avvio.md)
- [Rete locale e gestione dispositivi](rete.md)
- [Controllo provette, problemi e statistiche](../dopo-il-campo/provette-statistiche.md)
