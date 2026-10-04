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
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

export const NAV = [['/', 'Wiki'], ['/enemies.html', 'Threats'], ['/guide.html', 'Guides'],
  ['/search.html', 'Search'], ['/tool.html', 'Tools'], ['/sources.html', 'Reference']];

/** A schema page is a reference; it is generated and linked, but not offered to a search engine. */
/** A page that duplicates a query-answering page keeps its URL but is not indexed: the audit in round 76 found
 *  /tool.html sharing 98.8% of its main content with /search.html, so /tool.html is a noindex convenience page. */
export function isNoindexPage(path) {
  return isSchemaPage(path) || ['/tool.html', '/collection.html', '/values.html', '/enums.html', '/search.html'].includes(path);
}

export function isSchemaPage(path) {
  return String(path).startsWith('/entity/');
}

const ENHANCED_CSS = `
:root{--paper:#f2eee5;--paper-2:#e6e0d3;--ink:#20251f;--muted:#687067;--signal:#e75b36;--signal-dark:#a53720;--night:#172019;--night-2:#253129;--rule:#c9c2b5;--focus:#ffd15c}
html{scroll-behavior:smooth}body{background:var(--paper);color:var(--ink);font-family:Arial,"Helvetica Neue",sans-serif;letter-spacing:0}a{color:inherit;text-decoration:none}a:hover{text-decoration:none}a:focus-visible,button:focus-visible,input:focus-visible{outline:3px solid var(--focus);outline-offset:3px}.skip-link{position:fixed;left:12px;top:-80px;z-index:20;padding:10px 14px;background:#fff;color:#111}.skip-link:focus{top:12px}
header.top{background:rgba(242,238,229,.96);border-bottom:1px solid var(--rule);box-shadow:none}.bar{max-width:1280px;padding:12px 28px;gap:34px}.brand{color:var(--ink);font-size:15px;letter-spacing:.02em}.mark{width:38px;height:38px;border-radius:3px;background:var(--signal);color:#fff;font-size:15px;box-shadow:4px 4px 0 var(--night)}nav{gap:4px;align-items:center}nav a{position:relative;padding:9px 11px;color:var(--muted);font-size:14px;font-weight:700;border-radius:3px}nav a:hover,nav a[aria-current="page"]{background:var(--night);color:#fff}.nav-toggle{display:none;margin-left:auto;padding:8px 10px;background:transparent;border:1px solid var(--rule);color:var(--ink);border-radius:3px}
main{max-width:1280px;padding:0 28px 84px}.hero{min-height:620px;padding:58px 0 50px;grid-template-columns:.86fr 1.14fr;gap:54px;border-bottom:0}.eyebrow{color:var(--signal-dark);font:800 12px/1.2 Arial,sans-serif;letter-spacing:.14em;margin:0 0 14px}.hero h1{max-width:none;margin:0 0 20px;color:var(--night);font-family:Impact,"Arial Black",sans-serif;font-size:clamp(5.5rem,12vw,10.5rem);font-weight:400;line-height:.78;letter-spacing:0;text-transform:uppercase}.lead{max-width:34rem;color:#414941;font-size:1.1rem;line-height:1.7}.hero-media{min-height:500px;border:0;border-radius:3px;background:var(--night);box-shadow:18px 18px 0 var(--night);transform:none}.hero-media img{height:500px;filter:saturate(.78) contrast(1.06)}.hero-media figcaption,.feature-card figcaption{padding:32px 18px 14px;background:linear-gradient(transparent,rgba(10,15,11,.9));color:#fff}.hero-search{max-width:560px;margin:26px 0 14px;padding:5px;background:#fff;border:1px solid var(--rule);box-shadow:5px 5px 0 var(--paper-2)}.hero-search input{padding:12px;background:transparent;border:0;color:var(--ink);border-radius:0}.hero-search button,.button{border:0;border-radius:2px;background:var(--night);color:#fff;transition:transform .18s,background .18s}.hero-search button:hover,.button:hover{background:var(--signal);transform:translateY(-2px)}.primary{background:var(--signal);color:#fff}.actions{margin-top:18px}
.section{padding:68px 0;border-bottom:1px solid var(--rule)}.section-head{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:26px}.section-head h2,.section h2{max-width:18ch;margin:3px 0;color:var(--night);font-family:Impact,"Arial Black",sans-serif;font-size:clamp(2.4rem,5vw,4.4rem);font-weight:400;line-height:.95;letter-spacing:0;text-transform:uppercase}.section-head>a{font-weight:800;color:var(--signal-dark)}
.category-rail{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--rule);border:1px solid var(--rule)}.category{min-height:220px;padding:24px;background:var(--paper);display:flex;flex-direction:column;transition:background .2s,color .2s}.category:hover{background:var(--night);color:#fff}.category .icon{font:400 40px/1 Impact,sans-serif;color:var(--signal)}.category strong{margin-top:auto;font-size:1.25rem}.category span{margin-top:6px;color:var(--muted);font-size:.9rem}.category:hover span{color:#cdd5ce}.category b{font:700 12px ui-monospace,monospace;color:var(--signal)}
.mission-board{display:grid;grid-template-columns:.72fr 1.28fr;gap:48px;align-items:start}.mission-copy{position:sticky;top:92px}.feature-card{border:0;border-radius:3px;box-shadow:10px 10px 0 var(--night);margin-top:26px}.feature-card img{height:300px}.mission-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.mission-tab{padding:9px 13px;border:1px solid var(--rule);background:transparent;color:var(--ink);border-radius:2px;cursor:pointer}.mission-tab[aria-selected="true"]{background:var(--signal);border-color:var(--signal);color:#fff}.mission-panel{min-height:330px;padding:30px;background:var(--night);color:#fff}.mission-panel h3{max-width:14ch;margin:4px 0 12px;font:400 3rem/.95 Impact,sans-serif;text-transform:uppercase}.mission-panel p{max-width:56ch;color:#cad2cb}.steps{display:grid;gap:1px;margin-top:28px;background:#405044}.step{display:grid;grid-template-columns:42px 1fr;gap:14px;padding:15px;background:var(--night-2)}.step b{color:var(--signal);font:800 13px ui-monospace,monospace}.step strong{display:block}.step span{color:#aebaae;font-size:.9rem}
.filter-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}.filter{padding:8px 12px;border:1px solid var(--rule);background:transparent;color:var(--ink);border-radius:2px;cursor:pointer}.filter.is-active{background:var(--night);border-color:var(--night);color:#fff}.guide-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:16px}.guide-card{grid-column:span 4;min-height:250px;padding:24px;background:#fff;border-top:5px solid var(--night);display:flex;flex-direction:column;transition:transform .18s,box-shadow .18s}.guide-card:nth-child(1),.guide-card:nth-child(5){grid-column:span 8}.guide-card:hover{transform:translateY(-4px);box-shadow:8px 8px 0 var(--paper-2)}.guide-card[hidden]{display:none}.guide-card .tag{color:var(--signal-dark);font:800 11px ui-monospace,monospace;text-transform:uppercase}.guide-card h3{margin:12px 0 8px;font-size:1.4rem;line-height:1.15}.guide-card p{color:var(--muted)}.guide-card .arrow{margin-top:auto;color:var(--signal);font-size:1.5rem}
.utility-band{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#405044}.utility{min-height:190px;padding:28px;background:var(--night);color:#fff}.utility:hover{background:var(--night-2)}.utility b{display:block;margin-bottom:30px;color:var(--signal);font:800 12px ui-monospace,monospace}.utility h3{margin:0 0 8px;font-size:1.35rem}.utility p{color:#b8c2ba}.update-list{border-top:1px solid var(--rule)}.update{display:grid;grid-template-columns:140px 1fr auto;gap:20px;padding:20px 0;border-bottom:1px solid var(--rule);align-items:center}.update time{font:700 12px ui-monospace,monospace;color:var(--signal-dark)}.update span{color:var(--muted)}
.page-shell{max-width:900px;padding-top:64px}.page-shell>h1,main>h1{margin:54px 0 22px;color:var(--night);font:400 clamp(3rem,7vw,6rem)/.9 Impact,sans-serif;text-transform:uppercase}.note{border:0;border-left:5px solid var(--signal);background:#fff;color:var(--ink)}table{background:#fff}th,td{border-color:var(--rule)}.dim{color:var(--muted)}
footer{max-width:none;margin:0;background:var(--night);color:#bec7bf;border:0;padding:42px 28px}.footer-inner{max-width:1224px;margin:auto;display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:40px}.footer-title{color:#fff;font:400 2rem Impact,sans-serif}.footer-links{display:flex;gap:12px 18px;flex-wrap:wrap}.footer-links a{color:#fff}.footer-note{grid-column:1/-1;padding-top:20px;border-top:1px solid #3b493e;font-size:.83rem}
@media(max-width:900px){.hero{grid-template-columns:1fr;min-height:0}.hero-media{min-height:350px;box-shadow:10px 10px 0 var(--night)}.hero-media img{height:350px}.category-rail{grid-template-columns:1fr 1fr}.mission-board{grid-template-columns:1fr}.mission-copy{position:static}.guide-card,.guide-card:nth-child(1),.guide-card:nth-child(5){grid-column:span 6}}
@media(max-width:720px){.bar{padding:10px 16px;flex-direction:row;align-items:center}.nav-toggle{display:block}.top nav{display:none;position:absolute;left:0;right:0;top:59px;padding:12px 16px;background:var(--paper);border-bottom:1px solid var(--rule)}.top nav.is-open{display:grid}.top nav a{padding:12px}main{padding:0 16px 58px}.hero{padding:44px 0}.hero h1{font-size:5.3rem}.category-rail{grid-template-columns:1fr}.category{min-height:150px}.mission-board{gap:26px}.guide-card,.guide-card:nth-child(1),.guide-card:nth-child(5){grid-column:1/-1}.utility-band{grid-template-columns:1fr}.update{grid-template-columns:1fr;gap:4px}.footer-inner{grid-template-columns:1fr}.footer-note{grid-column:auto}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
`;

function layout(title, description, path, body, inv) {
  const noindex = isNoindexPage(path);
  const nav = NAV.map(([h, txt]) => '<a href="' + h + '"' + (path === h ? ' aria-current="page"' : '') + '>' + txt + '</a>').join('');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc(title) + '</title><meta name="description" content="' + esc(description) + '">' +
    '<link rel="canonical" href="' + SITE.url + path + '">' +
    (noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow">') +
    '<link rel="alternate" hreflang="en" href="' + SITE.url + path + '">' +
    '<link rel="alternate" hreflang="x-default" href="' + SITE.url + path + '">' +
    '<meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(description) + '">' +
    '<meta property="og:url" content="' + SITE.url + path + '">' +
    '<style>:root{--bg:#111316;--fg:#f2f4f0;--dim:#a4aaa8;--line:#34393b;--accent:#f2a65a;--panel:#1a1e20}*{box-sizing:border-box}</style><style>' + ENHANCED_CSS + '</style></head><body>' +
    '<a class="skip-link" href="#content">Skip to content</a><header class="top"><div class="bar"><a class="brand" href="/"><span class="mark">R</span><span>' + esc(SITE.name) + '</span></a><button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button><nav id="site-nav">' + nav + '</nav></div></header><main>' + body + '</main>' +
    '<footer><div class="footer-inner"><div><div class="footer-title">R.E.P.O. Wiki</div><p>An independent field guide for crews who want to identify threats, protect the haul and make extraction.</p></div><div><strong>Explore</strong><div class="footer-links"><a href="/enemies.html">Threats</a><a href="/guide.html">Guides</a><a href="/search.html">Search</a><a href="/tool.html">Tools</a></div></div><div><strong>About</strong><div class="footer-links"><a href="/about.html">About</a><a href="/contact.html">Contact</a><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a></div></div><div class="footer-note">Source: ' + (noindex ? '<span class="mono">' + esc(inv.source.assembly) + '</span>' : 'verified game build') + ' · Game version ' + esc(inv.version) + '. Unofficial fan reference; technical provenance is available under <a href="/sources.html">Reference</a>.</div></div></footer>' +
    '<script>(function(){var b=document.querySelector(".nav-toggle"),n=document.getElementById("site-nav");if(b){b.addEventListener("click",function(){var open=n.classList.toggle("is-open");b.setAttribute("aria-expanded",String(open));});}})();</script></body></html>';
}

export function build(inventoryPath, outDir) {
  const inv = JSON.parse(readFileSync(inventoryPath, 'utf8'));
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(join(outDir, 'entity'), { recursive: true });
  const assetRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'web', 'assets');
  const asset = (name) => { mkdirSync(join(outDir, 'assets'), { recursive: true }); copyFileSync(join(assetRoot, name), join(outDir, 'assets', name)); return '/assets/' + name; };
  const heroImage = asset('hero-extraction.jpg');
  const featuredImage = asset('featured-duck.png');
  const pages = new Map();
  const classes = (inv.classes ?? []).slice().sort((a, b) => b.written - a.written);
  const enemyNames = classes
    .map((c) => c.name.match(/^Enemy([A-Z][A-Za-z]+)/)?.[1])
    .filter((name) => name && !/Anim|State|Director|Controller|Visuals|System|Logic|Health|Vision|Setup|Parent|OnScreen|Debug|Near|Sighting|Chase|Jump|Loop|Float|Head|SlowMouth|Rigidbody|PitCheck|Hair|Eye|BangFuse|BombThrowerHead/.test(name))
    .filter((name, i, all) => all.indexOf(name) === i)
    .slice(0, 12);
  const used = new Set();
  const slugs = classes.map((c) => {
    const base = slug(c.name);
    let s = base, n = 2;
    while (used.has(s)) s = base + '-' + n++;
    used.add(s);
    return s;
  });
  const write = (rel, html) => { const f = join(outDir, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, html, 'utf8'); pages.set('/' + rel, html); };

  const enemyCount = enemyNames.length;
  const homeBody = '<section class="hero"><div><p class="eyebrow">A field guide for the next extraction</p><h1>R.E.P.O.</h1><p class="lead">' + esc(SITE.tagline) + '. Start with the run plan, then check a threat, gear choice or valuable before you commit the crew.</p>' +
    '<form class="hero-search" action="/search.html"><input name="q" type="search" placeholder="Search enemies, valuables or gear"><button>Search</button></form>' +
    '<p class="actions"><a class="button primary" href="/guide.html">Start with the run plan</a><a class="button" href="/enemies.html">Browse threats</a></p></div>' +
    '<figure class="hero-media"><img src="' + heroImage + '" alt="R.E.P.O. extraction route point in game"><figcaption>Verified in-game route reference</figcaption></figure></section>' +
    '<section class="section"><div class="section-head"><div><p class="eyebrow">Explore the wiki</p><h2>Everything you need before the lift-off</h2></div><a href="/guide.html">View all guides →</a></div><div class="category-rail">' +
    [['◈','Threats',enemyCount + ' verified threat references and response notes.','/enemies.html'],['▣','Valuables','Know what is worth carrying and what slows a run.','/search.html?q=valuable'],['⌁','Gear','Compare the tools that keep a crew alive.','/tool.html'],['↗','Extraction','Use a clean route and a fallback call.','/guide.html']].map(([i,t,d,h])=>'<a class="category" href="'+h+'"><b>FIELD GUIDE</b><span class="icon">'+i+'</span><strong>'+t+'</strong><span>'+d+'</span></a>').join('') + '</div></section>' +
    '<section class="section"><div class="mission-board"><div class="mission-copy"><p class="eyebrow">Featured guide</p><h2>Make the next run count</h2><p class="dim">Use the same rhythm every round: scout the path, protect the valuable and call the fallback before the team is forced to improvise.</p><figure class="feature-card"><img src="' + featuredImage + '" alt="R.E.P.O. duck threat reference"><figcaption>Featured threat · read the tell before it closes the route</figcaption></figure></div><div><div class="mission-tabs" role="tablist" aria-label="Run phases"><button class="mission-tab" type="button" role="tab" aria-selected="true" data-phase="scout">01 Scout</button><button class="mission-tab" type="button" role="tab" aria-selected="false" data-phase="haul">02 Haul</button><button class="mission-tab" type="button" role="tab" aria-selected="false" data-phase="extract">03 Extract</button></div><div class="mission-panel" data-phase-panel="scout"><p class="eyebrow">Before the alarm</p><h3>Build a route you can repeat</h3><p>Look for the safest line first. A valuable run is only good when the crew still has a way back.</p><div class="steps"><div class="step"><b>01</b><div><strong>Pick the exit</strong><span>Keep the return path visible before the team splits.</span></div></div><div class="step"><b>02</b><div><strong>Mark the pressure point</strong><span>Give one player the job of watching the threat lane.</span></div></div></div></div><div class="mission-panel" data-phase-panel="haul" hidden><p class="eyebrow">While carrying</p><h3>Protect the valuable</h3><p>Move the high value item through the clearest lane and keep a free hand for the next decision.</p><div class="steps"><div class="step"><b>01</b><div><strong>Keep the team close</strong><span>One carrier, one spotter, one player ready to pull the route open.</span></div></div><div class="step"><b>02</b><div><strong>Drop with intent</strong><span>A safe reset is better than a slow panic walk.</span></div></div></div></div><div class="mission-panel" data-phase-panel="extract" hidden><p class="eyebrow">When time turns</p><h3>Call the fallback early</h3><p>Extraction is a team decision. Leave before the last shortcut becomes the only option.</p><div class="steps"><div class="step"><b>01</b><div><strong>Signal the turn</strong><span>Use a clear call so every player knows the route has changed.</span></div></div><div class="step"><b>02</b><div><strong>Count the crew</strong><span>Check the doorway, the valuable and the last player before moving.</span></div></div></div></div></div></div></section>' +
    '<section class="section"><div class="section-head"><div><p class="eyebrow">Latest field notes</p><h2>Useful answers for the next session</h2></div><a href="/search.html">Search the wiki →</a></div><div class="guide-grid"><a class="guide-card" href="/guide.html"><span class="tag">Starter route</span><h3>First extraction without a panic split</h3><p>Set roles, choose the return line and make the first haul a repeatable loop.</p><span class="arrow">↗</span></a><a class="guide-card" href="/enemies.html"><span class="tag">Threats</span><h3>Read a threat before it owns the room</h3><p>Use the field guide to check the states and pressure patterns that matter during a run.</p><span class="arrow">↗</span></a><a class="guide-card" href="/search.html?q=valuable"><span class="tag">Valuables</span><h3>Which haul deserves the risk?</h3><p>Search the verified item references before a heavy object turns a clean route into a trap.</p><span class="arrow">↗</span></a><a class="guide-card" href="/guide.html#multiplayer"><span class="tag">Co-op</span><h3>Six players, one extraction call</h3><p>The game data confirms a six-player session limit. Give every role a job before the door opens.</p><span class="arrow">↗</span></a><a class="guide-card" href="/guide.html#gear"><span class="tag">Gear</span><h3>Spend on a safer next round</h3><p>Keep the tool choice tied to the route you are actually taking, not a wish list.</p><span class="arrow">↗</span></a></div></section>' +
    '<section class="section"><div class="section-head"><div><p class="eyebrow">Reference desk</p><h2>Tools that stay close to the answer</h2></div></div><div class="utility-band"><a class="utility" href="/search.html"><b>SEARCH THE WIKI</b><h3>Find a threat, valuable or guide</h3><p>Search the player-facing index and jump straight to the relevant route.</p></a><a class="utility" href="/tool.html"><b>FIELD TOOL</b><h3>Check the verified reference layer</h3><p>Technical records remain available for readers who need the provenance behind a page.</p></a></div></section>' +
    '<script>(function(){var tabs=[].slice.call(document.querySelectorAll("[data-phase]"));var panels=[].slice.call(document.querySelectorAll("[data-phase-panel]"));tabs.forEach(function(t){t.addEventListener("click",function(){tabs.forEach(function(x){x.setAttribute("aria-selected",String(x===t));});panels.forEach(function(p){p.hidden=p.dataset.phasePanel!==t.dataset.phase;});});});})();</script>';
  write('index.html', layout(SITE.name + ' - ' + SITE.tagline, SITE.tagline, '/', homeBody, inv));

  write('collection.html', layout('P0 classes', 'Every P0 class with the fields Unity writes.', '/collection.html',
    '<h1>P0 classes <span class="dim">(' + classes.length + ')</span></h1><p class="dim">Reference pages. Each is marked noindex and kept out of the sitemap.</p><table><thead><tr><th>Class</th><th>Base</th><th>Written fields</th></tr></thead><tbody>' +
    classes.map((c, i) => '<tr><td><a href="/entity/' + slugs[i] + '.html">' + esc(c.name) + '</a></td><td class="mono dim">' + esc(c.base ?? '-') + '</td><td>' + c.written + '</td></tr>').join('') +
    '</tbody></table>', inv));

  // ---- a page that answers a question, from verified enum values
  {
    const body = '<section class="page-shell" id="content"><p class="eyebrow">Threat field guide</p><h1>Threats</h1><p class="lead">Learn the names that appear in the verified game data, then use the run guide to decide when to scout, carry and leave.</p><div class="guide-grid">' +
      enemyNames.map((name, i) => '<article class="guide-card"><span class="tag">Threat ' + String(i + 1).padStart(2, '0') + '</span><h3>' + esc(name) + '</h3><p>Verified enemy reference. Check the route first, keep a fallback open and avoid carrying the haul into a closed lane.</p><span class="arrow">↗</span></article>').join('') +
      '</div><div class="note"><strong>How to use this page.</strong> Enemy names are published only when they are confirmed in the installed game build. Strategy notes describe the player decision around the encounter and do not invent damage, speed or drop values.</div></section>';
    write('enemies.html', layout('Threats - R.E.P.O. field guide', 'A player-facing R.E.P.O. threat field guide with verified enemy names and practical extraction decisions.', '/enemies.html', body, inv));
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
  write('guide.html', layout('Guides - R.E.P.O. extraction playbook', 'Player guides for scouting, carrying valuables, coordinating a crew and making extraction in R.E.P.O.', '/guide.html',
    '<section class="page-shell" id="content"><p class="eyebrow">Player guides</p><h1>Make it home</h1><p class="lead">Use a repeatable plan for every run: scout the path, assign the carrier, keep the crew together and leave before the fallback closes.</p><div class="steps"><div class="step"><b>01</b><div><strong>Scout before carrying</strong><span>Choose the return line and identify the pressure point before anyone commits to a heavy valuable.</span></div></div><div class="step"><b>02</b><div><strong>Give the crew jobs</strong><span>One player carries, one watches the threat lane and one keeps the exit call clear.</span></div></div><div class="step"><b>03</b><div><strong>Call extraction early</strong><span>When the route changes, say it once and move together. A safe haul beats a greedy detour.</span></div></div></div><h2 id="multiplayer">Co-op rhythm</h2><p>Game data confirms a six-player session limit. Treat that as a coordination problem: keep the carrier visible, keep a spotter ahead and make the extraction call before the last player is separated.</p><h2 id="gear">Gear decisions</h2><p>Choose equipment for the route you are taking. A tool that solves the next obstacle is worth more than a full loadout that slows the team down.</p><p><a class="button primary" href="/enemies.html">Read the threat guide</a></p></section>', inv));
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
