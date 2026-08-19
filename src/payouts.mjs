// What the league actually paid each manager, season by season.
//
// Two halves, from two places. WHO won is derived — weekly winners and the
// regular-season winner from the season archive, the Fantasy Bowl from data.js.
// HOW MUCH each was worth is hand-maintained in data/payouts.json, because MFL
// knows nothing about the league's money and the amounts live only in the
// manager's meeting notes.
//
// The league pays out the whole pot, so every season is checked against a hard
// invariant: payouts must sum to exactly `teams x buyIn`. A structure that does
// not reconcile is wrong rather than approximate, and `settleSeason` refuses it.
//
// Pure. No I/O, no clock, no network — same contract as derive.mjs.

const LINES = [
  ['weekly', 'weekly win'],
  ['regularSeason', 'regular season'],
  ['champion', 'Fantasy Bowl'],
  ['runnerUp', 'runner-up'],
];

/**
 * One season's payouts, per GM.
 *
 * `winners` is { weekly: [gm...], regularSeason: gm, champion: gm, runnerUp: gm }.
 * `structure` is a row from data/payouts.json. `teams` is how many managers
 * bought in that year — the pot is theirs, so it is what the total must match.
 */
export function settleSeason({ year, structure, winners, teams }) {
  if (!structure) throw new Error(`No payout structure on record for ${year}.`);
  if (!teams) throw new Error(`${year}: cannot settle without a team count.`);

  const rows = new Map();
  const pay = (gm, amount, reason) => {
    if (!gm) return;
    if (!rows.has(gm)) rows.set(gm, { gm, total: 0, weeklyWins: 0, lines: [] });
    const r = rows.get(gm);
    r.total += amount;
    r.lines.push({ reason, amount });
  };

  for (const gm of winners.weekly ?? []) {
    pay(gm, structure.weekly, 'weekly win');
    rows.get(gm).weeklyWins += 1;
  }
  pay(winners.regularSeason, structure.regularSeason, 'regular season');
  pay(winners.champion, structure.champion, 'Fantasy Bowl');
  pay(winners.runnerUp, structure.runnerUp, 'runner-up');

  const paid = [...rows.values()].reduce((n, r) => n + r.total, 0);
  const pool = teams * structure.buyIn;

  if (paid !== pool) {
    throw new Error(
      `${year} does not reconcile: paid $${paid} against a $${pool} pool ` +
        `(${teams} x $${structure.buyIn}). ` +
        `${(winners.weekly ?? []).length} weekly winners at $${structure.weekly}, ` +
        `regular season $${structure.regularSeason}, champion $${structure.champion}, ` +
        `runner-up $${structure.runnerUp}. The league pays out the whole pot, so ` +
        'one of these is wrong — fix data/payouts.json rather than publishing the gap.'
    );
  }

  return {
    year,
    pool,
    teams,
    rows: [...rows.values()].sort((a, b) => b.total - a.total || a.gm.localeCompare(b.gm)),
  };
}

/** Career money across settled seasons, richest first. */
export function careerPayouts(settled) {
  const table = new Map();
  for (const s of settled) {
    for (const r of s.rows) {
      if (!table.has(r.gm)) {
        table.set(r.gm, { gm: r.gm, total: 0, seasons: 0, weeklyWins: 0, byLine: {} });
      }
      const t = table.get(r.gm);
      t.total += r.total;
      t.seasons += 1;
      t.weeklyWins += r.weeklyWins;
      for (const l of r.lines) t.byLine[l.reason] = (t.byLine[l.reason] ?? 0) + l.amount;
    }
  }
  return [...table.values()].sort((a, b) => b.total - a.total || a.gm.localeCompare(b.gm));
}

/**
 * Net position: what a manager took home against what he paid in.
 *
 * A manager pays the buy-in every season he plays, not only the ones he cashed
 * in, so `seasonsPlayed` comes from the archive rather than from `settled`.
 */
export function netPositions(settled, seasonsPlayed) {
  const paidIn = new Map();
  const played = new Map();
  for (const s of settled) {
    for (const gm of seasonsPlayed.get(s.year) ?? []) {
      paidIn.set(gm, (paidIn.get(gm) ?? 0) + s.pool / s.teams);
      played.set(gm, (played.get(gm) ?? 0) + 1);
    }
  }

  const won = new Map(careerPayouts(settled).map((c) => [c.gm, c]));
  return [...paidIn.entries()]
    .map(([gm, inv]) => {
      const c = won.get(gm);
      return {
        gm,
        paidIn: inv,
        won: c?.total ?? 0,
        net: (c?.total ?? 0) - inv,
        // Seasons PLAYED — every one of which cost a buy-in — not seasons cashed.
        seasonsPlayed: played.get(gm) ?? 0,
        seasonsCashed: c?.seasons ?? 0,
        weeklyWins: c?.weeklyWins ?? 0,
      };
    })
    .sort((a, b) => b.net - a.net || a.gm.localeCompare(b.gm));
}

export const PAYOUT_LINES = LINES;
