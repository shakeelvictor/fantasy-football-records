// ====== Theme ======
// Two states: light (the default) and dark. A reader's choice is remembered per
// browser; with nothing stored the site is light.
//
// Dark is the presence of <html data-theme="dark">, light is its absence — so
// the default needs no attribute at all, and a reader with JavaScript off gets
// light rather than the alternate. A tiny inline script in each page's <head>
// stamps it before first paint so the page never flashes the wrong theme; this
// file only drives the control.
//
// Classic script, like every other file the browser loads here. No modules.

const THEME_KEY = 'fflr-theme';

const THEME_ICONS = {
  light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.1 5.1l1.4 1.4M17.5 17.5l1.4 1.4M18.9 5.1l-1.4 1.4M6.5 17.5l-1.4 1.4"/></svg>',
  dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20 13.5A8.5 8.5 0 0 1 10.5 4a8.5 8.5 0 1 0 9.5 9.5z"/></svg>',
};

function storedTheme() {
  try {
    // Anything other than an explicit 'dark' is the default.
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch (e) {
    // Private browsing, or storage disabled. Fall back to the default.
    return 'light';
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');

  // Keep the browser chrome in step. One meta, set here rather than two
  // media-scoped ones in the markup, which the OS would win control of.
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', theme === 'dark' ? '#0c0c0c' : '#fafafa');
}

function setupTheme() {
  const btn = document.getElementById('themeToggle');
  let theme = storedTheme();

  const paint = () => {
    applyTheme(theme);
    if (!btn) return;
    const next = theme === 'dark' ? 'light' : 'dark';
    btn.innerHTML = THEME_ICONS[theme];
    btn.setAttribute('aria-label', `Switch to ${next} theme`);
    btn.setAttribute('title', `Switch to ${next} theme`);
    btn.setAttribute('aria-pressed', String(theme === 'dark'));
  };

  paint();

  if (btn) {
    btn.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      try {
        // Light is the default, so it clears the key rather than storing one.
        if (theme === 'dark') localStorage.setItem(THEME_KEY, 'dark');
        else localStorage.removeItem(THEME_KEY);
      } catch (e) { /* storage unavailable; the choice still holds for this page */ }
      paint();
    });
  }

  // A choice made in one tab should not leave the others stale.
  window.addEventListener('storage', (e) => {
    if (e.key !== THEME_KEY) return;
    theme = storedTheme();
    paint();
  });
}

/**
 * Publishes the sticky header's real height as --header-h.
 *
 * Anything that has to sit directly below the header needs its true height,
 * and that changes: with the viewport, when a webfont finishes loading, and
 * whenever the header gains a control. Hard-coding it drifts silently — the
 * mobile drawer was pinned at 64px and overlapped a 68px header by 4px the
 * moment the theme control was added.
 */
function trackHeaderHeight() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const set = () => document.documentElement.style
    .setProperty('--header-h', `${Math.round(header.getBoundingClientRect().height)}px`);
  set();
  if (window.ResizeObserver) new ResizeObserver(set).observe(header);
  else window.addEventListener('resize', set);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(set);
}

document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  trackHeaderHeight();
});
