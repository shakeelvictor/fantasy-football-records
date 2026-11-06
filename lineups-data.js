// Lineup efficiency — 2015–2026. GENERATED, do not hand-edit.
//
// Rebuilt by `npm run lineups`; every line comes from MFL. What a manager
// started each week, against the best lineup his roster could legally have
// fielded that week under the league's own starting rules.
//
// The optimum is computed by src/lineups.mjs, NOT read from MFL's opt_pts —
// MFL's optimizer does not know the 8-offense cap or the 3-IDP minimum and
// gets the answer wrong in roughly half of all weeks.
//
// The full season-by-season tables live in data/lineups/<year>.json. Only the
// leaderboards and records the site shows are shipped to the browser.
const LINEUPS = {
  span: '2015–2026',
  seasons: 12,
  weeks: 1581,
  perfect: 58,

  // `isNew` marks a manager still in his first league season: ranked on every
  // board, but not yet holding a career record.
  careerMinSeasons: 2,

  // Regular season.
  careers: [
    { gm: 'Laura', scored: 3077.47, optimal: 3394.19, left: 316.72, efficiency: 0.9067, weeks: 22, seasons: 2 },
    { gm: 'Ryaan', scored: 2902.93, optimal: 3293.81, left: 390.88, efficiency: 0.8813, weeks: 22, seasons: 2 },
    { gm: 'Samson', scored: 23968.05, optimal: 27303.59, left: 3335.54, efficiency: 0.8778, weeks: 156, seasons: 12 },
    { gm: 'Raj', scored: 18589.47, optimal: 21212.42, left: 2622.95, efficiency: 0.8763, weeks: 134, seasons: 10 },
    { gm: 'Imran', scored: 21771.73, optimal: 24870.58, left: 3098.85, efficiency: 0.8754, weeks: 156, seasons: 12 },
    { gm: 'Hoss', scored: 22029.83, optimal: 25337.53, left: 3307.70, efficiency: 0.8695, weeks: 156, seasons: 12 },
    { gm: 'Andres', scored: 21288.10, optimal: 24667.96, left: 3379.86, efficiency: 0.8630, weeks: 155, seasons: 12 },
    { gm: 'Shak', scored: 22597.57, optimal: 26273.37, left: 3675.80, efficiency: 0.8601, weeks: 156, seasons: 12 },
    { gm: 'Asher', scored: 23080.46, optimal: 26842.99, left: 3762.53, efficiency: 0.8598, weeks: 156, seasons: 12 },
    { gm: 'Dante', scored: 22277.33, optimal: 25937.56, left: 3660.23, efficiency: 0.8589, weeks: 156, seasons: 12 },
    { gm: 'Anand', scored: 22110.01, optimal: 26056.12, left: 3946.11, efficiency: 0.8486, weeks: 156, seasons: 12 },
    { gm: 'Vip', scored: 21335.95, optimal: 25258.00, left: 3922.05, efficiency: 0.8447, weeks: 156, seasons: 12 },
  ],

  // Playoffs, counting only the weeks a manager was still alive to play.
  playoffCareers: [
    { gm: 'Hoss', scored: 1460.21, optimal: 1623.04, left: 162.83, efficiency: 0.8997, weeks: 10, seasons: 6 },
    { gm: 'Anand', scored: 1818.52, optimal: 2071.78, left: 253.26, efficiency: 0.8778, weeks: 12, seasons: 6 },
    { gm: 'Shak', scored: 1859.13, optimal: 2127.49, left: 268.36, efficiency: 0.8739, weeks: 12, seasons: 6 },
    { gm: 'Imran', scored: 2415.85, optimal: 2768.66, left: 352.81, efficiency: 0.8726, weeks: 16, seasons: 7 },
    { gm: 'Asher', scored: 1765.20, optimal: 2040.46, left: 275.26, efficiency: 0.8651, weeks: 13, seasons: 9 },
    { gm: 'Laura', scored: 460.70, optimal: 532.97, left: 72.27, efficiency: 0.8644, weeks: 3, seasons: 1 },
    { gm: 'Samson', scored: 2576.46, optimal: 2986.21, left: 409.75, efficiency: 0.8628, weeks: 17, seasons: 11 },
    { gm: 'Andres', scored: 1034.80, optimal: 1215.32, left: 180.52, efficiency: 0.8515, weeks: 7, seasons: 4 },
    { gm: 'Dante', scored: 1925.63, optimal: 2272.48, left: 346.85, efficiency: 0.8474, weeks: 13, seasons: 6 },
    { gm: 'Raj', scored: 1038.96, optimal: 1270.67, left: 231.71, efficiency: 0.8176, weeks: 8, seasons: 5 },
    { gm: 'Vip', scored: 1350.63, optimal: 1675.10, left: 324.47, efficiency: 0.8063, weeks: 10, seasons: 5 },
  ],

  records: {
    bestSeason: { gm: 'Samson', year: 2025, efficiency: 0.9527, weeks: 14 },
    bestCareer: { gm: 'Laura', efficiency: 0.9067, weeks: 22, seasons: 2 },
    bestPlayoff: { gm: 'Hoss', efficiency: 0.8997, weeks: 10, seasons: 6 },
    worstWeek: { gm: 'Raj', year: 2017, week: 7, scored: 67.92, optimal: 189.62, left: 121.70 },
    worstSit: { gm: 'Imran', year: 2018, week: 4, player: 'Mitchell Trubisky', score: 63.23 },
    bestWeek: { gm: 'Samson', year: 2020, week: 7, scored: 222.05, optimal: 222.05, efficiency: 1.0000 },
    topBid: { gm: 'Asher', year: 2025, player: 'Brenton Strange', amount: 60.00 },
  },
};
