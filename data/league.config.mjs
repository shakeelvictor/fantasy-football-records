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

  // The lineup archive replays finished seasons, which did not all have this
  // season's shape. Regular-season length is what the archive needs, and it
  // tracks the NFL's own schedule: 13 weeks while the NFL played 17, 14 from
  // 2021 when it went to 18. Read by scripts/backfill-lineups.mjs.
  //
  // The MFL era starts at 2015 and nothing before it exists. Adding a season
  // here is what makes it archivable; a year with no entry is refused rather
  // than measured against the current season's shape.
  archive: {
    // 2015 lived in its own MFL league. Anything not listed uses `leagueId`.
    leagueIds: {
      2015: '53720',
    },

    // The starting lineup has changed twice. 2015 had a kicker but no flex —
    // one fixed 11-man shape. For 2016 the league voted the kicker out and a
    // flex in, still 11. 2017 brought the kicker back alongside the flex,
    // giving the 12-man lineup the rules describe today. Read by
    // src/lineups.mjs, which refuses to archive a season with no era here.
    lineupEras: [
      { from: 2015, to: 2015, kicker: true, flex: false },
      { from: 2016, to: 2016, kicker: false, flex: true },
      { from: 2017, to: null, kicker: true, flex: true },
    ],

    // A career record needs more than a single season behind it. This is the
    // smallest bar that means anything rather than a tuning dial: today it
    // marks exactly the two managers who joined in 2025, Laura and Ryaan, and
    // it clears itself the moment they play a second year. Marked managers are
    // still ranked on every board — they just do not hold the career record yet.
    //
    // Membership, not form: it is counted from a manager's league seasons, so
    // the same marker follows him onto the playoff board.
    careerMinSeasons: 2,

    regularSeasonWeeks: {
      2015: 13, 2016: 13, 2017: 13, 2018: 13, 2019: 13, 2020: 13,
      2021: 14, 2022: 14, 2023: 14, 2024: 14, 2025: 14,
    },
  },
};
