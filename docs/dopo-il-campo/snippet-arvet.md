# Gli snippet per ARVET e le uscite di fine lavori

> **A chi serve**: a chi chiude la seduta sul computer e prepara gli invii ARVET e i report per l'allevatore · **Tempo di lettura**: 3 minuti

Fejalog prepara un testo da incollare nella console del browser, nella pagina ARVET dell'invio corretto. Controlla i risultati contro le provette fisiche prima di completare il lavoro.

!!! warning "Prima di ogni prova"
    Con il kit fittizio `888TO999`, digita `window.__ARVET_PROVA__=true;` nella console prima dello snippet. Non salvare mai su ARVET durante le prove. Dopo una ricarica della pagina, imposta di nuovo la variabile prima di rieseguire lo snippet.

## I tre invii

1. **Pecore, maschi compresi**: accettazione per la profilassi brucellosi ovicaprina.
2. **Capre**: accettazione per la profilassi brucellosi ovicaprina.
3. **Maschi ovini, Brucella ovis**: seconda accettazione sulle stesse provette dei montoni, con gli stessi numeri dell'invio pecore.

Nello zip di fine lavori trovi gli snippet `.txt` e la pagina `snippet_arvet_….html`. I nomi dei testi iniziano con `snippet_arvet_pecore`, `snippet_arvet_capre` e `snippet_arvet_maschi_brucella_ovis`. Gli invii senza campioni possono non avere uno snippet.

## Cosa si fa

1. Completa le verifiche e il Riordino in Fejalog. Se hai lavorato sul sito, [riporta le azioni alla Regia](../strumenti/index.md) e controlla l'esito.
2. Apri in ARVET il campionamento e la profilassi dell'invio corretto. Non usare lo snippet di una specie nella pagina dell'altra.
3. Apri la pagina HTML degli snippet e copia quello dell'invio, oppure apri il corrispondente `.txt` con un editor di testo e copialo tutto.
4. In Chrome premi **F12**, scegli **Console**, incolla lo snippet e premi Invio. Nelle prove imposta prima la variabile indicata sopra.
5. Leggi il resoconto: lo snippet compila i numeri e tratta gli eventuali capi da aggiungere. Segui le richieste che mostra; i casi non risolti richiedono il tuo controllo.
6. Se sono stati aggiunti capi, usa «Ricarica la pagina coi capi aggiunti» e incolla di nuovo lo stesso snippet. Nelle prove reimposta prima la variabile.
7. Solo per il lavoro effettivo, dopo i controlli, completa il salvataggio su ARVET. Lo snippet non conferma il campionamento.

Per i dettagli dei capi fuori elenco e delle operazioni manuali leggi [ARVET e gli snippet](../arvet.md).

## Uscite e report per l'allevatore

Dalla scheda **Uscite** del sito scarichi i singoli file o **«Scarica tutto (zip)»**:

- snippet e fogli di lavoro ARVET;
- report per l'allevatore, con orecchini o bolo da sostituire e altre cose da fare;
- elenchi dei campioni senza transponder e dei capi ricercati;
- guida fisica del Riordino, in HTML e foglio di lavoro.

Il [2/33 finale](modello-233-finale.md) si genera e scarica separatamente. Per conservare registro e azioni del sito usa anche **«Scarica backup e modifiche (zip)»**: le modifiche allegate devono ancora essere importate sulla Regia.

## Cosa può andare storto

| Problema | Cosa fare |
|---|---|
| Nessun capo trovato | Controlla pagina e invio ARVET, poi leggi il resoconto. |
| Capo non inserito o dati non accettati | Verifica i dati e le istruzioni del resoconto; completa a mano quanto richiesto. |
| Incolla bloccato dal browser | Leggi l'avviso di Chrome e verifica che il testo provenga dai tuoi file Fejalog prima di seguire le istruzioni del browser. |
| Il risultato non corrisponde ai plateau | Fermati e confronta numeri finali, specie e stabilimento prima di salvare. |

## Pagine collegate

- [Panoramica dopo il campo](../strumenti/index.md)
- [Controllo provette, problemi e statistiche](provette-statistiche.md)
- [Il kit di prova](../kit.md)
