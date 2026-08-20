// ====== Theme ======
// Three states: system (the default), light, dark. A stored choice always beats
// the OS; with nothing stored the site follows the OS and keeps following it if
// the user changes it mid-visit.
//
// The resolved value lives on <html data-theme>, which is what styles.css keys
// off. A tiny inline script in each page's <head> applies it before first paint
// so the page never flashes the wrong theme; this file only handles the control.
//
// Classic script, like every other file the browser loads here. No modules.

const THEME_KEY = 'fflr-theme';
const THEME_MODES = ['system', 'light', 'dark'];

const THEME_ICONS = {
  // Half-filled circle: follow the system.
  system: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none"/></svg>',
  light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.1 5.1l1.4 1.4M17.5 17.5l1.4 1.4M18.9 5.1l-1.4 1.4M6.5 17.5l-1.4 1.4"/></svg>',
  dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20 13.5A8.5 8.5 0 0 1 10.5 4a8.5 8.5 0 1 0 9.5 9.5z"/></svg>',
};

const THEME_LABELS = { system: 'System', light: 'Light', dark: 'Dark' };

function storedThemeMode() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return THEME_MODES.indexOf(v) > -1 ? v : 'system';
  } catch (e) {
    // Private browsing, or storage disabled. Fall back to following the OS.
    return 'system';
  }
}

function prefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Turns a mode into the theme actually shown. */
function resolveTheme(mode) {
  if (mode === 'light' || mode === 'dark') return mode;
  return prefersDark() ? 'dark' : 'light';
}

function applyTheme(mode) {
  const resolved = resolveTheme(mode);
  document.documentElement.setAttribute('data-theme', resolved);

  // Keep the browser chrome in step. One meta, set here rather than two
  // media-scoped ones in the markup, which the OS would win control of.
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', resolved === 'dark' ? '#0c0c0c' : '#fafafa');
  return resolved;
}

function setupTheme() {
  const btn = document.getElementById('themeToggle');
  let mode = storedThemeMode();

  const paint = () => {
    const resolved = applyTheme(mode);
    if (!btn) return;
    const next = THEME_MODES[(THEME_MODES.indexOf(mode) + 1) % THEME_MODES.length];
    btn.innerHTML = THEME_ICONS[mode];
    btn.setAttribute('aria-label', `Theme: ${THEME_LABELS[mode]}. Switch to ${THEME_LABELS[next]}.`);
    btn.setAttribute('title',
      mode === 'system'
        ? `Theme: System (${resolved}) — click for ${THEME_LABELS[next]}`
        : `Theme: ${THEME_LABELS[mode]} — click for ${THEME_LABELS[next]}`);
  };

  paint();

  if (btn) {
    btn.addEventListener('click', () => {
      mode = THEME_MODES[(THEME_MODES.indexOf(mode) + 1) % THEME_MODES.length];
      try {
        // "system" is the absence of a choice, so it clears rather than stores.
        if (mode === 'system') localStorage.removeItem(THEME_KEY);
        else localStorage.setItem(THEME_KEY, mode);
      } catch (e) { /* storage unavailable; the choice still holds for this page */ }
      paint();
    });
  }

  // Follow the OS live, but only while the user has not chosen for themselves.
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => { if (mode === 'system') paint(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  // A choice made in one tab should not leave the others stale.
  window.addEventListener('storage', (e) => {
    if (e.key !== THEME_KEY) return;
    mode = storedThemeMode();
    paint();
  });
}

document.addEventListener('DOMContentLoaded', setupTheme);
