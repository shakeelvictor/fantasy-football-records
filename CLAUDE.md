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
npm run ingest      # fetch current season -> data/<year>.json + weekly-log.js
npm run season-end  # after Week 18: write the season into data.js (no-op until then)
npm run seal-season # rollover only: fold baselines, reset the log for next year
npm run fixtures    # regenerate replay fixtures (dev only, hits MFL)
```

Both `ingest` and `season-end` run in the weekly job. `season-end` no-ops until
Week 18 has been played and no-ops again once the season is recorded, so it is
safe to run every week forever.

## Editing rules

- **`weekly-log.js`** — the block between `>>> BEGIN GENERATED` and
  `<<< END GENERATED` is rewritten by `npm run ingest`. Hand-edits there are
  lost. Everything outside the markers, including `GMS`, is hand-maintained.
- **`data.js`** — part generated, part hand-maintained. Blocks wrapped in
  `>>> BEGIN GENERATED <key>` markers (champions, seasons, exhibition,
  playoffApps, bowlApps, records, both baselines) are rewritten by
  `season-end` and `seal-season`. `tidbits` and `drafts` have no markers and are
  never touched by any script — tidbits are editorial and stay that way.
  Rewriting the same data back must be byte-identical, or the weekly job commits
  churn; `test/write-data.test.mjs` asserts that.
- **`data/franchises.json`** — hand-maintained, and the one thing that cannot
  be fetched: MFL carries no `owner_name` for this league, so nothing links a
  franchise id to a GM name. Ids are stable across seasons; team names are not.
- **`data/exhibition.json`** — the Pakistan vs. the World split. `standing`
  carries forward to every new season, so a normal year needs no edit;
  `overrides` pins a year that differed (2024, when Raj was still in the
  league). MFL has no concept of these sides, so this cannot be fetched.

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

**Record definitions were verified against MFL, not assumed.** Two are easy to
get wrong and are locked by tests:

- *Slimmest Margin of Victory* is the margin a week was **won** by (first over
  second), not the gap between any adjacent pair. In 2019 the closest adjacent
  pair was 0.19 while the recorded record is 0.25 — that season's narrowest
  winning margin.
- *Lowest Points to Win a Week* includes playoff rounds but **excludes the
  Fantasy Bowl**. Three Bowls were won for less than the standing 132.54, so
  the league does not count the Bowl as a week; it has its own records.

When a record's meaning is genuinely ambiguous, mark it `reportOnly` and
surface the number rather than guessing. A records book that silently invents
history is worse than a stale one.

**Playoff-week points only count for teams still playing.** All-play means an
eliminated team and a team that missed the playoffs both still post a score
every week. `contestedWeeks()` derives who actually played from the fold — the
bye seed skips Week 15, eliminated teams stop, only the finalists play Week 17.

**Config keys must be live.** `data/league.config.mjs` previously carried keys
that looked like settings but were never read. Every key there is now consulted
by code. If you add one, wire it up or leave it out.

## Testing

The load-bearing tests replay real 2023–25 seasons and assert against records
the league published independently, years before this code existed — seed order,
champion, runner-up, and exact Fantasy Bowl scores. If a change breaks those,
the change is wrong, not the fixtures. Regenerate fixtures only when adding a
season.

## End of season

After Week 18 the weekly job records the year automatically: champion, playoff
field, Pakistan vs. the World, playoff and Bowl appearance counts, and any
all-time record the season broke. Nothing to paste.

Only two things remain manual:

1. **Tidbits** — editorial prose, deliberately never generated.
2. **Rollover**, when you're ready to open the next year:
   `npm run seal-season --apply` folds the finished season's weekly wins and
   200+ games into the frozen baselines and resets `weekly-log.js`. It refuses
   to run before `season-end` has recorded the year. Then bump `season` in
   `data/league.config.mjs`, re-verify `franchises.json` against the new roster,
   run `npm run fixtures`, and re-enable the workflow if the offseason
   disabled it.

The fold and the log reset must happen together — the site tallies the log on
top of the baselines, so folding without clearing double-counts and clearing
without folding loses the season. That is why it is one step, and why it is not
automatic.
