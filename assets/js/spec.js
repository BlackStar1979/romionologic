// ROMION SIM — strona /sim/spec
// ========== LaTeX (KaTeX auto-render) ==========
function safeInitKatex() {
if (window.renderMathInElement) {
window.renderMathInElement(document.body, {
delimiters: [
{ left: "$$", right: "$$", display: true },
{ left: "$", right: "$", display: false },
{ left: "\\(", right: "\\)", display: false },
{ left: "\\[", right: "\\]", display: true }
],
throwOnError: false
});
}
}


// ========== Sprawdzanie GitHuba (tylko stan plików) ==========
// Oczekiwane HTML:
// <ul id="gh-status" class="gh-status" data-github-root="https://raw.githubusercontent.com/USER/REPO/BRANCH/">
// <li data-path="schema/spec.schema.json"></li>
// <li data-path="examples/min.yaml"></li>
// </ul>
function attachGithubChecks() {
const list = document.getElementById('gh-status');
if (!list) return;


const root = list.getAttribute('data-github-root') || '';
const items = Array.from(list.querySelectorAll('li[data-path]'));


items.forEach(async (li) => {
const path = li.getAttribute('data-path');
const url = root + path;


const left = document.createElement('span');
left.className = 'path';
left.textContent = path;
li.appendChild(left);


const right = document.createElement('span');
right.className = 'result';
right.textContent = 'Sprawdzam…';
li.appendChild(right);


try {
const res = await fetch(url, {
// Uproszczenie – GET (HEAD bywa ograniczany przez CORS na raw.githubusercontent)
method: 'GET',
headers: { 'Accept': 'text/plain' },
cache: 'no-store'
});


if (!res.ok) {
right.textContent = `Brak (${res.status})`;
right.classList.add('err');
return;
}


const text = (await res.text() || '').trim();
if (text.length === 0 || isOnlyXs(text)) {
right.textContent = text.length === 0 ? 'Pusty plik' : 'Zawiera tylko "xxx"';
right.classList.add('warn');
} else {
right.textContent = 'OK';
right.classList.add('ok');
}
} catch (err) {
right.textContent = 'Błąd sieci';
right.classList.add('err');
}
});
}


function isOnlyXs(s) {
// traktuj ciąg składający się wyłącznie z x/X i białych znaków jako "xxx"
return /^[\sxX]+$/.test(s) && s.replace(/[\s]/g, '').length >= 3; // co najmniej trzy znaki x
}
})();
