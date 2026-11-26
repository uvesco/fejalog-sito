/* Il rigioco delle azioni salvate in un Web Worker (24/11, la memoria della sessione sopravvive agli aggiornamenti del sito):
   la pagina resta libera mentre qui si rifanno da capo, col codice di adesso, le azioni sul backup. Serve a due cose:
   - «verifica»: la pagina è già ripartita dalla memoria scritta da un'altra versione del sito; qui si controlla che le azioni
     salvate passino tutte anche col codice nuovo e diano gli stessi eventi;
   - «rigioco»: la memoria non c'è o non vale; qui si rifanno le azioni e la pagina riparte dalla memoria che ne esce.
   Messaggi dalla pagina: {tipo: 'avvia', base, zip: ArrayBuffer, azioni, modo, prefisso?: {n, memoria}, controllo?} e {tipo: 'ferma'}.
   Risposte: {tipo: 'avanzamento', fatte, totale}, {tipo: 'fatto' | 'fermato', fatte, totale, memoria, tenute, rifiutate, firma},
   {tipo: 'errore', messaggio}. Niente ?. e ?? (browser datati). */
'use strict';
self.window = self; // i moduli del sito guardano anche window
var fermare = false, caricato = false;
self.onmessage = function (ev) {
  var m = ev.data || {};
  if (m.tipo === 'ferma') { fermare = true; return; }
  if (m.tipo !== 'avvia') return;
  fermare = false; // un lavoro nuovo (anche «Riprendi» dopo «Ferma»)
  try {
    if (!caricato) {
      ['vendor/fejalog-shared.js', 'dominio.js', 'vendor/motore.js', 'vendor/xlsx.js', 'vendor/fine_lavori.js', 'zip.js', 'registro.js', 'progetto.js', 'azioni.js']
        .forEach(function (f) { importScripts(m.base + f); });
      self.FejAzioni.configuraDriver(self.FineLavori);
      caricato = true;
    }
    // le prove accendono l'interruttore di controllo delle memorie (ogni riuso confrontato col ricalcolo da capo)
    if (m.controllo) self['fejalog:shared'].io.github.uvesco.fejalog.prova.controlloMemoSessioneSito(true);
  } catch (e) { self.postMessage({ tipo: 'errore', messaggio: 'Non riesco a caricare il codice: ' + e.message }); return; }
  var azioni = m.azioni || [];
  self.FejProgetto.leggiBackup(m.zip).then(function (P) {
    var b = P._banco, da = 0;
    // «Riprendi» dopo «Ferma»: si riparte dalle azioni già rifatte, con la memoria che questo stesso codice aveva dato
    if (m.prefisso && m.prefisso.n > 0 && b.ripristina(azioni.slice(0, m.prefisso.n), m.prefisso.memoria)) da = m.prefisso.n;
    var totale = azioni.length;
    function fine(tipo, fatte) {
      var mem = b.memoria();
      var rifiutate = (mem.passi || []).filter(function (p) { return !p.applicata; }).map(function (p) {
        return { id: p.id, tipo: p.azione && p.azione.tipo, motivo: p.rifiuto ? p.rifiuto.motivo : '' };
      });
      // la firma degli eventi letti: la pagina controlla che siano quelli del progetto aperto (revisione, P1-1)
      var firma = (P.eventi || []).map(function (e) { return String(e.hash); }).sort().join(',');
      self.postMessage({ tipo: tipo, fatte: fatte, totale: totale, memoria: mem, tenute: b.azioni(), rifiutate: rifiutate, firma: firma });
    }
    (function passo(i) {
      if (fermare) { fine('fermato', i); return; }
      if (i >= totale) { fine('fatto', i); return; }
      try { b.applicaSalvate([azioni[i]]); } catch (e) { self.postMessage({ tipo: 'errore', messaggio: e.message }); return; }
      self.postMessage({ tipo: 'avanzamento', fatte: i + 1, totale: totale });
      // un giro dell'evento fra un'azione e l'altra: così arriva il «Ferma»
      setTimeout(function () { passo(i + 1); }, 0);
    })(da);
  }, function (e) { self.postMessage({ tipo: 'errore', messaggio: 'Non riesco a leggere il backup: ' + e.message }); });
};
