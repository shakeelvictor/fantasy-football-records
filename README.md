# The League — Records Book

A records site for a fantasy football league that has been running since 2002:
every champion, every playoff field, the all-time leaderboards, and the record
book. Twenty-four seasons across the Yahoo! era (2002–2014) and the
MyFantasyLeague era (2015–present).

The site is static. A weekly job pulls the current season from MyFantasyLeague,
recomputes what changed, and commits — so the records keep themselves up to
date without anyone editing a file mid-season.

## Pages

| Page | What it holds |
|---|---|
| `index.html` | Champions timeline, Pakistan vs. the World, all-time leaders (including money won), the record book, lineup efficiency, playoff fields, notable tidbits |
| `rules.html` | League rules — scoring, roster, playoffs, buy-in and payouts |
| `keepers.html` | Keeper history |

## How it works

No build step. Netlify serves the repo root as static files, and `data.js`,
`weekly-log.js`, `lineups-data.js`, `payouts-data.js`, `theme.js` and `app.js`
are loaded straight by the browser as plain scripts. Pushing to `main` deploys.

The site is **light** by default, with a **dark** alternate behind the control in
the header. A choice is remembered per browser, and dark is stamped on the page
before it paints so switching never flashes.

The Node code under `src/` never ships to the browser — it only runs in GitHub
Actions, and its output is committed back as plain data.

```
MyFantasyLeague  ──►  GitHub Actions (Thursday)  ──►  commit  ──►  Netlify
```

### During the season

Every Thursday afternoon the job runs five steps in order, each feeding the next:

| Step | What it does | Needs MFL |
| --- | --- | --- |
| `ingest` | Refetches the whole current season, rewrites the weekly log | yes |
| `records` | Promotes any all-time record the season has already beaten | yes |
| `season-end` | Records a finished season (no-op until Week 18) | yes |
| `lineups` | Rebuilds lineup efficiency for the current season | yes |
| `payouts` | Settles the money book | no — reads what the steps above wrote |

That updates the two living leaderboards — **Weekly Regular Season Wins** and
**200+ Point Performances** — promotes any **Single-Game & Season Record** the
year has already beaten, so a record broken in Week 3 is on the site that same
day, and keeps **Lineup Efficiency** and **Money Won** current alongside them.

Only records that can't be overstated by a half-played season move weekly:
running highs, running lows and cumulative totals. Win-pct records and anything
resting on the playoff bracket wait for a finished season — after one week every
team in an all-play league is 11-0 or 0-11.

| Moves every Thursday (10) | Waits for season-end (7) |
| --- | --- |
| Highest Single Week · Reg. Season | Best Record · Expanded Season |
| Lowest Single-Game Total | Worst Record · Expanded Season |
| Lowest Points to Win a Week | Highest Total Points · Season |
| Slimmest Margin of Victory | Highest Playoff Points |
| Highest Total Points · Reg. Season | Widest Fantasy Bowl Margin |
| Highest Points to Start a Season | Most Fantasy Bowl Championships |
| Most Weekly Wins, Single Season | Most Consecutive Playoff Apps |
| Most Consecutive Wins | |
| Highest Single-Player · Reg. Season | |
| Highest Single-Player · Playoffs | |

The split is the `inSeason` flag in `src/records.mjs`, and
`test/records-in-season.test.mjs` locks both halves of it — including a test
that the full definition set *would* rewrite Best and Worst Record off a
one-week season, which is the failure the flag exists to prevent.

#### Efficiency and money, week by week

The same split — what a half-played season can safely say — governs the two
newer boards.

| Moves every Thursday | Waits for the season to finish |
| --- | --- |
| Lineup efficiency, regular season | Lineup efficiency, playoffs |
| Most Points Left on the Bench | Regular-season prize money |
| Worst Sit | Fantasy Bowl and runner-up money |
| Biggest Perfect Week | |
| Biggest Winning Bid | |
| Weekly winner money | |

**Nothing accrues in the playoffs until the Fantasy Bowl.** Weekly payouts are
regular-season only, so Weeks 15 and 16 add nothing at all — knocking a team out
is not a payout event — and the regular-season prize and both Bowl prizes land
together the Thursday the season is recorded. Playoff efficiency behaves the
same way: it counts only the weeks a manager was still alive to play, which
isn't known until the bracket has folded.

A season being played is settled but never *reconciled*. A finished season must
pay out its whole pot — `teams × buy-in`, to the dollar, or the build refuses it
— but demanding that mid-season would fail the job every week of the year, so an
in-progress season simply reports what is still on the table.

Thursday afternoon is deliberate: MFL posts stat corrections Thursday morning,
and the league treats the post-correction numbers as a week's final tally. The
job runs after them.

### When the season ends

Once Week 18 has been played, the same job records the year: champion and
runner-up, the playoff field in seed order, Pakistan vs. the World, playoff and
Fantasy Bowl appearance counts, and the records that needed the finished season.
It does nothing before Week 18 and nothing again once the season is recorded, so
it is safe to run every week year-round.

### What stays manual

- **Tidbits** — editorial prose, deliberately never generated.
- **Rollover**, once a year: `npm run seal-season --apply` folds the finished
  season into the frozen baselines and resets the weekly log for the new year.

## Commands

```bash
npm test            # offline — replays checked-in seasons, no network
npm run ingest      # fetch the current season
npm run records     # promote records the season has already beaten
npm run season-end  # record a finished season (no-op until Week 18)
npm run seal-season # yearly rollover
npm run lineups     # lineup efficiency for the current season
npm run payouts     # settle the money book (offline)
npm run fixtures    # regenerate test fixtures (hits MFL; rarely needed)
```

`npm run lineups --all` rebuilds the whole 2015–2025 archive and will get
rate-limited partway through; it writes one season at a time, so rerunning picks
up where it stopped. `--render-only` rebuilds the browser file from what is
already on disk and touches no network.

Node 22+. No dependencies.

## Layout

```
index.html  rules.html  keepers.html   pages
app.js  styles.css  theme.js           rendering
data.js                                the record book the site reads
weekly-log.js                          current season, regenerated weekly
lineups-data.js  payouts-data.js       generated boards — efficiency and money
data/                                  league config, franchise map, exhibition sides,
                                       payout structures, the season-by-season archive
src/                                   ingest, derivation, season-end, lineups, payouts
test/                                  tests + real past seasons as fixtures
```

Some of `data.js` is generated and some is hand-written; the generated parts are
marked in the file.

## A note on the numbers

This league is **all-play**: every team is scored against every other team each
week, so a season record reads `116-24` rather than `12-2`.

MyFantasyLeague is the source of truth for scores. This site is the source of
truth for everything MFL cannot express — cross-season records, the playoff
format, and Pakistan vs. the World.

Record definitions were verified against MFL rather than assumed, and the
derivation is tested by replaying real past seasons and checking it reproduces
results the league published years earlier.

## More

- [CLAUDE.md](CLAUDE.md) — orientation and the traps worth knowing before
  changing anything
- [MIGRATION.md](MIGRATION.md) — why the automation is built the way it is
- [src/mfl/SHAPES.md](src/mfl/SHAPES.md) — the MFL API responses, as observed,
  including the two fields MFL reports that this league cannot use
