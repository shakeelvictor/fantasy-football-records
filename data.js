const DATA = {
  champions: [
    // Yahoo! Era
    { year: 2002, era: 'yahoo', champ: 'Jimmy', seed: 6, runnerUp: 'Augie', runnerSeed: 8, score: null, note: 'Points unavailable' },
    { year: 2003, era: 'yahoo', champ: 'B&C', seed: 6, runnerUp: 'Dante', runnerSeed: 1, score: null, note: 'Points unavailable' },
    { year: 2004, era: 'yahoo', champ: 'B&C', seed: 5, runnerUp: 'Shak', runnerSeed: 3, score: '168.74 – 121.57' },
    { year: 2005, era: 'yahoo', champ: 'Shak', seed: 2, runnerUp: 'Dante', runnerSeed: 5, score: '192.93 – 149.38' },
    { year: 2006, era: 'yahoo', champ: 'Dante', seed: 4, runnerUp: 'Raj', runnerSeed: 2, score: '131.81 – 92.31' },
    { year: 2007, era: 'yahoo', champ: 'Vip', seed: 3, runnerUp: 'Shak', runnerSeed: 1, score: '154.34 – 129.79' },
    { year: 2008, era: 'yahoo', champ: 'Anand', seed: 3, runnerUp: 'Samson', runnerSeed: 5, score: '175.80 – 158.63' },
    { year: 2009, era: 'yahoo', champ: 'Andres', seed: 5, runnerUp: 'Austin', runnerSeed: 3, score: '144.45 – 133.47' },
    { year: 2010, era: 'yahoo', champ: 'Vip', seed: 1, runnerUp: 'Asher', runnerSeed: 2, score: '147.65 – 77.05' },
    { year: 2011, era: 'yahoo', champ: 'Imran', seed: 4, runnerUp: 'Austin', runnerSeed: 3, score: '140.40 – 133.60' },
    { year: 2012, era: 'yahoo', champ: 'Shak', seed: 5, runnerUp: 'Asher', runnerSeed: 2, score: '183.05 – 118.80' },
    { year: 2013, era: 'yahoo', champ: 'Shak', seed: 1, runnerUp: 'Imran', runnerSeed: 3, score: '141.30 – 133.45' },
    { year: 2014, era: 'yahoo', champ: 'Shak', seed: 1, runnerUp: 'Vip', runnerSeed: 2, score: '113.05 – 109.95' },
    // MFL Era
    { year: 2015, era: 'mfl', champ: 'Imran', seed: 5, runnerUp: 'Dante', runnerSeed: 1, score: '127.35 – 126.04' },
    { year: 2016, era: 'mfl', champ: 'Dante', seed: 5, runnerUp: 'Asher', runnerSeed: 3, score: '116.18 – 113.68' },
    { year: 2017, era: 'mfl', champ: 'Austin', seed: 4, runnerUp: 'Samson', runnerSeed: 1, score: '172.39 – 127.46' },
    { year: 2018, era: 'mfl', champ: 'Shak', seed: 2, runnerUp: 'Anand', runnerSeed: 5, score: '216.61 – 170.63' },
    { year: 2019, era: 'mfl', champ: 'Dante', seed: 6, runnerUp: 'Samson', runnerSeed: 4, score: '178.94 – 161.12' },
    { year: 2020, era: 'mfl', champ: 'Imran', seed: 4, runnerUp: 'Asher', runnerSeed: 1, score: '238.24 – 142.98' },
    { year: 2021, era: 'mfl', champ: 'Shak', seed: 1, runnerUp: 'Anand', runnerSeed: 2, score: '158.95 – 153.71' },
    { year: 2022, era: 'mfl', champ: 'Imran', seed: 4, runnerUp: 'Vip', runnerSeed: 2, score: '121.62 – 118.71' },
    { year: 2023, era: 'mfl', champ: 'Andres', seed: 2, runnerUp: 'Vip', runnerSeed: 5, score: '142.36 – 125.67' },
    { year: 2024, era: 'mfl', champ: 'Raj', seed: 1, runnerUp: 'Samson', runnerSeed: 2, score: '166.52 – 151.95' },
    { year: 2025, era: 'mfl', champ: 'Shak', seed: 6, runnerUp: 'Laura', runnerSeed: 5, score: '123.76 – 116.70' },
  ],

  playoffApps: [
    { gm: 'Samson', count: 18 },
    { gm: 'Hoss', count: 17 },
    { gm: 'Shak', count: 17 },
    { gm: 'Asher', count: 17 },
    { gm: 'Dante', count: 15 },
    { gm: 'Imran', count: 15 },
    { gm: 'Anand', count: 14, note: '*' },
    { gm: 'Vip', count: 14, note: '*' },
    { gm: 'Andres', count: 12 },
    { gm: 'Raj', count: 10 },
    { gm: 'Laura', count: 1 },
    { gm: 'Jimmy', count: 3 },
    { gm: 'Augie', count: 2 },
  ],

  bowlApps: [
    { gm: 'Shak', count: 9, record: '7-2' },
    { gm: 'Vip', count: 7, record: '4-3', note: '*' },
    { gm: 'Dante', count: 6, record: '3-3' },
    { gm: 'Anand', count: 5, record: '3-2', note: '*' },
    { gm: 'Imran', count: 5, record: '4-1' },
    { gm: 'Asher', count: 4, record: '0-4' },
    { gm: 'Samson', count: 4, record: '0-4' },
    { gm: 'Austin', count: 3, record: '1-2' },
    { gm: 'Andres', count: 2, record: '2-0' },
    { gm: 'Raj', count: 2, record: '1-1' },
    { gm: 'Laura', count: 1, record: '0-1' },
  ],

  weeklyWins: [
    { gm: 'Samson', count: 35 },
    { gm: 'Shak', count: 15 },
    { gm: 'Asher', count: 15 },
    { gm: 'Dante', count: 15 },
    { gm: 'Andres', count: 14 },
    { gm: 'Imran', count: 12 },
    { gm: 'Anand', count: 11 },
    { gm: 'Raj', count: 9 },
    { gm: 'Vip', count: 8 },
    { gm: 'Hoss', count: 8 },
    { gm: 'Laura', count: 1 },
  ],

  bigGames: [
    { gm: 'Samson', count: 10 },
    { gm: 'Shak', count: 5 },
    { gm: 'Anand', count: 5 },
    { gm: 'Hoss', count: 5 },
    { gm: 'Imran', count: 3 },
    { gm: 'Andres', count: 3 },
    { gm: 'Vip', count: 3 },
    { gm: 'Asher', count: 3 },
    { gm: 'Dante', count: 2 },
    { gm: 'Raj', count: 2 },
    { gm: 'Laura', count: 1 },
  ],

  records: [
    {
      label: 'Most Consecutive Playoff Apps',
      value: '11',
      holder: 'Samson',
      context: '2015 – 2025',
      prev: 'Previous: Hoss · 9 (2004–2012)'
    },
    {
      label: 'Most Weekly Wins, Single Season',
      value: '8',
      holder: 'Samson',
      context: '2025',
      prev: 'Previous: Samson & Shak · 5 (2016, 2021)'
    },
    {
      label: 'Best Record · Pre-Expansion',
      value: '83-34 · .709',
      holder: 'Samson',
      context: '2016'
    },
    {
      label: 'Best Record · Expanded Season',
      value: '116-24 · .829',
      holder: 'Samson',
      context: '2025',
      prev: 'Previous: Shak · 101-25, .802 (2021)'
    },
    {
      label: 'Worst Record · Pre-Expansion',
      value: '21-96 · .179',
      holder: 'Raj',
      context: '2017'
    },
    {
      label: 'Worst Record · Expanded Season',
      value: '23-103 · .183',
      holder: 'Imran',
      context: '2021'
    },
    {
      label: 'Highest Total Points · Season',
      value: '2709.23',
      holder: 'Shak',
      context: '2021 (incl. playoffs)',
      prev: 'Previous: Shak · 2702.92 (2018)'
    },
    {
      label: 'Highest Total Points · Reg. Season',
      value: '2405.71',
      holder: 'Shak',
      context: '2021 (expanded)',
      prev: 'Previous: Shak · 2169.70 (2018)'
    },
    {
      label: 'Highest Points to Start a Season',
      value: '217.42',
      holder: 'Shak',
      context: '2021'
    },
    {
      label: 'Highest Single Week · Reg. Season',
      value: '233.44',
      holder: 'Samson',
      context: '2020 · Week 12',
      prev: 'Previous: Andres · 224.23 (2019, Wk 8)'
    },
    {
      label: 'Lowest Points to Win a Week',
      value: '132.54',
      holder: 'Raj',
      context: '2016 · Week 14'
    },
    {
      label: 'Most Consecutive Wins',
      value: '6',
      holder: 'Samson',
      context: '2023 · Weeks 3–8',
      prev: 'Previous: Samson · 4 (2023) and Shak · 4 (2017–18)'
    },
    {
      label: 'Highest Playoff Points',
      value: '238.24',
      holder: 'Imran',
      context: '2020 · Fantasy Bowl',
      prev: 'Previous: Shak · 216.61 (2018 FB)'
    },
    {
      label: 'Widest Fantasy Bowl Margin',
      value: '95.26',
      holder: 'Imran',
      context: 'Beat Asher · New Era',
      prev: 'Old Era: Vip · 70.6 (beat Asher, 2010)'
    },
    {
      label: 'Lowest Single-Game Total',
      value: '50.79',
      holder: 'Vip',
      context: '2015 · Week 5'
    },
    {
      label: 'Slimmest Margin of Victory',
      value: '0.25',
      holder: 'Andres over Dante',
      context: '2019 · Wk 9 · 162.19 – 161.94',
      prev: 'Honorable: 1.31 — 2015 FB · Imran 127.35 over Dante 126.04'
    },
    {
      label: 'Highest Single-Player · Reg. Season',
      value: '64.33',
      holder: 'Drew Brees',
      context: 'Austin · 2015 · Week 9'
    },
    {
      label: 'Highest Single-Player · Playoffs',
      value: '65.87',
      holder: 'Alvin Kamara',
      context: 'Imran · 2020 · Fantasy Bowl'
    },
  ],

  tidbits: [
    "Since MFL, the Champion of the previous season has <strong>not reached the playoffs</strong> the following year (Imran ×3, Dante ×2, Austin, Shak ×2).",
    "<strong>Raj</strong> has the longest drought since reaching the Fantasy Bowl — last appearance was 2006.",
    "<strong>Austin</strong> is the only GM to win a Fantasy Bowl without winning a single week during the regular season (2017).",
    "<strong>Raj, Anand, Dante, and Vip</strong> are the only GMs to score 200+ pts in a week and still lose. Anand is the only one to do it twice (2018 & 2019).",
    "<strong>Shak, Anand, Samson, and Vip</strong> are the only GMs to score 200+ pts twice in the same season.",
    "<strong>Samson</strong> has won the regular season in MFL three years in a row (2016–2018).",
    "<strong>Imran</strong> has made the Fantasy Four 4 times without winning the regular season or earning a 1st round bye.",
    "<strong>Shak and Imran</strong> are the only GMs to score 200+ pts in a Fantasy Bowl (2018, 2020).",
    "<strong>Samson</strong> reached the playoffs every year in MFL (2015–2023).",
    "The 2019 MFL season is the first time in history that two teams who were last at one point ended up reaching the Fantasy Bowl.",
    "<strong>Shak</strong> is the only GM to score 200+ pts in back-to-back weeks (2021, Wks 1–2).",
    "<strong>Samson</strong> is the only GM since the MFL merger to have at least 1 Week Win each season.",
    "In a 13-week span, <strong>Imran</strong> has the worst record in MFL history (20-97, .171).",
    "In a 13-week span, <strong>Shak</strong> holds the best record (96-21), highest total points (2251.66), and highest win % (.821).",
    "Going back to Yahoo!, <strong>Shak</strong> has secured the #1 seed more than anyone else in Fantasy history (5 times).",
    "<strong>Raj</strong> joins Shak as the only GMs in MFL history to win the Regular Season AND the Fantasy Bowl in the same year.",
    "<strong>Samson</strong> joins Asher as the only GMs to reach the Fantasy Bowl but never win — a combined 0-8 with 4 losses each.",
    "<strong>Samson</strong> is the only GM to win 6 weeks in a row (2025).",
    "<strong>Samson</strong> holds records for Best Regular Season Record (.829), Most Playoff Apps (18), Most Consecutive Apps (11), Most Week Wins (35), and Most 200+pt Performances (10).",
    "<strong>Asher</strong> has reached the playoffs 6 years in a row. He joins Shak this season as the only GMs to make the playoffs without winning a single week.",
    "First time since 2022 that no GM of Mexican heritage has reached the playoffs.",
    "<strong>Ryaan (2025)</strong> joins Anand (2015), Andres (2016), Raj (2018), and Hoss (2021) as the only GMs since MFL to have 1st picks in each round and miss the playoffs.",
    "<strong>Laura</strong> is the first expansion team to reach the playoffs in her first season in the league.",
  ],

  drafts: [
    {
      year: 2022,
      picks: ['Imran', 'Vip', 'Hoss', 'Andres'],
      bowlSet: new Set(['Imran', 'Vip']),
      champion: 'Imran',
      runnerUp: 'Vip'
    },
    {
      year: 2021,
      picks: ['Hoss', 'Raj', 'Dante', 'Shak'],
      bowlSet: new Set(['Shak']),
      champion: 'Shak',
      runnerUp: 'Anand'
    },
    {
      year: 2020,
      picks: ['Vip', 'Shak', 'Raj', 'Andres / Asher'],
      bowlSet: new Set(['Asher']),
      champion: 'Imran',
      runnerUp: 'Asher',
      footnote: 'Andres held 4th overall via trade but had the 5th pick each round; Asher had 4th pick.'
    },
    {
      year: 2019,
      picks: ['Andres', 'Hoss', 'Asher', 'Raj'],
      bowlSet: new Set(),
      champion: 'Dante',
      runnerUp: 'Samson'
    },
    {
      year: 2018,
      picks: ['Raj', 'Dante', 'Anand', 'Vip'],
      bowlSet: new Set(['Anand']),
      champion: 'Shak',
      runnerUp: 'Anand'
    },
    {
      year: 2017,
      picks: ['Andres', 'Shak', 'Anand', 'Imran'],
      bowlSet: new Set(),
      champion: 'Hoss',
      runnerUp: 'Samson',
      footnote: 'Samson had 1st overall pick via trade but the 7th pick each round.'
    },
    {
      year: 2016,
      picks: ['Andres', 'Vip', 'Shak', 'Anand'],
      bowlSet: new Set(),
      champion: 'Dante',
      runnerUp: 'Asher'
    },
    {
      year: 2015,
      picks: ['Anand', 'Raj', 'Samson', 'Imran'],
      bowlSet: new Set(['Imran']),
      champion: 'Imran',
      runnerUp: 'Dante'
    },
  ],

  seasons: [
    { year: 2002, teams: ['Jimmy', 'Augie', 'Imran', 'Andres', 'Asher', 'Hoss', 'Anand/Vip', 'Samson'], champ: 'Jimmy' },
    { year: 2003, teams: ['Anand/Vip', 'Dante', 'Andres', 'Shak', 'Asher', 'Augie', 'Imran', 'Jimmy'], champ: 'B&C' },
    { year: 2004, teams: ['Anand/Vip', 'Shak', 'Asher', 'Samson', 'Andres', 'Jimmy', 'Hoss', 'Imran'], champ: 'B&C' },
    { year: 2005, teams: ['Shak', 'Dante', 'Anand/Vip', 'Hoss', 'Samson', 'Imran', 'Jimmy', 'Raj'], champ: 'Shak' },
    { year: 2006, teams: ['Dante', 'Raj', 'Hoss', 'Shak', 'Asher', 'Andres'], champ: 'Dante' },
    { year: 2007, teams: ['Vip', 'Shak', 'Dante', 'Samson', 'Anand', 'Hoss'], champ: 'Vip' },
    { year: 2008, teams: ['Anand', 'Samson', 'Shak', 'Imran', 'Dante', 'Hoss'], champ: 'Anand' },
    { year: 2009, teams: ['Andres', 'Hoss', 'Imran', 'Shak', 'Dante', 'Raj'], champ: 'Andres' },
    { year: 2010, teams: ['Vip', 'Asher', 'Raj', 'Shak', 'Hoss', 'Dante'], champ: 'Vip' },
    { year: 2011, teams: ['Imran', 'Hoss', 'Anand', 'Asher', 'Andres', 'Samson'], champ: 'Imran' },
    { year: 2012, teams: ['Shak', 'Asher', 'Dante', 'Anand', 'Hoss', 'Vip'], champ: 'Shak' },
    { year: 2013, teams: ['Shak', 'Imran', 'Andres', 'Raj', 'Vip', 'Samson'], champ: 'Shak' },
    { year: 2014, teams: ['Shak', 'Vip', 'Asher', 'Dante', 'Hoss', 'Andres'], champ: 'Shak' },
    { year: 2015, teams: ['Dante', 'Hoss', 'Samson', 'Asher', 'Imran', 'Raj'], champ: 'Imran' },
    { year: 2016, teams: ['Samson', 'Raj', 'Asher', 'Vip', 'Dante', 'Hoss'], champ: 'Dante' },
    { year: 2017, teams: ['Samson', 'Shak', 'Andres', 'Austin', 'Hoss', 'Imran', 'Asher'], champ: 'Austin' },
    { year: 2018, teams: ['Samson', 'Shak', 'Dante', 'Imran', 'Anand', 'Vip'], champ: 'Shak' },
    { year: 2019, teams: ['Anand', 'Andres', 'Imran', 'Samson', 'Hoss', 'Dante'], champ: 'Dante' },
    { year: 2020, teams: ['Asher', 'Andres', 'Samson', 'Imran', 'Vip', 'Anand'], champ: 'Imran' },
    { year: 2021, teams: ['Shak', 'Anand', 'Asher', 'Dante', 'Samson', 'Raj'], champ: 'Shak' },
    { year: 2022, teams: ['Asher', 'Vip', 'Anand', 'Imran', 'Samson', 'Hoss'], champ: 'Imran' },
    { year: 2023, teams: ['Samson', 'Andres', 'Asher', 'Shak', 'Vip', 'Raj'], champ: 'Andres' },
    { year: 2024, teams: ['Raj', 'Samson', 'Dante', 'Asher', 'Shak', 'Anand'], champ: 'Raj' },
    { year: 2025, teams: ['Samson', 'Hoss', 'Asher', 'Imran', 'Laura', 'Shak'], champ: 'Shak' },
  ],
};
