// MFL client. The weekly ingest makes three calls; the lineup archive adds a
// few more of its own, on its own schedule. No retry loop.
// MFL asks clients to cache aggressively and back off rather than retry;
// a weekly job is well inside their limits, so failure here just fails the run.
// See SHAPES.md for the observed response shapes this is built against.

const BASE = 'https://api.myfantasyleague.com';

/** Always an array, even when MFL returns a bare object for a single item. */
function toArray(x) {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

async function call(season, type, params = {}) {
  const url = new URL(`${BASE}/${season}/export`);
  url.searchParams.set('TYPE', type);
  url.searchParams.set('JSON', '1');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  // api.myfantasyleague.com 302s to the season's real host. Follow it rather
  // than hardcoding www44 — MFL reassigns leagues across hosts between seasons.
  const key = process.env.MFL_API_KEY;
  if (key) url.searchParams.set('APIKEY', key);

  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'fflr-records/1.0 (league 19716 weekly update)' },
  });

  if (res.status === 429) {
    throw new Error('MFL returned 429. Not retrying — rerun the job later.');
  }
  if (!res.ok) {
    throw new Error(`MFL ${type} failed: HTTP ${res.status} ${res.statusText}`);
  }

  const body = await res.json();
  if (body.error) throw new Error(`MFL ${type} error: ${JSON.stringify(body.error)}`);
  return body;
}

/** Franchise ids and team names. Structure only — this league has no owner_name. */
export async function fetchFranchises(season, leagueId) {
  const body = await call(season, 'league', { L: leagueId });
  const list = toArray(body?.league?.franchises?.franchise);
  if (list.length === 0) throw new Error('MFL league returned no franchises.');
  return list.map((f) => ({ id: f.id, name: unescapeHtml(f.name ?? '') }));
}

/**
 * Whole season in one call. Returns weeks that have actually been played.
 *
 * An unplayed week still comes back, as franchise entries with no `score` key.
 * Those are dropped here — a missing score means "not played yet", never 0.
 */
export async function fetchWeeklyResults(season, leagueId) {
  const body = await call(season, 'weeklyResults', { L: leagueId, W: 'YTD' });

  // W=YTD nests under allWeeklyResults; a single week does not. Handle both.
  const weeks = toArray(body?.allWeeklyResults?.weeklyResults ?? body?.weeklyResults);

  return weeks
    .map((w) => ({
      week: Number(w.week),
      scores: toArray(w.franchise)
        .filter((f) => f.score != null && f.score !== '')
        .map((f) => ({
          id: f.id,
          score: Number(f.score),
          // Comma-separated player ids, with a trailing comma. The count
          // matters for the Week 18 exhibition, where each side fields one
          // combined lineup and managers contribute uneven numbers of players.
          starters: String(f.starters ?? '').split(',').filter(Boolean).length,
          // Best STARTED player this week. Benched points don't count toward
          // the single-player records. Kept as one row per franchise per week
          // rather than every player, which would bloat the season file for
          // no gain — the records only ever ask for a maximum.
          topPlayer: bestStarter(f),
        })),
    }))
    .filter((w) => Number.isFinite(w.week) && w.scores.length > 0)
    .sort((a, b) => a.week - b.week);
}

function bestStarter(franchise) {
  const started = toArray(franchise.player).filter((p) => p.status === 'starter');
  if (started.length === 0) return null;
  const best = started.reduce((a, b) => (Number(b.score) > Number(a.score) ? b : a));
  return { id: best.id, score: Number(best.score) };
}

/**
 * Resolve player ids to display names. Filtered by id, so this stays a small
 * request — only ever called for the handful of ids that hold a record.
 * MFL returns "Last, First"; the site writes names the human way round.
 */
export async function fetchPlayerNames(season, leagueId, ids) {
  const wanted = [...new Set(ids)].filter(Boolean);
  if (wanted.length === 0) return new Map();

  const body = await call(season, 'players', { L: leagueId, PLAYERS: wanted.join(',') });
  const out = new Map();
  for (const p of toArray(body?.players?.player)) {
    const [last, first] = String(p.name ?? '').split(',').map((s) => s.trim());
    out.set(p.id, first ? `${first} ${last}` : last);
  }
  return out;
}

/**
 * Whole-season lineups: every rostered player, week by week, with the score he
 * posted and whether he was started.
 *
 * This is the same `weeklyResults` response `fetchWeeklyResults` already reads
 * — it simply keeps the player rows instead of reducing them to a score. Used
 * by the lineup archive, which needs the bench to know what was left on it.
 *
 * `opt_pts` is deliberately NOT returned. MFL's optimizer does not know this
 * league's lineup rules and gets the optimum wrong in about half of all weeks.
 * See src/lineups.mjs.
 */
export async function fetchWeeklyLineups(season, leagueId) {
  const body = await call(season, 'weeklyResults', { L: leagueId, W: 'YTD' });
  const weeks = toArray(body?.allWeeklyResults?.weeklyResults ?? body?.weeklyResults);

  return weeks
    .map((w) => ({
      week: Number(w.week),
      franchises: toArray(w.franchise)
        .filter((f) => f.score != null && f.score !== '')
        .map((f) => ({
          id: f.id,
          score: Number(f.score),
          started: String(f.starters ?? '').split(',').filter(Boolean),
          // A rostered player MFL reports with no score did not play. That is
          // a zero, not missing data — the lineup rules are explicit that a
          // player on bye scores nothing and that is the manager's problem.
          players: toArray(f.player).map((p) => ({
            id: p.id,
            score: Number(p.score) || 0,
            started: p.status === 'starter',
          })),
        })),
    }))
    .filter((w) => Number.isFinite(w.week) && w.franchises.length > 0)
    .sort((a, b) => a.week - b.week);
}

/**
 * Player id -> { name, position }. Chunked, because the lineup archive asks
 * about every player rostered all season rather than the handful that hold a
 * record.
 */
export async function fetchPlayerInfo(season, leagueId, ids) {
  const wanted = [...new Set(ids)].filter(Boolean);
  const out = new Map();

  for (let i = 0; i < wanted.length; i += 250) {
    const body = await call(season, 'players', {
      L: leagueId,
      PLAYERS: wanted.slice(i, i + 250).join(','),
    });
    for (const p of toArray(body?.players?.player)) {
      const [last, first] = String(p.name ?? '').split(',').map((s) => s.trim());
      out.set(p.id, { name: first ? `${first} ${last}` : last, position: p.position });
    }
  }
  return out;
}

/**
 * Winning blind bids for a season, newest first.
 *
 * MFL exposes only the bids that WON — a losing bid never enters the
 * transaction log — so this is "biggest winning bid", never "biggest bid".
 * The transaction field reads `addedId,|amount|droppedId,`.
 *
 * Blind bidding started in 2025; earlier seasons return nothing, which is
 * correct rather than an error.
 */
export async function fetchWinningBids(season, leagueId) {
  const body = await call(season, 'transactions', { L: leagueId, TRANS_TYPE: 'BBID_WAIVER' });

  return toArray(body?.transactions?.transaction)
    .map((t) => {
      const [added, amount] = String(t.transaction ?? '').split('|');
      return {
        franchise: t.franchise,
        player: String(added ?? '').replace(/,$/, ''),
        amount: Number(amount),
        timestamp: Number(t.timestamp),
      };
    })
    .filter((b) => b.player && Number.isFinite(b.amount))
    .sort((a, b) => b.amount - a.amount || a.timestamp - b.timestamp);
}

// TYPE=leagueStandings is deliberately not fetched. Its totals include the
// playoffs, so they cannot source any record the site shows, and everything
// the site does need is derived from weeklyResults. See SHAPES.md.

function unescapeHtml(s) {
  return s
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}
