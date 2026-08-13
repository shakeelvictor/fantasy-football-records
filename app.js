// ====== Champions ======
function renderChampions(filter = 'all') {
  const grid = document.getElementById('championsGrid');
  const list = filter === 'all' ? DATA.champions : DATA.champions.filter(c => c.era === filter);
  const sorted = [...list].sort((a, b) => b.year - a.year);
  grid.innerHTML = sorted.map(c => {
    const [winPts, losePts] = c.score ? c.score.split('–').map(s => s.trim()) : [null, null];
    return `
    <div class="champion-card ${c.year === 2025 ? 'gold' : ''}">
      <div class="champion-year">
        <span>${c.year}</span>
        <span class="era-badge ${c.era}">${c.era === 'mfl' ? 'MFL' : 'Yahoo!'}</span>
      </div>
      <div class="matchup">
        <div class="matchup-side winner">
          <div class="matchup-label">
            <span class="trophy">★</span> Champion
          </div>
          <div class="matchup-name">${c.champ}</div>
          <div class="matchup-meta">
            <span class="seed">#${c.seed} seed</span>
            ${winPts ? `<span class="points">${winPts}</span>` : ''}
          </div>
        </div>
        <div class="matchup-divider"><span>def.</span></div>
        <div class="matchup-side">
          <div class="matchup-label">Runner-Up</div>
          <div class="matchup-name">${c.runnerUp}</div>
          <div class="matchup-meta">
            <span class="seed">#${c.runnerSeed} seed</span>
            ${losePts ? `<span class="points">${losePts}</span>` : ''}
          </div>
        </div>
      </div>
      ${!c.score && c.note ? `<div class="champion-note">${c.note}</div>` : ''}
    </div>
  `;
  }).join('');
}

// ====== Pakistan vs. the World ======
// Week 18 exhibition — the league's Pro Bowl. Each side fields one combined
// super lineup of its managers' best players, equal size on both sides. The
// per-GM line is that manager's contribution to it: players sent, points
// returned. Manager counts differ between sides and don't matter; lineups
// are what's equal, so that's what the header shows.
function renderExhibition() {
  const tally = document.getElementById('seriesTally');
  const list = document.getElementById('exhibitionList');
  if (!tally || !list) return;

  const meetings = [...DATA.exhibition].sort((a, b) => b.year - a.year);
  const won = (name) => meetings.filter(m => m.winner === name).length;

  tally.innerHTML = `
    <div class="series-side ${won('Pakistan') > won('World') ? 'leading' : ''}">
      <div class="series-name">Pakistan</div>
      <div class="series-count">${won('Pakistan')}</div>
    </div>
    <div class="series-divider">
      <span class="series-label">All-Time Series</span>
      <span class="series-state">${won('Pakistan') === won('World') ? 'All square' : 'Series lead'}</span>
    </div>
    <div class="series-side ${won('World') > won('Pakistan') ? 'leading' : ''}">
      <div class="series-name">the World</div>
      <div class="series-count">${won('World')}</div>
    </div>
  `;

  const sideHtml = (side, label, isWinner) => `
    <div class="ex-side ${isWinner ? 'won' : ''}">
      <div class="ex-side-head">
        <span class="ex-side-name">${label}</span>
        <span class="ex-side-total">${side.total.toFixed(2)}</span>
      </div>
      <div class="ex-side-meta">${side.players} players from ${side.roster.length} managers</div>
      <ul class="ex-roster">
        ${side.roster.map(r => `
          <li${r.players === 0 ? ' class="blank"' : ''}>
            <span class="ex-gm">${r.gm}</span>
            <span class="ex-count">${r.players === 0 ? 'none' : r.players === 1 ? '1 player' : r.players + ' players'}</span>
            <span class="ex-pts">${r.points.toFixed(2)}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;

  list.innerHTML = meetings.map(m => `
    <div class="exhibition-card">
      <div class="ex-year">
        <span>${m.year}</span>
        <span class="ex-result">${m.winner} by ${m.margin.toFixed(2)}</span>
      </div>
      <div class="ex-sides">
        ${sideHtml(m.pakistan, 'Pakistan', m.winner === 'Pakistan')}
        ${sideHtml(m.world, 'the World', m.winner === 'World')}
      </div>
    </div>
  `).join('');
}

// ====== Leaderboards ======
function renderLeaderboard(elId, items, valueKey = 'count', valueRenderer = null) {
  const ul = document.getElementById(elId);
  const sorted = [...items].sort((a, b) => b[valueKey] - a[valueKey]);
  ul.innerHTML = sorted.map((item, i) => {
    const isTop = i === 0;
    const value = item[valueKey];
    const valueText = valueRenderer ? valueRenderer(item) : value + (item.note || '');
    return `
      <li class="${isTop ? 'top-rank' : ''}">
        <span class="rank ${isTop ? 'top' : ''}">${String(i + 1).padStart(2, '0')}</span>
        <span class="gm-name">${item.gm}</span>
        <span class="gm-value">${valueText}</span>
      </li>
    `;
  }).join('');
}

// ====== Living Totals ======
// Leaderboard totals are the frozen baseline through 2025 (data.js) plus
// everything recorded since in weekly-log.js.
function gmOf(entry) {
  return typeof entry === 'string' ? entry : entry.gm;
}

function tally(baseline, gms) {
  const totals = new Map(baseline.map(row => [row.gm, { ...row }]));
  gms.forEach(gm => {
    if (!GMS.includes(gm)) {
      console.warn(`weekly-log.js: "${gm}" isn't in GMS — check the spelling.`);
    }
    const row = totals.get(gm);
    if (row) row.count += 1;
    else totals.set(gm, { gm, count: 1 });
  });
  return [...totals.values()];
}

function weeklyWinsTotals() {
  const winners = WEEKLY_LOG.map(w => w.winner).filter(Boolean);
  return tally(DATA.weeklyWinsBaseline, winners);
}

function bigGamesTotals() {
  const scorers = WEEKLY_LOG.flatMap(w => (w.big || []).map(gmOf));
  return tally(DATA.bigGamesBaseline, scorers);
}

// ====== Records ======
const TROPHY_SVG = `<svg class="trophy-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <path d="M20 6h24v10c0 7-5 12-12 12s-12-5-12-12V6z" fill="currentColor"/>
    <path d="M14 10H8v4c0 5 4 9 9 9h3v-3h-3c-3 0-6-3-6-6v-1h3V10z" fill="currentColor"/>
    <path d="M50 10h6v4c0 5-4 9-9 9h-3v-3h3c3 0 6-3 6-6v-1h-3V10z" fill="currentColor"/>
    <rect x="28" y="28" width="8" height="10" fill="currentColor"/>
    <rect x="20" y="38" width="24" height="4" rx="1" fill="currentColor"/>
    <rect x="16" y="44" width="32" height="6" rx="2" fill="currentColor"/>
  </svg>`;

function renderRecords() {
  const grid = document.getElementById('recordsGrid');
  grid.innerHTML = DATA.records.map(r => `
    <div class="record-card ${r.trophy ? 'has-trophy' : ''}">
      ${r.trophy ? TROPHY_SVG : ''}
      <div class="record-label">${r.label}</div>
      <div class="record-value">${r.value}</div>
      <div class="record-holder">${r.holder}</div>
      <div class="record-context">${r.context}</div>
      ${r.prev ? `<div class="record-prev">${r.prev}</div>` : ''}
    </div>
  `).join('');
}

// ====== Tidbits ======
function renderTidbits() {
  const ul = document.getElementById('tidbitsList');
  ul.innerHTML = DATA.tidbits.map(t => `<li>${t}</li>`).join('');
}

// ====== Seasons ======
function renderSeasons() {
  const wrap = document.getElementById('seasonsList');
  const sorted = [...DATA.seasons].sort((a, b) => b.year - a.year);
  wrap.innerHTML = sorted.map(s => `
    <div class="season-row">
      <div class="season-year">${s.year}</div>
      <div class="season-teams">
        ${s.teams.map(t => {
          const isChamp = t === s.champ || (s.champ === 'B&C' && t === 'Anand/Vip');
          return `<span class="team-chip ${isChamp ? 'champ' : ''}">${t}${isChamp ? ' ★' : ''}</span>`;
        }).join('')}
      </div>
    </div>
  `).join('');
}

// ====== Era Tabs ======
function setupEraTabs() {
  const tabs = document.querySelectorAll('.era-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderChampions(tab.dataset.era);
    });
  });
}

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

// ====== Init ======
document.addEventListener('DOMContentLoaded', () => {
  renderChampions();
  renderExhibition();
  renderLeaderboard('playoffApps', DATA.playoffApps);
  renderLeaderboard('bowlApps', DATA.bowlApps, 'count',
    item => `${item.count} <span style="color:var(--text-muted);font-size:11px">(${item.record})</span>`
  );
  renderLeaderboard('weeklyWins', weeklyWinsTotals());
  renderLeaderboard('bigGames', bigGamesTotals());
  renderRecords();
  renderTidbits();
  renderSeasons();
  setupEraTabs();
  setupMobileNav();
});
