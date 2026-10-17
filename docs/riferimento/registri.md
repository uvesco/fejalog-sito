<!-- Pagina generata da Fejalog (ScriviSito) dai testi dell'app: non modificare qui. -->

# Registri BDN

- Dati › Registri BDN e contrassegni: la tabella di tutti i registri caricati, da dovunque arrivino (file BDN, pacchetto, caricati dopo): in riga gli allevamenti (o gli stabilimenti), in colonna pecore e capre presenti e contrassegni disponibili di pecore e capre, in fondo il totale. «—»: il file non è stato caricato.

## Caricare registri a lavori in corsa (Regia)

- «Scegli i file (anche uno zip)»: registri e contrassegni, l'app li riconosce. Per ogni stabilimento si dice cosa sono:
- Stabilimento di lavoro: il registro nuovo (BDN aggiornata) sostituisce quello di prima.
- Altro stabilimento: i suoi capi vanno fra i problematici.
- Acquisto con DDA: nella conferma di un capo di altro stabilimento il veterinario dichiara il DDA solo per quel capo. La provetta resta problematica.
- In Problemi da risolvere la Regia registra DDA valido o da rifare, con nota. Solo dopo aver confermato l'ingresso registrato può normalizzare la provetta.
- Lo specchietto dell'operatore (allevatore) riporta la verifica del DDA e la registrazione o forzatura dell'ingresso a cura dell'operatore o del delegato. L'app non modifica la BDN.
- I progetti precedenti conservano gli effetti degli acquisti già registrati; i nuovi prelievi richiedono sempre la dichiarazione individuale.

## Cartella di lavoro e fonti

- La cartella di lavoro è la cartella «Fejalog», meglio sul cloud se Android lo propone (Impostazioni del device); altrimenti sul telefono, per esempio Download/Fejalog (Android non lascia scegliere tutta Download). Fejalog ci crea una cartella per ogni progetto, per esempio 888TO999\_2026-10-14\_0930, con bdn/registri e bdn/contrassegni.
- Lì i file della BDN prendono il nome standard: stabilimento, specie, «contrassegni» per i contrassegni, data e ora del file: 888TO999\_pecore\_2026-10-14\_0930.txt, 888TO999\_pecore\_contrassegni\_2026-10-14\_0931.txt. Stabilimento e specie si leggono dentro il file; se un elenco di contrassegni non dice la specie, Fejalog la chiede (finché non la si dice non si usa) e da lì in poi la specie sta nel nome del file.
- Ci finiscono da soli i file usati per creare il progetto e quelli caricati dopo; quelli che ci metti tu (anche dal PC, col cloud) prendono il nome standard quando la Regia apre Dati › Registri BDN e contrassegni. Gli zip si aprono e restano in bdn/zip.
- Dati › Registri BDN e contrassegni › Fonti del progetto: ogni file col suo stato, «in uso», «più recente di quello in uso: da caricare», «più vecchio di quello in uso» o «non caricato». Quelli da caricare si spuntano e «Carica i file spuntati».
- I file lasciati nella cartella di lavoro stessa compaiono in Nuovo e in Carica registri, dal più recente; usati, si spostano nella cartella del progetto.
- Preparazione › Cartelle e copie: la cartella di lavoro di questo progetto su questo device («Scegli per questo progetto»; senza, vale quella del device) e se si raggiunge. Se non c'è o non si raggiunge, i file in uscita vanno in Download/Fejalog/\<progetto\> e quelli in entrata si scelgono a mano («Scegli i file da dove sono»).
- A scelta della Regia, nella cartella del progetto vanno anche i backup (backup) e le uscite di fine lavori: snippet ARVET (snippet), cose da fare e report per l'allevatore (allevatore), il resto e lo zip (fine\_lavori).
- Da OneDrive (anche quando non compare fra le cartelle), dalla posta o da un file manager: si selezionano i file, «Condividi» › Fejalog. Senza progetto aperto si apre Nuovo; col progetto aperto, Carica registri (solo la Regia).
- Senza cartella, il selettore si apre nella cartella dell'ultimo file scelto.

## Un contrassegno che non è in nessun registro

- Si preleva lo stesso: è un problematico, e nel foglio di conferma sesso, razza e data di nascita (stimati) sono obbligatori.
- Con le verifiche in BDN si cerca lo stabilimento d'origine. Se si trova, se ne carica il registro: la provetta resta fra i problematici e prende i dati della BDN; in ARVET lo snippet di fine lavori lo aggiunge col solo contrassegno, perché sesso, razza e nascita ARVET li ha già.
- Se non si trova, la provetta resta fra i problematici coi dati stimati, che lo snippet scrive in ARVET (la razza dall'elenco di ARVET). Lo zip di fine lavori ha anche l'elenco «da inserire a mano in ARVET», che dice per ogni capo se lo aggiunge lo snippet e se l'anagrafica va scritta.
