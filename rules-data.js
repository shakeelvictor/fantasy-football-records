// League rules, compiled from the manager's meeting notes (2019–2026) and the
// MFL league settings, scoring rules, and message board for INDOMEXPAK 2025.
//
// Each section has `items` (rules) and optionally `tables` (scoring grids).
// `since` marks the year the league voted the rule in — leave it off for
// settings that have always been in place.
const RULES = [
  {
    id: 'format',
    title: 'League Format',
    blurb: 'The shape of the league — teams, rosters, and how a season runs.',
    items: [
      { text: '<strong>11 franchises.</strong> The league expanded from 10 in 2025 with the addition of Ryaan and Laura, both approved unanimously.', since: '2025' },
      { text: '<strong>20-player rosters, strictly enforced.</strong> A proposal to expand rosters to accommodate multi-player trades was rejected — a trade cannot leave you over the limit.', since: '2019' },
      { text: '<strong>3 injured reserve spots</strong>, on top of the 20 roster spots. A player must be classified IR before he can be deactivated; suspended players and contract holdouts do not qualify.', since: '2020' },
      { text: '<strong>All-play, every week.</strong> Every team is scored against every other team, so one week is ten games, not one — post the high score in an 11-team league and you go 10&ndash;0 that week. A full season record reads 116&ndash;24, not 12&ndash;2.' },
      { text: '<strong>Ties count as ties.</strong> No tiebreaker is applied to a regular-season result.' },
      { text: '<strong>Standings are sorted</strong> by W&ndash;L record, then total points scored.' },
    ],
  },
  {
    id: 'lineup',
    title: 'Starting Lineup',
    blurb: 'Twelve starters, set before kickoff.',
    items: [
      { text: 'A <strong>tight end may start in place of one WR</strong>, letting you field up to three tight ends across the WR, TE, and flex spots.', since: '2024' },
      { text: 'The <strong>flex accepts any position except quarterback</strong> — and that means any: a third tight end, a fourth IDP, even a second kicker.' },
      { text: '<strong>No more than 8 combined QB/RB/WR/TE</strong> may be started. The cap sits on offense, not defense: a standard lineup spends 7 on offense plus the flex, 1 on a kicker, and 3 on IDP. Give the flex to a defender instead and you can start a 4th IDP — 7 offensive players, 1 PK, 4 IDP.' },
      { text: '<strong>Players lock at the kickoff of their own game</strong>, not at the start of the week — you can keep editing around a late game.' },
      { text: '<strong>Setting the lineup is your problem.</strong> MFL will not let you save a lineup with a slot left empty, but teams have still gone into a week a man short — Week 11 of 2023 and Week 4 of 2024 were both played with 11 starters. The score counts exactly as submitted; an unfilled slot is worth zero and the week stands.' },
      { text: '<strong>Players on bye may be submitted</strong> as starters. They will score zero, and that is your problem.' },
    ],
    tables: [
      {
        caption: '12 Starters',
        rows: [
          ['QB', '1'],
          ['RB', '2'],
          ['WR', '3 — a TE may fill one spot'],
          ['TE', '1'],
          ['Flex', '1 — any position except QB'],
          ['PK', '1'],
          ['IDP', '3 — a 4th may take the flex'],
        ],
      },
    ],
  },
  {
    id: 'scoring',
    title: 'Scoring',
    blurb: 'Half-PPR with escalating yardage bonuses, distance-based kicking, and full IDP scoring.',
    items: [
      { text: '<strong>Yardage bonuses stack in tiers.</strong> Hitting the next tier replaces the one below it — a 350-yard passing game is worth 6 bonus points, not 1 + 3 + 6.' },
      { text: '<strong>Field goals are scored by distance</strong>, one point per 10-yard band. A 60-yarder is worth six.', since: '2023' },
    ],
    tables: [
      {
        caption: 'Passing',
        rows: [
          ['Touchdown', '6'],
          ['Yards', '0.04 per yard (25 yds = 1 pt)'],
          ['Bonus · 300–324 yds', '1'],
          ['Bonus · 325–349 yds', '3'],
          ['Bonus · 350+ yds', '6'],
          ['Interception thrown', '−2'],
          ['2-point conversion', '2'],
        ],
      },
      {
        caption: 'Rushing',
        rows: [
          ['Touchdown', '6'],
          ['Yards', '0.13333 per yard (7.5 yds = 1 pt)'],
          ['Bonus · 100–124 yds', '1'],
          ['Bonus · 125–149 yds', '3'],
          ['Bonus · 150+ yds', '6'],
          ['2-point conversion', '2'],
        ],
      },
      {
        caption: 'Receiving',
        rows: [
          ['Touchdown', '6'],
          ['Yards', '0.1 per yard (10 yds = 1 pt)'],
          ['Reception', '0.5'],
          ['Bonus · 125–149 yds', '1'],
          ['Bonus · 150–174 yds', '3'],
          ['Bonus · 175+ yds', '6'],
          ['2-point conversion', '2'],
        ],
      },
      {
        caption: 'Kicking',
        rows: [
          ['Field goal · 0–19 yds', '1'],
          ['Field goal · 20–29 yds', '2'],
          ['Field goal · 30–39 yds', '3'],
          ['Field goal · 40–49 yds', '4'],
          ['Field goal · 50–59 yds', '5'],
          ['Field goal · 60+ yds', '6'],
          ['Extra point', '1'],
        ],
      },
      {
        caption: 'Returns & Fumbles',
        rows: [
          ['Punt or kickoff return TD', '6'],
          ['Punt or kickoff return yards', '0.05 per yard'],
          ['Fumble lost', '−2'],
          ['Offensive fumble recovery TD', '6'],
        ],
      },
      {
        caption: 'IDP',
        rows: [
          ['Tackle · through 6.5', '1 each'],
          ['Tackles · 7–9.5', '7.5 at 7, then 0.75 per 0.5'],
          ['Tackles · 10+', '12.5 at 10, then 1.0 per 0.5'],
          ['Assist', '0.5'],
          ['Sack', '3'],
          ['Tackle for loss', '1'],
          ['Interception', '3'],
          ['Pass defended', '2'],
          ['Forced fumble', '3'],
          ['Fumble recovery', '3'],
          ['Defensive TD', '6'],
          ['Safety', '3'],
          ['Blocked FG, punt, or XP', '3'],
        ],
      },
    ],
  },
  {
    id: 'draft',
    title: 'The Draft',
    blurb: 'Straight draft. It is not a snake, and the league is tired of the question.',
    items: [
      { text: '<strong>Straight draft.</strong> The same order runs top to bottom in every round — the first pick of round one also has the first pick of round twenty.' },
      { text: '<strong>Snake drafts are rejected</strong>, and in 2024 the league imposed a <strong>three-year moratorium</strong> on raising the topic again. The subject is eligible for debate in 2027.', since: '2024' },
    ],
  },
  {
    id: 'keepers',
    title: 'Keepers',
    blurb: 'Up to two per manager, priced by the round they came from.',
    items: [
      { text: '<strong>Keep up to two players.</strong> A keeper costs the round he was drafted in; a player picked up as a free agent costs an 11th-round pick.' },
      { text: '<strong>If both keepers would cost an 11th</strong>, the second rolls to the 12th. When trading such a keeper, the GM chooses whether to give up the 11th or the 12th.', since: '2019' },
      { text: '<strong>Keeper-eligible players can be traded</strong>, and they stay connected to their draft position when they change hands.', since: '2019' },
      { text: '<strong>Once you declare your two keepers, only those two players may be traded.</strong> You may still change your declarations up until the deadline, but you cannot trade a keeper-eligible player you did not declare.', since: '2025' },
      { text: '<strong>Rosters freeze for free agents when the season ends.</strong> You cannot pick up a player after the season is over and keep him the following year.', since: '2022' },
    ],
  },
  {
    id: 'trades',
    title: 'Trades',
    blurb: 'Players for picks, within limits, and never for cash.',
    items: [
      { text: '<strong>Each manager gets one player-for-picks trade and one picks-for-player trade per season.</strong> A single trade may involve multiple picks — sending a player for a 3rd and a 7th counts as one.', since: '2022' },
      { text: '<strong>No cash considerations.</strong> Money cannot be part of a trade.', since: '2021' },
      { text: '<strong>Player-for-player trades are unrestricted.</strong> The limits above apply only to trades involving draft picks.' },
    ],
  },
  {
    id: 'waivers',
    title: 'Waivers & Free Agency',
    blurb: 'A blind-bid budget, introduced in 2025 after six years of rejecting a waiver wire.',
    items: [
      { text: '<strong>$100 blind bidding budget per manager</strong>, run as a silent auction. Nobody sees a bid until waivers process.', since: '2025' },
      { text: '<strong>Bids can be linked.</strong> Put several bids in one group and rank them, and MFL stops the group as soon as you win one — so chasing three running backs cannot leave you paying for all three.', since: '2025' },
      { text: '<strong>No waiver priority order.</strong> The budget is the only currency — a proposal for priority-based waivers was rejected in 2019.' },
      { text: 'The league ran with <strong>no waiver wire at all</strong> from the MFL merger through 2024, rejecting the idea in 2019, 2021, 2023, and 2024 before adopting blind bidding.' },
    ],
  },
  {
    id: 'playoffs',
    title: 'Playoffs',
    blurb: 'Fourteen weeks to qualify, three weeks to win it.',
    items: [
      { text: '<strong>Six teams qualify</strong> for the playoffs.' },
      { text: '<strong>Only the regular-season winner gets a bye.</strong> The No. 1 seed sits out the first round; every other playoff team plays in Week 15.' },
      { text: '<strong>The Fantasy Bowl is Week 17.</strong> Week 18 belongs to Pakistan vs. the World.' },
    ],
    tables: [
      {
        caption: 'Season Structure',
        rows: [
          ['Regular season', 'Weeks 1–14'],
          ['Playoffs', 'Weeks 15–17'],
          ['Pakistan vs. the World', 'Week 18'],
        ],
      },
    ],
  },
  {
    id: 'money',
    title: 'Buy-In & Payouts',
    blurb: '$100 a manager, $1,100 on the table, all of it paid back out.',
    items: [
      { text: '<strong>$100 buy-in per manager</strong>, set when the league expanded to 11 teams.', since: '2025' },
    ],
    tables: [
      {
        caption: '2025 Payouts · $1,100 Pool',
        rows: [
          ['14 weekly winners @ $40', '$560'],
          ['Regular season 1st place', '$160'],
          ['Fantasy Bowl runner-up', '$105'],
          ['Fantasy Bowl champion', '$275'],
        ],
      },
    ],
  },
  {
    id: 'traditions',
    title: 'Traditions & Side Games',
    blurb: 'The rules that are not really about football.',
    items: [
      { text: '<strong>The Pro Bowl, Week 18.</strong> Pakistan versus the World, $20 a head. Each side fields a super lineup declared before the week starts, under normal starting lineup rules.', since: '2024' },
      { text: '<strong>The worst record buys the bottle.</strong> Whoever finishes last must supply a bottle to take shots from at the following year\'s draft. Raj is permanently exempt from buying alcohol.', since: '2024' },
      { text: '<strong>The champion owns the last-place team\'s name.</strong> The reigning champion may rename the previous season\'s last-place franchise at will, all year long.', since: '2021' },
    ],
  },
];
