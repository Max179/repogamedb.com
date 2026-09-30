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
  name: 'R.E.P.O. Wiki',
  domain: 'repogamedb.com',
  url: 'https://repogamedb.com',
  tagline: 'Learn the threats, carry the right gear and get your crew home with the valuable haul',
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

export const NAV = [['/', 'Home'], ['/guide.html', 'Start playing'], ['/enemies.html', 'Threats'], ['/collection.html', 'Browse the archive'],
  ['/search.html', 'Find an answer'], ['/tool.html', 'Tools'], ['/sources.html', 'Reference'], ['/about.html', 'About'],
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
    '<style>:root{--bg:#111316;--fg:#f2f4f0;--dim:#a4aaa8;--line:#34393b;--accent:#f2a65a;--panel:#1a1e20}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 80% 0,#3c2a20,transparent 30rem),var(--bg);color:var(--fg);font:16px/1.65 system-ui,Segoe UI,Roboto,sans-serif}header.top{position:sticky;top:0;z-index:4;background:rgba(17,19,22,.9);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}.bar{max-width:1180px;margin:auto;padding:14px 24px;display:flex;align-items:center;gap:28px}.brand{color:var(--fg);font-weight:800;display:flex;gap:10px;align-items:center;white-space:nowrap}.mark{display:grid;place-items:center;width:34px;height:34px;border-radius:9px;background:var(--accent);color:#26170d;font-size:12px}nav{display:flex;gap:18px;flex-wrap:wrap}nav a{color:var(--dim);font-size:14px}main{max-width:1180px;margin:auto;padding:0 24px 70px}.hero{padding:76px 0 60px;display:grid;grid-template-columns:1.05fr .95fr;gap:46px;align-items:center;border-bottom:1px solid var(--line)}.eyebrow{color:var(--accent);font-size:12px;letter-spacing:.12em;text-transform:uppercase}.hero h1{font-size:clamp(3.5rem,8vw,7rem);line-height:.86;letter-spacing:-.07em;margin:10px 0 22px;max-width:7ch}.lead{font-size:1.18rem;color:#d6dad6;max-width:38rem}.hero-art{min-height:380px;padding:28px;border:1px solid #76502d;border-radius:22px;background:linear-gradient(145deg,#513a28,#242324 58%,#151617);display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 24px 70px rgba(0,0,0,.25);transform:rotate(-1.2deg)}.hero-art strong{font-size:clamp(2.8rem,6vw,5.8rem);line-height:.84;letter-spacing:-.07em;color:#fff3e0}.hero-art span{color:var(--accent);letter-spacing:.12em;font-size:12px}.hero-search{display:flex;gap:8px;margin:28px 0 16px}.hero-search input{flex:1;padding:13px 15px;background:var(--panel);border:1px solid var(--line);border-radius:10px;color:var(--fg)}button,.button{padding:12px 16px;border-radius:10px;border:1px solid var(--line);background:var(--panel);color:var(--fg);font-weight:700}.primary{background:var(--accent);color:#26170d;border-color:var(--accent)}.actions{display:flex;gap:10px;flex-wrap:wrap}.section{padding:54px 0;border-bottom:1px solid var(--line)}.section h2{font-size:2rem;line-height:1.05}.task-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.task{min-height:170px;padding:18px;background:var(--panel);border:1px solid var(--line);border-radius:14px;color:var(--fg);display:flex;flex-direction:column;gap:8px;transition:transform .2s,border-color .2s}.task:hover{transform:translateY(-4px);border-color:var(--accent);text-decoration:none}.task span{color:var(--dim);font-size:.92rem}.task i{margin-top:auto;color:var(--accent);font-style:normal}.split{display:grid;grid-template-columns:.8fr 1.2fr;gap:64px}.archive-list{display:grid;gap:10px}.archive-list a{display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--line);color:var(--fg)}.archive-list span{color:var(--dim)}.dim{color:var(--dim)}.mono{font-family:ui-monospace,Consolas,monospace}.note{border-left:3px solid var(--accent);padding:14px 18px;background:var(--panel);margin:18px 0}table{border-collapse:collapse;width:100%;font-size:14px}th,td{border-bottom:1px solid var(--line);text-align:left;padding:9px 8px}footer{border-top:1px solid var(--line);padding:24px;max-width:1180px;margin:auto;color:var(--dim)}@media(max-width:800px){.bar{padding:12px 16px;flex-direction:column;align-items:flex-start;gap:10px}main{padding:0 16px 46px}.hero{grid-template-columns:1fr;padding:50px 0 42px}.task-grid{grid-template-columns:1fr 1fr}.split{grid-template-columns:1fr;gap:22px}}@media(max-width:460px){.task-grid{grid-template-columns:1fr}}</style></head><body>' +
    '<header class="top"><div class="bar"><a class="brand" href="/"><span class="mark">R</span><span>' + esc(SITE.name) + '</span></a><nav>' + nav + '</nav></div></header><main>' + body + '</main>' +
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
    '<section class="hero"><div><p class="eyebrow">A field guide for the next extraction</p><h1>R.E.P.O.</h1><p class="lead">' + esc(SITE.tagline) + '. Find a threat, plan the run and keep the team moving.</p>' +
    '<form class="hero-search" action="/search.html"><input name="q" type="search" placeholder="Search enemies, valuables or gear"><button>Search</button></form>' +
    '<p class="actions"><a class="button primary" href="/guide.html">Start here</a><a class="button" href="/enemies.html">Browse threats</a></p></div>' +
    '<div class="hero-art" aria-label="R.E.P.O."><span>CREW LOG / 001</span><strong>GET IN.<br>GET OUT.<br>GET PAID.</strong><span>RECOVER · CARRY · EXTRACT</span></div></section>' +
    '<section class="section"><p class="eyebrow">Choose your next task</p><h2>Prepare for the run</h2><div class="task-grid">' +
    [['Know the threats','Identify enemies before they corner the crew.','/enemies.html'],['Carry the haul','Find what is worth moving and how to protect it.','/collection.html'],['Make extraction','Keep a route and a fallback when time is short.','/guide.html'],['Bring the right gear','Check the tools before you spend.','/tool.html']].map(([a,b,h])=>'<a class="task" href="'+h+'"><strong>'+a+'</strong><span>'+b+'</span><i>→</i></a>').join('')+'</div></section>' +
    '<section class="section split"><div><p class="eyebrow">Browse the archive</p><h2>A field guide, not a wall of code.</h2><p class="dim">Explore threats, valuables, equipment and the route back out.</p></div><div class="archive-list"><a href="/enemies.html"><b>Enemies & responses</b><span>Know what is coming</span></a><a href="/collection.html"><b>Valuables & equipment</b><span>Plan the haul</span></a><a href="/guide.html"><b>Extraction guides</b><span>Make it home</span></a></div></section>', inv));

  write('collection.html', layout('P0 classes', 'Every P0 class with the fields Unity writes.', '/collection.html',
    '<h1>P0 classes <span class="dim">(' + classes.length + ')</span></h1><p class="dim">Reference pages. Each is marked noindex and kept out of the sitemap.</p><table><thead><tr><th>Class</th><th>Base</th><th>Written fields</th></tr></thead><tbody>' +
    classes.map((c, i) => '<tr><td><a href="/entity/' + slugs[i] + '.html">' + esc(c.name) + '</a></td><td class="mono dim">' + esc(c.base ?? '-') + '</td><td>' + c.written + '</td></tr>').join('') +
    '</tbody></table>', inv));

  // ---- a page that answers a question, from verified enum values
  {
    const enemyEnums = (inv.enums ?? []).filter((e) => /enemy|state|type/i.test(e.name)).slice(0, 8);
    const enemyClasses = classes.filter((c) => /^Enemy/.test(c.name)).slice(0, 80);
    const body = '<h1>Enemies</h1>' +
      '<div class="note">The enum values below are read from the game&apos;s own assembly, so they are the game&apos;s own numbers. Per-instance numbers such as health, damage and speed are known only where this build decoded them (see the values page) and are <strong>unknown</strong> otherwise and are not estimated.</div>' +
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
    '<h2>Not extracted (unknown)</h2><p>Per-field values: the serialized assets are Unity 6 / SerializedFile v22. This pipeline parses the MonoBehaviour payloads it can consume exactly and publishes every decoded value on the values page, with its object and field; a payload it cannot consume exactly is left unknown rather than estimated. See <span class="mono">reports/v22-header.md</span> and <span class="mono">reports/v22-object-table.md</span>.</p>';
  write('sources.html', layout('Sources', 'Where every number came from.', '/sources.html', '<h1>Sources</h1>' + src, inv));
  write('guide.html', layout('Guide', 'How to read this database.', '/guide.html',
    '<h1>How to read this database</h1><h2>What is verified</h2><p>Class names, field names, field types, the write order Unity uses, and enum values are read from the game&apos;s own managed assembly.</p>' +
    '<h2>What is unknown</h2><p>Field <em>values</em> (prices, health, damage, weights) are known only where this build decoded them - every decoded object and field is listed on the values page. Everything the decoder could not consume exactly is marked <strong>unknown</strong> in this build.</p>' +
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
