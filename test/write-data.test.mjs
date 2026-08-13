import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { loadSiteData, writeSiteData } from '../src/write-data.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const GENERATED = [
  'champions',
  'seasons',
  'exhibition',
  'playoffApps',
  'bowlApps',
  'records',
  'weeklyWinsBaseline',
  'bigGamesBaseline',
];

// The weekly job runs season-end every week for months after the season ends.
// If writing the same data back produced a diff, every one of those runs would
// commit churn. writeSiteData returns false without touching the file when
// nothing changed, so this asserts the round-trip is lossless.
test('writing data.js back unchanged is a no-op', async () => {
  const before = readFileSync(join(root, 'data.js'), 'utf8');
  const data = await loadSiteData();

  const changed = await writeSiteData(Object.fromEntries(GENERATED.map((k) => [k, data[k]])));

  assert.equal(changed, false);
  assert.equal(readFileSync(join(root, 'data.js'), 'utf8'), before);
});

test('every generated block has its markers', () => {
  const src = readFileSync(join(root, 'data.js'), 'utf8');
  for (const key of GENERATED) {
    assert.ok(src.includes(`// >>> BEGIN GENERATED ${key}`), `missing BEGIN for ${key}`);
    assert.ok(src.includes(`// <<< END GENERATED ${key}`), `missing END for ${key}`);
  }
});

test('hand-maintained sections have no markers and stay out of reach', async () => {
  const src = readFileSync(join(root, 'data.js'), 'utf8');
  for (const key of ['tidbits', 'drafts']) {
    assert.ok(!src.includes(`BEGIN GENERATED ${key}`), `${key} should not be generated`);
  }
  const data = await loadSiteData();
  assert.ok(data.tidbits.length > 0);
  assert.ok(data.drafts.length > 0);
});

test('a key with no serializer is refused rather than silently skipped', async () => {
  await assert.rejects(() => writeSiteData({ tidbits: ['nope'] }), /No serializer/);
});

test('data.js still parses as the browser loads it', async () => {
  const data = await loadSiteData();
  for (const key of GENERATED) assert.ok(Array.isArray(data[key]), `${key} should be an array`);
  // Spot-check the shapes app.js depends on.
  assert.ok(data.champions.every((c) => typeof c.year === 'number' && typeof c.champ === 'string'));
  assert.ok(data.records.every((r) => typeof r.label === 'string' && typeof r.value === 'string'));
  assert.ok(data.exhibition.every((e) => typeof e.pakistan.total === 'number'));
});
