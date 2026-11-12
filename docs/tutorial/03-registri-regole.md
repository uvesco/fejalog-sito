# 3 · Regole e archivio del progetto

**Obiettivo:** sapere dove rivedere le scelte della profilassi e dove trovare gli input.

## Rivedi le regole

1. Apri **Configurazione › 1. Parametri e regole**. L’età diagnostica e le lettere sono in testa alla pagina.
2. **Regole per i fuori registro**: smarriti e rubati dello stabilimento vanno **sempre** fra i fuori registro (nessun numero preassegnato). Le soluzioni per le anomalie (in coda o eliminate) si decidono a fine lavoro in Gestione campioni.
3. **Lettera di specie**: con pecore e capre almeno una delle due ha la lettera (C o P); «Nessuna» non si può scegliere, così una pecora e una capra non hanno mai la stessa scritta.
4. Controlla il **backup automatico**: di base un'istantanea ogni 25 eventi in rete (parametro di progetto della Regia) e ogni 10 eventi quando il dispositivo lavora da solo o isolato; tutti i dispositivi scattano inoltre istantanee locali automatiche a ogni pausa, ripresa o uscita dal progetto.

!!! info "Modifiche durante il lavoro"
    Il backup automatico può cambiare anche durante il lavoro. I parametri fissi (lettere di specie, stabilimento principale, verso di riempimento e disposizione dei fuori registro) restano invece congelati dall'avvio; l'età diagnostica è visibile in sola lettura. Le soluzioni per le singole anomalie si decidono a fine lavoro in Gestione campioni.

## Trova i file

Da **Configurazione › 3. Dati input** (Fonti del progetto) controlli gli input e il loro stato: in uso, aggiornati da caricare o non ancora caricati.

- Con una cartella di lavoro disponibile, gli input vengono conservati nella cartella del progetto, sotto `bdn/registri` e `bdn/contrassegni`.
- Senza cartella raggiungibile, restano sul dispositivo, anche in `Download/Fejalog`.
- Gli aggiornamenti si controllano in anteprima e si applicano esplicitamente.

Le cartelle dell'app si configurano in **Impostazioni › Cartelle**, mentre in **Configurazione › 1. Parametri e regole** (sezione File del progetto e copie) controlli lo stato delle copie pendenti e l'eventuale seconda destinazione incrementale su USB. Le numerazioni delle pecore conservano fotografie distinte dopo assegnazioni e scambi.

## Fatto?

- [ ] età diagnostica e regole controllate
- [ ] individuati gli input in Dati
- [ ] scelte le cartelle e le copie desiderate
