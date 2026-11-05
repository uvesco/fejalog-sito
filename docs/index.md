# Fejalog

> **A chi serve**: a tutti · **Tempo di lettura**: 1 minuto

**Dal capo alla provetta, fino all'accettazione per il laboratorio.** Fejalog registra le provette per i prelievi di sangue per la profilassi della brucellosi ovicaprina lavorando su rete Wi-Fi locale autonoma, **anche dove internet non arriva**, fornisce una struttura per la risoluzione dei problemi nei campioni ed agevola il caricamento dell'accettazione per il laboratorio.

---

## Cos'è Fejalog in un minuto

- **Cosa fa**: organizza la registrazione in campo delle provette di sangue. I veterinari cercano i capi con il lettore di microchip Bluetooth o digitando poche cifre sul cellulare che opera come palmare; un tablet (**la Regia**) coordina la squadra, riceve le provette e guida il riempimento dei plateau (rack da 100 pozzetti). A fine giornata riordina i campioni, guida alla soluzione di quelli problematici, consentendo di lavorare dal PC.
- **Per chi è**: per i veterinari dei Servizi Veterinari (è ottimizzata per caricare i dati in Arvet per ASL del Piemonte ma può esportare una tabella di corrispondenza provetta-contrassegno che può essere utilizzata anche in altri sistemi).
- **Cosa NON fa**: **non richiede internet** in campo; non richiede un servizio cloud per campionare; i backup possono andare nella cartella, anche cloud, scelta dalla Regia; **non scrive direttamente in ARVET**.

---

## Quando il gregge non coincide con i registri

**Smarriti o rubati ritrovati, capi che risultano morti o trasferiti, marche non registrate, animali di stabilimenti non campionati:** Fejalog li segnala e distingue le provette problematiche dalle ordinarie. Gestisce anche acquisti con DDA da verificare, fuori età, specie discordante, doppi, capi senza contrassegno e provette perse o non confermate.

!!! info "Dalla segnalazione alla soluzione"
    Il prelievo resta tracciato; la Regia verifica il caso prima del riordino e decide inclusione, esclusione o normalizzazione quando ammessa. **Fejalog non corregge la BDN.**

[**Tutte le anomalie: come riconoscerle e cosa fare**](anomalie.md) · [Provale col kit fittizio](kit.md#quali-anomalie-provare)

---

## Tre percorsi: scegli il tuo ruolo

<div class="grid cards" markdown>

-   :material-needle: **Sono un veterinario**

    ---

    Usi il palmare in campo, cerchi i capi con il lettore o col tastierino, scrivi l'etichetta sulla provetta e consegni al tavolo.

    [:octicons-arrow-right-24: Vai alla scheda in campo](chi-preleva/in-campo.md)

-   :material-tablet-dashboard: **Dirigo la Regia**

    ---

    Coordini la seduta sul tablet, configuri i parametri, ricevi le provette dai colleghi, riempi i plateau e calcoli il fine lavori.

    [:octicons-arrow-right-24: Vai alla checklist responsabile](checklist-responsabile.md)

-   :material-shield-check: **Devo decidere**

    ---

    Valuti l'utilizzo dell'app: garanzie di integrità del dato, destinazione dei backup e limiti operativi da verificare prima dell’adozione.

    [:octicons-arrow-right-24: Leggi la guida per decisori](inizia-qui/ruoli.md)

</div>

---

## Video di introduzione

<div class="fej-scheda" style="padding: 18px 24px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px;" markdown>
:material-video: **Guarda il video introduttivo di 3–4 minuti** con voce sintetica e sottotitoli sulle tre fasi operative e le cinque garanzie:<br>
[:octicons-arrow-right-24: **Apri la pagina dei video e delle micro-guide**](inizia-qui/video.md) · [:material-file-pdf-box: Scarica le diapositive del briefing in PDF (74 KiB)](video/it/briefing_diapositive.pdf).
</div>

---

## I requisiti essenziali

- **Hardware**: telefoni Android 11 o più recente per i veterinari; tablet per la Regia; lettore di microchip Bluetooth (facoltativo); power bank e cavi da 1 m.
- **Rete**: una rete Wi-Fi locale autonoma (hotspot del tablet o router portatile da viaggio), **senza connessione internet**.
- **Materiale da campo**: plateau da 100 pozzetti (10 × 10), provette con margini scelti dalla Regia (valori iniziali 10% + 5% di scorta), aghi, pennarelli indelebili a punta fine, tavolo da lavoro.

Tutti i dettagli e le quantità raccomandate sono descritti in [I requisiti in breve](inizia-qui/requisiti.md) e nelle [Checklist](checklist-veterinari.md).

---

## Le cinque garanzie

Fejalog è progettato attorno a cinque principi architetturali irrinunciabili:

1. **Un numero non si ripete mai**: etichette sempre distinte e allarme in caso di prelievo di un animale con lo stesso contrassegno di uno già prelevato (o doppio prelievo dello stesso animale...).
2. **Niente si cancella**: ogni correzione è un evento nuovo concatenato nel registro.
3. **Tutti i telefoni hanno la stessa storia**: tutti i dispositivi condividono una copia del registro degli eventi.
4. **Ogni doppio si ritrova a fine lavori**: controllo in rete e verifica finale sui registri riuniti di tutti i palmari se dovesse cadere la rete durante il campionamento o isolarsi qualche palmare.
5. **Rete locale senza internet**: è possibile lavorare anche in luoghi remoti senza copertura di rete.

Approfondisci significati pratici, indicatori a schermo e limiti dichiarati in [Le cinque garanzie](inizia-qui/cinque-garanzie.md).

---

## Collegamenti rapidi

- [Le caratteristiche dettagliate](caratteristiche.md)
- [Scarica l'applicazione e il kit](scarica.md)
- [Sotto il cofano: problemi affrontati e architettura](riferimento/sotto-il-cofano/index.md)
- [Guida di riferimento completa](riferimento/index.md)
