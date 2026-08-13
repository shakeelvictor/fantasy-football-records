// One manual step per year, in January.
//
// Deliberately does not rewrite data.js. That file mixes derived counts with
// hand-written prose (records cards, tidbits), and January is the natural
// moment to eyeball the Fantasy Bowl result before it becomes permanent. This
// prints exactly what to paste and updates only what is unambiguous.
//
//   node src/seal-season.mjs           # report only
//   node src/seal-season.mjs --apply   # also roll weekly-log.js to next season

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

import { config } from '../data/league.config.mjs';
import {
  weeklyWinners,
  bigGames,
  seeds,
  playoffResult,
  tallyOnto,
  exhibitionResult,
} from './derive.mjs';
import { renderLog, spliceLog } from './render-log.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apply = process.argv.includes('--apply');

/**
 * data.js declares a global rather than exporting, and the browser loads it as
 * a plain script. Evaluating it in a vm reads the baselines without changing
 * how the site consumes the file.
 */
async function loadSiteData() {
  const src = await readFile(join(root, 'data.js'), 'utf8');
  const ctx = { Set };
  vm.createContext(ctx);
  vm.runInContext(`${src}\nthis.OUT = DATA;`, ctx);
  return ctx.OUT;
}

const fmt = (n) => n.toFixed(2);

async function main() {
  const season = JSON.parse(await readFile(join(root, `data/${config.season}.json`), 'utf8'));
  if (season.weeks.length === 0) {
    throw new Error(`data/${config.season}.json has no weeks. Run the ingest first.`);
  }

  const result = playoffResult(season, config);
  if (!result.complete) {
    throw new Error(
      `The ${config.season} postseason is not finished — no Fantasy Bowl result yet. ` +
        'Seal the season after week ' + config.fantasyBowlWeek + '.'
    );
  }

  const data = await loadSiteData();
  const winners = weeklyWinners(season, config);
  const big = bigGames(season, config);
  const field = seeds(season, config).slice(0, config.playoffTeams);

  const line = '─'.repeat(72);
  console.log(`\n${line}\n  SEAL ${config.season}\n${line}`);

  console.log('\n1. Add to DATA.champions in data.js:\n');
  console.log(
    `    { year: ${config.season}, era: 'mfl', champ: '${result.champion.gm}', ` +
      `seed: ${result.champion.seed}, runnerUp: '${result.runnerUp.gm}', ` +
      `runnerSeed: ${result.runnerUp.seed}, ` +
      `score: '${fmt(result.champion.score)} – ${fmt(result.runnerUp.score)}' },`
  );

  console.log('\n2. Add to DATA.seasons in data.js (playoff field, seed order):\n');
  console.log(
    `    { year: ${config.season}, teams: [${field.map((f) => `'${f.gm}'`).join(', ')}], ` +
      `champ: '${result.champion.gm}' },`
  );

  console.log('\n3. Replace DATA.weeklyWinsBaseline with:\n');
  for (const r of tallyOnto(data.weeklyWinsBaseline, winners.map((w) => w.gm))) {
    console.log(`    { gm: '${r.gm}', count: ${r.count} },`);
  }

  console.log('\n4. Replace DATA.bigGamesBaseline with:\n');
  for (const r of tallyOnto(data.bigGamesBaseline, big.map((g) => g.gm))) {
    console.log(`    { gm: '${r.gm}', count: ${r.count} },`);
  }

  // Pakistan vs. the World. Rosters are hand-maintained, so this only prints
  // once the split for the season has been recorded.
  const rosters = JSON.parse(await readFile(join(root, 'data/exhibition.json'), 'utf8')).seasons;
  const roster = rosters.find((r) => r.year === config.season);
  const exhibition = roster ? exhibitionResult(season, roster, config) : null;

  console.log('\n5. Add to DATA.exhibition in data.js:\n');
  if (!roster) {
    console.log(`    (no ${config.season} sides in data/exhibition.json yet — add them, then rerun)`);
  } else if (!exhibition) {
    console.log(`    (no week ${config.exhibitionWeeks.join('/')} scores in the season file)`);
  } else {
    const rosterLines = (s) =>
      s.members
        .map((m) => `          { gm: '${m.gm}', points: ${fmt(m.score)}, players: ${m.players} },`)
        .join('\n');
    console.log(`    {
      year: ${exhibition.year},
      winner: '${exhibition.winner}',
      margin: ${fmt(exhibition.margin)},
      pakistan: {
        total: ${fmt(exhibition.pakistan.total)},
        players: ${exhibition.pakistan.players},
        roster: [
${rosterLines(exhibition.pakistan)}
        ],
      },
      world: {
        total: ${fmt(exhibition.world.total)},
        players: ${exhibition.world.players},
        roster: [
${rosterLines(exhibition.world)}
        ],
      },
    },`);
    console.log(
      `\n    (lineups ${exhibition.pakistan.players} v ${exhibition.world.players} — ` +
        'equal by design; derive throws if they ever differ)'
    );
  }

  console.log('\n6. Bump these by hand — they need judgement, not arithmetic:\n');
  console.log('    · DATA.playoffApps      +1 for: ' + field.map((f) => f.gm).join(', '));
  console.log(
    `    · DATA.bowlApps         +1 for ${result.champion.gm} (W) and ${result.runnerUp.gm} (L)`
  );
  console.log('    · DATA.records          check anything this season beat');
  console.log('    · DATA.tidbits          add whatever the season earned');

  console.log(`\n7. Season summary for the eyeball check:\n`);
  console.log(`    Champion    ${result.champion.gm} (#${result.champion.seed}) ${fmt(result.champion.score)}`);
  console.log(`    Runner-up   ${result.runnerUp.gm} (#${result.runnerUp.seed}) ${fmt(result.runnerUp.score)}`);
  for (const round of result.rounds) {
    console.log(`    Week ${round.week}     out: ${round.eliminated.join(', ')}`);
  }
  console.log(`    Weekly wins ${winners.map((w) => `${w.week}:${w.gm}`).join('  ')}`);
  console.log(`    200+ games  ${big.length ? big.map((g) => `${g.gm} ${fmt(g.score)} (wk ${g.week})`).join(', ') : 'none'}`);

  console.log(`\n8. Then, for next season:\n`);
  console.log(`    · set season: ${config.season + 1} in data/league.config.mjs`);
  console.log(`    · re-verify data/franchises.json against the new roster`);
  console.log(`    · npm run fixtures  (adds ${config.season} to the replay tests)`);
  console.log(`    · re-enable the scheduled workflow if the offseason disabled it`);

  if (apply) {
    const path = join(root, 'weekly-log.js');
    const src = await readFile(path, 'utf8');
    const next = spliceLog(src, renderLog({ season: config.season + 1, weeks: [] }, config));
    await writeFile(path, next);
    console.log(`\n   --apply: weekly-log.js reset for ${config.season + 1}.`);
  } else {
    console.log(`\n   (dry run — pass --apply to also reset weekly-log.js)`);
  }
  console.log(`\n${line}\n`);
}

main().catch((err) => {
  console.error(`\nseal-season failed: ${err.message}\n`);
  process.exitCode = 1;
});
