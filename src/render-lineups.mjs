// Serializes the lineup archive into lineups-data.js.
//
// The output is a browser CLASSIC SCRIPT declaring a global, exactly like
// data.js and keepers-data.js — no import, no export, nothing async. The whole
// file is generated, so unlike data.js it carries no markers: there is nothing
// hand-maintained in it to protect.
//
// Only what the page actually shows is emitted. The per-season manager tables
// stay in data/lineups/<year>.json, which is the archive; shipping eleven of
// them to the browser was more than anyone wanted to read.
//
// Rewriting the same archive must produce a byte-identical file or the weekly
// job commits churn. Nothing here may read the clock.

const n2 = (n) => Number(n).toFixed(2);
const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Career totals from a per-season table.
 *
 * Efficiency is the ratio of the totals, never a mean of season rates — a
 * three-week playoff run should not weigh the same as a fourteen-week season.
 */
function careersFrom(seasons, key) {
  const table = new Map();
  for (const s of seasons) {
    for (const m of s[key] ?? []) {
      if (!table.has(m.gm)) {
        table.set(m.gm, { gm: m.gm, scored: 0, optimal: 0, left: 0, weeks: 0, seasons: 0 });
      }
      const t = table.get(m.gm);
      t.scored += m.scored;
      t.optimal += m.optimal;
      t.left += m.left;
      t.weeks += m.weeks;
      t.seasons += 1;
    }
  }
  return [...table.values()]
    .map((t) => ({
      ...t,
      scored: round2(t.scored),
      optimal: round2(t.optimal),
      left: round2(t.left),
      efficiency: t.optimal === 0 ? 1 : t.scored / t.optimal,
    }))
    .sort((a, b) => b.efficiency - a.efficiency || a.gm.localeCompare(b.gm));
}

/** Pools a per-season leaderboard into one all-time list. */
function pooled(seasons, key, cmp) {
  return seasons.flatMap((s) => (s[key] ?? []).map((r) => ({ ...r, year: s.season }))).sort(cmp);
}

/**
 * How many perfect lineups a season held.
 *
 * Seasons built before this was recorded fall back to counting the kept rows,
 * which is exact only while no season fills every kept row with a perfect week.
 * Rather than quietly undercount if one ever does, this throws.
 */
function perfectIn(season) {
  if (season.perfect != null) return season.perfect;

  const kept = season.bestWeeks ?? [];
  const perfect = kept.filter((w) => w.efficiency >= 1).length;
  if (kept.length > 0 && perfect === kept.length) {
    throw new Error(
      `${season.season} fills every kept row with a perfect week, so the count may be capped. ` +
        'Rebuild that season with `npm run lineups --year ' + season.season + '` to record an exact one.'
    );
  }
  return perfect;
}

const row = (c) =>
  `    { gm: ${q(c.gm)}, scored: ${n2(c.scored)}, optimal: ${n2(c.optimal)}, left: ${n2(c.left)}, ` +
  `efficiency: ${c.efficiency.toFixed(4)}, weeks: ${c.weeks}, seasons: ${c.seasons}` +
  `${c.isNew ? ', isNew: true' : ''} },`;

export function renderLineups(seasons, { careerMinSeasons = 0 } = {}) {
  const sorted = [...seasons].sort((a, b) => b.season - a.season);
  if (sorted.length === 0) throw new Error('No seasons to render.');

  const span = `${sorted.at(-1).season}–${sorted[0].season}`;
  const perfect = sorted.reduce((n, s) => n + perfectIn(s), 0);
  const weeks = sorted.reduce((n, s) => n + (s.managers ?? []).reduce((m, x) => m + x.weeks, 0), 0);

  // Whether a manager is new to the LEAGUE, counted from his league seasons
  // rather than his rows in either table — so a manager marked on the career
  // board carries the same marker onto the playoff board, where one deep run
  // could otherwise put a newcomer top of a table he has barely played in.
  const leagueSeasons = new Map();
  for (const s of sorted) {
    for (const m of s.managers ?? []) leagueSeasons.set(m.gm, (leagueSeasons.get(m.gm) ?? 0) + 1);
  }
  const mark = (c) => ({ ...c, isNew: (leagueSeasons.get(c.gm) ?? 0) < careerMinSeasons });

  const careers = careersFrom(sorted, 'managers').map(mark);
  const playoff = careersFrom(sorted, 'playoffManagers').map(mark);

  // Everyone is ranked; only the record itself waits for a second season.
  const settled = (list) => list.find((c) => !c.isNew) ?? list[0] ?? null;
  const bestCareer = settled(careers);
  const bestPlayoff = settled(playoff);

  const worstWeek = pooled(sorted, 'worstWeeks', (a, b) => b.left - a.left || a.gm.localeCompare(b.gm))[0];
  const worstSit = pooled(sorted, 'worstSits', (a, b) => b.score - a.score || a.gm.localeCompare(b.gm))[0];
  // Perfect weeks are common, so ranking by efficiency alone leaves a pile of
  // ties that fall out alphabetically. The superlative among them is the biggest.
  const bestWeek = pooled(sorted, 'bestWeeks', (a, b) =>
    b.efficiency - a.efficiency || b.scored - a.scored || a.gm.localeCompare(b.gm))[0];
  const topBid = pooled(sorted, 'bids', (a, b) => b.amount - a.amount || a.gm.localeCompare(b.gm))[0];
  const bestSeason = sorted
    .flatMap((s) => (s.managers ?? []).map((m) => ({ ...m, year: s.season })))
    .sort((a, b) => b.efficiency - a.efficiency || a.gm.localeCompare(b.gm))[0];

  const rec = (name, body) => `    ${name}: ${body},`;

  return `// Lineup efficiency — ${span}. GENERATED, do not hand-edit.
//
// Rebuilt by \`npm run lineups\`; every line comes from MFL. What a manager
// started each week, against the best lineup his roster could legally have
// fielded that week under the league's own starting rules.
//
// The optimum is computed by src/lineups.mjs, NOT read from MFL's opt_pts —
// MFL's optimizer does not know the 8-offense cap or the 3-IDP minimum and
// gets the answer wrong in roughly half of all weeks.
//
// The full season-by-season tables live in data/lineups/<year>.json. Only the
// leaderboards and records the site shows are shipped to the browser.
const LINEUPS = {
  span: ${q(span)},
  seasons: ${sorted.length},
  weeks: ${weeks},
  perfect: ${perfect},

  // \`isNew\` marks a manager still in his first league season: ranked on every
  // board, but not yet holding a career record.
  careerMinSeasons: ${careerMinSeasons},

  // Regular season.
  careers: [
${careers.map(row).join('\n')}
  ],

  // Playoffs, counting only the weeks a manager was still alive to play.
  playoffCareers: [
${playoff.map(row).join('\n')}
  ],

  records: {
${[
  bestSeason && rec('bestSeason', `{ gm: ${q(bestSeason.gm)}, year: ${bestSeason.year}, efficiency: ${bestSeason.efficiency.toFixed(4)}, weeks: ${bestSeason.weeks} }`),
  bestCareer && rec('bestCareer', `{ gm: ${q(bestCareer.gm)}, efficiency: ${bestCareer.efficiency.toFixed(4)}, weeks: ${bestCareer.weeks}, seasons: ${bestCareer.seasons} }`),
  bestPlayoff && rec('bestPlayoff', `{ gm: ${q(bestPlayoff.gm)}, efficiency: ${bestPlayoff.efficiency.toFixed(4)}, weeks: ${bestPlayoff.weeks}, seasons: ${bestPlayoff.seasons} }`),
  worstWeek && rec('worstWeek', `{ gm: ${q(worstWeek.gm)}, year: ${worstWeek.year}, week: ${worstWeek.week}, scored: ${n2(worstWeek.scored)}, optimal: ${n2(worstWeek.optimal)}, left: ${n2(worstWeek.left)} }`),
  worstSit && rec('worstSit', `{ gm: ${q(worstSit.gm)}, year: ${worstSit.year}, week: ${worstSit.week}, player: ${q(worstSit.player)}, score: ${n2(worstSit.score)} }`),
  bestWeek && rec('bestWeek', `{ gm: ${q(bestWeek.gm)}, year: ${bestWeek.year}, week: ${bestWeek.week}, scored: ${n2(bestWeek.scored)}, optimal: ${n2(bestWeek.optimal)}, efficiency: ${bestWeek.efficiency.toFixed(4)} }`),
  topBid && rec('topBid', `{ gm: ${q(topBid.gm)}, year: ${topBid.year}, player: ${q(topBid.player)}, amount: ${n2(topBid.amount)} }`),
].filter(Boolean).join('\n')}
  },
};
`;
}
