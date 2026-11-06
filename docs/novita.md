<!-- Pagina generata da Fejalog (ScriviSito) dai testi dell'app: non modificare qui. -->

# Versioni e novità

Ogni versione elenca ciò che è cambiato dalla precedente pubblicata, comprese le build intermedie.

**Tutte le versioni**

| Versione | Data | Scarica |
|---|---|---|
| [0.4.0](#v0-4-0) · ultima | 05/11/2026 | [App](https://github.com/uvesco/fejalog-sito/releases/download/v0.4.0/fejalog.apk) · [Kit](https://github.com/uvesco/fejalog-sito/releases/download/v0.4.0/kit_prova_cinque_stabilimenti.zip) · [Schede](https://github.com/uvesco/fejalog-sito/releases/download/v0.4.0/schede_kit_cinque_stabilimenti.pdf) |
| [0.3.0](#v0-3-0) | 28/10/2026 | [App](https://github.com/uvesco/fejalog-sito/releases/download/v0.3.0/fejalog.apk) · [Kit](https://github.com/uvesco/fejalog-sito/releases/download/v0.3.0/kit_prova_888TO999.zip) · [Schede](https://github.com/uvesco/fejalog-sito/releases/download/v0.3.0/schede_kit_prova_888TO999.pdf) |
| [0.2.0](#v0-2-0) | 21/10/2026 | [App](https://github.com/uvesco/fejalog-sito/releases/download/v0.2.0/fejalog.apk) · [Kit](https://github.com/uvesco/fejalog-sito/releases/download/v0.2.0/kit_prova_888TO999.zip) · [Schede](https://github.com/uvesco/fejalog-sito/releases/download/v0.2.0/schede_kit_prova_888TO999.pdf) |
| [0.1.0](#v0-1-0) | 16/10/2026 | [App](https://github.com/uvesco/fejalog-sito/releases/download/v0.1.0/fejalog.apk) · [Kit](https://github.com/uvesco/fejalog-sito/releases/download/v0.1.0/kit_prova_888TO999.zip) · [Schede](https://github.com/uvesco/fejalog-sito/releases/download/v0.1.0/schede_kit_prova_888TO999.pdf) |

Una versione precedente non si installa sopra una più recente: prima salva un backup, poi disinstalla l'app (i progetti nel telefono si perdono), infine installa la versione scelta. Per installare: [Scarica](scarica.md).

## Versione 0.4.0 · 05/11/2026 { #v0-4-0 }

Menu riordinato, ogni funzione in un posto solo, e tenuta provata con greggi grandi e molti palmari.

[Scarica l'app](https://github.com/uvesco/fejalog-sito/releases/download/v0.4.0/fejalog.apk){ .md-button .md-button--primary }
[Kit di prova](https://github.com/uvesco/fejalog-sito/releases/download/v0.4.0/kit_prova_cinque_stabilimenti.zip){ .md-button }
[Schede da stampare](https://github.com/uvesco/fejalog-sito/releases/download/v0.4.0/schede_kit_cinque_stabilimenti.pdf){ .md-button }

[Pagina della release su GitHub](https://github.com/uvesco/fejalog-sito/releases/tag/v0.4.0)

### Novità

- Diagnostica locale anche nella release: tempi, rete, batteria ed errori del telefono finiscono nei backup per migliorare l'app. È leggera e si spegne in Impostazioni › App.
- Telecomando BLE-M3 (quello per i selfie con la croce): nel foglio di conferma e nella ricerca le frecce fanno da frecce, il tasto centrale è OK e l'altro è Indietro. I suoi tocchi non arrivano allo schermo.
- Istantanee locali su tutti i device, anche sui palmari: ogni 10 eventi da soli, ogni N in rete, e sempre a pausa, ripresa e uscita.
- Pagina Regia: «Pausa» e «Riattiva» per ogni veterinario, anche per un palmare scollegato, così gli altri escono dalla gestione provvisoria.
- Foto del campione nel foglio di conferma (fino a 5) e in Ultime: arrivano alla Regia e vanno nei backup e nello zip di fine lavori.
- Kit di prova a cinque stabilimenti: 1200 capi nel principale, 10 nel piccolo, tutti i motivi d'uscita.
- Impostazioni › Telecomando e tastiera: la prova mostra il nome di ogni tasto di un telecomando Bluetooth e che cosa fa.

### Miglioramenti

- Menu: Progetto con «Entra col QR» per tutti; Configurazione apribile dalla Regia anche a campionamento avviato, coi campi congelati in sola lettura; QR d'ingresso e Stampe come voci proprie; Gestione campioni divisa in «Sul tablet», «Dal PC via USB» e «Sul sito»; Impostazioni divise in Utente, Dispositivo, App, Cartelle e Reti salvate; Aiuto con Informazioni (versione, autore, crediti, avvertenze); in fondo «Esci dal progetto» ed «Esci dall'app».
- Sul palmare: Rete è una voce diretta, sempre raggiungibile; la nuova pagina Campionamento › Pausa e ripresa si apre solo dal menu. Chi si allontana dalla rete si mette in pausa: altrimenti tutti passano alla gestione provvisoria. La Regia può sempre metterlo in pausa.
- Ultime sulla Regia: si scelgono le provette di tutti, le proprie o di un veterinario. Gli stabilimenti stanno in fondo ad Avanzamento.
- Una sola cartella locale dei backup, anche in modalità offline; la cartella offline scelta in passato resta come ripiego.
- Greggi grandi: registrazione e viste con un costo per evento che non cresce più durante la giornata (prove sul PC e sull'emulatore col gregge fittizio da 1800 capi e 12 palmari). Ricerca del capo circa 20 volte più veloce, elenco delle provette e istantanee più leggeri, foglio di conferma senza blocchi.
- La prova del telecomando dice da quale dispositivo arriva il volume e quanto dopo l'inizio del tocco.
- Telecomando BLE-M3: frecce destra e sinistra cambiano specie; nel foglio su e giù scorrono le opzioni, il tasto centrale attiva quella selezionata e l'altro annulla.
- La prova del telecomando dice in che cosa si traduce ogni gesto.
- Prova del telecomando: registra anche la rotella e il cursore, il punto dello schermo e la durata di ogni gesto; legge solo i tocchi del telecomando, così «Chiudi» si tocca col dito.
- Prova del telecomando a tutto schermo: mostra anche i clic e i trascinamenti dei telecomandi che fanno da mouse, come il BLE-M3, che non ha una modalità tastiera.
- Salva e uscita scrivono il backup nelle cartelle locale e remota scelte una volta in Impostazioni: all'uscita non si chiede più la cartella.

### Correzioni

- Riordino: la guida non blocca più l'app con molti eventi, l'elenco resta al suo posto dopo ogni invio, il cambio di specie è immediato e un posto occupato si libera prima. La produttività della gestione distingue le provette in coda con ARVET a mano.
- Fine lavori: una capra valida non esce più dagli snippet dopo lo scarto di una registrazione nella specie sbagliata; il CSV nello zip non ha più righe vuote; riepilogo per tipologia e bordi dei plateau corretti.
- Telecomando BLE-M3: il tasto dello scatto (che fa anche il volume) ora è sempre Indietro e non conferma più, qualunque sia l'ordine in cui il telecomando manda tocco e volume. Il tasto centrale resta OK.
- Il tocco che accompagna Indietro viene scartato; un OK premuto subito dopo funziona. I tasti riaccendono lo schermo nero e funzionano anche entrando in Ultime.
- Il motivo d'uscita Y3 (presunto morto) si legge intero dai registri della BDN.
- Senza rete, un device rimasto senza lettera ne prende una libera; se una provetta non si può registrare, il foglio di conferma dice perché.

## Versione 0.3.0 · 28/10/2026 { #v0-3-0 }

Prima del campo. Etichette con sigla di due lettere del veterinario e lettera dello stabilimento cerchiata, Regia a due pannelli, stampe e checklist prima del campo, gestione dei campioni dopo il campionamento e strumenti completi anche sul computer.

[Scarica l'app](https://github.com/uvesco/fejalog-sito/releases/download/v0.3.0/fejalog.apk){ .md-button .md-button--primary }
[Kit di prova](https://github.com/uvesco/fejalog-sito/releases/download/v0.3.0/kit_prova_888TO999.zip){ .md-button }
[Schede da stampare](https://github.com/uvesco/fejalog-sito/releases/download/v0.3.0/schede_kit_prova_888TO999.pdf){ .md-button }

[Pagina della release su GitHub](https://github.com/uvesco/fejalog-sito/releases/tag/v0.3.0)

### Novità

- Collegamento al PC via USB: nuova voce in Gestione campioni, con pulsante per le impostazioni del tethering, controllo USB e Avvia/Ferma server.
- Capo senza contrassegno: tasto «Senza contrassegno» per attribuire la provetta a un presente non prelevato per sesso, razza ed età.
- Prima del campo: stampe (2/33 precompilato dai file di ARVET, foglio A3 provetta/contrassegno, foglio 1–100, schema del tavolo, QR Wi-Fi), calcolo del materiale, checklist e briefing nell'app.
- Fine lavori sul computer: pagina servita dal tablet via USB (tethering) con codice monouso e, sul sito, strumenti completi (provette e modifiche, statistiche, riconcilia backup, avvisi, 2/33 finale); le modifiche tornano al tablet nel file «Importa dal sito».
- Riordino: l'interruttore «Chiudi i buchi» dà i numeri finali di fila, senza vuoti (provette perse, annullate, eliminate); vale per la guida e per lo zip di fine lavori. Si sceglie prima di spuntare.
- Sito, strumenti on line: simulatore del riempimento dei plateau (rivede il backup provetta dopo provetta, con il cursore del tempo; si può aprire in una finestra a parte), «Chiudi i buchi» anche lì, e il tasto per nascondere il menu del sito.
- A campionamento chiuso: «Non trovati e tardive». La distinta dei capi non prelevati, col tasto per copiare ogni contrassegno, e il confronto che mette in ordine di somiglianza i capi che mancano per attribuire una provetta dal numero o dal contrassegno incompleto o illeggibile («5?» per una cifra che non si legge).
- Registrazione tardiva (solo la Regia): una provetta scritta ma mai confermata si registra a campionamento chiuso, senza riaprirlo, con l'etichetta che c'è sulla provetta e una nota.
- «Importa dal sito»: le modifiche fatte con gli strumenti on line del sito (fine lavori sul computer) tornano nell'app, con anteprima, come eventi nuovi.
- La Regia sceglie le soglie della batteria dei palmari (avvisi e pausa automatica) dalla pagina Messaggi.
- Esito a tutto schermo per un attimo: ✓ verde «registrata» o ✗ rossa «non registrata», con vibrazioni diverse; il lampo si vede anche sopra il foglio di conferma.

### Miglioramenti

- Sistemazione delle provette in ordine: prima i maschi problematici in testa (facendo spazio se serve), poi le femmine problematiche nei buchi, infine i buchi che restano si chiudono con le ultime provette ordinarie.
- Controllo completo delle etichette con le sigle a due lettere: provette omonime non emesse in nessuna delle prove casuali (6.000 problematiche in 300 sedute).
- PIN di 8 cifre a gruppi di 4 per collegare il PC via USB, al posto del codice lungo; una conferma sul tablet per sessione, con registro delle modifiche ricevute e tasto Interrompi.
- Riordino: per ogni problematico si vede la fattispecie; la destinazione suggerita si può cambiare scrivendola (se il numero è occupato si propone lo scambio da confermare); ogni riga ha il suo Invia e la spunta serve solo per l'invio in blocco.
- Plateau: niente più animazione storica, la posizione reale si aggiorna subito; ricerca per contrassegno e per posizione nella stessa schermata, plateau affiancati con zoom.
- Gestione dei campioni dopo il campionamento: toccando una provetta nel plateau si copia il contrassegno, si modifica la registrazione, si sposta, si scarta (recuperabile) o si segna smarrita (ritrovabile); bordi dei plateau verde, giallo o rosso; riepilogo dei problematici e delle registrazioni tardive; produttività anche in gestione.
- Le stesse funzioni valgono nell'app, nella pagina via USB e nel sito aperto da un backup.
- La pagina mostra l'indirizzo effettivo con IP e porta, il codice monouso e Copia indirizzo; il ? apre la guida passo per passo per Windows.
- Checklist del veterinario: aggiunti i tre passaggi per entrare, prelevare e consegnare le provette, con promemoria su conferme mancate, rete e batteria.
- Regia: pagina «Regia» a due pannelli (a sinistra i veterinari con «Ricevi», a destra i plateau con zoom e «Metti qui»); sul telefono sono due schede.
- Inserimento campioni: cambiando specie (swipe o frecce) il contrassegno letto o digitato resta nel campo, senza rileggerlo; con il foglio di conferma aperto il cambio lo chiude e la ricerca riparte nell'altra specie.
- Scritta da mettere sulla provetta: riquadro rosso per i problematici (scrivi sempre il contrassegno completo), blu per l'ordinario preso senza tutti collegati (solo l'etichetta).
- Tasti (anche per il telecomando): nel foglio di conferma OK conferma subito; frecce su e giù spostano il focus fra le opzioni, spazio o OK le attivano, frecce destra e sinistra cambiano specie, Esc annulla.
- Etichette nuove nei progetti nuovi: sigla di due lettere del veterinario (la conferma la Regia) e lettera dello stabilimento cerchiata in testa; la Regia sceglie le lettere prima dell'avvio.
- Plateau: verso di riempimento a scelta (dall'alto verso il basso, predefinito, o dal basso verso l'alto) e foglio generico 1–100; i problematici stanno in un solo plateau alla volta, nel primo pozzetto libero.
- Testi: chi usa l'app è sempre chiamato veterinario (veterinario prelevatore in campo), chi alleva gli animali allevatore.
- Accanto al contrassegno delle provette problematiche c'è il tasto per copiarlo.
- Se il Wi-Fi resta perso per 45 secondi il palmare prova da solo l'altra rete del progetto; se la cartella cloud non risponde i salvataggi vanno in locale e si riprova da soli.
- Alla Regia: se le lettere dei veterinari sono finite, una banda rossa dice quale telefono non può prelevare da isolato né registrare problematiche.
- Wi-Fi persa da 45 secondi: il palmare prova da solo l'altra rete del progetto (principale o riserva), poi riprova ogni 90 secondi; il telefono può chiedere una conferma.
- Se la cartella cloud non risponde, i salvataggi vanno in locale e in coda e il cloud si riprova da solo ogni minuto: al primo successo la coda si svuota.
- Icona della rete spiegata: verde doppi controllati, giallo non controllati (lettera in coda), rosso problema, grigio senza rete; tacche del segnale Wi-Fi. Su ogni provetta il segno del controllo dei doppi.
- La Regia può escludere subito un telefono spento (solo lei, con la maggioranza); l'esclusione automatica a 2 minuti resta com'è.
- Batteria: avvisi al 20% e al 10%, pausa ordinata al 5% se non è in carica, ultimo segnale allo spegnimento.
- Riconnessione rapida alla Regia mentre il palmare è scollegato, «Entra col QR» sempre raggiungibile per cambiare rete senza reinstallare.
- Questa build di debug si installa accanto alla release («Fejalog debug», cartelle Documenti/Fejalog-debug): non serve più disinstallare.
- Dopo la prima prova in campo con tre telefoni: la lettera appartiene al telefono (la classifica resta della persona); chi cambia telefono ne prende una nuova, e un telefono non si presenta finché non ha ricevuto il registro.

### Correzioni

- Riordino: annullando un passaggio si annulla tutta la catena dei passaggi collegati; le guide dei file ripartono sempre dal posto attuale della provetta.
- Plateau: la ricerca trova anche il codice breve della provetta problematica (per esempio «UV-1»), con o senza lettera dello stabilimento.
- Sigle dei veterinari: l'avviso compare solo quando almeno due veterinari hanno le stesse iniziali.
- Meno provette scritte ma non confermate: un capo già prelevato non si registra più due volte per sbaglio («Già fatto» o «Preleva come doppio»), le conferme mancate restano nelle Ultime con «Registra adesso», e col foglio aperto una nuova lettura chiede prima di scartare.

## Versione 0.2.0 · 21/10/2026 { #v0-2-0 }

Fasi del lavoro, Plateau della Regia, riordino guidato dal posto vero delle provette e mai provette con la stessa scritta.

[Scarica l'app](https://github.com/uvesco/fejalog-sito/releases/download/v0.2.0/fejalog.apk){ .md-button .md-button--primary }
[Kit di prova](https://github.com/uvesco/fejalog-sito/releases/download/v0.2.0/kit_prova_888TO999.zip){ .md-button }
[Schede da stampare](https://github.com/uvesco/fejalog-sito/releases/download/v0.2.0/schede_kit_prova_888TO999.pdf){ .md-button }

[Pagina della release su GitHub](https://github.com/uvesco/fejalog-sito/releases/tag/v0.2.0)

### Novità

- Fasi del progetto: configurazione, campionamento aperto, campionamento chiuso. I palmari prelevano solo a campionamento aperto e vedono solo ciò che serve; Gestione campioni si apre a campionamento chiuso.
- Plateau della Regia: «Ricevi» le provette di ogni veterinario e lo schema dice in che pozzetto metterle (serie ordinaria o riga del veterinario nei problematici). Il posto, deciso alla consegna, non cambia più fino al riordino.
- Stabilimenti secondari aggiungibili in corsa, con le loro lettere; provette spostabili fra stabilimenti; capi di altri stabilimenti fra i problematici.
- Messaggi della Regia ai palmari e avvisi automatici di avanzamento (25%, 50%, 75%, 100%); statistiche con avanzamento, classifica e stabilimenti.
- Guida al posizionamento rapido e animazione: indicazione visiva immediata della destinazione ('Mettila QUI!') con pozzetto pulsante e ricerca rapida per codice provetta o contrassegno.
- Tabella numerazioni CSV in preparazione: scaricabile e condivisibile fin dal caricamento dei registri BDN, e salvata automaticamente nelle cartelle di progetto.
- Vista Plateau e Note: celle con note e collisioni contrassegnate con pallino giallo; finestra modale Note plateau con collegamento diretto alla risoluzione.
- Nuova schermata Stabilimenti: quadro chiaro dello stabilimento principale e dei secondari con badge lettera, stato di congelamento e gestione degli stabilimenti secondari.
- Statistiche per palmari e Regia: nuove schede di Avanzamento totale complessivo e Classifica individuale dei veterinari (con medaglie 🥇🥈🥉, ritmi e badge 'Tu').
- Statistiche multi-stabilimento: scheda dedicata con avanzamento, capi attesi/fatti e percentuali per ciascuno stabilimento di lavoro.
- Barra superiore con doppio indicatore visivo: icona provetta colorata (verde quando il campionamento è attivo e pronto, rossa quando bloccato o chiuso) affiancata all'icona colorata dello stato di rete.
- Capi ricercati aggiungibili dalla Regia; reti principale e riserva condivise; impostazioni app esportabili.
- Archivio delle numerazioni delle pecore dopo assegnazioni e scambi; seconda copia incrementale anche su USB, senza sovrascritture.
- Filtro Annullate: nuovo filtro rapido per consultare e verificare separatamente le provette annullate ed escluse, con storico e motivazione.
- Codice univoco di creazione del progetto (es. 888TO999-20261016-D87A) per prevenire unioni errate e facilitare il riconoscimento della seduta attiva.

### Miglioramenti

- Riordino solo a campionamento chiuso, con la guida che parte dal pozzetto vero di ogni provetta e ne mostra l'etichetta; dalla prima spunta il campionamento non si riapre più.
- Lettere dei veterinari fino a 15; la lettera, la classifica e gli avvisi seguono la persona (codice fiscale) anche cambiando device.
- Età diagnostica modificabile in corsa dalla Regia con doppia conferma, senza cambiare i numeri già assegnati.
- Smarriti e rubati sempre fra le problematiche; modalità offline con salvataggi locali e riconciliazione dei backup più rigorosa.
- Plateau a nido d'ape e origine in basso a sinistra: griglia con cellette esagonali/quinconce sfasate e pozzetti circolari per riprodurre fedelmente i rack fisici di stalla e laboratorio.
- Vista affiancata su tablet in Riordino: lista provette a spunta a sinistra e schema plateau riordinato a destra per lavorare comodamente sul grande schermo della Regia.
- Tasto ergonomico bifacciale Campionamento \<-\> Ultime: pulsante posizionato nella stessa esatta coordinata per commutare istantaneamente con un solo tocco del pollice senza muovere la mano.
- Menu delle fasi operative nel Drawer: le voci e i gruppi delle fasi non in corso sono in grigio, protetti e non espandibili, guidando ordinatamente il veterinario.
- Distinzione ruoli all'avvio: 'Coordina come Regia' (Nuovo, Apri) ed 'Entra come Palmare' (QR, Wi-Fi) distinti in Inizio, con 'Recenti' accessibile a tutti.
- Condivisione universale aperta: invio diretto di Excel per l'allevatore e CSV numerazione verso WhatsApp, Telegram, email e cloud.
- Stabilimenti secondari e principale: principale congelato all'avvio, secondari cumulativi solo aggiungibili con lettere disgiunte.
- Messaggistica Regia: messaggi generali o selettivi per singolo veterinario, orari in ora locale e notifiche automatiche alle soglie di avanzamento senza duplicati.
- Fasi operative e sicurezza: prelievi consentiti solo a campionamento aperto; età diagnostica protetta da conferma multipla con checkbox.
- Stabilimento principale e secondari: stabilimento principale congelato definitivamente all'avvio del campionamento; stabilimenti secondari aggiungibili in corsa con lettere assegnate.
- Capi di altri stabilimenti: gli animali dei registri aggiunti non presenti in uno stabilimento di lavoro in campionamento hanno banda viola (non verde) e vanno sempre nei problematici.
- Riordino e plateau riservati alla Regia: schermata di riordino provette e scheda plateau accessibili e consultabili unicamente dalla Regia.
- Menu palmari semplificato: navigazione ristretta a Campionamento, Rete, Impostazioni dispositivo e Guida, eliminando le voci riservate alla Regia.
- Fasi operative vincolanti (Configurazione, Campionamento aperto, Campionamento chiuso): prelievi consentiti solo a campionamento aperto, con congelamento definitivo di età diagnostica e lettera di specie dopo il primo avvio.
- Palmari in campionamento: blocco automatico finché non sono configurati e allineati con la Regia, e menu focalizzato su Campionamento e Rete.
- Gestione campioni (Problemi da risolvere, Riordino e Fine lavori) sbloccata solo a campionamento chiuso, mentre la Regia può aggiornare in corsa registri BDN, ricercati, regole e rete.
- Modalità offline e copie locali: attivazione manuale anche dalla vista Rete o automatica in caso di caduta della rete/isolamento, con salvataggio immediato su cartella locale.
- Riconciliazione backup: verifica crittografica integrale delle catene di eventi e rigenerazione della chiave di numerazione coi caricamenti in corsa.
- Fejalog: nuovo progetto vuoto, configurazione di cartelle e modalità, poi caricamento dei dati. Menu per fasi e Inizio con prossimo passo.
- Acquisti con DDA dichiarati capo per capo, con verifica e ingresso confermati dalla Regia.
- Sito organizzato per problemi risolti, caratteristiche e tutorial, con screenshot BDN di esempio.
- Sito e guida: arricchite le guide e il percorso operativo con le icone dei menu e diagrammi esplicativi.
- Palmare: riconoscimento immediato in Rete della seduta corrispondente al proprio progetto per riunire i dati in caso di caduta Wi-Fi.
- Regia: unione backup superstiti con verifica di coerenza del codice di creazione tra i file selezionati.
- Guida operativa: istruzioni di accoppiamento Bluetooth HID per lettore microchip Allflex AWR250 in dotazione ASL.
- Salvataggio sicuro: condivisione dei backup e report limitata a memoria locale e cloud storage autorizzati (Drive, OneDrive, Dropbox, Nextcloud).
- Provette problematiche: raccomandazione di annotare sulla provetta anche il contrassegno del capo oltre alla sigla problematica.
- Icone dei menu integrate nelle citazioni delle guide per un rapido riconoscimento visivo.

### Correzioni

- Mai due provette con la stessa scritta: con pecore e capre almeno una specie ha la lettera; le etichette delle provette annullate non si riusano; se un collega registra lo stesso capo mentre il foglio di conferma è aperto, avviso bloccante «Controlla subito il capo».
- Lookup corsie esatte nel riordino: distinzione rigorosa tra corsie problematiche e ordinarie con estrazione puntuale delle cifre; eliminata ogni ambiguità tra veterinari diversi (es. Anna CA1 vs Mario CM1) o numeri terminanti con la stessa cifra (1 vs 11). Spunta e 'Persa' agiscono sempre e solo sull'UID corretto senza alterare l'export.
- Rinumerazione e liberazione indici: aggiornamento dello stato provette prima del ripristino dell'uso; i vecchi indici vengono liberati correttamente anche in sequenze concatenate (1-\>2-\>3) o dopo annulli, prevenendo contese fantasma.
- Normalizzazione prefissi in 'Prima della guida': gestione esatta del prefisso corsia/stabilimento; etichette legittime come XP1 sono riconosciute e accettate, mentre prefissi duplicati spuri (XXP1) sono respinti.
- Stabilimenti secondari aggiunti in corsa: inclusione di tutti gli stabilimenti effettivi della seduta nel motore di riordino e nel riquadro dell'export selettivo.
- Guida posizionamento e identità fisica delle provette: nei movimenti della guida e nello schema plateau l'etichetta fisica reale di campo (CM1, P70, XP1) è sempre preservata e ritrovabile nella ricerca rapida anche dopo spostamenti o compattazioni.
- Rinumerazione idempotente e proiezione: la ripetizione di un evento di rinumerazione per il medesimo capo non crea più falsa autocontesa.
- Sicurezza e prevalidazione nei movimenti a mano: protezione completa da overflow numerico sui campi di input e validazione rigorosa dei limiti della serie (1..maxSerie, blocco maschi, rispetto dell'inizio coda problematici).
- Eliminazione spunta anticipata: rimossa la scrittura prematura dell'evento provetta spostata in 'A mano' prima della validazione del motore di calcolo.
- Disambiguazione candidati e invalidazione cache: selezione guidata in caso di corrispondenze multiple con destinazioni discordanti e azzeramento automatico della cache al cambio di seduta.
- Risoluzione integrale rilievi audit 91452f5: eliminazione collisioni da rinomina isolata su numeri automatici, plateau problematici allineati in anteprima e registrazione, e correzione associazione provetta in Messa altrove.
- Protezione etichette automatiche e rinomine: la rinomina manuale non può più occupare numeri potenziali futuri o plateau problematici, prevenendo collisioni sequenziali.
- Riordino multi-stabilimento: lookup rigoroso per stabilimento e origine fisica, proteggendo gli export di tutti gli stabilimenti anche in caso di provette ripetute.
- Gestione collisioni simultanee: tracciamento deterministico degli episodi, permanenza del blocco finché entrambi i veterinari non rinominano e persistenza storica delle note.
- Origine provetta spostata: l'evento di spunta nel riordino salva l'etichetta fisica effettiva visualizzata a video.
- Uniformità orari e interfaccia: formattazione uniforme in ora locale nella cronologia provetta e checklist allineata con età diagnostica modificabile a due passaggi.
- Collisioni simultanee e lavoro da isolato: prelievi offline con suffisso del veterinario; avviso modale obbligatorio di rinomina e nota esplicativa automatica in caso di riutilizzo simultaneo in rete.
- Copertura e statistiche: provette perse escluse dai capi fatti per prevenire falsi 100%, con ricampionamento 'ripetizione\_persa'.
- Campionamento: risolto il bug per cui i campioni prelevati ed eliminati (annullati o esclusi) continuavano a comparire nella lista Ultime e nei filtri operativi.
- Copertura e ricerca: i capi con provetta eliminata o esclusa non vengono più conteggiati come prelevati e possono essere regolarmente ricampionati.
- Interfaccia Ultime provette: disabilitati i pulsanti di modifica/eliminazione sui campioni già annullati, con etichetta chiara di stato.
- Campo note in campionamento: corretta la sovrapposizione della tastiera software con scorrimento automatico al campo e pulsante Fine.

## Versione 0.1.0 · 16/10/2026 { #v0-1-0 }

Prima release pubblica di Fejalog.

[Scarica l'app](https://github.com/uvesco/fejalog-sito/releases/download/v0.1.0/fejalog.apk){ .md-button .md-button--primary }
[Kit di prova](https://github.com/uvesco/fejalog-sito/releases/download/v0.1.0/kit_prova_888TO999.zip){ .md-button }
[Schede da stampare](https://github.com/uvesco/fejalog-sito/releases/download/v0.1.0/schede_kit_prova_888TO999.pdf){ .md-button }

[Pagina della release su GitHub](https://github.com/uvesco/fejalog-sito/releases/tag/v0.1.0)

### Novità

- Numerazione assegnata al caricamento: i numeri da 1 a N sono assegnati in anticipo ai capi presenti in età diagnostica, in ordine alfabetico (fra le pecore, i maschi per primi).
- Età diagnostica e lettera di specie configurabili alla creazione del progetto (profilo di rischio: 6 mesi vagante, 12 mesi stanziale, o tutti i presenti); di default lettera assegnata alla specie meno numerosa.
- I capi non pre-numerati (fuori età, doppi, inserimenti forzati, altri stabilimenti) prendono il codice veterinario e vengono gestiti in rifinitura/fine lavori (i fuori età esclusi di default).
- Libreria delle reti memorizzate (reti.csv) con compilazione rapida, cambio di modalità di rete in corsa dalla Regia, regia d'emergenza se la regia cade, controllo versione build tra dispositivi, unione dei backup dei dispositivi superstiti ed esportazione tabella numerazione (CSV).
- Gli stessi testi della guida, le novità e il foglio per i veterinari sono anche nel sito di Fejalog (uvesco.github.io/fejalog-sito), col tutorial sul kit di prova.
- Fine lavori: lo snippet ARVET aggiunge anche i capi che non sono nell'elenco del campionamento, come «Inserisci capo» (sesso, razza e nascita solo se ARVET non li conosce). Alla fine «Ricarica la pagina coi capi aggiunti» e si incolla di nuovo lo stesso snippet, che controlla i numeri. A mano restano solo i doppi di contrassegno.
- Progetto › Impostazioni › Cartella del progetto: la Regia sceglie se mettere nella cartella del progetto anche i backup (sottocartella backup) e le uscite di fine lavori (snippet, allevatore, fine\_lavori).
- Cartella di lavoro «Fejalog» (meglio sul cloud): Fejalog ci crea la cartella di ogni progetto, codice\_data\_ora/bdn/registri e bdn/contrassegni, e ci archivia i file della BDN usati per crearlo o caricati dopo.
- Progetto › Registri › Fonti del progetto: ogni file con lo stato del caricamento (in uso, più recente da caricare, più vecchio, non caricato); quelli da caricare si spuntano e si caricano.
- Nascita di più di 6 mesi prima per una marca disponibile o un capo non in elenco: il foglio la segnala come anomalia (senza bloccare) e l'elenco delle provette lo dice.
- Cartella di lavoro dei file della BDN (Impostazioni del device): i suoi file .txt e .zip compaiono in Nuovo e in Carica registri, dal più recente, da spuntare e caricare con un tocco.
- Ogni provetta registra come è stato identificato il capo: col lettore di microchip (codice elettronico intero) o col contrassegno intero è certo; scelto fra i contrassegni con le cifre digitate è meno certo, e si sa fra quanti.
- Il foglio di conferma lo dice: in verde se certo, in giallo se scelto fra più contrassegni (controlla l'orecchino).
- Statistiche: la percentuale dei capi letti elettronicamente.
- Nell'export i campi «identificazione» e «candidati».
- Nello zip di fine lavori l'elenco delle provette da inserire a mano in ARVET, con sesso, razza e nascita.
- Progetto › Registri: la tabella riassuntiva dei registri di stalla, con gli allevamenti (o gli stabilimenti) in riga e in colonna pecore, capre, contrassegni pecore, contrassegni capre, e il totale.
- Soluzione problemi per tipologia (smarriti, rubati, usciti, altro stabilimento, marche disponibili, doppi…): per ogni tipologia una regola (in coda con l'ARVET a mano, eliminate, normalizzate) e, provetta per provetta, le eccezioni.
- Regole per i problematici (Progetto › Impostazioni): smarriti e rubati nella serie o fra i problematici e la soluzione di fine lavoro di ogni tipologia. Meglio sceglierle all'inizio; si possono cambiare anche dopo e le provette già fatte si spostano da sole in sistemazione.
- Questa sezione: le novità di ogni versione.
- Provette perse e ritrovate da Ultime, Soluzione problemi e Riordino; una persa non conta come doppio: si ripete il prelievo.
- Crediti nella guida.

### Miglioramenti

- Chiusura buchi su prenumerati prima dei problematici; compattazione maschi ovini dopo i problematici maschi.
- Snippet ARVET lineare da 1 a n con soli numeri interi sequenziali.
- Rilevamento all'avvio dell'eventuale versione di prova Fejalog e guardia anti-doppio tocco sulla conferma provetta.
- Tablet della Regia in orizzontale: le pagine usano tutta la larghezza, in due colonne affiancate. Nel foglio di conferma il capo e il numero a sinistra, le caselle SX, bolo e DX, il sesso e le note a destra; in Statistiche i conteggi a sinistra e i mancanti a destra; in Rete il QR a sinistra e i device a destra.
- Sul tablet, Soluzione problemi mostra a sinistra le tipologie e «Altro da guardare», a destra le provette di quella toccata; il Riordino ha i filtri a sinistra e le provette da spostare a destra.
- Sui telefoni le pagine restano come prima.
- Campionamento: il foglio di conferma si apre dal basso, sopra la ricerca. Annulla e Conferma restano sempre in fondo, anche con la tastiera delle note aperta; si chiude con Annulla, trascinandolo giù o toccando fuori.
- Niente più barra in basso: Ultime (col numero delle provette) e Salva sono icone in cima, accanto al «?»; i risultati della ricerca hanno più spazio. Sui palmari, al posto di Salva, l'icona dell'allineamento del registro: verde se è uguale a quello dei collegati, gialla se si sta allineando.
- Ultime provette è una pagina a sé, con la freccia per tornare e le schede Pecore e Capre. Dopo ogni provetta registrata il messaggio in basso ha anche «Modifica», che porta lì.
- In Campionamento la Rete si apre dal menu o toccando la banda gialla o rossa (in cima c'è posto per Ultime e Salva).
- Interfaccia più standard, seconda parte: le scelte che erano pulsanti con frasi intere sono righe d'elenco con un titolo corto, una riga di spiegazione e la freccia (Progetto › Nuovo, Apri e Recenti; Import/Export; Impostazioni; la creazione dai file della BDN; gli strumenti della Rete).
- Le pagine spiegano in una riga; il resto è nella guida (il «?» in alto a destra). Nella guida sono passati, per esempio, la denuncia di ritrovamento e la causale «F» per smarriti e rubati, il nome dell'export della BDN e dove mettere la cartella di lavoro se il cloud non c'è.
- Import/Export: un riquadro per l'allevatore, uno per la fine lavori, uno per l'export per stabilimento e uno per backup e ripristino; i file si condividono toccando la loro riga.
- Impostazioni: un riquadro per argomento; lo scorrimento fra pecore e capre e le statistiche in tempo reale sono interruttori come nelle impostazioni di Android.
- Recenti: si tocca la riga per riaprire un progetto; quello aperto dice «Aperto».
- Interfaccia più vicina a quella delle altre app Android (Material 3), prima parte.
- Le schede sono schede vere, sotto la barra in cima, con una lineetta sotto quella aperta: Progetto, Statistiche e Pecore e Capre in Campionamento (lì si cambia specie anche scorrendo di lato, come prima).
- Le scelte fra poche voci sono pulsanti a segmenti (Nella serie o Problematici, Femmina o Maschio, ogni quanti eventi il backup…); quelle con tante voci o voci lunghe sono «chip» che vanno a capo (filtri delle provette, razze, ruolo di un registro).
- In cima, a destra, l'icona della Rete accanto al «?»: si tocca per aprire la Rete. Sotto il titolo resta lo stato della rete.
- I messaggi (provetta registrata, backup salvato, errori) compaiono in basso per qualche secondo e si chiudono con la ×; quelli lunghi restano finché non li chiudi. In Campionamento stanno sopra Salva e Ultime.
- Soluzione problemi: «Altro da guardare» è un elenco col numero a destra di ogni voce.
- Niente maiuscole nei pulsanti e nelle etichette (Conferma, Pecore, Presente); i testi dicono «tasto Salva» al posto del dischetto.
- Il foglio di conferma dice di quale stabilimento è un capo di un altro stabilimento («ALTRO STABILIMENTO 888TO888»).
- Il backup di chi lavora da solo finisce con «R», come quello della Regia.
- Versione 0.1.0, quella che uscirà come prima versione pubblica (in prova).
- Aggiornati il nome visibile Fejalog, l'icona e le cartelle di lavoro.
- Le cartelle pubbliche diventano Documenti/Fejalog e Download/Fejalog; la cartella di lavoro sul cloud si sceglie di nuovo (Impostazioni).
- Il sito diventa uvesco.github.io/fejalog, e l'APK fejalog.apk.
- Come si usa: le pagine su registri, regole per i problematici, Soluzione problemi e fine lavori dicono che i capi che non sono nell'elenco di ARVET li aggiunge lo snippet («Inserisci capo»); a mano restano i doppi.
- Fejalog si installa anche su Android 11 (prima serviva Android 12): lo stesso APK per tutti i device.
- Anche per le capre la razza dell'anagrafica scritta in campo si sceglie dall'elenco di ARVET (74 razze caprine), prima quelle del gregge.
- Anagrafica scritta in campo (marca disponibile, capo che non è in nessun registro, inserimento forzato): la razza si sceglie dall'elenco delle razze di ARVET della specie (109 ovine, 74 caprine). In testa quelle dei presenti dello stabilimento, dalla più numerosa, poi le altre in ordine alfabetico; una razza fuori elenco non si conferma.
- Le sigle della BDN dei capi presenti (BLS, o BIE dei registri di stalla) si traducono nella razza di ARVET.
- Fine lavori col motore aggiornato (snippet 2.0).
- Progetto › Impostazioni › File del progetto: si sceglie la cartella di lavoro di questo progetto (senza, vale quella del device) e si vede se si raggiunge.
- Se la cartella non c'è o non si raggiunge, i file in uscita (fonti della BDN, backup, uscite di fine lavori) vanno in Download/Fejalog/\<progetto\>; per quelli in entrata Fejalog chiede di sceglierli («Scegli i file da dove sono»).
- Fine lavori col motore del commit c6249f0 (lo stesso di prima).
- Le copia il device che fa il backup o le uscite, se ha la cartella di lavoro; se la regia passa a un device senza, backup e uscite restano in Documenti/Fejalog come sempre.
- Il messaggio del 💾, di Chiudi e di Esci dice se il backup è stato copiato anche lì.
- Nomi standard dei file: stabilimento, specie, «contrassegni», data e ora (888TO999\_pecore\_2026-10-14\_0930.txt); stabilimento e specie si leggono dentro il file. I file messi nella cartella del progetto, anche dal PC, prendono da soli il nome standard; gli zip si aprono.
- I file presi dalla cartella di lavoro, una volta usati, si spostano nella cartella del progetto.
- Contrassegni di un file che non dice la specie: Fejalog chiede di che specie sono (senza, non si usano); detta, la specie entra nel nome standard del file.
- Elenco «da inserire a mano in ARVET»: sesso, razza e nascita solo per i capi che la BDN non conosce (marca disponibile, non in nessun registro); degli altri ARVET li ha già.
- Guida: un contrassegno non censito è sempre un problematico con l'anagrafica stimata obbligatoria.
- Cartella di lavoro: detto che serve una sottocartella (Android non lascia scegliere tutta Download).
- Messaggio in italiano quando Fejalog non ha il permesso di leggere un file condiviso.
- Razza nel foglio di conferma: a un tocco quelle dello stabilimento; la freccia apre l'elenco, prima le razze dello stabilimento dalla più frequente, poi, dopo uno spazio, le altre in ordine alfabetico.
- Il numero grande del foglio è un po' più piccolo quando c'è l'anagrafica da scrivere, che resta a portata.
- I file della BDN si possono condividere verso Fejalog da OneDrive, dalla posta o da un file manager.
- Il selettore dei file si apre nella cartella dell'ultimo file scelto.
- Guida: come si procede con un contrassegno che non è in nessun registro.
- Icona: provette più alte rispetto alla base del plateau.
- Marca disponibile (contrassegno mai registrato su un capo) o capo che non è in nessun registro caricato: sesso, razza e data di nascita sono obbligatori nel foglio di conferma; senza, la provetta non si conferma.
- Un capo non in elenco già prelevato riprende sesso, razza e nascita date la prima volta.
- Nei doppi contrassegni e nei capi che non tornano, l'avviso e l'elenco delle provette dicono come era stato identificato ogni capo.
- Riordino e guida al riposizionamento: le provette eliminate sono elencate, da togliere dai plateau e mettere da parte.
- I file della BDN si scelgono tutti insieme, anche dentro uno zip: l'app riconosce da sola registri di stalla e contrassegni disponibili, con l'allevamento e la specie.
- La Regia carica registri in qualsiasi momento: il registro aggiornato di uno stabilimento di lavoro (sostituisce quello di prima), un altro stabilimento (i suoi capi fra i problematici) o un acquisto con DDA (i capi acquistati nella serie, con l'ARVET automatico). Arrivano a tutti i device.
- Le provette già fatte seguono i registri nuovi: quelle che diventano problematiche restano al loro numero e in sistemazione vanno in coda; quelle che adesso sono in lista si possono normalizzare.
- Export in formato 4: porta i registri caricati e le soluzioni scelte.
- Le cose da fare per l'allevatore dicono di registrare in BDN gli ingressi degli acquisti con DDA.
- Aspetto nuovo: colori verde salvia, icone moderne, titolo della pagina nella barra in alto, menu a gruppi.
- «Progetto» al posto di «seduta», «palmare» al posto di «Postazione», «Campionamento» al posto di «Lavoro», «Avvio rapido» in fondo al menu.
- Il progetto si gestisce come un file: Nuovo, Apri, Recenti, Chiudi. Porta con sé la rete: riaprendolo, la rete riparte uguale.
- Pagina Rete semplice: QR per entrare, palmari collegati, Pausa, Riprendi, Esci; i palmari rientrano da soli.
- Esci chiude l'app lasciando aperto il progetto; Chiudi chiude il progetto. Il palmare che esce controlla di essere allineato con la Regia.
- Elenco delle provette in parole, con tutti i dati al tocco.
- Plateau uno alla volta, con le coordinate, due affiancati sul tablet.
- Batterie dei device collegati, previsione della durata e avviso alla Regia; meno consumo (statistiche in tempo reale solo se si vuole, o sulla Regia in carica).

### Correzioni

- Corretti testi rimasti coi nomi vecchi («Sessione › Rete», «vai al Lavoro») e la frase che diceva «ARVET a mano» per le provette in coda.
- Registri caricati in corsa: il registro aggiornato delle sole pecore di uno stabilimento non toglie più le sue capre (e viceversa). Prima le capre sparivano dalla ricerca e dalla copertura.
- Razza scritta a mano: l'elenco delle razze non ruba più la tastiera, si scrive tutta la parola e l'elenco si restringe.
- Sul telefono: le schede del Progetto («Apertura», Registri, Impostazioni), i pulsanti del ruolo di un registro, «Problematici» per smarriti e rubati e «Prima della guida» in Riordino › A mano non sono più tagliati; nella tabella dei registri «acquisto con DDA → …» va a capo per parole.
- Tabella dei registri: «—» anche dopo la creazione per uno stabilimento senza file di contrassegni.
- Piccole correzioni di testo: «1 provetta», «1 capo» negli acquisti con DDA, «il progetto intero».
- Su Android 11 la vibrazione (capi ricercati, rete che peggiora) usa il vibratore di sempre.
- Le sigle della BDN si traducono per specie (GRG è GARFAGNINA fra le pecore e GIRGENTANA fra le capre), col codice della tabella di decodifica della BDN o con la sigla dei registri di stalla.
- Condividendo backup, file e testi, Fejalog non propone più sé stesso fra le app.
- Fra le altre razze non compaiono quelle che si vedono solo nell'altra specie (niente razze di capre per una pecora).
- Il sesso si sceglie (niente più «F» già messo), la data si controlla (gg/mm/aaaa, non nel futuro) e sotto la razza ci sono le più frequenti dello stabilimento.
- Correzioni di testo in Soluzione problemi.
- Fine lavori col motore aggiornato: le provette eliminate non hanno numero finale né ARVET, i registri caricati in corsa e gli acquisti con DDA valgono anche lì.
- Corretto: dopo la ripresa da un backup, le impostazioni del progetto cambiate da chi lavora da solo non valevano.
