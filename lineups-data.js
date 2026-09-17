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
  weeks: 1504,
  perfect: 56,

  // `isNew` marks a manager still in his first league season: ranked on every
  // board, but not yet holding a career record.
  careerMinSeasons: 2,

  // Regular season.
  careers: [
    { gm: 'Laura', scored: 2147.00, optimal: 2383.70, left: 236.70, efficiency: 0.9007, weeks: 15, seasons: 2 },
    { gm: 'Samson', scored: 23049.65, optimal: 26234.17, left: 3184.52, efficiency: 0.8786, weeks: 149, seasons: 12 },
    { gm: 'Ryaan', scored: 2027.76, optimal: 2310.46, left: 282.70, efficiency: 0.8776, weeks: 15, seasons: 2 },
    { gm: 'Raj', scored: 18589.47, optimal: 21212.42, left: 2622.95, efficiency: 0.8763, weeks: 134, seasons: 10 },
    { gm: 'Imran', scored: 20979.47, optimal: 23970.91, left: 2991.44, efficiency: 0.8752, weeks: 149, seasons: 12 },
    { gm: 'Hoss', scored: 20984.90, optimal: 24146.97, left: 3162.07, efficiency: 0.8690, weeks: 149, seasons: 12 },
    { gm: 'Andres', scored: 20253.66, optimal: 23475.73, left: 3222.07, efficiency: 0.8627, weeks: 148, seasons: 12 },
    { gm: 'Shak', scored: 21542.85, optimal: 25078.34, left: 3535.49, efficiency: 0.8590, weeks: 149, seasons: 12 },
    { gm: 'Dante', scored: 21295.38, optimal: 24819.54, left: 3524.16, efficiency: 0.8580, weeks: 149, seasons: 12 },
    { gm: 'Asher', scored: 21914.03, optimal: 25541.89, left: 3627.86, efficiency: 0.8580, weeks: 149, seasons: 12 },
    { gm: 'Anand', scored: 21069.28, optimal: 24839.26, left: 3769.98, efficiency: 0.8482, weeks: 149, seasons: 12 },
    { gm: 'Vip', scored: 20233.99, optimal: 24030.70, left: 3796.71, efficiency: 0.8420, weeks: 149, seasons: 12 },
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
    bestCareer: { gm: 'Laura', efficiency: 0.9007, weeks: 15, seasons: 2 },
    bestPlayoff: { gm: 'Hoss', efficiency: 0.8997, weeks: 10, seasons: 6 },
    worstWeek: { gm: 'Raj', year: 2017, week: 7, scored: 67.92, optimal: 189.62, left: 121.70 },
    worstSit: { gm: 'Imran', year: 2018, week: 4, player: 'Mitchell Trubisky', score: 63.23 },
    bestWeek: { gm: 'Samson', year: 2020, week: 7, scored: 222.05, optimal: 222.05, efficiency: 1.0000 },
    topBid: { gm: 'Asher', year: 2025, player: 'Brenton Strange', amount: 60.00 },
  },
};
