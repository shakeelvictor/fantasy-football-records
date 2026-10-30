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

**Two module systems live in this repo, and the file extension is what tells
them apart.** `.mjs` is Node ESM; `.js` at the repo root is a browser classic
script. `package.json` deliberately has **no `"type"` field**: setting
`"type": "module"` would declare that `data.js` and `app.js` are ES modules,
which is false, and it is not needed because `.mjs` is unambiguous on its own.
Keep new Node code as `.mjs`.

Commits to `main` deploy. That is intended.

**The repo is public, and that is load-bearing.** GitHub meters Actions on
private repos and gates them behind account billing: on 2026-10-29 a billing
problem refused the weekly job before it ran a single step, and the schedule
stayed dead until the repo went public. Public repos get unmetered runners, so
no billing state can cost a Thursday again. Nothing here was ever secret —
there are no Actions secrets at all, and Netlify's `publish = "."` already
serves the whole repo root as the site. Going private again brings the meter,
and the failure mode, straight back.

```bash
npm test            # offline; replays checked-in fixtures
npm run ingest      # fetch current season -> data/<year>.json + weekly-log.js
npm run records     # promote any all-time record this season has already beaten
npm run season-end  # after Week 18: write the season into data.js (no-op until then)
npm run seal-season # rollover only: fold baselines, reset the log for next year
npm run fixtures    # regenerate replay fixtures (dev only, hits MFL)
npm run lineups     # lineup efficiency for the current season -> lineups-data.js
npm run payouts     # settle the money book -> payouts-data.js (offline)
```

`npm run lineups --all` rebuilds the whole 2016-2025 archive and hits MFL hard
enough to get 429'd partway through; it writes one season file at a time, so
rerunning picks up where it stopped. `--render-only` rebuilds `lineups-data.js`
from the season files already on disk and touches no network.

`ingest`, `records` and `season-end` all run in the weekly job, in that order —
`records` reads the season file `ingest` just wrote. `season-end` no-ops until
Week 18 has been played and no-ops again once the season is recorded, so it is
safe to run every week forever.

**`records` only touches cards that are monotone in weeks played** — running
maxes, running mins, cumulative totals. Those can be broken early but never
overstated, so a half-played season is a valid input. Win-pct records and
anything needing the playoff fold are excluded and wait for `season-end`; after
one week every team is 11-0 or 0-11, and promoting that would put a .1000 season
in the book. The `inSeason` flag in `src/records.mjs` is the list, and
`test/records-in-season.test.mjs` locks both halves of it.

**Light is the default theme and dark is the alternate.** Dark is the *presence*
of `<html data-theme="dark">` and light is its absence, so bare `:root` carries
the light palette — a reader with JavaScript off, or the instant before the head
script runs, gets the default rather than the alternate. Do not move the light
values behind an attribute; that inverts which theme a broken page falls back to.

Nothing consults `prefers-color-scheme` any more. The site followed the OS until
the league asked for light to be the default, so there is no media query left in
`styles.css` and no `matchMedia` in `theme.js` — if either reappears the OS is
deciding the theme again.

A tiny inline script in each page's `<head>` stamps the attribute before first
paint; `theme.js` only drives the control. Both halves are needed: move the
stamping into `theme.js` and a reader who chose dark gets a flash of light on
every load. The two OS-scoped `theme-color` metas are gone for the same reason —
the browser picked one by OS preference and fought the choice. `theme.js` sets a
single meta instead. `test/headline-numbers.test.mjs` locks all of it.

**Headline numbers are derived, never typed.** The hero tiles, the era tab
labels, the exhibition "contested since", the footer span and the keeper page's
eyebrow are all filled in by script from `DATA` — `renderHeadlineNumbers()` in
`app.js`, and a small block in `keepers.js`. They used to be literals in the
markup and had already drifted: the Unique Champs tile read 9 for a year after
Raj's 2024 title made it 10. If you add something to the hero, derive it or
leave it out; `test/headline-numbers.test.mjs` fails on a hardcoded year in the
markup and checks that recording a season moves every number.

## Editing rules

- **`weekly-log.js`** — the block between `>>> BEGIN GENERATED` and
  `<<< END GENERATED` is rewritten by `npm run ingest`. Hand-edits there are
  lost. Everything outside the markers, including `GMS`, is hand-maintained.
- **`data.js`** — part generated, part hand-maintained. Blocks wrapped in
  `>>> BEGIN GENERATED <key>` markers (champions, seasons, exhibition,
  playoffApps, bowlApps, records, both baselines) are rewritten by
  `season-end` and `seal-season`, and `records` alone also by the weekly
  `npm run records`. `tidbits` and `drafts` have no markers and are
  never touched by any script — tidbits are editorial and stay that way.
  Rewriting the same data back must be byte-identical, or the weekly job commits
  churn; `test/write-data.test.mjs` asserts that.
- **`data/franchises.json`** — hand-maintained, and the one thing that cannot
  be fetched: MFL carries no `owner_name` for this league, so nothing links a
  franchise id to a GM name. Ids are stable across seasons; team names are not.
- **`lineups-data.js`** — fully generated by `npm run lineups`; no markers,
  nothing hand-maintained. Its source of truth is `data/lineups/<year>.json`,
  one file per season, also generated. Rewriting the same archive must be
  byte-identical for the same reason `data.js` must be.

  It ships **only the leaderboards and records the Lineup Efficiency section on
  `index.html` shows** — career tables and a handful of record rows. The
  per-season manager tables stay in `data/lineups/` and are deliberately not
  sent to the browser; eleven of them was more than anyone wanted to read. A
  test caps the file size and asserts the season tables are absent, so
  re-adding them is a decision, not an accident.
- **`data/franchises.json`** — `history` pins seasons where the current id -> GM
  map is wrong: 0002 was Raj through 2024, and 0011 (Laura) did not exist before
  2025. `src/franchise-map.mjs` is the only place that resolves this, and the
  ingest, the fixture builder and the lineup archive all go through it.
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

**There is no game-level history before the MFL era.** `data.js` is
already-derived summary, not raw data. Nothing can recompute a 2009 record; the
archive is read, never rewritten.

MFL itself *does* serve past seasons — 2015 through 2025 all return full rosters
with per-player scores, which is what the lineup archive is built from. But
fetching them stays a deliberate, dev-only act: `npm run fixtures` and
`npm run lineups --all`. The weekly job never reaches back.

**2015 is in a different MFL league — `53720`, not `19716`.** Asking 19716 for
2015 returns a plausible-looking stub of 3 weeks and 8 franchises instead of an
error, which is precisely how you conclude the season has no data when it has a
full one somewhere else. `config.archive.leagueIds` holds the exception. If a
season ever looks suspiciously thin, check the league id before concluding
anything.

**MFL needs no API key for this league.** League 19716's export is readable
without one, and no `MFL_API_KEY` secret has ever existed. The workflow used to
pass `secrets.MFL_API_KEY` into four steps, where it quietly resolved to an
empty string and looked wired up for a year. `src/mfl/client.mjs` reads the
variable and sends `APIKEY` only when it is set, so the hook is there if MFL
ever starts refusing. Do not add the `env:` blocks back to make the workflow
look complete; wire it the day a fetch actually fails.

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
- *Lowest Points to Win a Week* and *Most Consecutive Wins* are **regular
  season only**. Winning a week means topping the whole league; topping a
  four-team playoff round is a different achievement and the postseason has its
  own records. The old 132.54 card came from a 2016 playoff round and no longer
  qualifies.

When a record's meaning is genuinely ambiguous, mark it `reportOnly` and
surface the number rather than guessing. A records book that silently invents
history is worse than a stale one.

**Playoff-week points only count for teams still playing.** All-play means an
eliminated team and a team that missed the playoffs both still post a score
every week. `contestedWeeks()` derives who actually played from the fold — the
bye seed skips Week 15, eliminated teams stop, only the finalists play Week 17.

**MFL's `opt_pts` and `shouldStart` are wrong for this league, and it is not
close.** MFL's lineup optimizer does not know the house rules — it happily
builds "optimal" lineups with 9 combined QB/RB/WR/TE against a cap of 8, and 2
IDP against a minimum of 3. In the 2025 regular season 53% of its optimal
lineups were ones nobody would have been allowed to submit, while every lineup
actually submitted was legal. Using `opt_pts` reorders the efficiency table.
`src/lineups.mjs` recomputes the optimum from the nine legal lineup shapes; a
test locks those shapes against the four the league actually played in 2025.

**The starting lineup has changed twice, so the archive is era-aware.** 2015 had
a kicker but no flex — one fixed 11-man shape, so the only decision was who
filled it. For 2016 the league voted the kicker out and a flex in, still 11.
2017 brought the kicker back alongside the flex, giving the 12-man lineup the
rules describe today. `config.archive.lineupEras` encodes all three, and
`rulesFor()` throws rather than measure a season with no era on record against
today's rules.

A submitted lineup *smaller* than a legal one is fine and happens a few times a
year: MFL will not save an empty slot but teams have still gone in a man short,
and the score stands.

A lineup *larger* than a legal shape is an illegal lineup MFL failed to block.
Four exist — Andres, 2016 weeks 6-9, nine offensive starters — and the league
settled that outside the records at the time and let the results stand. **They
still count.** The manager is measured against the lineup he was supposed to be
allowed to field, which is the whole point of the metric, and the weeks are
listed in the season file's `illegal` array. Do not "fix" this by dropping them:
erasing four weeks of real history is worse than recording what happened.

The season file also carries an `unmodelled` array for a week that cannot be
priced at all — one where the manager outscored the best legal lineup, meaning
the shape model itself is wrong. There are none on record, and if one ever
appears the fix is the model, not the data.

**A season being played is settled but never reconciled.** `settleSeason()`
enforces the full-pot check only when `complete` is true — which the build
decides by whether season-end has recorded the year in `data.js`. Demanding the
whole pot mid-season would fail the weekly job every Thursday of the year.

**Nothing accrues in the playoffs until the Fantasy Bowl.** Weekly payouts are
regular-season only, so Weeks 15 and 16 add nothing at all — knocking a team out
is not a payout event — and the regular-season prize and both Bowl prizes land
together the Thursday season-end records the year. That is also when a payout
structure carried forward wrongly fails loudly instead of publishing.

Because of this, anything asserting the league nets to zero must allow for the
pot still on the table. `npm test` gates the weekly job, so a test that only
holds in the offseason breaks every run of the season. The same applies to
tests naming who is new to the league: derive the set, never write the names.

**The money book pays out the whole pot, and that is the check.** Every season
in `data/payouts.json` must sum to exactly `teams x buyIn`; `settleSeason()`
throws otherwise rather than publish a gap, and across the league the net is
zero. Both are locked by tests.

Only 2019-2025 is priced. The league confirms the structure was genuinely
different before that — no weekly payouts, the regular-season prize came later,
the buy-in was raised at some point — and those amounts are not recorded
anywhere available. **The Yahoo era knows who won and cannot know what they were
paid.** Do not backfill it with today's numbers.

Only some seasons have their figures known for certain — from the meeting notes,
or confirmed directly by the league (2026 is unchanged from 2025, confirmed). The
rest are reconstructed. What justifies that is 2021: the regular-season prize drops
$195 -> $160 in exactly the year the schedule goes 13 -> 14 weeks, and
195 - 35 = 160 — the extra weekly payout came straight out of it. A test locks
that relationship, because it is what makes the 2019/2020 champion figures
trustworthy when the notes never state them.

The site shows one board — Money Won, inside All-Time Leaders — totalling the
regular season and the playoffs together. `payouts-data.js` still carries
`paidIn` and `net` per manager, and the zero-sum check still runs over them;
they are simply not rendered. An up-and-down board is a live option if the
league ever wants it.

That board carries its own span, because unlike everything beside it in
All-Time Leaders it cannot cover all eras.

**Playoff efficiency counts only the weeks a manager was alive to play.**
All-play means an eliminated team still posts a score every playoff week, so
counting raw playoff weeks would charge a knocked-out manager for dead-rubber
lineups he had no reason to set. `scripts/backfill-lineups.mjs` folds the
bracket through `playoffResult()` and keeps only the contested franchise-weeks
— the same reasoning as `contestedWeeks()` elsewhere.

**The only bar on a career record is a second season, and that is deliberate.**
An earlier version gated the records behind a tunable season/week minimum, which
meant an invented number decided who held them — at 10 playoff weeks the playoff
record was Hoss, at 11 Anand, at 13 Imran. That is a league ruling nobody made.
`careerMinSeasons: 2` is the smallest bar that means anything instead of a dial:
it marks exactly the two managers who joined in 2025 and clears itself the moment
they play a second year.

It is counted from a manager's **league seasons**, not his rows in whichever
table is being drawn, so the marker follows him onto the playoff board — one deep
run should not put a newcomer atop a table he has barely played in. Everyone is
ranked on every board regardless; only the record waits. Laura tops the career
table on raw efficiency and the record still reads Samson. Do not turn this back
into a tuning knob.

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
field, Pakistan vs. the World, playoff and Bowl appearance counts, and the
all-time records that need a finished season — win pct, playoff and Fantasy Bowl
records. The rest have already been promoted week by week by `npm run records`,
so season-end finds them current and leaves them alone. Nothing to paste.

Lineup efficiency needs nothing at season end either. `npm run lineups` runs in
the weekly job, so the finished season's regular-season *and* playoff numbers
are already current by the last Thursday of the year — playoff weeks fill in on
their own once the bracket has folded, and until then `playoffResult()` reports
incomplete and they stay empty rather than half-counted.

The archive is also self-describing: each `data/lineups/<year>.json` records its
own season length, and `--all` spans every season on disk as well as every one
named in config. That is what stops rollover dropping the season just played —
after `seal-season` bumps the year, the finished season is neither `config.season`
nor listed in `config.archive.regularSeasonWeeks`, and reading config alone would
skip it without a word.

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
