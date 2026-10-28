/* Il tasto che nasconde e mostra il menu del sito (la barra a sinistra) sui computer; lo ricorda il browser. */
(function () {
  var inner = document.querySelector('.md-header__inner');
  if (!inner || document.querySelector('.fej-menu-toggle')) return;
  function leggi() { try { return localStorage.getItem('fejalog:senza-menu') === '1'; } catch (e) { return false; } }
  function imposta(v) {
    document.body.classList.toggle('fej-senza-menu', v);
    b.setAttribute('aria-pressed', v ? 'true' : 'false');
    b.title = v ? 'Mostra il menu' : 'Nascondi il menu';
    try { localStorage.setItem('fejalog:senza-menu', v ? '1' : '0'); } catch (e) { /* niente */ }
  }
  var b = document.createElement('button');
  b.type = 'button'; b.className = 'fej-menu-toggle'; b.textContent = '⇤'; b.setAttribute('aria-label', 'Nascondi o mostra il menu del sito');
  b.addEventListener('click', function () { imposta(!document.body.classList.contains('fej-senza-menu')); });
  inner.insertBefore(b, inner.querySelector('.md-header__title') || inner.firstChild);
  imposta(leggi());
})();
