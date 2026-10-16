<!-- Pagina generata da Fejalog (ScriviSito) dai testi dell'app: non modificare qui. -->

# Registri di stalla

- Risanamento › Registri: la tabella di tutti i registri caricati, da dovunque arrivino (file BDN, pacchetto, caricati dopo): in riga gli allevamenti (o gli stabilimenti), in colonna pecore e capre presenti e contrassegni disponibili di pecore e capre, in fondo il totale. «—»: il file non è stato caricato.

## Caricare registri a lavori in corsa (Regia)

- «Scegli i file (anche uno zip)»: registri e contrassegni, l'app li riconosce. Per ogni stabilimento si dice cosa sono:
- Stabilimento di lavoro: il registro nuovo (BDN aggiornata) sostituisce quello di prima.
- Altro stabilimento: i suoi capi vanno fra i problematici.
- Acquisto con DDA: i capi presenti dal venditore, o usciti da lì per trasferimento da vivi, vanno nella serie con l'ARVET automatico; nelle cose da fare per l'allevatore c'è da registrare l'ingresso in BDN. Si scrive il motivo («DDA n. 12 del 10/10/2026»).
- «Carica per tutti»: arriva a tutti i device. Le provette già fatte si aggiornano da sole: quelle che diventano problematiche restano al loro numero e in sistemazione vanno in coda; quelle che adesso sono in lista si normalizzano in Soluzione problemi.
- Un registro di un altro stabilimento si ritira finché nessuna provetta l'ha usato; poi il suo ruolo non cambia più.

## Cartella di lavoro e fonti

- La cartella di lavoro è la cartella «Fejalog», meglio sul cloud se Android lo propone (Impostazioni del device); altrimenti sul telefono, per esempio Download/Fejalog (Android non lascia scegliere tutta Download). Fejalog ci crea una cartella per ogni risanamento, per esempio 888TO999\_2026-10-14\_0930, con bdn/registri e bdn/contrassegni.
- Lì i file della BDN prendono il nome standard: stabilimento, specie, «contrassegni» per i contrassegni, data e ora del file: 888TO999\_pecore\_2026-10-14\_0930.txt, 888TO999\_pecore\_contrassegni\_2026-10-14\_0931.txt. Stabilimento e specie si leggono dentro il file; se un elenco di contrassegni non dice la specie, Fejalog la chiede (finché non la si dice non si usa) e da lì in poi la specie sta nel nome del file.
- Ci finiscono da soli i file usati per creare il risanamento e quelli caricati dopo; quelli che ci metti tu (anche dal PC, col cloud) prendono il nome standard quando la Regia apre Risanamento › Registri. Gli zip si aprono e restano in bdn/zip.
- Risanamento › Registri › Fonti del risanamento: ogni file col suo stato, «in uso», «più recente di quello in uso: da caricare», «più vecchio di quello in uso» o «non caricato». Quelli da caricare si spuntano e «Carica i file spuntati».
- I file lasciati nella cartella di lavoro stessa compaiono in Nuovo e in Carica registri, dal più recente; usati, si spostano nella cartella del risanamento.
- Risanamento › Impostazioni › File del risanamento: la cartella di lavoro di questo risanamento su questo device («Scegli per questo risanamento»; senza, vale quella del device) e se si raggiunge. Se non c'è o non si raggiunge, i file in uscita vanno in Download/Fejalog/\<risanamento\> e quelli in entrata si scelgono a mano («Scegli i file da dove sono»).
- A scelta della Regia, nella cartella del risanamento vanno anche i backup (backup) e le uscite di fine lavori: snippet ARVET (snippet), cose da fare e report per l'allevatore (allevatore), il resto e lo zip (fine\_lavori).
- Da OneDrive (anche quando non compare fra le cartelle), dalla posta o da un file manager: si selezionano i file, «Condividi» › Fejalog. Senza risanamento aperto si apre Nuovo; col risanamento aperto, Carica registri (solo la Regia).
- Senza cartella, il selettore si apre nella cartella dell'ultimo file scelto.

## Un contrassegno che non è in nessun registro

- Si preleva lo stesso: è un problematico, e nel foglio di conferma sesso, razza e data di nascita (stimati) sono obbligatori.
- Con le verifiche in BDN si cerca lo stabilimento d'origine. Se si trova, se ne carica il registro: la provetta resta fra i problematici e prende i dati della BDN; in ARVET lo snippet di fine lavori lo aggiunge col solo contrassegno, perché sesso, razza e nascita ARVET li ha già.
- Se non si trova, la provetta resta fra i problematici coi dati stimati, che lo snippet scrive in ARVET (la razza dall'elenco di ARVET). Lo zip di fine lavori ha anche l'elenco «da inserire a mano in ARVET», che dice per ogni capo se lo aggiunge lo snippet e se l'anagrafica va scritta.
