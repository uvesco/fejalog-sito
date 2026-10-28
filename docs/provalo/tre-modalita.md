# Tre modalità di simulazione: quale scegliere

> **A chi serve**: a chi prova Fejalog prima del campo, da solo o con i colleghi.  
> **Tempo di lettura**: 6 minuti.

Tutte le prove usano i [kit fittizi `888TO999`](../kit.md). Le durate sono indicative: prepara i file e installa l'app prima di iniziare.

| Modalità | Tempo | Occorrente | Cosa provi |
|---|---|---|---|
| **Modo A · Solo browser** | 15–25 min | Computer con browser | Numerazione, simulatore del riempimento, problemi, tardive, Riordino, file finali e 2/33. |
| **Modo B · Telefoni veri** | 60 min | Regia e uno o due palmari Android, Wi-Fi locale, schede | Prelievi e cinque incidenti programmati. |
| **Modo C · Emulatori Android** | 30–45 min dopo l'installazione degli strumenti | Computer con Android SDK e due AVD | Percorso dell'app e immagini per la formazione. |

## Modo A: Prova guidata solo nel browser

### 1. Prepara i file

Scarica ed estrai [il kit a cinque stabilimenti, dati](kit/kit_cinque_stabilimenti_dati.zip).
Usa il suo **`backup_esempio_cinque_stabilimenti.zip`** e conserva la cartella **`2-33/ingresso/`** per il passo 7.
Il backup contiene pochi campioni già registrati e posati, una problematica e il campionamento chiuso: non serve campionare tutti i capi.

Per una prova più piccola puoi usare il [backup singolo](kit/backup_esempio_888TO999.zip), derivato dal kit originale. I 2/33 del kit a cinque stabilimenti appartengono a un altro elenco di capi: usa il backup a cinque stabilimenti per il passo 7.

### 2. Carica il backup e controlla la numerazione

Apri [Fine lavori sul computer](../strumenti/fine-lavori.md), scheda **Carica**, e scegli il backup dal selettore **File di backup**. Scrivi un nome fittizio per firmare le azioni.
Controlla «Registro intatto», poi apri **Provette**: confronta etichetta, contrassegno, specie e stabilimento con le schede del kit. Il progetto di esempio ha la lettera `C` sulle capre e numeri ovini assegnati ai maschi prima delle femmine.

Il sito lavora sul computer e conserva le azioni nel browser. Il registro del backup di ingresso resta intatto. Per ripartire usa **Ricomincia da capo**; per conservare il lavoro scarica i file prima di cancellare i dati del browser.

### 3. Rivedi il riempimento nei due versi

Apri **Plateau**. Il cursore **Passo** e i pulsanti avanti/indietro ripercorrono registrazioni e pose. Arriva all'ultimo passo, scegli una serie e tocca un pozzetto occupato per vedere la sua provetta.

Il simulatore usa il verso salvato nel progetto: **non si cambia dopo l'avvio**. Per confrontare i due versi apri [Stampe pre-campo](../strumenti/prima-del-campo.md), anche senza caricare dati, e apri i due fogli generici **1–100 alto→basso e basso→alto**. Il pozzetto 1 cambia lato; le file restano da sinistra a destra, senza serpente. È un confronto delle stampe, non una modifica al backup chiuso.

### 4. Risolvi un problema

In **Problemi**, individua il capo uscito per smarrimento e scegli una soluzione fra quelle ammesse; per questa prova puoi escluderlo. Controlla l'effetto sui conteggi e sul Riordino. Le azioni restano modifiche separate, da riportare nell'app con **Esporta per l'app** se stai lavorando anche sui telefoni.

### 5. Prova una registrazione tardiva

In **Non trovati**, scegli un capo non prelevato e usa **Attribuisci**. Inserisci l'etichetta che simuli di trovare sulla provetta, una nota su come hai riconosciuto il capo e premi **Registra**. Puoi copiare l'etichetta assegnata al candidato, purché non sia già usata. Il capo esce dai non prelevati; la nuova riga compare fra le tardive.

### 6. Riordina e scarica i file

Apri **Riordino** e scegli **Chiudi i buchi** prima della prima spunta. Leggi etichetta e posto di partenza, poi il numero finale e la destinazione; nella prova spunta il passo dopo averlo eseguito sul tuo schema cartaceo. Dal primo passo il campionamento non è più riapribile.

In **Uscite**, premi **Scarica tutto (zip)**. Apri report, guida fisica e snippet. Il 2/33 finale si produce separatamente al passo successivo.

### 7. Produci il 2/33 finale

In **Uscite**, riquadro **2/33 finale di ARVET (numeri definitivi)**, usa **Carica file 2/33 (.htm)** e scegli i modelli fittizi di `2-33/ingresso/` estratti al passo 1. Leggi gli avvisi e scarica gli HTML prodotti. Aprili e verifica: numero definitivo per i prelevati inclusi, casella vuota per i non prelevati, maschi ovini grigi. Stampa dal browser o salva in PDF; se cambi azioni, rigenera il documento. [Dettagli del 2/33 finale](../dopo-il-campo/modello-233-finale.md).

### 8. Esamina gli snippet ARVET

Apri il riepilogo HTML e i testi degli snippet scaricati: controlla specie, contrassegni e numeri finali. Puoi fermare qui la prova senza accesso ad ARVET.

Per una dimostrazione con accesso autorizzato ad ARVET, imposta **prima dello snippet**, nella console (`F12`):

```javascript
window.__ARVET_PROVA__ = true;
```

Il flag prepara i campi e fa le ricerche senza premere Conferma. **Non premere mai Conferma, Salva o Conferma campionamento** con i dati del kit. Il flag non blocca i tuoi clic manuali e non elimina le richieste di ricerca ad ARVET. Non aprire né importare modelli 2/33 di sedute vere per questa esercitazione. [ARVET in prova](../tutorial/15-arvet.md).

## Modo B: Telefoni veri e schede stampate

Segui gli [incidenti programmati: una giornata di campo in 60 minuti](incidenti-programmati.md).
Per una squadra con un solo palmare, la Regia può fare il secondo prelievo nel test del doppio. Dopo aver spento l'unico palmare, l'esclusione dipende dalla maggioranza disponibile: leggi la variante indicata nella guida.

## Modo C: Emulatori Android (per formatori e tecnici)

### 1. Prepara e avvia i dispositivi virtuali

Nel Virtual Device Manager di Android Studio crea profili senza Play Store, come nell'ambiente del progetto:

| AVD | Sistema | Schermo | Densità |
|---|---|---|---|
| `Lenovo_Tab_M10_3` | Android 12, API 31 | 1920×1200, orizzontale | 240 dpi |
| `Galaxy_A55` | Android 16, API 36 | 1080×2340, verticale | 450 dpi |

Le densità sono quelle dei profili di prova; la corrispondenza esatta con i dispositivi fisici resta da verificare.
Dalla radice del repository, avvia ciascun comando in un terminale separato (richiedono immagini AVD già installate e accelerazione hardware):

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
"$ANDROID_HOME/emulator/emulator" -avd Lenovo_Tab_M10_3 -port 5554 -no-snapshot-save
"$ANDROID_HOME/emulator/emulator" -avd Galaxy_A55 -port 5556 -no-snapshot-save
```

### 2. Installa l'APK di debug

Scarica l'APK da [Scarica l'app](../scarica.md) oppure compilalo dal repository. La debug ha dati separati dalla release.
Con l'APK compilato e i due AVD avviati:

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
"$ANDROID_HOME/platform-tools/adb" devices
"$ANDROID_HOME/platform-tools/adb" -s emulator-5554 install -r androidApp/build/outputs/apk/debug/androidApp-debug.apk
"$ANDROID_HOME/platform-tools/adb" -s emulator-5556 install -r androidApp/build/outputs/apk/debug/androidApp-debug.apk
```

Apri **Fejalog debug** e usa solo il kit fittizio. Per i tocchi e le schermate scegli sempre il seriale:

```bash
export ANDROID_SERIAL=emulator-5556
export EMULATORE_FOTO=/tmp/fejalog_foto
strumenti/emulatore_ui.sh dump
# Sostituisci il testo con quello effettivamente letto nel dump:
strumenti/emulatore_ui.sh tap "Nuovo progetto"
strumenti/emulatore_ui.sh shot 01_inizio
strumenti/emulatore_ui.sh swipe
strumenti/emulatore_ui.sh back
```

Il comando `shot` salva il PNG intero e, se ImageMagick è installato, la copia ridotta. Per una registrazione breve:

```bash
"$ANDROID_HOME/platform-tools/adb" -s emulator-5556 shell screenrecord --time-limit 30 /sdcard/fejalog_prova.mp4
"$ANDROID_HOME/platform-tools/adb" -s emulator-5556 pull /sdcard/fejalog_prova.mp4 /tmp/fejalog_prova.mp4
```

### 3. Limiti e materiale per la formazione

Le reti degli AVD sono virtuali: il solo avvio di due emulatori non crea la Wi-Fi locale condivisa della squadra. Per una prima acquisizione usa ciascun AVD **da solo**; usa telefoni veri per la prova di rete e QR. La connessione contemporanea dei due AVD richiede una configurazione di rete dedicata e non è verificata da questa guida.

Usa nomi di fantasia, nessun codice fiscale reale e soltanto file del kit. Controlla ogni screenshot e video prima di condividerlo. Fotocamera, lettore fisico, carta stampata e spegnimenti reali si verificano sui dispositivi; gli emulatori non li certificano. I materiali video e le immagini aggiornate restano da preparare nella fase W5.

## Il percorso lungo: Tutorial passo per passo

L'[indice del tutorial](../tutorial/index.md) indica i capitoli utili per ciascun modo. Le pagine dell'app aiutano a capire il flusso; nel Modo A usa i nomi delle schede del browser indicati qui.
