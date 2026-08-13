// Weekly ingest. Refetches the whole current season and overwrites everything
// it owns, so a late stat correction is picked up with no reconciliation logic.
// Idempotent by construction: same MFL state in, same files out.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { config } from '../data/league.config.mjs';
import { fetchFranchises, fetchWeeklyResults } from './mfl/client.mjs';
import { weeklyWinners, bigGames } from './derive.mjs';
import { renderLog, spliceLog } from './render-log.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Franchise id -> GM. Throws rather than returning a half-filled map. */
async function loadFranchiseMap() {
  const raw = JSON.parse(await readFile(join(root, 'data/franchises.json'), 'utf8'));
  const unmapped = raw.franchises.filter((f) => !f.gm);
  if (unmapped.length) {
    throw new Error(
      `data/franchises.json has unmapped franchises:\n  ` +
        unmapped.map((f) => `${f.id} (${f.teamName})`).join('\n  ') +
        '\nFill in "gm" for each before the ingest can attribute scores. MFL carries ' +
        'no owner_name for this league, so this map cannot be fetched.'
    );
  }
  return new Map(raw.franchises.map((f) => [f.id, f.gm]));
}

/** GM names the site knows about, read from the hand-maintained list. */
async function loadKnownGms() {
  const src = await readFile(join(root, 'weekly-log.js'), 'utf8');
  const m = src.match(/const GMS = \[([\s\S]*?)\];/);
  if (!m) throw new Error('Could not find the GMS list in weekly-log.js.');
  return new Set([...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
}

async function writeWeeklyLog(block) {
  const path = join(root, 'weekly-log.js');
  const src = await readFile(path, 'utf8');
  const next = spliceLog(src, block);
  if (next === src) return false;
  await writeFile(path, next);
  return true;
}

async function main() {
  const map = await loadFranchiseMap();

  const [franchises, weeks] = await Promise.all([
    fetchFranchises(config.season, config.leagueId),
    fetchWeeklyResults(config.season, config.leagueId),
  ]);

  // A franchise MFL knows about but the map doesn't means expansion or a new
  // GM. Fail rather than silently dropping a team out of every record.
  const missing = franchises.filter((f) => !map.has(f.id));
  if (missing.length) {
    throw new Error(
      `MFL reports franchises absent from data/franchises.json: ` +
        missing.map((f) => `${f.id} (${f.name})`).join(', ')
    );
  }

  const knownGms = await loadKnownGms();
  const strangers = [...map.values()].filter((gm) => !knownGms.has(gm));
  if (strangers.length) {
    throw new Error(
      `GM names not in the GMS list in weekly-log.js: ${strangers.join(', ')}. ` +
        'Add them there first so the site recognises the name.'
    );
  }

  const season = {
    season: config.season,
    weeks: weeks.map((w) => ({
      week: w.week,
      scores: w.scores
        .map((s) => ({ gm: map.get(s.id), score: s.score, starters: s.starters, topPlayer: s.topPlayer }))
        .sort((a, b) => a.gm.localeCompare(b.gm)),
    })),
  };

  await writeFile(join(root, `data/${config.season}.json`), JSON.stringify(season, null, 2) + '\n');

  const changed = await writeWeeklyLog(renderLog(season, config));

  const played = season.weeks.map((w) => w.week);
  console.log(`Weeks with scores: ${played.length ? played.join(', ') : '(none yet)'}`);
  console.log(
    `Weekly winners: ${weeklyWinners(season, config).length}, ` +
      `200+ games: ${bigGames(season, config).length}`
  );
  console.log(changed ? 'weekly-log.js updated.' : 'weekly-log.js already current.');
}

main().catch((err) => {
  console.error(`\nIngest failed: ${err.message}\n`);
  process.exitCode = 1;
});
