# Attrezzatura da campo e calcolo del materiale

> **A chi serve**: al responsabile della Regia che calcola provette, aghi e plateau e allestisce la postazione operativa · **Tempo di lettura**: 4 minuti

La postazione della Regia è il punto in cui confluiscono tutte le provette prelevate. Per garantire un flusso fluido e ordinato senza blocchi durante il campionamento, è fondamentale calcolare con precisione il fabbisogno di materiale prima di partire e organizzare lo spazio fisico sul tavolo da campo.

---

## 1. Cosa serve: l'elenco del materiale

Per una seduta di profilassi tipo con più veterinari prelevatori occorrono:

- **Tavolo da campo pieghevole**: robusto e stabile, con piano dimensionato usando il calcolo del materiale e le misure inserite.
- **Plateau da 100 pozzetti**: rack standard a nido d'ape da 10 × 10 pozzetti, dimensioni fisiche **18 × 15 cm** (con il lato lungo da 18 cm parallelo alle righe).
- **Provette sottovuoto (Vacutainer)**: non scritte, calcolate con margine e scorta.
- **Aghi monouso sottovuoto**: pari o superiori al numero totale di provette previste.
- **Pennarelli indelebili**: a punta fine (0.8–1.0 mm), colore nero, ad asciugatura rapida, resistenti a umidità, grasso e basse temperature. Portane sempre almeno 4 o 5 di scorta.
- **Supporto per il tablet**: custodia con piedistallo o leggio inclinabile da banco.
- **Alimentazione ausiliaria**: power bank da 10.000–20.000 mAh e cavi di ricarica.
- **Stampe cartacee pre-campo**: prodotte con lo strumento [Prima del campo](../strumenti/prima-del-campo.md):
  - Il foglio generico 1–100 nel verso di riempimento scelto;
  - Il foglio A4 con il QR Wi-Fi per la connessione rapida dei palmari;
  - Il modello 2/33 precompilato e il foglio A3 orizzontale provette/contrassegni per il confronto e la firma dell'allevatore.

---

## 2. Come si calcola il materiale

Il calcolo esatto del fabbisogno si effettua direttamente in Fejalog (*Configurazione › Stampe prima del campo › Materiale*) oppure nello strumento on line [Prima del campo](../strumenti/prima-del-campo.md), partendo dai capi registrati in BDN in età diagnostica.

### Che cosa conta il calcolo
- **Plateau ordinari**: per ogni serie serve spazio fino al massimo numero assegnato, anche se ci sono buchi. Si arrotonda al centinaio successivo: con il solo numero 101 servono comunque due plateau.
- **Problematici**: nei progetti nuovi, un solo plateau problematici in uso sul tavolo e la scorta indicata dal calcolo fuori tavolo.
- **Provette**: numero di capi numerati, più margine e scorta scelti dalla Regia (inizialmente 10% e 5%). Ciascuna percentuale si arrotonda separatamente all'intero superiore: con un capo e i valori iniziali il totale è tre provette.
- **Pennarelli**: il riepilogo ne conta uno per veterinario; prepara anche quelli di riserva che ritieni necessari.

Il calcolo non determina aghi o altro materiale sanitario: predisponili secondo la procedura di lavoro della squadra. Lo schema propone la disposizione dei plateau e verifica la larghezza del tavolo inserita dalla Regia; non esiste una misura di tavolo valida per ogni seduta.

### Le stampe: che cosa producono e come stamparle

| Stampa | Ingresso e risultato | Formato |
|---|---|---|
| **2/33 precompilato** | File `.htm` di ARVET: stessi capi e ordine, numeri assegnati nella colonna Provetta, maschi ovini in grigio. Controlla gli avvisi per capi mancanti o righe bianche insufficienti. | Mantieni l'impaginazione del modello. |
| **Provetta / Contrassegno** | Numerazione del progetto in ordine di provetta, per stabilimento e specie. | A3 orizzontale. |
| **Riempimento 1–100** | Foglio generico nel verso scelto, disponibile anche senza dati sul sito. | A4, stampa la variante corretta. |
| **QR Wi-Fi** | Inserisci SSID e password; collega solo alla Wi-Fi. La chiave della seduta non va mai su carta. | A4. |
| **Materiale e tavolo** | Quantità e disposizione calcolate dalle misure inserite. | Controlla l'anteprima di stampa. |

Nell'app, «Genera» salva in `uscite/prima_del_campo` e apre la stampa Android, anche «Salva come PDF». Sul sito carica il backup o `numerazione_chiave.csv`, poi i 2/33 per precompilarli; apri la stampa del browser. Il CSV contiene solo i numerati: le righe senza numero richiedono il controllo del registro BDN.

La scansione del QR Wi-Fi e le stampe su carta effettive non sono ancora state provate sui dispositivi fisici.

---

## 3. Come si allestisce il tavolo da campo

La disposizione fisica sul tavolo deve rispecchiare fedelmente lo schema logico dell'app per azzerare gli errori di inserimento delle provette nei pozzetti.

```
+-----------------------------------------------------------------------+
|                              TAVOLO DA CAMPO                          |
|                                                                       |
|  [FOGLIO QR WI-FI]    [FOGLIO GENERICO 1-100]    [STAMPE 2/33 E A3]  |
|                                                                       |
|  +-----------------+   +---------------------+   +-----------------+  |
|  | PLATEAU ORD. 1  |   |    TABLET REGIA     |   | PLATEAU PROBL.  |  |
|  | (Serie Pecore)  |   |  (Due pannelli:     |   | (Unico in uso   |  |
|  |                 |   |   Ricevi | Plateau) |   |  sul tavolo)    |  |
|  +-----------------+   +---------------------+   +-----------------+  |
|                                                                       |
|  [SCATOLA PROVETTE NON SCRITTE]              [PENNARELLI INDELEBILI]  |
+-----------------------------------------------------------------------+
|  SOTTO IL TAVOLO: Scatole di scorta, plateau vuoti, power bank        |
+-----------------------------------------------------------------------+
```

### Regole per il tavolo operativo
1. **Posizione riparata**: posiziona il tavolo vicino all'uscita della corsia o dei recinti di prelievo, ma al riparo da polvere, correnti d'aria e pioggia.
2. **Il tablet al centro**: mantieni il tablet orientato verso di te, con il pannello sinistro («Ricevi») e il pannello destro («Plateau / Metti qui») ben visibili contemporaneamente.
3. **Separazione netta dei plateau**:
   - A sinistra o davanti a te: i plateau della serie ordinaria attiva;
   - A destra (o separato visivamente): l'**unico plateau problematici in uso**;
   - **Toglilo dal tavolo**: quando il plateau dei problematici raggiunge i 100 pozzetti, l'app mostra un promemoria (*«Plateau problematici N pieno: toglilo dal tavolo»*). Mettilo da parte, contrassegnalo con un'etichetta (es. «Problematici 1») e posiziona sul tavolo un nuovo plateau vuoto.
4. **Il foglio generico 1–100**: fissalo sul tavolo accanto ai plateau con nastro adesivo da carrozziere. Serve a ricordare a chiunque riponga provette l'ordine corretto di riempimento: **file per file, mai a serpente**.

---

## 4. Cosa può andare storto

| Problema | Causa | Azione della Regia |
|---|---|---|
| **Provette non scritte esaurite a metà lavoro** | Alto numero di capi non in elenco o errori di prelievo superiori al margine. | Attingi immediatamente alla scorta prudenziale (5%); se insufficiente, fai convergere le provette disponibili sui capi con priorità diagnostica. |
| **Pennarello che non scrive sulla plastica bagnata** | Condensa o sangue sulla provetta; pennarello non adatto. | Asciuga la provetta con carta assorbente prima di scrivere; usa pennarelli indelebili ad asciugatura istantanea dedicati. |
| **Plateau problematici confuso con l'ordinario** | Mancata separazione sul tavolo da campo. | Applica una striscia di nastro colorato o scrivi chiaramente «PROBL» sul bordo del plateau problematici. Rispetta la regola: un solo plateau problematici sul tavolo alla volta. |
| **Pozzetto fisico già occupato da un'altra provetta** | Errore manuale di inserimento o riempimento non conforme allo schema dell'app. | Controlla immediatamente il riquadro «Metti qui» e la vista Plateau della Regia. Se necessario, verifica il numero della provetta presente e controlla il posto registrato prima di posare altri campioni. |

---

## Pagine collegate
- [Requisiti hardware e software per la Regia](requisiti.md)
- [Stampe pre-campo e calcolo materiale](../strumenti/prima-del-campo.md)
- [Consegne delle provette e gestione dei plateau](consegne-plateau.md)
- [Checklist del responsabile della Regia](../checklist-responsabile.md)
