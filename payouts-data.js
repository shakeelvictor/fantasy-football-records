// League payouts — 2019–2025. GENERATED, do not hand-edit.
//
// Rebuilt by `npm run payouts`. Who won what comes from the season archive and
// data.js; what it was worth comes from data/payouts.json, which is sourced
// from the manager's meeting notes. Every season reconciles to its full pot
// before it is written here.
//
// 2019–2025 ONLY. The league confirms the structure was genuinely different
// before 2019 — no weekly payouts, the regular-season prize came later, the
// buy-in was raised at some point — and those amounts are not recorded
// anywhere available. The Yahoo era knows who won and cannot know what they
// were paid, so it is left out rather than priced with the wrong structure.
const PAYOUTS = {
  span: '2019–2025',
  seasons: 7,
  pot: 7100,

  // A season still being played, if any. Only weekly money has been decided in
  // it — the regular-season prize and the Bowl are still on the table, and the
  // playoff weeks before the Bowl pay nothing at all.
  inProgress: null,

  // Seasons whose payout figures are stated in full in the meeting notes. The
  // rest are reconstructed — every one reconciles to its pot exactly, but the
  // page says out loud that they are a best guess rather than a record.
  stated: 2,

  // Career money, richest first. `net` is winnings less every buy-in paid,
  // counting seasons played rather than seasons cashed.
  careers: [
    { gm: 'Samson', won: 1435, paidIn: 700, net: 735, seasons: 7, weeklyWins: 25, weekly: 915, regularSeason: 320, bowl: 200 },
    { gm: 'Asher', won: 910, paidIn: 700, net: 210, seasons: 7, weeklyWins: 13, weekly: 455, regularSeason: 355, bowl: 100 },
    { gm: 'Shak', won: 895, paidIn: 700, net: 195, seasons: 7, weeklyWins: 6, weekly: 210, regularSeason: 160, bowl: 525 },
    { gm: 'Imran', won: 785, paidIn: 700, net: 85, seasons: 7, weeklyWins: 8, weekly: 285, regularSeason: 0, bowl: 500 },
    { gm: 'Raj', won: 690, paidIn: 600, net: 90, seasons: 6, weeklyWins: 8, weekly: 280, regularSeason: 160, bowl: 250 },
    { gm: 'Anand', won: 540, paidIn: 700, net: -160, seasons: 7, weeklyWins: 7, weekly: 245, regularSeason: 195, bowl: 100 },
    { gm: 'Andres', won: 535, paidIn: 700, net: -165, seasons: 7, weeklyWins: 8, weekly: 285, regularSeason: 0, bowl: 250 },
    { gm: 'Dante', won: 535, paidIn: 700, net: -165, seasons: 7, weeklyWins: 8, weekly: 285, regularSeason: 0, bowl: 250 },
    { gm: 'Vip', won: 410, paidIn: 700, net: -290, seasons: 7, weeklyWins: 6, weekly: 210, regularSeason: 0, bowl: 200 },
    { gm: 'Hoss', won: 220, paidIn: 700, net: -480, seasons: 7, weeklyWins: 6, weekly: 220, regularSeason: 0, bowl: 0 },
    { gm: 'Laura', won: 145, paidIn: 100, net: 45, seasons: 1, weeklyWins: 1, weekly: 40, regularSeason: 0, bowl: 105 },
    { gm: 'Ryaan', won: 0, paidIn: 100, net: -100, seasons: 1, weeklyWins: 0, weekly: 0, regularSeason: 0, bowl: 0 },
  ],
};
