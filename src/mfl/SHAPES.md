# MFL response shapes — observed, not guessed

Captured 2026-08-12 against league 19716. Re-verify if MFL changes anything;
everything downstream is built against these exact field names.

Host resolution: `api.myfantasyleague.com` 302-redirects to the season's real
host (`www44` for both 2025 and 2026). `fetch` follows it. Never hardcode www44.

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
