# Tutorial e gregge a schermo

> **A chi serve**: ai veterinari e al responsabile per imparare l'app con una prova completa, prima del campo · **Tempo**: mezz'ora con due o tre telefoni veri

Il sito fa **due cose distinte**:

1. **Tutorial a slide**, in due parti. La prima guida la creazione del progetto con lo strumento [Crea il progetto sul sito](crea-progetto.md) (coi dati fittizi del [kit di prova](../kit.md) o coi tuoi file BDN) fino allo snapshot, alla sua apertura sul tablet della Regia (Progetto › Apri progetto) e all'ingresso dei palmari veri col QR. La seconda spiega la simulazione: come si usa il gregge a schermo e che cosa fare per ogni fattispecie.
2. **Gregge a schermo**: dopo aver caricato i dati di partenza (lo snapshot creato sul sito, un backup, o «Di prova») e scelto le percentuali di errore (profilo realistico predefinito; le voci «stima» sono valori di base, non dalla prova reale), la pagina **presenta gli animali uno alla volta**, come se si prendessero dal gregge: disegno della specie, orecchino destro con **barcode Code 128** da leggere col lettore, sinistro con le cifre. Il veterinario li registra **sul suo device vero**. Più schermi possono dividersi il gregge (parametri $n$ e $k$) senza sovrapposizioni.

Il setup è **assolutamente reale**: app vera, tablet Regia vero col progetto aperto dallo snapshot, palmari veri entrati col QR, Wi-Fi vera (router o hotspot), consegne, chiusura e gestione come in campo. Niente modalità tutorial nell'app, niente parti dell'app o della rete imitate qui: **l'unica cosa simulata è il gregge**.

Le fattispecie che compaiono, ognuna disegnata e descritta a schermo: capo regolare; orecchino destro o sinistro mancante o illeggibile; bolo (barcode sull'addome) e bolo mancante; animale senza orecchini (specie, sesso, dentizione, razza stimata, segno provvisorio); doppio; uscito, smarrito, rubato; altro stabilimento; marca disponibile; contrassegno in nessun registro; sotto età; sesso o razza diversi dalla BDN; cifre abrase; ricercato. Alla fine si scarica la **chiave delle soluzioni** (JSON o CSV) e si carica il backup finale della Regia per il confronto, fattispecie per fattispecie.

<link rel="stylesheet" href="../css/simulatore.css">
<noscript>Questa pagina ha bisogno di JavaScript attivo nel browser per funzionare.</noscript>
<div id="fejalog-simulatore" class="fej-corpo">Caricamento del gregge a schermo…</div>
<script src="../js/carica-simulatore.js"></script>
