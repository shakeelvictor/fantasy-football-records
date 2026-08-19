// Lineup efficiency: what a manager actually started, against the best lineup
// the roster could legally have fielded that week.
//
// **This deliberately does not use MFL's `opt_pts`.** MFL's optimizer does not
// know the league's house rules. It freely returns "optimal" lineups with 9
// combined QB/RB/WR/TE against a cap of 8, and with 2 IDP against a minimum of
// 3. Across the 2025 regular season, 81 of 154 franchise-weeks (53%) came back
// with an optimal lineup this league would not have let anyone submit, and
// ranking managers by it reorders the table against the rules-legal answer.
// Every lineup actually submitted in 2025 was legal, so it is MFL's optimizer
// that is wrong here, not the league. The optimum is recomputed below.
//
// Pure. No I/O, no clock, no network — same contract as derive.mjs.

const OFFENSE = new Set(['QB', 'RB', 'WR', 'TE']);
const IDP = new Set(['DT', 'DE', 'LB', 'CB', 'S']);

/** MFL position -> the slot family the lineup rules talk about. */
export function slotOf(position) {
  if (OFFENSE.has(position)) return position;
  if (IDP.has(position)) return 'IDP';
  return position; // PK, and anything MFL adds later
}

/**
 * Every starting-lineup composition the rules allow, as {slot: count}.
 *
 * The current rules (rules-data.js): 12 starters — QB 1, RB 2, WR 3 (a TE may
 * fill one), TE 1, PK 1, IDP 3 — plus one flex that takes any position except
 * quarterback. "Up to three tight ends across the WR, TE and flex spots" caps
 * TE at 3 and therefore floors WR at 2. The flex is what lets RB reach 3, WR
 * reach 4, IDP reach 4, or a second kicker start. And no more than 8 combined
 * QB/RB/WR/TE may start, which is the binding constraint on all of it.
 *
 * Neither the kicker nor the flex has always existed, so both are options:
 *
 *   2015    kicker, no flex  — 11 starters, one fixed shape and nothing else
 *   2016    flex, no kicker  — 11 starters; the league voted the kicker out
 *   2017-   kicker and flex  — 12 starters, the rules as written today
 *
 * With no flex there is exactly one legal lineup and no choice to make about
 * its shape — only about who fills it.
 */
export function legalShapes({ kicker = true, flex = true } = {}) {
  const PK = kicker ? 1 : 0;
  if (!flex) return [{ QB: 1, RB: 2, WR: 3, TE: 1, PK, IDP: 3 }];

  const out = [];
  const size = 11 + PK;
  for (const pk of kicker ? [1, 2] : [0]) {
    for (const RB of [2, 3]) {
      for (const WR of [2, 3, 4]) {
        for (const TE of [1, 2, 3]) {
          for (const idp of [3, 4]) {
            const QB = 1;
            if (QB + pk + RB + WR + TE + idp !== size) continue;
            if (WR + TE < 4) continue; // the 3 WR slots and the TE slot must be filled
            if (QB + RB + WR + TE > 8) continue; // the 8-offense cap
            out.push({ QB, RB, WR, TE, PK: pk, IDP: idp });
          }
        }
      }
    }
  }
  return out;
}

/**
 * The lineup rules as they stood in `year`, from config.archive.lineupEras.
 *
 * Throws rather than guessing: a season with no era on record would otherwise
 * be silently measured against today's rules, and the whole point of this
 * module is that the rules have changed twice.
 */
export function rulesFor(year, { lineupEras = [] } = {}) {
  const era = lineupEras.find((e) => year >= e.from && (e.to == null || year <= e.to));
  if (!era) {
    throw new Error(
      `No lineup rules on record for ${year}. Add an era to config.archive.lineupEras ` +
        'before archiving that season — measuring it against the wrong rules would be worse.'
    );
  }
  return { kicker: era.kicker, flex: era.flex };
}

export const LEGAL_SHAPES = legalShapes();

/** A shape as a stable string, for comparing a submitted lineup against the rules. */
export const shapeKey = (s) =>
  `QB${s.QB ?? 0} RB${s.RB ?? 0} WR${s.WR ?? 0} TE${s.TE ?? 0} PK${s.PK ?? 0} IDP${s.IDP ?? 0}`;

const SLOTS = ['QB', 'RB', 'WR', 'TE', 'PK', 'IDP'];

/**
 * Is `shape` a legal lineup, or a legal lineup with players missing?
 *
 * The short form matters: MFL will not let a manager save a lineup with an
 * empty slot, but teams have still gone into a week a man short, and the score
 * counts exactly as submitted. Those weeks are legal — just costly. A shape
 * that EXCEEDS a legal one at any slot is a different matter and is not
 * something this model can price.
 */
export function fitsWithin(shape, shapes) {
  return shapes.some((legal) => SLOTS.every((k) => (shape[k] ?? 0) <= (legal[k] ?? 0)));
}

/** Counts a list of positions into a shape. Unknown positions land in their own bucket. */
export function shapeOf(positions) {
  const s = { QB: 0, RB: 0, WR: 0, TE: 0, PK: 0, IDP: 0 };
  for (const p of positions) {
    const slot = slotOf(p);
    s[slot] = (s[slot] ?? 0) + 1;
  }
  return s;
}



/**
 * The highest-scoring legal lineup available from `players`.
 *
 * `players` is [{ id, score, position }] — the whole roster, starters and
 * bench alike. A rostered player with no score for the week scores zero: a bye
 * week or an inactive is a real cost of having started him, which is exactly
 * what the lineup rules already say.
 *
 * Within a shape, positions are independent, so taking the top N at each slot
 * is optimal for that shape; the answer is the best shape. Returns null when
 * the roster cannot fill any legal lineup at all.
 */
export function bestLineup(players, shapes = LEGAL_SHAPES) {
  const pool = new Map();
  for (const p of players) {
    const slot = slotOf(p.position);
    if (!pool.has(slot)) pool.set(slot, []);
    pool.get(slot).push({ id: p.id, score: Number(p.score) || 0 });
  }
  // Sort is total: score desc, then id, so an exact tie never picks at random.
  for (const list of pool.values()) {
    list.sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)));
  }

  let best = null;
  for (const shape of shapes) {
    let points = 0;
    const ids = [];
    let ok = true;
    for (const [slot, need] of Object.entries(shape)) {
      const list = pool.get(slot) ?? [];
      if (list.length < need) { ok = false; break; }
      for (let i = 0; i < need; i++) {
        points += list[i].score;
        ids.push(list[i].id);
      }
    }
    if (!ok) continue;
    points = round2(points);
    if (!best || points > best.points) best = { points, shape, ids };
  }
  return best;
}

/**
 * One franchise-week: what was started, what was available, and who was sat.
 *
 * `scored` is the score MFL reports for the week and stays authoritative — it
 * is the number every other record on the site is built from. The optimum is
 * ours. `left` can never be negative; if it is, the shape model is wrong and
 * the caller should fail rather than publish it.
 */
export function weekEfficiency({ players, started, scored, shapes = LEGAL_SHAPES }) {
  const best = bestLineup(players, shapes);
  if (!best) return null;

  // A manager who outscored the best lineup this model can build fielded
  // something the model does not know about. Rather than publish an efficiency
  // above 100% — or quietly clamp it, which invents a number — the week is
  // marked and the caller drops it from the aggregates and says how many it
  // dropped. Four 2016 franchise-weeks are the only ones on record.
  if (scored > best.points + 0.005) {
    return { unmodelled: true, scored: round2(scored), optimal: best.points };
  }

  const startedIds = new Set(started.map(String));
  const byId = new Map(players.map((p) => [String(p.id), p]));

  const sat = best.ids
    .filter((id) => !startedIds.has(String(id)))
    .map((id) => ({ id: String(id), score: Number(byId.get(String(id))?.score) || 0 }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  return {
    scored: round2(scored),
    optimal: best.points,
    left: round2(best.points - scored),
    efficiency: best.points === 0 ? 1 : scored / best.points,
    shape: best.shape,
    sat,
  };
}

/** Season totals per GM. Efficiency is the ratio of the totals, not a mean of ratios. */
export function seasonEfficiency(weeks) {
  const table = new Map();
  for (const w of weeks) {
    for (const row of w.rows) {
      if (!table.has(row.gm)) {
        table.set(row.gm, { gm: row.gm, scored: 0, optimal: 0, left: 0, weeks: 0 });
      }
      const t = table.get(row.gm);
      t.scored += row.scored;
      t.optimal += row.optimal;
      t.left += row.left;
      t.weeks += 1;
    }
  }
  return [...table.values()]
    .map((t) => ({
      ...t,
      scored: round2(t.scored),
      optimal: round2(t.optimal),
      left: round2(t.left),
      efficiency: t.optimal === 0 ? 1 : t.scored / t.optimal,
    }))
    .sort((a, b) => b.efficiency - a.efficiency || a.gm.localeCompare(b.gm));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
