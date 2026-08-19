// League payouts.
//
// The invariant that makes this trustworthy is that the league pays out the
// whole pot: every season must sum to exactly `teams x buyIn`, and across the
// league the net must be zero. A structure that does not reconcile is wrong,
// not approximate, and settleSeason refuses it rather than publishing a gap.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { settleSeason, careerPayouts, netPositions } from '../src/payouts.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(here, '..', f), 'utf8');
const payouts = JSON.parse(read('data/payouts.json'));
const archive = (year) => JSON.parse(read(`data/lineups/${year}.json`));

const settledYears = () =>
  payouts.seasons
    .map((s) => s.year)
    .filter((y) => {
      try { return archive(y).weeklyWinners?.length > 0; } catch { return false; }
    });

test('every recorded structure pays out its whole pot', () => {
  // 13 or 14 weekly winners plus the three season prizes, against teams x buy-in.
  for (const s of payouts.seasons) {
    const weeks = s.year <= 2020 ? 13 : 14;
    const teams = s.year >= 2025 ? 11 : 10;
    const sum = weeks * s.weekly + s.regularSeason + s.champion + s.runnerUp;
    assert.equal(sum, teams * s.buyIn,
      `${s.year} pays $${sum} against a $${teams * s.buyIn} pool`);
  }
});

test('the 2021 restructure is arithmetic, not a coincidence', () => {
  // The regular-season prize drops in exactly the year the schedule gains a
  // week, by exactly one weekly payout. This is what justifies trusting the
  // 2019/2020 champion figures, which the notes never state.
  const y = (n) => payouts.seasons.find((s) => s.year === n);
  assert.equal(y(2020).regularSeason - y(2021).regularSeason, y(2021).weekly);
  assert.equal(y(2019).regularSeason, 195);
  assert.equal(y(2021).regularSeason, 160);
});

test('a season that does not reconcile is refused, not published', () => {
  assert.throws(
    () => settleSeason({
      year: 2099,
      structure: { buyIn: 100, weekly: 35, regularSeason: 160, champion: 250, runnerUp: 100 },
      teams: 10,
      winners: { weekly: ['A'], regularSeason: 'B', champion: 'C', runnerUp: 'D' },
    }),
    /does not reconcile/
  );
});

test('nothing before 2019 is priced', () => {
  assert.equal(Math.min(...payouts.seasons.map((s) => s.year)), 2019);
  const src = read('payouts-data.js');
  assert.doesNotMatch(src, /span: '(200\d|201[0-8])/, 'the Yahoo era must not be priced');
});

test('every settled season reconciles, and the league nets to zero', () => {
  const years = settledYears();
  assert.ok(years.length > 0, 'no season has weekly winners recorded yet');

  const settled = [];
  const played = new Map();
  for (const year of years) {
    const season = archive(year);
    const DATA = new Function(`${read('data.js')}; return DATA;`).call({ Set });
    const champ = DATA.champions.find((c) => c.year === year);
    const field = DATA.seasons.find((s) => s.year === year);

    // settleSeason throws unless it balances, so reaching the push is the test.
    settled.push(settleSeason({
      year,
      structure: payouts.seasons.find((s) => s.year === year),
      teams: season.managers.length,
      winners: {
        weekly: season.weeklyWinners.map((w) => w.gm),
        regularSeason: field.teams[0],
        champion: champ.champ,
        runnerUp: champ.runnerUp,
      },
    }));
    played.set(year, season.managers.map((m) => m.gm));
  }

  const net = netPositions(settled, played);
  const sum = net.reduce((n, r) => n + r.net, 0);
  assert.equal(sum, 0, 'the league is zero-sum: every dollar won came from a buy-in');

  // Everyone who bought in is listed, including the managers who won nothing.
  const everyone = new Set([...played.values()].flat());
  assert.equal(net.length, everyone.size, 'a manager who never cashed must still appear');

  const won = careerPayouts(settled).reduce((n, c) => n + c.total, 0);
  const pot = settled.reduce((n, s) => n + s.pool, 0);
  assert.equal(won, pot, 'winnings must account for the entire pot');
});

test('the browser file lists everyone and balances', () => {
  const src = read('payouts-data.js');
  assert.doesNotMatch(src, /^\s*(import|export)\s/m, 'must not be an ES module');

  const PAYOUTS = new Function(`${src}; return PAYOUTS;`)();
  assert.equal(PAYOUTS.careers.reduce((n, c) => n + c.net, 0), 0);
  assert.equal(PAYOUTS.careers.reduce((n, c) => n + c.won, 0), PAYOUTS.pot);
  assert.ok(PAYOUTS.careers.some((c) => c.won === 0), 'a manager who won nothing should be listed');
  assert.ok(PAYOUTS.careers.every((c) => c.paidIn > 0), 'everyone listed paid a buy-in');
});

test('money won combines the regular season and the playoffs', () => {
  const PAYOUTS = new Function(`${read('payouts-data.js')}; return PAYOUTS;`)();

  // Each manager's total is exactly his three sources added up. If a line ever
  // stopped being counted, the board would quietly understate someone.
  for (const c of PAYOUTS.careers) {
    assert.equal(c.won, c.weekly + c.regularSeason + c.bowl,
      `${c.gm}'s total does not equal weekly + regular season + bowl`);
  }

  // And both halves genuinely contribute: somebody's total is mostly playoff
  // money while someone else's is mostly weekly, which is the point of the board.
  assert.ok(PAYOUTS.careers.some((c) => c.bowl > c.weekly), 'expected a playoff-heavy earner');
  assert.ok(PAYOUTS.careers.some((c) => c.weekly > c.bowl), 'expected a weekly-heavy earner');
});

test('the money board is one leaderboard inside All-Time Leaders', () => {
  const index = read('index.html');
  const leaders = index.slice(index.indexOf('id="leaders"'), index.indexOf('id="records"'));

  assert.match(leaders, /id="moneyWon"/, 'the board belongs in All-Time Leaders');
  assert.match(leaders, /id="moneyScope"/, 'it must carry its own span');

  // The standalone section and its nav entry are gone, and so is the net board.
  assert.ok(!index.includes('id="money" class="section"'), 'the standalone section should be removed');
  assert.ok(!index.includes('href="#money"'), 'the nav entry should be removed');
  assert.ok(!index.includes('id="moneyNet"'), 'the up-and-down board should be removed');

  // Its neighbours cover every era; this one cannot, so it says so.
  assert.match(leaders, /Cumulative stats across all eras|Money Won/);
  const app = read('app.js');
  assert.ok(!/money-up|money-down/.test(app + read('styles.css')), 'net styling should be gone');
});

test('the caption admits how much of this is reconstructed', () => {
  const PAYOUTS = new Function(`${read('payouts-data.js')}; return PAYOUTS;`)();
  const payoutsJson = JSON.parse(read('data/payouts.json'));

  // The count is derived, so it corrects itself if the missing notes surface.
  const fields = ['weekly', 'regularSeason', 'champion', 'runnerUp'];
  const fullyStated = payoutsJson.seasons.filter(
    (s) => fields.every((f) => (s.stated ?? []).includes(f))
  ).length;
  assert.equal(PAYOUTS.stated, fullyStated);
  assert.ok(PAYOUTS.stated < PAYOUTS.seasons, 'some seasons are reconstructed');

  // And the page says so rather than presenting a reconstruction as a record.
  const app = read('app.js');
  assert.match(app, /best guess/i, 'the caption must not present this as a ledger');
  assert.match(app, /PAYOUTS\.stated/, 'the count must be derived, not typed');
  assert.ok(!/only 2 of 7/.test(app), 'the counts must not be hardcoded');
});
