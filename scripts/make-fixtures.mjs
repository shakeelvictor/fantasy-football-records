// Dev-only. Regenerates the checked-in replay fixtures in test/fixtures/.
// Run by hand (`node scripts/make-fixtures.mjs`) when you want to add a season;
// the weekly job never touches this. Fixtures are committed so `npm test`
// stays offline and deterministic.

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { config } from '../data/league.config.mjs';
import { fetchWeeklyResults } from '../src/mfl/client.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Franchise 0002 changed hands after 2024 (Raj out, Ryaan in) and 0011 did not
// exist before Laura joined in 2025, so the current map in data/franchises.json
// cannot be applied to older seasons. These are the per-season maps.
const BASE = {
  '0001': 'Shak',
  '0003': 'Samson',
  '0004': 'Imran',
  '0005': 'Hoss',
  '0006': 'Andres',
  '0007': 'Asher',
  '0008': 'Dante',
  '0009': 'Vip',
  '0010': 'Anand',
};

const MAPS = {
  2023: { ...BASE, '0002': 'Raj' },
  2024: { ...BASE, '0002': 'Raj' },
  2025: { ...BASE, '0002': 'Ryaan', '0011': 'Laura' },
};

for (const [season, map] of Object.entries(MAPS)) {
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
