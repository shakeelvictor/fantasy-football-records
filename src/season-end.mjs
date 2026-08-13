// Season end. Runs after Week 18, once the exhibition has been played and the
// season is genuinely over, and writes the year into the site: champion,
// playoff field, Pakistan vs. the World, appearance counts, and any all-time
// record the season broke.
//
// Idempotent. Once a season is recorded it does nothing, so the weekly job can
// keep calling it through the offseason without double-counting anything.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { config } from '../data/league.config.mjs';
import { seeds, playoffResult, exhibitionResult } from './derive.mjs';
import { loadExhibitionRosters, rosterForSeason } from './rosters.mjs';
import { loadSiteData, writeSiteData } from './write-data.mjs';
import { buildContext, compareToRecords, playerIdsToResolve } from './records.mjs';
import { fetchPlayerNames } from './mfl/client.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fmt = (n) => n.toFixed(2);

/** Bump a "7-2" style record by a win or a loss. */
function bumpRecord(record, outcome) {
  const [w, l] = String(record ?? '0-0').split('-').map(Number);
  return outcome === 'W' ? `${w + 1}-${l}` : `${w}-${l + 1}`;
}

function bumpCount(rows, gm, extra = {}) {
  const next = rows.map((r) => ({ ...r }));
  const row = next.find((r) => r.gm === gm);
  if (row) {
    row.count += 1;
    Object.assign(row, extra(row));
  } else {
    next.push({ gm, count: 1, ...extra({ gm, count: 0 }) });
  }
  return next.sort((a, b) => b.count - a.count || a.gm.localeCompare(b.gm));
}

export async function seasonEnd({ dryRun = false } = {}) {
  const season = JSON.parse(await readFile(join(root, `data/${config.season}.json`), 'utf8'));
  const data = await loadSiteData();

  if (data.champions.some((c) => c.year === config.season)) {
    return { status: 'already-recorded', season: config.season };
  }

  const playedWeeks = new Set(season.weeks.map((w) => w.week));
  const seasonOver = config.exhibitionWeeks.every((w) => playedWeeks.has(w));
  if (!seasonOver) {
    return { status: 'in-progress', season: config.season, played: [...playedWeeks].sort((a, b) => a - b) };
  }

  const playoff = playoffResult(season, config);
  if (!playoff.complete) {
    throw new Error(
      `Week ${config.exhibitionWeeks.join('/')} has scores but the postseason is not resolved. ` +
        'Check the playoff weeks in the season file before recording the year.'
    );
  }

  const roster = rosterForSeason(await loadExhibitionRosters(), config.season);
  const exhibition = exhibitionResult(season, roster, config);
  if (!exhibition) throw new Error('No exhibition result despite a played Week 18.');

  const field = seeds(season, config).slice(0, config.playoffTeams);

  // ── Build the new lists ──────────────────────────────────────────────────
  const champions = [
    ...data.champions,
    {
      year: config.season,
      era: 'mfl',
      champ: playoff.champion.gm,
      seed: playoff.champion.seed,
      runnerUp: playoff.runnerUp.gm,
      runnerSeed: playoff.runnerUp.seed,
      score: `${fmt(playoff.champion.score)} – ${fmt(playoff.runnerUp.score)}`,
    },
  ].sort((a, b) => a.year - b.year);

  const seasonsList = [
    ...data.seasons,
    { year: config.season, teams: field.map((f) => f.gm), champ: playoff.champion.gm },
  ].sort((a, b) => a.year - b.year);

  const exhibitionList = [
    { year: exhibition.year, winner: exhibition.winner, margin: exhibition.margin,
      pakistan: sideOf(exhibition.pakistan), world: sideOf(exhibition.world) },
    ...data.exhibition,
  ].sort((a, b) => b.year - a.year);

  let playoffApps = data.playoffApps;
  for (const f of field) playoffApps = bumpCount(playoffApps, f.gm, (r) => ({ note: r.note }));

  let bowlApps = bumpCount(data.bowlApps, playoff.champion.gm, (r) => ({
    record: bumpRecord(r.record, 'W'),
    note: r.note,
  }));
  bowlApps = bumpCount(bowlApps, playoff.runnerUp.gm, (r) => ({
    record: bumpRecord(r.record, 'L'),
    note: r.note,
  }));

  // ── Records ──────────────────────────────────────────────────────────────
  const ctx = buildContext(season, config, playoff, { champions, seasonsList });

  let playerNames = new Map();
  const ids = playerIdsToResolve(ctx);
  if (ids.length) {
    playerNames = await fetchPlayerNames(config.season, config.leagueId, ids);
  }

  const cmp = compareToRecords(data.records, ctx, playerNames);
  const records = data.records.map((card) => {
    const hit = cmp.broken.find((b) => b.label === card.label);
    return hit ? hit.card : card;
  });

  const updates = { champions, seasons: seasonsList, exhibition: exhibitionList, playoffApps, bowlApps, records };
  const written = dryRun ? false : await writeSiteData(updates);

  return {
    status: dryRun ? 'dry-run' : written ? 'recorded' : 'no-change',
    season: config.season,
    champion: playoff.champion,
    runnerUp: playoff.runnerUp,
    field: field.map((f) => f.gm),
    exhibition,
    broken: cmp.broken,
    review: cmp.review,
    unknown: cmp.unknown,
  };
}

const sideOf = (s) => ({
  total: s.total,
  players: s.players,
  roster: s.members.map((m) => ({ gm: m.gm, points: m.score, players: m.players })),
});

// Run directly: `node src/season-end.mjs [--dry-run]`
if (process.argv[1] && process.argv[1].endsWith('season-end.mjs')) {
  seasonEnd({ dryRun: process.argv.includes('--dry-run') })
    .then((r) => {
      if (r.status === 'already-recorded') return console.log(`${r.season} is already recorded. Nothing to do.`);
      if (r.status === 'in-progress') {
        return console.log(`${r.season} is still in progress (weeks played: ${r.played.join(', ')}).`);
      }
      console.log(`\n${r.season}: ${r.champion.gm} (#${r.champion.seed}) def ${r.runnerUp.gm} (#${r.runnerUp.seed})`);
      console.log(`Playoff field: ${r.field.join(', ')}`);
      console.log(`Pakistan vs. the World: ${r.exhibition.winner} by ${fmt(r.exhibition.margin)}`);
      console.log(`\nRecords broken: ${r.broken.length}`);
      for (const b of r.broken) {
        console.log(`  · ${b.label}: ${b.was.value} (${b.was.holder}) -> ${b.card.value} (${b.card.holder})`);
      }
      for (const v of r.review) {
        console.log(`  ? ${v.label}: ${v.candidate} vs ${v.incumbent} — needs a human, card left alone`);
      }
      console.log(`\nStatus: ${r.status}`);
    })
    .catch((err) => {
      console.error(`\nseason-end failed: ${err.message}\n`);
      process.exitCode = 1;
    });
}
