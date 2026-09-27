#!/usr/bin/env node
/**
 * Static site generator for the R.E.P.O. database (Windows-side build).
 * Reads the verified P0 inventory (extracted from the game's own managed assembly) and emits a
 * dependency-free static site. Pages with no extracted values say so; nothing is invented.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const SITE = {
  name: 'R.E.P.O. Database',
  domain: 'repogamedb.com',
  url: 'https://repogamedb.com',
  tagline: 'Weapons, valuables, enemies and extraction data — read from the game files',
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

const NAV = [['/', 'Home'], ['/search.html', 'Search'], ['/collection.html', 'Classes'], ['/guide.html', 'Guide'],
  ['/tool.html', 'Tool'], ['/sources.html', 'Sources'], ['/about.html', 'About'], ['/contact.html', 'Contact'],
  ['/disclaimer.html', 'Disclaimer'], ['/privacy.html', 'Privacy'], ['/terms.html', 'Terms']];

function layout(title, description, path, body, inv) {
  const nav = NAV.map(([h, t]) => '<a href="' + h + '">' + t + '</a>').join('');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc(title) + '</title><meta name="description" content="' + esc(description) + '">' +
    '<link rel="canonical" href="' + SITE.url + path + '"><meta property="og:title" content="' + esc(title) + '">' +
    '<meta property="og:description" content="' + esc(description) + '"><meta property="og:url" content="' + SITE.url + path + '">' +
    '<style>:root{--bg:#0d1117;--fg:#e6edf3;--dim:#8b949e;--line:#21262d;--accent:#58a6ff}' +
    'body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.6 system-ui,Segoe UI,Roboto,sans-serif}' +
    'header,footer{border-bottom:1px solid var(--line);padding:14px 20px}footer{border-top:1px solid var(--line);border-bottom:0;color:var(--dim);font-size:13px}' +
    'main{max-width:1000px;margin:0 auto;padding:22px 20px}nav a{color:var(--accent);margin-right:14px;text-decoration:none;font-size:14px}' +
    'h1{font-size:26px;margin:6px 0 14px}h2{font-size:19px;margin-top:26px}table{border-collapse:collapse;width:100%;font-size:14px}' +
    'th,td{border-bottom:1px solid var(--line);text-align:left;padding:6px 8px}.mono{font-family:ui-monospace,Consolas,monospace}' +
    '.dim{color:var(--dim)}.note{border-left:3px solid var(--accent);padding:8px 12px;background:#161b22;margin:14px 0}</style></head><body>' +
    '<header><strong>' + esc(SITE.name) + '</strong><nav style="margin-top:8px">' + nav + '</nav></header><main>' + body + '</main>' +
    '<footer>Source: <span class="mono">' + esc(inv.source?.assembly ?? 'unknown') + '</span> · Game version: ' +
    esc(inv.version ?? 'unknown') + ' · Extracted: ' + esc(inv.source?.extractedAt ?? 'unknown') +
    ' · Confidence: extracted from the game&apos;s own assembly. Values not extracted are marked unknown — nothing is invented.<br>' +
    'Not affiliated with the game&apos;s developer. No game assets are redistributed.</footer></body></html>';
}


export function build(inventoryPath, outDir) {
  const inv = JSON.parse(readFileSync(inventoryPath, 'utf8'));
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(join(outDir, 'entity'), { recursive: true });
  const pages = new Map();
  const classes = (inv.classes ?? []).slice().sort((a, b) => b.written - a.written);
  // Class names are not unique in the assembly (several types are literally called State or Status), so the slug
  // has to be made unique or one class's page overwrites another's. The test caught exactly that: 348 files for 436
  // classes. Duplicates get a numeric suffix and the link targets are built from this same list.
  const used = new Set();
  const slugs = classes.map((c) => {
    const base = slug(c.name);
    let s = base;
    let n = 2;
    while (used.has(s)) s = base + '-' + n++;
    used.add(s);
    return s;
  });
  const write = (rel, html) => { const f = join(outDir, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, html, 'utf8'); pages.set('/' + rel, html); };

  write('index.html', layout(SITE.name + ' — ' + SITE.tagline, SITE.tagline, '/', 
    '<h1>R.E.P.O. database</h1><div class="note">This build covers the <strong>schema layer</strong>: ' +
    'classes, their written fields and the game&apos;s own enums, extracted from <span class="mono">Assembly-CSharp.dll</span>. ' +
    'Per-field <em>values</em> are not extracted yet (the container is Unity 6 / SerializedFile v22) and are therefore marked <strong>unknown</strong>.</div>' +
    '<p>' + inv.totals.types + ' types · ' + inv.totals.fields + ' fields · ' + classes.length + ' P0 classes · ' + (inv.enums ?? []).length + ' enums.</p>' +
    '<p><a href="/collection.html">Browse classes</a> · <a href="/tool.html">Field lookup tool</a> · <a href="/sources.html">Sources</a></p>', inv, '/'));

  write('collection.html', layout('P0 classes', 'Every P0 class with its written fields.', '/collection.html',
    '<h1>P0 classes <span class="dim">(' + classes.length + ')</span></h1><table><thead><tr><th>Class</th><th>Base</th><th>Written fields</th></tr></thead><tbody>' +
    classes.map((c, i) => '<tr><td><a href="/entity/' + slugs[i] + '.html">' + esc(c.name) + '</a></td><td class="mono dim">' + esc(c.base ?? '-') + '</td><td>' + c.written + '</td></tr>').join('') +
    '</tbody></table>', inv, '/collection.html'));

  for (let ci = 0; ci < classes.length; ci++) {
    const c = classes[ci];
    write('entity/' + slugs[ci] + '.html', layout(c.name + ' — R.E.P.O. class', c.name + ': ' + c.written + ' written fields read from the game assembly.', '/entity/' + slugs[ci] + '.html',
      '<h1 class="mono">' + esc(c.name) + '</h1><p class="dim">namespace <span class="mono">' + esc(c.namespace || '-') + '</span> · base <span class="mono">' + esc(c.base || '-') + '</span> · declared ' + c.declared + ' · Unity writes ' + c.written + '</p>' +
      '<div class="note">Field <em>values</em> are <strong>unknown</strong> for this build: they live in the serialized assets (Unity 6 / SerializedFile v22), which this pipeline does not read yet.</div>' +
      '<h2>Written fields</h2><table><thead><tr><th>Field</th><th>Type</th><th>Kind</th></tr></thead><tbody>' +
      c.fields.map((f) => '<tr><td class="mono">' + esc(f.name) + '</td><td class="mono dim">' + esc(f.type) + '</td><td class="dim">' + esc(f.kind) + '</td></tr>').join('') +
      '</tbody></table>', inv, '/entity/' + slugs[ci] + '.html'));
  }

  if ((inv.enums ?? []).length) {
    write('enums.html', layout('Enums', 'Enumerations and their values, read from the game assembly.', '/enums.html',
      '<h1>Enums <span class="dim">(' + inv.enums.length + ')</span></h1>' + inv.enums.map((e) =>
        '<h2 class="mono">' + esc(e.name) + ' <span class="dim">' + e.members.length + ' members</span></h2><table><tbody>' +
        e.members.map((m) => '<tr><td class="mono">' + esc(m.name) + '</td><td class="mono dim">' + m.value + '</td></tr>').join('') + '</tbody></table>').join(''), inv, '/enums.html'));
  }

  write('search.html', layout('Search', 'Search classes and fields.', '/search.html',
    '<h1>Search</h1><p class="dim">Client-side over ' + inv.totals.fields + ' fields. No network requests.</p>' +
    '<input id="q" placeholder="e.g. valuable, EnemyOogly, Transform" style="width:100%;padding:10px;background:#0d1117;color:var(--fg);border:1px solid var(--line)">' +
    '<p class="dim small" id="status">Type to search.</p><ul id="out"></ul>' +
    '<script>const F=' + JSON.stringify(lookupFields(inv, '', 200)) + ';const q=document.getElementById("q"),o=document.getElementById("out"),s=document.getElementById("status");' +
    'q.addEventListener("input",()=>{const v=q.value.trim().toLowerCase();const r=!v?F.slice(0,50):F.filter(x=>x.field.toLowerCase().includes(v)||x.class.toLowerCase().includes(v));' +
    's.textContent=v?(r.length+" match(es) in the first 200 indexed fields"):("Showing first 50 of "+F.length+" indexed fields");' +
    'o.innerHTML=r.slice(0,50).map(x=>"<li><a href=\"/entity/"+x.class.toLowerCase()+"\">"+x.class+"</a> <span class=dim>"+x.field+": "+x.type+"</span></li>").join("")});</script>', inv, '/search.html'));

  write('tool.html', layout('Field lookup tool', 'Find which class declares a field.', '/tool.html',
    '<h1>Field lookup</h1><p>Enter a field or type fragment; the tool searches the extracted field tables only, and never guesses a value.</p>' +
    '<div id="tool"></div><script>const F=' + JSON.stringify(lookupFields(inv, '', 200)) + ';' +
    'const run=(q)=>{if(typeof q!=="string")return{error:"input must be text"};const v=q.trim();if(!v.length)return{rows:[],note:"empty query - showing the 20 largest classes\' first fields"};' +
    'const rows=F.filter(x=>x.field.toLowerCase().includes(v.toLowerCase())||x.type.toLowerCase().includes(v.toLowerCase()));return{rows:rows.slice(0,50),note:rows.length+" match(es)"}};' +
    'document.getElementById("tool").innerHTML="<input id=q placeholder=\"field or type\" style=\"padding:10px;width:100%;background:#0d1117;color:var(--fg);border:1px solid var(--line)\"><p id=s class=dim></p><div id=o></div>";' +
    'const q=document.getElementById("q"),s=document.getElementById("s"),o=document.getElementById("o");' +
    'const draw=()=>{const r=run(q.value);s.textContent=r.note;o.innerHTML=r.rows.map(x=>"<div><span class=mono>"+x.field+"</span> <span class=dim>"+x.type+" - "+x.class+"</span></div>").join("")};q.addEventListener("input",draw);draw();</script>' +
    '<noscript>This tool needs JavaScript. All data it searches is present in the page source.</noscript>', inv, '/tool.html'));

  const src = '<div class="note">Every value in this build traces to a file on the Windows machine that produced it. Nothing is community-sourced and nothing is estimated.</div>' +
    '<h2>Assembly</h2><p class="mono">' + esc(inv.source.assembly) + '</p><h2>Extractor</h2><p class="mono">' + esc(inv.source.extractor) + '</p>' +
    '<h2>Extracted at</h2><p class="mono">' + esc(inv.source.extractedAt) + '</p><h2>Game version</h2><p>' + esc(inv.version) + '</p>' +
    '<h2>Not extracted (unknown)</h2><p>Per-field values: the serialized assets are Unity 6 / SerializedFile v22, which this pipeline does not parse yet. ' +
    'They are marked unknown rather than estimated. See <span class="mono">reports/container-probe.txt</span>.</p>';
  write('sources.html', layout('Sources', 'Where every number came from.', '/sources.html', '<h1>Sources</h1>' + src, inv, '/sources.html'));
  write('guide.html', layout('Guide', 'How to read this database.', '/guide.html',
    '<h1>How to read this database</h1><h2>What is verified</h2><p>Class names, field names, field types, write order and enum values are read from the game&apos;s own managed assembly.</p>' +
    '<h2>What is unknown</h2><p>Every field <em>value</em> (prices, health, damage, weights) — marked unknown in this build.</p>' +
    '<h2>Why the distinction matters</h2><p>A field table tells you the shape of the game&apos;s data; only the values tell you the numbers. This build gives the first and says so.</p>', inv, '/guide.html'));
  const simple = (rel, title, desc, body) => write(rel, layout(title, desc, '/' + rel, '<h1>' + title + '</h1>' + body, inv, '/' + rel));
  simple('about.html', 'About', 'About this R.E.P.O. database and its Windows-side pipeline.',
    '<p>This site is generated from the game&apos;s own files on a Windows machine. It is an independent reference and is not affiliated with the developer.</p><p>Stack: Node/TypeScript extraction, dependency-free static generation, deterministic fixtures, and a gate that refuses to publish when the build is incomplete.</p>');
  simple('contact.html', 'Contact', 'How to report a wrong value.', '<p>Corrections are welcome. Report the page, the field and the expected value; corrections that cannot be traced to a game file will be recorded as unverified rather than applied.</p>');
  simple('disclaimer.html', 'Disclaimer', 'No affiliation; no game assets redistributed.',
    '<p>Not affiliated with, endorsed by, or sponsored by the game&apos;s developer or publisher. Game names and marks belong to their owners. No game assets, models, audio or code are redistributed; only facts and numbers read from the files.</p>');
  simple('privacy.html', 'Privacy', 'No cookies, no tracking, no third-party requests.',
    '<p>This static build sets no cookies, runs no analytics and makes no third-party requests. The search and lookup tools run entirely in the browser over data embedded in the page.</p>');
  simple('terms.html', 'Terms', 'Use of this database.', '<p>Provided as-is for personal reference. Data may change as the game patches; each build records the version it was extracted from.</p>');
  write('404.html', layout('Not found', 'Page not found.', '/404.html', '<h1>Page not found</h1><p><a href="/">Back to the index</a></p>', inv, '/404.html'));

  const urls = [...pages.keys()].filter((p) => p.endsWith('.html') && p !== '/404.html');
  write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    urls.map((p) => '<url><loc>' + SITE.url + p + '</loc></url>').join('') + '</urlset>');
  write('robots.txt', 'User-agent: *\nAllow: /\nSitemap: ' + SITE.url + '/sitemap.xml\n');
  return { pages: pages.size, urls: urls.length, outDir };
}

if (process.argv[1] && process.argv[1].endsWith('site.mjs')) {
  const inventory = process.env.REPO_INVENTORY || 'data/normalized/p0-inventory.json';
  const out = process.env.REPO_OUT || 'web/dist';
  if (!existsSync(inventory)) { console.error('missing inventory: ' + inventory); process.exit(2); }
  const r = build(inventory, out);
  console.log('[site] pages=' + r.pages + ' sitemapUrls=' + r.urls + ' out=' + r.outDir);
}
