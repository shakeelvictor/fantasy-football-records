// Season superlatives, and which all-time record cards a season breaks.
//
// Each definition says how to compute the season's candidate and how to read
// the incumbent value off the existing card, so a card is only ever rewritten
// when the season genuinely beat it. Anything not listed here is left alone —
// silence is the safe default for a records book.
//
// Exhibition weeks are excluded throughout. Week 18 is a partial-lineup Pro
// Bowl where managers routinely post 0.00, which would otherwise "break" every
// lowest-score record every single year.

import { allPlayRecords, weeklyWinners } from './derive.mjs';

const round2 = (n) => Math.round(n * 100) / 100;
const num = (s) => parseFloat(String(s).replace(/[^0-9.\-]/g, ''));

/** Win pct off a value like "116-24 · .829". */
const pctOf = (s) => {
  const m = String(s).match(/\.(\d+)\s*$/);
  return m ? parseFloat(`0.${m[1]}`) : NaN;
};

const weeksIn = (season, allowed) => {
  const set = new Set(allowed);
  return season.weeks.filter((w) => set.has(w.week));
};

const flat = (season, allowed) =>
  weeksIn(season, allowed).flatMap((w) => w.scores.map((s) => ({ ...s, week: w.week })));

const maxBy = (rows, f) =>
  rows.length ? rows.reduce((a, b) => (f(b) > f(a) || (f(b) === f(a) && b.gm < a.gm) ? b : a)) : null;
const minBy = (rows, f) =>
  rows.length ? rows.reduce((a, b) => (f(b) < f(a) || (f(b) === f(a) && b.gm < a.gm) ? b : a)) : null;

/**
 * Every record this pipeline knows how to compute.
 *
 * `better` decides whether a bigger or smaller candidate wins. `read` pulls the
 * comparable number off the incumbent card. `compute` returns null when the
 * record doesn't apply to this season.
 */
export const DEFINITIONS = [
  {
    // Counted off the champions list *after* this season is appended, so the
    // new title is included.
    label: 'Most Fantasy Bowl Championships',
    better: 'higher',
    read: (card) => num(card.value),
    compute: ({ champions }) => {
      if (!champions?.length) return null;
      const counts = new Map();
      for (const c of champions) counts.set(c.champ, (counts.get(c.champ) ?? 0) + 1);
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
      const years = champions.filter((c) => c.champ === top[0]).map((c) => c.year);
      return { n: top[1], value: String(top[1]), holder: top[0], context: years.join(', ') };
    },
  },
  {
    label: 'Most Consecutive Playoff Apps',
    better: 'higher',
    read: (card) => num(card.value),
    compute: ({ seasonsList }) => {
      if (!seasonsList?.length) return null;
      const years = [...new Set(seasonsList.map((s) => s.year))].sort((a, b) => a - b);
      const made = new Map();
      for (const s of seasonsList) for (const gm of s.teams) made.set(gm, (made.get(gm) ?? new Set()).add(s.year));
      let best = null;
      for (const [gm, set] of made) {
        let run = 0, start = null, bestRun = 0, bestStart = null, bestEnd = null;
        for (const y of years) {
          if (set.has(y)) {
            run += 1;
            if (run === 1) start = y;
            if (run > bestRun) { bestRun = run; bestStart = start; bestEnd = y; }
          } else run = 0;
        }
        if (!best || bestRun > best.n || (bestRun === best.n && gm < best.holder)) {
          best = { n: bestRun, value: String(bestRun), holder: gm, context: `${bestStart} – ${bestEnd}` };
        }
      }
      return best;
    },
  },
  {
    label: 'Most Weekly Wins, Single Season',
    better: 'higher',
    read: (card) => num(card.value),
    compute: ({ season, config }) => {
      const counts = new Map();
      for (const w of weeklyWinners(season, config)) {
        counts.set(w.gm, (counts.get(w.gm) ?? 0) + 1);
      }
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
      return top ? { n: top[1], value: String(top[1]), holder: top[0], context: `${season.season}` } : null;
    },
  },
  {
    label: 'Best Record · Expanded Season',
    better: 'higher',
    read: (card) => pctOf(card.value),
    compute: ({ season, allPlay }) => {
      const best = allPlay.length
        ? allPlay.reduce((a, b) => (b.winPct > a.winPct || (b.winPct === a.winPct && b.pointsFor > a.pointsFor) ? b : a))
        : null;
      if (!best) return null;
      return {
        n: best.winPct,
        value: `${best.wins}-${best.losses} · ${best.winPct.toFixed(3).slice(1)}`,
        holder: best.gm,
        context: `${season.season}`,
      };
    },
  },
  {
    label: 'Worst Record · Expanded Season',
    better: 'lower',
    read: (card) => pctOf(card.value),
    compute: ({ season, allPlay }) => {
      const worst = allPlay.length
        ? allPlay.reduce((a, b) => (b.winPct < a.winPct || (b.winPct === a.winPct && b.pointsFor < a.pointsFor) ? b : a))
        : null;
      if (!worst) return null;
      return {
        n: worst.winPct,
        value: `${worst.wins}-${worst.losses} · ${worst.winPct.toFixed(3).slice(1)}`,
        holder: worst.gm,
        context: `${season.season}`,
      };
    },
  },
  {
    label: 'Highest Total Points · Reg. Season',
    better: 'higher',
    read: (card) => num(card.value),
    compute: ({ season, allPlay }) => {
      const top = allPlay.length ? allPlay.reduce((a, b) => (b.pointsFor > a.pointsFor ? b : a)) : null;
      return top
        ? { n: top.pointsFor, value: top.pointsFor.toFixed(2), holder: top.gm, context: `${season.season}` }
        : null;
    },
  },
  {
    label: 'Highest Total Points · Season',
    better: 'higher',
    read: (card) => num(card.value),
    compute: ({ season, config, playoff }) => {
      // Only weeks a team actually contested. This is all-play, so an
      // eliminated roster and a team that missed the playoffs entirely both
      // still post a score every week — counting those would hand three free
      // weeks of points to teams whose season was already over.
      const contested = contestedWeeks(playoff, config);
      const totals = new Map();
      for (const s of flat(season, config.regularSeasonWeeks)) {
        totals.set(s.gm, round2((totals.get(s.gm) ?? 0) + s.score));
      }
      for (const s of flat(season, config.playoffWeeks)) {
        if (!contested.get(s.gm)?.has(s.week)) continue;
        totals.set(s.gm, round2((totals.get(s.gm) ?? 0) + s.score));
      }
      const top = [...totals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
      return top
        ? { n: top[1], value: top[1].toFixed(2), holder: top[0], context: `${season.season} (incl. playoffs)` }
        : null;
    },
  },
  {
    label: 'Highest Points to Start a Season',
    better: 'higher',
    read: (card) => num(card.value),
    compute: ({ season, config }) => {
      const wk1 = config.regularSeasonWeeks[0];
      const top = maxBy(flat(season, [wk1]), (s) => s.score);
      return top ? { n: top.score, value: top.score.toFixed(2), holder: top.gm, context: `${season.season}` } : null;
    },
  },
  {
    label: 'Highest Single Week · Reg. Season',
    better: 'higher',
    read: (card) => num(card.value),
    compute: ({ season, config }) => {
      const top = maxBy(flat(season, config.regularSeasonWeeks), (s) => s.score);
      return top
        ? { n: top.score, value: top.score.toFixed(2), holder: top.gm, context: `${season.season} · Week ${top.week}` }
        : null;
    },
  },
  {
    label: 'Lowest Single-Game Total',
    better: 'lower',
    read: (card) => num(card.value),
    compute: ({ season, config }) => {
      const low = minBy(flat(season, config.regularSeasonWeeks), (s) => s.score);
      return low
        ? { n: low.score, value: low.score.toFixed(2), holder: low.gm, context: `${season.season} · Week ${low.week}` }
        : null;
    },
  },
  {
    label: 'Lowest Points to Win a Week',
    better: 'lower',
    read: (card) => num(card.value),
    compute: ({ season, config }) => {
      const wins = weeklyWinners(season, config);
      if (!wins.length) return null;
      const low = wins.reduce((a, b) => (b.score < a.score ? b : a));
      return { n: low.score, value: low.score.toFixed(2), holder: low.gm, context: `${season.season} · Week ${low.week}` };
    },
  },
  {
    label: 'Highest Playoff Points',
    better: 'higher',
    read: (card) => num(card.value),
    compute: ({ season, config, playoff }) => {
      const alive = new Set(playoff?.field?.map((f) => f.gm) ?? []);
      // Only teams still playing — an eliminated roster still posts a score.
      const rows = flat(season, config.playoffWeeks).filter((s) => alive.has(s.gm));
      const top = maxBy(rows, (s) => s.score);
      if (!top) return null;
      const where = top.week === config.fantasyBowlWeek ? 'Fantasy Bowl' : `Week ${top.week}`;
      return { n: top.score, value: top.score.toFixed(2), holder: top.gm, context: `${season.season} · ${where}` };
    },
  },
  {
    label: 'Widest Fantasy Bowl Margin',
    better: 'higher',
    read: (card) => num(card.value),
    compute: ({ season, playoff }) => {
      if (!playoff?.complete) return null;
      const margin = round2(playoff.champion.score - playoff.runnerUp.score);
      return {
        n: margin,
        value: margin.toFixed(2),
        holder: playoff.champion.gm,
        context: `Beat ${playoff.runnerUp.gm} · ${season.season}`,
      };
    },
  },
  {
    label: 'Slimmest Margin of Victory',
    better: 'lower',
    read: (card) => num(card.value),
    // REPORT ONLY — never rewrites the card. What counts as "a victory" in an
    // all-play league is genuinely ambiguous, and the obvious reading is
    // provably not the league's: counting every adjacent pair in a week gives
    // 0.01 in both 2023 and 2024, which would have beaten the standing 0.25
    // (Andres over Dante, 2019) twice before 2025. Since the record still
    // stands at 0.25, the league means something narrower. Until someone says
    // what, this surfaces the number and leaves the card alone.
    reportOnly: true,
    compute: ({ season, config }) => {
      // All-play, so "a victory" is any adjacent pair in a week's ranking.
      let best = null;
      for (const w of weeksIn(season, config.regularSeasonWeeks)) {
        const ranked = [...w.scores].sort((a, b) => b.score - a.score);
        for (let i = 0; i + 1 < ranked.length; i++) {
          const gap = round2(ranked[i].score - ranked[i + 1].score);
          if (!best || gap < best.n) {
            best = { n: gap, over: ranked[i + 1], winner: ranked[i], week: w.week };
          }
        }
      }
      if (!best) return null;
      return {
        n: best.n,
        value: best.n.toFixed(2),
        holder: `${best.winner.gm} over ${best.over.gm}`,
        context: `${season.season} · Wk ${best.week} · ${best.winner.score.toFixed(2)} – ${best.over.score.toFixed(2)}`,
      };
    },
  },
  {
    label: 'Highest Single-Player · Reg. Season',
    better: 'higher',
    read: (card) => num(card.value),
    needsPlayerName: true,
    compute: ({ season, config }) => topPlayerIn(season, config.regularSeasonWeeks, season.season, null),
  },
  {
    label: 'Highest Single-Player · Playoffs',
    better: 'higher',
    read: (card) => num(card.value),
    needsPlayerName: true,
    compute: ({ season, config }) => topPlayerIn(season, config.playoffWeeks, season.season, config.fantasyBowlWeek),
  },
];

/**
 * Which playoff weeks each GM actually contested.
 *
 * Derived from the fold rather than assumed: the bye seed does not play week
 * 15, eliminated teams stop, and only the two finalists play the Fantasy Bowl.
 * Everyone else still has a score on record, because the league is all-play.
 */
export function contestedWeeks(playoff, config) {
  const out = new Map();
  const add = (gm, week) => {
    if (!out.has(gm)) out.set(gm, new Set());
    out.get(gm).add(week);
  };
  for (const round of playoff?.rounds ?? []) {
    for (const r of round.ranked) add(r.gm, round.week);
  }
  if (playoff?.complete) {
    add(playoff.champion.gm, config.fantasyBowlWeek);
    add(playoff.runnerUp.gm, config.fantasyBowlWeek);
  }
  return out;
}

function topPlayerIn(season, weeks, year, bowlWeek) {
  const rows = weeksIn(season, weeks).flatMap((w) =>
    w.scores.filter((s) => s.topPlayer).map((s) => ({ gm: s.gm, week: w.week, ...s.topPlayer }))
  );
  if (!rows.length) return null;
  const top = rows.reduce((a, b) => (b.score > a.score ? b : a));
  const where = bowlWeek && top.week === bowlWeek ? 'Fantasy Bowl' : `Week ${top.week}`;
  return {
    n: top.score,
    value: top.score.toFixed(2),
    // holder is the player; the card's context carries the manager.
    holder: null,
    playerId: top.id,
    context: `${top.gm} · ${year} · ${where}`,
  };
}

/**
 * Compare a season against the current cards.
 *
 * Returns { broken, unchanged, unknown } where `broken` carries the rewritten
 * card with the old value demoted to the "Previous:" line, matching how the
 * cards already read.
 */
export function compareToRecords(cards, ctx, playerNames = new Map()) {
  const byLabel = new Map(cards.map((c) => [c.label, c]));
  const broken = [];
  const unchanged = [];
  const review = [];
  const unknown = cards.filter((c) => !DEFINITIONS.some((d) => d.label === c.label)).map((c) => c.label);

  for (const def of DEFINITIONS) {
    const card = byLabel.get(def.label);
    if (!card) continue;

    const cand = def.compute(ctx);
    if (!cand) continue;

    const incumbent = def.read(card);
    const beats = def.better === 'higher' ? cand.n > incumbent : cand.n < incumbent;

    // Report-only records surface their number but never rewrite the card.
    if (def.reportOnly) {
      if (beats) {
        review.push({ label: def.label, candidate: cand.value, incumbent: card.value, holder: cand.holder, context: cand.context });
      } else {
        unchanged.push({ label: def.label, candidate: cand.value, incumbent: card.value });
      }
      continue;
    }

    if (!Number.isFinite(incumbent) || !beats) {
      unchanged.push({ label: def.label, candidate: cand.value, incumbent: card.value });
      continue;
    }

    const holder = def.needsPlayerName ? playerNames.get(cand.playerId) : cand.holder;
    if (def.needsPlayerName && !holder) continue; // no name resolved: leave the card alone

    broken.push({
      label: def.label,
      was: { value: card.value, holder: card.holder, context: card.context },
      card: {
        ...card,
        value: cand.value,
        holder,
        context: cand.context,
        prev: `Previous: ${card.holder} · ${card.value} (${card.context})`,
      },
    });
  }

  return { broken, unchanged, review, unknown };
}

/** Player ids that could hold a record, so names are fetched only when needed. */
export function playerIdsToResolve(ctx) {
  return DEFINITIONS.filter((d) => d.needsPlayerName)
    .map((d) => d.compute(ctx)?.playerId)
    .filter(Boolean);
}

/**
 * Context the definitions run against.
 *
 * `champions` and `seasonsList` should already include this season, since two
 * records are counted off those lists rather than off the week-by-week scores.
 */
export function buildContext(season, config, playoff, { champions, seasonsList } = {}) {
  return { season, config, playoff, allPlay: allPlayRecords(season, config), champions, seasonsList };
}
