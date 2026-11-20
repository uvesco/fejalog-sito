/* Il file della BDN per Fejalog (dopo il campo del 16/11, utente 2026-11-20: «unificare gli snippet BDN in una sola query e un
   solo json da caricare, sia in entrata sia in uscita»). Lo snippet unico (bdn-unico-motore.js) dà un file `fejalog-bdn` v1 con
   le tre parti: la verifica dei contrassegni (`fejalog-verifica-bdn`), le uscite per modello (`fejalog-uscite-modello`) e gli
   ingressi per modello (`fejalog-ingressi-modello`). Qui si separa nelle parti, che il dominio conosce già; gli ingressi
   diventano capi vivi nello stabilimento d'arrivo, nel formato della verifica, così entrano nell'anagrafe del progetto come
   gli altri capi trovati in BDN (nessun formato nuovo nel registro). Si leggono anche i file di una parte sola. Niente ?. e ?? */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FejBdnFile = factory();
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';
var FORMATO = 'fejalog-bdn';
function norma(c) { return String(c == null ? '' : c).replace(/\s+/g, '').toUpperCase(); }
function chiaveData(g) { var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(g || '').trim()); return m ? m[3] + m[2] + m[1] : ''; }

/** Il testo di un file della BDN → { formato, verifica, uscite, ingressi } (le parti che mancano sono null). */
function scomponi(testo) {
  var o;
  try { o = typeof testo === 'string' ? JSON.parse(testo.replace(/^﻿/, '')) : testo; } catch (e) { throw new Error('Il file non è un risultato della BDN (JSON non valido).'); }
  if (!o || typeof o !== 'object') throw new Error('Il file non è un risultato della BDN.');
  var r = { formato: o.formato || '', verifica: null, uscite: null, ingressi: null, errori: Array.isArray(o.errori) ? o.errori.map(String) : [] };
  function errori(parte, nome) {
    ((parte && parte.errori) || []).forEach(function (x) { var t = nome + ': ' + x; if (r.errori.indexOf(t) < 0 && r.errori.indexOf(String(x)) < 0) r.errori.push(t); });
  }
  if (o.formato === FORMATO) {
    if (o.versione !== 1) throw new Error('Versione ' + o.versione + ' del file della BDN non conosciuta: aggiorna la pagina.');
    r.verifica = o.verifica || null; r.uscite = o.uscite || null; r.ingressi = o.ingressi || null;
  } else if (o.formato === 'fejalog-verifica-bdn') r.verifica = o;
  else if (o.formato === 'fejalog-uscite-modello') r.uscite = o;
  else if (o.formato === 'fejalog-ingressi-modello') r.ingressi = o;
  else throw new Error('Il file non è un risultato della BDN (formato «' + (o.formato || '') + '»).');
  // gli stabilimenti non letti delle uscite e degli ingressi (sessione scaduta, BDN lenta): mai un «nessuna uscita» falso (revisione 8)
  errori(r.uscite, 'uscite'); errori(r.ingressi, 'ingressi');
  ((r.verifica && r.verifica.risultati) || []).forEach(function (x) { if (/sessione BDN è scaduta/.test(x.errore || '') && r.errori.indexOf('verifica: ' + x.errore) < 0) r.errori.push('verifica: ' + x.errore); });
  return r;
}

/**
 * Gli ingressi come risultato della verifica (`fejalog-verifica-bdn` v1): per ogni capo arrivato con un modello, un capo VIVO
 * nello stabilimento d'arrivo. Si saltano i capi [noti] («contrassegno», o «stabilimento|contrassegno» per i registri) e quelli
 * ripartiti dopo con un modello d'uscita ([usciti]): in BDN non sono più lì.
 */
function ingressiComeVerifica(fileIngressi, noti, usciti) {
  var visti = {}; (noti || []).forEach(function (c) { visti[norma(c)] = true; });
  // ripartito vuol dire uscito dallo stesso stabilimento d'arrivo: un passaggio fra due stabilimenti di lavoro ha l'uscita
  // dall'altro con la stessa data, e il capo deve entrare (revisione 8)
  var fuori = {}; (usciti || []).forEach(function (u) { var c = norma(u.stabilimento) + '|' + norma(u.contrassegno); if (!fuori[c] || chiaveData(u.data) > chiaveData(fuori[c].data)) fuori[c] = u; });
  var risultati = [], saltati = { noti: 0, ripartiti: 0 };
  ((fileIngressi && fileIngressi.ingressi) || []).forEach(function (g) {
    var c = norma(g.contrassegno), u = fuori[norma(g.stabilimento) + '|' + c];
    if (!c) return;
    if (visti[c] || visti[norma(g.stabilimento) + '|' + c]) { saltati.noti++; return; }
    if (u && chiaveData(u.data) >= chiaveData(g.data)) { saltati.ripartiti++; return; }
    visti[c] = true;
    risultati.push({ contrassegno: c, etichette: '', errore: '', marca: null, capi: [{ codice: c, sesso: g.sesso || '', razza: g.razza || '',
      specie: g.specie === 'capre' ? 'CAPRINI' : 'OVINI', nascita: g.nascita || '', precedente: '', elettronico: norma(g.elettronico), stato: 'VIVO',
      stabilimento: norma(g.stabilimento), ingresso_modello: String(g.modello || ''), ingresso_data: String(g.data || '') }] });
  });
  return { risultati: risultati, saltati: saltati };
}

/**
 * La verifica da caricare: quella dello snippet più gli ingressi, un contrassegno una volta sola (prima la verifica). null se
 * non c'è niente. [noti]: «stabilimento|contrassegno» dei capi già nei registri del progetto.
 */
function verificaConIngressi(parti, noti) {
  var v = parti.verifica, risultati = v && v.risultati ? v.risultati.slice() : [];
  var ing = ingressiComeVerifica(parti.ingressi, noti || [], parti.uscite && parti.uscite.uscite);
  // un contrassegno sia verificato sia arrivato con un modello: la BDN non aggiornata lo dà ancora dal venditore, e vale
  // l'ingresso (revisione 8). La marca resta.
  var perCodice = {}; risultati.forEach(function (r, i) { perCodice[norma(r.contrassegno)] = i; });
  var nuovi = [], sostituiti = 0;
  ing.risultati.forEach(function (x) {
    var i = perCodice[x.contrassegno];
    if (i == null) { nuovi.push(x); return; }
    var r = risultati[i], c = x.capi[0];
    // l'ingresso vale se la BDN non trova il capo o lo dà ancora vivo altrove; se lo dà morto o uscito, vale la verifica (è dopo)
    var capi = r.capi || [], vivoAltrove = capi.length === 1 && String(capi[0].stato || '').toUpperCase() === 'VIVO' && norma(capi[0].stabilimento) !== c.stabilimento;
    if (!capi.length || vivoAltrove) { risultati[i] = Object.assign({}, r, { capi: x.capi, errore: '' }); sostituiti++; }
  });
  ing.saltati.verificati = ing.risultati.length - nuovi.length - sostituiti;
  risultati = risultati.concat(nuovi);
  if (!risultati.length) return { file: null, ingressi: 0, sostituiti: 0, saltati: ing.saltati };
  var timbro = (v && v.timbro) || (parti.ingressi && parti.ingressi.timbro) || '';
  var arrivati = nuovi.length + sostituiti;
  return { file: { formato: 'fejalog-verifica-bdn', versione: 1, timbro: timbro + (arrivati && v ? ' + ingressi' : arrivati ? ' ingressi' : ''),
    cercati: (v ? v.cercati || 0 : 0) + nuovi.length, risultati: risultati }, ingressi: arrivati, sostituiti: sostituiti, saltati: ing.saltati };
}

return { FORMATO: FORMATO, scomponi: scomponi, ingressiComeVerifica: ingressiComeVerifica, verificaConIngressi: verificaConIngressi, norma: norma };
});
