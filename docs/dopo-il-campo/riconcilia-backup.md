# Riconciliazione e verifica dei backup

> **A chi serve**: al responsabile della profilassi che deve verificare l'integrità del registro o riunire i backup di dispositivi che hanno lavorato isolati fuori rete · **Tempo di lettura**: 3 minuti

Il file di backup di Fejalog è la fonte di verità dell'intera seduta. Contiene la storia completa e immutabile di tutti gli eventi registrati da ogni dispositivo.  
Lo strumento di riconciliazione consente di verificare all'istante l'integrità del file o di unire in un unico archivio consolidato i backup provenienti da telefoni che hanno lavorato isolati senza copertura Wi-Fi.

---

## 1. Com'è fatto il backup di Fejalog

Il backup è un archivio compresso `.zip` nominato secondo uno standard preciso:
Il nome riporta stabilimento, data e ora, identità di chi salva e ruolo (Regia o palmare). Anche il nome del file può contenere il codice fiscale: trattalo insieme al contenuto come dato riservato.

All'interno dello zip sono racchiusi il pacchetto anagrafico BDN, l'intero registro degli eventi immutabili (file `registro/<device>.jsonl`), i metadati della seduta e i file di esportazione intermedi.

---

## 2. Cosa si fa: verifica di un singolo backup

Quando apri lo strumento [Fine lavori sul computer](../strumenti/fine-lavori.md) e carichi il backup della Regia:

1. **Verifica crittografica immediata**: la pagina controlla il pacchetto, gli hash e la continuità delle catene degli eventi e l'impronta del registro rispetto al manifesto. Non certifica la verità dei dati registrati in campo.
2. **Esito della validazione**:
   - Se il file è integro, visualizza l'impronta di controllo, il numero di provette registrate, la data e il nome del responsabile;
   - Se mancano eventi o la verifica non torna, leggi gli errori e recupera una copia integra. Non usare l'opzione per ignorare la verifica per chiudere una seduta.

---

## 3. Riconciliare più backup multi-device (Lavoro isolato)

Se durante la profilassi uno o più palmari sono rimasti isolati (ad esempio in una zona distante dello stabilimento o al pascolo montano privo di segnale Wi-Fi) e non hanno potuto allinearsi con la Regia prima dell'uscita dal campo:

L'unione elimina le copie dello stesso evento: 120 eventi su un dispositivo e 25 su un altro non significano necessariamente 145 eventi distinti. Vengono mantenute le registrazioni uniche di entrambi.

### Procedura di riconciliazione passo per passo
1. **Raccogli i file zip**: salva in una cartella del computer il backup prodotto dal tablet della Regia e i backup prodotti dai palmari che hanno lavorato isolati.
2. **Caricamento multiplo**: nella scheda *Carica e riconcilia* dello strumento web, usa il selettore di file per scegliere insieme tutti gli zip dello stesso progetto.
3. **Unione deterministica degli eventi**: il motore esamina tutti i registri caricati:
   - Ordina gli eventi secondo i clock logici di Lamport, i timestamp e gli identificatori univoci;
   - Unisce le storie dei diversi dispositivi senza scartare alcun prelievo;
   - Individua e segnala se gli stessi capi sono stati prelevati due volte durante il periodo di isolamento (doppi campionamenti);
4. **Scarica lo zip unito**: premi il pulsante **«Scarica backup riconciliato»**. Ottieni un unico archivio zip consolidato contenente l'intera storia della seduta, con impronta crittografica condivisa.

---

## 4. Cosa può andare storto

| Problema | Causa probabile | Soluzione operativa |
|---|---|---|
| **«I backup appartengono a progetti diversi»** | Uno dei file zip caricati appartiene a un altro stabilimento o a una seduta diversa. | Controlla la data e il codice di stabilimento nel nome del file; carica esclusivamente i backup dello stesso progetto di profilassi. |
| **Doppio campionamento rilevato dopo l'unione** | Due colleghi isolati hanno campionato lo stesso capo senza potersi consultare a video. | Normale conseguenza del lavoro fuori rete: il sistema preserva entrambi i prelievi; apri la scheda *Problemi da risolvere* ed esamina ogni campione e gli avvisi, senza cancellare eventi o riutilizzare etichette. |
| **File zip danneggiato o illeggibile** | Errore durante la copia o il trasferimento dal telefono al PC. | Ripeti l'esportazione del backup dal palmare interessato e trasferiscilo nuovamente sul PC. |

---

## Pagine collegate
- [Panoramica: gli strumenti dopo il campo](../strumenti/index.md)
- [Controllo provette, problemi e statistiche](provette-statistiche.md)
- [Le cinque garanzie di Fejalog](../inizia-qui/cinque-garanzie.md)
- [Fine lavori sul computer](../strumenti/fine-lavori.md)
