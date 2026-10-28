# Panoramica: gli strumenti dopo il campo

> **A chi serve**: al responsabile della profilassi e a chi chiude la seduta al computer per ARVET e per l'allevatore · **Tempo di lettura**: 4 minuti

Quando il campionamento in campo è terminato e tutte le provette sono state consegnate al tavolo della Regia, si apre la fase di chiusura dei lavori.  
Gli strumenti web di Fejalog consentono di completare tutte le operazioni complesse direttamente sul computer dell'ufficio o dell'ASL: riconciliare i backup, esaminare le provette con filtri avanzati, risolvere le anomalie anagrafiche, guidare il riordino fisico dei plateau, generare il modello 2/33 finale e produrre gli snippet per l'inserimento automatizzato su ARVET.

---

## 1. Come funziona: sicurezza locale e ciclo a eventi chiusi

### Elaborazione al 100% nel tuo browser
Tutti gli strumenti funzionano interamente all'interno del tuo browser web (Google Chrome, Microsoft Edge o Mozilla Firefox) grazie al motore di dominio Fejalog compilato in Kotlin/JS:
- Il backup viene letto direttamente dal disco del tuo PC (o trasferito via cavo USB dal tablet);
- **Nessun dato viene inviato a server esterni**: né i contrassegni, né i codici fiscali, né i dati sanitari transitano mai su internet;
- Le azioni si conservano nel browser per quel backup, quando lo spazio locale è disponibile. Su un PC condiviso, esporta il lavoro e usa «Ricomincia da capo» per cancellare le azioni conservate; elimina anche i file scaricati quando non servono più. Non affidarti al solo browser come copia del lavoro.

### Il flusso di lavoro bidirezionale
Le azioni eseguite sul computer non sovrascrivono né alterano direttamente il registro degli eventi:

```
+--------------------+        Cavo USB o Zip       +--------------------+
|    TABLET REGIA    |---------------------------->|     SITO WEB       |
|  (Campionamento    |                             |  (Browser del PC)  |
|   chiuso)          |                             |                    |
|                    |                             | • Provette e filtri|
|                    |                             | • Non trovati / 5? |
|                    |                             | • Riordino plateau |
|                    |   fejalog-modifiche.json    | • 2/33 finale      |
|  Importa modifiche |<----------------------------| • Snippet ARVET    |
|  con anteprima     |                             +--------------------+
+--------------------+
```

1. **Esporta dal tablet**: la Regia chiude il campionamento e genera il file di backup `.zip` (oppure avvia il tethering USB, vedi [Regia su PC e tethering](../chi-dirige/tethering-pc.md));
2. **Lavora sul computer**: carichi il backup nello strumento [Fine lavori sul computer](fine-lavori.md) per verificare anomalie, attribuire provette mancanti e completare il riordino;
3. **Esporta per l'app**: il browser genera un file di azioni denominato `fejalog-modifiche.json`;
4. **Importa nella Regia**: il tablet riceve il file di modifiche, ne mostra l'anteprima, scarta eventuali azioni non più coerenti e **scrive esclusivamente eventi nuovi sul registro append-only**.

---

## 2. Registro e conferma sulla Regia

Il backup contiene la **chiave della seduta**: tienilo per te, non caricarlo su altri servizi e non mandarlo per posta insieme ai dati.

Il sito prepara azioni e mostra il loro effetto. Il registro ricevuto resta intatto: l'app aggiunge eventi nuovi solo dopo l'anteprima e la conferma della Regia (registro append-only). Le azioni non più coerenti vengono scartate; controlla l'esito dell'importazione e salva un nuovo backup. «Scarica backup e modifiche (zip)» allega le azioni al registro originale: non equivale ad averle importate nell'app.

Per le garanzie e i loro limiti leggi [Le cinque garanzie](../inizia-qui/cinque-garanzie.md).

## 3. Regola tassativa per le simulazioni su ARVET

Quando utilizzi gli strumenti per esercitazione, formazione o per testare il flusso con il gregge fittizio del [Kit di prova](../kit.md) (`888TO999`), rispetta la regola di sicurezza:

!!! warning "ARVET nelle prove"
    Con il kit fittizio `888TO999`, prima dello snippet digita nella console `window.__ARVET_PROVA__ = true;`. Non premere mai «Salva» o «Invia» su ARVET durante una prova.

---

## 4. Mappa degli strumenti di fine lavori

| Strumento | A cosa serve | Approfondimento |
|---|---|---|
| **Riconciliazione dei backup** | Verifica l'integrità del registro e unisce gli archivi di palmari che hanno lavorato isolati fuori rete. | [Guida alla riconciliazione](../dopo-il-campo/riconcilia-backup.md) |
| **Controllo provette e modifiche** | Ricerca avanzata campioni, correzione note e sesso, segnalazione orecchini e bolo da sostituire. | [Controllo provette e statistiche](../dopo-il-campo/provette-statistiche.md) |
| **Problemi da risolvere** | Trattamento massivo o puntuale delle casistiche anomale (marche disponibili, uscite, altri stabilimenti, DDA). | [Controllo provette e statistiche](../dopo-il-campo/provette-statistiche.md) |
| **Non trovati e registrazione tardiva** | Distinta dei capi non prelevati e algoritmo di confronto somiglianza (`5?`) per recuperare provette rovinate. | [Controllo provette e statistiche](../dopo-il-campo/provette-statistiche.md) |
| **Statistiche e rendiconto** | Quadratura capi vs provette, riepilogo anomalie e andamento dei prelievi per persona fisica. | [Controllo provette e statistiche](../dopo-il-campo/provette-statistiche.md) |
| **Riordino dei plateau** | Calcolo della sistemazione, chiusura buchi e guida con invio singolo o selezione per invii in gruppo al numero suggerito. | [Controllo provette e statistiche](../dopo-il-campo/provette-statistiche.md) |
| **Il modello 2/33 finale** | Modello 2/33 impaginato secondo lo standard ARVET con numeri di provetta definitivi e maschi in grigio. | [Il modello 2/33 finale](../dopo-il-campo/modello-233-finale.md) |
| **Snippet ARVET e uscite** | Codici JavaScript per i tre invii (pecore, capre, maschi *B. ovis*) e report e fogli di lavoro per l'allevatore. | [Gli snippet per ARVET](../dopo-il-campo/snippet-arvet.md) |

---

## Pagine collegate
- [Apri lo strumento interattivo: Fine lavori sul computer](fine-lavori.md)
- [Stampe pre-campo e calcolo materiale](prima-del-campo.md)
- [Regia su PC e tethering USB](../chi-dirige/tethering-pc.md)
- [Le cinque garanzie di Fejalog](../inizia-qui/cinque-garanzie.md)
