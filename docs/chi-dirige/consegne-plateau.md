# Consegne delle provette e gestione dei plateau

> **A chi serve**: al responsabile della Regia che riceve le provette fisiche al tavolo durante il campionamento aperto · **Tempo di lettura**: 5 minuti

Durante la profilassi, la postazione della Regia opera come centro di smistamento logistico. I veterinari prelevatori si presentano periodicamente al tavolo con i campioni raccolti: la Regia riceve il lotto a video, convalida la presa in carico con il comando «Ricevi» e infila ogni provetta nel rispettivo pozzetto seguendo la guida dello schermo.

---

## 1. La schermata Regia a due pannelli

Sui tablet con schermo panoramico (10–11 pollici), aprendo *Campionamento › Regia*, Fejalog attiva automaticamente la vista a **due pannelli affiancati**:

Il pannello sinistro mostra la squadra e le consegne; quello destro i plateau. La disposizione dipende dalla larghezza disponibile: nelle finestre strette si passa fra le due schede.


- **Pannello di sinistra (Squadra al lavoro)**: elenca tutti i veterinari attivi. I colleghi che hanno provette confermate ma non ancora consegnate compaiono in cima alla lista con il conteggio in evidenza.
- **Pannello di destra (Plateau interattivo)**: riproduce fedelmente il rack fisico da 100 pozzetti, con file sfalsate a quinconce e smussi agli angoli. Supporta lo zoom a due dita (pinch-to-zoom) e il trascinamento con un dito. Toccando qualsiasi pozzetto si visualizzano i dettagli completi del capo (contrassegno, sesso, razza, note, identificazione ed eventuali foto scattate dal palmare).
- **Riquadro di ricerca rapida**: digita il numero di provetta, l'etichetta o le ultime cifre del contrassegno: lo schema commuta istantaneamente al plateau pertinente e fa pulsare il pozzetto cercato.

---

## 2. Il flusso di consegna: «Ricevi» e «Metti qui»

> :material-video: **Guarda il micro-video**: [:octicons-arrow-right-24: La Regia riceve e riempie i plateau (circa un minuto)](../inizia-qui/video.md#video-5-la-regia-riceve-e-riempie-i-plateau)

Quando un veterinario si avvicina al tavolo e consegna il lotto di provette:

1. **Tocca «Ricevi (N)»**: accanto al nome del veterinario compare il pulsante verde con il numero esatto di campioni in attesa di consegna. Toccando «Ricevi», la Regia conferma la presa in carico formale dei campioni.
2. **I colori cambiano a video**: sullo schema del Plateau le provette consegnate passano istantaneamente da un colore pastello attenuato a un **colore pieno e brillante**, a testimonianza dell'avvenuta ricezione fisica.
3. **Segui l'elenco «Metti qui»**: in calce al pannello di destra compare l'elenco dettagliato delle provette appena ricevute con l'indicazione precisa:
   - Quale plateau ordinario prendere sul tavolo (es. *Plateau 1*), oppure l'indicazione del secchio per i fuori registro;
   - In quale pozzetto esatto infilare la provetta ordinaria (da 1 a 100, secondo il verso di riempimento stabilito).

---

## 3. Regole fisiche di posizionamento: dove va ogni provetta

### Il posto fisico immutabile (`PROVETTA_POSATA`)
Dopo la conferma della ricezione, l'app genera nel registro l'evento immutabile `PROVETTA_POSATA`.  
**Il posto fisico registrato non cambia mai più durante il campionamento aperto per nessun motivo**: né per l'aggiunta successiva di una nota, né per la correzione di una marca, né se in seguito viene scoperto un doppio prelievo. Se una provetta viene persa o annullata, la posa rimane nella storia. Non cambiare di nascosto il posto di altre provette per chiudere il buco.

### Provette ordinarie e provette da isolato non doppie

- **Provette ordinarie**: vanno direttamente nel pozzetto corrispondente al loro numero definitivo preassegnato nella serie ordinaria (es. provetta 47 va al pozzetto 47 del Plateau 1).
- **Provette prelevate da isolato senza duplicati (con il suffisso mostrato dall’app)**: vanno **subito nel pozzetto del loro numero naturale** (pozzetto 28 del Plateau 2) e non nel secchio dei fuori registro.  
  > *Regola operativa*: collocare subito al loro posto gli isolati che non risultano doppi azzera inutili spostamenti durante il riordino finale di fine seduta.

### Fuori registro: nel secchio dedicato
I campioni fuori registro (capi smarriti, rubati, fuori età, di altri stabilimenti, doppi confermati e animali senza contrassegno) seguono un flusso separato:

1. Non occupano pozzetti nei plateau ordinari: vanno riposti direttamente nel **secchio dedicato** (o vaschetta separata) sul tavolo da campo.
2. Le provette fuori registro non richiedono numerazione né posa ordinata durante il campionamento: a fine seduta nel Riordino verranno riprese una alla volta dalla provetta fisica per assegnare l'esito o riempire eventuali buchi.
3. Solo nei progetti creati prima del 7/11 i fuori registro si posavano ancora in **un solo plateau dei fuori registro** sul tavolo, nel primo pozzetto libero: quando è pieno, **toglilo dal tavolo** e aprine un altro. L'app riconosce da sola quale dei due modi vale per il progetto.

---

## 4. Cosa fare con i capi senza contrassegno

Se durante la profilassi vengono presentati animali che hanno perso entrambi i marchi auricolari o il bolo (lasciati tipicamente alla fine per non rallentare la corsia), si utilizza la funzione **«Senza contrassegno»** (disponibile sul palmare o sul tablet della Regia a campionamento aperto):

1. **Tocca «Senza contrassegno»**: non si cerca né si sceglie alcun animale in anagrafe durante il campionamento, per evitare con certezza prelievi doppi.
2. **Imposta i dati somatici**:
   - Specie e stabilimento di lavoro;
   - Sesso (Maschio o Femmina);
   - Classe di età stimata dalla dentizione (denti da latte, 2, 4, 6 denti, bocca piena, bocca consumata);
   - Razza stimata («Meticcio» vale per tutte);
   - Eventuale identificazione provvisoria libera (orecchino ASL, numero sulla schiena).
3. **Conferma e scritta sulla provetta**: l'app genera un codice provvisorio e indica la scritta da copiare sul tubo (numero provvisorio e dati somatici).
4. **Collocazione**: la provetta viene consegnata alla Regia e va nel secchio dei fuori registro.
5. **Gestione a fine lavori**: dopo la chiusura del campionamento, la Regia esamina i non prelevati compatibili con l'animale («Ha perso le marche») per attribuire il contrassegno corretto, oppure assegna una marca disponibile se l'animale non era mai stato registrato («Mai identificato»).

---

## 5. Cosa può andare storto

| Problema | Causa | Azione correttiva della Regia |
|---|---|---|
| **Il veterinario consegna provette ma a video risultano 0** | Il palmare ha lavorato isolato e non ha ancora sincronizzato i dati con la Wi-Fi. | Chiedi al veterinario di avvicinarsi al router finché l'icona di rete non diventa verde; non appena compaiono sul tablet, tocca «Ricevi». |
| **Il pozzetto fisico indicato da «Metti qui» è già occupato** | Una provetta precedente è stata infilata per errore nel foro sbagliato. | Tocca il pozzetto sullo schermo del tablet: leggi il contrassegno che dovrebbe trovarsi lì, rintraccia la provetta fuori posto nel plateau e correggi la collocazione fisica prima di posare il nuovo campione. |
| **Provetta fuori registro arrivata senza scritta completa** | Il veterinario non ha copiato tutto il codice dal riquadro rosso. | Prima di posare la provetta nel secchio dei fuori registro, scrivi immediatamente con il pennarello il contrassegno BDN completo e l'etichetta mostrata dall'app sul corpo della provetta. |
| **Provette cadute o rovinate durante il passaggio** | Incidente materiale al tavolo. | Se il campione è utilizzabile, asciugalo e riscrivi l'etichetta; se la provetta è rotta, seleziona la provetta su Fejalog e tocca «Annulla provetta». L'etichetta non verrà riutilizzata e il capo andrà riprelevato come fuori registro. |

---

## Pagine collegate

- [Attrezzatura da campo e calcolo materiale](attrezzatura-materiale.md)
- [Preparare il progetto e avviare la seduta](avvio.md)
- [Rete locale e gestione dispositivi](rete.md)
- [Controllo provette, problemi e statistiche](../dopo-il-campo/provette-statistiche.md)
