// In-season record update. Runs every week next to the ingest, so a record
// broken in Week 3 reaches the site that Thursday instead of sitting in
// weekly-log.js until season-end records the year in January.
//
// Only the cards flagged `inSeason` in records.mjs are eligible — the ones that
// are monotone in weeks played, so a half-finished season can break them early
// but can never overstate them. Everything else (win pct, anything needing the
// playoff fold) waits for season-end, where the inputs are final.
//
// Idempotent: it rewrites a card only when this season genuinely beats it, so
// once a record is promoted, later weeks leave it alone and no commit is made.
// season-end recomputes the same cards from the finished season and finds them
// already current.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { config } from '../data/league.config.mjs';
import { loadSiteData, writeSiteData } from './write-data.mjs';
import { buildContext, compareToRecords, playerIdsToResolve, IN_SEASON } from './records.mjs';
import { fetchPlayerNames } from './mfl/client.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export async function updateRecords({ dryRun = false } = {}) {
  let season;
  try {
    season = JSON.parse(await readFile(join(root, `data/${config.season}.json`), 'utf8'));
  } catch {
    // Before the first ingest of a new year there is nothing to measure.
    return { status: 'no-season-file', season: config.season, broken: [] };
  }
  if (!season.weeks?.length) {
    return { status: 'no-weeks', season: config.season, broken: [] };
  }

  const data = await loadSiteData();

  // No playoff, no champions, no seasonsList. The definitions that need them
  // are not in IN_SEASON, so nothing here can read a half-built context and
  // quietly compute the wrong thing.
  const ctx = buildContext(season, config, null);

  let playerNames = new Map();
  const ids = playerIdsToResolve(ctx, IN_SEASON);
  if (ids.length) {
    playerNames = await fetchPlayerNames(config.season, config.leagueId, ids);
  }

  const { broken } = compareToRecords(data.records, ctx, playerNames, IN_SEASON);
  const played = season.weeks.map((w) => w.week).sort((a, b) => a - b);
  if (!broken.length) {
    return { status: 'no-change', season: config.season, played, broken: [] };
  }

  const records = data.records.map((card) => {
    const hit = broken.find((b) => b.label === card.label);
    return hit ? hit.card : card;
  });

  const written = dryRun ? false : await writeSiteData({ records });
  return {
    status: dryRun ? 'dry-run' : written ? 'updated' : 'no-change',
    season: config.season,
    played,
    broken,
  };
}

// Run directly: `node src/records-update.mjs [--dry-run]`
if (process.argv[1] && process.argv[1].endsWith('records-update.mjs')) {
  updateRecords({ dryRun: process.argv.includes('--dry-run') })
    .then((r) => {
      if (r.status === 'no-season-file') {
        return console.log(`No data/${r.season}.json yet — run the ingest first. Nothing to do.`);
      }
      if (r.status === 'no-weeks') return console.log(`${r.season} has no weeks played yet. Nothing to do.`);
      console.log(`${r.season} weeks played: ${r.played.join(', ')}`);
      console.log(`Records broken: ${r.broken.length}`);
      for (const b of r.broken) {
        console.log(`  · ${b.label}: ${b.was.value} (${b.was.holder}) -> ${b.card.value} (${b.card.holder})`);
      }
      console.log(`\nStatus: ${r.status}`);
    })
    .catch((err) => {
      console.error(`\nrecords-update failed: ${err.message}\n`);
      process.exitCode = 1;
    });
}
