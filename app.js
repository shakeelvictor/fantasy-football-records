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

/**
 * Single-game and season records that fall out of the lineup archive rather
 * than data.js. They belong in this book — they are single-game records — but
 * they are computed from lineups-data.js, so they are appended here instead of
 * being written into data.js, whose `records` block is owned by season-end.
 */
function lineupRecordCards() {
  if (typeof LINEUPS === 'undefined') return [];
  const r = LINEUPS.records;
  const pts = n => n.toFixed(2);
  const cards = [];

  if (r.worstWeek) cards.push({
    label: 'Most Points Left on the Bench',
    value: pts(r.worstWeek.left),
    holder: r.worstWeek.gm,
    context: `${r.worstWeek.year} · Week ${r.worstWeek.week} — started ${pts(r.worstWeek.scored)} of ${pts(r.worstWeek.optimal)}`,
  });
  if (r.worstSit) cards.push({
    label: 'Worst Sit',
    value: pts(r.worstSit.score),
    holder: r.worstSit.gm,
    context: `${r.worstSit.player} — benched, ${r.worstSit.year} Week ${r.worstSit.week}`,
  });
  if (r.topBid) cards.push({
    label: 'Biggest Winning Bid',
    value: '$' + r.topBid.amount.toFixed(2),
    holder: r.topBid.gm,
    context: `${r.topBid.player} — ${r.topBid.year}`,
  });
  return cards;
}

function renderRecords() {
  const grid = document.getElementById('recordsGrid');
  grid.innerHTML = [...DATA.records, ...lineupRecordCards()].map(r => `
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

// ====== Living headline numbers ======
// Everything the page says about "how many" and "since when" is derived from
// DATA, never typed. These used to be literals in index.html and had already
// drifted: the Unique Champs tile read 9 for a year after Raj's 2024 title
// made it 10. A number a human has to remember to update is a number that will
// eventually be wrong.
function renderHeadlineNumbers() {
  const champions = DATA.champions;
  if (!champions.length) return;

  const first = champions[0].year;
  const reigning = champions[champions.length - 1];
  const seasons = champions.length;

  // Every name the archive mentions, anywhere. A slot co-managed by two GMs is
  // written "Anand/Vip" and is not a fourteenth person — both are already
  // counted on their own.
  const gms = new Set();
  const add = name => { if (name && !name.includes('/')) gms.add(name); };
  champions.forEach(c => { add(c.champ); add(c.runnerUp); });
  DATA.seasons.forEach(s => s.teams.forEach(add));
  DATA.playoffApps.forEach(r => add(r.gm));
  DATA.bowlApps.forEach(r => add(r.gm));

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  set('heroEyebrow', `Est. ${first} · ${seasons} Seasons`);
  set('statSeasons', seasons);
  set('statGms', gms.size);
  set('statChamps', new Set(champions.map(c => c.champ)).size);
  set('statReignYear', reigning.year);
  set('statReignGm', `Reigning: ${reigning.gm || reigning.champ}`);
  set('siteFooterLine', `The League · Records compiled across ${seasons} seasons · ${first}–${reigning.year}`);

  const era = key => {
    const rows = champions.filter(c => c.era === key);
    return rows.length ? `${rows[0].year}–${rows[rows.length - 1].year}` : '';
  };
  set('eraTabMfl', `MFL · ${era('mfl')}`);
  set('eraTabYahoo', `Yahoo! · ${era('yahoo')}`);

  if (DATA.exhibition && DATA.exhibition.length) {
    set('exhibitionSince', Math.min(...DATA.exhibition.map(e => e.year)));
  }
}

// ====== Lineup Efficiency ======
// What a manager started against the best lineup his roster could legally have
// fielded. LINEUPS comes from lineups-data.js; the full season-by-season
// tables stay in data/lineups/ and are deliberately not shipped here.
function renderLineups() {
  if (typeof LINEUPS === 'undefined') return;

  const pct = n => (n * 100).toFixed(1) + '%';
  const pts = n => n.toFixed(2);
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const r = LINEUPS.records;

  document.getElementById('lineupsBlurb').textContent =
    `Every week has a best possible lineup hiding in your roster. This is how close each ` +
    `manager came to actually starting it, ${LINEUPS.span}.`;

  const cards = [];
  if (r.bestSeason) cards.push({
    label: 'Best Season',
    value: pct(r.bestSeason.efficiency),
    holder: r.bestSeason.gm,
    context: `${r.bestSeason.year} · ${r.bestSeason.weeks} weeks`,
  });
  if (r.bestCareer) cards.push({
    label: 'Best Career',
    value: pct(r.bestCareer.efficiency),
    holder: r.bestCareer.gm,
    context: `${r.bestCareer.weeks} weeks across ${plural(r.bestCareer.seasons, 'season')}`,
    trophy: true,
  });
  if (r.bestPlayoff) cards.push({
    label: 'Best in the Playoffs',
    value: pct(r.bestPlayoff.efficiency),
    holder: r.bestPlayoff.gm,
    context: `${r.bestPlayoff.weeks} playoff weeks across ${plural(r.bestPlayoff.seasons, 'run')}`,
  });
  if (r.bestWeek) cards.push({
    label: r.bestWeek.efficiency >= 1 ? 'Biggest Perfect Week' : 'Best Managed Week',
    value: pts(r.bestWeek.scored),
    holder: r.bestWeek.gm,
    context: `${r.bestWeek.year} · Week ${r.bestWeek.week} — nothing left behind`,
    prev: LINEUPS.perfect ? `${LINEUPS.perfect} perfect lineups on record` : '',
  });

  document.getElementById('lineupRecords').innerHTML = cards.map(c => `
    <div class="record-card${c.trophy ? ' has-trophy' : ''}">
      ${c.trophy ? TROPHY_SVG : ''}
      <div class="record-label">${c.label}</div>
      <div class="record-value">${c.value}</div>
      <div class="record-holder">${c.holder}</div>
      <div class="record-context">${c.context}</div>
      ${c.prev ? `<div class="record-prev">${c.prev}</div>` : ''}
    </div>
  `).join('');

  // Everyone is ranked. An asterisk marks a manager still in his first league
  // season, and the footnote only appears while somebody carries one — it will
  // disappear on its own once Laura and Ryaan have a second year behind them.
  const board = (id, rows) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = rows.map((row, i) => `
      <li class="${i === 0 ? 'top-rank' : ''}">
        <span class="rank ${i === 0 ? 'top' : ''}">${String(i + 1).padStart(2, '0')}</span>
        <span class="gm-name">${row.gm}${row.isNew ? '<span class="lineup-star">*</span>' : ''}</span>
        <span class="gm-value">${pct(row.efficiency)} <span class="lineup-sub">${row.weeks} wk</span></span>
      </li>
    `).join('');

    const note = el.parentElement.querySelector('.lineup-foot');
    if (note) {
      note.innerHTML = rows.some(r => r.isNew)
        ? `<span class="lineup-star">*</span> New to the league — ranked here, but a career record needs more than one season.`
        : '';
    }
  };
  board('careerEff', LINEUPS.careers);
  board('playoffEff', LINEUPS.playoffCareers);

  renderLineupMath();
}

// The nerd math, folded away for anyone who wants it. Every definition here is
// the one the pipeline actually implements — if one changes, change it here.
//
// This explains the cards in THIS section only. Most Points Left on the Bench,
// Worst Sit and Biggest Winning Bid are also built from the lineup archive but
// live in the records book above, so they are not described here — a definition
// pointing at a card the reader cannot see is worse than no definition.
function renderLineupMath() {
  const rows = [
    ['The optimum', `Every figure here compares what a manager <em>started</em> against the
      highest-scoring lineup his roster could <em>legally</em> have fielded that week — chosen from all
      20 rostered players under the league's own starting rules. It is recomputed here rather than read
      from MFL, whose optimizer does not know the 8-offense cap or the 3-IDP minimum and gets the answer
      wrong in roughly half of all weeks. A rostered player with no score that week counts as a zero,
      because starting a man on bye is a real cost.`],
    ['Best Season', `The best single-season figure on record: one manager's points started in a season
      divided by the points available across the same weeks.`],
    ['Best Career', `Career points started divided by career points available. A ratio of the totals,
      not an average of season rates — a manager's big weeks should weigh more than his quiet ones.
      Every manager is ranked, but the record itself waits for a second season — a newcomer marked
      with an asterisk is not yet holding it.`],
    ['Best in the Playoffs', `The same ratio over playoff weeks only. All-play means an eliminated team
      still posts a score every week, so only the weeks a manager was actually still alive to play are
      counted — one for a team knocked out in its first round, three for a Fantasy Bowl run.`],
    ['Biggest Perfect Week', `A perfect week is one where the lineup started <em>was</em> the best
      available: 100%, nothing left on the bench. They are not rare, so the card shows the
      highest-scoring one rather than the first.`],
    ['Scope', `Regular-season weeks only, except where a card says otherwise. Exhibition weeks are
      excluded throughout. The lineup rules themselves have changed twice — 2015 had a kicker and no
      flex, 2016 a flex and no kicker, 2017 onward both — and each season is measured against the rules
      it was actually played under.`],
  ];

  document.getElementById('lineupMath').innerHTML = `
    <dl class="lineup-defs">
      ${rows.map(([term, body]) => `<dt>${term}</dt><dd>${body}</dd>`).join('')}
    </dl>
  `;
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
  renderHeadlineNumbers();
  renderChampions();
  renderExhibition();
  renderLeaderboard('playoffApps', DATA.playoffApps);
  renderLeaderboard('bowlApps', DATA.bowlApps, 'count',
    item => `${item.count} <span style="color:var(--text-muted);font-size:11px">(${item.record})</span>`
  );
  renderLeaderboard('weeklyWins', weeklyWinsTotals());
  renderLeaderboard('bigGames', bigGamesTotals());
  renderRecords();
  renderLineups();
  renderTidbits();
  renderSeasons();
  setupEraTabs();
  setupMobileNav();
});
