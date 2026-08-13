// Season rollover. One manual step per year, once the season is recorded.
//
// season-end.mjs already writes the champion, playoff field, exhibition,
// appearance counts and broken records into data.js automatically. This script
// does the one thing that cannot be automatic, because it has to happen at the
// same moment the league moves to a new year:
//
//   fold the finished season's weekly wins and 200+ games into the frozen
//   baselines, then clear the log so the new season starts empty.
//
// The order matters. The site tallies weekly-log.js on top of the baselines, so
// folding without clearing would double-count, and clearing without folding
// would lose the season. Doing both together is why this is one step.
//
//   node src/seal-season.mjs           # show what would change
//   node src/seal-season.mjs --apply   # fold baselines and reset the log

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { config } from '../data/league.config.mjs';
import { weeklyWinners, bigGames, tallyOnto } from './derive.mjs';
import { renderLog, spliceLog } from './render-log.mjs';
import { loadSiteData, writeSiteData } from './write-data.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apply = process.argv.includes('--apply');

async function main() {
  const season = JSON.parse(await readFile(join(root, `data/${config.season}.json`), 'utf8'));
  const data = await loadSiteData();

  if (!data.champions.some((c) => c.year === config.season)) {
    throw new Error(
      `${config.season} has not been recorded yet — run \`npm run season-end\` first. ` +
        'Rolling the baselines forward before the season is written would lose it.'
    );
  }

  const winners = weeklyWinners(season, config).map((w) => w.gm);
  const big = bigGames(season, config).map((g) => g.gm);
  const weeklyWinsBaseline = tallyOnto(data.weeklyWinsBaseline, winners);
  const bigGamesBaseline = tallyOnto(data.bigGamesBaseline, big);

  const line = '─'.repeat(64);
  console.log(`\n${line}\n  ROLL ${config.season} INTO THE BASELINES\n${line}\n`);
  console.log(`Weekly wins to fold in : ${winners.length ? winners.join(', ') : 'none'}`);
  console.log(`200+ games to fold in  : ${big.length ? big.join(', ') : 'none'}`);
  console.log('\nweeklyWinsBaseline:');
  for (const r of weeklyWinsBaseline) console.log(`   ${r.gm.padEnd(8)} ${r.count}`);
  console.log('\nbigGamesBaseline:');
  for (const r of bigGamesBaseline) console.log(`   ${r.gm.padEnd(8)} ${r.count}`);

  if (apply) {
    await writeSiteData({ weeklyWinsBaseline, bigGamesBaseline });
    const path = join(root, 'weekly-log.js');
    const src = await readFile(path, 'utf8');
    await writeFile(path, spliceLog(src, renderLog({ season: config.season + 1, weeks: [] }, config)));
    console.log(`\nApplied. Baselines now include ${config.season}; weekly-log.js reset for ${config.season + 1}.`);
  } else {
    console.log('\n(dry run — pass --apply to write these and reset weekly-log.js)');
  }

  console.log(`\nThen, to open ${config.season + 1}:`);
  console.log(`   · set season: ${config.season + 1} in data/league.config.mjs`);
  console.log('   · re-verify data/franchises.json against the new roster');
  console.log('   · check data/exhibition.json if the league re-picked sides');
  console.log(`   · npm run fixtures  (adds ${config.season} to the replay tests)`);
  console.log(`\n${line}\n`);
}

main().catch((err) => {
  console.error(`\nseal-season failed: ${err.message}\n`);
  process.exitCode = 1;
});
