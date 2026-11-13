<!-- Pagina generata da Fejalog (ScriviSito) dai testi dell'app: non modificare qui. -->

# Creare il progetto sul sito

## Che cosa fa

- La pagina «Crea il progetto sul sito» (Chi dirige › Crea il progetto sul sito) fa al computer gli stessi passi di Nuovo progetto › dai file BDN sul tablet: tutto nel browser, nessun file esce dal PC. Alla fine scarichi lo snapshot per la Regia, un backup di Fejalog che il tablet apre con Progetto › Apri.
- Il progetto aperto dallo snapshot è identico a quello che avresti creato sul tablet con gli stessi file e le stesse scelte: stessa numerazione, stesse impostazioni, stesso pacchetto. Lo snapshot serve sia per il campo vero sia per il tutorial del sito.

## I passi, in ordine

- 0. Riprendi un progetto, se ne hai già preparato uno: il progetto salvato al passo 9 riporta tutto, file della BDN compresi; lo snapshot tutto tranne i file della BDN, da ricaricare al passo 1. Un backup col campionamento già avviato non si riprende.
- 1. File della BDN: registri di stalla e contrassegni disponibili di pecore e capre, anche più file per stabilimento e allevamento, anche in uno zip. Fejalog li riconosce dal contenuto; per i contrassegni senza specie scegli Pecore o Capre.
- 2. Elenco dei veterinari (CSV id;cognome;nome;codice\_fiscale): entra nel pacchetto, mai nel registro.
- 3. Capi ricercati, se servono (CSV codice;nota;azione;segno): la Regia ne aggiunge anche durante il lavoro.
- 4. Stabilimenti di lavoro: il più popoloso è proposto come principale; con più stabilimenti ogni provetta porta la lettera cerchiata del suo stabilimento. Descrizione e data del progetto.
- 5. Regole di numerazione, prima dei registri: con più stabilimenti la lettera anche sul principale (sì o no), età diagnostica (6 mesi, 12 mesi o tutti), lettera di specie (per predefinita sulla specie meno numerosa; con due specie «Nessuna» non vale) e fuori registro in una sola sequenza. Fissano la numerazione: i capi fuori età non si numerano; sul tablet si congelano all'avvio.
- 6. Configurazione della Regia: verso di riempimento, sigle dei veterinari (due lettere non confondibili; vuote, la Regia le assegna all'ingresso), priorità per la regia d'emergenza, reti Wi-Fi del progetto (la password è facoltativa: se non la scrivi non va nel file e la completi sul tablet; le reti si esportano in CSV e si ricaricano negli altri progetti).
- 7. Anteprima: capi numerati per stabilimento e specie, maschi in testa, fuori età, usciti, marche disponibili, e la tabella della numerazione da scaricare (numerazione\_chiave.csv).
- 8. Snapshot per la Regia: scarica lo zip (fejalog\_backup\_\<stabilimento\>\_\<data\>\_sito\_R.zip) e portalo sul tablet.
- 9. Salva il progetto per cambiarlo dopo (un file JSON): contiene i file della BDN, i codici fiscali dei veterinari e le password delle reti, quindi tienilo per te.

## Cambiare un progetto già preparato

- Riprendilo al passo 0, cambia ciò che serve (reti, veterinari, scelte, file della BDN riscaricati il giorno del lavoro) e scarica di nuovo lo snapshot.
- L'anteprima dice se la numerazione è rimasta identica: allora il foglio A3 e i 2/33 già stampati valgono; se è cambiata, ristampali e butta quelli vecchi.
- Un progetto cambiato ha un codice di creazione nuovo: sul tablet apri lo snapshot nuovo, non quello vecchio.

## Sul tablet della Regia

- Menu ☰ › Progetto › Apri, scegli lo zip, «Riprendi»: il progetto si apre uguale a quello del sito. Non c'è nessun device da far uscire: il sito non è un device al lavoro.
- Controlla la Checklist e avvio, apri la rete come Regia e mostra il QR: i palmari entrano come sempre. Età e lettere di specie restano modificabili fino all'avvio, con le regole di sempre; le altre impostazioni si cambiano in Configurazione.
- Lo stesso file apre lo stesso progetto su qualunque tablet; non modificarlo (ogni evento è legato al precedente dal suo hash). Se il progetto è già sul tablet con un pacchetto diverso, il tablet lo rifiuta.
