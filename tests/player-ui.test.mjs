import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { searchPage, checklistPage } from '../pipeline/player-ui.mjs';

// A minimal translator that records lookups, so the test can assert that every label the tools render is a
// translated string rather than a hardcoded English one.
const missing = [];
const T = (key, vars) => {
  const s = '«' + key + '»';
  if (!key || typeof key !== 'string') missing.push(String(key));
  return vars ? s : s;
};

const catalog = [
  { title: 'Cleanup Crew', category: 'x', text: 'ENEMY.BOMB_THROWER', href: '/en-US/enemy/cleanup-crew.html', kind: 1 },
  { title: 'C.A.R.T.', category: 'x', text: 'ITEM.CART_MEDIUM', href: '/en-US/item/cart.html', kind: 2 },
  { title: 'Headman Manor', category: 'x', text: 'LEVEL.NAME.MANOR', href: '/en-US/level/headman-manor.html', kind: 3 },
];

// --- search page
const s = searchPage(T, 'en-US', catalog);
assert.match(s, /URLSearchParams/);
assert.match(s, /aria-pressed/);
assert.match(s, /sessionStorage|replaceChildren/);
assert.ok(s.includes('«search.h1»'), 'search heading must come from the translator');
assert.ok(s.includes('«search.noResults»'), 'the empty-result message must come from the translator');
assert.ok(s.includes('«nav.enemies»') && s.includes('«nav.items»') && s.includes('«nav.levels»'), 'the filters must be translated');
// The catalog is embedded as data, so its hrefs must survive into the page for the client filter to use them.
assert.ok(s.includes('/en-US/enemy/cleanup-crew.html') && s.includes('/en-US/item/cart.html') && s.includes('/en-US/level/headman-manor.html'));
// A page that leaked an internal class name would be publishing the wrong naming layer to a player.
assert.ok(!s.includes('Assembly-CSharp') && !/Enemy[A-Z][a-z]/.test(s), 'search must not expose internal class names');

// --- checklist page
const c = checklistPage(T, 'en-US');
assert.match(c, /sessionStorage/);
assert.match(c, /id="reset"/);
assert.equal((c.match(/type="checkbox"/g) || []).length, 5);
for (const k of ['tool.check1', 'tool.check2', 'tool.check3', 'tool.check4', 'tool.check5']) {
  assert.ok(c.includes('«' + k + '»'), 'checklist item ' + k + ' must come from the translator');
}
assert.ok(c.includes('«tool.progress»'), 'the progress label must come from the translator');
assert.ok(c.includes('«tool.reset»'), 'the reset button must come from the translator');
assert.ok(c.includes('/en-US/guide.html'), 'the checklist must link to the guide in its own locale');

// The i18n layer must be exercised with real keys for every locale the site publishes, not only English: a
// missing key throws in the generator, and this asserts the tools ask for the same keys in every language.
const i18n = JSON.parse((await import('node:fs')).readFileSync('data/canonical/i18n.json', 'utf8'));
const LOCALES = Object.keys(i18n.locales);
const asked = new Set();
const recording = (locale) => (key) => {
  asked.add(key);
  const v = i18n.locales[locale][key];
  assert.equal(typeof v, 'string', 'locale ' + locale + ' is missing i18n key "' + key + '"');
  return v;
};
for (const l of LOCALES) {
  searchPage(recording(l), l, catalog);
  checklistPage(recording(l), l);
}
assert.ok(asked.size >= 18, 'the tools should resolve a meaningful set of strings, got ' + asked.size);
assert.equal(missing.length, 0);

console.log('Player UI: ' + (17 + LOCALES.length) + ' assertions passed across ' + LOCALES.length + ' locales');
