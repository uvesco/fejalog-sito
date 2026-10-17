# 15 · ARVET

**Obiettivo**: capire come gli snippet registrano i numeri in ARVET, senza scrivere niente coi dati del kit.

**Ti serve**: un PC con Chrome o Edge, lo zip di fine lavori della [lezione 14](14-fine-lavori.md).

!!! danger "Il kit non va nell'ARVET vero"
    I contrassegni del kit sono **inventati**. Lo snippet **scrive** in ARVET i capi che non sono nell'elenco del
    campionamento: incollato in un campionamento vero, ci aggiungerebbe capi inesistenti.

## Fai

1. Apri `snippet_arvet_888TO999_….html` dello zip, in Chrome sul PC. Per ogni invio (pecore, capre, maschi
   *Brucella ovis*) ci sono il numero di provette, «**Copia lo snippet**» e i capi che lo snippet aggiungerà.
2. Apri uno snippet `.txt` col blocco note. Dentro ci sono due elenchi:
    - `__ARVET_DATI__`: numero e contrassegno dei capi nell'elenco;
    - `__ARVET_NUOVI__`: numero, contrassegno, sesso, razza e nascita dei capi da aggiungere.
3. Leggi [ARVET e gli snippet](../arvet.md): come si usa con un progetto vero.

!!! atteso "Cosa devi vedere"
    - In ogni invio i numeri di provetta finali formano una **sequenza lineare continua da 1 a n** senza buchi.
    - Nell'invio delle pecore, `__ARVET_NUOVI__` ha i problematici, tranne i doppi di contrassegno: usciti, altro
      stabilimento, marche disponibili, capi in nessun registro.
    - Per i capi stimati in campo la razza è una descrizione di ARVET (BIELLESE…).
    - L'invio dei maschi ha gli **stessi numeri** delle pecore.

??? tip "Vedere lo snippet al lavoro senza scrivere niente"
    In una pagina di inserimento campioni di ARVET, nella console (F12 › Console) si scrive prima
    `window.__ARVET_PROVA__=true;` e poi si incolla lo snippet. Fa **Cerca** per ogni capo da aggiungere e prepara i
    campi, ma **non preme Conferma**: il resoconto dice che cosa avrebbe fatto. Coi contrassegni del kit, ARVET non
    conoscerà nessun capo.

## Fatto?

- [ ] snippet aperti e capiti
- [ ] letta la pagina [ARVET e gli snippet](../arvet.md)

Fine del tutorial. Per un progetto vero si rifanno gli stessi passi coi file della BDN dello stabilimento.
