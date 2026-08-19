import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { config } from '../data/league.config.mjs';
import {
  legalShapes,
  rulesFor,
  bestLineup,
  weekEfficiency,
  seasonEfficiency,
  shapeOf,
  shapeKey,
  fitsWithin,
  slotOf,
} from '../src/lineups.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const archive = (year) =>
  JSON.parse(readFileSync(join(here, `../data/lineups/${year}.json`), 'utf8'));

/** lineups-data.js as the browser sees it. */
const browserData = () =>
  new Function(`${readFileSync(join(here, '../lineups-data.js'), 'utf8')}; return LINEUPS;`)();

/** Every season currently in the archive. */
const years = () =>
  readdirSync(join(here, '../data/lineups'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => Number(f.replace('.json', '')));

const p = (id, position, score) => ({ id, position, score });

// ── The shape model ─────────────────────────────────────────────────────────

test('every legal shape obeys the written lineup rules', () => {
  for (const s of legalShapes()) {
    assert.equal(s.QB, 1, 'exactly one QB: the flex cannot be a quarterback');
    assert.equal(s.QB + s.RB + s.WR + s.TE + s.PK + s.IDP, 12, '12 starters');
    assert.ok(s.QB + s.RB + s.WR + s.TE <= 8, `${shapeKey(s)} breaks the 8-offense cap`);
    assert.ok(s.IDP >= 3, `${shapeKey(s)} starts fewer than 3 IDP`);
    assert.ok(s.TE <= 3, 'at most three tight ends across the WR, TE and flex spots');
    assert.ok(s.WR >= 2, 'at most one WR slot may be filled by a tight end');
  }
});

test('each lineup era resolves to the rules that season actually played', () => {
  const a = config.archive;
  assert.deepEqual(rulesFor(2015, a), { kicker: true, flex: false });
  assert.deepEqual(rulesFor(2016, a), { kicker: false, flex: true });
  for (const y of [2017, 2020, 2025, 2026]) {
    assert.deepEqual(rulesFor(y, a), { kicker: true, flex: true }, `${y}`);
  }
});

test('a season with no era on record is refused, not measured against today', () => {
  assert.throws(() => rulesFor(2009, config.archive), /No lineup rules on record for 2009/);
});

test('2015 allows exactly one lineup: 11 starters, a kicker, and no flex', () => {
  const shapes = legalShapes(rulesFor(2015, config.archive));
  assert.equal(shapes.length, 1, 'with no flex there is nothing to choose about the shape');
  assert.deepEqual(shapes[0], { QB: 1, RB: 2, WR: 3, TE: 1, PK: 1, IDP: 3 });
  assert.equal(shapeKey(shapes[0]), 'QB1 RB2 WR3 TE1 PK1 IDP3');
});

test('2016 is an 11-man, kickerless season with a flex', () => {
  const shapes = legalShapes(rulesFor(2016, config.archive));
  assert.ok(shapes.length > 1, 'a flex means real choices about shape');
  for (const s of shapes) {
    assert.equal(s.PK, 0);
    assert.equal(s.QB + s.RB + s.WR + s.TE + s.PK + s.IDP, 11);
  }
});

test('the four shapes the league actually submitted in 2025 are all legal', () => {
  const observed = [
    'QB1 RB3 WR3 TE1 PK1 IDP3',
    'QB1 RB2 WR4 TE1 PK1 IDP3',
    'QB1 RB2 WR3 TE2 PK1 IDP3',
    'QB1 RB3 WR2 TE2 PK1 IDP3',
  ];
  const legal = new Set(legalShapes().map(shapeKey));
  for (const o of observed) assert.ok(legal.has(o), `${o} was played but is modelled as illegal`);
});

test('a short-handed lineup is legal; an over-filled one is not', () => {
  const shapes = legalShapes();
  // Week 11 2023 and Week 4 2024 were both played with 11 starters. The score
  // counts exactly as submitted, so the model must accept it.
  assert.ok(fitsWithin({ QB: 1, RB: 3, WR: 3, TE: 1, PK: 0, IDP: 3 }, shapes));
  assert.ok(fitsWithin({ QB: 1, RB: 2, WR: 3, TE: 1, PK: 0, IDP: 2 }, shapes));
  // Nine combined offensive starters is what MFL's own optimizer keeps
  // producing and what the league does not allow.
  assert.equal(fitsWithin({ QB: 1, RB: 3, WR: 3, TE: 2, PK: 1, IDP: 2 }, shapes), false);
  assert.equal(fitsWithin({ QB: 2, RB: 2, WR: 3, TE: 1, PK: 1, IDP: 3 }, shapes), false);
});

test('IDP positions collapse to one slot, offence and kickers do not', () => {
  for (const d of ['DT', 'DE', 'LB', 'CB', 'S']) assert.equal(slotOf(d), 'IDP');
  for (const o of ['QB', 'RB', 'WR', 'TE', 'PK']) assert.equal(slotOf(o), o);
  assert.deepEqual(shapeOf(['QB', 'RB', 'RB', 'LB', 'S', 'DE']), {
    QB: 1, RB: 2, WR: 0, TE: 0, PK: 0, IDP: 3,
  });
});

// ── The optimizer ───────────────────────────────────────────────────────────

/** A roster deep enough to fill any legal lineup, with one huge bench WR. */
const roster = () => [
  p('qb1', 'QB', 30), p('qb2', 'QB', 25),
  p('rb1', 'RB', 20), p('rb2', 'RB', 18), p('rb3', 'RB', 16), p('rb4', 'RB', 2),
  p('wr1', 'WR', 22), p('wr2', 'WR', 19), p('wr3', 'WR', 17), p('wr4', 'WR', 15), p('wr5', 'WR', 40),
  p('te1', 'TE', 12), p('te2', 'TE', 10), p('te3', 'TE', 1),
  p('pk1', 'PK', 9), p('pk2', 'PK', 8),
  p('lb1', 'LB', 14), p('lb2', 'LB', 13), p('s1', 'S', 11), p('de1', 'DE', 7),
];

test('the optimizer will not exceed eight offensive starters to chase points', () => {
  const best = bestLineup(roster());
  const byId = new Map(roster().map((x) => [x.id, x]));
  const shape = shapeOf(best.ids.map((id) => byId.get(id).position));
  assert.ok(shape.QB + shape.RB + shape.WR + shape.TE <= 8);
  assert.ok(shape.IDP >= 3);
  assert.equal(best.ids.length, 12);
});

test('a rostered player with no score counts as a zero, not as missing', () => {
  const players = [...roster()];
  const withScore = bestLineup(players).points;
  const blanked = bestLineup(players.map((x) => (x.id === 'wr5' ? { ...x, score: undefined } : x)));
  assert.ok(blanked.points < withScore, 'blanking the best receiver must lower the optimum');
  assert.equal(Number.isFinite(blanked.points), true);
});

test('the optimum is stable when equal scores could tie', () => {
  const flat = roster().map((x) => ({ ...x, score: 5 }));
  assert.deepEqual(bestLineup(flat).ids, bestLineup(flat).ids);
});

test('bestLineup returns null when the roster cannot fill any legal lineup', () => {
  assert.equal(bestLineup([p('qb1', 'QB', 10), p('rb1', 'RB', 9)]), null);
});

// ── A franchise-week ────────────────────────────────────────────────────────

test('a week reports what was left on the bench and who was sat', () => {
  const players = roster();
  const started = ['qb1', 'rb1', 'rb2', 'wr1', 'wr2', 'wr3', 'te1', 'pk1', 'lb1', 'lb2', 's1', 'rb3'];
  const scored = started.reduce((a, id) => a + players.find((x) => x.id === id).score, 0);

  const eff = weekEfficiency({ players, started, scored });
  assert.equal(eff.unmodelled, undefined);
  assert.ok(eff.optimal >= scored, 'the optimum can never be below what was started');
  assert.equal(eff.left, Math.round((eff.optimal - scored) * 100) / 100);
  assert.ok(eff.efficiency <= 1);
  // wr5 scored 40 on the bench and belongs in any optimal lineup.
  assert.equal(eff.sat[0].id, 'wr5');
});

test('a week the model cannot price is flagged, never clamped to 100%', () => {
  const players = roster();
  const eff = weekEfficiency({ players, started: ['qb1'], scored: 9999 });
  assert.equal(eff.unmodelled, true);
  assert.equal(eff.efficiency, undefined, 'no efficiency is published for a week we cannot model');
});

test('season efficiency is the ratio of totals, not the mean of weekly rates', () => {
  const weeks = [
    { rows: [{ gm: 'A', scored: 50, optimal: 100, left: 50 }] },
    { rows: [{ gm: 'A', scored: 300, optimal: 300, left: 0 }] },
  ];
  const [a] = seasonEfficiency(weeks);
  assert.equal(a.scored, 350);
  assert.equal(a.optimal, 400);
  assert.equal(a.efficiency, 350 / 400); // 0.875, not the 0.75 a mean would give
  assert.equal(a.weeks, 2);
});

// ── Replay ──────────────────────────────────────────────────────────────────
//
// The archive is built from MFL, so these assert against numbers no code here
// invented. If a refactor moves them, the refactor is wrong.

test('2025 reproduces the archived efficiency table', () => {
  const a = archive(2025);
  assert.equal(a.managers.length, 11);
  assert.equal(a.weeksPlayed, 14);

  const samson = a.managers.find((m) => m.gm === 'Samson');
  assert.equal(samson.weeks, 14);
  assert.equal((samson.efficiency * 100).toFixed(1), '95.3');
  assert.equal(a.managers[0].gm, 'Samson', 'Samson led the league in 2025');

  // Every manager, every season: you cannot start more than was available.
  for (const m of a.managers) {
    assert.ok(m.efficiency > 0 && m.efficiency <= 1, `${m.gm} has an impossible efficiency`);
    assert.ok(m.left >= 0, `${m.gm} left negative points on the bench`);
  }
});

test('2025 records the biggest winning blind bid', () => {
  const [top] = archive(2025).bids;
  assert.equal(top.amount, 60);
  assert.equal(top.gm, 'Asher');
  assert.equal(top.player, 'Brenton Strange');
});

test('blind bidding did not exist before 2025', () => {
  for (const year of years().filter((y) => y < 2025)) {
    assert.equal(archive(year).bids.length, 0, `${year} should have no blind bids`);
  }
});

test('2015 is archived from its own MFL league and reproduces cleanly', () => {
  // 2015 ran in league 53720, not 19716. Asking 19716 returns a 3-week stub
  // that reads as "no data for that season" — it is the wrong league, not a
  // missing season.
  assert.equal(config.archive.leagueIds[2015], '53720');

  const a = archive(2015);
  assert.equal(a.managers.length, 10);
  assert.equal(a.weeksPlayed, 13);
  assert.equal(a.illegal.length, 0);
  assert.equal(a.unmodelled.length, 0);
  for (const m of a.managers) assert.ok(m.efficiency > 0 && m.efficiency <= 1);
});

test('2016 records the four illegal lineups and still counts them', () => {
  const a = archive(2016);

  // MFL failed to enforce the roster limits and one manager started nine
  // offensive players four weeks running. The league settled that at the time
  // and let the results stand, so the weeks are recorded, not erased.
  assert.equal(a.illegal.length, 4);
  for (const u of a.illegal) {
    assert.equal(u.gm, 'Andres');
    assert.equal(u.shape, 'QB1 RB3 WR3 TE2 PK0 IDP2');
    assert.ok(u.scored < u.optimal, 'an illegal lineup that still beat the legal optimum would be unpriceable');
  }

  // Counted, not dropped: every manager played all 13 weeks that season.
  for (const m of a.managers) assert.equal(m.weeks, 13, `${m.gm} is missing weeks`);
  assert.equal(a.unmodelled.length, 0, 'no 2016 week is unpriceable');
});

test('no season anywhere contains a week the model cannot price', () => {
  for (const year of years()) {
    assert.equal(archive(year).unmodelled.length, 0, `${year} has an unpriceable week`);
  }
});

// ── The generated browser file ──────────────────────────────────────────────

test('rewriting the archive is byte-identical, so the weekly job commits nothing', async () => {
  const { renderLineups } = await import('../src/render-lineups.mjs');

  const dir = join(here, '../data/lineups');
  const seasons = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));

  // Rendered exactly the way scripts/backfill-lineups.mjs renders it.
  const once = renderLineups(seasons, config.archive);
  assert.equal(renderLineups(seasons, config.archive), once, 'the renderer is not deterministic');
  assert.equal(
    readFileSync(join(here, '../lineups-data.js'), 'utf8'),
    once,
    'lineups-data.js is out of step with data/lineups/ — run `npm run lineups --render-only`'
  );
});

test('lineups-data.js is a classic script the browser can load', () => {
  const src = readFileSync(join(here, '../lineups-data.js'), 'utf8');
  assert.doesNotMatch(src, /^\s*(import|export)\s/m, 'must not be an ES module');

  const LINEUPS = browserData();
  assert.equal(LINEUPS.seasons, years().length, 'the season count must match the archive');
  assert.ok(Array.isArray(LINEUPS.careers) && LINEUPS.careers.length > 0);
  assert.ok(Array.isArray(LINEUPS.playoffCareers));
  assert.ok(LINEUPS.records && LINEUPS.records.bestCareer);

  // Both boards rank best-first, and nobody may start more than was available.
  for (const board of [LINEUPS.careers, LINEUPS.playoffCareers]) {
    const eff = board.map((c) => c.efficiency);
    assert.deepEqual(eff, [...eff].sort((a, b) => b - a), 'boards must rank best-first');
    for (const c of board) {
      assert.ok(c.efficiency > 0 && c.efficiency <= 1, `${c.gm} has an impossible efficiency`);
      assert.ok(c.scored <= c.optimal + 0.01, `${c.gm} outscored the best lineup available`);
    }
  }
});

test('the browser file ships leaderboards, not eleven season tables', () => {
  const src = readFileSync(join(here, '../lineups-data.js'), 'utf8');
  // The per-season detail is the archive's job. Shipping it was more than
  // anyone wanted to read, and it is still on disk in data/lineups/.
  assert.doesNotMatch(src, /managers:/, 'per-season manager tables must not be shipped');
  assert.ok(src.length < 12000, `browser file is ${src.length} bytes; it should stay lean`);
});

test('a perfect lineup is counted exactly, not capped by the kept rows', async () => {
  const { renderLineups } = await import('../src/render-lineups.mjs');

  // Every archived season records its own count, and it must match the rows.
  for (const year of years()) {
    const a = archive(year);
    const kept = a.bestWeeks.filter((w) => w.efficiency >= 1).length;
    assert.equal(a.perfect, kept, `${year} kept rows disagree with the recorded count`);
  }

  // A season that fills every kept row with a perfect week could be hiding
  // more, so the renderer refuses to guess rather than undercount.
  const saturated = {
    season: 2099, weeksPlayed: 1, regularSeasonWeeks: 1, managers: [],
    bestWeeks: [{ gm: 'A', week: 1, scored: 10, optimal: 10, efficiency: 1 }],
  };
  assert.throws(() => renderLineups([saturated]), /may be capped/);
});

test('the biggest perfect week wins the card, not the alphabetically first', () => {
  const top = browserData().records.bestWeek;
  assert.equal(top.efficiency, 1);

  // Dozens of weeks tie at 100%, so the one shown must be the biggest of them
  // across the whole archive, not whichever name sorts first.
  const best = Math.max(
    ...years().flatMap((y) => archive(y).bestWeeks.filter((w) => w.efficiency >= 1).map((w) => w.scored))
  );
  assert.equal(top.scored, best);
});

test('only first-season managers are marked, and everyone is still ranked', () => {
  const LINEUPS = browserData();

  // The bar is membership, not form: a manager in his first league season.
  // Today that is exactly the two who joined in 2025, and it clears itself
  // once they play a second year — no threshold to revisit.
  const seasonsOf = new Map();
  for (const y of years()) {
    for (const m of archive(y).managers) seasonsOf.set(m.gm, (seasonsOf.get(m.gm) ?? 0) + 1);
  }
  const expected = [...seasonsOf].filter(([, n]) => n < config.archive.careerMinSeasons).map(([g]) => g);
  assert.deepEqual(expected.sort(), ['Laura', 'Ryaan']);

  for (const c of LINEUPS.careers) {
    assert.equal(!!c.isNew, expected.includes(c.gm), `${c.gm} is marked wrongly`);
  }

  // The marker follows the manager onto the playoff board, so one deep run
  // cannot put a newcomer atop a table he has barely played in.
  for (const c of LINEUPS.playoffCareers) {
    assert.equal(!!c.isNew, expected.includes(c.gm), `${c.gm} is marked wrongly in the playoffs`);
  }

  // Nobody is hidden — every manager who played appears, ranked by the number.
  assert.equal(LINEUPS.careers.length, seasonsOf.size);
  const eff = LINEUPS.careers.map((c) => c.efficiency);
  assert.deepEqual(eff, [...eff].sort((a, b) => b - a));
});

test('a career record goes to a settled manager, not a newcomer on one season', () => {
  const LINEUPS = browserData();

  assert.equal(LINEUPS.records.bestCareer.gm, 'Samson');
  assert.ok(LINEUPS.careers[0].isNew, 'Laura still tops the board on the raw number');
  assert.notEqual(LINEUPS.records.bestCareer.gm, LINEUPS.careers[0].gm,
    'the record must skip the marked newcomer above it');

  // It is the best among managers who are not new, not simply the second row.
  const settled = LINEUPS.careers.filter((c) => !c.isNew);
  assert.equal(LINEUPS.records.bestCareer.efficiency, Math.max(...settled.map((c) => c.efficiency)));
  assert.equal(LINEUPS.records.bestPlayoff.gm, 'Hoss');
});
test('the three single-game records are rendered from the archive, not data.js', () => {
  // They belong in the Single-Game & Season Records book, but they are derived
  // from the lineup archive rather than written into data.js, whose `records`
  // block is owned by season-end. app.js appends them at render time.
  const app = readFileSync(join(here, '../app.js'), 'utf8');
  assert.match(app, /function lineupRecordCards\(\)/);
  assert.match(app, /\[\.\.\.DATA\.records, \.\.\.lineupRecordCards\(\)\]/);

  // Each must be sourced from LINEUPS.records, and none may still be built
  // into the efficiency section's own card list.
  const lineupSection = app.slice(app.indexOf('function renderLineups()'), app.indexOf('function renderLineupMath()'));
  for (const label of ['Most Points Left on the Bench', 'Worst Sit', 'Biggest Winning Bid']) {
    assert.ok(!lineupSection.includes(`label: '${label}'`), `${label} should have moved out of the efficiency cards`);
  }

  // And the data they need is actually present.
  const r = browserData().records;
  for (const k of ['worstWeek', 'worstSit', 'topBid']) assert.ok(r[k], `records.${k} is missing`);
});

test('data.js is untouched by the lineup archive', async () => {
  // The records block is season-end's to own. Appending at render time is what
  // keeps the weekly job's byte-identical rewrite guarantee intact.
  const { loadSiteData } = await import('../src/write-data.mjs');
  const DATA = await loadSiteData();
  const labels = DATA.records.map((x) => x.label);
  for (const label of ['Most Points Left on the Bench', 'Worst Sit', 'Biggest Winning Bid']) {
    assert.ok(!labels.includes(label), `${label} must not be written into data.js`);
  }
});

test('the efficiency explainer describes only the cards in its own section', () => {
  const app = readFileSync(join(here, '../app.js'), 'utf8');

  const math = app.slice(app.indexOf('function renderLineupMath()'));
  const cards = app.slice(app.indexOf('function renderLineups()'), app.indexOf('function renderLineupMath()'));

  // Cards that moved to the records book must not be defined here, and nothing
  // here may point at something the reader cannot see in this section.
  for (const moved of ['Most Points Left on the Bench', 'Worst Sit', 'Biggest Winning Bid']) {
    assert.ok(!math.includes(`['${moved}'`), `${moved} moved out; its definition should have gone with it`);
  }
  assert.ok(!/records above|single-game records/i.test(math), 'no cross-references to a section this text is not in');

  // Every card the section still builds keeps a definition.
  for (const label of ['Best Season', 'Best Career', 'Best in the Playoffs']) {
    assert.ok(cards.includes(`label: '${label}'`), `${label} card missing`);
    assert.ok(math.includes(`['${label}'`), `${label} card has no definition`);
  }
  // The perfect-week card's label is conditional, so check it by name.
  assert.ok(math.includes("['Biggest Perfect Week'"), 'perfect week has no definition');
});
