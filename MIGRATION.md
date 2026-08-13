# FFLR weekly automation — what got built, and where it departs from the spec

Short version: the weekly job works and is verified, but the data model in the
build spec assumed a history that does not exist. Three of the spec's decisions
had to change. Everything here is reversible; nothing on the live site changed.

---

## §0, resolved: the answer is neither (a) nor (b)

The spec asked whether 2002–2025 lives in a JSON file the components read, or is
hardcoded into the components, and said to extract to JSON if the latter.

It is hardcoded, in [data.js](data.js) — but the more important finding is
**what** is hardcoded. There is no game-level history anywhere in this repo. No
per-week scores, no per-GM results, nothing before the current season. What
`data.js` holds is *already-derived summary*:

| Field | What it actually is |
|---|---|
| `champions` | One row per season: champ, seed, runner-up, a score *string* |
| `playoffApps`, `bowlApps` | Hand-tallied counts |
| `weeklyWinsBaseline`, `bigGamesBaseline` | Frozen counts through 2025 |
| `records` | Hand-written cards, prose context (`'2020 · Week 12'`) |
| `tidbits` | Free prose with embedded HTML |
| `seasons` | Playoff field per year, seed-ordered |

**Consequence: `derive(archive, current) -> Records` cannot exist as specified.**
Recomputing "single-game highs and lows, blowouts, squeakers" across all seasons
requires games, and there are none for 2002–2025. Extracting this to
`archive.json` would have been a rename, not a refactor, so I did not do it —
it would add a file and an async fetch to a zero-build static site while
changing nothing. `data.js` stays exactly as it is.

**The frozen-archive test in §7 would have been a tautology.** `derive()` over an
archive containing no games can only pass its input back out; asserting the
output matches a snapshot would assert nothing, while looking like the
load-bearing guardrail the spec correctly says it should be.

### What replaced it

Replay tests, in [test/derive.test.mjs](test/derive.test.mjs). The derivation is
run over **real 2023, 2024 and 2025 MFL data** and checked against records the
league published years before this code existed. For what it covers this is
strictly stronger than a self-snapshot:

- **Seed order matches the recorded playoff field in all three seasons — 18/18
  seed slots**, including two seasons where seeds 3/4 and 5/6 were separated
  only by the points-for tiebreak.
- **The playoff fold reproduces the correct champion and runner-up, at the
  correct seeds, in all three seasons.**
- 2023's Fantasy Bowl comes out to `142.36 – 125.67` — exact to the cent.
- Samson's 2025 regular season derives to `116-24 · .829`, matching the record
  card, and his 8 weekly wins match the single-season record.

Fixtures are committed, so `npm test` is offline and deterministic.

---

## The league is all-play. The spec did not mention this, and it matters

`TYPE=weeklyResults` returns **no `matchup` key and no `result` field** — just one
score per franchise per week. Every team is scored against every other team each
week. That is why season records read `116-24` (14 weeks × 10 opponents) rather
than `12-2`, and why "Best Record · Pre-Expansion" is `83-34` — those are 117 and
140 game seasons.

Two things follow:

1. All-play records must be computed from weekly scores. `TYPE=leagueStandings`
   **includes the playoffs** and cannot be used: 2025 final standings show
   `128-39 / .766` for the GM the site records at `116-24 / .829`. Both are
   right for what they measure. Standings are fetched for cross-checking only.
2. Seeding is derived in code, as the spec required — and this turned out to be
   load-bearing, not defensive. In 2025 seeds 3 and 4 were both `71-69` and were
   separated by 3.39 points for.

---

## The gap the spec missed: there is no franchise → GM link

MFL knows franchise `0003`. The site knows `Samson`. **Nothing in the MFL
response connects them** — `owner_name` is absent for every franchise in this
league. Franchise IDs are stable across seasons but team names are not: `0001`
has been "FOX Injury Time-Out Music", "The GOAT", "Uncle Rico" and now "Smells
Like GOAT", all Shak.

So [data/franchises.json](data/franchises.json) is hand-maintained. I did not
guess it — a wrong row silently misattributes every record a GM earns. Each row
was derived by replaying past seasons and matching against published results,
then cross-checked across three seasons that agree independently.

Franchise `0002` was named "Raj" and won the 2024 title; from 2025 it is
"Ryaan". **Confirmed by the league: Ryaan replaced Raj, who is no longer in the
league.** The slot changed hands rather than being renamed. Raj's history stays
under `Raj` in `data.js` and is unaffected — records follow the GM name, not the
franchise id.

---

## Score drift: the site and MFL disagree slightly, and MFL is newer

Replaying past Fantasy Bowls surfaced small differences between what MFL returns
now and what was hand-entered on the site:

| Season | Site | Derived from MFL |
|---|---|---|
| 2023 | `142.36 – 125.67` | `142.36 – 125.67` — exact |
| 2024 | `166.52 – 151.95` | `167.02 – 151.96` |
| 2025 | `123.76 – 116.70` | `123.77 – 117.70` |

Every difference is MFL being *higher*, which is consistent with stat
corrections landing after someone typed the number in. The 2025 runner-up gap is
exactly 1.00, which also looks like a plausible transcription slip.

**Left alone, per the league.** They are frozen history. This is precisely the
drift the automation removes going forward.

---

## Playoff structure, verified against the rules page

Every structural constant in [data/league.config.mjs](data/league.config.mjs)
was checked against the Playoffs section of [rules-data.js](rules-data.js) and
matches: six teams qualify, regular season is Weeks 1–14, playoffs are Weeks
15–17, the Fantasy Bowl is Week 17, Week 18 is Pakistan vs. the World, and
**only the regular-season winner gets a bye** — "The No. 1 seed sits out the
first round; everyone else plays in Week 15."

The regular-season winner is **the best record at the end of Week 14**, and that
team takes the first-round bye. Seeding is therefore win pct, then points for.

This is worth stating explicitly because the obvious alternative reading — most
total points — is wrong, and wrong in a way that looks fine until you check:

| Season | Recorded field | Seeded by total points instead |
|---|---|---|
| 2023 | Samson, Andres, Asher, **Shak**, Vip, Raj | Samson, Andres, Asher, Vip, Raj, **Hoss** |
| 2024 | Raj, Samson, Dante, Asher, Shak, Anand | Raj, **Asher**, Dante, **Samson**, Shak, Anand |
| 2025 | Samson, Hoss, Asher, Imran, Laura, **Shak** | Samson, Hoss, Laura, Asher, Imran, **Dante** |

Points-based seeding puts the wrong team in the playoffs in two of three
seasons. Record-based seeding reproduces all three exactly. A test asserts both
halves of that, so the mistake cannot be reintroduced quietly.

The single-bye rule is enforced directly in `playoffResult()` rather than
trusted to config, because the arithmetic does not catch a second bye on its
own — a two-bye field still folds to 2 (`4 → 2`, plus 2 returning `→ 4 → 2`)
while silently handing two GMs a week off.

---

## Deviations from the spec, and why

| Spec | Built | Why |
|---|---|---|
| TypeScript, `src/mfl/types.ts` | Plain ESM + [SHAPES.md](src/mfl/SHAPES.md) | Repo has no build step; Netlify serves it as static files. Adding `tsc` for ~400 lines of ETL adds a toolchain to a zero-build site. Real observed shapes are documented instead of guessed. |
| `data/archive.json` | Not created | Would be a rename of `data.js`, not an extraction. See §0 above. |
| `data/records.json`, site reads it | Not created | Nothing to generate — the site's records are prose cards. The job writes `weekly-log.js`, which the site already consumes. |
| `npm ci` | Omitted | Zero dependencies, so no lockfile to install from. Marked in the workflow for the day that changes. |
| Three MFL calls per run | Two | `leagueStandings` was fetched and never used — its totals include the playoffs, so nothing on the site can be sourced from it. Dropped rather than left as a weekly request whose result was discarded. The reasoning stays in [SHAPES.md](src/mfl/SHAPES.md). |
| `timezone: America/Chicago` | UTC cron | I could not verify that key is supported. An unrecognised key fails workflow parsing, and a silently dead scheduler is worse than the hour of DST drift. Swap it in if you confirm it works. |
| Keepalive "or a calendar reminder" | [keepalive.yml](.github/workflows/keepalive.yml) | The Feb–Aug offseason trips the ~60-day auto-disable every year, silently. A monthly heartbeat commit is one line of noise against a dead Week 1. |

Also added, not in the spec: an explicit guard rejecting more than one bye seed.
The spec says two byes would break the fold — they do not. With
`eliminatedPerWeek {15:2, 16:2}` a two-bye field still reduces to 2
(4 → 2, plus 2 returning → 4 → 2), so a team-count assertion at the Fantasy Bowl
passes while two GMs quietly get a week off. The invariant is asserted directly.

---

## Pakistan vs. the World

Added as its own section under the Champions Timeline. The Week 18 exhibition
was first contested in **2024** — 2023 has no Week 18 at all — so the series
currently stands at **1–1**:

| Season | Winner | Pakistan | the World |
|---|---|---|---|
| 2024 | Pakistan by 51.87 | **234.98** (5) | 183.11 (5) |
| 2025 | the World by 23.32 | 124.31 (6) | **147.63** (5) |

This is the league's **Pro Bowl**, and the format matters for how it's read.
Each side fields **one combined super lineup** of its managers' best players,
and both lineups are the same size — **12 a side in both seasons**, confirmed
from MFL's `starters` list:

| Season | Pakistan | the World |
|---|---|---|
| 2024 | 5 managers → **12 players** | 5 managers → **12 players** |
| 2025 | 6 managers → **12 players** | 5 managers → **12 players** |

So the manager counts differing (6 v 5 in 2025) is **not** an imbalance, and an
earlier draft of this section wrongly framed it as one. Managers contribute
uneven numbers of players — Dante alone supplied 6 of the World's 12 in 2024,
while Anand supplied none — and the sides can carry different numbers of
managers. The lineups are what's equal, so the totals compare like for like.

The UI therefore leads with lineup size (`12 players from 6 managers`) and shows
each manager's contribution as players sent plus points returned. `derive.mjs`
throws if the two lineups ever differ in size, since that would break the
comparison rather than merely look odd.

Rosters live in [data/exhibition.json](data/exhibition.json) and are
hand-maintained: MFL has no concept of these sides, so there is nothing to
fetch. Scores are derived from the season file. `derive.mjs` cross-checks the
roster against the actual Week 18 scores and fails loudly if a GM is missing,
duplicated, or on both sides — the totals must account for everyone who played.

`npm run seal-season` prints next season's block ready to paste, once that
year's sides are recorded.

**One correction worth flagging:** the 2025 World roster as given listed Anand
twice and omitted Dante. With Pakistan at six, the remaining five had to be
Laura, Anand, Vip, **Dante**, Andres, so that is what is recorded. Change it if
that reading is wrong — the totals shift by Dante's 31.00.

Zero scores (Anand in 2024, Laura in 2025) are managers who contributed **no
players** to their side's lineup — not managers who scored zero with a full
team. They show as `none` and are dimmed rather than dropped, since they were
still on the side.

---

## Why the job runs Thursday afternoon

MFL posts stat corrections **Thursday morning**, and the league has treated the
post-correction numbers as the final tally for a week since the MFL era began.
The schedule is built around that convention rather than around convenience.

The cron is `23 19 * * 4` (UTC), which lands **13:23–14:23 Central** across the
whole season including the DST change — several hours clear of the morning
corrections, still Thursday, well before that night's kickoff.

This is deliberately *not* Thursday morning. Running while corrections are
landing could record a weekly winner that MFL then revises, and per the payouts
table weekly winners take the largest share — a revised winner is a money
question, not a cosmetic one. The afternoon slot also means the hour of DST
drift moves the run *away* from the correction window, never back into it.

A late correction — one landing after Thursday afternoon — is still picked up,
because every run refetches the whole season and overwrites. The site would
show the old figure for a week and then change silently. Rerun discrepancy
reconciliation was explicitly out of scope, so nothing announces that; if the
league ever wants a heads-up when a past week's winner changes, that is a small
addition to the ingest and worth asking for rather than assuming.

---

## What is automated, and what is not

**Automated, weekly (Thursday):** fetch the season, recompute weekly winners and
the 200+ club, rewrite `data/2026.json` and the generated block of
`weekly-log.js`, commit if anything changed. The site's two living leaderboards
update themselves from that, exactly as they do today.

**Still manual, once a year (January):** `npm run seal-season` prints the
champions row, the seasons row, and the recomputed baselines to paste into
`data.js`, plus a summary to eyeball. It deliberately does not rewrite `data.js`,
which mixes derived counts with hand-written prose.

**Still manual, by design:** records cards, tidbits, playoff/bowl appearance
counts. These need judgement about what is noteworthy, not arithmetic.

---

## Settled

- Franchise `0002` is Ryaan; Raj has left the league.
- The 2024/2025 score drift stays as recorded.
- The bye goes to the best record at the end of Week 14, matching the rules page
  and the shipped config.

## Open items

1. **Pending league decision, still defaulted to exclude:** do Week 18
   exhibition performances count toward the all-time 200+ club?
   `includeExhibitionInRecords` in [data/league.config.mjs](data/league.config.mjs).
   Both branches are tested; flipping it is a one-word change.
2. **The pipeline has never seen a live in-season week.** The 2026 season has not
   started — every week currently returns franchise stubs with no `score` key,
   which the client correctly treats as "not played" rather than zero. Verified
   against three replayed seasons instead. Trigger `workflow_dispatch` manually
   after Week 1 and check the diff before trusting the cron.
