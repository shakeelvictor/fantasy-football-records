// Renders the generated block of weekly-log.js. Kept separate from ingest.mjs
// so it can be tested without touching the network or the filesystem.

import { weeklyWinners, bigGames } from './derive.mjs';

export const BEGIN = '// >>> BEGIN GENERATED — do not edit by hand';
export const END = '// <<< END GENERATED';

/**
 * The site reads WEEKLY_LOG as a flat list of
 *   { year, week, winner, big: [{ gm, points }] }
 * and tallies it onto the frozen baselines in data.js. Emitting points
 * alongside each 200+ game keeps the detail the hand-written format allowed.
 */
export function renderLog(season, config) {
  const winners = new Map(weeklyWinners(season, config).map((w) => [w.week, w]));

  const big = new Map();
  for (const g of bigGames(season, config)) {
    if (!big.has(g.week)) big.set(g.week, []);
    big.get(g.week).push(g);
  }

  const weeks = [...new Set([...winners.keys(), ...big.keys()])].sort((a, b) => a - b);

  const lines = weeks.map((week) => {
    const winner = winners.get(week);
    const scorers = (big.get(week) ?? [])
      .map((b) => `{ gm: '${b.gm}', points: ${b.score.toFixed(2)} }`)
      .join(', ');
    // A playoff or exhibition week can contribute a 200+ game with no weekly
    // winner. null is the site's own "not played / not counted" marker.
    return `  { year: ${season.season}, week: ${week}, winner: ${
      winner ? `'${winner.gm}'` : 'null'
    }, big: [${scorers}] },`;
  });

  const body = [`  // ── ${season.season} ──`, ...lines].join('\n');
  return `${BEGIN}\nconst WEEKLY_LOG = [\n${body}\n];\n${END}`;
}

/** Swaps the generated block in place, leaving hand-maintained content alone. */
export function spliceLog(source, block) {
  const start = source.indexOf(BEGIN);
  const end = source.indexOf(END);
  if (start === -1 || end === -1) {
    throw new Error('weekly-log.js is missing its BEGIN/END GENERATED markers.');
  }
  return source.slice(0, start) + block + source.slice(end + END.length);
}
