// Franchise id -> GM, for any season.
//
// Ids are stable but a slot can change hands, so the current map in
// data/franchises.json is only correct for the current season. `history` there
// pins the seasons it is wrong for. One source of truth, read by the weekly
// ingest, the fixture builder and the lineup archive alike.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export async function loadFranchiseFile() {
  return JSON.parse(await readFile(join(root, 'data/franchises.json'), 'utf8'));
}

/**
 * The id -> GM map as it stood in `year`.
 *
 * A franchise that had not been created yet is simply absent, which is what
 * makes an expansion season work: 0011 does not appear before 2025 and callers
 * that meet it in an older season should fail rather than invent a GM.
 */
export function mapForSeason(file, year) {
  const map = new Map();
  for (const f of file.franchises) {
    if (!f.gm) continue;
    map.set(f.id, f.gm);
  }
  for (const h of file.history ?? []) {
    if (h.since != null && year < h.since) map.delete(h.id);
    else if (h.through != null && year <= h.through) map.set(h.id, h.gm);
  }
  return map;
}

/** Throws unless every franchise in the file carries a GM. */
export function assertFullyMapped(file) {
  const unmapped = file.franchises.filter((f) => !f.gm);
  if (unmapped.length) {
    throw new Error(
      `data/franchises.json has unmapped franchises:\n  ` +
        unmapped.map((f) => `${f.id} (${f.teamName})`).join('\n  ') +
        '\nFill in "gm" for each before the ingest can attribute scores. MFL carries ' +
        'no owner_name for this league, so this map cannot be fetched.'
    );
  }
}
