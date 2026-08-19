// Lineup efficiency — 2015–2025. GENERATED, do not hand-edit.
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
  span: '2015–2025',
  seasons: 11,
  weeks: 1493,
  perfect: 56,

  // `isNew` marks a manager still in his first league season: ranked on every
  // board, but not yet holding a career record.
  careerMinSeasons: 2,

  // Regular season.
  careers: [
    { gm: 'Laura', scored: 1996.98, optimal: 2223.88, left: 226.90, efficiency: 0.8980, weeks: 14, seasons: 1, isNew: true },
    { gm: 'Samson', scored: 22878.39, optimal: 26050.41, left: 3172.02, efficiency: 0.8782, weeks: 148, seasons: 11 },
    { gm: 'Raj', scored: 18589.47, optimal: 21212.42, left: 2622.95, efficiency: 0.8763, weeks: 134, seasons: 10 },
    { gm: 'Ryaan', scored: 1904.73, optimal: 2175.43, left: 270.70, efficiency: 0.8756, weeks: 14, seasons: 1, isNew: true },
    { gm: 'Imran', scored: 20830.17, optimal: 23794.19, left: 2964.02, efficiency: 0.8754, weeks: 148, seasons: 11 },
    { gm: 'Hoss', scored: 20847.63, optimal: 23977.60, left: 3129.97, efficiency: 0.8695, weeks: 148, seasons: 11 },
    { gm: 'Andres', scored: 20093.29, optimal: 23303.13, left: 3209.84, efficiency: 0.8623, weeks: 147, seasons: 11 },
    { gm: 'Shak', scored: 21402.59, optimal: 24927.54, left: 3524.95, efficiency: 0.8586, weeks: 148, seasons: 11 },
    { gm: 'Asher', scored: 21769.95, optimal: 25373.79, left: 3603.84, efficiency: 0.8580, weeks: 148, seasons: 11 },
    { gm: 'Dante', scored: 21059.44, optimal: 24554.80, left: 3495.36, efficiency: 0.8577, weeks: 148, seasons: 11 },
    { gm: 'Anand', scored: 20959.31, optimal: 24671.16, left: 3711.85, efficiency: 0.8495, weeks: 148, seasons: 11 },
    { gm: 'Vip', scored: 20073.39, optimal: 23849.97, left: 3776.58, efficiency: 0.8417, weeks: 148, seasons: 11 },
  ],

  // Playoffs, counting only the weeks a manager was still alive to play.
  playoffCareers: [
    { gm: 'Hoss', scored: 1460.21, optimal: 1623.04, left: 162.83, efficiency: 0.8997, weeks: 10, seasons: 6 },
    { gm: 'Anand', scored: 1818.52, optimal: 2071.78, left: 253.26, efficiency: 0.8778, weeks: 12, seasons: 6 },
    { gm: 'Shak', scored: 1859.13, optimal: 2127.49, left: 268.36, efficiency: 0.8739, weeks: 12, seasons: 6 },
    { gm: 'Imran', scored: 2415.85, optimal: 2768.66, left: 352.81, efficiency: 0.8726, weeks: 16, seasons: 7 },
    { gm: 'Asher', scored: 1765.20, optimal: 2040.46, left: 275.26, efficiency: 0.8651, weeks: 13, seasons: 9 },
    { gm: 'Laura', scored: 460.70, optimal: 532.97, left: 72.27, efficiency: 0.8644, weeks: 3, seasons: 1, isNew: true },
    { gm: 'Samson', scored: 2576.46, optimal: 2986.21, left: 409.75, efficiency: 0.8628, weeks: 17, seasons: 11 },
    { gm: 'Andres', scored: 1034.80, optimal: 1215.32, left: 180.52, efficiency: 0.8515, weeks: 7, seasons: 4 },
    { gm: 'Dante', scored: 1925.63, optimal: 2272.48, left: 346.85, efficiency: 0.8474, weeks: 13, seasons: 6 },
    { gm: 'Raj', scored: 1038.96, optimal: 1270.67, left: 231.71, efficiency: 0.8176, weeks: 8, seasons: 5 },
    { gm: 'Vip', scored: 1350.63, optimal: 1675.10, left: 324.47, efficiency: 0.8063, weeks: 10, seasons: 5 },
  ],

  records: {
    bestSeason: { gm: 'Samson', year: 2025, efficiency: 0.9527, weeks: 14 },
    bestCareer: { gm: 'Samson', efficiency: 0.8782, weeks: 148, seasons: 11 },
    bestPlayoff: { gm: 'Hoss', efficiency: 0.8997, weeks: 10, seasons: 6 },
    worstWeek: { gm: 'Raj', year: 2017, week: 7, scored: 67.92, optimal: 189.62, left: 121.70 },
    worstSit: { gm: 'Imran', year: 2018, week: 4, player: 'Mitchell Trubisky', score: 63.23 },
    bestWeek: { gm: 'Samson', year: 2020, week: 7, scored: 222.05, optimal: 222.05, efficiency: 1.0000 },
    topBid: { gm: 'Asher', year: 2025, player: 'Brenton Strange', amount: 60.00 },
  },
};
