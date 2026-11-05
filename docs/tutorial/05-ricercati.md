# 5 · I ricercati

**Obiettivo**: i capi ricercati si riconoscono già nella ricerca, su tutti i device.

**Ti serve**: il tablet della Regia, `ricercati_cinque_stabilimenti.csv`.

Un **capo ricercato** è un animale per cui vuoi mostrare una segnalazione quando viene incontrato: per esempio marcarlo, isolarlo o controllare un’anomalia. Non è l’elenco dei capi mancanti al campionamento e il motivo può essere indipendente dalla profilassi.

## Aggiungi un capo durante il lavoro

Dalla Regia apri **Configurazione › 3. Dati input** (sezione Capi ricercati › Aggiungi capo). Cerca nei registri e nei contrassegni con le ultime cifre, oppure scrivi a mano il codice completo. Indica il motivo e l’azione richiesta, poi salva. Attendi l’allineamento dei palmari: quelli scollegati riceveranno la segnalazione quando rientrano.

## Importa un elenco

1. In **Configurazione › 3. Dati input** (sezione Capi ricercati) tocca Importa CSV: carica `ricercati_cinque_stabilimenti.csv`. Se hai creato il progetto
   dal pacchetto, ci sono già.
2. Il CSV ha cinque capi, uno per stabilimento di lavoro (`codice;nota;azione;segno`):

| Codice | Nota | Azione |
|---|---|---|
| IT066000010545 | Prova: ricercato da marcare (principale) | marca: croce rossa sulla testa |
| IT066000011284 | Prova: ricercato da isolare (X) | isola:  |
| 380066000011363 | Prova: ricercato per codice elettronico (montone di Y) | marca: punto blu sul dorso |
| IT066000011445 | Prova: ricercato da marcare (W) | marca: croce rossa |
| IT066000011519 | Prova: ricercato da isolare (V) | isola:  |

<div class="schermate" markdown>

<figure markdown="span">
  ![I ricercati caricati](../img/tutorial/05a_ricercati.png)
  <figcaption>I ricercati caricati</figcaption>
</figure>

<figure markdown="span">
  ![005 nella ricerca, in viola](../img/tutorial/05b_ricercato.png)
  <figcaption>Esempio di ricercato in viola; immagine del kit storico.</figcaption>
</figure>

<figure markdown="span">
  ![Il foglio di conferma: cosa fare](../img/tutorial/06c_conferma.png)
  <figcaption>Il foglio di conferma: cosa fare</figcaption>
</figure>

</div>

!!! atteso "Cosa devi vedere"
    Su un palmare, nel Campionamento, digita **0545**: il capo compare **in viola**, con la nota e cosa fare, e il
    telefono vibra. Sulle schede, i ricercati hanno il bordo viola. Il montone IT066000011363 si riconosce anche dal codice
    elettronico (`380…` e `IT…` con le stesse 12 cifre sono lo stesso capo).

!!! info "Elenco arrivato tardi"
    Se un capo ricercato era già stato prelevato prima che arrivasse l'elenco, chi l'ha prelevato (e la Regia) riceve
    una finestra che resta fino a «Visto».

## Fatto?

- [ ] ricercati caricati, banner viola su 0545
