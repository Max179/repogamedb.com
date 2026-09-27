#!/usr/bin/env node
/**
 * Static site generator (Windows-side build).
 *
 * Indexability policy, enforced here rather than hoped for:
 *   - a page whose content is only a class's schema (field names, no extracted values) is a reference, not an answer
 *     to a query a player typed. Those pages are emitted with `noindex, follow` and are NOT listed in sitemap.xml;
 *     they stay reachable and linked from the collection page.
 *   - the pages that answer a question (home, search, collection, enemies, guide, tool, sources, about, contact,
 *     disclaimer, privacy, terms) are indexable and listed.
 * Nothing is estimated: a value this build does not have is rendered as "unknown".
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const SITE = {
  name: 'R.E.P.O. Database',
  domain: 'repogamedb.com',
  url: 'https://repogamedb.com',
  tagline: 'Weapons, valuables, enemies and extraction data - read from the game files',
};

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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

export const NAV = [['/', 'Home'], ['/search.html', 'Search'], ['/collection.html', 'Classes'], ['/enemies.html', 'Enemies'],
  ['/guide.html', 'Guide'], ['/tool.html', 'Tool'], ['/sources.html', 'Sources'], ['/about.html', 'About'],
  ['/contact.html', 'Contact'], ['/disclaimer.html', 'Disclaimer'], ['/privacy.html', 'Privacy'], ['/terms.html', 'Terms']];

/** A schema page is a reference; it is generated and linked, but not offered to a search engine. */
/** A page that duplicates a query-answering page keeps its URL but is not indexed: the audit in round 76 found
 *  /tool.html sharing 98.8% of its main content with /search.html, so /tool.html is a noindex convenience page. */
export function isNoindexPage(path) { return isSchemaPage(path) || path === '/tool.html'; }

export function isSchemaPage(path) {
  return String(path).startsWith('/entity/');
}

function layout(title, description, path, body, inv) {
  const noindex = isNoindexPage(path);
  const nav = NAV.map(([h, txt]) => '<a href="' + h + '">' + txt + '</a>').join('');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc(title) + '</title><meta name="description" content="' + esc(description) + '">' +
    '<link rel="canonical" href="' + SITE.url + path + '">' +
    (noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow">') +
    '<link rel="alternate" hreflang="en" href="' + SITE.url + path + '">' +
    '<link rel="alternate" hreflang="x-default" href="' + SITE.url + path + '">' +
    '<meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(description) + '">' +
    '<meta property="og:url" content="' + SITE.url + path + '">' +
    '<style>:root{--bg:#0d1117;--fg:#e6edf3;--dim:#8b949e;--line:#21262d;--accent:#58a6ff}' +
    'body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.6 system-ui,Segoe UI,Roboto,sans-serif}' +
    'header,footer{border-bottom:1px solid var(--line);padding:14px 20px}footer{border-top:1px solid var(--line);border-bottom:0;color:var(--dim);font-size:13px}' +
    'main{max-width:1000px;margin:0 auto;padding:22px 20px}nav a{color:var(--accent);margin-right:14px;text-decoration:none;font-size:14px}' +
    'h1{font-size:26px;margin:6px 0 14px}h2{font-size:19px;margin-top:26px}table{border-collapse:collapse;width:100%;font-size:14px}' +
    'th,td{border-bottom:1px solid var(--line);text-align:left;padding:6px 8px}.mono{font-family:ui-monospace,Consolas,monospace}' +
    '.dim{color:var(--dim)}.note{border-left:3px solid var(--accent);padding:8px 12px;background:#161b22;margin:14px 0}</style></head><body>' +
    '<header><strong>' + esc(SITE.name) + '</strong><nav style="margin-top:8px">' + nav + '</nav></header><main>' + body + '</main>' +
    '<footer>Source: <span class="mono">' + esc(inv.source.assembly) + '</span> · Game version: ' + esc(inv.version) +
    ' · Extracted: ' + esc(inv.source.extractedAt) +
    ' · Confidence: read from the game&apos;s own assembly. Values not extracted are marked unknown - nothing is invented.<br>' +
    'Not affiliated with the game&apos;s developer. No game assets are redistributed.</footer></body></html>';
}

export function build(inventoryPath, outDir) {
  const inv = JSON.parse(readFileSync(inventoryPath, 'utf8'));
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(join(outDir, 'entity'), { recursive: true });
  const pages = new Map();
  const classes = (inv.classes ?? []).slice().sort((a, b) => b.written - a.written);
  const used = new Set();
  const slugs = classes.map((c) => {
    const base = slug(c.name);
    let s = base, n = 2;
    while (used.has(s)) s = base + '-' + n++;
    used.add(s);
    return s;
  });
  const write = (rel, html) => { const f = join(outDir, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, html, 'utf8'); pages.set('/' + rel, html); };

  write('index.html', layout(SITE.name + ' - ' + SITE.tagline, SITE.tagline, '/',
    '<h1>R.E.P.O. database</h1><div class="note">This build covers the <strong>schema layer</strong>: classes, the fields Unity writes and the game&apos;s own enums, extracted from <span class="mono">Assembly-CSharp.dll</span>. Per-field <em>values</em> are not extracted yet (the container is Unity 6 / SerializedFile v22) and are marked <strong>unknown</strong>. The class reference pages are deliberately <span class="mono">noindex</span>: they are a reference, not an answer.</div>' +
    '<p>' + inv.totals.types + ' types · ' + inv.totals.fields + ' fields · ' + classes.length + ' P0 classes · ' + (inv.enums ?? []).length + ' enums.</p>' +
    '<p><a href="/collection.html">Browse classes</a> · <a href="/enemies.html">Enemies</a> · <a href="/tool.html">Field lookup tool</a> · <a href="/sources.html">Sources</a></p>', inv));

  write('collection.html', layout('P0 classes', 'Every P0 class with the fields Unity writes.', '/collection.html',
    '<h1>P0 classes <span class="dim">(' + classes.length + ')</span></h1><p class="dim">Reference pages. Each is marked noindex and kept out of the sitemap.</p><table><thead><tr><th>Class</th><th>Base</th><th>Written fields</th></tr></thead><tbody>' +
    classes.map((c, i) => '<tr><td><a href="/entity/' + slugs[i] + '.html">' + esc(c.name) + '</a></td><td class="mono dim">' + esc(c.base ?? '-') + '</td><td>' + c.written + '</td></tr>').join('') +
    '</tbody></table>', inv));

  // ---- a page that answers a question, from verified enum values
  {
    const enemyEnums = (inv.enums ?? []).filter((e) => /enemy|state|type/i.test(e.name)).slice(0, 8);
    const enemyClasses = classes.filter((c) => /^Enemy/.test(c.name)).slice(0, 80);
    const body = '<h1>Enemies</h1>' +
      '<div class="note">The enum values below are read from the game&apos;s own assembly, so they are the game&apos;s own numbers. Per-instance numbers (health, damage, speed) are <strong>unknown</strong> in this build and are not estimated.</div>' +
      enemyEnums.map((e) => '<h2 class="mono">' + esc(e.name) + ' <span class="dim">(' + e.members.length + ' values)</span></h2><table><tbody>' +
        e.members.map((m) => '<tr><td class="mono">' + esc(m.name) + '</td><td class="mono dim">' + m.value + '</td></tr>').join('') + '</tbody></table>').join('') +
      (enemyClasses.length ? '<h2>Enemy classes <span class="dim">(' + enemyClasses.length + ')</span></h2><table><thead><tr><th>Class</th><th>Written fields</th></tr></thead><tbody>' +
        enemyClasses.map((c) => '<tr><td class="mono">' + esc(c.name) + '</td><td>' + c.written + '</td></tr>').join('') + '</tbody></table>' : '');
    write('enemies.html', layout('Enemies - types, states and classes', 'The enemy types and states the game defines, with the verified enum values, and the enemy classes the build declares.', '/enemies.html', body, inv));
  }

  for (let ci = 0; ci < classes.length; ci++) {
    const c = classes[ci];
    write('entity/' + slugs[ci] + '.html', layout(c.name + ' - class reference', c.name + ': ' + c.written + ' written fields read from the game assembly.', '/entity/' + slugs[ci] + '.html',
      '<h1 class="mono">' + esc(c.name) + '</h1><div class="note">This is a <strong>class reference</strong>, marked noindex: it lists what the class declares and which of it Unity writes. Field <em>values</em> are unknown in this build (Unity 6 / SerializedFile v22 not parsed yet).</div>' +
      '<p class="dim">namespace <span class="mono">' + esc(c.namespace || '-') + '</span> · base <span class="mono">' + esc(c.base || '-') + '</span> · declared ' + c.declared + ' · Unity writes ' + c.written + '</p>' +
      '<h2>Written fields</h2><table><thead><tr><th>Field</th><th>Type</th><th>Kind</th><th>Confidence</th><th>Value</th></tr></thead><tbody>' +
      c.fields.map((f) => '<tr><td class="mono">' + esc(f.name) + '</td><td class="mono dim">' + esc(f.type) + '</td><td class="dim">' + esc(f.kind) + '</td><td class="dim">' + esc(f.confidence ?? 'unknown') + '</td><td class="dim">' + (f.value == null ? 'unknown' : esc(String(f.value))) + '</td></tr>').join('') +
      '</tbody></table>', inv));
  }

  if ((inv.enums ?? []).length) {
    write('enums.html', layout('Enums', 'Enumerations and their values, read from the game assembly.', '/enums.html',
      '<h1>Enums <span class="dim">(' + inv.enums.length + ')</span></h1>' + inv.enums.map((e) =>
        '<h2 class="mono">' + esc(e.name) + ' <span class="dim">' + e.members.length + ' members</span></h2><table><tbody>' +
        e.members.map((m) => '<tr><td class="mono">' + esc(m.name) + '</td><td class="mono dim">' + m.value + '</td></tr>').join('') + '</tbody></table>').join(''), inv));
  }

  // Values decoded from the games' own bytes, one row per object. Kept plain (no type annotations) because this
  // file is checked as JavaScript.
  {
    var instPath = inventoryPath.replace('p0-inventory.json', 'p0-instances.json');
    var inst = null;
    try { inst = JSON.parse(readFileSync(instPath, 'utf8')); } catch (e) { inst = null; }
    var list = (inst && inst.instances) ? inst.instances : [];
    var grouped = {};
    for (var gi = 0; gi < list.length; gi++) {
      var it = list[gi];
      if (!grouped[it.class]) grouped[it.class] = [];
      grouped[it.class].push(it);
    }
    var names = Object.keys(grouped);
    var rows = names.slice(0, 40).map(function (cls) {
      var items = grouped[cls];
      return '<h2 class="mono">' + esc(cls) + ' <span class="dim">(' + items.length + ')</span></h2>' +
        '<table><thead><tr><th>Object</th><th>Decoded fields</th></tr></thead><tbody>' +
        items.slice(0, 20).map(function (x) {
          var vals = (x.values || []).map(function (v) { return v.name + '=' + String(v.value); }).join('  ');
          return '<tr><td class="mono dim">' + esc(x.pathId) + '</td><td class="mono">' + esc(vals) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }).join('');
    var vbody = '<h1>Decoded values <span class="dim">(' + list.length + ' objects)</span></h1>' +
      '<div class="note">Each row is one object read out of the game&apos;s own files. Its class was accepted only because the measured layout consumed that object&apos;s payload exactly, so these are the game&apos;s values rather than estimates. A field a decode did not produce is simply absent.</div>' +
      (list.length === 0
        ? '<p class="dim">No object in this build decoded yet: the classes present are either not in this assembly or hold field types whose sizes are not measured. Everything else on this site says <span class="mono">unknown</span> rather than guessing.</p>'
        : rows + (names.length > 40 ? '<p class="dim">Showing 40 of ' + names.length + ' classes.</p>' : ''));
    write('values.html', layout('Decoded values', 'Field values decoded from the games own files, one row per object.', '/values.html', vbody, inv));
  }

  write('search.html', layout('Search', 'Search classes and fields.', '/search.html',
    '<h1>Search</h1><p class="dim">Client-side over ' + inv.totals.fields + ' fields. No network requests.</p>' +
    '<input id="q" placeholder="field or class" style="width:100%;padding:10px;background:#0d1117;color:var(--fg);border:1px solid var(--line)">' +
    '<p id="status" class="dim">Type to search.</p><ul id="out"></ul>' +
    '<script>var F=' + JSON.stringify(lookupFields(inv, '', 200)) + ';var q=document.getElementById("q"),o=document.getElementById("out"),s=document.getElementById("status");' +
    'var draw=function(){var v=q.value.trim().toLowerCase();var r=!v?F.slice(0,50):F.filter(function(x){return x.field.toLowerCase().indexOf(v)>=0||x.class.toLowerCase().indexOf(v)>=0});' +
    's.textContent=v?(r.length+" match(es)"):("Showing first 50 of "+F.length+" indexed fields");' +
    'o.innerHTML=r.slice(0,50).map(function(x){return "<li>"+x.class+" <span class=dim>"+x.field+": "+x.type+"</span></li>"}).join("")};q.addEventListener("input",draw);draw();</script>' +
    '<noscript>The data this page searches is embedded in the page source.</noscript>', inv));

  write('tool.html', layout('Field lookup tool', 'Find which class declares a field.', '/tool.html',
    '<h1>Field lookup</h1><p>Enter a field or type fragment; the tool searches the extracted field tables only, and never guesses a value.</p>' +
    '<input id="q" placeholder="field or type" style="padding:10px;width:100%;background:#0d1117;color:var(--fg);border:1px solid var(--line)">' +
    '<p id="s" class="dim"></p><div id="o"></div>' +
    '<script>var F=' + JSON.stringify(lookupFields(inv, '', 200)) + ';var q=document.getElementById("q"),s=document.getElementById("s"),o=document.getElementById("o");' +
    'var draw=function(){var v=q.value.trim().toLowerCase();var rows=!v?F.slice(0,20):F.filter(function(x){return x.field.toLowerCase().indexOf(v)>=0||x.type.toLowerCase().indexOf(v)>=0});' +
    's.textContent=v?(rows.length+" match(es)"):"empty query - showing the first 20 indexed fields";' +
    'o.innerHTML=rows.slice(0,50).map(function(x){return "<div><span class=mono>"+x.field+"</span> <span class=dim>"+x.type+" - "+x.class+"</span></div>"}).join("")};q.addEventListener("input",draw);draw();</script>' +
    '<noscript>The data this tool searches is embedded in the page source.</noscript>', inv));

  const src = '<div class="note">Every value in this build traces to a file on the Windows machine that produced it. Nothing is community-sourced and nothing is estimated.</div>' +
    '<h2>Assembly</h2><p class="mono">' + esc(inv.source.assembly) + '</p><h2>Extractor</h2><p class="mono">' + esc(inv.source.extractor) + '</p>' +
    '<h2>Extracted at</h2><p class="mono">' + esc(inv.source.extractedAt) + '</p><h2>Game version</h2><p>' + esc(inv.version) + '</p>' +
    '<h2>Per-field provenance</h2><p>' + esc(inv.provenance?.fields ?? 'source, version, checkedAt, confidence, value') + '</p>' +
    '<h2>Not extracted (unknown)</h2><p>Per-field values: the serialized assets are Unity 6 / SerializedFile v22, which this pipeline does not parse yet. They are marked unknown rather than estimated. See <span class="mono">reports/v22-header.md</span> and <span class="mono">reports/v22-object-table.md</span>.</p>';
  write('sources.html', layout('Sources', 'Where every number came from.', '/sources.html', '<h1>Sources</h1>' + src, inv));
  write('guide.html', layout('Guide', 'How to read this database.', '/guide.html',
    '<h1>How to read this database</h1><h2>What is verified</h2><p>Class names, field names, field types, the write order Unity uses, and enum values are read from the game&apos;s own managed assembly.</p>' +
    '<h2>What is unknown</h2><p>Every field <em>value</em> (prices, health, damage, weights) - marked unknown in this build.</p>' +
    '<h2>Which pages are indexed</h2><p>The pages that answer a question are indexable. Class reference pages are marked <span class="mono">noindex, follow</span> and kept out of the sitemap, because a schema is not an answer to a search.</p>', inv));
  const simple = (rel, title, desc, body) => write(rel, layout(title, desc, '/' + rel, '<h1>' + title + '</h1>' + body, inv));
  simple('about.html', 'About', 'About this database and its Windows-side pipeline.',
    '<p>This site is generated from the game&apos;s own files on a Windows machine. It is an independent reference and is not affiliated with the developer.</p><p>Stack: Node extraction, dependency-free static generation, deterministic tests, and a gate that refuses to publish when the build is incomplete.</p>');
  simple('contact.html', 'Contact', 'How to report a wrong value.', '<p>Corrections are welcome. Report the page, the field and the expected value; corrections that cannot be traced to a game file are recorded as unverified rather than applied.</p>');
  simple('disclaimer.html', 'Disclaimer', 'No affiliation; no game assets redistributed.',
    '<p>Not affiliated with, endorsed by, or sponsored by the game&apos;s developer or publisher. Game names and marks belong to their owners. No game assets, models, audio or code are redistributed; only facts and numbers read from the files.</p>');
  simple('privacy.html', 'Privacy', 'No cookies, no tracking, no third-party requests.',
    '<p>This static build sets no cookies, runs no analytics and makes no third-party requests. The search and lookup tools run entirely in the browser over data embedded in the page.</p>');
  simple('terms.html', 'Terms', 'Use of this database.', '<p>Provided as-is for personal reference. Data may change as the game patches; each build records the version it was extracted from.</p>');
  write('404.html', layout('Not found', 'Page not found.', '/404.html', '<h1>Page not found</h1><p><a href="/">Back to the index</a></p>', inv));

  // The sitemap lists what a search engine should offer: question-answering pages, not every schema page.
  const urls = [...pages.keys()].filter((p) => p.endsWith('.html') && p !== '/404.html' && !isNoindexPage(p));
  write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    urls.map((p) => '<url><loc>' + SITE.url + p + '</loc></url>').join('') + '</urlset>');
  write('robots.txt', 'User-agent: *\nAllow: /\nSitemap: ' + SITE.url + '/sitemap.xml\n');
  return { pages: pages.size, urls: urls.length, outDir, schemaPages: [...pages.keys()].filter(isNoindexPage).length };
}

if (process.argv[1] && process.argv[1].endsWith('site.mjs')) {
  const inventory = process.env.REPO_INVENTORY || 'data/normalized/p0-inventory.json';
  const out = process.env.REPO_OUT || 'web/dist';
  if (!existsSync(inventory)) { console.error('missing inventory: ' + inventory); process.exit(2); }
  const r = build(inventory, out);
  console.log('[site] pages=' + r.pages + ' indexable=' + r.urls + ' schema(noindex)=' + r.schemaPages + ' out=' + r.outDir);
}
