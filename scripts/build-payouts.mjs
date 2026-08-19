// Builds payouts-data.js — what the league actually paid each manager.
//
// Offline. Reads the season archive (weekly winners, team counts), data.js
// (champion, runner-up, regular-season winner) and data/payouts.json (the
// amounts), and writes the browser file. No network, so it is safe to run any
// time and cheap to re-run.
//
//   npm run payouts
//
// Every season is reconciled against `teams x buyIn` before anything is
// written. A season that does not balance fails the whole run rather than
// publishing a number the league never paid.

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { loadSiteData } from '../src/write-data.mjs';
import { settleSeason, careerPayouts, netPositions } from '../src/payouts.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const archiveDir = join(root, 'data/lineups');

const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

async function main() {
  const payouts = JSON.parse(await readFile(join(root, 'data/payouts.json'), 'utf8'));
  const DATA = await loadSiteData();

  const archive = new Map();
  for (const f of (await readdir(archiveDir)).filter((f) => f.endsWith('.json'))) {
    const j = JSON.parse(await readFile(join(archiveDir, f), 'utf8'));
    archive.set(j.season, j);
  }

  const settled = [];
  const skipped = [];
  const seasonsPlayed = new Map();
  const FIELDS = ['weekly', 'regularSeason', 'champion', 'runnerUp'];

  for (const structure of payouts.seasons) {
    const year = structure.year;
    const season = archive.get(year);

    // A season whose weekly winners have not been recorded yet cannot be
    // settled. Say so out loud — a silently short leaderboard is the failure
    // mode this whole pipeline is built to avoid.
    if (!season?.weeklyWinners?.length) {
      skipped.push(`${year} (archive has no weekly winners — run \`npm run lineups --year ${year}\`)`);
      continue;
    }

    // A season is finished when season-end has recorded it in data.js. Until
    // then only the weekly winners are decided: the regular-season winner
    // needs the full 14 weeks folded into a seed order, and the champion and
    // runner-up need the Fantasy Bowl played. Weeks 15 and 16 therefore add
    // nothing at all — knocking a team out is not a payout event.
    const champion = DATA.champions.find((c) => c.year === year);
    const field = DATA.seasons.find((s) => s.year === year);
    const complete = Boolean(champion && field);

    settled.push(
      settleSeason({
        year,
        structure,
        complete,
        teams: season.managers.length,
        winners: {
          weekly: season.weeklyWinners.map((w) => w.gm),
          regularSeason: field?.teams[0] ?? null, // seed 1 is the regular-season winner
          champion: champion?.champ ?? null,
          runnerUp: champion?.runnerUp ?? null,
        },
      })
    );
    seasonsPlayed.set(year, season.managers.map((m) => m.gm));
  }

  if (settled.length === 0) throw new Error('No season could be settled.');

  const careers = careerPayouts(settled);
  const net = netPositions(settled, seasonsPlayed);
  const years = settled.map((s) => s.year).sort((a, b) => a - b);
  const span = `${years[0]}–${years[years.length - 1]}`;
  const pot = settled.reduce((n, s) => n + s.pool, 0);

  // How many settled seasons have every figure written down in the meeting
  // notes, rather than reconstructed and justified by the pot reconciling.
  // Derived so the caption corrects itself if the missing notes ever surface.
  const live = settled.filter((s) => !s.complete);
  const stated = settled.filter((s) => {
    const row = payouts.seasons.find((p) => p.year === s.year);
    return FIELDS.every((f) => (row.stated ?? []).includes(f));
  }).length;

  // Rows come from the NET positions, not the winners: a manager who bought in
  // every year and never cashed is the most interesting row on the board, and
  // building from `careers` would drop him entirely.
  const careerOf = new Map(careers.map((c) => [c.gm, c]));
  const line = (n) => {
    const c = careerOf.get(n.gm) ?? { total: 0, weeklyWins: 0, byLine: {} };
    return (
      `    { gm: ${q(n.gm)}, won: ${c.total}, paidIn: ${n.paidIn}, net: ${n.net}, ` +
      `seasons: ${n.seasonsPlayed}, weeklyWins: ${c.weeklyWins}, ` +
      `weekly: ${c.byLine['weekly win'] ?? 0}, regularSeason: ${c.byLine['regular season'] ?? 0}, ` +
      `bowl: ${(c.byLine['Fantasy Bowl'] ?? 0) + (c.byLine['runner-up'] ?? 0)} },`
    );
  };

  const out = `// League payouts — ${span}. GENERATED, do not hand-edit.
//
// Rebuilt by \`npm run payouts\`. Who won what comes from the season archive and
// data.js; what it was worth comes from data/payouts.json, which is sourced
// from the manager's meeting notes. Every season reconciles to its full pot
// before it is written here.
//
// ${span} ONLY. The league confirms the structure was genuinely different
// before 2019 — no weekly payouts, the regular-season prize came later, the
// buy-in was raised at some point — and those amounts are not recorded
// anywhere available. The Yahoo era knows who won and cannot know what they
// were paid, so it is left out rather than priced with the wrong structure.
const PAYOUTS = {
  span: ${q(span)},
  seasons: ${settled.length},
  pot: ${pot},

  // A season still being played, if any. Only weekly money has been decided in
  // it — the regular-season prize and the Bowl are still on the table, and the
  // playoff weeks before the Bowl pay nothing at all.
  inProgress: ${live.length ? `{ year: ${live[0].year}, paid: ${live[0].paid}, pending: ${live[0].pending} }` : 'null'},

  // Seasons whose payout figures are stated in full in the meeting notes. The
  // rest are reconstructed — every one reconciles to its pot exactly, but the
  // page says out loud that they are a best guess rather than a record.
  stated: ${stated},

  // Career money, richest first. \`net\` is winnings less every buy-in paid,
  // counting seasons played rather than seasons cashed.
  careers: [
${[...net].sort((a, b) => b.won - a.won || a.gm.localeCompare(b.gm)).map(line).join('\n')}
  ],
};
`;

  const path = join(root, 'payouts-data.js');
  const prev = await readFile(path, 'utf8').catch(() => null);
  if (prev === out) {
    console.log('payouts-data.js already current.');
  } else {
    await writeFile(path, out);
    console.log(`payouts-data.js rewritten from ${settled.length} season(s).`);
  }

  for (const s of settled) {
    console.log(
      s.complete
        ? `  ${s.year}: $${s.pool} across ${s.rows.length} GMs — reconciled`
        : `  ${s.year}: $${s.paid} paid, $${s.pending} still on the table — in progress, not reconciled`
    );
  }
  for (const s of skipped) console.log(`  SKIPPED ${s}`);
  console.log(`\nTotal paid out ${span}: $${pot.toLocaleString()}`);
}

main().catch((err) => {
  console.error(`\nPayouts failed: ${err.message}\n`);
  process.exitCode = 1;
});
