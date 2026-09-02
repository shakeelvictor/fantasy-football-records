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

// ====== The two-season cap ======
// A player can be kept twice; the third year he goes back in the draft pool.
// Derived from the history above rather than listed, so the note cannot drift
// from the table it sits under — and so next season writes its own.
//
// The clock follows the PLAYER, not the roster: two seasons back-to-back cap
// him even if a different GM kept him the second year. The league ruled this
// in 2026, and the history had been quietly obeying it all along — four
// players changed hands after back-to-back keeps (J.J. Watt 2017, Brandon
// Aiyuk and Justin Jefferson 2023, Cam Akers 2024) and not one was kept a
// third year by his new owner.
//
// A GAP RESETS IT, and that is the part to be careful with. Counting two
// keeper seasons in a career rather than two in a row would unseat six
// keepers the league actually declared — Matthew Stafford and Jameson
// Williams among the 2026 declarations alone, both kept again after a season
// off the keeper sheet.
function keptIn(year) {
  const season = KEEPERS.find(s => s.year === year);
  if (!season) return new Map();
  return new Map(season.owners.flatMap(o => o.picks.map(p => [p.player, o.owner])));
}

function cappedFor(year) {
  const prior = keptIn(year - 2);
  return [...keptIn(year - 1)]
    .filter(([player]) => prior.has(player))
    .map(([player, owner]) => ({
      player,
      owner,
      // Only set when he was kept by someone else the season before, which is
      // the case the rule had to be spelled out for.
      from: prior.get(player) === owner ? null : prior.get(player),
    }));
}

// A capped player's chip names the GM who loses him, and the one he came from
// where those differ — which is the whole reason he is capped after a single
// season on that roster.
function cappedChip(c) {
  const owner = c.from ? `${c.from} \u2192 ${c.owner}` : c.owner;
  return `<span class="team-chip capped">${c.player}<span class="chip-owner">${owner}</span></span>`;
}

function seasonBlock(season) {
  const withPicks = season.owners.filter(o => o.picks.length);
  const without = season.owners.filter(o => !o.picks.length);
  const total = withPicks.reduce((n, o) => n + o.picks.length, 0);
  const capped = cappedFor(season.year);

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
      ${capped.length ? `
        <div class="keeper-capped">
          <span class="keeper-capped-label">No longer eligible</span>
          <div class="chip-row">
            ${capped.map(cappedChip).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// The season after the last one declared. Its capped list is already knowable
// — it is fixed the moment the current year's keepers are in — so the page can
// answer "who is off the board next year" without waiting for the declarations.
function renderOutlook() {
  const el = document.getElementById('keeperOutlook');
  if (!el || !KEEPERS.length) return;

  const year = Math.max(...KEEPERS.map(s => s.year)) + 1;
  const capped = cappedFor(year);
  if (!capped.length) { el.innerHTML = ''; return; }

  el.innerHTML = `
    <div class="keeper-outlook">
      <div class="keeper-season-head">
        <h2>${year}</h2>
        <span class="keeper-count">${capped.length} off the board</span>
      </div>
      <p class="keeper-outlook-lede">
        Kept in both ${year - 2} and ${year - 1}, so they go back in the ${year} draft pool.
        The clock follows the player: two seasons in a row cap him even where a
        different GM kept him the second year.
      </p>
      <div class="chip-row">
        ${capped.map(cappedChip).join('')}
      </div>
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
  renderOutlook();
  renderSeasons();
  setupMobileNav();
});
