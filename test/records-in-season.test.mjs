// The weekly record pass promotes cards mid-season. These tests fix which
// records are eligible and prove why the rest are not.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

import { CONFIG, fixture } from './helpers.mjs';
import { buildContext, compareToRecords, DEFINITIONS, IN_SEASON } from '../src/records.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function siteData() {
  const ctx = { Set };
  vm.createContext(ctx);
  vm.runInContext(`${readFileSync(join(root, 'data.js'), 'utf8')}\nthis.OUT = DATA;`, ctx);
  return ctx.OUT;
}

/** The season as it looked after `n` weeks — what a Thursday run actually sees. */
const through = (year, n) => {
  const s = fixture(year);
  return { ...s, weeks: s.weeks.filter((w) => w.week <= n) };
};

const inSeason = (season, cards) =>
  compareToRecords(cards, buildContext(season, CONFIG, null), new Map(), IN_SEASON);

test('the weekly pass is limited to the records that cannot be overstated early', () => {
  assert.deepEqual(
    IN_SEASON.map((d) => d.label).sort(),
    [
      'Highest Points to Start a Season',
      'Highest Single Week · Reg. Season',
      'Highest Single-Player · Playoffs',
      'Highest Single-Player · Reg. Season',
      'Highest Total Points · Reg. Season',
      'Lowest Points to Win a Week',
      'Lowest Single-Game Total',
      'Most Consecutive Wins',
      'Most Weekly Wins, Single Season',
      'Slimmest Margin of Victory',
    ]
  );
});

test('rate and playoff-dependent records are left to season-end', () => {
  const held = new Set(IN_SEASON.map((d) => d.label));
  for (const label of [
    'Best Record · Expanded Season',
    'Worst Record · Expanded Season',
    'Highest Total Points · Season',
    'Highest Playoff Points',
    'Widest Fantasy Bowl Margin',
    'Most Fantasy Bowl Championships',
    'Most Consecutive Playoff Apps',
  ]) {
    assert.equal(held.has(label), false, `${label} must not run mid-season`);
    assert.ok(DEFINITIONS.some((d) => d.label === label), `${label} should still exist`);
  }
});

// The reason the flag exists. After one week every team is 11-0 or 0-11, so the
// full definition set would rewrite both record cards with a .1000 season that
// has not been played. This is the failure the weekly pass has to not have.
test('a one-week season would break Best Record if the full set ran', () => {
  const cards = siteData().records;
  const wk1 = through(2025, 1);

  const all = compareToRecords(cards, buildContext(wk1, CONFIG, null), new Map(), DEFINITIONS);
  const labels = all.broken.map((b) => b.label);
  assert.ok(labels.includes('Best Record · Expanded Season'));
  assert.ok(labels.includes('Worst Record · Expanded Season'));

  // And does not, through the weekly pass.
  const weekly = inSeason(wk1, cards);
  assert.deepEqual(
    weekly.broken.filter((b) => b.label.includes('Record · Expanded Season')),
    []
  );
});

test('a partial season never claims a total the finished season undercuts', () => {
  const cards = siteData().records;
  const label = 'Highest Total Points · Reg. Season';
  const read = (c) => parseFloat(c.value);

  let prev = 0;
  for (const n of [4, 8, 14]) {
    const { broken, unchanged } = inSeason(through(2025, n), cards);
    const hit = broken.find((b) => b.label === label);
    const same = unchanged.find((u) => u.label === label);
    const candidate = parseFloat(hit ? hit.card.value : same.candidate);
    assert.ok(candidate >= prev, `week ${n} total went backwards`);
    prev = candidate;
  }
  assert.ok(prev > 0);
  assert.ok(read(cards.find((c) => c.label === label)) >= 0);
});

// Promoting week by week must land on the same book as one pass at the end,
// or the site would show a different record depending on when it was computed.
test('week-by-week promotion converges on the same cards as a single pass', () => {
  const year = 2023;
  const start = siteData().records;

  let running = start;
  for (let n = 1; n <= 14; n++) {
    const { broken } = inSeason(through(year, n), running);
    running = running.map((card) => {
      const hit = broken.find((b) => b.label === card.label);
      return hit ? hit.card : card;
    });
  }

  const { broken } = inSeason(fixture(year), start);
  const once = start.map((card) => {
    const hit = broken.find((b) => b.label === card.label);
    return hit ? hit.card : card;
  });

  for (const label of IN_SEASON.map((d) => d.label)) {
    const a = running.find((c) => c.label === label);
    const b = once.find((c) => c.label === label);
    if (!a || !b) continue;
    assert.equal(a.value, b.value, `${label} value diverged`);
    assert.equal(a.holder, b.holder, `${label} holder diverged`);
  }
});

// season-end must not re-promote what the weekly pass already wrote, or every
// January would commit a card whose "Previous:" line points at itself.
test('season-end finds nothing left to do after the weekly pass has run', () => {
  const year = 2023;
  const s = fixture(year);
  const start = siteData().records;

  const { broken } = inSeason(s, start);
  const after = start.map((card) => {
    const hit = broken.find((b) => b.label === card.label);
    return hit ? hit.card : card;
  });

  const again = inSeason(s, after);
  assert.deepEqual(again.broken.map((b) => b.label), []);
});
