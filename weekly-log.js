// ═══════════════════════════════════════════════════════════════════════
//  WEEKLY LOG — the only file you edit during the season.
//
//  Add one line per week to WEEKLY_LOG below. The All-Time Leaders
//  boards on the site update themselves from it: "Weekly Regular Season
//  Wins" and "200+ Point Performances" are the frozen totals through
//  2025 (in data.js) plus everything logged here.
//
//  Format:
//    { year: 2026, week: 1, winner: 'Samson', big: [] },
//
//    winner  the GM with the high score that week.
//            Use null if the week hasn't been played yet.
//    big     every GM who scored 200+ that week, including the winner
//            if they hit it. Use [] when nobody did.
//
//  Names go in quotes and must match the spellings in GMS below.
//  A typo'd name shows up as a console warning, not a silent bad stat.
//
//  You can record points alongside a 200+ game if you want the detail:
//    big: [{ gm: 'Shak', points: 214.62 }]
//  Plain names work just as well:
//    big: ['Shak']
//
//  Examples:
//    { year: 2026, week: 1, winner: 'Shak',   big: ['Shak'] },
//    { year: 2026, week: 2, winner: 'Samson', big: [] },
//    { year: 2026, week: 3, winner: 'Anand',  big: ['Anand', 'Dante'] },
//
//  After editing: commit and push. Netlify redeploys automatically.
// ═══════════════════════════════════════════════════════════════════════

// The array below is regenerated from MFL by `npm run ingest` every Thursday.
// Hand-edits between the BEGIN/END markers are overwritten on the next run —
// if a week looks wrong, fix it in MFL and rerun, or edit data/franchises.json.
// Everything outside the markers is hand-maintained and never touched.

// >>> BEGIN GENERATED — do not edit by hand
const WEEKLY_LOG = [
  // ── 2026 ──
];
// <<< END GENERATED

// Valid GM names, used to catch typos in the log above.
// Add a name here when the league takes on a new GM.
const GMS = [
  'Anand', 'Andres', 'Asher', 'Augie', 'Dante', 'Hoss', 'Imran',
  'Jimmy', 'Laura', 'Raj', 'Ryaan', 'Samson', 'Shak', 'Vip',
];
