/* Fejalog · ARVET: «Prelievo effettuato da» con i veterinari intervenuti (utente, 2026-11-21: «uno snippet per la fase di
   impostazione del caricamento in arvet che a partire dalla lista dei vet asl consenta di selezionare quelli intervenuti a
   qualsiasi titolo (anche senza usare devices) per impostarli in tutti gli invii»).
   Si incolla nella console di ARVET, nella pagina «Inserimento campionamento» (Profilassi › Registra campionamenti ›
   nuovo), DOPO aver scritto la «Data prova»: è la data che riempie l'elenco dei veterinari. Seleziona nell'elenco
   «Prelievo effettuato da» i veterinari della configurazione; quelli già selezionati restano. Non preme «Continua» e
   non salva niente: si controlla e si va avanti a mano. Configurazione: window.__ARVET_PRELEVATORI__ =
   { veterinari: [{ cognome, nome }], soloQuesti: false }. Con soloQuesti toglie le altre selezioni. */
(function (w) {
  'use strict';
  var d = w.document;
  var cfg = w.__ARVET_PRELEVATORI__ || {};
  var vet = (cfg.veterinari || []).filter(function (v) { return v && (v.cognome || v.nome); });

  function norm(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
      .replace(/[^A-Z ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function parole(s) { return norm(s).split(' ').filter(Boolean); }
  function contiene(tutte, alcune) { return alcune.every(function (p) { return tutte.indexOf(p) >= 0; }); }

  /* L'elenco: nella pagina nuova si chiama accesso_ids; per sicurezza anche un altro select multiplo di nomi. */
  function trovaElenco() {
    var s = d.getElementById('accesso_ids');
    if (s) return s;
    var multipli = Array.prototype.slice.call(d.querySelectorAll('select[multiple]'));
    return multipli.filter(function (x) { return /accesso|lavorator|operator|prelev/i.test(x.name || x.id || ''); })[0] || null;
  }

  /* Le corrispondenze di un veterinario. Si selezionano da sole solo le esatte: «COGNOME NOME» (o rovesciato), anche senza
     spazi e apostrofi. Le simili (tutte le parole di cognome e nome dentro un nome più lungo, o cognome più la prima parola
     del nome) si elencano da confermare a mano: «ROSSI MARIO» non deve diventare «DE ROSSI MARIO» (revisione 9, P2-4). */
  function esatti(opzioni, v) {
    var c = norm(v.cognome), n = norm(v.nome);
    if (!c || !n) return [];
    var e = opzioni.filter(function (o) { return o.t === norm(c + ' ' + n) || o.t === norm(n + ' ' + c); });
    if (e.length) return e;
    return opzioni.filter(function (o) { var t = o.t.replace(/ /g, ''); return t === (c + n).replace(/ /g, '') || t === (n + c).replace(/ /g, ''); });
  }
  function candidati(opzioni, v) {
    var c = norm(v.cognome), n = norm(v.nome), pc = parole(v.cognome), pn = parole(v.nome);
    var esatti = opzioni.filter(function (o) { return o.t === norm(c + ' ' + n) || o.t === norm(n + ' ' + c); });
    if (esatti.length) return esatti;
    // senza spazi: «DANGELO» per «D'ANGELO», «DE LUCA» per «DELUCA»
    var attaccati = opzioni.filter(function (o) { var t = o.t.replace(/ /g, ''); return t === (c + n).replace(/ /g, '') || t === (n + c).replace(/ /g, ''); });
    if (attaccati.length) return attaccati;
    var tutte = opzioni.filter(function (o) { return contiene(o.p, pc.concat(pn)); });
    if (tutte.length) return tutte;
    return pn.length ? opzioni.filter(function (o) { return contiene(o.p, pc.concat([pn[0]])); }) : [];
  }

  function abbina(sel, veterinari) {
    var opzioni = Array.prototype.map.call(sel.options, function (o, i) { return { i: i, t: norm(o.text), p: parole(o.text), testo: o.text.trim() }; });
    var esito = { scelti: [], nonTrovati: [], ambigui: [] }; // ambigui: simili o più d'uno, da scegliere a mano
    veterinari.forEach(function (v) {
      var nome = ((v.cognome || '') + ' ' + (v.nome || '')).trim();
      var e = esatti(opzioni, v);
      if (e.length === 1) { esito.scelti.push({ vet: nome, opzione: e[0].i, testo: e[0].testo }); return; }
      var c = e.length ? e : candidati(opzioni, v);
      if (!c.length) esito.nonTrovati.push(nome);
      else esito.ambigui.push({ vet: nome, testi: c.map(function (o) { return o.testo; }) });
    });
    return esito;
  }

  function pannello(html) {
    var vecchio = d.querySelector('[data-fejalog-pannello="prelevatori"]');
    if (vecchio) vecchio.remove();
    var p = d.createElement('div');
    p.setAttribute('data-fejalog-pannello', 'prelevatori');
    p.style.cssText = 'position:fixed;top:8px;right:8px;z-index:100000;background:#fff;border:2px solid #2e5e3e;border-radius:8px;padding:10px 12px;' +
      'font:13px system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.25);width:420px;max-width:92vw;max-height:80vh;overflow:auto;color:#222';
    p.innerHTML = '<button type="button" title="Chiudi" style="position:absolute;top:2px;right:6px;border:0;background:none;font-size:22px;cursor:pointer;color:#444">×</button>' +
      '<b>Fejalog · Prelievo effettuato da</b><div style="margin-top:6px">' + html + '</div>';
    p.querySelector('button').onclick = function () { p.remove(); };
    d.body.appendChild(p);
    return p;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function esegui() {
    if (!vet.length) { console.log('Fejalog: manca l’elenco dei veterinari (window.__ARVET_PRELEVATORI__). Prepara lo snippet dalla pagina del sito.'); return null; }
    var sel = trovaElenco();
    if (!sel) {
      pannello('Qui non trovo l’elenco «Prelievo effettuato da». Apri ARVET › Profilassi › Registra campionamenti › nuovo campionamento, scrivi la <b>Data prova</b> e incolla di nuovo lo snippet.');
      return null;
    }
    if (!sel.options.length) {
      pannello('L’elenco «Prelievo effettuato da» è vuoto: scrivi prima la <b>Data prova</b> (e premi Tab), poi incolla di nuovo lo snippet.');
      return null;
    }
    var esito = abbina(sel, vet);
    if (cfg.soloQuesti) Array.prototype.forEach.call(sel.options, function (o) { o.selected = false; });
    esito.scelti.forEach(function (s) { sel.options[s.opzione].selected = true; });
    try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) { /* vecchi browser */ }
    if (w.jQuery) { try { w.jQuery(sel).trigger('change'); } catch (e) { /* niente */ } }
    try { sel.scrollIntoView({ block: 'center' }); } catch (e) { /* niente */ }
    var selezionati = Array.prototype.filter.call(sel.options, function (o) { return o.selected; }).length;
    var html = '<div>Selezionati ' + esito.scelti.length + ' di ' + vet.length + ' veterinari' + (selezionati > esito.scelti.length ? ' (in tutto ' + selezionati + ' selezionati nell’elenco)' : '') + ':</div>' +
      '<div style="margin-top:4px">' + esito.scelti.map(function (x) { return esc(x.testo); }).join(', ') + '</div>';
    if (esito.nonTrovati.length) html += '<div style="margin-top:6px;color:#a00"><b>Non trovati in ARVET</b> (sceglili a mano, tenendo premuto Ctrl): ' + esito.nonTrovati.map(esc).join(', ') + '</div>';
    if (esito.ambigui.length) html += '<div style="margin-top:6px;color:#a60"><b>Da confermare a mano</b> (nome simile o più d’uno: tieni premuto Ctrl e scegli tu): ' +
      esito.ambigui.map(function (a) { return esc(a.vet) + ' → ' + a.testi.map(esc).join(' / '); }).join('; ') + '</div>';
    html += '<div style="margin-top:6px;color:#555">Non salva niente: controlla l’elenco e premi tu «Continua». Per gli altri invii (capre, maschi) incolla lo stesso snippet dopo aver scritto la Data prova.</div>';
    pannello(html);
    w.__ARVET_PRELEVATORI_ESITO__ = esito;
    return esito;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { norm: norm, abbina: abbina, candidati: candidati };
  if (d && d.body && !w.__ARVET_PRELEVATORI_SOLO_FUNZIONI__) esegui();
})(typeof window !== 'undefined' ? window : this);
