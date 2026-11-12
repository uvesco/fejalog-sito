# Scarica i registri dalla BDN

> **A chi serve**: al responsabile che prepara il risanamento al computer, prima di creare il progetto · **Tempo**: 2 minuti qui, poi lo snippet lavora da solo (circa 10 secondi per allevamento)

Qui si prepara uno **snippet** che, incollato nella BDN, scarica in un solo zip i **registri storici ASCII** (dall'apertura dell'allevamento a oggi) e le **marche disponibili** di tutti gli allevamenti che servono: quelli degli stabilimenti da campionare e, se vuoi, quelli che hanno mandato animali negli stessi **pascoli** (dall'export dello storico pascoli che scarichi tu dalla BDN) o che scrivi a mano. Lo zip si carica così com'è in [Crea il progetto sul sito](crea-progetto.md).

**Come si usa**

1. Scrivi qui sotto i codici degli stabilimenti da campionare; se vuoi, scegli l'export dello storico pascoli (`.gz` o `.xls`) e aggiungi altri allevamenti.
2. Premi **Copia lo snippet**: sono poche righe, che caricano il resto da questo sito. Se dalla BDN il sito non si raggiunge, usa **Scarica lo snippet completo**, aprilo con un editor di testo e incollane tutto il contenuto.
3. Sul **PC** (Chrome o Edge, Windows o Linux), entra nella BDN ovicaprini col tuo ruolo di Servizio Veterinario, apri **Dati › Interrogazioni › Stabilimenti**, poi apri la console (**F12 › Console**), incolla e premi Invio. Chrome alla prima volta può chiedere di scrivere «consenti incolla».
4. Lascia lavorare: un riquadro in alto a destra mostra fase, allevamento e passo in corso, una barra, il tempo e da quanti secondi la BDN non risponde, e i file pronti. Non cambiare pagina in quella scheda.
5. Alla fine arriva `bdn_AAAAMMGG.zip`: dentro i registri (`<stabilimento>_<specie>_<codice fiscale>_AAAAMMGG.txt`), le marche (`marche_…`, solo per chi ne ha a magazzino) e `riepilogo.txt` con quello che è stato scaricato e gli avvisi.

**Da sapere**

- Lo snippet fa solo **letture**, una richiesta alla volta con una pausa, gli stessi passi che faresti a mano: non salva e non modifica niente in BDN. Le interrogazioni risultano fatte dalla tua utenza.
- Nessun dato esce dal browser: né questa pagina né lo snippet mandano file a nessuno.
- **Non funziona su telefono o tablet**: Chrome per Android non ha la console in cui incollare lo snippet. Si usa dal PC.
- I nomi dei file contengono il codice fiscale dell'operatore dell'allevamento: tienili nella cartella del progetto, non condividerli fuori dal servizio.

<noscript>Questa pagina ha bisogno di JavaScript attivo nel browser.</noscript>
<div id="fejalog-scarica-bdn" class="fej-corpo">Caricamento…</div>
<script src="../js/scarica-bdn.js"></script>
<script>
(function () {
  var r = document.getElementById('fejalog-scarica-bdn');
  var base = document.querySelector('script[src$="scarica-bdn.js"]').src.replace(/[^/]*$/, '');
  try { window.FejScaricaBdn.monta(r, { base: base }); } catch (e) { r.textContent = 'Non riesco ad avviare la pagina: ' + (e && e.message ? e.message : e); }
})();
</script>
