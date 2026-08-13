// Shared test fixtures and config.
//
// The config here mirrors data/league.config.mjs but is written out in full on
// purpose: these tests assert against seasons 2023-2025, and the live config
// follows the current season. Pinning it means rolling the league over to 2027
// cannot quietly change what a 2023 assertion means.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

export const CONFIG = {
  regularSeasonWeeks: Array.from({ length: 14 }, (_, i) => i + 1),
  playoffWeeks: [15, 16, 17],
  fantasyBowlWeek: 17,
  exhibitionWeeks: [18],
  playoffTeams: 6,
  byeSeeds: [1],
  eliminatedPerWeek: { 15: 2, 16: 2 },
  bigGameThreshold: 200,
  includeExhibitionInRecords: false,
};

/** A replayed season, as written by scripts/make-fixtures.mjs. */
export const fixture = (year) =>
  JSON.parse(readFileSync(join(here, `fixtures/${year}.json`), 'utf8'));

/** Hand-maintained Pakistan vs. the World sides. */
export const rosterFor = (year) =>
  JSON.parse(readFileSync(join(here, '../data/exhibition.json'), 'utf8')).seasons.find(
    (r) => r.year === year
  );

/** A season built from inline weeks, for unit tests that need no fixture. */
export const season = (weeks) => ({ season: 2026, weeks });
