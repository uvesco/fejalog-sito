# Il kit di prova

Un **gregge inventato** per provare Fejalog con più device, dal progetto fino agli snippet ARVET. Si scarica da
[Scarica](scarica.md) (`kit_prova_888TO999.zip`); il percorso passo passo è il [tutorial](tutorial/index.md).

Tutto è inventato: stabilimento **888TO999 «AZ. AGR. ESEMPIO»**, contrassegni `IT066000000NNN` e un `FR…`.

## Che cosa c'è

| File | A che cosa serve |
|---|---|
| `bdn/registri/888TO999_pecore_…txt`, `888TO999_capre_…txt` | i registri di stalla dello stabilimento di lavoro: presenti e usciti, con tutti i codici di uscita |
| `bdn/registri/888TO888_pecore_…txt` | il registro del pascolo condiviso: i suoi capi sono «altro stabilimento» |
| `bdn/contrassegni/888TO999_pecore_contrassegni_…txt`, `…_capre_…` | i contrassegni disponibili (marche mai messe su un capo) |
| `pacchetto_888TO999_kit.json` | lo stesso progetto come pacchetto, in alternativa ai file della BDN |
| `ricercati_888TO999.csv` | quattro capi ricercati |
| `in_corsa/888TO777_pecore_…txt` | il registro del **venditore**, da caricare a lavoro in corso come **acquisto con DDA** |
| `in_corsa/888TO999_pecore_…_1100.txt` | il registro di 888TO999 **aggiornato**: …010 risulta venduto |
| `schede_kit_prova_888TO999.pdf` | le **schede da stampare** (A4, 29 pagine), una per capo, divise per tipo |
| `elenco_kit_prova.csv` | ogni scheda: sezione, contrassegno, codice elettronico, anagrafica, cosa deve succedere |

## Il gregge

| Sezione delle schede | Schede |
|---|---|
| Presenti · pecore | 220 |
| Presenti · montoni | 12 |
| Presenti · capre (2 becchi) | 40 |
| Usciti · smarriti e rubati (W, H, F) | 8 |
| Usciti · morti (D, N, Q, Y) | 9 |
| Usciti · trasferiti (V, E, G, I, J, K, P, R, S, T, U) | 22 |
| Usciti · macello (M, A) | 5 |
| Usciti · altre causali (C, L, X, Z) | 8 |
| Altro stabilimento (pascolo condiviso) | 6 |
| Marche disponibili (10 pecore, 5 capre) | 15 |
| In nessun registro | 5 |
| Acquisto con DDA | 6 |
| Specie discordante | 2 |
| Codice elettronico estero | 1 |
| Doppi di contrassegno (seconda lettura) | 3 |
| **Totale** | **362 schede, 359 capi** |

Le usciti sono due per ogni codice di uscita della BDN, più quattro capre. Quattro capi sono ricercati: le loro schede
hanno il bordo viola.

## Come si legge una scheda

- **Col lettore**: il barcode è il **codice elettronico come lo manda il lettore di microchip** (`0380` più 12 cifre;
  il francese `0250…`). Un lettore di barcode in modalità tastiera fa la stessa cosa.
- **A mano**: sul tastierino si digitano le **ultime cifre** del contrassegno, in grassetto sulla scheda.
- Ogni sezione ha in testa **«Cosa deve succedere»**: se Fejalog fa altro, è un errore da segnalare.
