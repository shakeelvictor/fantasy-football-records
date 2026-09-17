// League payouts — 2019–2026. GENERATED, do not hand-edit.
//
// Rebuilt by `npm run payouts`. Who won what comes from the season archive and
// data.js; what it was worth comes from data/payouts.json, which is sourced
// from the manager's meeting notes. Every season reconciles to its full pot
// before it is written here.
//
// 2019–2026 ONLY. The league confirms the structure was genuinely different
// before 2019 — no weekly payouts, the regular-season prize came later, the
// buy-in was raised at some point — and those amounts are not recorded
// anywhere available. The Yahoo era knows who won and cannot know what they
// were paid, so it is left out rather than priced with the wrong structure.
const PAYOUTS = {
  span: '2019–2026',
  seasons: 8,
  pot: 8200,

  // A season still being played, if any. Only weekly money has been decided in
  // it — the regular-season prize and the Bowl are still on the table, and the
  // playoff weeks before the Bowl pay nothing at all.
  inProgress: { year: 2026, paid: 40, pending: 1060 },

  // Seasons whose payout figures are stated in full in the meeting notes. The
  // rest are reconstructed — every one reconciles to its pot exactly, but the
  // page says out loud that they are a best guess rather than a record.
  stated: 3,

  // Career money, richest first. `net` is winnings less every buy-in paid,
  // counting seasons played rather than seasons cashed.
  careers: [
    { gm: 'Samson', won: 1435, paidIn: 800, net: 635, seasons: 8, weeklyWins: 25, weekly: 915, regularSeason: 320, bowl: 200 },
    { gm: 'Asher', won: 910, paidIn: 800, net: 110, seasons: 8, weeklyWins: 13, weekly: 455, regularSeason: 355, bowl: 100 },
    { gm: 'Shak', won: 895, paidIn: 800, net: 95, seasons: 8, weeklyWins: 6, weekly: 210, regularSeason: 160, bowl: 525 },
    { gm: 'Imran', won: 785, paidIn: 800, net: -15, seasons: 8, weeklyWins: 8, weekly: 285, regularSeason: 0, bowl: 500 },
    { gm: 'Raj', won: 690, paidIn: 600, net: 90, seasons: 6, weeklyWins: 8, weekly: 280, regularSeason: 160, bowl: 250 },
    { gm: 'Dante', won: 575, paidIn: 800, net: -225, seasons: 8, weeklyWins: 9, weekly: 325, regularSeason: 0, bowl: 250 },
    { gm: 'Anand', won: 540, paidIn: 800, net: -260, seasons: 8, weeklyWins: 7, weekly: 245, regularSeason: 195, bowl: 100 },
    { gm: 'Andres', won: 535, paidIn: 800, net: -265, seasons: 8, weeklyWins: 8, weekly: 285, regularSeason: 0, bowl: 250 },
    { gm: 'Vip', won: 410, paidIn: 800, net: -390, seasons: 8, weeklyWins: 6, weekly: 210, regularSeason: 0, bowl: 200 },
    { gm: 'Hoss', won: 220, paidIn: 800, net: -580, seasons: 8, weeklyWins: 6, weekly: 220, regularSeason: 0, bowl: 0 },
    { gm: 'Laura', won: 145, paidIn: 200, net: -55, seasons: 2, weeklyWins: 1, weekly: 40, regularSeason: 0, bowl: 105 },
    { gm: 'Ryaan', won: 0, paidIn: 200, net: -200, seasons: 2, weeklyWins: 0, weekly: 0, regularSeason: 0, bowl: 0 },
  ],
};
