// Serializes the derived arrays back into data.js.
//
// data.js stays the browser's single source of truth — a plain script declaring
// a global. Only the marked blocks are rewritten, and only by the script that
// owns them: season-end writes the season and record blocks, seal-season writes
// the baselines. Tidbits and drafts have no markers and are never touched.
//
// A no-op rewrite must produce a byte-identical file, or the weekly job would
// commit churn every run. That is asserted in test/write-data.test.mjs.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = join(root, 'data.js');

/** Reads data.js the same way the browser does, and hands back DATA. */
export async function loadSiteData() {
  const src = await readFile(dataPath, 'utf8');
  const ctx = { Set };
  vm.createContext(ctx);
  vm.runInContext(`${src}\nthis.OUT = DATA;`, ctx);
  return ctx.OUT;
}

const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const n2 = (x) => Number(x).toFixed(2);

/** Only emit a key when it carries a value, so rows stay as terse as they are today. */
const opt = (k, v, fmt = q) => (v === undefined || v === null ? '' : `, ${k}: ${fmt(v)}`);

const SERIALIZERS = {
  champions: (rows) =>
    rows
      .map((c, i) => {
        const prev = rows[i - 1];
        const head =
          i === 0 ? '    // Yahoo! Era\n' : prev && prev.era !== c.era ? '    // MFL Era\n' : '';
        return (
          head +
          `    { year: ${c.year}, era: ${q(c.era)}, champ: ${q(c.champ)}, seed: ${c.seed}, ` +
          `runnerUp: ${q(c.runnerUp)}, runnerSeed: ${c.runnerSeed}, ` +
          `score: ${c.score == null ? 'null' : q(c.score)}` +
          opt('note', c.note) +
          ' },'
        );
      })
      .join('\n'),

  seasons: (rows) =>
    rows
      .map(
        (s) =>
          `    { year: ${s.year}, teams: [${s.teams.map(q).join(', ')}], champ: ${q(s.champ)} },`
      )
      .join('\n'),

  playoffApps: (rows) =>
    rows.map((r) => `    { gm: ${q(r.gm)}, count: ${r.count}${opt('note', r.note)} },`).join('\n'),

  bowlApps: (rows) =>
    rows
      .map(
        (r) =>
          `    { gm: ${q(r.gm)}, count: ${r.count}, record: ${q(r.record)}${opt('note', r.note)} },`
      )
      .join('\n'),

  records: (rows) =>
    rows
      .map((r) => {
        const props = [
          `      label: ${q(r.label)}`,
          `      value: ${q(r.value)}`,
          `      holder: ${q(r.holder)}`,
          `      context: ${q(r.context)}`,
        ];
        if (r.prev) props.push(`      prev: ${q(r.prev)}`);
        if (r.trophy) props.push('      trophy: true');
        // No trailing comma on the last property, matching how the file is
        // already written — so a no-op run produces no diff and no commit.
        return ['    {', props.join(',\n'), '    },'].join('\n');
      })
      .join('\n'),

  weeklyWinsBaseline: (rows) => rows.map((r) => `    { gm: ${q(r.gm)}, count: ${r.count} },`).join('\n'),

  bigGamesBaseline: (rows) => rows.map((r) => `    { gm: ${q(r.gm)}, count: ${r.count} },`).join('\n'),

  exhibition: (rows) => {
    const side = (s, name) =>
      [
        `      ${name}: {`,
        `        total: ${n2(s.total)},`,
        `        players: ${s.players},`,
        '        roster: [',
        ...s.roster.map(
          (m) => `          { gm: ${q(m.gm)}, points: ${n2(m.points)}, players: ${m.players} },`
        ),
        '        ],',
        '      },',
      ].join('\n');
    return rows
      .map((e) =>
        [
          '    {',
          `      year: ${e.year},`,
          `      winner: ${q(e.winner)},`,
          `      margin: ${n2(e.margin)},`,
          side(e.pakistan, 'pakistan'),
          side(e.world, 'world'),
          '    },',
        ].join('\n')
      )
      .join('\n');
  },
};

function spliceBlock(src, key, body) {
  const begin = `  // >>> BEGIN GENERATED ${key}`;
  const end = `  // <<< END GENERATED ${key}`;
  const a = src.indexOf(begin);
  const b = src.indexOf(end);
  if (a === -1 || b === -1) {
    throw new Error(`data.js is missing its BEGIN/END GENERATED markers for "${key}".`);
  }
  const block = `${begin}\n  ${key}: [\n${body}\n  ],\n${end}`;
  return src.slice(0, a) + block + src.slice(b + end.length);
}

/**
 * Rewrites the given keys in place. Returns true if anything actually changed,
 * so a no-op run produces no commit.
 */
export async function writeSiteData(updates) {
  const before = await readFile(dataPath, 'utf8');
  let src = before;
  for (const [key, rows] of Object.entries(updates)) {
    const serialize = SERIALIZERS[key];
    if (!serialize) throw new Error(`No serializer for data.js key "${key}".`);
    src = spliceBlock(src, key, serialize(rows));
  }

  // Never write a data.js the browser cannot parse.
  const ctx = { Set };
  vm.createContext(ctx);
  try {
    vm.runInContext(`${src}\nthis.OUT = DATA;`, ctx);
  } catch (err) {
    throw new Error(`Refusing to write data.js — the result does not parse: ${err.message}`);
  }
  for (const key of Object.keys(updates)) {
    if (!Array.isArray(ctx.OUT[key])) throw new Error(`data.js "${key}" did not survive the write.`);
  }

  if (src === before) return false;
  await writeFile(dataPath, src);
  return true;
}
