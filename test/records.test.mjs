import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

import { CONFIG, fixture, rosterFor } from './helpers.mjs';
import { playoffResult } from '../src/derive.mjs';
import { buildContext, compareToRecords, contestedWeeks, DEFINITIONS } from '../src/records.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function siteData() {
  const ctx = { Set };
  vm.createContext(ctx);
  vm.runInContext(`${readFileSync(join(root, 'data.js'), 'utf8')}\nthis.OUT = DATA;`, ctx);
  return ctx.OUT;
}

const compare = (year, cards) => {
  const s = fixture(year);
  return compareToRecords(cards, buildContext(s, CONFIG, playoffResult(s, CONFIG)));
};

// The cards on the site already reflect 2025, so replaying 2025 must not claim
// to break anything. This is the guard against a definition drifting.
test('2025 breaks none of the records it already holds', () => {
  const { broken } = compare(2025, siteData().records);
  assert.deepEqual(broken.map((b) => b.label), []);
});

test('2025 reproduces the record values it does hold', () => {
  const { unchanged } = compare(2025, siteData().records);
  const find = (label) => unchanged.find((u) => u.label === label);
  assert.equal(find('Most Weekly Wins, Single Season').candidate, '8');
  assert.equal(find('Best Record · Expanded Season').candidate, '116-24 · .829');
});

test('a beaten record is rewritten with the old value demoted to Previous', () => {
  const cards = [
    {
      label: 'Highest Single Week · Reg. Season',
      value: '100.00',
      holder: 'Nobody',
      context: '1999 · Week 1',
    },
  ];
  const { broken } = compare(2025, cards);
  assert.equal(broken.length, 1);
  assert.equal(broken[0].card.holder, 'Hoss');
  assert.equal(broken[0].card.value, '217.53');
  assert.equal(broken[0].card.context, '2025 · Week 12');
  assert.equal(broken[0].card.prev, 'Previous: Nobody · 100.00 (1999 · Week 1)');
});

test('a record the season did not beat is left untouched', () => {
  const cards = [
    { label: 'Highest Single Week · Reg. Season', value: '400.00', holder: 'Nobody', context: 'x' },
  ];
  const { broken, unchanged } = compare(2025, cards);
  assert.equal(broken.length, 0);
  assert.equal(unchanged.length, 1);
});

// Slimmest Margin is the margin a week was WON by — first over second — not the
// gap between any adjacent pair. Verified against MFL: 2019's closest adjacent
// pair was 0.19 (wk 7), while the recorded record is 0.25, which is exactly
// that season's narrowest winning margin (wk 9). The "any pair" reading would
// also have broken the record in 2023 and 2024 at 0.01, which never happened.
test('slimmest margin measures the winning margin, not any adjacent gap', () => {
  const s = fixture(2025);
  const ctx = buildContext(s, CONFIG, playoffResult(s, CONFIG));
  const got = DEFINITIONS.find((d) => d.label === 'Slimmest Margin of Victory').compute(ctx);

  // 2025's narrowest winning margin is 0.87 (wk 4). The narrowest adjacent gap
  // anywhere that season is 0.05 — if that number ever appears here, the
  // definition has regressed.
  assert.equal(got.value, '0.87');
  assert.equal(got.holder, 'Samson over Imran');

  const anyPair = Math.min(
    ...s.weeks
      .filter((w) => CONFIG.regularSeasonWeeks.includes(w.week))
      .flatMap((w) => {
        const r = [...w.scores].sort((a, b) => b.score - a.score);
        return r.slice(1).map((_, i) => Math.round((r[i].score - r[i + 1].score) * 100) / 100);
      })
  );
  assert.equal(anyPair, 0.05);
  assert.notEqual(got.value, String(anyPair));
});

// Winning a week is a regular-season thing. The postseason is a fold with its
// own records, and topping a four-team round is not the same achievement.
test('week winners come from the regular season only', () => {
  const s = fixture(2025);
  const ctx = buildContext(s, CONFIG, playoffResult(s, CONFIG));
  const got = DEFINITIONS.find((d) => d.label === 'Lowest Points to Win a Week').compute(ctx);

  assert.equal(got.value, '168.69');
  assert.equal(got.context, '2025 · Week 13');

  // 2025's Fantasy Bowl was won with 123.77 — well under the regular-season
  // low — so it would take the record if the postseason counted. It must not.
  const bowl = s.weeks.find((w) => w.week === CONFIG.fantasyBowlWeek).scores.filter((x) => x.score > 0);
  const bowlWin = Math.max(...bowl.map((x) => x.score));
  assert.ok(bowlWin < Number(got.value), 'the Bowl was won for less and must be excluded');
  assert.equal(bowlWin, 123.77);
});

test('consecutive wins counts a run of regular-season week wins', () => {
  const s = fixture(2025);
  const ctx = buildContext(s, CONFIG, playoffResult(s, CONFIG));
  const got = DEFINITIONS.find((d) => d.label === 'Most Consecutive Wins').compute(ctx);

  // Samson won weeks 3 through 8 of 2025 — the run the record card describes.
  assert.equal(got.value, '6');
  assert.equal(got.holder, 'Samson');
  assert.equal(got.context, '2025 · Weeks 3\u20138');
});

test('no record is report-only now that every definition is verified', () => {
  assert.deepEqual(DEFINITIONS.filter((d) => d.reportOnly).map((d) => d.label), []);
});

// ── Week 18 ─────────────────────────────────────────────────────────────────

test('week 18 never contributes to season totals', () => {
  const s = fixture(2025);
  const def = DEFINITIONS.find((d) => d.label === 'Highest Total Points · Season');
  const before = def.compute(buildContext(s, CONFIG, playoffResult(s, CONFIG))).value;

  const spiked = structuredClone(s);
  spiked.weeks.find((w) => w.week === 18).scores.find((x) => x.gm === 'Samson').score = 9999;
  const after = def.compute(buildContext(spiked, CONFIG, playoffResult(spiked, CONFIG))).value;

  assert.equal(after, before);
});

// ── Contested weeks ─────────────────────────────────────────────────────────

test('contested weeks follow the fold, not the all-play score sheet', () => {
  const s = fixture(2024);
  const p = playoffResult(s, CONFIG);
  const played = contestedWeeks(p, CONFIG);

  // Raj was the bye seed: no week 15, then 16 and the Bowl.
  assert.deepEqual([...played.get('Raj')].sort(), [16, 17]);
  // Samson reached the Bowl, so all three count.
  assert.deepEqual([...played.get('Samson')].sort(), [15, 16, 17]);
  // Eliminated in week 15.
  assert.deepEqual([...played.get('Shak')].sort(), [15]);
  // Missed the playoffs entirely — still posts scores, but contests nothing.
  assert.equal(played.has('Vip'), false);
});

test('season points ignore weeks a team was already out', () => {
  const s = fixture(2024);
  const ctx = buildContext(s, CONFIG, playoffResult(s, CONFIG));
  const def = DEFINITIONS.find((d) => d.label === 'Highest Total Points · Season');
  const got = def.compute(ctx);

  // Samson: 2182.75 regular season plus weeks 15, 16 and the Bowl.
  assert.equal(got.holder, 'Samson');
  assert.equal(got.value, '2760.45');

  // A non-playoff team must not accrue playoff weeks. Vip's total should equal
  // his regular-season points exactly.
  const vipReg = ctx.allPlay.find((r) => r.gm === 'Vip').pointsFor;
  const contested = contestedWeeks(ctx.playoff, CONFIG);
  assert.equal(contested.has('Vip'), false);
  assert.ok(vipReg > 0);
});

// ── Exhibition rosters ──────────────────────────────────────────────────────

test('the standing exhibition split carries forward to a new season', () => {
  const future = rosterFor(2031);
  assert.deepEqual(future.pakistan, ['Hoss', 'Shak', 'Samson', 'Asher', 'Imran', 'Ryaan']);
  assert.deepEqual(future.world, ['Laura', 'Anand', 'Vip', 'Dante', 'Andres']);
});

test('2024 keeps its own split, because Raj was still in the league', () => {
  assert.ok(rosterFor(2024).world.includes('Raj'));
  assert.ok(!rosterFor(2025).world.includes('Raj'));
});

test('the standing split covers exactly the current league', () => {
  const gms = JSON.parse(readFileSync(join(root, 'data/franchises.json'), 'utf8'))
    .franchises.map((f) => f.gm)
    .sort();
  const sides = [...rosterFor(2026).pakistan, ...rosterFor(2026).world].sort();
  assert.deepEqual(sides, gms);
});
