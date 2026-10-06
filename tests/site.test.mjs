#!/usr/bin/env node
/**
 * Site tests for the R.E.P.O. build. Deterministic: builds into a temp dir and inspects the output.
 *
 * A gate that cannot fail is not a gate, so every check below asserts something that has actually been wrong in
 * this repository. The ones worth naming, because each was a real defect found by measurement rather than review:
 *   - hreflang pointing at locale URLs that were never generated (the technical reference is English-only);
 *   - a language switcher linking to pages that do not exist;
 *   - catalog cards linking to /threat/ while entries were written to /enemy/ (522 dead links);
 *   - the home page keyed as a directory and silently dropped from the sitemap;
 *   - 82-94% of main text shared between two entity pages, because the game ships a name and nothing else.
 */
import { readFileSync, existsSync, rmSync, readdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { build, lookupFields, SITE, NAV, isNoindexPage } from '../pipeline/site.mjs';

const INV = 'data/normalized/p0-inventory.json';
const ENT = 'data/canonical/entities.json';
const I18N = 'data/canonical/i18n.json';
let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => { if (cond) { pass++; console.log('  PASS ' + name); } else { fail++; console.log('  FAIL ' + name + (detail ? ' :: ' + detail : '')); } };

const inv = JSON.parse(readFileSync(INV, 'utf8'));
const ent = JSON.parse(readFileSync(ENT, 'utf8'));
const i18n = JSON.parse(readFileSync(I18N, 'utf8'));
const LOCALES = Object.keys(i18n.locales);

// --- the tool's pure function: normal, boundary, invalid
ok('lookupFields returns rows for a real query', lookupFields(inv, 'valuable', 5).length > 0);
ok('lookupFields is case-insensitive', lookupFields(inv, 'VALUABLE', 5).length === lookupFields(inv, 'valuable', 5).length);
ok('lookupFields returns an empty list (not an error) when nothing matches', lookupFields(inv, 'zzz-no-such-field-zzz', 5).length === 0);
ok('lookupFields clamps the limit to its documented range', lookupFields(inv, '', 10_000).length <= 200 && lookupFields(inv, '', 0).length >= 1);
ok('lookupFields refuses a non-string query rather than coercing it', (() => { try { lookupFields(inv, 42); return false; } catch { return true; } })());

// --- canonical data integrity: the naming layer this site is built on
{
  const dupEnemy = ent.enemies.map((e) => e.slug).filter((s, i, a) => a.indexOf(s) !== i);
  const dupItem = ent.items.map((e) => e.slug).filter((s, i, a) => a.indexOf(s) !== i);
  const dupLevel = ent.levels.map((e) => e.slug).filter((s, i, a) => a.indexOf(s) !== i);
  ok('no two entities share a slug', dupEnemy.length + dupItem.length + dupLevel.length === 0,
    [...dupEnemy, ...dupItem, ...dupLevel].join(', '));
  ok('every entity carries the game string key it was read from',
    [...ent.enemies, ...ent.items, ...ent.levels].every((e) => /^(ENEMY|ITEM|LEVEL\.NAME)\./.test(e.key)));
  ok('every entity carries a display name', [...ent.enemies, ...ent.items, ...ent.levels].every((e) => e.name && e.name.trim()));
  const classNames = new Set((inv.classes ?? []).map((c) => c.name));
  const badHint = [...ent.enemies, ...ent.items].filter((e) => e.classHint && !classNames.has(e.classHint));
  ok('no entity points at an internal class that does not exist', badHint.length === 0, badHint.map((e) => e.slug + '->' + e.classHint).join(', '));
}

// --- locale data integrity
{
  const keySets = LOCALES.map((l) => Object.keys(i18n.locales[l]).filter((k) => !['htmlLang', 'hreflang', 'name'].includes(k)).sort().join('\u0000'));
  ok('every locale carries the same i18n key set', new Set(keySets).size === 1,
    LOCALES.map((l, i) => l + '=' + keySets[i].split('\u0000').length).join(', '));
  ok('every locale has a distinct html lang and hreflang',
    new Set(LOCALES.map((l) => i18n.locales[l].htmlLang)).size === LOCALES.length &&
    new Set(LOCALES.map((l) => i18n.locales[l].hreflang)).size === LOCALES.length);
  ok('the default locale is one of the published locales', LOCALES.includes(i18n.defaultLocale), i18n.defaultLocale);
  // No locale may be a copy of English. da-DK and sv-SE are the two the game itself partially localized.
  const en = i18n.locales[i18n.defaultLocale];
  const identical = LOCALES.filter((l) => l !== i18n.defaultLocale)
    .filter((l) => ['nav.enemies', 'nav.items', 'nav.levels', 'enemies.lead', 'search.noResults', 'tool.check1']
      .every((k) => i18n.locales[l][k] === en[k]));
  ok('no locale is a silent copy of the default language', identical.length === 0, identical.join(', '));
}

const dir = mkdtempSync(join(tmpdir(), 'repo-site-'));
let stats;
try {
  stats = build(INV, dir);

  // --- routes exist in every locale
  const REQUIRED = ['index.html', 'enemies.html', 'items.html', 'levels.html', 'search.html', 'tool.html',
    'sources.html', 'guide.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html',
    'disclaimer.html', '404.html'];
  const missing = [];
  for (const l of LOCALES) for (const f of REQUIRED) if (!existsSync(join(dir, l, f))) missing.push(l + '/' + f);
  ok('every required route is emitted in every locale', missing.length === 0, missing.slice(0, 8).join(', '));

  // --- one page per canonical entity, in every locale
  const missingEnt = [];
  for (const l of LOCALES) {
    for (const e of ent.enemies) if (!existsSync(join(dir, l, 'enemy', e.slug + '.html'))) missingEnt.push(l + '/enemy/' + e.slug);
    for (const e of ent.items) if (!existsSync(join(dir, l, 'item', e.slug + '.html'))) missingEnt.push(l + '/item/' + e.slug);
    for (const e of ent.levels) if (!existsSync(join(dir, l, 'level', e.slug + '.html'))) missingEnt.push(l + '/level/' + e.slug);
  }
  ok('every canonical entity has a page in every locale', missingEnt.length === 0, missingEnt.slice(0, 8).join(', '));
  ok('an entity page is emitted for every P0 class',
    readdirSync(join(dir, i18n.defaultLocale, 'entity')).filter((f) => f.endsWith('.html')).length === (inv.classes ?? []).length);

  // --- the naming layer is the game's own, not the internal class layer
  const enemyIndex = readFileSync(join(dir, 'en-US', 'enemies.html'), 'utf8');
  const wrongName = ['BombThrower', 'Cleanup Crew'].filter((n) => enemyIndex.includes('>' + n + '<'));
  ok('catalog pages show the game string-table name, never the bare internal class name',
    enemyIndex.includes('Cleanup Crew') && !wrongName.includes('BombThrower'), wrongName.join(', '));
  const cleanup = readFileSync(join(dir, 'en-US', 'enemy', 'cleanup-crew.html'), 'utf8');
  ok('an entity page states the in-game name and the string key it came from',
    cleanup.includes('Cleanup Crew') && cleanup.includes('ENEMY.BOMB_THROWER'));
  ok('an entity page labels the internal class as a different naming layer',
    cleanup.includes('EnemyBombThrower') && /different naming layer/.test(cleanup));

  // --- fabricated content is gone and cannot come back
  const allIndexable = [];
  for (const l of LOCALES) for (const f of REQUIRED) if (f !== '404.html') allIndexable.push(readFileSync(join(dir, l, f), 'utf8'));
  ok('no page carries the retired filler sentence', !allIndexable.some((h) => /Profile: quiet door|Card THR-/.test(h)));
  ok('no page claims verified names that are not verified', !allIndexable.some((h) => /Verified names/.test(h)));
  ok('no page publishes the unverified haul names as in-game names',
    !allIndexable.some((h) => />(Gumball|TrafficLight|BabyHead|ArcticSnowBike)</.test(h)));

  // --- per-entity pages are cross-references, not indexable answers
  const entityPages = ['enemy/cleanup-crew.html', 'item/cart.html', 'level/headman-manor.html'];
  ok('per-entity pages are noindex', entityPages.every((p) => /content="noindex, follow"/.test(readFileSync(join(dir, 'en-US', p), 'utf8'))));
  ok('catalog pages are indexable', ['enemies.html', 'items.html', 'levels.html'].every((f) => /content="index, follow"/.test(readFileSync(join(dir, 'en-US', f), 'utf8'))));

  // --- hreflang correctness: never point at a URL that was not generated
  const altTargets = [];
  for (const l of LOCALES) for (const f of REQUIRED) {
    const h = readFileSync(join(dir, l, f), 'utf8');
    for (const m of h.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)) altTargets.push([m[1], m[2]]);
  }
  const missingAlt = altTargets.filter(([, url]) => !existsSync(join(dir, url.replace(SITE.url + '/', ''))));
  ok('every hreflang target is a page that exists', missingAlt.length === 0, missingAlt.slice(0, 5).map((x) => x[1]).join(', '));

  // --- the English-only technical reference must not advertise translations
  const ref = readFileSync(join(dir, i18n.defaultLocale, 'collection.html'), 'utf8');
  ok('the English-only reference carries no hreflang alternates', !/<link rel="alternate" hreflang=/.test(ref));
  ok('the English-only reference does not link to locale pages that do not exist',
    !/<a[^>]+href="\/da-DK\/collection\.html"/.test(ref));

  // --- the home page is reachable and indexed
  ok('the default-locale home page is emitted and indexable',
    /content="index, follow"/.test(readFileSync(join(dir, 'en-US', 'index.html'), 'utf8')));
  ok('the root redirects to the default locale', /url=\/en-US\/index\.html/.test(readFileSync(join(dir, 'index.html'), 'utf8')));

  // --- sitemap
  const sitemap = readFileSync(join(dir, 'sitemap.xml'), 'utf8');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE.url + '/', ''));
  ok('the sitemap lists every indexable page', locs.length === stats.urls, locs.length + ' vs ' + stats.urls);
  ok('the sitemap includes the home page of every locale',
    LOCALES.every((l) => locs.includes(l + '/index.html')));
  ok('the sitemap omits the 404 page and the noindex pages',
    !sitemap.includes('/404.html') && !locs.some((p) => isNoindexPage('/' + p)),
    locs.filter((p) => isNoindexPage('/' + p)).slice(0, 5).join(', '));
  ok('every sitemap entry declares its translations',
    (sitemap.match(/xhtml:link/g) ?? []).length === locs.length * LOCALES.length);
  ok('robots.txt points at the sitemap',
    readFileSync(join(dir, 'robots.txt'), 'utf8').includes('Sitemap: ' + SITE.url + '/sitemap.xml'));

  // --- no dead internal links anywhere
  const pageSet = new Set();
  (function walk(d) {
    for (const f of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, f.name);
      if (f.isDirectory()) walk(p); else pageSet.add('/' + p.slice(dir.length + 1).split('\\').join('/'));
    }
  })(dir);
  const broken = [];
  let checked = 0;
  for (const rel of [...pageSet].filter((p) => p.endsWith('.html'))) {
    const h = readFileSync(join(dir, rel.slice(1)), 'utf8');
    for (const m of h.matchAll(/href="(\/[^"#?]*)"/g)) {
      const t = m[1]; checked++;
      if (t === '/' || pageSet.has(t) || pageSet.has(t + 'index.html')) continue;
      broken.push(rel + ' -> ' + t);
    }
  }
  ok('no internal link points at a page that was not generated', broken.length === 0,
    checked + ' links checked; ' + [...new Set(broken)].slice(0, 5).join(', '));

  // --- duplicate content across indexable pages
  // Measured with the same instrument the audit used: character 40-grams with containment. Two earlier metrics
  // failed and are recorded so the reasoning is not repeated: a Jaccard over character shingles measured 0.070,
  // and word 6-grams measured 0.048 because the inline JSON payload has almost no whitespace. A stride-10 sampled
  // variant measured 0.131 on two pages whose longest common block was 17284 of 18173 characters, because the
  // samples land on different phases. Containment over every character window fixed that.
  const grams = (s) => {
    const set = new Set();
    for (let i = 0; i + 40 <= s.length; i++) {
      let h = 0;
      for (let k = 0; k < 40; k++) h = (h * 31 + s.charCodeAt(i + k)) | 0;
      set.add(h);
    }
    return set;
  };
  const containment = (a, b) => { let inter = 0; for (const x of a) if (b.has(x)) inter++; return inter / Math.min(a.size, b.size); };
  const mains = locs.map((l) => {
    const h = readFileSync(join(dir, l), 'utf8');
    const b = h.match(/<main>([\s\S]*?)<\/main>/);
    return { name: l, g: grams((b ? b[1] : h).replace(/\s+/g, ' ').trim()) };
  });
  const tooSimilar = [];
  for (let i = 0; i < mains.length; i++) {
    for (let j = i + 1; j < mains.length; j++) {
      const s = containment(mains[i].g, mains[j].g);
      if (s > 0.9) tooSimilar.push(mains[i].name + ' ~ ' + mains[j].name + ' = ' + s.toFixed(2));
    }
  }
  ok('no two indexable pages share more than 90% of their main content', tooSimilar.length === 0, tooSimilar.slice(0, 5).join(', '));

  // --- the reference pages still say what they do not know
  const sample = readdirSync(join(dir, i18n.defaultLocale, 'entity')).slice(0, 25)
    .map((f) => readFileSync(join(dir, i18n.defaultLocale, 'entity', f), 'utf8'));
  ok('every sampled entity page carries a canonical URL',
    sample.every((h) => h.includes('<link rel="canonical" href="' + SITE.url + '/en-US/entity/')));
  ok('every sampled entity page marks the values it does not have as unknown', sample.every((h) => /unknown/i.test(h)));

  const f0 = inv.classes[0].fields[0];
  const confidences = new Set();
  for (const c of inv.classes) for (const f of c.fields ?? []) confidences.add(f.confidence);
  ok('every field carries per-field provenance',
    f0.source === inv.source.assembly && 'value' in f0 &&
    [...confidences].every((c) => c === 'verified-schema' || c === 'extracted'), [...confidences].join(','));
  let extractedWithoutValue = 0;
  for (const c of inv.classes) for (const f of c.fields ?? []) if (f.confidence === 'extracted' && (f.value === null || f.value === undefined)) extractedWithoutValue++;
  ok('no field claims an extracted value it does not have', extractedWithoutValue === 0, extractedWithoutValue + ' field(s)');

  ok('every navigation target is a page that exists',
    NAV.filter(([href]) => !existsSync(join(dir, i18n.defaultLocale, href.replace(/^\//, '')))).length === 0);
  ok('the build reports the locale and page counts it emitted', stats.locales === LOCALES.length && stats.pages > 300,
    'locales=' + stats.locales + ' pages=' + stats.pages);
} catch (e) {
  fail++;
  console.log('  FAIL build threw :: ' + e.message);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
