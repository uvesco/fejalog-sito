# Domande

## Requisiti

**Che device servono?** Android **11 o più recente**: un tablet per la Regia e i telefoni dei veterinari. Si lavora
anche con un device solo, o con due telefoni, uno dei quali fa da hotspot e da Regia.

**Serve internet?** No. Serve una Wi-Fi comune, anche senza internet: router da viaggio, Wi-Fi dell'allevamento o
hotspot del tablet. Per scaricare l'app e i file della BDN, e per ARVET, ovviamente sì.

**Che lettori vanno?** Un lettore di microchip Bluetooth che scrive come una tastiera: Fejalog riconosce il codice
elettronico (`380`/`0380` più 12 cifre, anche di altri paesi).

## Privacy

**Dove vanno i dati?** Restano sui device del progetto, passano solo sulla Wi-Fi locale e finiscono nei backup che
salva chi li fa. Fejalog non manda niente su internet, non ha pubblicità né statistiche d'uso.

**Il codice fiscale?** Serve a riconoscere il veterinario e sta nel nome dei backup. Non va sulle provette né negli
export.

## Se qualcosa va storto

La guida di riferimento ha la pagina [Se qualcosa va storto](riferimento/guasti.md). Le più frequenti:

- **Wi-Fi persa** (banda rossa): «Ricollegati». Intanto si lavora con le provette da isolato (riquadro blu per ordinari, rosso per problematici).
- **La Regia si spegne**: gli altri continuano. Dopo 2 minuti la regia è libera e un palmare la prende.
- **Il tablet si rompe**: su un altro device Progetto › Apri da un file (il backup) e subentra come Regia.
- **Impronte diverse** fra i device: aspettare l'allineamento prima della fine lavori.

## Segnalare un problema

Le segnalazioni si aprono nella pagina del progetto su GitHub (uvesco/fejalog-sito, «Issues»). Scrivi che cosa hai
fatto, che cosa ti aspettavi, che cosa è successo, il device con la versione di Android e la versione di Fejalog
(Novità).

!!! warning "Mai dati veri in una segnalazione"
    Le segnalazioni sono pubbliche: niente contrassegni, codici di stabilimenti, nomi o codici fiscali veri. Per
    riprodurre un problema usa il [kit di prova](kit.md).
