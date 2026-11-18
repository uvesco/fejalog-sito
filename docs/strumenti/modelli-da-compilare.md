# Modelli da compilare a mano (se uno snippet della BDN non funziona)

> **A chi serve**: chi prepara l'intervento o sistema le provette · **Tempo di lettura**: 2 minuti

Gli snippet leggono le pagine della BDN: se la BDN cambia, uno snippet può smettere di funzionare proprio il giorno in cui
serve. Per non fermarsi, gli stessi dati si possono **copiare a mano dalla BDN** in un foglio di calcolo e caricare in
Fejalog **al posto del file dello snippet**, negli stessi campi.

| Dati | Modello da compilare | Dove si carica |
|---|---|---|
| **Uscite per modello degli ultimi 7 giorni** (capi usciti con un documento di accompagnamento: la BDN aggiorna il registro fino a 7 giorni dopo) | [xlsx](modelli/fejalog_uscite_modello_da_compilare.xlsx) · [csv](modelli/fejalog_uscite_modello_da_compilare.csv) | [Crea il progetto](crea-progetto.md) (prima del campo) e [Fine lavori sul computer](fine-lavori.md) › Carica |
| **Verifica dei contrassegni fuori registro** (capi e marche cercati uno a uno in BDN) | [xlsx](modelli/fejalog_verifica_bdn_da_compilare.xlsx) · [csv](modelli/fejalog_verifica_bdn_da_compilare.csv) | [Fine lavori sul computer](fine-lavori.md) › Carica |

Come si compilano:

- una riga per capo; le intestazioni non si cambiano; le righe che cominciano con **ESEMPIO** non vengono lette;
- le celle sono di tipo testo: le date si scrivono `gg/mm/aaaa`, i contrassegni come in BDN;
- il secondo foglio («istruzioni») dice, colonna per colonna, che cosa scrivere e in quale pagina della BDN si trova;
- se una riga è incompleta Fejalog non carica niente e dice quale riga correggere.

**Uscite per modello** — nella BDN: Movimentazioni › Ricerca modelli › *Origine*, il codice dell'allevamento, tutte le
destinazioni; poi, per ogni modello dell'ultima settimana (anche verso il pascolo, esclusi quelli rifiutati o non ancora
autorizzati), i capi del dettaglio. Colonne: `stabilimento`, `specie` (pecore o capre), `contrassegno`, `data` (la
partenza), `tipo` (macello, vendita, altro), `modello` e `destinazione` (facoltativi).

**Verifica dei contrassegni** — nella BDN: Dati › Interrogazioni › Capi e › Identificativi. Colonne: `contrassegno`,
`trovato` (capo, marca o no) e, per un capo, `specie`, `sesso`, `razza`, `nascita`, `stato` (VIVO, MACELLATO, VENDUTO…),
`stabilimento`; per una marca mai applicata `marca_stato` (USABILE) e `marca_allevamento`.

Niente va su internet: il file si legge nel browser, come gli altri.
