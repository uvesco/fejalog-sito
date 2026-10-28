# Requisiti hardware e software per la Regia

> **A chi serve**: al responsabile della profilassi che prepara i dispositivi e la dotazione della Regia · **Tempo di lettura**: 3 minuti

La Regia è il nodo centrale della profilassi in campo: apre il progetto partendo dai registri BDN, assegna i parametri di seduta, coordina la rete locale, riceve fisicamente le provette al tavolo e riempie i plateau. Per svolgere questo ruolo in sicurezza e senza interruzioni è necessaria una configurazione hardware e software adeguata.

---

## 1. Hardware della postazione Regia

### Il tablet Android
- **Sistema operativo**: Android **11** o superiore.
- **Dimensione dello schermo**: raccomandato un display da almeno **10–11 pollici**. Questa dimensione consente a Fejalog di visualizzare la schermata operativa a **due pannelli affiancati**: a sinistra l'elenco dei veterinari con le provette pronte per «Ricevi», a destra il Plateau interattivo a 100 pozzetti con il riquadro «Metti qui». Sui telefoni o display piccoli i due pannelli vengono separati in schede distinte.
- **Custodia protettiva**: custodia robusta da campo con supporto rigido d'appoggio (stand o leggio) per mantenere lo schermo inclinato, leggibile e stabile sul tavolo anche in presenza di polvere o vento.
- **Autonomia e alimentazione**: la Regia coordina la replica del registro ed è il punto di riferimento per tutta la squadra. Non deve mai spegnersi durante la seduta. Porta un **power bank dedicato** e un cavo adatto; dimensiona la capacità dopo una prova della durata prevista. Una capacità nominale non garantisce una giornata di lavoro.

### La connettività Wi-Fi locale
- **Router da viaggio a batteria** (consigliato) oppure **hotspot Wi-Fi** generato direttamente dal tablet o da un telefono ausiliario.
- **Frequenza radio**: consigliata la banda a **2.4 GHz**, da verificare con una prova di copertura nei punti di lavoro.
- **Nessuna connessione internet**: il router o l'hotspot operano esclusivamente come punto d'accesso locale protetto (WPA2-PSK). Nessun dato transita su internet né su server remoti durante il campionamento (vedi [Le cinque garanzie](../inizia-qui/cinque-garanzie.md)).

### Accessori per la chiusura dei lavori
- **Cavo dati USB**: per il collegamento diretto tra il tablet e il computer dell'ASL o dell'ufficio a fine lavori, sfruttando il tethering USB protetto da PIN (vedi [Regia su PC e tethering](tethering-pc.md)).
  > *Nota di trasparenza*: il collegamento USB è stato provato dall’utente sul PC dell’ASL; il nuovo accesso con PIN resta da provare sui dispositivi fisici.
- **Lettore di microchip Bluetooth** (opzionale): doppio standard FDX-B / HDX (es. Allflex AWR250), utile se la Regia campiona o verifica direttamente al tavolo capi problematici o isolati.

---

## 2. Software e impostazioni di sistema

### Applicazione Fejalog
- Installata sul tablet tramite file APK ([Scarica l'app](../scarica.md)).
- **Preparazione della squadra**: tablet Regia e tutti i palmari dei veterinari devono utilizzare la **stessa identica versione e tipo di build** di Fejalog. Le build di release (`io.github.uvesco.fejalog`) e di debug (`io.github.uvesco.fejalog.debug`) hanno archivi e identificatori distinti: per la prova della squadra usa la stessa build su tutti. Gli archivi delle due app sullo stesso dispositivo sono separati.

### Impostazioni Android sul tablet
Prima di uscire sul campo, verifica i seguenti parametri nelle impostazioni di sistema Android:

1. **Wi-Fi senza internet**: quando il tablet si collega alla rete locale del campo, Android rileva l'assenza di connessione a internet. Se compare la notifica di sistema «Rete senza accesso a Internet», seleziona «Mantieni sempre la connessione» ed escludi il passaggio automatico ai dati mobili.
2. **Batteria senza restrizioni**: apri *Impostazioni › Applicazioni › Fejalog › Batteria* e imposta il profilo su **«Senza restrizioni»** (o «Nessuna ottimizzazione»). Disattiva qualsiasi modalità di risparmio energetico aggressivo del produttore che possa sospendere i servizi di rete in background.
3. **Spegnimento schermo**: imposta il timeout dello schermo su un valore lungo (es. 10 o 30 minuti) oppure mantieni lo schermo attivo mentre il tablet è collegato al power bank, per non dover sbloccare il dispositivo a ogni consegna.
4. **Archivio del progetto**: verifica lo spazio di memoria libero sul dispositivo e configura, se disponibile, una cartella cloud (es. OneDrive o Nextcloud) o una memoria USB per le copie di sicurezza automatiche.

---

## 3. Riepilogo operativo

| Componente | Requisito minimo | Configurazione raccomandata |
|---|---|---|
| **Dispositivo Regia** | Tablet Android 11+ | Tablet 10–11" con schermo panoramico |
| **Alimentazione** | Carica 100% alla partenza | Power bank dimensionato dopo una prova |
| **Rete da campo** | Hotspot del tablet | Router Wi-Fi portatile a batteria (2.4 GHz) |
| **Applicazione** | Fejalog aggiornata | Stessa versione APK su tutti i dispositivi |
| **Internet** | Non richiesta | Disattivata / Nessun collegamento esterno |

---

## Pagine collegate
- [Checklist del responsabile della Regia](../checklist-responsabile.md)
- [Attrezzatura da campo e calcolo materiale](attrezzatura-materiale.md)
- [Stampe pre-campo e calcolo materiale](../strumenti/prima-del-campo.md)
- [Rete locale e gestione dispositivi](rete.md)
