// ====== Keeper History ======
const YEARS = KEEPERS.map(s => s.year).sort((a, b) => b - a);

// Derived, never typed — the span grows on its own as seasons are added.
(function renderKeeperEyebrow() {
  const el = document.getElementById('keeperEyebrow');
  if (!el || !KEEPERS.length) return;
  const years = KEEPERS.map(s => s.year);
  const first = Math.min(...years);
  const last = Math.max(...years);
  el.textContent = `${first}–${last} · ${KEEPERS.length} Season${KEEPERS.length === 1 ? '' : 's'}`;
})();
let activeYear = 'all';

function seasonBlock(season) {
  const withPicks = season.owners.filter(o => o.picks.length);
  const without = season.owners.filter(o => !o.picks.length);
  const total = withPicks.reduce((n, o) => n + o.picks.length, 0);

  return `
    <div class="keeper-season" id="season-${season.year}">
      <div class="keeper-season-head">
        <h2>${season.year}</h2>
        <span class="keeper-count">${total} keeper${total === 1 ? '' : 's'} · ${withPicks.length}/${season.owners.length} GMs</span>
      </div>
      <div class="keeper-grid">
        ${withPicks.map(o => `
          <div class="keeper-card">
            <div class="keeper-owner">${o.owner}</div>
            <ul class="keeper-picks">
              ${o.picks.map(p => `
                <li>
                  <span class="keeper-player">${p.player}</span>
                  <span class="round-badge ${/FA/.test(p.round) ? 'fa' : ''}">${p.round}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
      ${without.length ? `
        <div class="keeper-none">
          <span class="keeper-none-label">No keepers</span>
          <div class="chip-row">
            ${without.map(o => `<span class="team-chip">${o.owner}</span>`).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderSeasons() {
  const wrap = document.getElementById('keeperSeasons');
  const summary = document.getElementById('filterSummary');
  const shown = activeYear === 'all'
    ? [...KEEPERS].sort((a, b) => b.year - a.year)
    : KEEPERS.filter(s => s.year === Number(activeYear));

  wrap.innerHTML = shown.map(seasonBlock).join('');

  const keeperTotal = shown.reduce(
    (n, s) => n + s.owners.reduce((m, o) => m + o.picks.length, 0), 0
  );
  summary.textContent = activeYear === 'all'
    ? `Showing all ${shown.length} seasons · ${keeperTotal} keepers`
    : `Showing ${activeYear} · ${keeperTotal} keepers`;
}

function renderYearPills() {
  const wrap = document.getElementById('yearPills');
  const years = ['all', ...YEARS];
  wrap.innerHTML = years.map(y => `
    <button class="era-tab year-pill ${String(y) === String(activeYear) ? 'active' : ''}"
            data-year="${y}"
            aria-pressed="${String(y) === String(activeYear)}">
      ${y === 'all' ? 'All Years' : y}
    </button>
  `).join('');

  wrap.querySelectorAll('.year-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      activeYear = btn.dataset.year;
      syncHash();
      renderYearPills();
      renderSeasons();
    });
  });
}

// Keep the selected year in the URL so a filtered view is linkable/shareable.
function syncHash() {
  const hash = activeYear === 'all' ? ' ' : `#${activeYear}`;
  history.replaceState(null, '', activeYear === 'all' ? location.pathname : hash);
}

function readHash() {
  const y = location.hash.replace('#', '');
  if (YEARS.includes(Number(y))) activeYear = y;
}

// Publish the sticky header's real height so the filter bar can sit flush
// under it regardless of font loading or viewport width.

// ====== Mobile Nav ======
function setupMobileNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('siteNav');
  if (!toggle || !nav) return;

  const close = () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
}

document.addEventListener('DOMContentLoaded', () => {
  readHash();
  renderYearPills();
  renderSeasons();
  setupMobileNav();
});
