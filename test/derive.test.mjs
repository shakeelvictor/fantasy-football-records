import test from 'node:test';
import assert from 'node:assert/strict';

import { CONFIG, fixture, rosterFor, season } from './helpers.mjs';
import {
  weeklyWinners,
  bigGames,
  allPlayRecords,
  seeds,
  playoffResult,
  tallyOnto,
  exhibitionResult,
} from '../src/derive.mjs';

// ── Replay tests ────────────────────────────────────────────────────────────
//
// The spec called for a frozen-archive test: derive() over seasons <= 2025
// byte-identical to a snapshot. That test cannot exist, because the archive
// holds no game-level data — only summary counts and prose. derive() would be
// passing its own input through, and the assertion would be a tautology.
//
// This is the substitute, and for what it covers it is stronger: replay real
// MFL seasons and check the derivation against records the league published
// independently, years before this code existed. If a refactor changes how a
// 2023 season resolves, these fail.

const RECORDED = {
  // Seed order and Fantasy Bowl result as recorded in data.js.
  2023: { field: ['Samson', 'Andres', 'Asher', 'Shak', 'Vip', 'Raj'], champ: 'Andres', runnerUp: 'Vip' },
  2024: { field: ['Raj', 'Samson', 'Dante', 'Asher', 'Shak', 'Anand'], champ: 'Raj', runnerUp: 'Samson' },
  2025: { field: ['Samson', 'Hoss', 'Asher', 'Imran', 'Laura', 'Shak'], champ: 'Shak', runnerUp: 'Laura' },
};

for (const [year, want] of Object.entries(RECORDED)) {
  test(`${year}: derived seeding matches the recorded playoff field`, () => {
    const got = seeds(fixture(year), CONFIG).slice(0, 6).map((s) => s.gm);
    assert.deepEqual(got, want.field);
  });

  test(`${year}: playoff fold reproduces the recorded Fantasy Bowl`, () => {
    const r = playoffResult(fixture(year), CONFIG);
    assert.equal(r.complete, true);
    assert.equal(r.champion.gm, want.champ);
    assert.equal(r.runnerUp.gm, want.runnerUp);
    assert.equal(r.champion.seed, want.field.indexOf(want.champ) + 1);
    assert.equal(r.runnerUp.seed, want.field.indexOf(want.runnerUp) + 1);
    assert.ok(r.champion.score > r.runnerUp.score);
  });

  test(`${year}: fold reduces 6 -> 3 -> 2`, () => {
    const r = playoffResult(fixture(year), CONFIG);
    assert.equal(r.field.length, 6);
    // Week 15: seeds 2-6 play, two go out.
    assert.equal(r.rounds[0].ranked.length, 5);
    assert.equal(r.rounds[0].eliminated.length, 2);
    // Week 16: three survivors plus the returning bye seed, two go out.
    assert.equal(r.rounds[1].ranked.length, 4);
    assert.equal(r.rounds[1].eliminated.length, 2);
  });

  test(`${year}: every GM plays a full all-play regular season`, () => {
    const rows = allPlayRecords(fixture(year), CONFIG);
    const teams = rows.length;
    for (const r of rows) assert.equal(r.games, (teams - 1) * 14);
  });

  test(`${year}: exactly one weekly winner per regular-season week`, () => {
    assert.equal(weeklyWinners(fixture(year), CONFIG).length, 14);
  });
}

// Golden values. These lock the arithmetic; they are the derivation's own
// output, verified once against MFL. Note they are not always identical to the
// numbers hand-entered on the site — see MIGRATION.md, "score drift".
test('2025: Samson posts the recorded 116-24 / .829 regular season', () => {
  const samson = allPlayRecords(fixture(2025), CONFIG).find((r) => r.gm === 'Samson');
  assert.equal(samson.wins, 116);
  assert.equal(samson.losses, 24);
  assert.equal(samson.ties, 0);
  assert.equal(samson.winPct.toFixed(3), '0.829');
});

// The regular-season winner is the best record at the end of Week 14, and takes
// the first-round bye. Seeding by total points instead is a plausible-sounding
// reading of the same rule and is wrong — it breaks the recorded field in every
// season available. This pins the difference down so nobody "fixes" it later.
test('seeding by record reproduces the field where seeding by points does not', () => {
  const byPoints = (year) =>
    allPlayRecords(fixture(year), CONFIG)
      .sort((a, b) => b.pointsFor - a.pointsFor || a.gm.localeCompare(b.gm))
      .slice(0, 6)
      .map((r) => r.gm);

  for (const [year, want] of Object.entries(RECORDED)) {
    assert.deepEqual(seeds(fixture(year), CONFIG).slice(0, 6).map((s) => s.gm), want.field);
    assert.notDeepEqual(byPoints(year), want.field, `${year} points-order should differ`);
  }
});

test('the bye goes to the best record, which is the top seed', () => {
  for (const [year, want] of Object.entries(RECORDED)) {
    const table = seeds(fixture(year), CONFIG);
    const best = allPlayRecords(fixture(year), CONFIG).reduce((a, b) =>
      b.winPct > a.winPct || (b.winPct === a.winPct && b.pointsFor > a.pointsFor) ? b : a
    );
    assert.equal(table[0].seed, 1);
    assert.equal(table[0].gm, best.gm);
    assert.equal(table[0].gm, want.field[0]);
  }
});

test('2023: Fantasy Bowl scores match the site exactly', () => {
  const r = playoffResult(fixture(2023), CONFIG);
  assert.equal(r.champion.score, 142.36);
  assert.equal(r.runnerUp.score, 125.67);
});

// ── Pakistan vs. the World ──────────────────────────────────────────────────

test('2024: Pakistan wins the first exhibition', () => {
  const r = exhibitionResult(fixture(2024), rosterFor(2024), CONFIG);
  assert.equal(r.winner, 'Pakistan');
  assert.equal(r.pakistan.total, 234.98);
  assert.equal(r.world.total, 183.11);
  assert.equal(r.margin, 51.87);
});

test('2025: the World wins with one fewer manager but the same lineup', () => {
  const r = exhibitionResult(fixture(2025), rosterFor(2025), CONFIG);
  assert.equal(r.winner, 'World');
  assert.equal(r.pakistan.total, 124.31);
  assert.equal(r.world.total, 147.63);
  assert.equal(r.margin, 23.32);
  // Six managers against five, but twelve players against twelve. The lineup
  // is what's equal — that is the whole format.
  assert.equal(r.pakistan.members.length, 6);
  assert.equal(r.world.members.length, 5);
  assert.equal(r.pakistan.players, 12);
  assert.equal(r.world.players, 12);
});

test('both sides field the same lineup size every season', () => {
  for (const year of [2024, 2025]) {
    const r = exhibitionResult(fixture(year), rosterFor(year), CONFIG);
    assert.equal(r.pakistan.players, r.world.players);
    assert.equal(r.pakistan.players, 12);
  }
});

test('a side total is the sum of its members, who contribute unevenly', () => {
  const r = exhibitionResult(fixture(2024), rosterFor(2024), CONFIG);
  // Dante alone supplied half the World's lineup.
  const dante = r.world.members.find((m) => m.gm === 'Dante');
  assert.equal(dante.players, 6);
  // A manager can contribute nobody and still be on the side.
  const anand = r.world.members.find((m) => m.gm === 'Anand');
  assert.equal(anand.players, 0);
  assert.equal(anand.score, 0);
  assert.equal(r.world.members.reduce((s, m) => s + m.players, 0), r.world.players);
});

test('unequal lineups are rejected rather than published as a result', () => {
  const lopsided = structuredClone(fixture(2025));
  const wk = lopsided.weeks.find((w) => w.week === 18);
  wk.scores.find((s) => s.gm === 'Shak').starters = 9;
  assert.throws(
    () => exhibitionResult(lopsided, rosterFor(2025), CONFIG),
    /Uneven exhibition lineups/
  );
});

test('every GM who played week 18 is on exactly one side', () => {
  for (const year of [2024, 2025]) {
    const week18 = fixture(year).weeks.find((w) => w.week === 18);
    const r = exhibitionResult(fixture(year), rosterFor(year), CONFIG);
    const named = [...r.pakistan.members, ...r.world.members].map((m) => m.gm);
    assert.equal(named.length, week18.scores.length);
    assert.equal(new Set(named).size, named.length);
  }
});

test('side totals sum to the week 18 total, so nobody is dropped', () => {
  for (const year of [2024, 2025]) {
    const week18 = fixture(year).weeks.find((w) => w.week === 18);
    const all = week18.scores.reduce((s, x) => s + x.score, 0);
    const r = exhibitionResult(fixture(year), rosterFor(year), CONFIG);
    assert.equal(Math.round((r.pakistan.total + r.world.total) * 100) / 100, Math.round(all * 100) / 100);
  }
});

test('a GM left off both sides is caught, not silently dropped', () => {
  const short = { ...rosterFor(2025), world: ['Laura', 'Anand', 'Vip', 'Andres'] }; // Dante missing
  assert.throws(() => exhibitionResult(fixture(2025), short, CONFIG), /missing Dante/);
});

test('a GM listed on both sides is caught', () => {
  const dupe = { ...rosterFor(2024), world: ['Raj', 'Anand', 'Vip', 'Andres', 'Dante', 'Shak'] };
  assert.throws(() => exhibitionResult(fixture(2024), dupe, CONFIG), /more than once/);
});

test('a season with no week 18 has no exhibition', () => {
  assert.equal(exhibitionResult(fixture(2023), { pakistan: [], world: [] }, CONFIG), null);
});

test('exhibition scores stay out of the 200+ club by default', () => {
  // Nobody has cleared 200 in a week 18 yet, so assert the rule directly.
  const s = { season: 2026, weeks: [{ week: 18, scores: [{ gm: 'Shak', score: 250 }] }] };
  assert.equal(bigGames(s, CONFIG).length, 0);
  assert.equal(bigGames(s, { ...CONFIG, includeExhibitionInRecords: true }).length, 1);
});

// ── Unit tests ──────────────────────────────────────────────────────────────

test('weekly winners ignore playoff and exhibition weeks', () => {
  const s = season([
    { week: 1, scores: [{ gm: 'Shak', score: 100 }, { gm: 'Vip', score: 90 }] },
    { week: 16, scores: [{ gm: 'Vip', score: 300 }, { gm: 'Shak', score: 10 }] },
    { week: 18, scores: [{ gm: 'Vip', score: 400 }, { gm: 'Shak', score: 10 }] },
  ]);
  assert.deepEqual(weeklyWinners(s, CONFIG), [{ week: 1, gm: 'Shak', score: 100 }]);
});

test('200+ club includes playoff weeks but excludes exhibitions by default', () => {
  const s = season([
    { week: 2, scores: [{ gm: 'Shak', score: 201 }, { gm: 'Vip', score: 199.99 }] },
    { week: 17, scores: [{ gm: 'Vip', score: 250 }] },
    { week: 18, scores: [{ gm: 'Vip', score: 260 }] },
  ]);
  assert.deepEqual(
    bigGames(s, CONFIG).map((g) => [g.week, g.gm]),
    [[2, 'Shak'], [17, 'Vip']]
  );
});

test('exhibition weeks count when the league says they do', () => {
  const s = season([{ week: 18, scores: [{ gm: 'Vip', score: 260 }] }]);
  const on = { ...CONFIG, includeExhibitionInRecords: true };
  assert.equal(bigGames(s, on).length, 1);
  assert.equal(bigGames(s, CONFIG).length, 0);
});

test('the 200 threshold is inclusive', () => {
  const s = season([{ week: 1, scores: [{ gm: 'Shak', score: 200 }] }]);
  assert.equal(bigGames(s, CONFIG).length, 1);
});

test('tied weekly scores resolve by name, so the sort is total', () => {
  const s = season([{ week: 1, scores: [{ gm: 'Vip', score: 120 }, { gm: 'Anand', score: 120 }] }]);
  assert.equal(weeklyWinners(s, CONFIG)[0].gm, 'Anand');
});

test('all-play counts a tie as half a win, matching MFL', () => {
  const s = season([
    { week: 1, scores: [{ gm: 'A', score: 100 }, { gm: 'B', score: 100 }, { gm: 'C', score: 50 }] },
  ]);
  const a = allPlayRecords(s, CONFIG).find((r) => r.gm === 'A');
  assert.deepEqual([a.wins, a.losses, a.ties], [1, 0, 1]);
  assert.equal(a.winPct, 0.75);
});

test('seeding breaks equal win pct on points for', () => {
  const s = season([
    { week: 1, scores: [{ gm: 'A', score: 200 }, { gm: 'B', score: 100 }] },
    { week: 2, scores: [{ gm: 'A', score: 100 }, { gm: 'B', score: 150 }] },
  ]);
  const [first, second] = seeds(s, CONFIG);
  assert.equal(first.winPct, second.winPct);
  assert.equal(first.gm, 'A'); // 300 pf vs 250
});

test('an incomplete postseason reports incomplete rather than guessing', () => {
  const s = { ...fixture(2025) };
  s.weeks = s.weeks.filter((w) => w.week !== 17);
  const r = playoffResult(s, CONFIG);
  assert.equal(r.complete, false);
  assert.equal(r.champion, undefined);
});

test('a second bye is rejected even though the counts still work out', () => {
  // This is the trap. With two byes the fold still lands on 2 (4 -> 2, plus 2
  // returning -> 4 -> 2), so a team-count assertion at the Fantasy Bowl passes
  // while two GMs have quietly been handed a week off. The guard is explicit.
  const bad = { ...CONFIG, byeSeeds: [1, 2] };
  assert.throws(() => playoffResult(fixture(2025), bad), /assumes exactly one bye/);
});

test('a field that cannot reduce to two is caught at the Fantasy Bowl', () => {
  // 5 teams, 1 bye: week 15 has 4, drop 2 -> 2; week 16 has 3, drop 2 -> 1.
  const bad = { ...CONFIG, playoffTeams: 5 };
  assert.throws(() => playoffResult(fixture(2025), bad), /did not reduce to 2/);
});

test('tally adds onto the frozen baseline without mutating it', () => {
  const baseline = [{ gm: 'Samson', count: 35 }, { gm: 'Shak', count: 15 }];
  const out = tallyOnto(baseline, ['Shak', 'Shak', 'Laura']);
  assert.equal(out.find((r) => r.gm === 'Shak').count, 17);
  assert.equal(out.find((r) => r.gm === 'Laura').count, 1);
  assert.equal(baseline[1].count, 15);
});
