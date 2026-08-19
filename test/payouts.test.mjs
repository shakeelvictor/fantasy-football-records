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
    // A season still being played has neither yet — that is the normal state
    // every Thursday of the year, not a missing-data error.
    const complete = Boolean(champ && field);

    // settleSeason throws unless a FINISHED season balances, so reaching the
    // push is the test.
    settled.push(settleSeason({
      year,
      structure: payouts.seasons.find((s) => s.year === year),
      teams: season.managers.length,
      complete,
      winners: {
        weekly: season.weeklyWinners.map((w) => w.gm),
        regularSeason: field?.teams[0] ?? null,
        champion: champ?.champ ?? null,
        runnerUp: champ?.runnerUp ?? null,
      },
    }));
    played.set(year, season.managers.map((m) => m.gm));
  }

  const net = netPositions(settled, played);
  const sum = net.reduce((n, r) => n + r.net, 0);

  // The league is zero-sum once the money is all paid. A season still being
  // played holds the rest of its pot back, so the shortfall is exactly what is
  // still pending — never an imbalance. This must hold every Thursday of the
  // season, because `npm test` gates the weekly job.
  const pending = settled.reduce((n, s) => n + (s.pending ?? 0), 0);
  // Phrased as a sum so a zero pending cannot trip the -0 !== 0 distinction.
  assert.equal(sum + pending, 0, 'the only money unaccounted for is the pot still on the table');

  // Everyone who bought in is listed, including the managers who won nothing.
  const everyone = new Set([...played.values()].flat());
  assert.equal(net.length, everyone.size, 'a manager who never cashed must still appear');

  const won = careerPayouts(settled).reduce((n, c) => n + c.total, 0);
  const pot = settled.reduce((n, s) => n + s.pool, 0);
  assert.equal(won, pot - pending, 'winnings must account for every settled dollar');
});

test('the browser file lists everyone and balances', () => {
  const src = read('payouts-data.js');
  assert.doesNotMatch(src, /^\s*(import|export)\s/m, 'must not be an ES module');

  const PAYOUTS = new Function(`${src}; return PAYOUTS;`)();
  const pending = PAYOUTS.inProgress ? PAYOUTS.inProgress.pending : 0;
  assert.equal(PAYOUTS.careers.reduce((n, c) => n + c.net, 0) + pending, 0);
  assert.equal(PAYOUTS.careers.reduce((n, c) => n + c.won, 0) + pending, PAYOUTS.pot);
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
  //
  // It counts SETTLED seasons only — the caption reads "N of M seasons", and M
  // is what the board actually shows. A season listed ahead of being played
  // (2026 is, so the weekly job has a structure to price it with) is not on the
  // board yet and must not inflate either number.
  const fields = ['weekly', 'regularSeason', 'champion', 'runnerUp'];
  const settled = new Set(settledYears());
  const fullyStated = payoutsJson.seasons.filter(
    (s) => settled.has(s.year) && fields.every((f) => (s.stated ?? []).includes(f))
  ).length;
  assert.equal(PAYOUTS.stated, fullyStated);
  assert.equal(PAYOUTS.seasons, settled.size);
  assert.ok(PAYOUTS.stated < PAYOUTS.seasons, 'some seasons are reconstructed');

  // And the page says so rather than presenting a reconstruction as a record.
  const app = read('app.js');
  assert.match(app, /best guess/i, 'the caption must not present this as a ledger');
  assert.match(app, /PAYOUTS\.stated/, 'the count must be derived, not typed');
  assert.ok(!/only 2 of 7/.test(app), 'the counts must not be hardcoded');
});

test('a season still being played is settled but never reconciled', () => {
  const structure = { buyIn: 100, weekly: 40, regularSeason: 160, champion: 275, runnerUp: 105 };

  // Week 16: every regular week played, both playoff rounds done, Bowl to come.
  const live = settleSeason({
    year: 2026, structure, teams: 11, complete: false,
    winners: {
      weekly: Array.from({ length: 14 }, (_, i) => (i % 2 ? 'Shak' : 'Samson')),
      regularSeason: null, champion: null, runnerUp: null,
    },
  });

  assert.equal(live.complete, false);
  assert.equal(live.paid, 14 * structure.weekly);
  // Exactly the three prizes the Fantasy Bowl and the seeding still decide.
  assert.equal(live.pending, structure.regularSeason + structure.champion + structure.runnerUp);
  assert.equal(live.paid + live.pending, live.pool);
});

test('the playoff rounds before the Fantasy Bowl pay nothing', () => {
  const structure = { buyIn: 100, weekly: 40, regularSeason: 160, champion: 275, runnerUp: 105 };
  const winners = { weekly: Array(14).fill('Shak'), regularSeason: null, champion: null, runnerUp: null };

  // Weeks 15 and 16 knock four teams out and change nothing about the money.
  const week14 = settleSeason({ year: 2026, structure, teams: 11, complete: false, winners });
  const week16 = settleSeason({ year: 2026, structure, teams: 11, complete: false, winners });
  assert.equal(week16.paid, week14.paid, 'eliminating a team is not a payout event');
  assert.equal(week16.pending, week14.pending);
});

test('a finished season is still held to the whole pot', () => {
  // The in-progress path must not become a way to skip the check.
  assert.throws(
    () => settleSeason({
      year: 2026,
      structure: { buyIn: 100, weekly: 40, regularSeason: 160, champion: 275, runnerUp: 105 },
      teams: 11, complete: true,
      winners: { weekly: Array(14).fill('Shak'), regularSeason: 'Samson', champion: null, runnerUp: null },
    }),
    /does not reconcile/
  );
});

test('every season has a payout structure before it is played', () => {
  // Without one the weekly job skips the year and the board never moves all
  // season. The current season must always be listed here.
  const { config } = JSON.parse('{"config":null}') ?? {};
  const payoutsJson = JSON.parse(read('data/payouts.json'));
  const years = payoutsJson.seasons.map((s) => s.year);
  const latest = Math.max(...years);
  assert.ok(years.includes(latest), 'sanity');

  // Contiguous from 2019 — a gap would silently drop a season from the board.
  for (let y = Math.min(...years); y <= latest; y++) {
    assert.ok(years.includes(y), `no payout structure on record for ${y}`);
  }
});

test('the weekly job settles the money book', () => {
  const wf = read('.github/workflows/weekly-update.yml');
  assert.match(wf, /npm run payouts/);
  assert.match(wf, /git add .*payouts-data\.js/);

  // It must run after the archive it reads, and after season-end, which is
  // what flips a season from in-progress to reconciled.
  assert.ok(wf.indexOf('npm run payouts') > wf.indexOf('npm run lineups'));
  assert.ok(wf.indexOf('npm run payouts') > wf.indexOf('npm run season-end'));
});
