<!-- Pagina generata da Fejalog (ScriviSito) dai testi dell'app: non modificare qui. -->

# Collegamento al PC Windows via USB

## Prima: sulla Regia

- Chiudi il campionamento dalla Checklist e apri Gestione campioni › Collegamento al PC via USB. Il dispositivo Android resta la Regia; il computer usa la pagina degli strumenti nel browser.
- Collega Regia e PC Windows con un cavo dati USB. Un cavo solo ricarica non basta. Non occorrono debug USB, ADB o la modalità Trasferimento file: serve la connessione di rete Tethering USB.

## 1. Attiva Tethering USB su Android

- Premi Apri impostazioni tethering USB. Il pulsante apre le impostazioni Android: lì attivi tu Tethering USB, poi torni a Fejalog. Se la pagina specifica non è disponibile, si apre la pagina generale delle reti.
- Su Samsung il percorso abituale è Impostazioni › Connessioni › Router Wi-Fi e tethering; su Lenovo Impostazioni › Rete e Internet › Hotspot e tethering. I nomi possono variare; la voce USB si abilita col cavo collegato.
- Attendi che Windows riconosca la scheda di rete USB. Al ritorno dalle impostazioni Fejalog ricontrolla gli indirizzi; se serve premi Ricontrolla USB. La pagina locale non richiede internet sul tablet o sul PC.

## 2. Avvia il server in Fejalog

- Quando compare Connessione di rete USB rilevata, premi Avvia server. Se ci sono più indirizzi USB, scegli quello del collegamento al PC.
- Compaiono Server attivo, la porta 47801, l'indirizzo completo http://IP-del-tablet:47801/ e il PIN. L'IP è quello effettivo del collegamento USB, non un numero fisso; compare soltanto dopo l'avvio riuscito.
- Copia indirizzo mette il link negli appunti del tablet. Non lo trasferisce automaticamente negli appunti di Windows; sul PC puoi digitare l'indirizzo mostrato. Il PIN non fa parte del link.

## 3. Dal PC Windows

- Apri Chrome, Edge o Firefox e digita l'indirizzo nella barra degli indirizzi, incluso http:// e :47801. Non usare https, localhost o l'indirizzo del PC. Inserisci il PIN mostrato dalla Regia e autorizza l'accesso.
- La pagina carica il backup corrente dal tablet. Il server risponde solo sulla connessione USB: la rete Wi-Fi comune, da sola, non basta.
- Windows può indicare Nessun accesso a Internet sulla rete USB: il collegamento locale può comunque funzionare. Per ARVET serve invece mantenere la normale connessione del PC alla rete ASL.

## Riporta le modifiche e termina

- Dopo il collegamento, sul tablet premi Accetta le modifiche dal PC per questa sessione. Ogni invio valido si applica da solo, con esito per riga. Sul tablet il registro delle modifiche ricevute mostra ora, azione ed esito; Interrompi chiude la sessione.
- Il PIN ha 8 cifre in due gruppi di quattro: puoi digitarlo nei due campi del PC o incollarlo intero, con o senza spazi. Vale 10 minuti e per un solo accesso. Dopo cinque errori cambia e si attende 30 secondi.
- Interrompi, Nuovo PIN e Ferma server revocano la sessione. La sessione del browser scade dopo 30 minuti di inattività. Se cambia l’indirizzo USB, ferma e riavvia il server. Alla fine ferma il server, disattiva Tethering USB e scollega il cavo.

## Se non si collega

- USB non rilevata: controlla cavo dati, porta del PC e Tethering USB attivo; attendi e premi Ricontrolla USB. Aprire le impostazioni, da solo, non attiva il collegamento.
- Pagina irraggiungibile: verifica Server attivo e ricopia l'indirizzo corrente, con http e porta 47801. Se Windows non riconosce la rete USB o applica un blocco aziendale, chiedi al supporto informatico; puoi usare il backup zip negli strumenti del sito.
- La connessione fisica con i PC Windows dell'ASL non è ancora stata provata: driver, nomi delle interfacce e accesso contemporaneo ad ARVET vanno verificati sul posto.
