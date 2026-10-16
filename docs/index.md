# Fejalog

La parte da campo della famiglia SVET, accanto a [svet-tools](https://github.com/uvesco/svet-tools) per l'ufficio.

Fejalog è un'app Android per registrare **in campo** le provette della **profilassi della brucellosi ovicaprina**. Ci
lavorano insieme più device:

- **un tablet, la Regia**;
- **i telefoni dei veterinari, i palmari**.

Comunicano su una Wi-Fi locale, **anche senza internet**. L'app accompagna il lavoro fino agli **snippet per ARVET**
dei tre invii: pecore, capre e maschi *Brucella ovis*.

<div class="grid cards" markdown>

- **Provare subito**

    ---

    Il [tutorial col kit di prova](tutorial/index.md): un gregge inventato di 359 capi, da «prelevare» con le schede
    stampate, dal primo device fino ad ARVET.

- **Scaricare**

    ---

    L'[APK firmato](scarica.md), il kit di prova e le schede da stampare.

- **Usare in campo**

    ---

    Il [foglio per gli operatori](operatori.md) e la [guida di riferimento](riferimento/index.md), gli stessi testi
    dell'app.

- **Registrare in ARVET**

    ---

    Come funzionano gli [snippet](arvet.md), anche per i capi che non sono nell'elenco del campionamento.

</div>

## Che cosa fa

- **Numeri definitivi senza doppioni.** Ogni device prenota in anticipo i suoi numeri: due provette con lo stesso
  numero non esistono mai, e un numero mostrato non cambia più. Si lavora anche se la Regia si spegne.
- **Il capo giusto.** Si cerca con le ultime cifre del contrassegno sul tastierino a tasti grossi, oppure col lettore
  di microchip Bluetooth. Il foglio di conferma dice se il capo è uscito, di un altro stabilimento, ricercato o già
  prelevato da un collega (**doppio contrassegno**, controllato in tempo reale).
- **Niente si perde.** Ogni evento è salvato sul device prima di mostrare ✓ ed è replicato su tutti gli altri, e
  nessuna correzione cancella la storia. Il backup è uno zip unico.
- **A fine lavoro.** Fejalog calcola la sistemazione dei plateau e dà una guida a spunta per spostare le provette. Poi
  prepara gli snippet ARVET, le cose da fare per l'allevatore, i report e le anomalie.
- **I file della BDN.** I registri di stalla e i contrassegni disponibili si caricano direttamente sul tablet, anche a
  lavoro in corso (per esempio un acquisto con DDA).

## Che cosa serve

| | |
|---|---|
| Regia | un tablet Android **11 o più recente**, in orizzontale |
| Palmari | telefoni Android **11 o più recenti** (uno per veterinario) |
| Rete | una Wi-Fi comune anche **senza internet**: router da viaggio, Wi-Fi dell'allevamento o hotspot del tablet |
| Facoltativo | un lettore di microchip Bluetooth che scrive come una tastiera |
| ARVET | un PC con Chrome o Edge, per incollare gli snippet nella console |

!!! info "I dati restano sui device"
    Fejalog non manda niente su internet e non raccoglie statistiche d'uso. I dati del risanamento passano solo fra i
    device sulla Wi-Fi locale, e i backup vanno dove li salva chi li fa.

!!! warning "Esempi inventati"
    Tutti gli esempi di questo sito e del kit di prova sono **inventati**: stabilimento 888TO999 «AZ. AGR. ESEMPIO»,
    contrassegni IT066000000NNN. Non scrivere mai in una segnalazione pubblica dati veri (contrassegni, codici
    fiscali, codici di stabilimenti).
