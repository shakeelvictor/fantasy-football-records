// The two-season cap must be derived from the keeper history, never listed.
//
// The league publishes the capped players by hand each year in Notion, which
// is exactly the kind of list that goes stale a season after someone forgets
// it. These tests load the real keepers.js and check its derivation against
// the four names the league published for 2026, and against every season on
// record.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(here, '..', f), 'utf8');

/**
 * Load the browser scripts as the page does. keepers.js touches `document`
 * only to find elements that a stub can answer for, and its real work waits
 * on DOMContentLoaded, which never fires here — so the derivation loads clean.
 */
function loadKeepers() {
  const doc = { getElementById: () => null, addEventListener: () => {}, querySelectorAll: () => [] };
  const load = new Function(
    'document',
    `${read('keepers-data.js')}\n${read('keepers.js')}\nreturn { KEEPERS, cappedFor };`,
  );
  return load(doc);
}

const { KEEPERS, cappedFor } = loadKeepers();
const keptBy = (year) => {
  const s = KEEPERS.find((x) => x.year === year);
  return new Map(s ? s.owners.flatMap((o) => o.picks.map((p) => [p.player, o.owner])) : []);
};

test('the cap reproduces the four players the league published for 2026', () => {
  const capped = cappedFor(2026)
    .map((c) => `${c.player} (${c.owner})`)
    .sort();

  assert.deepEqual(capped, [
    'Kyren Williams (Anand)',
    'Nico Collins (Shak)',
    'Puka Nacua (Samson)',
    'Trey McBride (Dante)',
  ]);
});

test('nobody in 13 seasons was kept a third straight year', () => {
  // The cap is only a sound reading of the history if the history obeys it.
  for (const season of KEEPERS) {
    const kept = keptBy(season.year);
    const broke = cappedFor(season.year).filter((c) => kept.get(c.player) === c.owner);
    assert.deepEqual(broke, [], `${season.year} kept a capped player again`);
  }
});

test('the clock follows the player, but a gap resets it', () => {
  // The league ruled in 2026 that two back-to-back keeper seasons cap a player
  // even across GMs. The boundary that still matters is the gap: counting two
  // keeper seasons in a CAREER rather than two IN A ROW would unseat keepers
  // the league actually declared, so this pins that half of the rule.
  const everBlocked = [];
  const seen = new Map();
  for (const season of KEEPERS) {
    for (const owner of season.owners) {
      for (const pick of owner.picks) {
        if ((seen.get(pick.player) || 0) >= 2) everBlocked.push(`${pick.player} (${season.year})`);
        seen.set(pick.player, (seen.get(pick.player) || 0) + 1);
      }
    }
  }

  assert.ok(everBlocked.length >= 6, 'a career count should conflict with the declarations');
  assert.ok(
    everBlocked.some((e) => e.startsWith('Matthew Stafford')),
    'Stafford came back as a keeper after a gap and must stay legal',
  );

  // ...and none of them is capped by the rule as implemented.
  for (const year of [...KEEPERS.map((s) => s.year), 2027]) {
    const capped = cappedFor(year);
    for (const c of capped) {
      assert.ok(keptBy(year - 1).has(c.player), `${c.player} was capped without a season in ${year - 1}`);
      assert.ok(keptBy(year - 2).has(c.player), `${c.player} was capped without a season in ${year - 2}`);
    }
  }
});

test('the season ahead is capped off the last one declared', () => {
  // 2027 is knowable now: the cap is fixed the moment 2026's keepers are in.
  const capped = cappedFor(2027).map((c) => `${c.player} (${c.owner})`).sort();

  assert.deepEqual(capped, [
    'Bo Nix (Austin)',
    'Brian Thomas Jr. (Samson)',
    'Bucky Irving (Imran)',
    'Drake Maye (Andres)',
    'Jameson Williams (Asher)',
    'Jordan Addison (Samson)',
  ]);
});

test('a keeper who changed hands back-to-back is capped, and says so', () => {
  // Brian Thomas Jr. was Dante's keeper in 2025 and Samson's in 2026. He is the
  // first player to reach a third year after changing hands, and the case the
  // league's 2026 ruling was made for.
  const btj = cappedFor(2027).find((c) => c.player === 'Brian Thomas Jr.');

  assert.ok(btj, 'Brian Thomas Jr. must be capped for 2027');
  assert.equal(btj.owner, 'Samson', 'the GM who loses him');
  assert.equal(btj.from, 'Dante', 'the GM he came from, so the chip can show the handoff');
});

test('the four earlier changed-hands keepers agree with the ruling', () => {
  // J.J. Watt, Brandon Aiyuk, Justin Jefferson and Cam Akers all changed hands
  // after back-to-back keeps and none was kept a third year. Under the ruling
  // that is the rule working, not four coincidences — so the history must
  // contain no season that breaks it.
  const handoffs = [];
  for (const season of KEEPERS) {
    const kept = keptBy(season.year);
    for (const c of cappedFor(season.year)) {
      if (c.from) handoffs.push(`${c.player} (${season.year})`);
      assert.ok(!kept.has(c.player), `${season.year}: ${c.player} was kept a third year`);
    }
  }

  assert.deepEqual(handoffs, [
    'J.J. Watt (2017)',
    'Brandon Aiyuk (2023)',
    'Justin Jefferson (2023)',
    'Cam Akers (2024)',
  ]);
});

test('the rules page documents the cap the code enforces', () => {
  const rules = read('rules-data.js');
  const keepers = rules.slice(rules.indexOf("id: 'keepers'"), rules.indexOf("id: 'trades'"));

  assert.match(keepers, /kept two seasons/, 'the two-season cap is undocumented');
  assert.match(keepers, /follows the player/, 'the cross-GM ruling is undocumented');
  assert.match(keepers, /gap resets it/i, 'the gap half of the rule is undocumented');
});

test('the capped list is not typed into the page', () => {
  const js = read('keepers.js');
  for (const name of ['Puka Nacua', 'Nico Collins', 'Kyren Williams', 'Trey McBride']) {
    assert.ok(!js.includes(name), `${name} is hardcoded in keepers.js`);
  }
  assert.match(js, /cappedFor\(season\.year\)/, 'the season block no longer derives its capped list');
});
