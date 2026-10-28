# Collegamento al PC Windows via USB

> **A chi serve**: a chi dirige la Regia e vuole lavorare dal PC · **Tempo di lettura**: 4 minuti

**Collega la Regia al PC con un cavo dati USB, attiva Tethering USB su Android e avvia il server in Fejalog.** Nel browser Windows apri l'indirizzo mostrato dall'app e inserisci il PIN. Il tablet resta la Regia: dopo il PIN, sul tablet accetta le modifiche per questa sessione. Gli invii validi si applicano automaticamente, con esiti per riga.

## Cosa serve

- Il progetto aperto sulla Regia, a **campionamento chiuso**.
- Un **cavo dati USB**: un cavo solo ricarica non basta.
- Un PC Windows con Chrome, Edge o Firefox e la connessione di rete USB riconosciuta.

Non occorrono debug USB, ADB, modalità Trasferimento file o programmi Fejalog da installare sul PC. La pagina locale non richiede internet; per accedere ad ARVET il PC deve invece conservare la sua normale connessione alla rete ASL.

!!! info "La voce nell'app"
    **Menu ☰ › Gestione campioni › Collegamento al PC via USB**, solo sulla Regia. Nella pagina trovi il pulsante per le impostazioni Android, il controllo della rete USB, **Avvia server**, l'indirizzo con IP e porta e il PIN. Il **?** apre lo stesso argomento nell'help dell'app. Dalla pagina Rete resta un collegamento alla pagina USB.

!!! info "Se hai una build precedente"
    Il server si trova nel riquadro **Fine lavori sul PC via USB** della pagina **Rete** e si avvia con l'interruttore. Per raggiungerlo anche a campionamento chiuso, tocca l'icona di rete in alto e poi **Pagina Rete**. Attiva prima Tethering USB nelle impostazioni Android e, se serve, premi **Ricontrolla USB**.

## 1. Attiva il tethering sulla Regia

1. Collega fisicamente la Regia al PC con il cavo dati.
2. In Fejalog apri **Gestione campioni › Collegamento al PC via USB** e premi **Apri impostazioni tethering USB**.
3. Nelle impostazioni Android attiva **Tethering USB**, poi torna a Fejalog. Il pulsante apre le impostazioni: l'attivazione la fai lì.
4. Attendi che Windows riconosca la scheda di rete USB. Fejalog ricontrolla gli indirizzi al ritorno dalle impostazioni; se serve premi **Ricontrolla USB**.

| Dispositivo Android | Percorso abituale nelle impostazioni |
|---|---|
| Samsung Galaxy | **Connessioni › Router Wi-Fi e tethering › Tethering USB** |
| Lenovo / Android standard | **Rete e Internet › Hotspot e tethering › Tethering USB** |

I nomi possono cambiare con modello e versione di Android. Se si apre soltanto la pagina generale delle reti, cerca lì «Tethering USB». La voce può restare disabilitata finché il cavo non è collegato a un PC. [Istruzioni Android](https://support.google.com/android/answer/9059108?hl=it), [istruzioni Samsung](https://www.samsung.com/it/support/mobile-devices/come-condividere-la-connessione-dati-con-il-router-wifi-o-il-tethering-di-un-telefono-android/).

## 2. Avvia il server in Fejalog

Quando compare **Connessione di rete USB rilevata**, premi **Avvia server**. Se sono disponibili più indirizzi USB, scegli quello del collegamento al PC.

Dopo l'avvio riuscito la pagina mostra:

- **Server attivo · porta 47801**;
- l'indirizzo completo da aprire sul PC, per esempio `http://192.168.42.129:47801/`;
- il **PIN** per autorizzare il browser;
- **Copia indirizzo**, **Nuovo PIN** e **Ferma server**.

!!! warning "Usa l'indirizzo effettivo mostrato"
    L'IP dell'esempio **non è fisso**: dipende dal dispositivo e può cambiare quando ricolleghi il cavo o riattivi il tethering. Usa l'indirizzo appena mostrato dall'app, completo di `http://` e `:47801/`. Il PIN non è contenuto nel link.

**Copia indirizzo** copia negli appunti del tablet, senza trasferirli automaticamente a Windows. Sul PC puoi digitare il link leggendo lo schermo della Regia. Prima dell'avvio non viene proposto un indirizzo fittizio.

## 3. Apri la pagina dal PC Windows

1. Apri Chrome, Edge o Firefox.
2. Digita **nella barra degli indirizzi** il link mostrato da Fejalog, poi premi Invio.
3. Inserisci il **PIN di 8 cifre** del tablet nei due campi da quattro cifre e autorizza l'accesso. Puoi incollarlo intero, con o senza spazi. La pagina carica il backup corrente della Regia.

**Non usare `https://`, `localhost` o l'IP del computer:** il server si trova sul dispositivo Android. Windows può indicare **Nessun accesso a Internet** sulla scheda USB: questa scritta, da sola, non impedisce la connessione locale a Fejalog.

Puoi usare elenco provette, problemi, confronto coi non prelevati, tardive, statistiche, riordino e uscite finali. Per il 2/33 finale carica anche i modelli di ingresso richiesti. [Strumenti di fine lavori](../strumenti/fine-lavori.md).

## 4. Riporta le modifiche alla Regia

1. Dopo il PIN, sul tablet premi **Accetta le modifiche dal PC per questa sessione** una sola volta.
2. Nel Riordino sul PC usa **Invia** per una riga o **Invia le selezionate** per quelle al numero suggerito. Gli invii validi scrivono eventi nuovi sul tablet; gli scarti restituiscono il motivo. Le altre azioni preparate si inviano da **Esporta per l'app** con **Invia alla Regia sul tablet**.
3. Sul tablet consulta il registro delle modifiche ricevute: ora, azione ed esito. **Interrompi** chiude la sessione.
4. Quando hai finito premi **Ferma server**, disattiva **Tethering USB** in Android e scollega il cavo.

Il PIN è valido **10 minuti** e per **un solo accesso**; dopo l’accesso non si può riutilizzare. Dopo **5 tentativi errati** si rigenera e l’accesso resta sospeso **30 secondi**. Leggi il nuovo PIN sul tablet.

Per collegare un altro browser o ricominciare l’accesso, premi **Nuovo PIN** sulla Regia: invalida la sessione precedente. Anche **Ferma server → Avvia server** rinnova il PIN. La sessione scade dopo **30 minuti di inattività**; gli eventi già applicati restano nel registro. Non occorre spegnere il tablet. Il server può restare avviato mentre passi a un'altra pagina di Fejalog; viene fermato quando il progetto viene chiuso o il dispositivo perde il ruolo di Regia.

## Se il PC non si collega

| Cosa vedi | Cosa controllare |
|---|---|
| **Tethering USB disabilitato nelle impostazioni** | Verifica cavo dati, collegamento al PC e porta USB; prova un altro cavo o un'altra porta. Il solo collegamento per la ricarica non basta. |
| **USB non rilevata in Fejalog** | Attiva davvero Tethering USB, attendi il riconoscimento della rete e premi Ricontrolla USB. Se il problema persiste, il modello o il nome dell'interfaccia USB richiedono una verifica. |
| **Avvia server non disponibile** | Serve un indirizzo di rete USB rilevato. Il Wi-Fi comune con il PC non lo sostituisce. |
| **Errore durante l'avvio** | Controlla il collegamento USB e riprova; verifica che un altro servizio non occupi la porta 47801. |
| **Il browser non raggiunge la pagina** | Controlla Server attivo, IP corrente, `http://` e porta 47801. Verifica la scheda USB in Windows; un proxy o un blocco aziendale richiedono il supporto informatico. |
| **Il PIN viene rifiutato / hai cambiato browser** | Premi Nuovo PIN sulla Regia. Un solo browser è autorizzato alla volta; il PIN precedente non vale più. |
| **Hai scollegato e ricollegato il cavo** | Ricontrolla USB, ferma e riavvia il server e usa il nuovo indirizzo e PIN. |
| **Fejalog funziona, ARVET no** | La pagina Fejalog è locale; verifica separatamente la normale connessione del PC alla rete ASL. |

Per una diagnosi su Windows puoi aprire **PowerShell** e verificare la porta, sostituendo l'IP dell'esempio con quello mostrato dall'app:

```powershell
Test-NetConnection -ComputerName 192.168.42.129 -Port 47801
```

`TcpTestSucceeded : True` indica che la porta risponde. `False` non identifica da solo la causa: ricontrolla server, indirizzo, scheda USB ed eventuali restrizioni. È un controllo facoltativo, non serve per avviare il collegamento. [Documentazione Microsoft](https://learn.microsoft.com/en-us/powershell/module/nettcpip/test-netconnection).

!!! info "Verifiche e limiti"
    Il server, l'accesso con PIN e la sessione delle modifiche hanno test automatici. L’utente ha provato il collegamento fisico sul PC Windows dell’ASL. Il nuovo accesso con PIN è coperto dalle prove automatiche; resta da provare sui dispositivi fisici, anche mantenendo l’accesso ad ARVET. Se il collegamento USB non è disponibile, puoi esportare il backup zip e aprirlo negli strumenti del sito.

Il server ascolta soltanto sull'indirizzo USB selezionato, senza ripiego sul Wi-Fi o apertura a tutte le interfacce. I dati vengono elaborati dal browser e le modifiche tornano al tablet, che le valida prima di scrivere eventi nuovi.

## Pagine collegate

- [Help condiviso con l'app: PC Windows via USB](../riferimento/pcusb.md)
- [Panoramica dopo il campo](../strumenti/index.md)
- [Fine lavori sul computer](../strumenti/fine-lavori.md)
- [Il modello 2/33 finale](../dopo-il-campo/modello-233-finale.md)
