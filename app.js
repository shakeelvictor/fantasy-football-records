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

// ====== Leaderboards ======
function renderLeaderboard(elId, items, valueKey = 'count', valueRenderer = null) {
  const ul = document.getElementById(elId);
  const sorted = [...items].sort((a, b) => b[valueKey] - a[valueKey]);
  const max = Math.max(...sorted.map(i => i[valueKey]));
  ul.innerHTML = sorted.map((item, i) => {
    const value = item[valueKey];
    const pct = (value / max) * 100;
    const rankClass = i === 0 ? 'top' : '';
    const valueText = valueRenderer ? valueRenderer(item) : value + (item.note || '');
    return `
      <li>
        <span class="rank ${rankClass}">${String(i + 1).padStart(2, '0')}</span>
        <span class="gm-name">${item.gm}</span>
        <span class="bar"><span class="bar-fill" style="width: ${pct}%"></span></span>
        <span class="gm-value">${valueText}</span>
      </li>
    `;
  }).join('');
}

// ====== Records ======
function renderRecords() {
  const grid = document.getElementById('recordsGrid');
  grid.innerHTML = DATA.records.map(r => `
    <div class="record-card">
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
  renderLeaderboard('playoffApps', DATA.playoffApps);
  renderLeaderboard('bowlApps', DATA.bowlApps, 'count',
    item => `${item.count} <span style="color:var(--text-muted);font-size:11px">(${item.record})</span>`
  );
  renderLeaderboard('weeklyWins', DATA.weeklyWins);
  renderLeaderboard('bigGames', DATA.bigGames);
  renderRecords();
  renderTidbits();
  renderSeasons();
  setupEraTabs();
  setupMobileNav();
});
