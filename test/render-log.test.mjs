import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { CONFIG, fixture } from './helpers.mjs';
import { renderLog, spliceLog, BEGIN, END } from '../src/render-log.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Evaluate a generated block the way the browser would, and hand back WEEKLY_LOG. */
function evaluate(block) {
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext(`${block}\nthis.OUT = WEEKLY_LOG;`, ctx);
  return ctx.OUT;
}

test('the generated block is valid JS the browser can execute', () => {
  const log = evaluate(renderLog(fixture(2025), CONFIG));
  assert.ok(Array.isArray(log));
  assert.equal(log.length, 14);
});

test('generated entries match the shape app.js reads', () => {
  const log = evaluate(renderLog(fixture(2025), CONFIG));
  for (const row of log) {
    assert.equal(row.year, 2025);
    assert.equal(typeof row.week, 'number');
    assert.ok(row.winner === null || typeof row.winner === 'string');
    assert.ok(Array.isArray(row.big));
    for (const b of row.big) {
      assert.equal(typeof b.gm, 'string');
      assert.equal(typeof b.points, 'number');
    }
  }
});

test('the generated log reproduces the 2025 leaderboard deltas', () => {
  const log = evaluate(renderLog(fixture(2025), CONFIG));

  // Samson's record 8 weekly wins in 2025, per the records card in data.js.
  const wins = log.filter((r) => r.winner === 'Samson').length;
  assert.equal(wins, 8);

  // Two 200+ games league-wide that season.
  const big = log.flatMap((r) => r.big);
  assert.equal(big.length, 2);
  assert.ok(big.every((b) => b.points >= 200));
});

test('rendering is deterministic', () => {
  const a = renderLog(fixture(2024), CONFIG);
  const b = renderLog(fixture(2024), CONFIG);
  assert.equal(a, b);
});

test('a season with no games played still renders a valid empty log', () => {
  // The vm has its own realm, so compare by shape rather than deep-equality
  // against a literal from this realm.
  const log = evaluate(renderLog({ season: 2026, weeks: [] }, CONFIG));
  assert.ok(Array.isArray(log));
  assert.equal(log.length, 0);
});

test('splice replaces only the generated block', () => {
  const src = `const KEEP_BEFORE = 1;\n${BEGIN}\nold\n${END}\nconst KEEP_AFTER = 2;\n`;
  const out = spliceLog(src, `${BEGIN}\nnew\n${END}`);
  assert.ok(out.includes('KEEP_BEFORE'));
  assert.ok(out.includes('KEEP_AFTER'));
  assert.ok(out.includes('new'));
  assert.ok(!out.includes('old'));
});

test('splice refuses a file with no markers rather than mangling it', () => {
  assert.throws(() => spliceLog('const WEEKLY_LOG = [];', 'x'), /missing its BEGIN\/END/);
});

test('splicing into the real weekly-log.js keeps GMS and the header intact', () => {
  const src = readFileSync(join(root, 'weekly-log.js'), 'utf8');
  const out = spliceLog(src, renderLog(fixture(2025), CONFIG));
  assert.ok(out.includes('const GMS = ['));
  assert.ok(out.includes('WEEKLY LOG'));

  // The whole file must still parse, with both globals defined.
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext(`${out}\nthis.OUT = { log: WEEKLY_LOG, gms: GMS };`, ctx);
  assert.equal(ctx.OUT.log.length, 14);
  assert.ok(ctx.OUT.gms.includes('Samson'));

  // Every generated name must be one the site recognises, or app.js warns.
  for (const row of ctx.OUT.log) {
    if (row.winner) assert.ok(ctx.OUT.gms.includes(row.winner), `unknown GM ${row.winner}`);
    for (const b of row.big) assert.ok(ctx.OUT.gms.includes(b.gm), `unknown GM ${b.gm}`);
  }
});
