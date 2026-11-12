<!-- Pagina generata da Fejalog (ScriviSito) dai testi dell'app: non modificare qui. -->

# Prima della prima provetta (Regia)

## Regole per i problematici

- I capi smarriti (W) e rubati (H, F) dello stabilimento, trovati in campo, vanno sempre fra i problematici: nessun numero preassegnato, secchio dei problematici e coda a fine lavoro (dopo la denuncia di ritrovamento).
- Lettera di specie: con pecore e capre nello stesso progetto almeno una delle due ha la lettera (C o P), di base la meno numerosa; «Nessuna» non si può scegliere, così una pecora e una capra non hanno mai la stessa scritta. Si fissa all'avvio del campionamento. Se una seconda specie arriva in corsa quando era scelta Nessuna, quella ancora senza provette prende automaticamente la sua lettera; le etichette già scritte non cambiano.
- Le soluzioni per le varie tipologie di problematiche (in coda per ARVET o eliminate per escluderle) non si scelgono in anticipo nelle impostazioni: si decidono ex post in Gestione campioni (Problemi da risolvere).

## Capi ricercati

- Sono animali da segnalare quando vengono incontrati, con motivo e istruzioni: per esempio marcare, isolare o verificare un'anomalia. Sono distinti dai capi mancanti al campionamento; il motivo può essere indipendente dalla profilassi.
- Da Configurazione › 3. Dati input › Capi ricercati la Regia aggiunge un capo cercandolo in qualunque registro o fra i contrassegni, oppure scrivendolo a mano. Sono disponibili anche pacchetto e importazione CSV (codice;nota;azione;segno).
- La segnalazione arriva ai palmari con la sincronizzazione. Chi è scollegato la riceve al rientro. Il capo compare in viola e il telefono vibra; chi l'aveva già prelevato riceve l'avviso fino a Visto.

## Archivio e reti del progetto

- La numerazione delle pecore viene salvata in nuovi CSV alla prima assegnazione e dopo modifiche e scambi: nella cartella di progetto se disponibile, sempre anche sul dispositivo. I numeri di campo restano distinti dai finali calcolati.
- Da Configurazione › 1. Parametri e regole › File del progetto scegli una cartella aggiuntiva, anche su chiavetta USB collegata ad Android. Copia i file mancanti verifica le copie presenti senza sovrascriverle. La destinazione aggiuntiva riceve anche backup e uscite prodotti dopo la scelta; se scollegata, le copie restano sul dispositivo.
- La Regia copia il registro sulla chiavetta USB, nella cartella del progetto sotto «registro»: pacchetto.json e un file .jsonl per device; ogni device tiene anche il suo specchio in Documents/Fejalog. Se il tablet si rompe o si perde, da un altro device scegli Riconcilia backup › Da una cartella e indica la chiavetta (puoi aggiungere altre cartelle o zip; lo specchio di un palmare ha solo i file .jsonl, quindi serve insieme alla chiavetta o a un backup col pacchetto): Fejalog ricostruisce il progetto con le stesse verifiche degli zip e lo apre.
- Le reti salvate risiedono nelle Impostazioni dell'app e restano disponibili per tutti i progetti. In Configurazione › 4. Rete del progetto scegli le reti del progetto, in ordine: arrivano ai palmari, e ogni telefono le salva in Android inquadrando il loro QR Wi-Fi prima del lavoro.
- Se il router cade, accendi l'hotspot del tablet (impostazioni di Android, nome e password fissi, già salvati sui telefoni): Android ci sposta da solo i telefoni e Fejalog ritrova la squadra, col tablet come gateway. Se serve, «Passa tutti qui» avvisa i palmari di toccare la rete nel pannello Wi-Fi. Ultima risorsa, il QR della Regia.
- Una sola rete del progetto accesa alla volta: l'ordine delle reti salvate lo sceglie Android, non Fejalog, e con due reti accese i telefoni possono finire su reti diverse. L'hotspot del tablet si accende solo se il router è caduto; quando il router torna, spegni l'hotspot e tutti tornano sul router. Sui telefoni tieni salvate solo le reti del progetto.
- La cartella di lavoro conserva input, impostazioni, backup e uscite. Il lavoro è disponibile offline; le copie non inviate restano sul dispositivo. Da Configurazione › 1. Parametri e regole › File del progetto usa Aggiorna archivio e invia copie pendenti quando la cartella torna raggiungibile.
- La cartella cloud è un archivio: per riprendere il lavoro su un'altra Regia apri esplicitamente il backup. La selezione di cartelle OneDrive dipende dal provider Android e va verificata sul dispositivo; puoi anche scaricare o condividere i file verso Fejalog.

## Backup automatico

- In rete, ogni quanti eventi tutti i device fanno l’istantanea locale (10, 25, 50, 100, 200; di base 25): è un’impostazione del progetto, la cambia la Regia e la vedono tutti.
