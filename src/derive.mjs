// Pure derivation. No I/O, no clock, no network — this is the testable core.
//
// Input `season` is the normalized shape written to data/<year>.json:
//   { season: 2026, weeks: [ { week: 1, scores: [ { gm: 'Shak', score: 119.19 } ] } ] }

/** Sorts must be total: no undefined ordering for equal values, ever. */
const byScoreThenName = (a, b) => b.score - a.score || a.gm.localeCompare(b.gm);

function weeksIn(season, allowed) {
  const set = new Set(allowed);
  return season.weeks.filter((w) => set.has(w.week));
}

/**
 * Highest score in each regular-season week.
 * Playoff weeks feed the bracket; exhibition weeks feed nothing.
 */
export function weeklyWinners(season, config) {
  return weeksIn(season, config.regularSeasonWeeks)
    .map((w) => {
      const ranked = [...w.scores].sort(byScoreThenName);
      return { week: w.week, gm: ranked[0].gm, score: ranked[0].score };
    })
    .sort((a, b) => a.week - b.week);
}

/**
 * Every 200+ performance. Includes playoff weeks; includes exhibition weeks
 * only when the league decides they count (config.includeExhibitionInRecords).
 */
export function bigGames(season, config) {
  const allowed = [
    ...config.regularSeasonWeeks,
    ...config.playoffWeeks,
    ...(config.includeExhibitionInRecords ? config.exhibitionWeeks : []),
  ];
  return weeksIn(season, allowed)
    .flatMap((w) =>
      w.scores
        .filter((s) => s.score >= config.bigGameThreshold)
        .map((s) => ({ week: w.week, gm: s.gm, score: s.score }))
    )
    .sort((a, b) => a.week - b.week || byScoreThenName(a, b));
}

/**
 * All-play regular-season records. Each week every team is scored against every
 * other team, so a team's weekly record is (teamCount - 1) games. This is why
 * the site's season records read like 116-24 rather than 12-2.
 *
 * Computed from weekly scores, never read off leagueStandings — those totals
 * include the playoffs.
 */
export function allPlayRecords(season, config) {
  const table = new Map();
  const row = (gm) => {
    if (!table.has(gm)) table.set(gm, { gm, wins: 0, losses: 0, ties: 0, pointsFor: 0 });
    return table.get(gm);
  };

  for (const w of weeksIn(season, config.regularSeasonWeeks)) {
    for (const a of w.scores) {
      const r = row(a.gm);
      r.pointsFor += a.score;
      for (const b of w.scores) {
        if (a.gm === b.gm) continue;
        if (a.score > b.score) r.wins += 1;
        else if (a.score < b.score) r.losses += 1;
        else r.ties += 1;
      }
    }
  }

  return [...table.values()].map((r) => {
    const games = r.wins + r.losses + r.ties;
    return {
      ...r,
      pointsFor: round2(r.pointsFor),
      games,
      // Ties count as half a win, matching MFL's h2hpct.
      winPct: games === 0 ? 0 : (r.wins + r.ties / 2) / games,
    };
  });
}

/**
 * Seeding: win pct, then points for, then name to keep the sort total.
 *
 * Derived here rather than read off MFL's response ordering, which is a display
 * setting someone could change years from now with no idea it mattered.
 *
 * The regular-season winner is the best record at the end of Week 14 and takes
 * the first-round bye. Seeding by total points instead is a tempting misreading
 * and is wrong: it would have put Hoss in the 2023 playoff field over Shak, and
 * Dante in the 2025 field over Shak. Locked by a test.
 */
export function seeds(season, config) {
  return allPlayRecords(season, config)
    .sort((a, b) => b.winPct - a.winPct || b.pointsFor - a.pointsFor || a.gm.localeCompare(b.gm))
    .map((r, i) => ({ seed: i + 1, gm: r.gm, winPct: r.winPct, pointsFor: r.pointsFor }));
}

/**
 * The postseason is a scoring fold, not a bracket — there is no pairing graph
 * for a five-team round, which is why MFL's playoff module can't represent it.
 *
 *   Week 15: seeds 2-6 play. Sort by score. Drop bottom 2. -> 3 survive.
 *   Week 16: 3 survivors + seed 1 back from bye. Sort. Drop bottom 2. -> 2 remain.
 *   Week 17: Fantasy Bowl. Higher score wins.
 *
 * The single bye is load-bearing arithmetic: 5 -> 3 -> (4) -> 2. Two byes would
 * break the fold, so the invariant is asserted rather than trusted to config.
 */
export function playoffResult(season, config) {
  // The single bye is load-bearing. A second one still happens to reduce to 2
  // (4 -> 2, +2 -> 4 -> 2), so the count check at the Fantasy Bowl would not
  // catch it — it would just quietly hand two GMs a week off. Guard it here.
  if (config.byeSeeds.length !== 1) {
    throw new Error(
      `The playoff fold assumes exactly one bye, got ${config.byeSeeds.length}. ` +
        'Changing this changes the format, not just a constant.'
    );
  }

  const field = seeds(season, config).slice(0, config.playoffTeams);
  const seedOf = new Map(field.map((f) => [f.gm, f.seed]));
  const bye = new Set(config.byeSeeds);

  const scoreFor = (week, gm) => {
    const w = season.weeks.find((x) => x.week === week);
    return w?.scores.find((s) => s.gm === gm)?.score;
  };

  let alive = field.filter((f) => !bye.has(f.seed)).map((f) => f.gm);
  const rounds = [];

  for (const week of config.playoffWeeks) {
    if (week === config.fantasyBowlWeek) break;

    // Bye seeds rejoin the week after their bye.
    if (week > config.playoffWeeks[0]) {
      for (const f of field) if (bye.has(f.seed) && !alive.includes(f.gm)) alive.push(f.gm);
    }

    const drop = config.eliminatedPerWeek[week] ?? 0;
    const scored = alive.map((gm) => ({ gm, score: scoreFor(week, gm) }));
    if (scored.some((s) => s.score == null)) return { field, rounds, complete: false };

    // Ties resolve to the higher seed (lower seed number). Never observed —
    // decimal scoring makes it vanishingly unlikely — but the sort must be
    // total, so the outcome is defined rather than left to array order.
    const ranked = [...scored].sort((a, b) => b.score - a.score || seedOf.get(a.gm) - seedOf.get(b.gm));
    const survivors = ranked.slice(0, ranked.length - drop);
    const eliminated = ranked.slice(ranked.length - drop);

    rounds.push({ week, ranked, eliminated: eliminated.map((e) => e.gm) });
    alive = survivors.map((s) => s.gm);
  }

  if (alive.length !== 2) {
    throw new Error(
      `Playoff fold did not reduce to 2 for the Fantasy Bowl: got ${alive.length} ` +
        `(${alive.join(', ')}). Check playoffTeams, byeSeeds and eliminatedPerWeek.`
    );
  }

  const bowl = alive
    .map((gm) => ({ gm, score: scoreFor(config.fantasyBowlWeek, gm) }))
    .sort((a, b) => b.score - a.score || seedOf.get(a.gm) - seedOf.get(b.gm));

  if (bowl.some((b) => b.score == null)) return { field, rounds, complete: false };

  return {
    field,
    rounds,
    complete: true,
    champion: { gm: bowl[0].gm, seed: seedOf.get(bowl[0].gm), score: bowl[0].score },
    runnerUp: { gm: bowl[1].gm, seed: seedOf.get(bowl[1].gm), score: bowl[1].score },
  };
}

/**
 * Pakistan vs. the World — the Week 18 exhibition. The league's Pro Bowl.
 *
 * Each side fields ONE combined super lineup built from its managers' best
 * players, and both lineups are the same size — 12 a side in 2024 and 2025.
 * Managers contribute uneven numbers of players to it (Dante supplied 6 of
 * Pakistan's 12 in 2024; Anand supplied none), and the number of managers per
 * side is not the same either. None of that is an imbalance: the lineups are
 * equal, so the comparison is like for like.
 *
 * That is why `players` is the figure worth showing, not manager count.
 *
 * `roster` is { pakistan: [gm], world: [gm] } for this season.
 */
export function exhibitionResult(season, roster, config) {
  const week = season.weeks.find((w) => config.exhibitionWeeks.includes(w.week));
  if (!week) return null;

  const played = new Set(week.scores.map((s) => s.gm));
  const named = [...roster.pakistan, ...roster.world];

  const dupes = named.filter((gm, i) => named.indexOf(gm) !== i);
  if (dupes.length) {
    throw new Error(`Exhibition roster lists ${[...new Set(dupes)].join(', ')} more than once.`);
  }

  const unplaced = [...played].filter((gm) => !named.includes(gm)).sort();
  if (unplaced.length) {
    throw new Error(
      `Exhibition roster is missing ${unplaced.join(', ')} — every GM who played ` +
        'week ' + week.week + ' must be on exactly one side.'
    );
  }

  const side = (gms) => {
    const members = gms
      .map((gm) => {
        const row = week.scores.find((s) => s.gm === gm);
        return { gm, score: row?.score, players: row?.starters ?? 0 };
      })
      .filter((m) => m.score != null)
      .sort(byScoreThenName);
    return {
      total: round2(members.reduce((sum, m) => sum + m.score, 0)),
      players: members.reduce((sum, m) => sum + m.players, 0),
      members,
    };
  };

  const pakistan = side(roster.pakistan);
  const world = side(roster.world);

  // The whole point of the format is that both sides field the same lineup.
  // If that ever stops being true the comparison is no longer like for like,
  // and it should be looked at rather than quietly published.
  if (pakistan.players !== world.players) {
    throw new Error(
      `Uneven exhibition lineups in ${season.season}: Pakistan started ` +
        `${pakistan.players}, the World started ${world.players}. Both sides ` +
        'field one combined lineup of equal size — check the week 18 rosters.'
    );
  }

  return {
    year: season.season,
    week: week.week,
    pakistan,
    world,
    // Decimal scoring makes an exact tie effectively impossible, but the result
    // must still be defined for every input.
    winner: pakistan.total === world.total ? null : pakistan.total > world.total ? 'Pakistan' : 'World',
    margin: round2(Math.abs(pakistan.total - world.total)),
  };
}

/**
 * Adds a season's weekly winners and 200+ games onto the frozen baseline counts
 * from data.js. This is the same tally the browser does; doing it here lets the
 * ingest write a log the site renders without any change to app.js.
 */
export function tallyOnto(baseline, names) {
  const totals = new Map(baseline.map((r) => [r.gm, { ...r }]));
  for (const gm of names) {
    const row = totals.get(gm);
    if (row) row.count += 1;
    else totals.set(gm, { gm, count: 1 });
  }
  return [...totals.values()].sort((a, b) => b.count - a.count || a.gm.localeCompare(b.gm));
}

const round2 = (n) => Math.round(n * 100) / 100;
