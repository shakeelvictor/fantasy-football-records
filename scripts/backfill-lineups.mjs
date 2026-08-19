// Builds the lineup archive: what each manager started each week against the
// best lineup the roster could legally have fielded.
//
// Dev-only for the historical range; the weekly job runs it for the current
// season alone. Idempotent by construction, same as the ingest — it refetches
// a whole season and overwrites everything it owns.
//
//   node scripts/backfill-lineups.mjs            # current season only
//   node scripts/backfill-lineups.mjs --all      # the whole MFL era, hits MFL hard
//   node scripts/backfill-lineups.mjs --year 2019
//   node scripts/backfill-lineups.mjs --render-only   # no network; rebuild from disk
//
// Writes data/lineups/<year>.json per season, then rebuilds lineups-data.js
// from every season file on disk.

import { writeFile, mkdir, readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { config } from '../data/league.config.mjs';
import { fetchWeeklyLineups, fetchPlayerInfo, fetchWinningBids } from '../src/mfl/client.mjs';
import { loadFranchiseFile, mapForSeason } from '../src/franchise-map.mjs';
import {
  weekEfficiency, seasonEfficiency, shapeOf, shapeKey, fitsWithin, legalShapes, rulesFor,
} from '../src/lineups.mjs';
import { playoffResult } from '../src/derive.mjs';
import { renderLineups } from '../src/render-lineups.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const archiveDir = join(root, 'data/lineups');
const KEEP = 12; // rows kept per season for the single-week leaderboards

/** The MFL league a season lived in. 2015 ran in its own league before the move. */
function leagueFor(year) {
  return config.archive.leagueIds?.[year] ?? config.leagueId;
}

/**
 * The playoff shape of a season, derived from its regular-season length.
 *
 * Three rounds follow the regular season and the last of them is the Fantasy
 * Bowl, two teams out each of the first two rounds. That has held every year
 * on record; if it ever did not, playoffResult() throws rather than fold to
 * the wrong number of finalists.
 */
function playoffConfig(year) {
  const reg = regularWeeks(year);
  const n = reg.length;
  return {
    regularSeasonWeeks: reg,
    playoffWeeks: [n + 1, n + 2, n + 3],
    fantasyBowlWeek: n + 3,
    playoffTeams: config.playoffTeams,
    byeSeeds: config.byeSeeds,
    eliminatedPerWeek: { [n + 1]: 2, [n + 2]: 2 },
  };
}

/** Regular-season length for a season. The archive owns finished years; config owns this one. */
function regularWeeks(year) {
  const n = config.archive.regularSeasonWeeks[year];
  if (n) return Array.from({ length: n }, (_, i) => i + 1);
  if (year === config.season) return config.regularSeasonWeeks;
  throw new Error(
    `No regular-season length known for ${year}. Add it to config.archive.regularSeasonWeeks.`
  );
}

async function buildSeason(year, file) {
  const map = mapForSeason(file, year);
  const allowed = new Set(regularWeeks(year));

  const shapes = legalShapes(rulesFor(year, config.archive));
  const leagueId = leagueFor(year);

  const pcfg = playoffConfig(year);
  const playoffOnly = new Set(pcfg.playoffWeeks);

  const allWeeks = await fetchWeeklyLineups(year, leagueId);
  const weeks = allWeeks.filter((w) => allowed.has(w.week));
  if (weeks.length === 0) return null;

  // Who actually contested each playoff week. All-play means an eliminated
  // team still posts a score every week, so without the fold a knocked-out
  // manager's dead-rubber lineups would count against his playoff efficiency.
  const forDerive = {
    season: year,
    weeks: allWeeks.map((w) => ({
      week: w.week,
      scores: w.franchises.map((f) => ({ gm: map.get(f.id), score: f.score })).filter((s) => s.gm),
    })),
  };
  const fold = playoffResult(forDerive, pcfg);
  const contested = new Map();
  if (fold.complete) {
    for (const r of fold.rounds) contested.set(r.week, new Set(r.ranked.map((x) => x.gm)));
    contested.set(pcfg.fantasyBowlWeek, new Set([fold.champion.gm, fold.runnerUp.gm]));
  }

  const ids = new Set();
  for (const w of allWeeks) for (const f of w.franchises) for (const p of f.players) ids.add(p.id);
  const info = await fetchPlayerInfo(year, leagueId, [...ids]);

  const nameOf = (id) => info.get(id)?.name ?? id;
  const playoffRows = [];
  const rows = [];
  const sits = [];
  const unmodelled = [];
  const illegal = [];

  for (const w of weeks) {
    const weekRows = [];
    for (const f of w.franchises) {
      const gm = map.get(f.id);
      if (!gm) {
        throw new Error(
          `${year} week ${w.week}: franchise ${f.id} is not in the ${year} map. ` +
            'Add it to data/franchises.json (see "history") before this season can be archived.'
        );
      }

      const players = f.players.map((p) => ({ ...p, position: info.get(p.id)?.position }));
      const unknown = players.filter((p) => !p.position);
      if (unknown.length) {
        throw new Error(
          `${year} week ${w.week} (${gm}): MFL returned no position for ` +
            `${unknown.map((p) => p.id).join(', ')}. Cannot build a legal lineup without it.`
        );
      }

      const started = players.filter((p) => p.started);
      const submitted = shapeOf(started.map((p) => p.position));

      const eff = weekEfficiency({
        players,
        started: started.map((p) => p.id),
        scored: f.score,
        shapes,
      });
      if (!eff) continue;

      // A week the model cannot price at all is dropped and counted, never
      // clamped. Rounding an impossible efficiency down to 100% would put a
      // number in the book that nothing produced.
      if (eff.unmodelled) {
        unmodelled.push({ gm, week: w.week, shape: shapeKey(submitted), scored: eff.scored, optimal: eff.optimal });
        continue;
      }

      // An ILLEGAL lineup is a different thing from an unpriceable one, and it
      // still counts. MFL did not enforce the roster rules in 2016 and one
      // manager started nine offensive players four weeks running; the league
      // dealt with that separately and let the results stand. Measuring him
      // against the lineup he was supposed to be allowed is exactly the point
      // of this metric, so the week stays in his totals and is recorded here.
      if (started.length > 0 && !fitsWithin(submitted, shapes)) {
        illegal.push({ gm, week: w.week, shape: shapeKey(submitted), scored: eff.scored, optimal: eff.optimal });
      }

      weekRows.push({ gm, ...eff });
      for (const s of eff.sat) sits.push({ gm, week: w.week, player: nameOf(s.id), score: s.score });
    }
    rows.push({ week: w.week, rows: weekRows });
  }

  for (const w of allWeeks.filter((x) => playoffOnly.has(x.week))) {
    const alive = contested.get(w.week);
    if (!alive) continue;
    const weekRows = [];
    for (const f of w.franchises) {
      const gm = map.get(f.id);
      if (!gm || !alive.has(gm)) continue;
      const players = f.players.map((p) => ({ ...p, position: info.get(p.id)?.position }));
      if (players.some((p) => !p.position)) continue;
      const eff = weekEfficiency({
        players,
        started: players.filter((p) => p.started).map((p) => p.id),
        scored: f.score,
        shapes,
      });
      if (!eff || eff.unmodelled) continue;
      weekRows.push({ gm, ...eff });
    }
    if (weekRows.length) playoffRows.push({ week: w.week, rows: weekRows });
  }

  const flat = rows.flatMap((w) => w.rows.map((r) => ({ ...r, week: w.week })));
  const bids = (await fetchWinningBids(year, leagueId))
    .filter((b) => map.has(b.franchise))
    .map((b) => ({ gm: map.get(b.franchise), player: nameOf(b.player), amount: b.amount }));

  const desc = (key) => (a, b) => b[key] - a[key] || a.gm.localeCompare(b.gm) || a.week - b.week;

  return {
    season: year,
    regularSeasonWeeks: regularWeeks(year).length,
    weeksPlayed: rows.length,
    unmodelled,
    illegal,
    managers: seasonEfficiency(rows),
    // Playoff weeks, counting only the teams still alive in each one.
    playoffManagers: seasonEfficiency(playoffRows),
    playoffWeeks: playoffRows.length,
    worstWeeks: [...flat].sort(desc('left')).slice(0, KEEP)
      .map(({ gm, week, scored, optimal, left }) => ({ gm, week, scored, optimal, left })),
    // Counted over the whole season, not just the rows kept below, so the
    // figure can never be capped by KEEP.
    perfect: flat.filter((r) => r.optimal > 0 && r.scored >= r.optimal - 0.005).length,
    bestWeeks: [...flat].filter((r) => r.optimal > 0)
      .sort((a, b) => b.efficiency - a.efficiency || b.scored - a.scored || a.gm.localeCompare(b.gm))
      .slice(0, KEEP).map(({ gm, week, scored, optimal, efficiency }) => ({ gm, week, scored, optimal, efficiency })),
    worstSits: sits.sort(desc('score')).slice(0, KEEP),
    bids: bids.slice(0, KEEP),
  };
}

async function main() {
  const argv = process.argv.slice(2);
  const yearArg = argv.includes('--year') ? Number(argv[argv.indexOf('--year') + 1]) : null;
  const years = yearArg
    ? [yearArg]
    : argv.includes('--all')
      ? Object.keys(config.archive.regularSeasonWeeks).map(Number).sort()
      : [config.season];

  const file = await loadFranchiseFile();
  await mkdir(archiveDir, { recursive: true });

  // Rebuilding the browser file from the archive on disk needs no network, so
  // a rate-limited or offline day cannot leave lineups-data.js out of step
  // with the season files that are already written.
  for (const year of argv.includes('--render-only') ? [] : years) {
    const built = await buildSeason(year, file);
    if (!built) {
      console.log(`${year}: no regular-season weeks played yet — skipped.`);
      continue;
    }
    await writeFile(join(archiveDir, `${year}.json`), JSON.stringify(built, null, 2) + '\n');
    const top = built.managers[0];
    console.log(
      `${year}: ${built.weeksPlayed}/${built.regularSeasonWeeks} weeks, ` +
        `${built.managers.length} GMs, best ${top.gm} ${(top.efficiency * 100).toFixed(1)}%` +
        `, ${built.playoffWeeks} playoff wk${built.playoffWeeks === 1 ? '' : 's'}` +
        `${built.bids.length ? `, top bid $${built.bids[0].amount.toFixed(2)} (${built.bids[0].gm})` : ''}` +
        `${built.illegal.length ? `  [${built.illegal.length} illegal lineup(s), counted: ${[...new Set(built.illegal.map((u) => u.shape))].join('; ')}]` : ''}` +
        `${built.unmodelled.length ? `  [${built.unmodelled.length} franchise-week(s) DROPPED, unpriceable]` : ''}`
    );
    if (years.length > 1) await new Promise((r) => setTimeout(r, 3000)); // be kind to MFL
  }

  const seasons = [];
  for (const f of (await readdir(archiveDir)).filter((f) => f.endsWith('.json')).sort()) {
    seasons.push(JSON.parse(await readFile(join(archiveDir, f), 'utf8')));
  }
  const path = join(root, 'lineups-data.js');
  const next = renderLineups(seasons, config.archive);
  const prev = await readFile(path, 'utf8').catch(() => null);
  if (prev === next) {
    console.log('lineups-data.js already current.');
  } else {
    await writeFile(path, next);
    console.log(`lineups-data.js rewritten from ${seasons.length} season${seasons.length === 1 ? '' : 's'}.`);
  }
}

main().catch((err) => {
  console.error(`\nLineup archive failed: ${err.message}\n`);
  process.exitCode = 1;
});
