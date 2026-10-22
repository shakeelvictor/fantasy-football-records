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
  weeks: 1559,
  perfect: 57,

  // `isNew` marks a manager still in his first league season: ranked on every
  // board, but not yet holding a career record.
  careerMinSeasons: 2,

  // Regular season.
  careers: [
    { gm: 'Laura', scored: 2835.46, optimal: 3136.00, left: 300.54, efficiency: 0.9042, weeks: 20, seasons: 2 },
    { gm: 'Samson', scored: 23697.36, optimal: 26981.02, left: 3283.66, efficiency: 0.8783, weeks: 154, seasons: 12 },
    { gm: 'Raj', scored: 18589.47, optimal: 21212.42, left: 2622.95, efficiency: 0.8763, weeks: 134, seasons: 10 },
    { gm: 'Ryaan', scored: 2600.34, optimal: 2971.97, left: 371.63, efficiency: 0.8750, weeks: 20, seasons: 2 },
    { gm: 'Imran', scored: 21548.93, optimal: 24635.29, left: 3086.36, efficiency: 0.8747, weeks: 154, seasons: 12 },
    { gm: 'Hoss', scored: 21754.04, optimal: 25009.21, left: 3255.17, efficiency: 0.8698, weeks: 154, seasons: 12 },
    { gm: 'Andres', scored: 20922.47, optimal: 24276.19, left: 3353.72, efficiency: 0.8619, weeks: 153, seasons: 12 },
    { gm: 'Shak', scored: 22283.29, optimal: 25917.89, left: 3634.60, efficiency: 0.8598, weeks: 154, seasons: 12 },
    { gm: 'Dante', scored: 22016.39, optimal: 25642.54, left: 3626.15, efficiency: 0.8586, weeks: 154, seasons: 12 },
    { gm: 'Asher', scored: 22727.22, optimal: 26479.51, left: 3752.29, efficiency: 0.8583, weeks: 154, seasons: 12 },
    { gm: 'Anand', scored: 21835.15, optimal: 25754.25, left: 3919.10, efficiency: 0.8478, weeks: 154, seasons: 12 },
    { gm: 'Vip', scored: 20995.70, optimal: 24896.86, left: 3901.16, efficiency: 0.8433, weeks: 154, seasons: 12 },
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
    bestCareer: { gm: 'Laura', efficiency: 0.9042, weeks: 20, seasons: 2 },
    bestPlayoff: { gm: 'Hoss', efficiency: 0.8997, weeks: 10, seasons: 6 },
    worstWeek: { gm: 'Raj', year: 2017, week: 7, scored: 67.92, optimal: 189.62, left: 121.70 },
    worstSit: { gm: 'Imran', year: 2018, week: 4, player: 'Mitchell Trubisky', score: 63.23 },
    bestWeek: { gm: 'Samson', year: 2020, week: 7, scored: 222.05, optimal: 222.05, efficiency: 1.0000 },
    topBid: { gm: 'Asher', year: 2025, player: 'Brenton Strange', amount: 60.00 },
  },
};
