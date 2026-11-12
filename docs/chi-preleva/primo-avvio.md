# Prima configurazione del telefono

> **A chi serve**: veterinari prelevatori (gli stessi passi valgono per il tablet della Regia) · **Tempo**: una decina di
> minuti, **una volta sola**

Da fare a casa o in ufficio, prima della giornata, quando il telefono ha ancora internet per scaricare l'app. Dopo, in
campo, internet non serve più. I passi sono sei: installare l'app, dire chi sei, dare un nome al telefono, concedere i
permessi, sistemare i controlli del telefono (batteria e Wi-Fi) e salvare le reti del progetto. In fondo, come Fejalog
gestisce la batteria durante il lavoro.

!!! tip "In breve"
    ☰ Menu › **Impostazioni › Utente**: nome, cognome, codice fiscale › **Salva**.
    **Impostazioni › Dispositivo**: nome del telefono › **Salva**; poi, nel riquadro **«Prima di cominciare»**,
    **«Concedi i permessi che mancano»** e sistema tutte le voci con la ✗ rossa.

## 1. Installa l'app

1. Il telefono deve avere **Android 11 o più recente**.
2. Apri il link dell'APK che ti manda il responsabile (o la pagina [Scarica l'app](../scarica.md)) e scarica il file.
3. Tocca il file scaricato. La prima volta Android chiede di **consentire l'installazione da questa origine** (il
   browser, WhatsApp o il gestore di file): consenti e torna indietro.
4. **Installa**. Se Play Protect avvisa che l'app è sconosciuta: «Altri dettagli» › **«Installa comunque»**.

!!! warning "La stessa versione del tablet"
    In campo tutti i telefoni devono avere **la stessa versione dell'app della Regia**: un telefono con una versione
    diversa non entra nel progetto. Installa quella che ti indica il responsabile. Se in campo ti accorgi di avere una
    versione diversa, la Regia te la dà al volo: nella pagina del QR d'ingresso tocca «Mostra il QR per scaricare
    l'app», tu lo inquadri con la fotocamera e scarichi l'app dal tablet, anche senza internet. Una versione nuova si
    installa sopra quella vecchia: i progetti restano.

    «Fejalog» e «Fejalog debug» sono due app distinte, coi loro dati: usa quella che ti indica il responsabile.

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

Se usi un **lettore di microchip Bluetooth**, associalo al telefono come tastiera: i passi per l'Allflex AWR250 sono nel
[foglio per i veterinari](../veterinari.md).

## 6. Le reti del progetto

Prima di partire salva in Android le reti Wi-Fi del progetto (il router da viaggio, l'hotspot del tablet): apri la
**fotocamera** del telefono e inquadra il **QR Wi-Fi** di ogni rete, stampato dal responsabile o mostrato dalla Regia in
**Rete del progetto**. Android chiede di collegarsi: conferma. La rete resta salvata, e se in campo una rete cade Android
passa da solo a un'altra di quelle salvate.

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

In campo si entra nel progetto da ☰ Menu › Progetto › **Entra col QR**, inquadrando il QR della Regia: i passi sono nel
[foglio per i veterinari](../veterinari.md) e nella [scheda in campo](in-campo.md). Per l'elenco completo di cosa
portare: [Checklist del veterinario](../checklist-veterinari.md).
