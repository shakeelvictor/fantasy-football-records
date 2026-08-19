# MFL response shapes — observed, not guessed

Captured 2026-08-12 against league 19716. Re-verify if MFL changes anything;
everything downstream is built against these exact field names.

Host resolution: `api.myfantasyleague.com` 302-redirects to the season's real
host (`www44` for both 2025 and 2026). `fetch` follows it. Never hardcode www44.

**Past seasons are fetchable.** Putting an older year in the path works and
returns full player-level data — 2015 through 2025 all serve complete rosters
with per-player scores. Nothing before 2015 exists; that is where the MFL era
starts. Fetching an old season is still a deliberate, dev-only act
(`npm run fixtures`, `npm run lineups --all`), never something the weekly job
does.

**2015 lives in a different league: `L=53720`, not `19716`.** Asking 19716 for
2015 returns a misleading stub — 3 played weeks and 8 franchises — rather than
an error, which is exactly the shape of thing that reads as "no data for that
year" when the real answer is "wrong league". `config.archive.leagueIds` maps
the exception. Franchise ids happen to mean the same GMs in both leagues, which
was verified, not assumed: replaying 2015 through `derive.mjs` reproduces the
recorded playoff field Dante > Hoss > Samson > Asher > Imran > Raj exactly,
including a three-way 53-64 tie broken by points for.

All values are **strings**, including every number. Coerce at the boundary.

## TYPE=league

```jsonc
{ "league": {
    "name": "INDOMEXPAK 2026",
    "franchises": {
      "count": "11",
      "franchise": [ { "id": "0001", "name": "Smells Like GOAT", "icon": "..." }, ... ]
    }
} }
```

`owner_name` is **absent/empty for every franchise in this league**. There is no
machine-readable link from a franchise to a GM name. See `data/franchises.json`.

Franchise `id` is stable across seasons; `name` is not. `0001` was "Uncle Rico"
in 2025 and "Smells Like GOAT" in 2026. Key everything on `id`.

## TYPE=weeklyResults&W=YTD

```jsonc
{ "allWeeklyResults": { "weeklyResults": [ { "week": "1", "franchise": [...] }, ... ] } }
```

Single week (`W=1`) instead returns `{ "weeklyResults": { "week": "1", "franchise": [...] } }`
— note the unwrapped object. The client normalizes both to an array.

Franchise entry, once games have been played:

```jsonc
{ "id": "0001", "score": "119.19", "opt_pts": "154.32",
  "starters": "16581,16164,...", "nonstarters": "...", "optimal": "...",
  "player": [ { "id": "16581", "status": "starter", "shouldStart": "1", "score": "24.39" } ] }
```

`player` carries **every rostered player**, bench included, each with the score
he posted that week — this is where the lineup archive gets the bench from. The
array is usually 20 long but can be 18 or 19, and a rostered player who did not
play carries **no `score` key at all**. That is a zero, not missing data.

### `opt_pts`, `optimal` and `shouldStart` are WRONG for this league

MFL computes them against its own roster settings, which do not encode the
league's house rules. Its "optimal" lineups routinely start **9 combined
QB/RB/WR/TE against a cap of 8**, and **2 IDP against a minimum of 3**. In the
2025 regular season, 81 of 154 franchise-weeks (53%) came back with an optimal
lineup nobody would have been allowed to submit; every lineup actually
submitted that season was legal. Ranking managers by `opt_pts` reorders the
efficiency table against the rules-legal answer.

`src/lineups.mjs` recomputes the optimum from the `player` array instead.
`shouldStart` is derived from the same bad optimizer and is equally unusable.

**There is no `matchup` key and no `result` field.** This league is *all-play*:
every team is scored against every other team each week, so there are no
pairings to report. A 2026 week is 11 teams × 10 opponents = 10 games each.
This is why the site's season records look like `116-24` rather than `12-2`.

**Unplayed weeks still appear**, with `{"id": "..."}` and no `score` key at all.
As of 2026-08-12 every 2026 week is in this state. Treat "no `score` key" as
"not yet played" and skip the week — do not read it as 0.

## TYPE=leagueStandings — NOT fetched

Documented because the reason not to call it is worth keeping, not because the
code calls it. The ingest makes two requests: `league` and `weeklyResults`.

```jsonc
{ "leagueStandings": { "franchise": [
    { "id": "0001", "fname": "Smells Like GOAT",
      "h2hw": "0", "h2hl": "0", "h2ht": "0", "h2hwlt": "0-0-0", "h2hpct": ".000",
      "pf": "0", "pa": "0", "avgpf": ".0", "avgpa": ".0", "bbidbalance": "$100.00" } ] } }
```

`fname` is HTML-escaped (`I&apos;m Just Here to Network`). Unescape before display.

**These totals include the playoffs and cannot be used for the site's records.**
2025 final standings show `3rd and 1` at `128-39-0` / `.766`, while the site
records that GM's 2025 regular season as `116-24` / `.829`. Both are correct for
what they measure. Anything the site calls a regular-season record must be
recomputed from `weeklyResults` restricted to `regularSeasonWeeks` — which is
what `allPlayRecords()` does, so this endpoint has nothing left to contribute.

Response array order is a display setting. Derive seeding in code.

## TYPE=transactions&TRANS_TYPE=BBID_WAIVER

```jsonc
{ "transactions": { "transaction": [
    { "type": "BBID_WAIVER", "timestamp": "1767164400", "franchise": "0011",
      "transaction": "15846,|1.00|13116," } ] } }
```

`transaction` is `addedId,|amount|droppedId,` — the dropped side is empty when
nothing was dropped. **Only winning bids appear.** A losing blind bid never
enters the transaction log, so this can source "biggest winning bid" and never
"biggest bid".

Blind bidding started in 2025; earlier seasons return an empty list rather than
an error. 2025 held 27 winning bids totalling $321.05 against $1,100 of budget.

`TRANS_TYPE=WAIVER` returns the same rows for this league. `TRANS_TYPE=TRADE`
returned **zero** rows for 2025 — the league genuinely made no in-season trades
that year.

## TYPE=draftResults

```jsonc
{ "draftResults": { "draftUnit": [ { "draftPick": [
    { "round": "01", "pick": "01", "franchise": "0010", "player": "16162",
      "timestamp": "1785815420", "comments": "[Pick imported from external source.] " } ] } ] } }
```

**Coverage is uneven and that is the whole story here.** 2026 carries all 220
picks with player ids (the draft was run elsewhere and imported). 2025 carries
220 pick slots but only **13** have a player — that draft lives in
`Fantasy_Draft_draft_*.xlsx`, not MFL. 2023 and 2024 return **no picks at all**.

So anything keyed to draft position — a draft-value record, say — can be built
from 2026 forward and cannot be backfilled from MFL.

Round order repeats identically every round, which is the straight draft the
rules describe.
