#!/usr/bin/env node
/**
 * Static site generator for repogamedb.com (Windows-side build).
 *
 * Two layers, kept apart on purpose:
 *   - Player layer: home, game guide, entity hub + player category pages, entity pages, guides, tools, updates.
 *   - Evidence layer: class/field/enum/value tables and provenance, under /reference/ and /entity/, marked noindex.
 * A subject with no confirmed game picture is not published as an entity page: it becomes a noindex note under
 * /reference/notes/ and is listed on its category page as a note.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { themeCSS } from './theme.mjs';

export const SITE = {
  name: 'R.E.P.O. Wiki',
  gameName: 'R.E.P.O.',
  domain: 'repogamedb.com',
  url: 'https://repogamedb.com',
  accent: '#f2b705',
  danger: '#d3402f',
  tagline: 'Monsters, valuables, gear, maps and the run from entry to extraction',
  searchPlaceholder: 'Search monsters, valuables, gear or guides',
  versionBadge: 'R.E.P.O. v0.4.0 · read from a local copy',
  heroImage: 'generated/repo-hero-generated.png',
  heroAlt: 'Original R.E.P.O.-inspired extraction scene created for this wiki interface.',
  featured: ['the-oogly', 'the-bomb-thrower', 'the-monster-that-grabs-heads', 'the-heart-hugger',
    'the-slow-mouth', 'the-upscream', 'the-bowtie-monster', 'the-animal'],

};

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** Public URL path: Cloudflare Pages serves clean URLs and 308s the .html form. */
export const publicPath = (path) => path === '/' || path === '/index.html' ? '/' : path.endsWith('/index.html') ? path.slice(0, -10) : path.replace(/\.html$/, '');
/** Keep meta/OG descriptions inside the useful search-snippet range. */
export const metaDescription = (s) => {
  const text = String(s ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= 160) return text;
  const cut = text.slice(0, 157);
  const at = cut.lastIndexOf(' ');
  return (at > 120 ? cut.slice(0, at) : cut).replace(/[.,;:!?\u2014-]+$/, '') + '\u2026';
};

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

/** The five player-facing sections. */
export const NAV = [
  ['/guide.html', 'Game guide'],
  ['/entities/', 'Entities'],
  ['/articles/', 'Guides'],
  ['/tools/', 'Tools'],
  ['/updates.html', 'Updates'],
];

/** Evidence layer: reachable from the footer and /reference/ only, never indexed. */
export const REFERENCE_PATHS = new Set(['/collection.html', '/enemies.html', '/enums.html', '/values.html', '/tool.html', '/sources.html', '/reference/']);
export function isSchemaPage(path) {
  const p = String(path);
  return p.startsWith('/entity/') || p.startsWith('/reference/') || REFERENCE_PATHS.has(p);
}
export function isNoindexPage(path) { return isSchemaPage(path) || path === '/tool.html'; }

/** Player categories: what someone is dealing with in a run. */
export const CATEGORIES = [
  { key: 'monsters', name: 'Monsters', src: ['Enemies'], blurb: 'What is out there, how it moves, and how to read it before it reaches you.' },
  { key: 'valuables', name: 'Valuables', src: ['Valuables'], blurb: 'What is worth carrying out, and the ones that fight back or lie about it.' },
  { key: 'gear', name: 'Gear and items', src: ['Items', 'Medical', 'Cosmetics'], blurb: 'What you carry in, what you spend, and what you wear.' },
  { key: 'weapons', name: 'Weapons and ammunition', src: ['Weapons', 'Ammunition', 'Ammo'], blurb: 'Guns, melee weapons, staffs and what they fire.' },
  { key: 'maps', name: 'Maps and levels', src: ['Maps'], blurb: 'The level you are in, its themes, and how a run is laid out.' },
  { key: 'extraction', name: 'Extraction and the shop', src: ['Extraction', 'Shop'], blurb: 'Getting the haul out, and spending the takings between runs.' },
  { key: 'behaviour', name: 'How the game behaves', src: ['Behaviour', 'Physics'], blurb: 'Grabbing, carrying, falling and the rules the world runs on.' },
  { key: 'interface', name: 'Interface and readouts', src: ['Interface'], blurb: 'The screens, panels and readouts you work with while you play.' },
  { key: 'crew', name: 'Playing with a crew', src: ['Co-op', 'Comms'], blurb: 'Splitting up, talking, and finishing a run together.' },
  { key: 'hazards', name: 'Hazards and events', src: ['Events'], blurb: 'Mines, traps, lasers and the set pieces a level can put in your way.' },
  { key: 'basics', name: 'Basics and answers', src: ['FAQ', 'Glossary', 'Versions'], blurb: 'Common questions, the words this site uses, and which build it documents.' },
];

export const groupOf = (category) => (CATEGORIES.find((c) => c.src.includes(category)) ?? CATEGORIES[CATEGORIES.length - 1]);

/** Player-facing search index: entries, guides and a few core pages. Kept small enough to inline into search.html. */
export function buildSearchIndex(entries, articles = []) {
  const compact = (s, n = 300) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
  const items = [];
  for (const e of entries) {
    const pictured = e.imageTier === 'game-image' || e.imageTier === 'community-image';
    const body = [e.summary, ...(e.body ?? []).slice(0, 4)].join(' ');
    const extra = (e.facts ?? []).map((f) => f.claim).join(' ');
    items.push({ t: e.title, u: pictured ? '/entries/' + e.id + '.html' : '/reference/notes/' + e.id + '.html', k: groupOf(e.category).name, c: e.category, s: compact(body + ' ' + extra) });
  }
  for (const a of articles) {
    const body = [a.target, ...(a.steps ?? []).map((s) => s.do ?? '')].join(' ');
    items.push({ t: a.title, u: '/articles/' + a.id + '.html', k: 'Guides', c: 'Guides', s: compact(body) });
  }
  for (const [t, u, k, s] of [
    ['Start here: R.E.P.O. guide', '/guide.html', 'Pages', 'Scout, carry, extract; routes, crew roles and gear choices.'],
    ['All entities by part of the run', '/entities/', 'Pages', 'Browse monsters, valuables, gear, weapons, maps, hazards and interface entries.'],
    ['Image credits', '/credits.html', 'Pages', 'Sources, authors, uploaders and licences for community pictures.'],
    ['About this wiki', '/about.html', 'Pages', 'Independent player reference built from the game files.'],
    ['Contact and corrections', '/contact.html', 'Pages', 'Report a wrong field or missing picture.'],
  ]) items.push({ t, u, k, c: k, s });
  return items;
}

export function build(inventoryPath, outDir) {
  const inv = JSON.parse(readFileSync(inventoryPath, 'utf8'));
  const srcLine = 'Source: read from a local copy of the game · version ' + (inv.version ?? 'unknown') + ' · nothing invented';
  let manifest = { records: [] };
  try { manifest = JSON.parse(readFileSync(join(process.cwd(), 'content', 'images-manifest.json'), 'utf8')); } catch { /* none yet */ }
  const manifestByFile = new Map((manifest.records ?? []).map((r) => [r.file, r]));
  const imageRecord = (img) => manifestByFile.get(img.file) ?? null;
  const safeUrl = (u) => (/^https?:\/\//i.test(String(u ?? '')) ? String(u) : '');
  /** Caption for any entry/category picture, derived from the manifest record rather than assumed. */
  const captionFor = (img) => {
    const rec = imageRecord(img);
    if (!rec) return esc(img.disclaimer ?? 'Original diagram drawn for this site. It is not a screenshot of the game.');
    if (img.kind === 'community') {
      const name = rec.sourceName || 'R.E.P.O. Fandom Wiki';
      const page = safeUrl(rec.sourcePage);
      const source = page ? '<a href="' + esc(page) + '" rel="nofollow noopener">' + esc(name) + '</a>' : esc(name);
      const author = esc(rec.author || 'R.E.P.O. Fandom Wiki contributors');
      const license = esc(rec.license || 'CC-BY-SA-4.0');
      const licenseUrl = safeUrl(rec.licenseUrl || 'https://creativecommons.org/licenses/by-sa/4.0/');
      const licenseLink = licenseUrl ? ' (<a href="' + esc(licenseUrl) + '" rel="nofollow noopener">license</a>)' : '';
      const modified = rec.modified ? ' It has been re-encoded for this page.' : '';
      const shown = String(img.shows ?? '').replace(/[.。!！?？]\s*$/u, '').trim();
      const prefix = img.illustrative ? 'Illustrative community picture' + (shown ? ' showing ' + esc(shown) : '') : 'Community picture';
      return prefix + ' from ' + source + ', ' + license + licenseLink + ', by ' + author + '.' + modified + ' It is not a screenshot taken by this site.';
    }
    if (img.kind === 'game') {
      return 'Picture taken from the game to identify this item; it remains the property of the developer.';
    }
    return esc(img.disclaimer ?? 'Original diagram drawn for this site. It is not a screenshot of the game.');
  };

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const pages = new Map();
  const urls = [];
  const socialImage = SITE.url + '/social-card.png';
  const layout = (title, description, path, body) => {
    const fullTitle = title.includes(SITE.name) ? title : (title.length + SITE.name.length + 3 > 60 ? title : title + ' · ' + SITE.name);
    const urlPath = publicPath(path);
    const metaDesc = metaDescription(description);
    const isArticle = path.startsWith('/entries/') || path.startsWith('/articles/');
    const schemaType = isArticle ? 'Article' : (path === '/' ? 'WebSite' : 'WebPage');
    const schema = {
      '@context': 'https://schema.org', '@type': schemaType, name: title, description: metaDesc, url: SITE.url + urlPath, image: socialImage,
      isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE.url },
      ...(path === '/' ? { potentialAction: { '@type': 'SearchAction', target: SITE.url + '/search?q={search_term_string}', 'query-input': 'required name=search_term_string' } } : {}),
    };
    return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>' + esc(fullTitle) + '</title>\n' +
    '<meta name="description" content="' + esc(metaDesc) + '">\n<meta name="robots" content="' + (isNoindexPage(path) ? 'noindex, follow' : 'index, follow') + '">\n' +
    '<meta name="theme-color" content="#080a08">\n<link rel="canonical" href="' + SITE.url + urlPath + '">\n<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n' +
    '<link rel="alternate" hreflang="en" href="' + SITE.url + urlPath + '">' +
    '<link rel="alternate" hreflang="x-default" href="' + SITE.url + urlPath + '">' +
    '<meta property="og:title" content="' + esc(fullTitle) + '"><meta property="og:type" content="' + (isArticle ? 'article' : 'website') + '"><meta property="og:site_name" content="' + esc(SITE.name) + '"><meta property="og:locale" content="en_US">\n' +
    '<meta property="og:description" content="' + esc(metaDesc) + '"><meta property="og:url" content="' + SITE.url + urlPath + '">\n' +
    '<meta property="og:image" content="' + socialImage + '"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="R.E.P.O. Wiki — monsters, valuables and extraction">\n' +
    '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + esc(fullTitle) + '"><meta name="twitter:description" content="' + esc(metaDesc) + '"><meta name="twitter:image" content="' + socialImage + '">\n' +
    '<script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, '\\u003c') + '</script>\n' +
    '<link rel="stylesheet" href="/style.css">\n</head>\n<body>\n' +
    '<a class="skip" href="#main">Skip to content</a>\n' +
    '<header class="top">\n<div class="wrap bar">\n' +
    '<a class="brand" href="/"><img src="/brand.svg" alt="' + esc(SITE.gameName) + '" width="34" height="34"><span>' + esc(SITE.gameName) + '<em>wiki</em></span></a>\n' +
    '<nav class="main" aria-label="Sections">' + NAV.map(([h, t]) =>
      '<a href="' + h + '"' + (path === h || (h !== '/' && path.startsWith(h.replace(/\.html$/, '').replace(/index\.html$/, ''))) ? ' class="on"' : '') + '>' + esc(t) + '</a>').join('') + '</nav>\n' +
    '<form class="hsearch" action="/search.html" method="get" role="search"><input type="search" name="q" placeholder="' + esc(SITE.searchPlaceholder) + '" aria-label="Search this site"><button type="submit">Search</button></form>\n' +
    '</div>\n</header>\n<main id="main" class="wrap">\n' + body + '\n</main>\n' +
    '<footer class="foot"><div class="wrap">\n<p class="dim">' + esc(srcLine) + '</p>\n' +
    '<p class="dim">A diagram is always labelled as a diagram. A number we could not verify is not printed.</p>\n' +
    '<p class="dim"><a href="/about.html">About</a> · <a href="/contact.html">Contact</a> · <a href="/privacy.html">Privacy</a> · ' +
    '<a href="/terms.html">Terms</a> · <a href="/disclaimer.html">Disclaimer</a> · <a href="/credits.html">Image credits</a> · <a href="/reference/">Technical reference</a></p>\n' +
    '</div></footer>\n</body>\n</html>\n';
  };
  const write = (rel, html) => { const f = join(outDir, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, html, 'utf8'); pages.set('/' + rel, html); };
  const indexable = (rel, title, desc, body) => { write(rel, layout(title, desc, '/' + rel, body)); urls.push(SITE.url + publicPath('/' + rel)); };
  const reference = (rel, title, desc, body) => { write(rel, layout(title, desc, '/' + rel, body)); };

  // ---- content --------------------------------------------------------------------------------
  const entriesDir = join(process.cwd(), 'content', 'published');
  const entries = existsSync(entriesDir)
    ? readdirSync(entriesDir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(entriesDir, f), 'utf8'))).sort((a, b) => a.title.localeCompare(b.title))
    : [];
  const hasPic = (e) => e.imageTier === 'game-image' || e.imageTier === 'community-image';
  const entities = entries.filter(hasPic);
  const notes = entries.filter((e) => !hasPic(e));
  const byId = new Map(entries.map((e) => [e.id, e]));
  const usedBy = new Map();
  for (const e of entries) for (const i of e.images ?? []) {
    if (i.kind !== 'community') continue;
    const list = usedBy.get(i.file) ?? [];
    list.push(e.id);
    usedBy.set(i.file, list);
  }
  const communityRecords = (manifest.records ?? []).filter((r) => r.kind === 'community')
    .sort((a, b) => String(a.file).localeCompare(String(b.file)));
  const imgOf = (e) => {
    const imgs = e.images ?? [];
    if (e.imageTier === 'community-image') return imgs.find((i) => i.kind === 'community') ?? imgs.find((i) => i.kind === 'game') ?? imgs[0];
    return imgs.find((i) => i.kind === 'game') ?? imgs.find((i) => i.kind === 'community') ?? imgs[0];
  };
  const entryHref = (id) => (hasPic(byId.get(id) ?? {}) ? '/entries/' + id + '.html' : '/reference/notes/' + id + '.html');
  const oneLine = (e) => ((e.facts ?? [])[0]?.claim ?? e.summary ?? '');
  const whyOf = (because) => String(because ?? '').replace(/\s*\([^()]*\)\s*$/, '').trim();
  const card = (e) => {
    const img = imgOf(e);
    return '<a class="card" href="' + entryHref(e.id) + '">' +
      (img ? '<img loading="lazy" src="/' + esc(img.file) + '" alt="' + esc(img.alt?.en ?? '') + '" width="480" height="300">' : '') +
      '<span class="chip">' + esc(groupOf(e.category).name) + '</span>' +
      '<strong>' + esc(e.title) + '</strong><span class="dim">' + esc(oneLine(e)) + '</span></a>';
  };
  const noteRow = (e) => '<li><a href="/reference/notes/' + esc(e.id) + '.html">' + esc(e.title) + '</a> <span class="dim small">— note, no confirmed game picture yet</span></li>';

  let articles = [];
  try { articles = readdirSync(join(process.cwd(), 'content', 'articles')).filter((x) => x.endsWith('.json')).map((x) => JSON.parse(readFileSync(join(process.cwd(), 'content', 'articles', x), 'utf8'))).sort((a, b) => a.title.localeCompare(b.title)); } catch { /* none yet */ }
  let updates = [];
  try { updates = JSON.parse(readFileSync(join(process.cwd(), 'content', 'updates.json'), 'utf8')); } catch { /* none yet */ }
  let questions = {};
  try { questions = JSON.parse(readFileSync(join(process.cwd(), 'data', 'guide-questions.json'), 'utf8')); } catch { /* none yet */ }
  const playerUpdates = updates.filter((u) => !String(u.url ?? '').startsWith('/reference/'));

  // ---- home ------------------------------------------------------------------------------------
  const featured = (SITE.featured ?? []).map((id) => byId.get(id)).filter((e) => e && hasPic(e));
  const featuredList = (featured.length ? featured : entities).slice(0, 8);
  const questionCards = articles.filter((a) => questions[a.id]).slice(0, 6);
  const categoryArt = {
    threats: ['generated/icon-threats.png', 'Generated threat radar badge'],
    valuables: ['generated/icon-valuables.png', 'Generated salvage crate badge'],
    gear: ['generated/icon-gear.png', 'Generated gear scanner badge'],
    extraction: ['generated/icon-extraction.png', 'Generated extraction doorway badge'],
  };
  indexable('index.html', SITE.gameName + ' guide and reference', SITE.tagline + ' — a player-written reference built from what the game itself establishes.',
    '<section class="hero">\n<div class="heroText">\n' +
    '<p class="kicker">' + esc(SITE.versionBadge) + '</p>\n' +
    '<h1>' + esc(SITE.gameName) + ' — what is in the level, what it is worth and how you get out</h1>\n' +
    '<p class="lead">' + esc(SITE.tagline) + '. Every entry says what the game itself establishes, and nothing here is estimated.</p>\n' +
    '<form class="heroSearch" action="/search.html" method="get" role="search"><input type="search" name="q" placeholder="' + esc(SITE.searchPlaceholder) + '" aria-label="Search this site"><button type="submit">Search</button></form>\n' +
    '<p class="ctas"><a class="btn primary" href="/entries/">Start here</a> <a class="btn" href="/entities/">Browse entities</a> <a class="btn" href="/articles/">Read the guides</a></p>\n' +
    '</div>\n<figure class="heroArt"><img src="/' + esc(SITE.heroImage) + '" alt="' + esc(SITE.heroAlt) + '" width="1600" height="533"><figcaption class="dim small">Original interface artwork for this wiki.</figcaption></figure>\n</section>\n' +
    '<section class="block"><div class="sectionHead"><div><p class="kicker">Explore the wiki</p><h2>R.E.P.O. survival guide</h2></div><a href="/guide.html">View all guides &rarr;</a></div>\n<div class="categoryRail">' +
      [['threats', 'Threats', entities.filter((e) => groupOf(e.category).key === 'monsters').length + ' verified threat references.', '/entities/monsters.html', '◈'],
        ['valuables', 'Valuables', 'Know what is worth carrying and what slows a run.', '/entities/valuables.html', '▣'],
        ['gear', 'Gear', 'Plan equipment for your next run.', '/entities/gear.html', '⌁'],
        ['extraction', 'Extraction', 'Use a clean route and a fallback call.', '/entities/extraction.html', '↗']]
        .map(([key, title, copy, href, glyph]) => '<a class="categoryTile" href="' + href + '"><img class="categoryIcon" src="/' + categoryArt[key][0] + '" alt="' + categoryArt[key][1] + '"><span class="categoryGlyph">' + glyph + '</span><strong>' + title + '</strong><span>' + copy + '</span></a>').join('') +
    '</div></section>\n' +
    '<section class="block">\n<h2>Popular entities</h2>\n<p class="dim">A curated starting set of monsters, each with a clear picture of what it looks like.</p>\n<div class="grid">' + featuredList.map(card).join('') + '</div>\n<p><a href="/entities/">All entities by part of the run &rarr;</a></p>\n</section>\n' +
    '<section class="block">\n<h2>The question you probably have</h2>\n<div class="qgrid">' + questionCards.map((a) =>
      '<a class="qcard" href="/articles/' + esc(a.id) + '.html"><strong>' + esc(questions[a.id]) + '</strong><span class="dim">' + esc(a.title) + '</span></a>').join('') +
    '</div>\n<p><a href="/articles/">All guides &rarr;</a></p>\n</section>\n' +
    '<section class="block">\n<h2>Latest updates</h2>\n' + (playerUpdates.length
      ? '<ul class="updates">' + playerUpdates.slice(0, 6).map((u) => '<li><span class="when">' + esc(u.date) + '</span> <a href="' + esc(u.url) + '">' + esc(u.title) + '</a> <span class="dim small">' + esc(u.kind ?? '') + '</span></li>').join('') + '</ul>'
      : '<p class="dim">No update notes yet.</p>') +
    '\n<p><a href="/updates.html">All updates &rarr;</a></p>\n</section>\n' +
    '<section class="block">\n<h2>Where the pictures and facts come from</h2>\n' +
    '<p>Most pictures are taken from a local copy of the game itself, recorded with the asset they came from. Where no game picture could be confirmed, the entry carries a community picture from the R.E.P.O. Fandom wiki under CC-BY-SA 4.0, credited on the entry and on the <a href="/credits.html">image credits</a> page; a diagram drawn for this site is always labelled as a diagram and is never passed off as a screenshot. Facts are read from the game\'s own files, not from a wiki or a forum. The build this site documents is <strong>' + esc(inv.version ?? 'unknown') + '</strong>.</p>\n' +
    '<p class="dim small">The raw identifiers, tables and extraction notes are kept in a technical reference, reachable from the footer of every page and kept out of search engines on purpose.</p>\n</section>\n');

  // ---- game guide ------------------------------------------------------------------------------
  indexable('guide.html', 'Game guide', 'How a run works in R.E.P.O., and what to do first.',
    '<h1>Game guide</h1><p class="lead">A short path through a run, with a link to the entries behind each step.</p>\n' +
    '<h2>1. Get in and read the level</h2><p>What the level holds and where the way out is: <a href="/entities/maps.html">maps and levels</a>.</p>\n' +
    '<h2>2. Work out what is after you</h2><p>Monsters, how they move and how to read them: <a href="/entities/monsters.html">monsters</a>.</p>\n' +
    '<h2>3. Find what is worth carrying</h2><p>Valuables, including the ones that fight back: <a href="/entities/valuables.html">valuables</a>.</p>\n' +
    '<h2>4. Carry it, or fight for it</h2><p>Gear, weapons and the physics of hauling: <a href="/entities/gear.html">gear</a> and <a href="/entities/weapons.html">weapons</a>.</p>\n' +
    '<h2>5. Get out and spend it</h2><p>Extraction, the shop and upgrades: <a href="/entities/extraction.html">extraction and the shop</a>.</p>\n' +
    '<h2>How to use this site</h2><p>Use the search box, browse <a href="/entities/">entities by part of the run</a>, or read a <a href="/articles/">guide</a> that walks through one job from start to finish. Pictures come from the game where one exists; otherwise a community picture is credited, and a diagram is always labelled as a diagram.</p>');

  // ---- entity hub and category pages ------------------------------------------------------------
  indexable('entities/index.html', 'Entities', 'Every part of the run this site documents, with pictures taken from the game or credited to the community wiki.',
    '<h1>Entities</h1><p class="lead">Browse by what you are dealing with in a run. Each entry says what the game itself establishes, and carries a picture: from the game where one exists, otherwise a credited community picture.</p>\n' +
    '<div class="grid">' + CATEGORIES.map((c) => {
      const list = entities.filter((e) => groupOf(e.category).key === c.key);
      const cover = list.map(imgOf).filter(img => img && !img.file.includes('texture'))[0] || list.map(imgOf).find(Boolean);
      if (!list.length) return '';
      return '<a class="card" href="/entities/' + c.key + '.html">' +
        (cover ? '<img loading="lazy" src="/' + esc(cover.file) + '" alt="' + esc(cover.alt?.en ?? '') + '" width="480" height="300">' : '') +
        '<strong>' + esc(c.name) + '</strong><span class="dim">' + esc(c.blurb) + '</span>' +
        '<span class="chip">' + list.length + ' entries</span></a>';
    }).join('') + '</div>\n' +
    (notes.length ? '<p class="dim small">' + notes.length + ' further subjects exist only as notes so far, because no picture has been confirmed for them. They are listed on their category page and kept out of search engines.</p>' : '<p class="dim small">Every published subject has a picture. The technical reference keeps the raw identifiers and extraction notes out of search engines on purpose.</p>'));
  for (const c of CATEGORIES) {
    const list = entities.filter((e) => groupOf(e.category).key === c.key);
    const onlyNotes = notes.filter((e) => groupOf(e.category).key === c.key);
    if (!list.length && !onlyNotes.length) continue;
    const cover = list.map(imgOf).filter(img => img && !img.file.includes('texture'))[0] || list.map(imgOf).find(Boolean);
    indexable('entities/' + c.key + '.html', c.name + ' in ' + SITE.gameName, c.blurb + ' ' + list.map((e) => e.title).join(', ') + '.',
      '<h1>' + esc(c.name) + '</h1><p class="lead">' + esc(c.blurb) + '</p>\n' +
      (cover ? '<figure class="banner"><img src="/' + esc(cover.file) + '" alt="' + esc(cover.alt?.en ?? '') + '" width="900" height="380"><figcaption class="dim small">' + captionFor(cover) + '</figcaption></figure>' : '') +
      (list.length ? '<div class="filter"><label for="f">Filter ' + esc(c.name.toLowerCase()) + '</label> <input id="f" type="search" placeholder="Type a word" autocomplete="off"> <span id="count" class="dim small"></span></div>\n' +
      '<div class="grid" id="cards">' + list.map(card).join('') + '</div>\n' : '') +
      (onlyNotes.length ? '<section class="block notes"><h2>Notes without a confirmed picture</h2><p class="dim">These subjects rest on the same verified facts, but no picture from the game has been confirmed for them yet, so they are notes rather than finished entries.</p><ul>' + onlyNotes.map(noteRow).join('') + '</ul></section>' : '') +
      '<p><a href="/entities/">Back to all entities</a></p>\n' +
      '<script>var f=document.getElementById("f");if(f){var cards=Array.prototype.slice.call(document.querySelectorAll("#cards .card")),c=document.getElementById("count");' +
      'var run=function(){var q=f.value.trim().toLowerCase(),n=0;cards.forEach(function(el){var hit=!q||el.textContent.toLowerCase().indexOf(q)>=0;el.style.display=hit?"":"none";if(hit)n++;});c.textContent=n+" shown";};' +
      'f.addEventListener("input",run);run();}</script>');
  }

  // ---- entities and notes ----------------------------------------------------------------------
  for (const e of entities) {
    const img = imgOf(e);
    const related = (e.related ?? []).filter((id) => byId.has(id));
    indexable('entries/' + e.id + '.html', e.title, e.summary,
      '<article class="entry">\n' +
      (img ? '<figure class="heroimg"><img src="/' + esc(img.file) + '" alt="' + esc(img.alt?.en ?? '') + '" title="' + esc(img.alt?.zh ?? '') + '" width="900" height="520"><figcaption class="dim small">' + captionFor(img) + '</figcaption></figure>' : '') +
      '<p class="kicker">' + esc(groupOf(e.category).name) + ' · ' + esc(SITE.versionBadge) + '</p>\n<h1>' + esc(e.title) + '</h1>\n' +
      '<p class="oneline">' + esc(oneLine(e)) + '</p>\n<p class="lead">' + esc(e.summary) + '</p>\n' +
      '<aside class="facts"><h2>At a glance</h2><dl>' +
      '<dt>Part of the run</dt><dd><a href="/entities/' + groupOf(e.category).key + '.html">' + esc(groupOf(e.category).name) + '</a></dd>' +
      '<dt>Picture</dt><dd>' + (img ? (img.kind === 'community' ? 'Community picture from ' + esc(imageRecord(img)?.sourceName || 'R.E.P.O. Fandom Wiki') + (img.illustrative ? ' (illustrative)' : '') : 'Game asset') : 'none') + '</dd>' +
      '<dt>Documented build</dt><dd>' + esc(inv.version ?? 'unknown') + '</dd>' +
      '<dt>Related entries</dt><dd>' + related.length + '</dd>' +
      '</dl></aside>\n' +
      '<h2>What the game establishes</h2><ul class="verified">' + (e.facts ?? []).map((f) => '<li>' + esc(f.claim) + ' <span class="dim small">(checked against the game\'s own files)</span></li>').join('') + '</ul>\n' +
      '<h2>In play</h2>' + (e.body ?? []).map((p) => '<p>' + esc(p) + '</p>').join('') + '\n' +
      (related.length ? '<h2>Related</h2><div class="grid">' + related.map((id) => card(byId.get(id))).join('') + '</div>' : '') +
      '<h2>Version and sources</h2><p class="dim small">' + esc((e.sources ?? []).join(' ')) + ' Documented build: ' + esc(inv.version ?? 'unknown') + '.</p>\n' +
      '</article>');
  }
  indexable('entries/index.html', 'Start here', 'How to use this site, and where to begin with a run.',
    '<h1>Start here</h1><p class="lead">This site is a player-written reference for ' + esc(SITE.gameName) + '. It does not try to be a full wiki: every entry states what the game itself establishes, and says plainly when something has not been verified.</p>\n' +
    '<h2>The four things you can do</h2><ul>' +
    '<li><strong>Browse <a href="/entities/">entities</a></strong> by the part of the run you are dealing with.</li>' +
    '<li><strong>Follow the <a href="/guide.html">game guide</a></strong> through a run.</li>' +
    '<li><strong>Read a <a href="/articles/">guide</a></strong> that walks through one job from start to finish.</li>' +
    '<li><strong>Search</strong> from the box at the top of any page.</li></ul>\n' +
    '<h2>What the pictures are</h2><p>Each entry says which kind of picture it carries: a game asset, a credited community picture from the R.E.P.O. Fandom wiki, or an original diagram. Community pictures are listed on the <a href="/credits.html">image credits</a> page.</p>\n' +
    '<h2>What we will never do</h2><p>We do not print a number we could not verify, we do not fill a gap with a guess, and a diagram is always labelled as a diagram.</p>');
  for (const e of notes) {
    const img = imgOf(e);
    reference('reference/notes/' + e.id + '.html', e.title + ' (note)', e.summary,
      '<h1>' + esc(e.title) + '</h1>\n<p class="note"><strong>No confirmed picture from the game yet.</strong> This subject is kept as a note for now: the facts below are verified against the game\'s own files, but no image has been confirmed for it, so it is not published as a finished entry and is kept out of search engines.</p>\n' +
      (img ? '<figure><img src="/' + esc(img.file) + '" alt="' + esc(img.alt?.en ?? '') + '" width="720" height="420"><figcaption class="dim small">' + esc(img.disclaimer ?? 'Original diagram drawn for this site. It is not a screenshot of the game.') + '</figcaption></figure>' : '') +
      '<h2>What the game establishes</h2><ul class="verified">' + (e.facts ?? []).map((f) => '<li>' + esc(f.claim) + '</li>').join('') + '</ul>\n' +
      '<h2>In play</h2>' + (e.body ?? []).map((p) => '<p>' + esc(p) + '</p>').join('') + '\n' +
      '<p><a href="/entities/">Back to the entities</a> · <a href="/reference/">Technical reference</a></p>');
  }
  reference('reference/notes/index.html', 'Notes', 'Subjects waiting for a confirmed picture from the game.',
    '<h1>Notes</h1><p class="lead">These subjects are documented from the game\'s own files, but no picture has been confirmed for them yet, so they are notes rather than finished entries.</p><ul>' +
    notes.map(noteRow).join('') + '</ul><p><a href="/reference/">Technical reference</a></p>');

  // ---- guides ------------------------------------------------------------------------------------
  for (const a of articles) {
    const related = (a.relatedEntities ?? []).filter((id) => byId.has(id));
    indexable('articles/' + a.id + '.html', a.title, a.target,
      '<article class="entry"><p class="kicker">Guide</p>\n<h1>' + esc(a.title) + '</h1>\n<p class="lead">' + esc(a.target) + '</p>\n' +
      '<h2>Applies to</h2><p class="dim">' + esc(a.version ?? SITE.versionBadge) + '</p>\n' +
      '<h2>Before you start</h2><ul>' + (a.prerequisites ?? []).map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul>\n' +
      '<h2>Steps</h2><ol class="steps">' + (a.steps ?? []).map((s) => '<li><strong>' + esc(s.do) + '</strong><br><span class="dim small">' + esc(whyOf(s.because)) + '</span></li>').join('') + '</ol>\n' +
      '<h2>Common mistakes</h2><ul>' + (a.commonMistakes ?? []).map((m) => '<li>' + esc(m) + '</li>').join('') + '</ul>\n' +
      (related.length ? '<h2>Related entries</h2><div class="grid">' + related.map((id) => card(byId.get(id))).join('') + '</div>' : '') +
      '<h2>Sources</h2><p class="dim small">' + esc((a.sources ?? []).join(' ')) + '</p></article>');
  }
  indexable('articles/index.html', 'Guides', 'Step-by-step guides for a run, each grounded in what the game itself establishes.',
    '<h1>Guides</h1><p class="lead">Each guide has a goal, the build it applies to, what you need first, the steps and the mistakes people make. Every step says why it works.</p>\n' +
    '<div class="grid">' + articles.map((a) => '<a class="card qcard" href="/articles/' + esc(a.id) + '.html">' +
      (questions[a.id] ? '<strong>' + esc(questions[a.id]) + '</strong><span>' + esc(a.title) + '</span>' : '<strong>' + esc(a.title) + '</strong>') +
      '<span class="dim">' + esc(a.target) + '</span></a>').join('') + '</div>');

  // ---- tools and updates -------------------------------------------------------------------------
  indexable('tools/index.html', 'Tools', 'Search boxes and checkers for looking something up on this site.',
    '<h1>Tools</h1><p class="lead">The tools here run in your browser; nothing you type is sent anywhere.</p>\n<div class="grid">' +
    '<a class="card" href="/search.html"><strong>Search the wiki</strong><span class="dim">Find monsters, valuables, gear, guides and pages in the player index.</span></a>' +
    '<a class="card" href="/reference/tool.html"><strong>Field lookup</strong><span class="dim">Ask which class declares a field; technical reference only.</span></a>' +
    '<a class="card" href="/articles/"><strong>Guides</strong><span class="dim">Step-by-step write-ups for one job at a time.</span></a>' +
    '</div><p class="dim small">These utilities report what the game\'s files contain. They are not part of the player reference and carry no advice.</p>');
  indexable('updates.html', 'Updates', 'What has been added to this site, newest first.',
    '<h1>Updates</h1><p class="lead">What has been added, newest first. Entries are added only when a fact has been checked against the game or a picture confirmed.</p>\n' +
    (playerUpdates.length ? '<ul class="updates">' + playerUpdates.map((u) => '<li><span class="when">' + esc(u.date) + '</span> <a href="' + esc(u.url) + '">' + esc(u.title) + '</a> <span class="dim small">' + esc(u.kind ?? '') + '</span></li>').join('') + '</ul>' : '<p class="dim">No update notes yet.</p>') +
    '<p class="dim small">Notes for subjects that have no confirmed picture yet are listed in the technical reference, which is reachable from the footer.</p>');

  // ---- evidence layer (unchanged content, footer only) --------------------------------------------
  const classes = (inv.classes ?? []).slice().sort((a, b) => b.written - a.written);
  const used = new Set();
  const slugs = classes.map((c) => { const base = slug(c.name); let s = base, n = 2; while (used.has(s)) s = base + '-' + n++; used.add(s); return s; });
  reference('reference/collection.html', 'All names', 'Every P0 class with the fields the game writes.',
    '<h1>P0 classes <span class="dim">(' + classes.length + ')</span></h1><p class="dim">Reference pages. Each is marked noindex and kept out of the sitemap.</p><table><thead><tr><th>Name</th><th>Base</th><th>Written</th></tr></thead><tbody>' +
    classes.map((c, i) => '<tr><td><a href="/entity/' + slugs[i] + '.html">' + esc(c.name) + '</a></td><td class="mono dim">' + esc(c.base ?? '-') + '</td><td>' + c.written + '</td></tr>').join('') + '</tbody></table>');
  {
    const enemyEnums = (inv.enums ?? []).filter((e) => /enemy|state|type/i.test(e.name)).slice(0, 8);
    const enemyClasses = classes.filter((c) => /^Enemy/.test(c.name)).slice(0, 80);
    reference('reference/enemies.html', 'Enemies - types, states and classes', 'The enemy types and states the game defines.',
      '<h1>Enemies</h1><div class="note">The enum values below are read from the game\'s own assembly, so they are the game\'s own numbers. Per-instance numbers such as health and damage are listed only where this build decoded them; everything else is unknown rather than guessed.</div>' +
      enemyEnums.map((e) => '<h2 class="mono">' + esc(e.name) + ' <span class="dim">(' + e.members.length + ' values)</span></h2><table><tbody>' +
        e.members.map((m) => '<tr><td class="mono">' + esc(m.name) + '</td><td class="mono dim">' + m.value + '</td></tr>').join('') + '</tbody></table>').join('') +
      (enemyClasses.length ? '<h2>Enemy classes <span class="dim">(' + enemyClasses.length + ')</span></h2><table><thead><tr><th>Name</th><th>Written fields</th></tr></thead><tbody>' +
        enemyClasses.map((c) => '<tr><td class="mono">' + esc(c.name) + '</td><td>' + c.written + '</td></tr>').join('') + '</tbody></table>' : ''));
  }
  for (let ci = 0; ci < classes.length; ci++) {
    const c = classes[ci];
    reference('entity/' + slugs[ci] + '.html', c.name + ' - reference', c.name + ': ' + c.written + ' written fields read from the game assembly.',
      '<h1 class="mono">' + esc(c.name) + '</h1><div class="note">This is a <strong>reference page</strong>, marked noindex: it lists what the class declares and which of it the game writes at runtime. It is material for checking our entries, not a player-facing answer.</div>' +
      '<p class="dim">namespace <span class="mono">' + esc(c.namespace || '-') + '</span> · base <span class="mono">' + esc(c.base || '-') + '</span> · declared ' + c.declared + ' · written ' + c.written + '</p>' +
      '<p class="dim small">Read from <span class="mono">' + esc(inv.source?.assembly ?? '') + '</span> · game version ' + esc(inv.version ?? '') + '</p>' +
      '<h2>Written fields</h2><table><thead><tr><th>Field</th><th>Type</th><th>Kind</th><th>Confidence</th><th>Value</th></tr></thead><tbody>' +
      c.fields.map((f) => '<tr><td class="mono">' + esc(f.name) + '</td><td class="mono dim">' + esc(f.type) + '</td><td class="dim">' + esc(f.kind) + '</td><td class="dim">' + esc(f.confidence ?? '-') + '</td><td class="mono dim">' + esc(f.value === null || f.value === undefined ? 'unknown' : String(f.value)) + '</td></tr>').join('') +
      '</tbody></table>');
  }
  if ((inv.enums ?? []).length) {
    reference('reference/enums.html', 'Enums', 'Enumerations and their values, read from the game assembly.',
      '<h1>Enums <span class="dim">(' + inv.enums.length + ')</span></h1>' + inv.enums.map((e) =>
        '<h2 class="mono">' + esc(e.name) + ' <span class="dim">' + e.members.length + ' members</span></h2><table><tbody>' +
        e.members.map((m) => '<tr><td class="mono">' + esc(m.name) + '</td><td class="mono dim">' + m.value + '</td></tr>').join('') + '</tbody></table>').join(''));
  }
  {
    const instPath = inventoryPath.replace('p0-inventory.json', 'p0-instances.json');
    let inst = null;
    try { inst = JSON.parse(readFileSync(instPath, 'utf8')); } catch (e) { inst = null; }
    const list = (inst && inst.instances) ? inst.instances : [];
    const grouped = {};
    for (const it of list) { if (!grouped[it.class]) grouped[it.class] = []; grouped[it.class].push(it); }
    const names = Object.keys(grouped);
    const rows = names.slice(0, 40).map((cls) => {
      const items = grouped[cls];
      return '<h2 class="mono">' + esc(cls) + ' <span class="dim">(' + items.length + ')</span></h2>' +
        '<table><thead><tr><th>Object</th><th>Decoded fields</th></tr></thead><tbody>' +
        items.slice(0, 20).map((x) => '<tr><td class="mono dim">' + esc(x.pathId) + '</td><td class="mono">' + esc((x.values || []).map((v) => v.name + '=' + String(v.value)).join('  ')) + '</td></tr>').join('') + '</tbody></table>';
    }).join('');
    reference('reference/values.html', 'Decoded values', 'Field values decoded from the game\'s own files, one row per object.',
      '<h1>Decoded values <span class="dim">(' + list.length + ' objects)</span></h1>' +
      '<div class="note">Each row is one object read out of the game\'s own files. Its class was accepted only because the measured layout consumed that object\'s payload exactly, so these are the game\'s values rather than estimates.</div>' +
      (list.length === 0 ? '<p class="dim">No object in this build decoded yet.</p>' : rows + (names.length > 40 ? '<p class="dim">Showing 40 of ' + names.length + ' classes.</p>' : '')));
  }
  const searchItems = buildSearchIndex(entries, articles);
  const searchKinds = ['All', ...new Set(searchItems.map((x) => x.k))];
  indexable('search.html', 'Search the wiki', 'Find monsters, valuables, gear, guides and pages from the R.E.P.O. wiki.',
    '<section class="searchPage">' +
    '<p class="kicker">Field database // player index</p><h1>Search the wiki</h1>' +
    '<p class="lead">Find a monster, valuable, gear item, guide or page. Everything here is built from the published entries and guides; the technical field tables live in the reference layer.</p>' +
    '<div class="searchbox"><input id="q" type="search" placeholder="Try Oogly, battery, cart, extraction…" autocomplete="off" aria-label="Search the wiki"><button type="button" id="clear">Clear</button></div>' +
    '<div class="filters" id="filters" role="group" aria-label="Filter results"></div>' +
    '<p id="status" class="dim" aria-live="polite">Loading search index…</p><div id="results" class="results"></div>' +
    '<noscript><p class="note">Search runs in your browser. Enable JavaScript to search the wiki.</p></noscript>' +
    '<script>var S=' + JSON.stringify(searchItems).replace(/</g, '\\u003c') + ';' +
    'var Q=document.getElementById("q"),R=document.getElementById("results"),F=document.getElementById("filters"),ST=document.getElementById("status");' +
    'var K=' + JSON.stringify(searchKinds) + ',A="All";' +
    'K.forEach(function(k){var b=document.createElement("button");b.type="button";b.textContent=k;b.onclick=function(){A=k;draw();};F.appendChild(b);});' +
    'document.getElementById("clear").onclick=function(){Q.value="";A="All";draw();Q.focus();};' +
    'function draw(){var v=Q.value.trim().toLowerCase();var rows=S.filter(function(x){return (A==="All"||x.k===A)&&(!v||((x.t+" "+x.k+" "+x.c+" "+x.s).toLowerCase().indexOf(v)>=0));});' +
    'ST.textContent=(v||A!=="All")?(rows.length+" result(s)"):("Browse "+S.length+" pages or type to search.");' +
    'Array.prototype.forEach.call(F.children,function(b){b.className=b.textContent===A?"on":"";});' +
    'R.innerHTML="";if(!rows.length){var e=document.createElement("div");e.className="empty";e.textContent="No matching page. Try a monster, valuable, gear item or guide name.";R.appendChild(e);return;}' +
    'rows.slice(0,30).forEach(function(x){var a=document.createElement("a");a.className="result";a.href=x.u;var h=document.createElement("h2");h.textContent=x.t;var m=document.createElement("div");m.className="meta";m.textContent=x.k+(x.c&&x.c!==x.k?" // "+x.c:"");var p=document.createElement("p");p.textContent=x.s;a.appendChild(h);a.appendChild(m);a.appendChild(p);R.appendChild(a);});}' +
    'var pre=new URLSearchParams(location.search).get("q");if(pre){Q.value=pre;}Q.addEventListener("input",draw);draw();</script>' +
    '</section>');
  reference('reference/tool.html', 'Field lookup', 'Find which class declares a field.',
    '<h1>Field lookup</h1><p>Enter a field or type fragment; the tool searches the extracted field tables only, and never guesses a value.</p>' +
    '<p><input id="q" type="search" placeholder="field or type" autocomplete="off"> <span id="s" class="dim"></span></p><div id="o"></div>' +
    '<script>var F=' + JSON.stringify(lookupFields(inv, '', 200)) + ';var q=document.getElementById("q"),s=document.getElementById("s"),o=document.getElementById("o");' +
    'var draw=function(){var v=q.value.trim().toLowerCase();var rows=!v?F.slice(0,20):F.filter(function(x){return x.field.toLowerCase().indexOf(v)>=0||String(x.type).toLowerCase().indexOf(v)>=0});' +
    's.textContent=v?(rows.length+" match(es)"):"empty query - showing the first 20 indexed fields";' +
    'o.innerHTML=rows.slice(0,50).map(function(x){return "<div><span class=mono>"+x.field+"</span> <span class=dim>"+x.type+" - "+x.class+"</span></div>"}).join("")};q.addEventListener("input",draw);draw();</script>');
  reference('reference/sources.html', 'Sources', 'Where every number came from.',
    '<h1>Sources</h1><div class="note">Every <strong>value</strong> in this build traces to a file on the Windows machine that produced it; nothing numeric is estimated. <strong>Pictures</strong> are a separate layer: most are game assets, and some are community pictures from the R.E.P.O. Fandom wiki under CC-BY-SA 4.0, credited individually and on the <a href="/credits.html">image credits</a> page. Facts are never copied from a wiki.</div>' +
    '<h2>Assembly</h2><p class="mono">' + esc(inv.source?.assembly ?? '') + '</p><h2>Extractor</h2><p class="mono">' + esc(inv.source?.extractor ?? '') + '</p>' +
    '<h2>Extracted at</h2><p class="mono">' + esc(inv.source?.extractedAt ?? '') + '</p><h2>Game version</h2><p>' + esc(inv.version ?? '') + '</p>' +
    '<h2>Per-field provenance</h2><p>' + esc(inv.provenance?.fields ?? 'source, version, checkedAt, confidence, value') + '</p>' +
    '<h2>Not extracted (unknown)</h2><p>' + esc(inv.provenance?.values ?? 'Per-field values are listed only where the object decoded; everything else is marked unknown.') + '</p>');
  reference('reference/index.html', 'Technical reference', 'Identifiers, tables and provenance for modders. Not indexed.',
    '<h1>Technical reference</h1><p class="lead">For modders and for checking our data. Deliberately kept out of search engines: it lists identifiers read from the game\'s files, which are useful to a modder but are not answers to a player\'s question.</p><ul>' +
    '<li><a href="/reference/collection.html">All names</a></li><li><a href="/reference/enemies.html">Enemy types and states</a></li><li><a href="/reference/enums.html">Enums</a></li>' +
    '<li><a href="/reference/values.html">Decoded values</a></li><li><a href="/search.html">Search the wiki</a></li><li><a href="/reference/tool.html">Field lookup</a></li><li><a href="/reference/sources.html">Sources and method</a></li>' +
    '<li><a href="/reference/notes/">Notes waiting for a confirmed picture</a></li></ul>' +
    '<p><a href="/entities/">Back to the player reference</a></p>');

  // ---- image credits -----------------------------------------------------------------------------
  indexable('credits.html', 'Image credits', 'Sources, authors and licences for the community pictures used on this site.',
    '<h1>Image credits</h1><p class="lead">Most pictures on this site are taken from a local copy of the game. Where no game picture could be confirmed, the entry uses a community picture from the R.E.P.O. Fandom wiki under CC-BY-SA 4.0; those pictures are credited here and on the entry that uses them.</p>' +
    '<p class="dim small">A community picture identifies a subject; it is not presented as this site\'s own artwork. Where the exact file page could not be recorded, the row is marked <strong>weak provenance</strong> and the source is the wiki itself. Diagram-only artwork is original to this site and is not listed here.</p>' +
    (communityRecords.length ? '<table><thead><tr><th>File</th><th>Used by</th><th>Source</th><th>Author</th><th>Licence</th></tr></thead><tbody>' +
      communityRecords.map((r) => {
        const page = safeUrl(r.sourcePage);
        const source = page ? '<a href="' + esc(page) + '" rel="nofollow noopener">' + esc(r.sourceName || 'R.E.P.O. Fandom Wiki') + '</a>' : esc(r.sourceName || 'R.E.P.O. Fandom Wiki');
        const entriesFor = (usedBy.get(r.file) ?? []).map((id) => '<a href="/entries/' + esc(id) + '.html">' + esc(id) + '</a>').join(', ');
        const licence = esc(r.license || 'CC-BY-SA-4.0');
        return '<tr><td class="mono small">' + esc(r.file) + '</td><td class="small">' + (entriesFor || '<span class="dim">not used</span>') + '</td><td class="small">' + source + (r.provenance === 'weak' ? ' <span class="dim">(weak provenance)</span>' : '') + '</td><td class="small">' + esc(r.author || 'R.E.P.O. Fandom Wiki contributors') + '</td><td class="small">' + licence + (safeUrl(r.licenseUrl) ? ' <a href="' + esc(r.licenseUrl) + '" rel="nofollow noopener">license</a>' : '') + '</td></tr>';
      }).join('') + '</tbody></table>' : '<p class="dim">No community pictures are used.</p>') +
    '<p class="dim small">Game pictures remain the property of the developer and are used only to identify the item they belong to. If you are a rights holder and want a picture removed, contact the address on the <a href="/contact.html">contact page</a>.</p>');

  // ---- legal ---------------------------------------------------------------------------------------
  indexable('about.html', 'About', 'About this site and how it is built.',
    '<h1>About</h1><p>This site is a player-written reference for ' + esc(SITE.gameName) + '. It is generated by a static build; there is no database behind it.</p>' +
    '<h2>Method</h2><p>No page on this site is hand-written from memory. Everything shown is produced by the build from the files listed on the <a href="/reference/sources.html">sources page</a>. When the build cannot read something, it says so.</p>' +
    '<h2>What is on which layer</h2><p>The player reference — entities, guides, the game guide and the tools — is what the site is for. Identifiers, tables and extraction notes are an evidence layer behind the <a href="/reference/">technical reference</a>, kept out of search engines on purpose.</p>');
  indexable('contact.html', 'Contact', 'How to report a wrong value.',
    '<h1>Contact</h1><p>Corrections are welcome. Report the page, the claim and what the game actually does; corrections that cannot be checked against the game files cannot be used.</p><p>There is no form and no server behind this site.</p>');
  indexable('disclaimer.html', 'Disclaimer', 'No affiliation; game images are used only to identify items.',
    '<h1>Disclaimer</h1><p>Not affiliated with, endorsed by, or sponsored by the game\'s developer or publisher. Game names and marks belong to their owners.</p>' +
    '<p>Some images are taken from the game to identify the item they belong to; those images remain the property of the developer. Some pictures are community images from the R.E.P.O. Fandom wiki under CC-BY-SA 4.0 and are credited on the entry and on the <a href="/credits.html">image credits</a> page. Diagrams drawn for this site are labelled as diagrams and are not screenshots. Community pictures are used to identify a subject, not to claim the game\'s artwork as this site\'s own.</p>');
  indexable('privacy.html', 'Privacy', 'No cookies, no tracking, no third-party requests.',
    '<h1>Privacy</h1><p>This static build sets no cookies, runs no analytics and makes no third-party requests. The search and lookup tools run entirely in your browser over data embedded in the page or fetched from this site.</p>');
  indexable('terms.html', 'Terms', 'Use of this site.',
    '<h1>Terms</h1><p>Provided as-is for personal reference. Data may change as the game patches; each build records the version it was read from.</p>');

  write('404.html', layout('Not found', 'Page not found.', '/404.html', '<h1>Page not found</h1><p>Try the <a href="/entities/">entities</a> or the search box at the top of the page.</p>').replace('content="index, follow"', 'content="noindex, follow"'));

  // ---- machine-readable ------------------------------------------------------------------------------
  // Old top-level addresses keep working: each is a noindex stub that points at the reference page now.
  const stub = (oldRel, newPath, title) => {
    const html = layout(title + ' (moved)', 'This page has moved into the technical reference.', '/' + oldRel,
      '<h1>' + esc(title) + '</h1><p class="note">This page has moved into the <a href="' + newPath + '">technical reference</a>. The address was kept so an old link still lands somewhere useful.</p>')
      .replace('content="index, follow"', 'content="noindex, follow"')
      .replace('<link rel="canonical" href="' + SITE.url + '/' + oldRel + '">', '<link rel="canonical" href="' + SITE.url + newPath + '">')
      .replace('<head>', '<head>\n<meta http-equiv="refresh" content="0; url=' + newPath + '">');
    write(oldRel, html);
  };
  for (const [oldRel, name, title] of [
    ['collection.html', 'collection', 'All names'], ['enemies.html', 'enemies', 'Enemy types and states'], ['enums.html', 'enums', 'Enums'],
    ['values.html', 'values', 'Decoded values'], ['tool.html', 'tool', 'Field lookup'], ['sources.html', 'sources', 'Sources'],
  ]) stub(oldRel, '/reference/' + name + '.html', title);

  const sitemapLastmod = new Date().toISOString().slice(0, 10);
  write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => '  <url><loc>' + u + '</loc><lastmod>' + sitemapLastmod + '</lastmod></url>\n').join('') + '</urlset>\n');
  write('robots.txt', 'User-agent: *\nAllow: /\nSitemap: ' + SITE.url + '/sitemap.xml\n');
  write('favicon.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="' + SITE.accent + '"/><circle cx="32" cy="30" r="13" fill="none" stroke="#0f1116" stroke-width="6"/></svg>' + String.fromCharCode(10));
  write('brand.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="' + esc(SITE.gameName) + '"><rect width="64" height="64" rx="14" fill="' + SITE.accent + '"/><circle cx="32" cy="30" r="13" fill="none" stroke="#0f1116" stroke-width="5"/><circle cx="32" cy="30" r="4" fill="#0f1116"/><path d="M20 50h24" stroke="#0f1116" stroke-width="5" stroke-linecap="round"/></svg>\n');

  write('style.css', themeCSS);

  // ---- assets -----------------------------------------------------------------------------------------
  let assetCount = 0;
  const mappedCount = { n: 0 };
  const copyDir = (src, rel) => {
    if (!existsSync(src)) return;
    for (const entry of readdirSync(src, { withFileTypes: true })) {
      const child = join(src, entry.name);
      const childRel = rel ? rel + '/' + entry.name : entry.name;
      if (entry.isDirectory()) { copyDir(child, childRel); continue; }
      if (entry.name === 'README.txt') continue;
      const dest = join(outDir, childRel);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, readFileSync(child));
      assetCount++;
      if (childRel.startsWith('mapped/')) mappedCount.n++;
    }
  };
  for (const root of ['web/assets', 'content/assets']) copyDir(join(process.cwd(), root), '');
  copyDir(join(process.cwd(), 'content/renders'), 'renders');
  const imagesRoot = join(process.cwd(), 'content', 'images');
  if (existsSync(imagesRoot)) {
    for (const entry of readdirSync(imagesRoot, { withFileTypes: true })) {
      if (entry.isDirectory()) copyDir(join(imagesRoot, entry.name), entry.name);
    }
  }
  return { pages: pages.size, urls: urls.length, outDir, schemaPages: [...pages.keys()].filter(isNoindexPage).length, assets: assetCount, mappedImages: mappedCount.n, entities: entities.length, notes: notes.length };
}

if (process.argv[1] && process.argv[1].endsWith('site.mjs')) {
  const inventory = process.env.REPO_INVENTORY || 'data/normalized/p0-inventory.json';
  const out = process.env.REPO_OUT || 'web/dist';
  if (!existsSync(inventory)) { console.error('missing inventory: ' + inventory); process.exit(2); }
  const r = build(inventory, out);
  console.log('[site] pages=' + r.pages + ' indexable=' + r.urls + ' schema(noindex)=' + r.schemaPages + ' out=' + r.outDir);
}
