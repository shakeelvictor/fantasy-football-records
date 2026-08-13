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
| `index.html` | Champions timeline, Pakistan vs. the World, all-time leaders, the record book, playoff fields, notable tidbits |
| `rules.html` | League rules — scoring, roster, playoffs, buy-in and payouts |
| `keepers.html` | Keeper history |

## How it works

No build step. Netlify serves the repo root as static files, and `data.js`,
`weekly-log.js` and `app.js` are loaded straight by the browser. Pushing to
`main` deploys.

The Node code under `src/` never ships to the browser — it only runs in GitHub
Actions, and its output is committed back as plain data.

```
MyFantasyLeague  ──►  GitHub Actions (Thursday)  ──►  commit  ──►  Netlify
```

### During the season

Every Thursday afternoon the job fetches the season so far and updates the two
living leaderboards — **Weekly Regular Season Wins** and **200+ Point
Performances**.

Thursday afternoon is deliberate: MFL posts stat corrections Thursday morning,
and the league treats the post-correction numbers as a week's final tally. The
job runs after them.

### When the season ends

Once Week 18 has been played, the same job records the year: champion and
runner-up, the playoff field in seed order, Pakistan vs. the World, playoff and
Fantasy Bowl appearance counts, and any all-time record the season broke. It
does nothing before Week 18 and nothing again once the season is recorded, so it
is safe to run every week year-round.

### What stays manual

- **Tidbits** — editorial prose, deliberately never generated.
- **Rollover**, once a year: `npm run seal-season --apply` folds the finished
  season into the frozen baselines and resets the weekly log for the new year.

## Commands

```bash
npm test            # offline — replays checked-in seasons, no network
npm run ingest      # fetch the current season
npm run season-end  # record a finished season (no-op until Week 18)
npm run seal-season # yearly rollover
npm run fixtures    # regenerate test fixtures (hits MFL; rarely needed)
```

Node 22+. No dependencies.

## Layout

```
index.html  rules.html  keepers.html   pages
app.js  styles.css                     rendering
data.js                                the record book the site reads
weekly-log.js                          current season, regenerated weekly
data/                                  league config, franchise map, exhibition sides
src/                                   ingest, derivation, season-end
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
- [src/mfl/SHAPES.md](src/mfl/SHAPES.md) — the MFL API responses, as observed
