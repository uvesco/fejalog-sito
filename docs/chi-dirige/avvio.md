# Preparare il progetto e avviare la seduta

> **A chi serve**: al responsabile della Regia che crea il progetto, importa l'anagrafe BDN e fissa le regole di profilassi · **Tempo di lettura**: 4 minuti

La preparazione del progetto sulla Regia trasforma i dati anagrafici ufficiali scaricati dalla BDN nel piano operativo di campionamento. Tutte le scelte fondamentali — come identificare le specie, quali lettere attribuire agli stabilimenti e in quale verso riempire i plateau fisici — si decidono qui, prima di aprire il campionamento.

---

## 1. Cosa serve prima di iniziare

- Il tablet della Regia carico al 100% e pronto con Fejalog installata (vedi [Requisiti](requisiti.md));
- I file scaricati dall'anagrafe zootecnica BDN per lo stabilimento o gli stabilimenti di lavoro:
  - Registro delle pecore presenti (file di testo o zip);
  - Registro delle capre presenti (se presenti nello stabilimento);
  - Registro dei contrassegni disponibili (marche non ancora applicate);
- L'elenco della squadra: nomi e codici fiscali dei veterinari prelevatori;
- L'eventuale elenco dei capi ricercati (capi da rintracciare, isolare, marcare o verificare con urgenza).

---

## 2. Cosa si fa: i passi di preparazione

Apri Fejalog sul tablet e tocca **«Nuovo progetto»** (oppure apri un pacchetto già preparato da *Progetto › Apri da un file*).

### Passo 1: Registri BDN e anagrafica
In *Dati › Registri BDN e contrassegni*, tocca «Scegli i file» e carica i file BDN. L'app li riconosce automaticamente e compila la matrice:
- Righe: gli stabilimenti di lavoro (es. `888TO999`);
- Colonne: pecore presenti, capre presenti, marche disponibili per specie;
- Verifica che il conteggio dei presenti corrisponda al conteggio dello stabilimento aggiornato.

### Passo 2: Età diagnostica
Imposta l'età minima per la profilassi (tipicamente 6 o 12 mesi a seconda del piano sanitario vigente). L'app separa istantaneamente i capi in età diagnostica (che riceveranno un numero di provetta) dai capi sotto età (che, se campionati per errore, verranno trattati come problematici).

### Passo 3: Lettere di specie (Regola vincolante)
Se il progetto comprende **sia pecore che capre**, si applica una regola di sicurezza tassativa:
- **Almeno una delle due specie deve obbligatoriamente avere la lettera di specie** (`P` per pecore, `C` per capre), assegnata di norma alla specie meno numerosa;
- L'opzione «Nessuna» è **categoricamente disabilitata** dall'interfaccia quando sono presenti entrambe le specie. In questo modo una pecora e una capra non potranno mai avere la stessa etichetta omonima sulla provetta (vedi [Le cinque garanzie](../inizia-qui/cinque-garanzie.md)).

### Passo 4: Stabilimenti di lavoro
Distingui lo stabilimento principale dagli eventuali secondari che partecipano allo stesso intervento. Controlla le lettere proposte per distinguere le serie. Il solo caricamento di un registro non aggiunge uno stabilimento al campionamento.

### Passo 5: Verso di riempimento dei plateau
La Regia stabilisce come verranno riempiti fisicamente i rack da 100 pozzetti sul tavolo:
- **Dall'alto verso il basso** (*predefinito*): il pozzetto 1 si trova in alto a sinistra;
- **Dal basso verso l'alto**: il pozzetto 1 si trova in basso a sinistra.  
Entrambi i versi seguono rigorosamente la numerazione ordinata riga per riga (mai a serpente).

### Passo 6: Problematici in sequenza unica
Nei progetti nuovi, i campioni problematici, i doppi prelievi e i capi fuori registro confluiscono in un'**unica sequenza progressiva per tutto il progetto**, indipendentemente da stabilimento e specie. Sul tavolo della Regia è presente un solo plateau problematici alla volta; quando raggiunge 100 provette, viene archiviato e sostituito dal successivo.

### Passo 7: Capi ricercati e regole di fine lavoro
- In *Dati › Capi ricercati*, inserisci eventuali animali segnalati con il motivo e l'azione da compiere (compariranno evidenziati in viola sui telefoni con vibrazione dedicata);
- In *Preparazione › Modalità e regole*, definisci come trattare a fine lavoro le varie tipologie di anomalie (es. «Tutte in coda» per inviarle in coda su ARVET tramite snippet, oppure «Elimina tutte» per quelle da escludere definitivamente).

---

## 3. Cosa si congela categoricamente all'avvio

Quando la Regia preme **«Avvia campionamento»**, il sistema genera lo stato iniziale e blocca i parametri strutturali:

| Parametro | Stato dopo l'avvio | Motivo del congelamento |
|---|---|---|
| **Verso di riempimento** | **CONGELATO** | La numerazione 1–100 sui plateau fisici deve coincidere perfettamente con gli schemi a video di tutta la squadra. |
| **Lettere di specie** | **CONGELATE** | Impedisce che etichette già scritte con il pennarello cambino significato a metà lavoro. |
| **Lettere di stabilimento** | **CONGELATE** | Garantisce la tracciabilità univoca dei lotti tra allevamenti diversi. |
| **Stabilimento principale** | **CONGELATO** | I secondari restano aggiungibili in corsa, senza togliere quelli già presenti. |
| **Sequenza problematici** | **CONGELATA** | I pozzetti dei problematici vengono assegnati in ordine di arrivo alla consegna. |
| **Numeri preassegnati** | **CONGELATI** | I numeri già assegnati restano riservati; i numeri finali si calcolano nel Riordino. |

L'età diagnostica può essere cambiata dalla Regia anche durante il campionamento, con doppia conferma. I numeri già assegnati non vengono ricalcolati da zero. Registri e regole per i problematici restano aggiornabili dalle funzioni dedicate.

I progetti precedenti senza le nuove impostazioni conservano il verso dal basso verso l'alto e la disposizione precedente dei problematici. Non adottano automaticamente le scelte dei progetti nuovi.

---

## 4. Cosa può andare storto

| Errore comune | Conseguenza | Come risolvere |
|---|---|---|
| **Avviato con verso sbagliato** | Il verso è già bloccato. | Mantieni il verso mostrato dall'app e stampa il foglio corrispondente. Non ripartire da un backup precedente all'avvio della seduta. |
| **Manca un registro** | I capi non vengono riconosciuti correttamente. | La Regia carica il file mancante e controlla l'anteprima prima di confermare. Verifica poi l'allineamento dei palmari. |

---

## Pagine collegate
- [Rete locale e gestione dispositivi](rete.md)
- [Consegne delle provette e gestione dei plateau](consegne-plateau.md)
- [Stampe pre-campo e calcolo materiale](../strumenti/prima-del-campo.md)
- [Le cinque garanzie di Fejalog](../inizia-qui/cinque-garanzie.md)
