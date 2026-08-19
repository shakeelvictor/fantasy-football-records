// Dev-only. Regenerates the checked-in replay fixtures in test/fixtures/.
// Run by hand (`node scripts/make-fixtures.mjs`) when you want to add a season;
// the weekly job never touches this. Fixtures are committed so `npm test`
// stays offline and deterministic.

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { config } from '../data/league.config.mjs';
import { fetchWeeklyResults } from '../src/mfl/client.mjs';
import { loadFranchiseFile, mapForSeason } from '../src/franchise-map.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Seasons to replay. The id -> GM map for each comes from data/franchises.json,
// which knows that 0002 changed hands after 2024 and that 0011 did not exist
// before the 2025 expansion.
const SEASONS = [2023, 2024, 2025];

const file = await loadFranchiseFile();

for (const season of SEASONS) {
  const map = Object.fromEntries(mapForSeason(file, season));
  const weeks = await fetchWeeklyResults(season, config.leagueId);
  const out = {
    season: Number(season),
    weeks: weeks.map((w) => ({
      week: w.week,
      scores: w.scores
        .map((s) => {
          if (!map[s.id]) throw new Error(`${season}: unmapped franchise ${s.id}`);
          return { gm: map[s.id], score: s.score, starters: s.starters, topPlayer: s.topPlayer };
        })
        .sort((a, b) => a.gm.localeCompare(b.gm)),
    })),
  };
  await mkdir(join(root, 'test/fixtures'), { recursive: true });
  await writeFile(join(root, `test/fixtures/${season}.json`), JSON.stringify(out, null, 2) + '\n');
  console.log(`wrote test/fixtures/${season}.json (${out.weeks.length} weeks)`);
}
