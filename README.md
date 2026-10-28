# Fejalog · sito

Il sito di **Fejalog**, l'app Android per registrare in campo le provette della profilassi della brucellosi
ovicaprina, con più device su una Wi-Fi locale, fino agli snippet per ARVET.

**Il sito: <https://uvesco.github.io/fejalog-sito/>**. Lì ci sono il tutorial col kit di prova, la guida, le novità e
gli snippet ARVET. L'app e il kit si scaricano dalle [versioni](https://github.com/uvesco/fejalog-sito/releases).

Questo repository contiene solo il sito (MkDocs Material) e le versioni pubblicate. Le pagine sono generate dal
progetto di Fejalog, quindi non vanno modificate qui: le correzioni si segnalano nelle Issues.

Le segnalazioni sono pubbliche: **mai dati veri** (contrassegni, codici di stabilimenti, nomi, codici fiscali). Per
riprodurre un problema c'è il kit di prova, con dati inventati.

Prova in locale: `pip install -r requirements.txt && mkdocs serve`.

---

## Struttura del sito (sei sezioni)

La navigazione del sito è organizzata in sei sezioni principali tramite schede superiori (`navigation.tabs`) e voci laterali:

`ScriviSito` aggiorna i blocchi fra i marcatori `chi-preleva`, `chi-dirige` e `riferimento` in `mkdocs.yml`.
Le altre voci restano manuali; la rigenerazione ne conserva ordine e contenuto.

1. **Inizia qui**: panoramica rapida, caratteristiche, cinque garanzie, requisiti essenziali, percorsi per ruolo e scaricamento dell'app;
2. **Chi preleva**: percorso pratico per i veterinari ai palmari (checklist, preparazione del telefono, briefing a 11 diapositive, scheda in campo, risoluzione imprevisti);
3. **Chi dirige (la Regia)**: postazione di coordinamento (checklist responsabile, requisiti hardware/software, attrezzatura e calcolo materiale, stampe pre-campo e QR Wi-Fi, rete, consegne plateau e tethering USB con PC);
4. **Dopo il campo**: strumenti di chiusura (fine lavori sul computer, quadratura provette e statistiche, riconciliazione backup, modello 2/33 finale, snippet ARVET);
5. **Provalo**: simulazione con dati fittizi del kit (888TO999) in tre modalità (solo browser, telefoni fisici, emulatori), prove di incidenti programmati e tutorial in 16 lezioni;
6. **Riferimento**: guida di riferimento completa dell'applicazione (27 sezioni generate direttamente dall'app), ARVET e snippet, novità, domande frequenti e «Sotto il cofano: problemi affrontati e architettura».

---

## Predisposizione multilingua (i18n)

Attualmente il sito è pubblicato esclusivamente in lingua italiana (`it`). La configurazione e i sorgenti sono interamente predisposti per l'aggiunta di altre lingue (es. inglese, francese, spagnolo) senza richiedere riscritture architetturali:

1. **Nessun testo cablato**:
   Non sono presenti testi in italiano hardcodati nei template o nei layout di MkDocs fuori dai titoli delle voci di menu in `mkdocs.yml`. I controlli di tema e navigazione usano le variabili native del tema Material (`language: it`).

2. **Aggiunta di una nuova lingua**:
   Per abilitare il supporto multilingua:
   - Installare l'estensione standard `mkdocs-static-i18n` (aggiungendola a `sito/requirements.txt`);
   - Configurare il plugin in `sito/mkdocs.yml`:
     ```yaml
     plugins:
       - search
       - i18n:
           default_language: it
           languages:
             it:
               name: Italiano
               build: true
             en:
               name: English
               build: true
     ```
   - Creare i file tradotti affiancandoli a quelli italiani con suffisso di lingua (es. `docs/index.en.md`, `docs/chi-preleva/in-campo.en.md`), preservando la corrispondenza 1:1 dei percorsi senza duplicare alberi di directory.

3. **Pagine generate dall'app**:
   Le pagine della guida (`docs/riferimento/`), i testi del briefing e delle checklist sono generati deterministicamente dal modulo comune `shared/.../guida/` tramite `./gradlew :shared:scriviSito`. Quando verranno aggiunte le traduzioni nel dominio Kotlin, il generatore produrrà direttamente i file localizzati corrispondenti (es. `docs/riferimento/lavoro.en.md`).

4. **Video, audio e trascrizioni per lingua**:
   - I file multimediali compressi (.mp4) andranno posizionati in cartelle dedicate per lingua: `sito/docs/video/it/` e `sito/docs/video/en/`.
   - I sottotitoli in formato WebVTT (.vtt) andranno posizionati accanto ai video o nella cartella sottotitoli con codice lingua esplicito (es. `panoramica.it.vtt`, `panoramica.en.vtt`).
   - Le trascrizioni testuali complete restano incluse direttamente nelle rispettive pagine Markdown.
   - Tutti i file video e audio restano memorizzati direttamente nel repository, senza dipendenze da server di terze parti o piattaforme esterne.
