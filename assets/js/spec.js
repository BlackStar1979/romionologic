/* /assets/js/spec.js — wersja scalona, odporna na braki elementów */
(() => {
  'use strict';

  const ready = (fn) =>
    (document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn));

  ready(() => {
    /* ========== highlight.js ========== */
    if (window.hljs && typeof window.hljs.highlightAll === 'function') {
      try { window.hljs.highlightAll(); } catch {}
    }

    /* ========== KaTeX ========== */
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(document.body, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$",  right: "$",  display: false },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true }
          ],
          throwOnError: false
        });
      } catch {}
    }

    /* ========== Loader do kodu: <code data-src> i/lub .code-box[data-src] ========== */
    (async function loadCodeBlocks() {
      const candidates = Array.from(document.querySelectorAll('code[data-src], .code-box[data-src]'));
      await Promise.all(candidates.map(async (el) => {
        let codeEl, url;

        if (el.matches('code[data-src]')) {
          codeEl = el;
          url = codeEl.getAttribute('data-src');
        } else {
          url = el.getAttribute('data-src');
          codeEl = el.querySelector('code');
          if (!codeEl) {
            const pre = document.createElement('pre');
            codeEl = document.createElement('code');
            pre.appendChild(codeEl);
            el.appendChild(pre);
          }
        }

        try {
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const txt = await res.text();
          codeEl.textContent = txt.trim();
          if (window.hljs) window.hljs.highlightElement(codeEl);
        } catch (e) {
          codeEl.textContent = `// błąd ładowania ${url}: ${e.message || e}`;
        }
      }));
    })();

    /* ========== Toolbar przy kodzie (kopiuj/zapisz/drukuj) ========== */
    document.querySelectorAll('.code-toolbar').forEach((tb) => {
      const findCode = () => {
        // najpierw spróbuj w kolejnym pre
        let pre = tb.nextElementSibling;
        if (pre && pre.matches('pre, .code, .code-box')) {
          const c = pre.querySelector('code');
          if (c) return c;
        }
        // fallback: najbliższy code w sekcji
        return tb.parentElement.querySelector('code');
      };

      const code = findCode();
      if (!code) return;
      const getText = () => code.innerText || code.textContent || '';

      const btnCopy = tb.querySelector('.copy');
      if (btnCopy) btnCopy.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(getText()); btnCopy.textContent = '✅ Skopiowano'; }
        catch { btnCopy.textContent = '❌ Błąd'; }
        setTimeout(() => (btnCopy.textContent = '📋 Kopiuj'), 1200);
      });

      const btnSave = tb.querySelector('.save');
      if (btnSave) btnSave.addEventListener('click', () => {
        const fname = (code.getAttribute('data-src') || 'snippet.txt').split('/').pop();
        const blob = new Blob([getText()], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fname;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      });

      const btnPrint = tb.querySelector('.print');
      if (btnPrint) btnPrint.addEventListener('click', () => {
        const w = window.open('', '_blank');
        const esc = (s) => s.replace(/[&<>]/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
        w.document.write('<pre style="white-space:pre-wrap;word-break:break-word;">' + esc(getText()) + '</pre>');
        w.document.close(); w.print(); w.close();
      });
    });

    /* ========== Status plików GH: <ul id="gh-status" data-github-root="..."><li data-path="..."> ========== */
    (function ghStatus() {
      const list = document.getElementById('gh-status');
      if (!list) return;
      const root = list.getAttribute('data-github-root') || '';
      const items = Array.from(list.querySelectorAll('li[data-path]'));
      items.forEach(async (li) => {
        const path = li.getAttribute('data-path');
        const left = document.createElement('span'); left.className = 'path'; left.textContent = path; li.appendChild(left);
        const right = document.createElement('span'); right.className = 'result'; right.textContent = 'Sprawdzam…'; li.appendChild(right);
        try {
          const res = await fetch(root + path, { cache: 'no-store' });
          if (!res.ok) { right.textContent = `Brak (${res.status})`; right.classList.add('err'); return; }
          const text = (await res.text()).trim();
          const onlyXs = (/^[\s xX]+$/.test(text) && text.replace(/\s/g, '').length >= 3);
          if (text.length === 0 || onlyXs) {
            right.textContent = text.length === 0 ? 'Pusty plik' : 'Zawiera tylko "xxx"';
            right.classList.add('warn');
          } else {
            right.textContent = 'OK'; right.classList.add('ok');
          }
        } catch {
          right.textContent = 'Błąd sieci'; right.classList.add('err');
        }
      });
    })();

    /* ========== Strzałka „do góry” (auto-dodawana, jeśli brak w HTML) ========== */
    (function toTopInit() {
      let btn = document.getElementById('toTop');
      if (!btn) {
        btn = document.createElement('button');
        btn.id = 'toTop';
        btn.setAttribute('aria-label', 'Wróć na górę');
        btn.textContent = '↑';
        document.body.appendChild(btn);
      }
      const showAt = 300;
      const toggle = () => { btn.style.display = (window.scrollY > showAt) ? 'block' : 'none'; };
      toggle();
      window.addEventListener('scroll', toggle, { passive: true });
      btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    })();

    /* ========== TOC: podświetlanie aktywnej sekcji + smooth scroll (panel po prawej) ========== */
    (function tocFloat() {
      const toc = document.getElementById('toc-float');
      const links = toc ? Array.from(toc.querySelectorAll('a[href^="#"]')) : [];
      if (!links.length) return;
      const onScroll = () => {
        const fromTop = window.scrollY + 120;
        let active = null;
        for (const a of links) {
          const sec = document.querySelector(a.getAttribute('href'));
          if (sec && sec.offsetTop <= fromTop) active = a.getAttribute('href');
        }
        links.forEach(a => a.toggleAttribute('aria-current', a.getAttribute('href') === active));
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      links.forEach(a => a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', id);
      }));
    })();

    /* ========== Mobile TOC: FAB + bottom sheet (jeśli jest w HTML) ========== */
    (function tocMobile() {
      const fab = document.getElementById('tocFab');
      const sheet = document.getElementById('tocSheet');
      const backdrop = document.getElementById('sheetBackdrop');
      if (!fab || !sheet || !backdrop) return;

      const open = () => {
        sheet.style.display = 'block';
        backdrop.style.display = 'block';
        fab.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      };
      const close = () => {
        sheet.style.display = 'none';
        backdrop.style.display = 'none';
        fab.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      };

      fab.addEventListener('click', () => (sheet.style.display === 'block' ? close() : open()));
      backdrop.addEventListener('click', close);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

      sheet.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
          const id = a.getAttribute('href');
          const target = document.querySelector(id);
          if (!target) return;
          e.preventDefault();
          close();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', id);
        });
      });
    })();
  });
})();
