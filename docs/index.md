# Fejalog

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

## Come funziona in sintesi

```mermaid
flowchart LR
    A["📂 1. BDN / Pacchetto<br/>Registri e contrassegni"] --> B["🏷️ 2. Regia (Tablet)<br/>Apre risanamento"]
    B --> C["📶 3. Wi-Fi locale<br/>Senza connessione internet"]
    C --> D["📱 4. Palmari (Cellulari)<br/>Inquadrano il QR"]
    D --> E["💉 5. Campionamento<br/>Ricerca o lettore microchip"]
    E --> F["📋 6. Riordino provette<br/>Guida a spunta dei plateau"]
    F --> G["💻 7. Fine lavori<br/>Snippet ARVET & CSV lineare"]
```

## Come muoversi nell'app

### I palmari: prelievo rapido sul campo

<div class="schermate" markdown>

<figure markdown="span">
  ![Campionamento con tastierino numerico](img/tutorial/06e_ricerca_capra.png)
  <figcaption>1. Ricerca con le ultime cifre sul tastierino a tasti grossi (o lettore Bluetooth)</figcaption>
</figure>

<figure markdown="span">
  ![Foglio di conferma e numero provetta](img/tutorial/06d_montone.png)
  <figcaption>2. Foglio di conferma con numero grande assegnato e stato transponder</figcaption>
</figure>

<figure markdown="span">
  ![Ultime provette registrate](img/tutorial/06f_ultime.png)
  <figcaption>3. Elenco ultime: modifica, persa, filtro annullate e salvataggio garantito</figcaption>
</figure>

</div>

### La Regia: coordinamento della seduta

<div class="schermate" markdown>

<figure markdown="span">
  ![Tabella registri BDN caricati](img/tutorial/02c_tabella.png)
  <figcaption>Apertura: caricamento registri BDN e assegnazione immediata dei numeri 1..N</figcaption>
</figure>

<figure markdown="span">
  ![QR code di rete per i colleghi](img/tutorial/04b_qr.png)
  <figcaption>Rete: QR code per collegare istantaneamente i palmari senza password a mano</figcaption>
</figure>

<figure markdown="span">
  ![Schema dei plateau e avanzamento](img/tutorial/10c_plateau.png)
  <figcaption>Monitoraggio: schema visivo dei plateau di provette e statistiche di prelievo</figcaption>
</figure>

<figure markdown="span">
  ![Guida a spunta per il riordino](img/tutorial/12a_guida.png)
  <figcaption>Riordino: guida a spunta passo-passo per la sistemazione finale delle provette</figcaption>
</figure>

</div>

## Che cosa fa

- **Catalogazione provette e accettazione al laboratorio.** Registra con precisione assoluta le provette di sangue
  prelevate in campo. Per il Piemonte prepara gli **snippet per ARVET** per i 3 invii (pecore, capre, maschi *Brucella ovis*);
  per l'uso fuori dal Piemonte genera per ogni invio un file **CSV lineare** nel formato `provetta,contrassegno`.
- **Numeri definitivi senza doppioni.** Ogni device prenota in anticipo i suoi numeri: due provette con lo stesso
  numero non esistono mai, e un numero mostrato non cambia più. Si lavora anche se la Regia si spegne.
- **Il capo giusto.** Si cerca con le ultime cifre del contrassegno sul tastierino a tasti grossi, oppure col lettore
  di microchip Bluetooth (es. Allflex AWR250 configurato in modalità tastiera HID). Il foglio di conferma dice se il capo
  è uscito, di un altro stabilimento, ricercato o già prelevato da un collega (**doppio contrassegno**, controllato in tempo reale).
  Per i capi problematici o non prenumerati, si raccomanda di scrivere sulla provetta anche il contrassegno.
- **Niente si perde e salvataggio protetto.** Ogni evento è salvato sul device prima di mostrare ✓ ed è replicato su tutti gli altri, e
  nessuna correzione cancella la storia. Il salvataggio del backup e delle uscite è ristretto a cartelle locali e provider
  cloud autorizzati (Google Drive, OneDrive, Dropbox, Nextcloud), escludendo categoricamente app di posta (Gmail) o app di intelligenza artificiale.
- **A fine lavoro.** Fejalog calcola la sistemazione dei plateau e dà una guida a spunta per spostare le provette. Poi
  prepara gli snippet ARVET, i file CSV per altri gestionali, le cose da fare per l'allevatore, i report e le anomalie.
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
