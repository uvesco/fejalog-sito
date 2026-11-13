# Prima del campo: il telefono e il materiale

> **A chi serve**: veterinari prelevatori (i controlli del telefono valgono anche per la Regia) · **Tempo**: 10 minuti la sera prima, **una volta sola**

!!! tip "Prima di lunedì: 5 passi rapidi per chi preleva"
    Se hai solo 10 minuti stasera, segui questi 5 passi in ordine:

    1. **Passo 1: Installa l'app**: scarica [fejalog.apk](../scarica.md) sul tuo telefono Android (versione 11 o successiva). Se Android o Play Protect mostrano un avviso di sicurezza, tocca «Altri dettagli» e poi «Installa comunque».
    2. **Passo 2: Inserisci il tuo nome**: apri Fejalog, vai in *Menu ☰ › Impostazioni › Utente*, scrivi Nome, Cognome e Codice Fiscale e tocca **Salva**. Poi in *Impostazioni › Dispositivo* inserisci un nome chiaro per il telefono (es. «A55 Mario») e premi **Salva**.
    3. **Passo 3: Permessi e batteria**: in *Impostazioni › Dispositivo › Prima di cominciare*, tocca «Concedi i permessi che mancano» (posizione precisa, notifiche, fotocamera), imposta la batteria di Fejalog su «Senza restrizioni» e spegni il risparmio energetico del telefono.
    4. **Passo 4: Abbina il lettore di microchip Bluetooth** (se disponibile): configura il lettore Allflex in modalità tastiera (*HID / Slave Mode*) e associalo al telefono seguendo la [guida al lettore](#lettore-di-microchip-bluetooth-allflex-awr250) più sotto.
    5. **Passo 5: Salva la Wi-Fi e prepara lo zaino**: inquadra con la fotocamera il foglio del QR Wi-Fi del responsabile; metti nello zaino il telefono carico al 100%, un power bank con cavo da 1 metro, la fascia da braccio e un pennarello indelebile nero. Consulta la [Checklist del veterinario](../checklist-veterinari.md).

Da fare a casa o in ufficio prima della giornata di profilassi, quando hai una connessione internet per scaricare l'app. In campo internet non servirà più.

## 1. Installa l'app

1. Il telefono deve avere **Android 11 o più recente**.
2. Apri il link che ti manda il responsabile (o la pagina [Scarica l'app](../scarica.md)) e tocca il file `fejalog.apk`.
3. Tocca il file scaricato. La prima volta Android chiede di **consentire l'installazione da questa origine** (il browser o il gestore file): tocca Impostazioni, consenti e torna indietro.
4. Tocca **Installa**. Se Google Play Protect avvisa che l'app è sconosciuta, tocca «Altri dettagli» e poi **«Installa comunque»**.

!!! warning "La stessa versione del tablet"
    In campo tutti i telefoni devono avere **la stessa versione dell'app della Regia**: telefoni con versioni diverse non possono lavorare insieme. Installa la versione indicata dal responsabile.
    Se in campo ti accorgi di avere una versione diversa, la Regia può passarti l'APK aggiornato direttamente sulla Wi-Fi locale: sotto il QR d'ingresso la Regia tocca «Mostra il QR per scaricare l'app» e tu lo inquadri con la fotocamera per installare l'aggiornamento. Una versione aggiornata si installa sopra quella vecchia senza perdere i dati.

## 2. Chi sei: Impostazioni › Utente

Apri Fejalog. Parte dall'**Avvio rapido**, il cui primo passo è «Chi usa questo device».

1. ☰ Menu › **Impostazioni › Utente**.
2. Scrivi **Nome**, **Cognome** e **Codice fiscale** (le maiuscole le mette l'app). Se compare «Il codice fiscale non
   sembra completo», ricontrollalo.
3. Tocca **Salva**.

Vale per tutti i progetti: non si rifà a ogni giornata. Sul tablet della Regia, se c'è già l'elenco dei veterinari
dell'ASL, «Scegli dall'elenco dei veterinari» compila i tre campi senza errori.

??? info "A che cosa serve il codice fiscale"
    Serve a riconoscerti nell'elenco dei veterinari del progetto: con quello la Regia ti dà la **sigla** di due lettere
    (per esempio **UV**), la stessa su tutti i tuoi device, e le statistiche restano tue anche se cambi telefono.
    Finisce nel nome dei file di backup, per sapere chi li ha salvati. **Non va mai sulle provette né negli export.**
    Quando entri nel progetto, in cima al menu compaiono il tuo nome corto («Mario R») e la sigla fra parentesi.

## 3. Il nome del telefono: Impostazioni › Dispositivo

1. ☰ Menu › **Impostazioni › Dispositivo**.
2. In **Nome del dispositivo** l'app propone il nome di sistema: scrivi qualcosa che la Regia riconosca a colpo
   d'occhio, per esempio «A55 Mario».
3. Tocca **Salva**.

Il nome compare alla Regia nell'elenco dei telefoni collegati e distingue due veterinari con lo stesso nome.

## 4. I permessi

Sempre in **Impostazioni › Dispositivo**, sotto il nome, c'è il riquadro **«Prima di cominciare»** (è anche nella
pagina «Entra col QR»). Tocca **«Concedi i permessi che mancano»** e rispondi alle finestre di Android:

| Permesso | Cosa rispondere | Perché serve |
|---|---|---|
| **Posizione** | «Mentre usi l'app»; da Android 12 anche «Posizione **precisa**» | Android fa leggere il **nome della Wi-Fi** solo alle app con questo permesso: senza, Fejalog non sa su quale rete sei. **Fejalog non usa la posizione per altro** e non la registra. |
| **Dispositivi nelle vicinanze** (Android 13 e successivi) | «Consenti» | Serve alle funzioni Wi-Fi delle versioni recenti di Android. |
| **Notifiche** (Android 13 e successivi) | «Consenti» | La notifica «progetto in corso» tiene attivo il collegamento alla Wi-Fi anche con l'app in secondo piano o lo schermo spento. |
| **Fotocamera** | «Mentre usi l'app» | Per inquadrare il QR d'ingresso della Regia, i QR delle reti Wi-Fi e, se servono, per le foto dei campioni. |

Fejalog non chiede contatti, microfono, SMS né l'accesso ai tuoi file: i backup li scrive nelle sue cartelle o in
quelle che scegli tu. Nessun dato esce dal telefono verso internet.

Se per sbaglio hai negato un permesso, Android può non chiederlo più: in questo caso usa «Apri le impostazioni» sulla
voce rossa (Impostazioni di Android › App › Fejalog › Autorizzazioni) e concedilo da lì.

## 5. I controlli del telefono: batteria e Wi-Fi

Nel riquadro **«Prima di cominciare»** ogni voce ha un segno: **✓ verde** a posto, **✗ rossa** da sistemare, **? gialla**
da controllare a mano (Android non lascia leggere quell'impostazione alle app). Le voci rosse e gialle hanno il tasto
**«Apri le impostazioni»** che porta alla pagina giusta. Alla fine tocca **«Ricontrolla»**.

| Voce | Cosa fare |
|---|---|
| **Wi-Fi accesa** | Accendila: serve anche se la rete del progetto non ha internet. |
| **Risparmio energetico spento** | Spegnilo durante il lavoro: può staccare la Wi-Fi a schermo spento. |
| **Batteria senza restrizioni per Fejalog** | Tocca «Apri le impostazioni» e consenti: così Android non mette in sospensione Fejalog mentre lavori. |
| **Notifiche di Fejalog consentite** | Vedi il punto 4. |
| **Posizione consentita** e **Posizione attiva** | Concedi il permesso (punto 4) e tieni accesa la posizione nelle impostazioni rapide: spenta, Android nasconde il nome della Wi-Fi. |
| **Fotocamera consentita** | Vedi il punto 4. |
| **Reti del progetto salvate** (?) | Vedi il punto 6. |
| **Passaggio automatico ai dati mobili spento** (?) | Samsung: Impostazioni › Connessioni › Wi-Fi › ⋮ › **Intelligent Wi-Fi** › «Passa a dati mobili» **spento**. Altri telefoni: spegni il passaggio automatico ai dati mobili o la «connettività adattiva», se c'è. |
| **«Mantieni la connessione»** (?) | Quando Android avvisa che la rete non ha accesso a internet: **«Sì, mantieni»** e **«Non chiedere più»**. |
| **Livello batteria** | Almeno il 50% (o in carica) per cominciare; in campo porta il power bank. |
| **Samsung: «App in sospensione»** (?) | Impostazioni › Assistenza dispositivo › Batteria › **Limiti per l'uso in background**: Fejalog **non** deve stare fra le «App in sospensione» né fra le «App in sospensione avanzata». |

I dati mobili possono restare accesi.

## Lettore di microchip Bluetooth (Allflex AWR250)

Fejalog supporta la ricerca immediata del capo tramite i lettori di microchip transponder (bolo endoruminale o orecchino elettronico DX).
Per configurare il lettore Allflex AWR250 in dotazione ai Servizi Veterinari in modalità tastiera Bluetooth (*HID / Slave Mode*):

1. **Sul lettore**: accendi e premi il tasto centrale per aprire il Menu.
2. Vai su **Setup › Interface Setup › Bluetooth**.
3. Seleziona **Set Bluetooth Mode** e impostalo su **Slave Mode**.
4. Seleziona **Set BT Profile** e impostalo su **HID** (Human Interface Device / tastiera).
5. **Sul telefono**: apri **Impostazioni di Android › Bluetooth › Associa nuovo dispositivo**.
6. Seleziona il lettore (es. `AWR250_...`) e conferma l'accoppiamento (se richiesto codice PIN: `0000` o `1234`).
7. **In campionamento**: nella schermata di ricerca di Fejalog, leggendo il transponder il codice (`380...` o `0380...`) entra direttamente nel campo di ricerca con invio automatico, selezionando il capo senza toccare lo schermo.

## 6. Le reti del progetto

Prima di partire salva in Android le reti Wi-Fi del progetto (il router da viaggio, l'hotspot del tablet): apri la
**fotocamera** del telefono e inquadra il **QR Wi-Fi** di ogni rete, stampato dal responsabile o mostrato dalla Regia in
**Rete del progetto**. Android chiede di collegarsi: conferma. La rete resta salvata, e se in campo una rete cade Android
passa da solo a un'altra di quelle salvate.

## 7. Il materiale da portare

- Il **telefono carico al 100%**, un **power bank** carico e un **cavo da 1 m** adatto al telefono.
- Il **porta-cellulare da braccio**, per avere le mani libere.
- Un **pennarello indelebile** per le provette.
- Se c'è, il **lettore di microchip** a doppio standard (FDX-B e HDX), carico; se è a bastone, una fondina da cintura o
  una faretra da schiena.

La [checklist del veterinario](../checklist-veterinari.md) ha tutto in una pagina da stampare.

## La batteria durante il lavoro

Fejalog è fatto per reggere una giornata di campo senza regolazioni particolari:

- **Lo schermo in Campionamento.** Mentre registri non si spegne e non si blocca: dopo un minuto senza tocchi diventa
  **nero** («Tocca o scansiona per riaccendere lo schermo»). Un tocco, una lettura col lettore di microchip o un tasto del
  telecomando lo riaccendono subito, **senza sblocco**. Con un foglio di conferma o una finestra aperta non si scurisce.
  Fuori dal Campionamento lo schermo segue le impostazioni normali del telefono.
- **La rete senza sprechi.** La notifica «progetto in corso» tiene viva la Wi-Fi; Fejalog non tiene sveglio il
  processore. Con la rete a posto passano solo i messaggi del lavoro e un breve segnale di presenza ogni 15 secondi, che
  serve a sapere chi è collegato per il controllo dei doppi. Le tacche del segnale Wi-Fi si aggiornano da sole senza
  consumare.
- **Le statistiche** si aggiornano quando le apri e con «Aggiorna». «Statistiche sempre in tempo reale» (Impostazioni ›
  App) le tiene aggiornate di continuo ma **consuma batteria**: sui palmari lasciala spenta.
- **La diagnostica locale** (Impostazioni › App) annota tempi, rete e batteria del telefono nei backup, per migliorare
  l'app: è leggera e resta sul telefono; si può spegnere.
- **Batteria scarica.** Il telefono avvisa al **20%** e al **10%**. Al **5%**, se non è in carica, si mette **in pausa da
  solo** e lo comunica alla Regia: il lavoro già fatto è al sicuro e gli altri tornano a controllare i doppi senza
  aspettarlo. Ricaricato, riprendi da Campionamento › Pausa e ripresa. Le soglie le può cambiare la Regia, che vede la
  batteria di tutti i telefoni collegati e chi rischia di non finire.

**Perché «Senza restrizioni» e risparmio energetico spento** (punto 5): con le restrizioni Android, a schermo spento, può
sospendere l'app o staccare la Wi-Fi, e il telefono esce dalla rete della squadra: per gli altri i doppi non sono più
controllati in diretta. Quello che consuma di più resta lo schermo, che Fejalog scurisce da sé.

**Consigli pratici**: parti col telefono al 100%, porta un **power bank** carico e un cavo da 1 m, collegalo al primo
avviso; la luminosità automatica va bene.

## Fatto?

- [ ] App installata, la stessa versione indicata dal responsabile
- [ ] Impostazioni › Utente: nome, cognome e codice fiscale salvati
- [ ] Impostazioni › Dispositivo: nome del telefono salvato
- [ ] «Prima di cominciare»: permessi concessi, nessuna ✗ rossa, voci gialle controllate a mano
- [ ] Batteria di Fejalog «Senza restrizioni», risparmio energetico spento, telefono carico e power bank
- [ ] Reti del progetto salvate in Android
- [ ] Lettore di microchip associato (se lo usi)
- [ ] Materiale pronto: power bank e cavo, porta-cellulare, pennarello

In campo si entra nel progetto da ☰ Menu › Progetto › **Entra col QR**, inquadrando il QR della Regia: il seguito è
nella scheda [In campo](in-campo.md); se qualcosa non va, [Se qualcosa va storto](cosa-succede-se.md).
