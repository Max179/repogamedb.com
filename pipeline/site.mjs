#!/usr/bin/env node
/**
 * Static site generator.
 *
 * Naming policy, enforced here rather than hoped for:
 *   - every player-facing entity name is read from data/canonical/entities.json, which records the game's own
 *     Unity Localization string tables. Internal Unity class names are a DIFFERENT layer and never reach a page
 *     as a player-facing name.
 *   - an entity whose display name could not be verified against a string table is not published as an entity.
 *     The haul items have no string-table name key, so they have no entry pages at all rather than invented ones.
 *
 * Locale policy:
 *   - every indexable page exists in all six locales the game itself ships, under its own URL prefix.
 *   - no page falls back to another language: a locale missing a string fails the build instead of silently
 *     rendering English.
 *   - entity names stay in English in every locale because the game's own tables keep them in English; the page
 *     says so rather than pretending otherwise.
 *
 * Nothing is estimated. A fact this build does not have is absent, not guessed.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { playerCSS, baseCSS, searchPage, checklistPage } from './player-ui.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const SITE = {
  name: 'R.E.P.O. Database',
  domain: 'repogamedb.com',
  url: 'https://repogamedb.com',
};

const slug = (s) => String(s).toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Pure, fixture-tested: field search across the inventory. */
export function lookupFields(inventory, query, limit = 50) {
  if (typeof query !== 'string') throw new TypeError('query must be a string');
  const q = query.trim().toLowerCase().slice(0, 64);
  const cap = Number.isFinite(limit) ? Math.max(1, Math.min(200, Math.floor(limit))) : 50;
  const out = [];
  for (const c of inventory.classes ?? []) {
    for (const f of c.fields ?? []) {
      if (!q || f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q)) {
        out.push({ class: c.name, field: f.name, type: f.type, kind: f.kind });
        if (out.length >= cap) return out;
      }
    }
  }
  return out;
}

/** Kept for callers that want the default-locale navigation. */
export const NAV = [['/', 'Home'], ['/enemies.html', 'Threats'], ['/items.html', 'Gear'],
  ['/levels.html', 'Levels'], ['/guide.html', 'Guides'], ['/search.html', 'Search'],
  ['/tool.html', 'Tools'], ['/sources.html', 'Sources']];

/**
 * Technical reference and per-entity cross-reference pages are English-only and never offered to a search engine.
 *
 * Why the entity pages are noindex rather than indexable: the game's string tables give exactly one string per
 * entity (its display name) and no description, lore or stat companion key. Measured on this build, two enemy
 * pages shared 82% of their main text and two item pages 94%, because there is no per-entity prose to differ on.
 * A per-entity page is therefore a cross-reference, not an answer to a query, and the coverage that a searcher
 * actually wants lives in the catalog tables.
 */
const NOINDEX_PAGES = ['collection.html', 'enums.html', 'values.html'];

export function localeOf(path) {
  const m = /^\/([A-Za-z-]+)\//.exec(String(path));
  return m ? m[1] : null;
}

export function isNoindexPage(path) {
  // Callers pass both '/en-US/enemy/x.html' and the bare map key 'en-US/enemy/x.html'; normalise before matching,
  // otherwise the locale strip below silently fails and every page is reported as indexable.
  const raw = String(path);
  const p = raw.startsWith('/') ? raw : '/' + raw;
  if (p === '/404.html' || /\/404\.html$/.test(p)) return true;
  const rest = p.replace(/^\/[A-Za-z-]+\//, '/');
  if (rest.startsWith('/entity/')) return true;
  // per-entity cross-reference pages
  if (/^\/(enemy|item|level)\//.test(rest)) return true;
  return NOINDEX_PAGES.includes(rest.replace(/^\//, ''));
}

export function isSchemaPage(path) {
  return String(path).replace(/^\/[A-Za-z-]+\//, '/').startsWith('/entity/');
}

function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

/** Fails loudly on a missing key: an unstranslated label must not silently render as another language. */
function makeT(strings, locale) {
  return (key, vars) => {
    let s = strings[key];
    if (typeof s !== 'string') throw new Error('i18n: missing key "' + key + '" for locale ' + locale);
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split('{' + k + '}').join(String(v));
    return s;
  };
}

export function build(inventoryPath, outDir, options = {}) {
  const inv = readJson(inventoryPath);
  const entitiesPath = options.entities || join(ROOT, 'data', 'canonical', 'entities.json');
  const i18nPath = options.i18n || join(ROOT, 'data', 'canonical', 'i18n.json');
  const mediaPath = options.media || join(ROOT, 'data', 'canonical', 'media.json');
  const ent = readJson(entitiesPath);
  const i18n = readJson(i18nPath);
  const media = existsSync(mediaPath) ? readJson(mediaPath) : { entries: {} };

  const LOCALES = Object.keys(i18n.locales);
  const DEFAULT = i18n.defaultLocale;
  if (!LOCALES.includes(DEFAULT)) throw new Error('i18n: defaultLocale ' + DEFAULT + ' is not in locales');

  // Every locale must carry exactly the same key set. A short locale would ship half-translated pages.
  const keySets = LOCALES.map((l) => Object.keys(i18n.locales[l]).filter((k) => k !== 'htmlLang' && k !== 'hreflang' && k !== 'name').sort());
  const base = keySets[0].join('\u0000');
  LOCALES.forEach((l, i) => { if (keySets[i].join('\u0000') !== base) throw new Error('i18n: locale ' + l + ' has a different key set'); });

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(join(outDir, 'entity'), { recursive: true });

  const assetRoot = join(ROOT, 'web', 'assets');
  const copied = new Set();
  const asset = (name) => {
    const dest = join(outDir, 'assets', name);
    if (!copied.has(name)) {
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(join(assetRoot, name), dest);
      copied.add(name);
    }
    return '/assets/' + name;
  };
  /**
   * Copies a game texture named in media.json. The file lives under web/assets/game/; media.json keeps the
   * provenance (bundle, asset name, dims, sha256) for each one so a gate can re-check the file against it.
   */
  const mediaAsset = (rel) => {
    const dest = join(outDir, 'assets', rel);
    if (!copied.has(rel)) {
      const src = join(assetRoot, rel);
      if (!existsSync(src)) throw new Error('media: missing source file web/assets/' + rel);
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(src, dest);
      copied.add(rel);
    }
    return '/assets/' + rel;
  };
  const generatedHeroImage = asset('generated/repo-hero-generated.png');
  const threatIcon = asset('generated/icon-threats.png');
  const itemsIcon = asset('generated/icon-gear.png');
  const levelsIcon = asset('generated/icon-extraction.png');
  const valuablesIcon = asset('generated/icon-valuables.png');

  const pages = new Map();
  /** Keys are the emitted paths relative to the output root, e.g. `en-US/index.html`. */
  const write = (rel, html) => {
    const f = join(outDir, rel);
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, html, 'utf8');
    pages.set(rel, html);
  };

  const classes = (inv.classes ?? []).slice().sort((a, b) => b.written - a.written);
  const classByName = new Map(classes.map((c) => [c.name, c]));
  const used = new Set();
  const classSlugs = classes.map((c) => {
    const b = slug(c.name);
    let s = b, n = 2;
    while (used.has(s)) s = b + '-' + n++;
    used.add(s);
    return s;
  });

  const enemies = ent.enemies ?? [];
  const items = ent.items ?? [];
  const levels = ent.levels ?? [];

  /** A level whose display name contains an enemy's display name is a name-level observation, not a claim about spawns. */
  const levelLinksFor = (enemyName) => levels
    .filter((l) => l.name.toLowerCase().includes(enemyName.toLowerCase()))
    .map((l) => l.slug);
  const namesakes = (enemySlug, enemyName) => enemies
    .filter((e) => e.slug !== enemySlug && e.name.toLowerCase() === enemyName.toLowerCase());

  const enemySlugs = new Map(enemies.map((e) => [e.key, e.slug]));
  const itemSlugs = new Map(items.map((i) => [i.key, i.slug]));
  const levelSlugs = new Map(levels.map((l) => [l.key, l.slug]));

  /**
   * Every rel path that exists in EVERY locale. Only these may carry hreflang alternates: pointing hreflang at a
   * URL that was never generated tells a search engine about pages that 404. The technical reference is
   * English-only, so it is deliberately absent from this set and gets no alternates at all.
   */
  const LOCALIZED_RELS = new Set([
    'index.html', 'enemies.html', 'items.html', 'levels.html', 'search.html', 'tool.html',
    'sources.html', 'guide.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html',
    'disclaimer.html', '404.html',
    ...enemies.map((e) => 'threat/' + e.slug + '.html'),
    ...items.map((e) => 'item/' + e.slug + '.html'),
    ...levels.map((e) => 'level/' + e.slug + '.html'),
  ]);

  const altPath = (rel) => !LOCALIZED_RELS.has(rel) ? '' :
    LOCALES.map((l) => '<link rel="alternate" hreflang="' + i18n.locales[l].hreflang + '" href="' + SITE.url + '/' + l + '/' + rel + '">').join('') +
    '<link rel="alternate" hreflang="x-default" href="' + SITE.url + '/' + DEFAULT + '/' + rel + '">';

  const layout = (locale, rel, title, description, body) => {
    const T = makeT(i18n.locales[locale], locale);
    const nav = NAV.map(([h, txt]) => {
      const key = 'nav.' + ({ 'Home': 'home', 'Threats': 'enemies', 'Gear': 'items', 'Levels': 'levels', 'Guides': 'guide', 'Search': 'search', 'Tools': 'tools', 'Sources': 'sources' })[txt];
      const href = '/' + locale + (h === '/' ? '/index.html' : h);
      const here = rel === h.replace(/^\//, '') || (h === '/' && rel === 'index.html');
      return '<a href="' + href + '"' + (here ? ' aria-current="page"' : '') + '>' + esc(T(key)) + '</a>';
    }).join('');
    const langbar = LOCALIZED_RELS.has(rel)
      ? LOCALES.map((l) => {
          const href = '/' + l + '/' + rel;
          const cur = l === locale;
          return '<a href="' + href + '" hreflang="' + i18n.locales[l].hreflang + '"' + (cur ? ' aria-current="true"' : '') + '>' + esc(i18n.locales[l].name) + '</a>';
        }).join('')
      : '<span>' + esc(i18n.locales[locale].name) + '</span>' +
        '<span class="dim">' + esc(T('entry.notTranslated')) + '</span>';
    const noindex = isNoindexPage('/' + locale + '/' + rel);
    return '<!doctype html><html lang="' + i18n.locales[locale].htmlLang + '"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + esc(title) + '</title><meta name="description" content="' + esc(description) + '">' +
      '<link rel="canonical" href="' + SITE.url + '/' + locale + '/' + rel + '">' +
      (noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow">') +
      altPath(rel) +
      '<meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(description) + '">' +
      '<meta property="og:url" content="' + SITE.url + '/' + locale + '/' + rel + '"><meta property="og:locale" content="' + i18n.locales[locale].htmlLang + '">' +
      '<style>:root{--panel:#1a1e20;--panel-2:#29292b;--line:#3b3b3d;--text:#f4f4ec;--muted:#b8b8b4;--accent:#dfc652}</style><style>' + baseCSS + '</style><style>' + playerCSS + '</style></head><body>' +
      '<a class="skip-link" href="#content">' + esc(T('nav.home')) + '</a>' +
      '<header class="top"><div class="bar"><a class="brand" href="/' + locale + '/index.html"><span class="mark">R</span><span>' + esc(SITE.name) + '</span></a>' +
      '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button><nav id="site-nav">' + nav + '</nav></div></header>' +
      '<div class="langbar" role="navigation" aria-label="Language">' + langbar + '</div>' +
      '<main>' + body + '</main>' +
      '<footer><div class="footer-inner"><div><div class="footer-title">' + esc(SITE.name) + '</div><p>' + esc(T('site.tagline')) + '.</p></div>' +
      '<div><strong>' + esc(T('footer.explore')) + '</strong><div class="footer-links">' +
      '<a href="/' + locale + '/enemies.html">' + esc(T('nav.enemies')) + '</a>' +
      '<a href="/' + locale + '/items.html">' + esc(T('nav.items')) + '</a>' +
      '<a href="/' + locale + '/levels.html">' + esc(T('nav.levels')) + '</a>' +
      '<a href="/' + locale + '/search.html">' + esc(T('nav.search')) + '</a></div></div>' +
      '<div><strong>' + esc(T('footer.about')) + '</strong><div class="footer-links">' +
      '<a href="/' + locale + '/about.html">' + esc(T('policy.about.h1')) + '</a>' +
      '<a href="/' + locale + '/contact.html">' + esc(T('policy.contact.h1')) + '</a>' +
      '<a href="/' + locale + '/privacy.html">' + esc(T('policy.privacy.h1')) + '</a>' +
      '<a href="/' + locale + '/terms.html">' + esc(T('policy.terms.h1')) + '</a></div></div>' +
      '<div class="footer-note">' + esc(T('footer.note')) + ' · ' + esc(T('entry.version')) + ' ' + esc(ent.version) + '</div></div></footer>' +
      '<script>(function(){var b=document.querySelector(".nav-toggle"),n=document.getElementById("site-nav");if(b){b.addEventListener("click",function(){var o=n.classList.toggle("is-open");b.setAttribute("aria-expanded",String(o));});}})();</script></body></html>';
  };

  // ---------------------------------------------------------------- catalog pages
  /** dir is the URL segment an entry lives under; indexRel is the catalog page it belongs to. */
  const KINDS = {
    enemy: { dir: 'enemy', indexRel: 'enemies.html', navKey: 'enemies', icon: 'threatIcon', alt: 'Generated threat radar badge' },
    item: { dir: 'item', indexRel: 'items.html', navKey: 'items', icon: 'itemsIcon', alt: 'Generated gear scanner badge' },
    level: { dir: 'level', indexRel: 'levels.html', navKey: 'levels', icon: 'levelsIcon', alt: 'Generated extraction doorway badge' },
  };

  const catalogPage = (locale, kind, list, rel, heading, lead, count) => {
    const T = makeT(i18n.locales[locale], locale);
    const K = KINDS[kind];
    const cols = kind === 'item'
      ? [T('entry.displayName'), T('entry.stringKey'), T('entry.internalClass'), T('entry.fields')]
      : [T('entry.displayName'), T('entry.stringKey'), T('entry.internalClass'), T('entry.fields')];
    const rows = list.map((e) => {
      const cls = e.classHint ? classByName.get(e.classHint) : null;
      const cells = [
        '<a href="/' + locale + '/' + K.dir + '/' + e.slug + '.html">' + esc(e.name) + '</a>',
        '<span class="mono">' + esc(e.key) + '</span>',
        cls ? '<span class="mono">' + esc(cls.name) + '</span>' : '<span class="dim">—</span>',
        cls ? esc(String(cls.declared)) + ' / ' + esc(String(cls.written)) : '<span class="dim">—</span>',
      ];
      return '<tr>' + cells.map((c) => '<td>' + c + '</td>').join('') + '</tr>';
    }).join('');
    const table = '<table><thead><tr>' + cols.map((c) => '<th>' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table>';
    // The full list is the page's substance: a searcher wants one page that answers "what is it called and what
    // is it called in the game's own files", not 60 pages that each repeat one row.
    const body = '<section class="page-shell" id="content"><p class="eyebrow">' + esc(T('catalog.eyebrow')) + '</p>' +
      '<h1>' + esc(heading) + '</h1><p class="lead">' + esc(lead) + '</p><p class="dim">' + esc(count) + '</p>' +
      table +
      '<div class="note"><strong>' + esc(T('entry.internalClass')) + '.</strong> ' + esc(T('entry.internalClass.note')) + '</div>' +
      '<div class="note"><strong>' + esc(T('sources.unknown')) + '.</strong> ' + esc(T('sources.unknown.detail')) + '</div>' +
      '</section>';
    write(locale + '/' + rel, layout(locale, rel, heading + ' · ' + SITE.name, lead, body));
  };

  // ---------------------------------------------------------------- entry pages
  const entryPage = (locale, kind, e) => {
    const T = makeT(i18n.locales[locale], locale);
    const K = KINDS[kind];
    const icon = kind === 'item' ? itemsIcon : kind === 'level' ? levelsIcon : threatIcon;
    const cls = e.classHint ? classByName.get(e.classHint) : null;
    const lev = kind === 'enemy' ? levelLinksFor(e.name) : [];
    /**
     * A mapped game texture is shown as what it is: the game's own colour sheet, with the sheet described and
     * the asset name printed. An entity with no mapped texture keeps its generated icon and the page says why,
     * rather than being given a picture that would read as something it is not.
     */
    const m = media.entries[e.key];
    const figure = m
      ? '<figure class="entry-media"><img src="' + mediaAsset(m.file) + '" alt="' + esc(e.name + ' — ' + (m.assetName || 'game texture sheet')) + '" width="' + m.width + '" height="' + m.height + '" loading="lazy" decoding="async">' +
        '<figcaption><strong>' + esc(T('entry.image.label')) + '</strong><span>' + esc(T('entry.image.' + m.reads)) + '</span>' +
        '<span class="mono dim">' + esc(m.assetName || '') + '</span>' +
        '<span class="dim">' + esc(T('entry.image.shows')) + ': ' + esc(m.whatTheSheetShows) + '</span>' +
        '<span class="dim">' + esc(T('entry.image.provenance')) + '</span></figcaption></figure>'
      : '<figure class="entry-media"><img src="' + icon + '" alt="' + esc(K.alt) + '" loading="lazy" decoding="async">' +
        '<figcaption><strong>' + esc(T('entry.image.label')) + '</strong><span>' + esc(T('entry.image.none')) + '</span></figcaption></figure>';
    const facts = [
      [T('entry.category'), T('nav.' + K.navKey)],
      [T('entry.version'), ent.version],
      [T('entry.source'), T('entry.source.value')],
    ];
    const related = ['<a href="/' + locale + '/' + K.indexRel + '">' + esc(T('nav.' + K.navKey)) + ' →</a>'];
    if (kind === 'item') {
      const sameGroup = items.filter((x) => x.group === e.group && x.slug !== e.slug).slice(0, 6);
      for (const g of sameGroup) related.push('<a href="/' + locale + '/item/' + g.slug + '.html">' + esc(g.name) + ' →</a>');
    }
    if (kind === 'enemy') {
      for (const s of lev) {
        const l = levels.find((x) => x.slug === s);
        if (l) related.push('<a href="/' + locale + '/level/' + l.slug + '.html">' + esc(l.name) + ' →</a>');
      }
      for (const n of namesakes(e.slug, e.name)) {
        related.push('<a href="/' + locale + '/enemy/' + n.slug + '.html">' + esc(n.name) + ' →</a>');
      }
    }
    const clsBlock = cls
      ? '<h2>' + esc(T('entry.internalClass')) + '</h2>' +
        '<p><a class="mono" href="/' + DEFAULT + '/entity/' + classSlugs[classes.indexOf(cls)] + '.html">' + esc(cls.name) + '</a> ' +
        '<span class="dim">· ' + esc(String(cls.declared)) + ' / ' + esc(String(cls.written)) + '</span></p>' +
        '<p class="dim">' + esc(T('entry.internalClass.note')) + '</p>'
      : '';
    const body = '<article class="entry-page"><div class="entry-hero">' + figure + '<div>' +
      '<p class="eyebrow">' + esc(T('entry.displayName')) + '</p><h1>' + esc(e.name) + '</h1>' +
      '<p class="entry-lead">' + esc(T('entry.notTranslated')) + '</p></div></div>' +
      '<div class="entry-facts">' + facts.map(([k, v]) => '<div><span>' + esc(k) + '</span><strong>' + esc(v) + '</strong></div>').join('') + '</div>' +
      '<div class="entry-columns"><section>' +
      '<h2>' + esc(T('entry.stringKey')) + '</h2><p class="mono">' + esc(e.key) + '</p>' +
      clsBlock +
      '</section><aside class="entry-aside"><p class="eyebrow">' + esc(T('catalog.entry')) + '</p>' + related.join('') + '</aside></div></article>';
    const rel = K.dir + '/' + e.slug + '.html';
    write(locale + '/' + rel, layout(locale, rel, e.name + ' · ' + SITE.name, e.name + ' — ' + T('entry.displayName'), body));
  };

  // ---------------------------------------------------------------- build every locale
  for (const locale of LOCALES) {
    const T = makeT(i18n.locales[locale], locale);

    const searchCatalog = [
      ...enemies.map((e) => ({ title: e.name, category: T('nav.enemies'), text: e.key, href: '/' + locale + '/enemy/' + e.slug + '.html', kind: 1 })),
      ...items.map((e) => ({ title: e.name, category: T('nav.items'), text: e.key, href: '/' + locale + '/item/' + e.slug + '.html', kind: 2 })),
      ...levels.map((e) => ({ title: e.name, category: T('nav.levels'), text: e.key, href: '/' + locale + '/level/' + e.slug + '.html', kind: 3 })),
    ];

    const homeBody = '<section class="hero" id="content"><img class="banner-art" src="' + generatedHeroImage + '" width="2172" height="724" alt="Original R.E.P.O. inspired extraction scene">' +
      '<div class="banner-copy"><p class="eyebrow">' + esc(T('home.eyebrow')) + '</p><h1>R.E.P.O.</h1>' +
      '<p class="lead">' + esc(T('site.tagline')) + '.</p>' +
      '<form class="hero-search" action="/' + locale + '/search.html"><input name="q" type="search" placeholder="' + esc(T('home.search.placeholder')) + '"><button>' + esc(T('home.search.button')) + '</button></form>' +
      '<p class="actions"><a class="button primary" href="/' + locale + '/enemies.html">' + esc(T('home.threats')) + '</a><a class="button" href="/' + locale + '/levels.html">' + esc(T('home.levels')) + '</a></p></div></section>' +
      '<section class="section"><div class="section-head"><div><p class="eyebrow">' + esc(T('home.explore')) + '</p><h2>' + esc(SITE.name) + '</h2></div></div><div class="category-rail">' +
      [
        ['◈', T('home.threats'), T('home.threats.desc'), '/' + locale + '/enemies.html', threatIcon, 'Generated threat radar badge'],
        ['⌁', T('home.items'), T('home.items.desc'), '/' + locale + '/items.html', itemsIcon, 'Generated gear scanner badge'],
        ['↗', T('home.levels'), T('home.levels.desc'), '/' + locale + '/levels.html', levelsIcon, 'Generated extraction doorway badge'],
        ['▣', T('nav.search'), T('search.placeholder'), '/' + locale + '/search.html', valuablesIcon, 'Generated salvage crate badge'],
      ].map(([i, t2, d, h, img, alt]) => '<a class="category" href="' + h + '"><img src="' + img + '" alt="' + alt + '" class="category-art"><span class="icon">' + i + '</span><strong>' + esc(t2) + '</strong><span>' + esc(d) + '</span></a>').join('') +
      '</div></section>' +
      '<section class="section"><div class="note"><strong>' + esc(T('unverified.heading')) + '.</strong> ' + esc(T('unverified.valuables')) + '</div></section>';
    write(locale + '/index.html', layout(locale, 'index.html', SITE.name + ' · ' + T('site.tagline'), T('site.description'), homeBody));

    catalogPage(locale, 'enemy', enemies, 'enemies.html', T('enemies.h1'), T('enemies.lead'), T('enemies.count', { n: enemies.length }));
    catalogPage(locale, 'item', items, 'items.html', T('items.h1'), T('items.lead'), T('items.count', { n: items.length }));
    catalogPage(locale, 'level', levels, 'levels.html', T('levels.h1'), T('levels.lead'), T('levels.count', { n: levels.length }));

    for (const e of enemies) entryPage(locale, 'enemy', e);
    for (const e of items) entryPage(locale, 'item', e);
    for (const e of levels) entryPage(locale, 'level', e);

    write(locale + '/search.html', layout(locale, 'search.html', T('search.h1') + ' · ' + SITE.name, T('search.label'), searchPage(T, locale, searchCatalog)));
    write(locale + '/tool.html', layout(locale, 'tool.html', T('tool.h1') + ' · ' + SITE.name, T('tool.check1'), checklistPage(T, locale)));

    const sourcesBody = '<section class="page-shell" id="content"><p class="eyebrow">' + esc(T('nav.sources')) + '</p><h1>' + esc(T('sources.h1')) + '</h1>' +
      '<p class="lead">' + esc(T('sources.lead')) + '</p>' +
      '<h2>' + esc(T('sources.displayNames')) + '</h2><p>' + esc(T('sources.displayNames.detail')) + '</p>' +
      '<p class="mono">' + esc(ent.provenance.displayNames.file) + '</p>' +
      '<h2>' + esc(T('sources.verification')) + '</h2><p>' + esc(T('sources.verification.detail')) + '</p>' +
      '<h2>' + esc(T('sources.unknown')) + '</h2><p>' + esc(T('sources.unknown.detail')) + '</p>' +
      '<h2>' + esc(T('entry.version')) + '</h2><p class="mono">' + esc(ent.version) + '</p>' +
      '<h2>' + esc(T('entry.internalClass')) + '</h2><p class="mono">' + esc(ent.provenance.internalClassNames.file) + '</p>' +
      '<p class="dim">' + esc(ent.provenance.internalClassNames.note) + '</p></section>';
    write(locale + '/sources.html', layout(locale, 'sources.html', T('sources.h1') + ' · ' + SITE.name, T('sources.lead'), sourcesBody));

    const guideBody = '<section class="page-shell" id="content"><p class="eyebrow">' + esc(T('nav.guide')) + '</p><h1>' + esc(T('guide.h1')) + '</h1><p class="lead">' + esc(T('guide.lead')) + '</p>' +
      '<div class="steps">' + ['tool.check1', 'tool.check2', 'tool.check5'].map((k, i) => '<div class="step"><b>0' + (i + 1) + '</b><div><strong>' + esc(T(k)) + '</strong></div></div>').join('') + '</div>' +
      '<h2>' + esc(T('nav.levels')) + '</h2><ul>' + levels.map((l) => '<li><a href="/' + locale + '/level/' + l.slug + '.html">' + esc(l.name) + '</a></li>').join('') + '</ul>' +
      '<p><a class="button primary" href="/' + locale + '/enemies.html">' + esc(T('nav.enemies')) + ' →</a></p></section>';
    write(locale + '/guide.html', layout(locale, 'guide.html', T('guide.h1') + ' · ' + SITE.name, T('guide.lead'), guideBody));

    const policy = (rel, hkey, bkey) => {
      const body = '<section class="page-shell" id="content"><h1>' + esc(T(hkey)) + '</h1><p>' + esc(T(bkey)) + '</p>' +
        '<p class="dim">' + esc(T('footer.note')) + '</p></section>';
      write(locale + '/' + rel, layout(locale, rel, T(hkey) + ' · ' + SITE.name, T(bkey), body));
    };
    policy('about.html', 'policy.about.h1', 'policy.about.body');
    policy('contact.html', 'policy.contact.h1', 'policy.contact.body');
    policy('privacy.html', 'policy.privacy.h1', 'policy.privacy.body');
    policy('terms.html', 'policy.terms.h1', 'policy.terms.body');
    policy('disclaimer.html', 'policy.disclaimer.h1', 'policy.disclaimer.body');

    const nf = '<section class="page-shell" id="content"><h1>' + esc(T('notfound.h1')) + '</h1><p><a href="/' + locale + '/index.html">' + esc(T('notfound.back')) + '</a></p></section>';
    write(locale + '/404.html', layout(locale, '404.html', T('notfound.h1'), T('notfound.h1'), nf));
  }

  // ---------------------------------------------------------------- English-only technical reference (noindex)
  write(DEFAULT + '/collection.html', layout(DEFAULT, 'collection.html', 'P0 classes', 'Every P0 class with the fields Unity writes.',
    '<section class="page-shell" id="content"><h1>P0 classes <span class="dim">(' + classes.length + ')</span></h1>' +
    '<p class="dim">Technical reference, marked noindex and kept out of the sitemap.</p>' +
    '<table><thead><tr><th>Class</th><th>Base</th><th>Written fields</th></tr></thead><tbody>' +
    classes.map((c, i) => '<tr><td><a href="/' + DEFAULT + '/entity/' + classSlugs[i] + '.html">' + esc(c.name) + '</a></td><td class="mono dim">' + esc(c.base ?? '-') + '</td><td>' + c.written + '</td></tr>').join('') +
    '</tbody></table></section>'));

  for (let ci = 0; ci < classes.length; ci++) {
    const c = classes[ci];
    write(DEFAULT + '/entity/' + classSlugs[ci] + '.html', layout(DEFAULT, 'entity/' + classSlugs[ci] + '.html', c.name + ' · class reference', c.name + ': ' + c.written + ' written fields read from the game assembly.',
      '<section class="page-shell" id="content"><h1 class="mono">' + esc(c.name) + '</h1>' +
      '<div class="note">This is a <strong>class reference</strong>, marked noindex: it lists what the class declares and which of it Unity writes. Field <em>values</em> are unknown unless a decode produced them.</div>' +
      '<p class="dim">namespace <span class="mono">' + esc(c.namespace || '-') + '</span> · base <span class="mono">' + esc(c.base || '-') + '</span> · declared ' + c.declared + ' · Unity writes ' + c.written + '</p>' +
      '<h2>Written fields</h2><table><thead><tr><th>Field</th><th>Type</th><th>Kind</th><th>Confidence</th><th>Value</th></tr></thead><tbody>' +
      c.fields.map((f) => '<tr><td class="mono">' + esc(f.name) + '</td><td class="mono dim">' + esc(f.type) + '</td><td class="dim">' + esc(f.kind) + '</td><td class="dim">' + esc(f.confidence ?? 'unknown') + '</td><td class="dim">' + (f.value == null ? 'unknown' : esc(String(f.value))) + '</td></tr>').join('') +
      '</tbody></table></section>'));
  }

  if ((inv.enums ?? []).length) {
    write(DEFAULT + '/enums.html', layout(DEFAULT, 'enums.html', 'Enums', 'Enumerations and their values, read from the game assembly.',
      '<section class="page-shell" id="content"><h1>Enums <span class="dim">(' + inv.enums.length + ')</span></h1>' + inv.enums.map((e) =>
        '<h2 class="mono">' + esc(e.name) + ' <span class="dim">' + e.members.length + ' members</span></h2><table><tbody>' +
        e.members.map((m) => '<tr><td class="mono">' + esc(m.name) + '</td><td class="mono dim">' + m.value + '</td></tr>').join('') + '</tbody></table>').join('') + '</section>'));
  }

  {
    const instPath = inventoryPath.replace('p0-inventory.json', 'p0-instances.json');
    let inst = null;
    try { inst = readJson(instPath); } catch { inst = null; }
    const list = (inst && inst.instances) ? inst.instances : [];
    const grouped = {};
    for (const it of list) {
      if (!grouped[it.class]) grouped[it.class] = [];
      grouped[it.class].push(it);
    }
    const names = Object.keys(grouped);
    const rows = names.slice(0, 40).map((cls) => {
      const its = grouped[cls];
      return '<h2 class="mono">' + esc(cls) + ' <span class="dim">(' + its.length + ')</span></h2>' +
        '<table><thead><tr><th>Object</th><th>Decoded fields</th></tr></thead><tbody>' +
        its.slice(0, 20).map((x) => {
          const vals = (x.values || []).map((v) => v.name + '=' + String(v.value)).join('  ');
          return '<tr><td class="mono dim">' + esc(x.pathId) + '</td><td class="mono">' + esc(vals) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }).join('');
    write(DEFAULT + '/values.html', layout(DEFAULT, 'values.html', 'Decoded values', 'Field values decoded from the games own files, one row per object.',
      '<section class="page-shell" id="content"><h1>Decoded values <span class="dim">(' + list.length + ' objects)</span></h1>' +
      '<div class="note">Each row is one object read out of the game&apos;s own files. Its class was accepted only because the measured layout consumed that object&apos;s payload exactly, so these are the game&apos;s values rather than estimates. A field a decode did not produce is simply absent.</div>' +
      (list.length === 0
        ? '<p class="dim">No object in this build decoded yet. Everything else on this site says <span class="mono">unknown</span> rather than guessing.</p>'
        : rows + (names.length > 40 ? '<p class="dim">Showing 40 of ' + names.length + ' classes.</p>' : '')) + '</section>'));
  }

  // ---------------------------------------------------------------- root, sitemap, robots
  const redirect = '<!doctype html><html lang="' + i18n.locales[DEFAULT].htmlLang + '"><head><meta charset="utf-8">' +
    '<title>' + esc(SITE.name) + '</title><link rel="canonical" href="' + SITE.url + '/' + DEFAULT + '/index.html">' +
    '<meta name="robots" content="noindex, follow"><meta http-equiv="refresh" content="0; url=/' + DEFAULT + '/index.html">' +
    '<link rel="alternate" hreflang="x-default" href="' + SITE.url + '/' + DEFAULT + '/index.html"></head>' +
    '<body><p><a href="/' + DEFAULT + '/index.html">' + esc(SITE.name) + '</a></p></body></html>';
  writeFileSync(join(outDir, 'index.html'), redirect, 'utf8');
  writeFileSync(join(outDir, '_redirects'), '/  /' + DEFAULT + '/index.html  302\n', 'utf8');

  const indexable = [...pages.keys()]
    .filter((p) => p.endsWith('.html'))
    .filter((p) => !isNoindexPage('/' + p))
    .filter((p) => localeOf('/' + p))
    .sort();
  const sitemap = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' +
    indexable.map((p) => {
      const slash = p.indexOf('/');
      const locale = p.slice(0, slash);
      const rel = p.slice(slash + 1);
      return '<url><loc>' + SITE.url + '/' + p + '</loc>' +
        LOCALES.map((l) => '<xhtml:link rel="alternate" hreflang="' + i18n.locales[l].hreflang + '" href="' + SITE.url + '/' + l + '/' + rel + '"/>').join('') +
        '</url>';
    }).join('') + '</urlset>';
  writeFileSync(join(outDir, 'sitemap.xml'), sitemap, 'utf8');
  writeFileSync(join(outDir, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: ' + SITE.url + '/sitemap.xml\n', 'utf8');

  return {
    pages: pages.size,
    urls: indexable.length,
    locales: LOCALES.length,
    enemies: enemies.length,
    items: items.length,
    levels: levels.length,
    schemaPages: [...pages.keys()].filter(isNoindexPage).length,
    outDir,
  };
}

if (process.argv[1] && process.argv[1].endsWith('site.mjs')) {
  const inventory = process.env.REPO_INVENTORY || 'data/normalized/p0-inventory.json';
  const out = process.env.REPO_OUT || 'web/dist';
  if (!existsSync(inventory)) { console.error('missing inventory: ' + inventory); process.exit(2); }
  const r = build(inventory, out);
  console.log('[site] locales=' + r.locales + ' pages=' + r.pages + ' indexable=' + r.urls +
    ' enemies=' + r.enemies + ' items=' + r.items + ' levels=' + r.levels +
    ' schema(noindex)=' + r.schemaPages + ' out=' + r.outDir);
}
