/* Shared by every page (index.html, privacy.html, about.html):
   - Applies the saved light/dark theme before first paint (no flash)
   - Wires up the theme toggle button, if the page has one
   - Registers the service worker for offline/PWA support

   This file is intentionally tiny and loaded WITHOUT "defer" so the theme
   attribute is set before the browser paints anything — that's what avoids
   a flash of the wrong theme on load. The rest of the app's logic lives in
   script.js instead, which is only needed on index.html. */
(function () {
  const stored = localStorage.getItem('kko-theme');
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const theme = stored || (prefersLight ? 'light' : 'dark');
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  function updateToggleButton(btn) {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    btn.textContent = isLight ? '🌙' : '☀️';
    btn.setAttribute('aria-label', isLight ? 'สลับเป็นธีมมืด' : 'สลับเป็นธีมสว่าง');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    updateToggleButton(btn);
    btn.addEventListener('click', () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      if (isLight) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('kko-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('kko-theme', 'light');
      }
      updateToggleButton(btn);
    });
  });
})();

// Service workers require a secure context (https, or localhost for testing)
// — this simply won't register on a plain http:// or file:// page, which is
// a browser platform rule, not something we can work around client-side.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // Registration can fail offline on first visit, or if the host doesn't
      // support it — the site still works normally either way, it just won't
      // be installable/offline-capable until registration succeeds.
    });
  });
}
