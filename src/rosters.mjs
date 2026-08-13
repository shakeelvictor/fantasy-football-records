// Pakistan vs. the World sides for a given season.
//
// The split is standing: it carries forward year to year, so a normal season
// needs no edit. Only a season whose sides genuinely differed gets an override.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export async function loadExhibitionRosters() {
  return JSON.parse(await readFile(join(root, 'data/exhibition.json'), 'utf8'));
}

/** The sides for `year`: its override if one exists, otherwise the standing split. */
export function rosterForSeason(file, year) {
  const override = (file.overrides ?? []).find((o) => o.year === year);
  const { pakistan, world } = override ?? file.standing;
  return { year, pakistan, world };
}
