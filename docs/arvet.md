# ARVET e gli snippet

A fine lavoro Fejalog prepara uno **snippet** per ogni invio. È un testo da incollare nella console del browser, nella
pagina di ARVET dove si inseriscono i numeri dei campioni. Lo snippet **scrive i numeri** accanto ai contrassegni, e
**aggiunge** i capi che non sono nell'elenco del campionamento.

## I tre invii

| Invio | Che cosa | Provette |
|---|---|---|
| 1 · pecore | profilassi brucellosi ovicaprina, accettazione delle pecore | tutte le pecore, maschi compresi, col numero finale |
| 2 · capre | profilassi brucellosi ovicaprina, accettazione delle capre | tutte le capre |
| 3 · maschi *Brucella ovis* | «DIAGNOSI BRUCELLA OVIS ARIETI» | i montoni, con **gli stessi numeri** dell'invio delle pecore |

Con più stabilimenti nello stesso risanamento, la lettera sulla provetta (X12) dice quale accettazione è: in ARVET va
solo il numero (12).

## Come si usa

1. Su un PC, in ARVET: inserisci il **campionamento** e la **profilassi** dell'invio, poi apri la pagina di
   **inserimento dei numeri** di provetta.
2. Nello zip di fine lavori apri `snippet_arvet_….html` (o lo snippet `.txt` col blocco note) e **copia lo snippet**
   dell'invio giusto.
3. In ARVET premi **F12**, scheda **Console**: incolla e premi **Invio**. La prima volta Chrome chiede di scrivere
   «consenti incollare».
4. Leggi il **resoconto**, in alto a destra:
    - i numeri scritti;
    - i contrassegni non trovati;
    - i capi **aggiunti** in ARVET;
    - i capi da aggiungere **a mano**, col motivo.
5. Se ha aggiunto dei capi, premi **«Ricarica la pagina coi capi aggiunti»**. Poi **incolla di nuovo lo stesso
   snippet**: i capi aggiunti sono nell'elenco, e il resoconto controlla che tutti abbiano il numero giusto.
6. Controlla e **salva** in ARVET: lo snippet non conferma il campionamento.

## I capi che non sono nell'elenco

Sono i problematici della sistemazione: usciti, altro stabilimento, marche disponibili, capi in nessun registro. Per
ognuno lo snippet fa quello che farebbe l'operatore con **«Inserisci capo»**:

1. **Cerca** il contrassegno;
2. se ARVET conosce il capo (lui o la BDN), tiene i **suoi** sesso, razza e nascita;
3. se non lo conosce, scrive quelli **stimati in campo**: la razza è una di quelle della tendina di ARVET, scelta in
   Fejalog;
4. scrive il **numero** e preme **Conferma**: il capo è scritto in ARVET.

Quelli che non riesce ad aggiungere li elenca col motivo:

- una razza che ARVET non ha;
- una data impossibile;
- un contrassegno che ARVET rifiuta.

Restano sempre **a mano** i **doppi di contrassegno**, perché il capo è già nell'elenco con l'altra provetta: decide
l'operatore.

!!! tip "Provare senza scrivere niente"
    Scrivendo nella console `window.__ARVET_PROVA__=true;` prima di incollare lo snippet, lo snippet fa Cerca e
    prepara i campi ma **non preme Conferma**.

!!! danger "Il kit non va nell'ARVET vero"
    Gli snippet fatti col [kit di prova](kit.md) hanno contrassegni inventati: incollati in un campionamento vero, ci
    aggiungerebbero capi inesistenti. Con il kit, al massimo la prova qui sopra.

## Domande

**Quante provette regge uno snippet?** Anche 5000–7000 in un invio: circa 24 caratteri per provetta, e la console li
incolla senza problemi.

**Si può rifare?** Sì: lo snippet scrive solo i numeri che mancano o sono diversi, e non aggiunge due volte lo stesso
capo.

