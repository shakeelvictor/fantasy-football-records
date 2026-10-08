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
  weeks: 1537,
  perfect: 56,

  // `isNew` marks a manager still in his first league season: ranked on every
  // board, but not yet holding a career record.
  careerMinSeasons: 2,

  // Regular season.
  careers: [
    { gm: 'Laura', scored: 2574.48, optimal: 2855.64, left: 281.16, efficiency: 0.9015, weeks: 18, seasons: 2 },
    { gm: 'Samson', scored: 23370.55, optimal: 26635.08, left: 3264.53, efficiency: 0.8774, weeks: 152, seasons: 12 },
    { gm: 'Raj', scored: 18589.47, optimal: 21212.42, left: 2622.95, efficiency: 0.8763, weeks: 134, seasons: 10 },
    { gm: 'Imran', scored: 21300.56, optimal: 24346.28, left: 3045.72, efficiency: 0.8749, weeks: 152, seasons: 12 },
    { gm: 'Ryaan', scored: 2391.24, optimal: 2740.51, left: 349.27, efficiency: 0.8726, weeks: 18, seasons: 2 },
    { gm: 'Hoss', scored: 21473.64, optimal: 24707.71, left: 3234.07, efficiency: 0.8691, weeks: 152, seasons: 12 },
    { gm: 'Andres', scored: 20658.20, optimal: 23981.60, left: 3323.40, efficiency: 0.8614, weeks: 151, seasons: 12 },
    { gm: 'Shak', scored: 22016.26, optimal: 25587.66, left: 3571.40, efficiency: 0.8604, weeks: 152, seasons: 12 },
    { gm: 'Asher', scored: 22420.93, optimal: 26130.18, left: 3709.25, efficiency: 0.8580, weeks: 152, seasons: 12 },
    { gm: 'Dante', scored: 21720.80, optimal: 25326.45, left: 3605.65, efficiency: 0.8576, weeks: 152, seasons: 12 },
    { gm: 'Anand', scored: 21471.72, optimal: 25380.62, left: 3908.90, efficiency: 0.8460, weeks: 152, seasons: 12 },
    { gm: 'Vip', scored: 20726.25, optimal: 24586.26, left: 3860.01, efficiency: 0.8430, weeks: 152, seasons: 12 },
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
    bestCareer: { gm: 'Laura', efficiency: 0.9015, weeks: 18, seasons: 2 },
    bestPlayoff: { gm: 'Hoss', efficiency: 0.8997, weeks: 10, seasons: 6 },
    worstWeek: { gm: 'Raj', year: 2017, week: 7, scored: 67.92, optimal: 189.62, left: 121.70 },
    worstSit: { gm: 'Imran', year: 2018, week: 4, player: 'Mitchell Trubisky', score: 63.23 },
    bestWeek: { gm: 'Samson', year: 2020, week: 7, scored: 222.05, optimal: 222.05, efficiency: 1.0000 },
    topBid: { gm: 'Asher', year: 2025, player: 'Brenton Strange', amount: 60.00 },
  },
};
