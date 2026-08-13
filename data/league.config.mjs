// Structure and house rules. Hand-maintained.
// MFL owns scores; this file owns everything MFL's playoff module can't express.
//
// Every key here is read by the code. If you add one, wire it up — a constant
// that looks like a setting but changes nothing is worse than no setting.

export const config = {
  leagueId: '19716',
  season: 2026,

  regularSeasonWeeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  playoffWeeks: [15, 16, 17],
  fantasyBowlWeek: 17,
  exhibitionWeeks: [18], // "Pakistan vs. the World"

  playoffTeams: 6,

  // Only the regular-season winner gets a bye. Verified against the Playoffs
  // section of rules-data.js: "The No. 1 seed sits out the first round; every
  // other playoff team plays in Week 15." A second bye is rejected in derive.mjs —
  // the counts alone would not catch it.
  byeSeeds: [1],
  eliminatedPerWeek: { 15: 2, 16: 2 },

  bigGameThreshold: 200,

  // PENDING LEAGUE DECISION: do Week 18 exhibition performances count
  // toward the all-time 200+ club? Defaulting to exclude.
  includeExhibitionInRecords: false,
};
