<!-- Pagina generata da Fejalog (ScriviSito) dai testi dell'app: non modificare qui. -->

# Novità

Le novità di ogni versione pubblicata, dalla più recente. Nell'app, Come si usa › Novità ha anche quelle delle compilazioni di prova.

## Versione 0.2.0 · 21/10/2026

- Versione 0.2.0: fasi del lavoro, Plateau della Regia, riordino guidato dal posto vero delle provette e mai provette con la stessa scritta.
- Fasi del progetto: configurazione, campionamento aperto, campionamento chiuso. I palmari prelevano solo a campionamento aperto e vedono solo ciò che serve; Gestione campioni si apre a campionamento chiuso.
- Plateau della Regia: «Ricevi» le provette di ogni veterinario e lo schema dice in che pozzetto metterle (serie ordinaria o riga del veterinario nei problematici). Il posto, deciso alla consegna, non cambia più fino al riordino.
- Riordino solo a campionamento chiuso, con la guida che parte dal pozzetto vero di ogni provetta e ne mostra l'etichetta; dalla prima spunta il campionamento non si riapre più.
- Mai due provette con la stessa scritta: con pecore e capre almeno una specie ha la lettera; le etichette delle provette annullate non si riusano; se un collega registra lo stesso capo mentre il foglio di conferma è aperto, avviso bloccante «Controlla subito il capo».
- Lettere dei veterinari fino a 15; la lettera, la classifica e gli avvisi seguono la persona (codice fiscale) anche cambiando device.
- Stabilimenti secondari aggiungibili in corsa, con le loro lettere; provette spostabili fra stabilimenti; capi di altri stabilimenti fra i problematici.
- Messaggi della Regia ai palmari e avvisi automatici di avanzamento (25%, 50%, 75%, 100%); statistiche con avanzamento, classifica e stabilimenti.
- Età diagnostica modificabile in corsa dalla Regia con doppia conferma, senza cambiare i numeri già assegnati.
- Smarriti e rubati sempre fra le problematiche; modalità offline con salvataggi locali e riconciliazione dei backup più rigorosa.

## Versione 0.1.0 · 16/10/2026

- Versione 0.1.0: prima release pubblica di Fejalog.
- Numerazione assegnata al caricamento: i numeri da 1 a N sono assegnati in anticipo ai capi presenti in età diagnostica, in ordine alfabetico (fra le pecore, i maschi per primi).
- Età diagnostica e lettera di specie configurabili alla creazione del progetto (profilo di rischio: 6 mesi vagante, 12 mesi stanziale, o tutti i presenti); di default lettera assegnata alla specie meno numerosa.
- I capi non pre-numerati (fuori età, doppi, inserimenti forzati, altri stabilimenti) prendono il codice veterinario e vengono gestiti in rifinitura/fine lavori (i fuori età esclusi di default).
- Chiusura buchi su prenumerati prima dei problematici; compattazione maschi ovini dopo i problematici maschi.
- Snippet ARVET lineare da 1 a n con soli numeri interi sequenziali.
- Libreria delle reti memorizzate (reti.csv) con compilazione rapida, cambio di modalità di rete in corsa dalla Regia, regia d'emergenza se la regia cade, controllo versione build tra dispositivi, unione dei backup dei dispositivi superstiti ed esportazione tabella numerazione (CSV).
- Rilevamento all'avvio dell'eventuale versione di prova Fejalog e guardia anti-doppio tocco sulla conferma provetta.
