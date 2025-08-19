/* ROMION SIM — spec.js (scalona, odporna wersja) */
(() => {
  const ready = (fn) => (document.readyState !== 'loading'
    ? fn()
    : document.addEventListener('DOMContentLoaded', fn));

  const esc = (s) => String(s).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  ready(() => {
    /* ====== 1) Highlight.js & KaTeX (bezpieczne uruchomienie) ====== */
    try { if (window.hljs?.highlightAll) window.hljs.highlightAll(); } catch {}
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
    } catch {}

    /* ====== 2) Loader do kodu: .code-box[data-src] i/lub code[data-src] ====== */
    (async () => {
      try {
        const items = $$('.code-box[data-src], code[data-src]');
        await Promise.all(items.map(async el => {
          let codeEl, url, lang;

          if (el.matches('code[data-src]')) {
            codeEl = el;
            url = el.getAttribute('data-src');
            lang = (codeEl.className.match(/language-([a-z0-9]+)/i) || [,''])[1];
          } else {
            url = el.getAttribute('data-src');
            lang = el.getAttribute('data-lang') || '';
            codeEl = $('pre code', el);
            if (!codeEl) {
              const pre = document.createElement('pre');
              codeEl = document.createElement('code');
              pre.appendChild(codeEl);
              el.appendChild(pre);
            }
            if (lang) codeEl.classList.add('language-' + lang.replace(/^language-/, ''));
          }

          try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const txt = await res.text();
            codeEl.textContent = txt;
            try { window.hljs?.highlightElement(codeEl); } catch {}
          } catch (e) {
            codeEl.textContent = `// błąd ładowania ${url}: ${e.message || e}`;
          }
        }));
      } catch {}
    })();

    /* ====== 3) Toolbar Kopiuj / Zapisz / Drukuj (delegacja) ====== */
    document.addEventListener('click', (ev) => {
      const btn = ev.target.closest('.code-toolbar .copy, .code-toolbar .save, .code-toolbar .print');
      if (!btn) return;

      const toolbar = btn.closest('.code-toolbar');
      const findCode = () => {
        // priorytet: następny pre lub code-box
        let sib = toolbar.nextElementSibling;
        if (sib && (sib.matches('pre') || sib.classList?.contains('code') || sib.classList?.contains('code-box'))) {
          const c = $('code', sib);
          if (c) return c;
        }
        // w kontenerze .code-box
        const box = toolbar.parentElement?.classList?.contains('code-box') ? toolbar.parentElement : null;
        if (box) {
          const c = $('pre code', box);
          if (c) return c;
        }
        // fallback: pierwszy code pod toolbar w jego sekcji/kaflu
        const scope = toolbar.closest('.card, section, div') || document;
        return $('pre code', scope);
      };
      const code = findCode();
      if (!code) return;
      const getText = () => code.innerText ?? code.textContent ?? '';

      if (btn.classList.contains('copy')) {
        (async () => {
          try {
            await navigator.clipboard.writeText(getText());
            btn.textContent = '✅ Skopiowano';
          } catch {
            // fallback bez clipboard API
            const ta = document.createElement('textarea');
            ta.value = getText(); document.body.appendChild(ta);
            ta.select(); document.execCommand('copy'); ta.remove();
            btn.textContent = '✅ Skopiowano';
          }
          setTimeout(() => btn.textContent = '📋 Kopiuj', 1200);
        })();
      }

      if (btn.classList.contains('save')) {
        const fname = (code.getAttribute('data-src') || 'snippet.txt').split('/').pop();
        const blob = new Blob([getText()], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = fname;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 800);
      }

      if (btn.classList.contains('print')) {
        // bez pop-upów: druk do ukrytego iframe
        const frame = document.createElement('iframe');
        frame.style.position='fixed'; frame.style.right='0'; frame.style.bottom='0';
        frame.style.width='0'; frame.style.height='0'; frame.style.border='0';
        document.body.appendChild(frame);
        frame.contentDocument.open();
        frame.contentDocument.write('<pre style="white-space:pre-wrap;word-break:break-word;">'+esc(getText())+'</pre>');
        frame.contentDocument.close();
        frame.contentWindow.focus();
        frame.contentWindow.print();
        setTimeout(() => frame.remove(), 1000);
      }
    });

    /* ====== 4) Status plików z GitHuba (istnieje? pusty? „xxx”?) ====== */
    (() => {
      const list = $('#gh-status');
      if (!list) return;
      const root = list.getAttribute('data-github-root') || '';
      $$('.result', list).forEach(e => e.remove()); // czyść duplikaty

      $$('#gh-status li[data-path]').forEach(async (li) => {
        const path = li.getAttribute('data-path');
        if (!$('.path', li)) {
          const left = document.createElement('span'); left.className = 'path'; left.textContent = path; li.appendChild(left);
        }
        const right = document.createElement('span'); right.className = 'result'; right.textContent = 'Sprawdzam…'; li.appendChild(right);
        try {
          const res = await fetch(root + path, { cache: 'no-store' });
          if (!res.ok) { right.textContent = `Brak (${res.status})`; right.classList.add('err'); return; }
          const text = (await res.text()).trim();
          const onlyXs = (/^[\sxX]+$/.test(text) && text.replace(/\s/g,'').length >= 3);
          if (!text.length || onlyXs) {
            right.textContent = !text.length ? 'Pusty plik' : 'Zawiera tylko "xxx"';
            right.classList.add('warn');
          } else {
            right.textContent = 'OK'; right.classList.add('ok');
          }
        } catch {
          right.textContent = 'Błąd sieci'; right.classList.add('err');
        }
      });
    })();

    /* ====== 5) Przycisk „↑ do góry” (tworzy się, jeśli brak) ====== */
    (() => {
      let btn = $('#toTop');
      if (!btn) {
        btn = document.createElement('button');
        btn.id = 'toTop'; btn.setAttribute('aria-label','Wróć na górę'); btn.textContent = '↑';
        document.body.appendChild(btn);
      }
      const showAt = 300;
      const toggle = () => { btn.style.display = (window.scrollY > showAt) ? 'block' : 'none'; };
      toggle();
      window.addEventListener('scroll', toggle, { passive:true });
      btn.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
    })();

    /* ====== 6) TOC (panel po prawej): podświetlanie + smooth scroll ====== */
    (() => {
      const toc = $('#toc-float');
      const links = toc ? $$('a[href^="#"]', toc) : [];
      if (!links.length) return;
      const onScroll = () => {
        const fromTop = window.scrollY + 120;
        let active = null;
        for (const a of links) {
          const sec = $(a.getAttribute('href'));
          if (sec && sec.offsetTop <= fromTop) active = a.getAttribute('href');
        }
        links.forEach(a => a.toggleAttribute('aria-current', a.getAttribute('href') === active));
      };
      onScroll(); window.addEventListener('scroll', onScroll, { passive:true });

      links.forEach(a => a.addEventListener('click', (e) => {
        const id = a.getAttribute('href'); const target = $(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior:'smooth', block:'start' });
        history.replaceState(null,'',id);
      }));
    })();

    /* ====== 7) Mobile TOC (FAB + bottom sheet). Tworzy elementy, jeśli brak. ====== */
    (() => {
      let fab = $('#tocFab'), sheet = $('#tocSheet'), backdrop = $('#sheetBackdrop');
      const ensure = () => {
        if (!fab) { fab = document.createElement('button'); fab.id='tocFab'; fab.textContent='☰ Sekcje'; document.body.appendChild(fab); }
        if (!backdrop) { backdrop = document.createElement('div'); backdrop.id='sheetBackdrop'; document.body.appendChild(backdrop); }
        if (!sheet) {
          sheet = document.createElement('div'); sheet.id='tocSheet'; sheet.setAttribute('role','dialog'); sheet.setAttribute('aria-modal','true');
          sheet.innerHTML = '<h3>Sekcje</h3><nav></nav>'; document.body.appendChild(sheet);
        }
        // wypełnij listę sekcji — preferuj linki z #toc-float, inaczej zbierz z <section id> i h2
        const nav = $('nav', sheet); nav.innerHTML = '';
        const srcLinks = $$('#toc-float a[href^="#"]');
        if (srcLinks.length) {
          srcLinks.forEach(a => {
            const b = document.createElement('a');
            b.href = a.getAttribute('href');
            b.textContent = a.textContent.trim();
            nav.appendChild(b);
          });
        } else {
          $$('section[id]').forEach(sec => {
            const a = document.createElement('a');
            a.href = '#'+sec.id;
            a.textContent = ($('h2', sec)?.textContent || sec.id).trim();
            nav.appendChild(a);
          });
        }
      };
      ensure();

      const open = () => { sheet.style.display='block'; backdrop.style.display='block'; fab.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden'; };
      const close = () => { sheet.style.display='none'; backdrop.style.display='none'; fab.setAttribute('aria-expanded','false'); document.body.style.overflow=''; };

      fab.addEventListener('click', () => (sheet.style.display==='block' ? close() : open()));
      backdrop.addEventListener('click', close);
      document.addEventListener('keydown', (e) => { if (e.key==='Escape') close(); });

      sheet.addEventListener('click', (e) => {
        const a = e.target.closest('a[href^="#"]'); if (!a) return;
        const target = $(a.getAttribute('href')); if (!target) return;
        e.preventDefault(); close();
        target.scrollIntoView({ behavior:'smooth', block:'start' });
        history.replaceState(null,'',a.getAttribute('href'));
      });
    })();
  });
})();
