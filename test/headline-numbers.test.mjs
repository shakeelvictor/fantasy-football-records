// The site's headline numbers must be derived, never typed.
//
// They had already drifted once: the Unique Champs tile read 9 for a year
// after Raj's 2024 title made it 10. A number a human has to remember to
// update is a number that will eventually be wrong, and on a records book a
// wrong number is the whole problem.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { loadSiteData } from '../src/write-data.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(here, '..', f), 'utf8');

/** The same derivation app.js performs, kept here so a drift in either fails. */
function derive(DATA) {
  const champions = DATA.champions;
  const gms = new Set();
  const add = (n) => { if (n && !n.includes('/')) gms.add(n); };
  champions.forEach((c) => { add(c.champ); add(c.runnerUp); });
  DATA.seasons.forEach((s) => s.teams.forEach(add));
  DATA.playoffApps.forEach((r) => add(r.gm));
  DATA.bowlApps.forEach((r) => add(r.gm));

  const era = (key) => {
    const rows = champions.filter((c) => c.era === key);
    return `${rows[0].year}–${rows[rows.length - 1].year}`;
  };

  return {
    first: champions[0].year,
    seasons: champions.length,
    gms: gms.size,
    champs: new Set(champions.map((c) => c.champ)).size,
    reigning: champions[champions.length - 1],
    mfl: era('mfl'),
    yahoo: era('yahoo'),
    exhibitionSince: Math.min(...DATA.exhibition.map((e) => e.year)),
  };
}

test('no headline number is hardcoded in the markup', () => {
  const index = read('index.html');
  const hero = index.slice(index.indexOf('<section class="hero">'), index.indexOf('id="champions"'));

  // Each of these is a placeholder the script fills, not a literal.
  for (const id of [
    'heroEyebrow', 'statSeasons', 'statGms', 'statChamps',
    'statReignYear', 'statReignGm', 'eraTabMfl', 'eraTabYahoo',
  ]) {
    assert.match(index, new RegExp(`id="${id}"`), `${id} placeholder missing`);
  }
  assert.match(index, /id="siteFooterLine"/);
  assert.match(index, /id="exhibitionSince"/);

  // The hero must not carry a bare year or season count of its own.
  assert.ok(!/Est\. \d{4}/.test(hero), 'the eyebrow still hardcodes a year');
  assert.ok(!/>\d{4}</.test(hero), 'the hero still hardcodes a year');
  assert.ok(!/Reigning: \w/.test(hero), 'the reigning GM is still typed in');

  assert.ok(!/\d{4}–\d{4}/.test(read('keepers.html')), 'the keeper eyebrow still hardcodes its span');
});

test('the derivation reproduces the archive it is drawn from', async () => {
  const DATA = await loadSiteData();
  const d = derive(DATA);

  assert.equal(d.first, 2002);
  assert.equal(d.seasons, DATA.champions.length);
  assert.equal(d.reigning.year, Math.max(...DATA.champions.map((c) => c.year)));
  assert.equal(d.mfl, '2015–2025');
  assert.equal(d.yahoo, '2002–2014');
  assert.equal(d.exhibitionSince, 2024);

  // Ten, not the nine the page used to claim: Raj's 2024 title made it ten.
  assert.equal(d.champs, 10);
  assert.ok(new Set(DATA.champions.map((c) => c.champ)).has('Raj'));

  // A co-managed slot is one team, not an extra GM — both are counted already.
  assert.equal(d.gms, 14);
  assert.ok(DATA.seasons.some((s) => s.teams.some((t) => t.includes('/'))), 'expected a co-managed slot');
});

test('recording a season moves every headline number', async () => {
  const DATA = await loadSiteData();
  const before = derive(DATA);

  // Season-end appends a champion and a playoff field; nothing else is touched.
  const after = derive({
    ...DATA,
    champions: [...DATA.champions,
      { year: 2026, era: 'mfl', champ: 'Asher', seed: 3, runnerUp: 'Ryaan', runnerSeed: 4, score: '150.00 – 140.00' }],
    seasons: [...DATA.seasons,
      { year: 2026, teams: ['Vip', 'Dante', 'Asher', 'Ryaan', 'Anand', 'Samson'], champ: 'Asher' }],
  });

  assert.equal(after.seasons, before.seasons + 1);
  assert.equal(after.reigning.year, 2026);
  assert.equal(after.reigning.champ, 'Asher');
  assert.equal(after.mfl, '2015–2026');
  assert.equal(after.yahoo, before.yahoo, 'a closed era must not move');
  assert.equal(after.champs, before.champs + 1, "Asher's first title is a new unique champion");
  assert.ok(after.gms > before.gms, 'a GM new to the archive should be counted');
});

test('the README documents every command and every weekly step', () => {
  const readme = read('README.md');
  const pkg = JSON.parse(read('package.json')).scripts;
  const workflow = read('.github/workflows/weekly-update.yml');

  // A script nobody documented is a script nobody knows to run.
  for (const name of Object.keys(pkg)) {
    if (name === 'test') continue;
    assert.ok(readme.includes(`npm run ${name}`), `README does not document \`npm run ${name}\``);
  }

  // And a documented command that does not exist is worse than none.
  for (const [, name] of readme.matchAll(/npm run ([a-z-]+)/g)) {
    assert.ok(pkg[name], `README names \`npm run ${name}\`, which package.json does not define`);
  }

  // Every step the Thursday job actually runs is listed, in the order it runs.
  const steps = [...workflow.matchAll(/- run: npm run ([a-z-]+)/g)].map((m) => m[1]);
  let cursor = -1;
  for (const step of steps) {
    const at = readme.indexOf(`\`${step}\``);
    assert.ok(at > -1, `README does not list the weekly step \`${step}\``);
    assert.ok(at > cursor, `README lists \`${step}\` out of the order the job runs it`);
    cursor = at;
  }
});

test('every page can switch theme, and none flashes the wrong one', () => {
  const pages = ['index.html', 'keepers.html', 'rules.html'];

  for (const page of pages) {
    const html = read(page);

    // The control itself, and the script that wires it.
    assert.match(html, /id="themeToggle"/, `${page} has no theme control`);
    assert.match(html, /<script src="theme\.js"><\/script>/, `${page} does not load theme.js`);

    // Stamped before first paint. A deferred or external script would run too
    // late and a reader who chose dark would get a flash of light every load.
    const head = html.slice(0, html.indexOf('</head>'));
    assert.match(head, /fflr-theme/, `${page} does not resolve the theme in <head>`);
    assert.match(head, /setAttribute\('data-theme', 'dark'\)/, `${page}'s head script never applies dark`);

    // The old media-scoped theme-colors let the OS override an explicit choice.
    assert.ok(
      !/theme-color[^>]*prefers-color-scheme/.test(html),
      `${page} still has an OS-scoped theme-color, which would fight the toggle`
    );
  }

  // data-theme is the single source of truth: no stylesheet rule may decide the
  // theme on its own, or an explicit choice would only half-apply.
  const css = read('styles.css');
  const mediaRules = css.match(/@media[^{]*prefers-color-scheme[^{]*\{/g) ?? [];
  assert.equal(mediaRules.length, 0, 'a prefers-color-scheme rule would override the choice');

  // Light is the DEFAULT, so it must sit on bare :root — a reader with
  // JavaScript off, or before the head script runs, gets the default rather
  // than the alternate. Dark is the opt-in, keyed off the attribute.
  const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
  assert.match(root, /--bg:\s*#fafafa/, 'bare :root must carry the light palette');
  assert.match(css, /:root\[data-theme="dark"\]/, 'dark must key off data-theme');
  assert.ok(!/:root\[data-theme="light"\]/.test(css), 'light is the default and needs no attribute');

  // theme.js must not assume storage is available — private browsing throws.
  const js = read('theme.js');
  assert.match(js, /catch/, 'localStorage access must be guarded');
  assert.ok(!/matchMedia/.test(js), 'the OS no longer decides the theme');
});

test('the header centres its nav and collapses before it can wrap', () => {
  const css = read('styles.css');

  // Three columns, not space-between: the brand and the buttons are different
  // widths, so space-between leaves the nav visibly off-centre.
  const header = css.slice(css.indexOf('.site-header {'), css.indexOf('}', css.indexOf('.site-header {')));
  assert.match(header, /display:\s*grid/, 'the header must be a grid to centre the nav');
  assert.match(header, /grid-template-columns:\s*1fr auto 1fr/, 'the nav needs matching rails to centre against');
  assert.ok(!/justify-content:\s*space-between/.test(header), 'space-between cannot centre the nav');

  // A nav item that wraps does not look tight, it looks broken — the header
  // silently doubles in height and the links stack.
  assert.match(css, /\.site-nav a \{ white-space: nowrap; \}/, 'nav links must not wrap');
  assert.match(css, /\.brand-text \{[^}]*white-space: nowrap/s, 'the wordmark must not wrap');

  // The wordmark has to drop out BEFORE the nav does, or the rails stay wide
  // enough to push the nav into wrapping while it is still inline.
  // Anchored to the rule that DEFINES each breakpoint, not to the incidental
  // shape of the block — this regex broke the moment the header gained a
  // second declaration.
  const blocks = [...css.matchAll(/@media \(max-width: (\d+)px\) \{([\s\S]*?)\n\}/g)];
  const at = (needle) => {
    const hit = blocks.find(([, , body]) => body.includes(needle));
    assert.ok(hit, `no breakpoint defines ${needle}`);
    return Number(hit[1]);
  };
  const wordmarkAt = at('.brand-text { display: none; }');
  const drawerAt = at('.nav-toggle { display: flex; }');
  assert.ok(wordmarkAt > drawerAt,
    `the wordmark must drop (${wordmarkAt}px) before the drawer takes over (${drawerAt}px)`);

  // The drawer starts where the header ends, measured rather than hard-coded.
  // These drifted apart the moment the header gained a control.
  assert.ok(!/top:\s*64px/.test(css), 'the drawer must not hard-code the header height');
  assert.match(css, /top: var\(--header-h/, 'the drawer must use the measured header height');
  assert.match(read('theme.js'), /function trackHeaderHeight/, 'someone must publish --header-h');

  // Once the nav goes position: fixed it leaves the grid flow, so three
  // columns would be filled by two children and the buttons would drift into
  // the middle one. The drawer breakpoint must drop to two columns.
  const drawer = css.slice(css.indexOf('@media (max-width: 1120px)'));
  const drawerHeader = drawer.slice(drawer.indexOf('.site-header {'), drawer.indexOf('}', drawer.indexOf('.site-header {')));
  assert.match(drawerHeader, /grid-template-columns:\s*1fr auto\s*;/,
    'with the nav out of flow the header needs two columns, or the buttons centre themselves');

  // And every page groups its buttons, or the third grid column is two cells.
  for (const page of ['index.html', 'keepers.html', 'rules.html']) {
    assert.match(read(page), /<div class="header-actions">/, `${page} does not group its header buttons`);
  }
});
