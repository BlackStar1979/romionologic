/* ROMION SIM — spec.js (scalona, zgodna wstecz wersja) */
(() => {
  const ready = (fn) =>
    document.readyState !== 'loading'
      ? fn()
      : document.addEventListener('DOMContentLoaded', fn);

// Print whole page
(function(){
  var btn = document.getElementById('printPage');
  if (btn) btn.addEventListener('click', function(){ window.print(); });
})();
  
  function esc(s){ return String(s).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])); }
  function $(sel, root){ return (root||document).querySelector(sel); }
  function $$(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }

  ready(function(){

    /* ===== 1) highlight.js + KaTeX (bezpiecznie) ===== */
    try {
      if (window.hljs && typeof window.hljs.highlightAll === 'function') {
        window.hljs.highlightAll();
      }
    } catch(e) {}
    try {
      if (window.renderMathInElement) {
        window.renderMathInElement(document.body, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$",  right: "$",  display: false },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true }
          ],
          throwOnError: false
        });
      }
    } catch(e) {}

    /* ===== 2) Loader: .code-box[data-src] oraz code[data-src] ===== */
    (function(){
      var items = $$('.code-box[data-src], code[data-src]');
      items.forEach(function(el){
        var codeEl, url, lang;

        if (el.matches('code[data-src]')) {
          codeEl = el;
          url = el.getAttribute('data-src');
          var m = (codeEl.className||'').match(/language-([a-z0-9]+)/i);
          lang = m ? m[1] : '';
        } else {
          url = el.getAttribute('data-src');
          lang = el.getAttribute('data-lang') || '';
          codeEl = $('pre code', el);
          if (!codeEl) {
            var pre = document.createElement('pre');
            codeEl = document.createElement('code');
            pre.appendChild(codeEl);
            el.appendChild(pre);
          }
          if (lang) codeEl.classList.add('language-'+lang.replace(/^language-/, ''));
        }

        fetch(url, { cache: 'no-store' })
          .then(function(res){ if (!res.ok) throw new Error('HTTP '+res.status); return res.text(); })
          .then(function(txt){
            codeEl.textContent = txt;
            try { if (window.hljs) window.hljs.highlightElement(codeEl); } catch(e){}
          })
          .catch(function(e){
            codeEl.textContent = '// błąd ładowania '+url+': ' + (e.message || e);
          });
      });
    })();

    /* ===== 3) Toolbar: Kopiuj / Zapisz / Drukuj (delegacja) ===== */
    document.addEventListener('click', function(ev){
      var btn = ev.target.closest && ev.target.closest('.code-toolbar .copy, .code-toolbar .save, .code-toolbar .print');
      if (!btn) return;

      var toolbar = btn.closest('.code-toolbar');
      function findCode(){
        var sib = toolbar.nextElementSibling;
        if (sib && (sib.matches('pre') || (sib.classList && (sib.classList.contains('code') || sib.classList.contains('code-box'))))) {
          var c = $('code', sib); if (c) return c;
        }
        var box = toolbar.parentElement && toolbar.parentElement.classList && toolbar.parentElement.classList.contains('code-box') ? toolbar.parentElement : null;
        if (box){ var c2 = $('pre code', box); if (c2) return c2; }
        var scope = toolbar.closest('.card, section, div') || document;
        return $('pre code', scope);
      }
      var code = findCode(); if (!code) return;
      function getText(){ return code.innerText || code.textContent || ''; }

      if (btn.classList.contains('copy')) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(getText()).then(function(){ btn.textContent='✅ Skopiowano'; }, function(){ btn.textContent='❌ Błąd'; });
        } else {
          var ta = document.createElement('textarea'); ta.value = getText(); document.body.appendChild(ta);
          ta.select(); document.execCommand('copy'); ta.remove(); btn.textContent='✅ Skopiowano';
        }
        setTimeout(function(){ btn.textContent='📋 Kopiuj'; }, 1200);
      }
      else if (btn.classList.contains('save')) {
        var fname = (code.getAttribute('data-src') || 'snippet.txt').split('/').pop();
        var blob = new Blob([getText()], { type:'text/plain;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = fname;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function(){ URL.revokeObjectURL(a.href); }, 800);
      }
      else if (btn.classList.contains('print')) {
        var frame = document.createElement('iframe');
        frame.style.position='fixed'; frame.style.right='0'; frame.style.bottom='0';
        frame.style.width='0'; frame.style.height='0'; frame.style.border='0';
        document.body.appendChild(frame);
        frame.contentDocument.open();
        frame.contentDocument.write('<pre style="white-space:pre-wrap;word-break:break-word;">'+esc(getText())+'</pre>');
        frame.contentDocument.close();
        frame.contentWindow.focus();
        frame.contentWindow.print();
        setTimeout(function(){ frame.remove(); }, 1000);
      }
    });

    /* ===== 4) Status GH: istnieje? pusty? „xxx”? ===== */
    (function(){
      var list = document.getElementById('gh-status'); if (!list) return;
      var root = list.getAttribute('data-github-root') || '';
      var items = $$('#gh-status li[data-path]');
      items.forEach(function(li){
        var path = li.getAttribute('data-path');
        if (!$('.path', li)) {
          var left = document.createElement('span');
          left.className = 'path'; left.textContent = path; li.appendChild(left);
        }
        var right = document.createElement('span');
        right.className = 'result'; right.textContent = 'Sprawdzam…'; li.appendChild(right);

        fetch(root + path, { cache: 'no-store' })
          .then(function(res){ if (!res.ok) { right.textContent = 'Brak ('+res.status+')'; right.classList.add('err'); return null; } return res.text(); })
          .then(function(text){
            if (text === null) return;
            text = (text || '').trim();
            var onlyXs = (/^[\sxX]+$/.test(text) && text.replace(/\s/g,'').length >= 3);
            if (!text.length || onlyXs) {
              right.textContent = !text.length ? 'Pusty plik' : 'Zawiera tylko "xxx"';
              right.classList.add('warn');
            } else {
              right.textContent = 'OK';
              right.classList.add('ok');
            }
          })
          .catch(function(){ right.textContent = 'Błąd sieci'; right.classList.add('err'); });
      });
    })();

    /* ===== 5) Przycisk „↑ do góry” (auto) ===== */
    (function(){
      var btn = document.getElementById('toTop');
      if (!btn) {
        btn = document.createElement('button');
        btn.id = 'toTop'; btn.setAttribute('aria-label','Wróć na górę'); btn.textContent = '↑';
        document.body.appendChild(btn);
      }
      var showAt = 300;
      function toggle(){ btn.style.display = (window.scrollY > showAt) ? 'block' : 'none'; }
      toggle(); window.addEventListener('scroll', toggle, { passive:true });
      btn.addEventListener('click', function(){ window.scrollTo({ top:0, behavior:'smooth' }); });
    })();

    /* ===== 6) TOC (panel po prawej) ===== */
    (function(){
      var toc = document.getElementById('toc-float');
      if (!toc) return;
      var links = $$('a[href^="#"]', toc);

      function onScroll(){
        var fromTop = window.scrollY + 120;
        var active = null;
        links.forEach(function(a){
          var sec = document.querySelector(a.getAttribute('href'));
          if (sec && sec.offsetTop <= fromTop) active = a.getAttribute('href');
        });
        links.forEach(function(a){
          if (a.getAttribute('href') === active) a.setAttribute('aria-current','true');
          else a.removeAttribute('aria-current');
        });
      }
      onScroll(); window.addEventListener('scroll', onScroll, { passive:true });

      links.forEach(function(a){
        a.addEventListener('click', function(e){
          var id = a.getAttribute('href'); var target = document.querySelector(id);
          if (!target) return;
          e.preventDefault();
          target.scrollIntoView({ behavior:'smooth', block:'start' });
          history.replaceState(null,'',id);
        });
      });
    })();

    /* ===== 7) Mobile TOC (FAB + bottom-sheet) — tworzy elementy, jeśli brak ===== */
    (function(){
      var fab = document.getElementById('tocFab');
      var sheet = document.getElementById('tocSheet');
      var backdrop = document.getElementById('sheetBackdrop');

      function ensure(){
        if (!fab){ fab = document.createElement('button'); fab.id='tocFab'; fab.textContent='☰ Sekcje'; document.body.appendChild(fab); }
        if (!backdrop){ backdrop = document.createElement('div'); backdrop.id='sheetBackdrop'; document.body.appendChild(backdrop); }
        if (!sheet){
          sheet = document.createElement('div'); sheet.id='tocSheet';
          sheet.setAttribute('role','dialog'); sheet.setAttribute('aria-modal','true');
          sheet.innerHTML = '<h3>Sekcje</h3><nav></nav>'; document.body.appendChild(sheet);
        }
        var nav = $('nav', sheet); nav.innerHTML = '';
        var src = $$('#toc-float a[href^="#"]');
        if (src.length){
          src.forEach(function(a){
            var b = document.createElement('a'); b.href = a.getAttribute('href'); b.textContent = a.textContent.trim(); nav.appendChild(b);
          });
        } else {
          $$('section[id]').forEach(function(sec){
            var a = document.createElement('a');
            a.href = '#'+sec.id; var h = $('h2', sec);
            a.textContent = (h ? h.textContent : sec.id).trim(); nav.appendChild(a);
          });
        }
      }
      ensure();

      function open(){ sheet.style.display='block'; backdrop.style.display='block'; fab.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden'; }
      function close(){ sheet.style.display='none'; backdrop.style.display='none'; fab.setAttribute('aria-expanded','false'); document.body.style.overflow=''; }

      fab.addEventListener('click', function(){ (sheet.style.display==='block') ? close() : open(); });
      backdrop.addEventListener('click', close);
      document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });

      sheet.addEventListener('click', function(e){
        var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
        var target = document.querySelector(a.getAttribute('href')); if (!target) return;
        e.preventDefault(); close();
        target.scrollIntoView({ behavior:'smooth', block:'start' });
        history.replaceState(null,'',a.getAttribute('href'));
      });
    })();

  });
})();
