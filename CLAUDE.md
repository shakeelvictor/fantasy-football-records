# FFLR records site — working notes

A static records book for a fantasy football league running since 2002, plus a
weekly job that pulls the current season from MyFantasyLeague.

**Design record and open items live in [MIGRATION.md](MIGRATION.md). Real MFL
response shapes live in [src/mfl/SHAPES.md](src/mfl/SHAPES.md).** Read those
before changing the pipeline; this file is orientation and traps only.

## Shape of the thing

Zero build step. Netlify serves the repo root as static files and `data.js`,
`weekly-log.js` and `app.js` are loaded by the browser as plain `<script>` tags
declaring globals. **They are not modules** — do not add `import`/`export` or
make them async, it will silently break the page. Node code under `src/` is
separate and never shipped to the browser.

Commits to `main` deploy. That is intended.

```bash
npm test            # offline; replays checked-in fixtures
npm run ingest      # fetch current season, rewrite data/<year>.json + weekly-log.js
npm run seal-season # January only; prints what to paste into data.js
npm run fixtures    # regenerate replay fixtures (dev only, hits MFL)
```

## Editing rules

- **`weekly-log.js`** — the block between `>>> BEGIN GENERATED` and
  `<<< END GENERATED` is rewritten by `npm run ingest`. Hand-edits there are
  lost. Everything outside the markers, including `GMS`, is hand-maintained.
- **`data.js`** — hand-maintained. Holds the frozen pre-2026 baselines and the
  prose (records cards, tidbits). The site tallies the generated log on top of
  these baselines; the ingest never writes this file.
- **`data/franchises.json`** — hand-maintained, and the one thing that cannot
  be fetched: MFL carries no `owner_name` for this league, so nothing links a
  franchise id to a GM name. Ids are stable across seasons; team names are not.
- **`data/exhibition.json`** — hand-maintained Week 18 sides. MFL has no concept
  of Pakistan vs. the World.

## Traps

**Seeding is best all-play record, then points for — not total points.** This is
the one most likely to get "fixed" wrongly. Points-based seeding is a plausible
reading of "regular-season winner" and puts the wrong team in the playoff field
in two of three checkable seasons. Locked by a test in `test/derive.test.mjs`.

**The league is all-play.** Every team is scored against every other team each
week, so `weeklyResults` has no `matchup` pairing and a season record reads
`116-24`, not `12-2`. Do not treat a missing matchup as a bug.

**`TYPE=leagueStandings` is deliberately not fetched.** Its totals include the
playoffs, so they can't source any record the site shows — 2025 standings say
`128-39` where the site correctly says `116-24`. The ingest makes two MFL calls.

**There is no game-level history before 2026.** `data.js` is already-derived
summary, not raw data. Nothing can recompute a 2009 record; the archive is read,
never rewritten. Don't fetch prior seasons for data either — MFL only supports
the current year. Past seasons are fetched *once*, deliberately, by
`npm run fixtures` to build replay tests.

**The weekly job runs Thursday afternoon on purpose.** MFL posts stat
corrections Thursday morning, and the league has treated the post-correction
numbers as the final tally since the MFL era began. Do not move the cron
earlier to "get results sooner" — it would race the corrections, and weekly
winners carry the largest payout share, so a revised winner is a money
question. The cron is UTC (`23 19 * * 4`), landing 13:23–14:23 Central.

**Config keys must be live.** `data/league.config.mjs` previously carried keys
that looked like settings but were never read. Every key there is now consulted
by code. If you add one, wire it up or leave it out.

## Testing

The load-bearing tests replay real 2023–25 seasons and assert against records
the league published independently, years before this code existed — seed order,
champion, runner-up, and exact Fantasy Bowl scores. If a change breaks those,
the change is wrong, not the fixtures. Regenerate fixtures only when adding a
season.

## Season rollover (January)

`npm run seal-season` prints the champions row, seasons row, recomputed
baselines and exhibition block to paste into `data.js`. It deliberately does not
write that file — it mixes derived counts with prose that needs judgement.
Then bump `season` in `data/league.config.mjs`, re-verify `franchises.json`
against the new roster, and re-enable the scheduled workflow if the offseason
disabled it.
