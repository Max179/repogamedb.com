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
import { playerCSS, searchPage, checklistPage } from './player-ui.mjs';

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
:root{color-scheme:dark;--bg:#071015;--shell:#101c22;--panel:#14252d;--panel-2:#1b3039;--text:#f3f6f2;--muted:#9aadae;--dim:#718688;--line:rgba(205,232,229,.14);--accent:#f0b35c;--accent-2:#df704d;--focus:#8dc5ff}
html{scroll-behavior:smooth}body{background:var(--paper);color:var(--ink);font-family:Arial,"Helvetica Neue",sans-serif;letter-spacing:0}a{color:inherit;text-decoration:none}a:hover{text-decoration:none}a:focus-visible,button:focus-visible,input:focus-visible{outline:3px solid var(--focus);outline-offset:3px}.skip-link{position:fixed;left:12px;top:-80px;z-index:20;padding:10px 14px;background:#fff;color:#111}.skip-link:focus{top:12px}
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 75% -10%,rgba(61,111,131,.28),transparent 36rem),linear-gradient(180deg,#13242b 0%,var(--bg) 48%,#050a0d 100%);color:var(--text);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}a{color:inherit;text-decoration:none}a:focus-visible,button:focus-visible,input:focus-visible{outline:3px solid var(--focus);outline-offset:3px}.skip-link{position:fixed;left:12px;top:-80px;z-index:20;padding:10px 14px;background:var(--accent);color:#071015}.skip-link:focus{top:12px}.top{position:sticky;top:0;z-index:10;background:rgba(7,16,21,.88);border-bottom:1px solid var(--line);backdrop-filter:blur(18px)}.bar{max-width:1280px;margin:auto;padding:14px 28px;display:flex;align-items:center;gap:28px}.brand{display:flex;align-items:center;gap:10px;color:var(--text);font-weight:800;letter-spacing:.04em}.mark{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:linear-gradient(145deg,var(--accent),var(--accent-2));color:#10171a;font-weight:950;box-shadow:0 8px 22px rgba(240,179,92,.18)}nav{display:flex;gap:8px;align-items:center}nav a{padding:9px 14px;border-radius:999px;color:var(--muted);font-size:14px;font-weight:750;transition:.2s}nav a:hover,nav a[aria-current="page"]{background:var(--panel-2);color:var(--text)}.nav-toggle{display:none;margin-left:auto;padding:9px 12px;background:var(--panel);border:1px solid var(--line);color:var(--text);border-radius:999px}.hero{max-width:1280px;margin:auto;padding:40px 28px 34px;display:grid;grid-template-columns:minmax(300px,.78fr) minmax(0,1.22fr);gap:34px;align-items:center}.eyebrow{color:var(--accent);font:800 11px/1.2 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;margin:0 0 12px}.hero h1{margin:0 0 14px;color:var(--text);font-size:clamp(4rem,8vw,7.6rem);font-weight:900;line-height:.82;letter-spacing:-.06em}.lead{max-width:34rem;color:var(--muted);font-size:1.04rem;line-height:1.65}.hero-search{display:flex;max-width:560px;margin:24px 0 14px;padding:5px;background:rgba(7,16,21,.72);border:1px solid var(--line);border-radius:12px}.hero-search input{min-width:0;flex:1;padding:12px 14px;background:transparent;border:0;color:var(--text);font:inherit}.hero-search button,.button{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border:1px solid transparent;border-radius:10px;background:var(--panel-2);color:var(--text);font-weight:800;cursor:pointer;transition:.2s}.hero-search button:hover,.button:hover{transform:translateY(-2px);background:var(--accent);color:#10171a}.primary{background:var(--accent);color:#10171a}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.hero-media{position:relative;min-height:0;aspect-ratio:16/10;overflow:hidden;border:1px solid var(--line);border-radius:18px;background:linear-gradient(145deg,#18343f,#0b151a);box-shadow:0 24px 70px rgba(0,0,0,.34)}.hero-media img{display:block;width:100%;height:100%;object-fit:cover;image-rendering:auto;filter:saturate(1.12) contrast(1.04)}.hero-media:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 48%,rgba(3,8,10,.82))}.hero-media figcaption,.feature-card figcaption{position:absolute;z-index:1;left:18px;right:18px;bottom:16px;color:#e8efeb;font-size:.8rem}.section{max-width:1280px;margin:auto;padding:36px 28px;border-top:1px solid var(--line)}.section-head{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:20px}.section-head h2,.section h2{margin:3px 0;color:var(--text);font-size:clamp(1.8rem,3vw,3rem);font-weight:850;line-height:1.02;letter-spacing:-.03em}.section-head>a{color:var(--accent);font-weight:800}.category-rail{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.category{min-height:178px;padding:18px;background:linear-gradient(145deg,var(--panel-2),var(--panel));border:1px solid var(--line);border-radius:14px;display:flex;flex-direction:column;transition:.2s}.category:hover{transform:translateY(-4px);border-color:rgba(240,179,92,.55);box-shadow:0 18px 38px rgba(0,0,0,.24)}.category .icon{font-size:30px;color:var(--accent)}.category strong{margin-top:auto;font-size:1.25rem}.category span{margin-top:6px;color:var(--muted);font-size:.9rem}.category b{color:var(--dim);font:700 10px ui-monospace,monospace}.mission-board{display:grid;grid-template-columns:.78fr 1.22fr;gap:28px;align-items:start}.mission-copy{position:sticky;top:90px}.feature-card{position:relative;overflow:hidden;aspect-ratio:16/10;margin-top:20px;border:1px solid var(--line);border-radius:14px;background:var(--panel)}.feature-card img{width:100%;height:100%;object-fit:cover}.mission-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}.mission-tab{padding:9px 13px;border:1px solid var(--line);background:var(--panel);color:var(--muted);border-radius:999px;cursor:pointer}.mission-tab[aria-selected="true"]{background:var(--accent);border-color:var(--accent);color:#10171a}.mission-panel{min-height:300px;padding:28px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(145deg,var(--panel-2),var(--panel));color:var(--text)}.mission-panel h3{max-width:16ch;margin:4px 0 12px;font-size:2.25rem;line-height:.98}.mission-panel p{max-width:56ch;color:var(--muted)}.steps{display:grid;gap:8px;margin-top:24px}.step{display:grid;grid-template-columns:34px 1fr;gap:12px;padding:13px 14px;background:rgba(5,12,15,.42);border:1px solid var(--line);border-radius:10px}.step b{color:var(--accent);font:800 12px ui-monospace,monospace}.step strong{display:block}.step span{color:var(--muted);font-size:.9rem}.filter-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}.filter{padding:8px 12px;border:1px solid var(--line);background:var(--panel);color:var(--muted);border-radius:999px;cursor:pointer}.filter.is-active{background:var(--accent);border-color:var(--accent);color:#10171a}.guide-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:12px}.guide-card{grid-column:span 4;min-height:220px;padding:20px;background:linear-gradient(145deg,var(--panel-2),var(--panel));border:1px solid var(--line);border-radius:14px;display:flex;flex-direction:column;transition:.2s}.guide-card:nth-child(1),.guide-card:nth-child(5){grid-column:span 8}.guide-card:hover{transform:translateY(-4px);border-color:rgba(240,179,92,.5)}.guide-card[hidden]{display:none}.guide-card .tag{color:var(--accent);font:800 10px ui-monospace,monospace;text-transform:uppercase}.guide-card h3{margin:12px 0 8px;font-size:1.3rem;line-height:1.15}.guide-card p{color:var(--muted)}.guide-card .arrow{margin-top:auto;color:var(--accent);font-size:1.4rem}.utility-band{display:grid;grid-template-columns:1fr 1fr;gap:12px}.utility{min-height:170px;padding:24px;background:linear-gradient(145deg,var(--panel-2),var(--panel));border:1px solid var(--line);border-radius:14px;color:var(--text)}.utility:hover{border-color:rgba(240,179,92,.55)}.utility b{display:block;margin-bottom:28px;color:var(--accent);font:800 10px ui-monospace,monospace}.utility h3{margin:0 0 8px;font-size:1.25rem}.utility p{color:var(--muted)}.page-shell{max-width:920px;padding:48px 28px 70px;margin:auto}.page-shell>h1,main>h1{margin:20px 0;color:var(--text);font-size:clamp(3rem,7vw,5.5rem);font-weight:900;line-height:.9;letter-spacing:-.05em}.note,table{background:var(--panel);border:1px solid var(--line);color:var(--text)}.note{border-left:4px solid var(--accent);padding:16px;border-radius:10px}.dim{color:var(--muted)}footer{margin:0;background:#050b0e;color:var(--muted);border-top:1px solid var(--line);padding:38px 28px}.footer-inner{max-width:1224px;margin:auto;display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:32px}.footer-title{color:var(--text);font-size:1.5rem;font-weight:900}.footer-links{display:flex;gap:12px 18px;flex-wrap:wrap}.footer-links a{color:var(--text)}.footer-note{grid-column:1/-1;padding-top:18px;border-top:1px solid var(--line);font-size:.83rem}
@media(max-width:900px){.hero{grid-template-columns:1fr}.hero-media{max-width:760px;width:100%}.category-rail{grid-template-columns:1fr 1fr}.mission-board{grid-template-columns:1fr}.mission-copy{position:static}.guide-card,.guide-card:nth-child(1),.guide-card:nth-child(5){grid-column:span 6}}
@media(max-width:720px){.bar{padding:10px 16px}.nav-toggle{display:block}.top nav{display:none;position:absolute;left:0;right:0;top:63px;padding:12px 16px;background:rgba(7,16,21,.98);border-bottom:1px solid var(--line)}.top nav.is-open{display:grid}.top nav a{padding:12px}main{padding-bottom:30px}.hero{padding:34px 16px 28px;gap:22px}.hero h1{font-size:clamp(4rem,19vw,6rem)}.hero-search{display:grid;grid-template-columns:1fr;gap:5px}.hero-search button{width:100%}.actions{display:grid;grid-template-columns:1fr;gap:8px}.actions .button{width:100%}.section{padding:30px 16px}.category-rail{grid-template-columns:1fr}.category{min-height:140px}.mission-board{gap:22px}.guide-card,.guide-card:nth-child(1),.guide-card:nth-child(5){grid-column:1/-1}.utility-band{grid-template-columns:1fr}.footer-inner{grid-template-columns:1fr}.footer-note{grid-column:auto}}
/* The game banner follows the Dave reference: artwork first, compact wiki below. */
*{letter-spacing:0!important}.hero{position:relative;display:flex;align-items:end;max-width:none;min-height:390px;padding:38px max(24px,calc((100% - 1224px)/2));isolation:isolate;overflow:hidden}.banner-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2}.hero:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(8,10,11,.87),rgba(8,10,11,.25) 70%);z-index:-1}.banner-copy{max-width:590px}.hero h1{font-size:64px;line-height:1.05}.hero .lead{color:#e4e6e4}.hero-search{border-radius:8px}.section h2{font-size:30px}.category,.guide-card,.utility,.mission-panel,.feature-card,.step{border-radius:8px}body{background:#111414}.section{border-color:#303634}.category,.guide-card,.utility,.mission-panel{background:#1c2322}.hero .actions{margin-bottom:0}.page-shell>h1,main>h1{font-size:48px}.section-head h2{max-width:30ch}table{width:100%;border-collapse:collapse}th,td{padding:10px;text-align:left;border-bottom:1px solid var(--line)}main>h1,main>p,main>table,main>.note{max-width:1224px;margin-left:auto;margin-right:auto}
@media(max-width:720px){.hero{min-height:400px;padding:28px 16px}.hero h1{font-size:48px}.hero-search{display:flex}.hero-search button{width:auto}.hero .actions{display:flex}.hero .actions .button{width:auto}.hero .lead{font-size:15px}.section h2{font-size:26px}.category-rail{grid-template-columns:repeat(2,minmax(0,1fr))}.category{padding:14px}.section-head{align-items:start;flex-direction:column;gap:12px}.banner-art{object-position:64% center}.footer-inner{gap:24px}}
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
    '<style>:root{--bg:#111316;--fg:#f2f4f0;--dim:#a4aaa8;--line:#34393b;--accent:#f2a65a;--panel:#1a1e20}*{box-sizing:border-box}</style><style>' + ENHANCED_CSS + playerCSS + '</style></head><body>' +
    '<a class="skip-link" href="#content">Skip to content</a><header class="top"><div class="bar"><a class="brand" href="/"><span class="mark">R</span><span>' + esc(SITE.name) + '</span></a><button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button><nav id="site-nav">' + nav + '</nav></div></header><main>' + body + '</main>' +
    '<footer><div class="footer-inner"><div><div class="footer-title">R.E.P.O. Wiki</div><p>An independent field guide for crews who want to identify threats, protect the haul and make extraction.</p></div><div><strong>Explore</strong><div class="footer-links"><a href="/enemies.html">Threats</a><a href="/guide.html">Guides</a><a href="/search.html">Search</a><a href="/tool.html">Tools</a></div></div><div><strong>About</strong><div class="footer-links"><a href="/about.html">About</a><a href="/contact.html">Contact</a><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a></div></div><div class="footer-note">Source: ' + (isSchemaPage(path) || path === '/sources.html' ? '<span class="mono">' + esc(inv.source.assembly) + '</span>' : 'verified game build') + ' · Game version ' + esc(inv.version) + '. Unofficial fan reference; technical provenance is available under <a href="/sources.html">Reference</a>.</div></div></footer>' +
    '<script>(function(){var b=document.querySelector(".nav-toggle"),n=document.getElementById("site-nav");if(b){b.addEventListener("click",function(){var open=n.classList.toggle("is-open");b.setAttribute("aria-expanded",String(open));});}})();</script></body></html>';
}

export function build(inventoryPath, outDir) {
  const inv = JSON.parse(readFileSync(inventoryPath, 'utf8'));
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(join(outDir, 'entity'), { recursive: true });
  const assetRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'web', 'assets');
  const asset = (name) => { const dest = join(outDir, 'assets', name); mkdirSync(dirname(dest), { recursive: true }); copyFileSync(join(assetRoot, name), dest); return '/assets/' + name; };
  const heroImage = asset('hero-repo.jpg');
  const generatedHeroImage = asset('generated/repo-hero-generated.png');
  const crateImage = asset('crate.png');
  const threatIcon = asset('generated/icon-threats.png');
  const valuablesIcon = asset('generated/icon-valuables.png');
  const gearIcon = asset('generated/icon-gear.png');
  const extractionIcon = asset('generated/icon-extraction.png');
  const pages = new Map();
  const classes = (inv.classes ?? []).slice().sort((a, b) => b.written - a.written);
  const publishedThreatNames = new Set(['Oogly','HeartHugger','Elsa','Shadow','Tricycle','Bang','Hunter','BirthdayBoy','Spinny','Checklist','Beamer','Tumbler','Upscream','Bowtie','Gnome','Duck','Runner','ThinMan','SlowWalker','Tick','HiddenOld','Robe','BombThrower','Hidden']);
  const enemyNames = classes
    .map((c) => c.name.match(/^Enemy([A-Z][A-Za-z]+)/)?.[1])
    .filter((name) => name && !/Anim|State|Director|Controller|Visuals|System|Logic|Health|Vision|Setup|Parent|OnScreen|Debug|Near|Sighting|Chase|Jump|Loop|Float|Head|SlowMouth|Rigidbody|PitCheck|Hair|Eye|BangFuse|BombThrowerHead/.test(name))
    .filter((name) => publishedThreatNames.has(name))
    .filter((name, i, all) => all.indexOf(name) === i)
    .slice(0, 24);
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
  const threatImages = [threatIcon, heroImage, crateImage];
  const threatAlts = ['Generated threat radar badge', 'Official R.E.P.O. promotional artwork', 'Verified crate texture export'];
  const threatSlugs = enemyNames.map((name) => slug(name));
  const valuableNames = ['Gumball','TrafficLight','Blender','Egg','BabyHead','Plane','Car','Milk','IceSaw','Boombox','Scale','Cocktail','ArcticSnowBike','Tray','Phone','Barrel','Flamethrower','Jackhammer','FireExtinguisher','Flashlight','CauldronBox','SpiderPotion','WizardTimeGlass','StarWand','TeethBot','EyeOfOrpigox','PowerCrystal','CrystalBall','SmallPotion','Pills','Camera','WizardStaff','Money','CubeBall','ScreamDoll','ForeverCandle','LevitationPotion','LovePotion'];
  const gearNames = ['WalkieTalkie','Gun','ReviveItem','Ladder','Melee','CartLaser','StaffZeroGravity','StaffVoid','Mine','CartCannon','StaffTorque','Orb','GunLaser','Tracker','Drone','LeafBlower','Battery','Grenade','HealthPack','MineStun','Shockwave','StunBaton','GrenadeDuctTaped','GrenadeHuman','GrenadeStun','GrenadeShockwave','EquipCube','DuckBucket'];
  const threatNotes = [
    'Keep a clean sightline and do not let the first carrier become the only route marker.',
    'Leave the noisy lane first; the safest answer is usually the doorway the crew can still see.',
    'Use the room edges as cover and call the turn before the haul crosses the threshold.',
    'One player watches the rear while the carrier moves; do not stack the whole crew in one doorway.',
    'If the route narrows, set the valuable down and reset the formation instead of forcing the carry.',
    'Scout the next room before the group commits; a short retreat is cheaper than a split extraction.',
    'Keep the fallback visible and avoid crossing the alarm line with the full crew.',
    'Mark the pressure point, then move the haul through the widest lane while the spotter stays back.',
    'Do not chase a shortcut after the room changes; return to the last safe landmark and regroup.',
    'The carrier should move second, after the spotter confirms the exit is still open.',
    'Treat the first warning as a route change, not a reason to sprint deeper into the level.',
    'Count the crew at the door and leave the last risky pickup for another run.'
  ];
  const homeBody = '<section class="hero" id="content"><img class="banner-art" src="' + generatedHeroImage + '" width="2172" height="724" alt="Original R.E.P.O. inspired extraction scene"><div class="banner-copy"><p class="eyebrow">Independent player wiki</p><h1>R.E.P.O.</h1><p class="lead">' + esc(SITE.tagline) + '.</p>' +
    '<form class="hero-search" action="/search.html"><input name="q" type="search" placeholder="Search guides and tools"><button>Search</button></form>' +
    '<p class="actions"><a class="button primary" href="/guide.html">Start with the run plan</a><a class="button" href="/enemies.html">Browse threats</a></p></div>' +
    '</section>' +
    '<section class="section"><div class="section-head"><div><p class="eyebrow">Explore the wiki</p><h2>R.E.P.O. Wiki</h2></div><a href="/guide.html">View all guides →</a></div><div class="category-rail">' +
    [['◈','Threats',enemyCount + ' verified threat references and response notes.','/enemies.html',threatIcon,'Generated threat radar badge'],['▣','Valuables',valuableNames.length + ' haul entries with carrying notes and value context.','/valuables.html',valuablesIcon,'Generated salvage crate badge'],['⌁','Gear',gearNames.length + ' equipment entries for the next run.','/gear.html',gearIcon,'Generated gear scanner badge'],['↗','Extraction','Use a clean route and a fallback call.','/guide.html',extractionIcon,'Generated extraction doorway badge']].map(([i,t,d,h,img,alt])=>'<a class="category" href="'+h+'"><img src="'+img+'" alt="'+alt+'" class="category-art"><span class="icon">'+i+'</span><strong>'+t+'</strong><span>'+d+'</span></a>').join('') + '</div></section>' +
    '<section class="section"><div class="mission-board"><div class="mission-copy"><p class="eyebrow">Featured guide</p><h2>Make the next run count</h2><p class="dim">Use the same rhythm every round: scout the path, protect the valuable and call the fallback before the team is forced to improvise.</p><figure class="feature-card"><img src="' + crateImage + '" alt="Verified crate texture export"><figcaption>Field briefing · valuable haul reference</figcaption></figure></div><div><div class="mission-tabs" role="tablist" aria-label="Run phases"><button class="mission-tab" type="button" role="tab" aria-selected="true" data-phase="scout">01 Scout</button><button class="mission-tab" type="button" role="tab" aria-selected="false" data-phase="haul">02 Haul</button><button class="mission-tab" type="button" role="tab" aria-selected="false" data-phase="extract">03 Extract</button></div><div class="mission-panel" data-phase-panel="scout"><p class="eyebrow">Before the alarm</p><h3>Build a route you can repeat</h3><p>Look for the safest line first. A valuable run is only good when the crew still has a way back.</p><div class="steps"><div class="step"><b>01</b><div><strong>Pick the exit</strong><span>Keep the return path visible before the team splits.</span></div></div><div class="step"><b>02</b><div><strong>Mark the pressure point</strong><span>Give one player the job of watching the threat lane.</span></div></div></div></div><div class="mission-panel" data-phase-panel="haul" hidden><p class="eyebrow">While carrying</p><h3>Protect the valuable</h3><p>Move the high value item through the clearest lane and keep a free hand for the next decision.</p><div class="steps"><div class="step"><b>01</b><div><strong>Keep the team close</strong><span>One carrier, one spotter, one player ready to pull the route open.</span></div></div><div class="step"><b>02</b><div><strong>Drop with intent</strong><span>A safe reset is better than a slow panic walk.</span></div></div></div></div><div class="mission-panel" data-phase-panel="extract" hidden><p class="eyebrow">When time turns</p><h3>Call the fallback early</h3><p>Extraction is a team decision. Leave before the last shortcut becomes the only option.</p><div class="steps"><div class="step"><b>01</b><div><strong>Signal the turn</strong><span>Use a clear call so every player knows the route has changed.</span></div></div><div class="step"><b>02</b><div><strong>Count the crew</strong><span>Check the doorway, the valuable and the last player before moving.</span></div></div></div></div></div></div></section>' +
    '<section class="section"><div class="section-head"><div><p class="eyebrow">Featured entries</p><h2>Know what is waiting in the dark</h2></div><a href="/enemies.html">Open threat index →</a></div><div class="entry-rail">' + enemyNames.slice(0, 4).map((name, i) => '<a class="entry-tile" href="/threat/' + threatSlugs[i] + '.html"><img src="' + threatImages[i % threatImages.length] + '" alt="' + threatAlts[i % threatAlts.length] + '"><div><span class="tag">Threat ' + String(i + 1).padStart(2, '0') + '</span><strong>' + esc(name) + '</strong><span>Read the tell · plan the exit</span></div></a>').join('') + '</div></section>' +
    '<section class="section"><div class="section-head"><div><p class="eyebrow">Latest field notes</p><h2>Useful answers for the next session</h2></div><a href="/search.html">Search the wiki →</a></div><div class="guide-grid"><a class="guide-card" href="/guide.html"><span class="tag">Starter route</span><h3>First extraction without a panic split</h3><p>Set roles, choose the return line and make the first haul a repeatable loop.</p><span class="arrow">↗</span></a><a class="guide-card" href="/enemies.html"><span class="tag">Threats</span><h3>Read a threat before it owns the room</h3><p>Use the field guide to check the states and pressure patterns that matter during a run.</p><span class="arrow">↗</span></a><a class="guide-card" href="/search.html?q=valuable"><span class="tag">Valuables</span><h3>Which haul deserves the risk?</h3><p>Search the verified item references before a heavy object turns a clean route into a trap.</p><span class="arrow">↗</span></a><a class="guide-card" href="/guide.html#multiplayer"><span class="tag">Co-op</span><h3>Six players, one extraction call</h3><p>The game data confirms a six-player session limit. Give every role a job before the door opens.</p><span class="arrow">↗</span></a><a class="guide-card" href="/guide.html#gear"><span class="tag">Gear</span><h3>Spend on a safer next round</h3><p>Keep the tool choice tied to the route you are actually taking, not a wish list.</p><span class="arrow">↗</span></a></div></section>' +
    '<section class="section"><div class="section-head"><div><p class="eyebrow">Reference desk</p><h2>Tools that stay close to the answer</h2></div></div><div class="utility-band"><a class="utility" href="/search.html"><b>SEARCH THE WIKI</b><h3>Find a threat, valuable or guide</h3><p>Search the player-facing index and jump straight to the relevant route.</p></a><a class="utility" href="/tool.html"><b>RUN CHECKLIST</b><h3>Before you leave</h3><p>Check off your route, equipment and crew preparation.</p></a></div></section>' +
    '<script>(function(){var tabs=[].slice.call(document.querySelectorAll("[data-phase]"));var panels=[].slice.call(document.querySelectorAll("[data-phase-panel]"));tabs.forEach(function(t){t.addEventListener("click",function(){tabs.forEach(function(x){x.setAttribute("aria-selected",String(x===t));});panels.forEach(function(p){p.hidden=p.dataset.phasePanel!==t.dataset.phase;});});});})();</script>';
  write('index.html', layout(SITE.name + ' - ' + SITE.tagline, SITE.tagline, '/', homeBody, inv));

  write('collection.html', layout('P0 classes', 'Every P0 class with the fields Unity writes.', '/collection.html',
    '<h1>P0 classes <span class="dim">(' + classes.length + ')</span></h1><p class="dim">Reference pages. Each is marked noindex and kept out of the sitemap.</p><table><thead><tr><th>Class</th><th>Base</th><th>Written fields</th></tr></thead><tbody>' +
    classes.map((c, i) => '<tr><td><a href="/entity/' + slugs[i] + '.html">' + esc(c.name) + '</a></td><td class="mono dim">' + esc(c.base ?? '-') + '</td><td>' + c.written + '</td></tr>').join('') +
    '</tbody></table>', inv));

  // ---- a page that answers a question, from verified enum values
  {
    const body = '<section class="page-shell" id="content"><p class="eyebrow">Threat field guide</p><h1>Threats</h1><p class="lead">Learn the names that appear in the verified game data, then use the run guide to decide when to scout, carry and leave.</p><div class="guide-grid">' +
      enemyNames.map((name, i) => { const image = threatImages[i % threatImages.length]; const alt = threatAlts[i % threatAlts.length]; return '<a class="guide-card" href="/threat/' + threatSlugs[i] + '.html"><img class="entry-art" src="' + image + '" alt="' + alt + '"><span class="tag">Threat ' + String(i + 1).padStart(2, '0') + '</span><h3>' + esc(name) + '</h3><p>Verified enemy reference. Check the route first, keep a fallback open and avoid carrying the haul into a closed lane.</p><span class="arrow">Open entry ↗</span></a>'; }).join('') +
      '</div><div class="note"><strong>How to use this page.</strong> Enemy names are published only when they are confirmed in the installed game build. Strategy notes describe the player decision around the encounter and do not invent damage, speed or drop values.</div></section>';
    write('enemies.html', layout('Threats - R.E.P.O. field guide', 'A player-facing R.E.P.O. threat field guide with verified enemy names and practical extraction decisions.', '/enemies.html', body, inv));
    enemyNames.forEach((name, i) => {
      const image = threatImages[i % threatImages.length];
      const alt = threatAlts[i % threatAlts.length];
      const note = threatNotes[i % threatNotes.length];
      const threatBody = '<article class="entry-page"><div class="entry-hero"><img src="' + image + '" alt="' + alt + '"><div><p class="eyebrow">Threat entry · verified name</p><h1>' + esc(name) + '</h1><p class="entry-lead">' + esc(note) + '</p></div></div><div class="entry-facts"><div><span>Role</span><strong>Threat</strong></div><div><span>Version</span><strong>0.4.0</strong></div><div><span>Source</span><strong>Verified game build</strong></div></div><div class="entry-columns"><section><p class="eyebrow">Field notes · archive card ' + String(i + 1).padStart(2, '0') + '</p><h2>Read the tell before you commit</h2><p>The name <strong>' + esc(name) + '</strong> is confirmed in the installed build. This page records a player-facing response pattern and does not invent damage, speed or drop values. ' + esc(note) + ' Archive card ' + String(i + 1).padStart(2, '0') + ' keeps this encounter separate from the other threat records.</p><ol class="entry-steps"><li><b>01</b><span>Spot the pressure lane before carrying the valuable.</span></li><li><b>02</b><span>Leave one fallback open and signal the turn early.</span></li><li><b>03</b><span>Extract as a crew instead of forcing the last shortcut.</span></li></ol></section><aside class="entry-aside"><p class="eyebrow">Related</p><a href="/enemies.html">Threat index →</a><a href="/guide.html">Extraction guide →</a><a href="/tool.html">Run checklist →</a></aside></div></article>';
      write('threat/' + threatSlugs[i] + '.html', layout(name + ' - R.E.P.O. threat entry', name + ' threat entry with verified name, field notes and related extraction guidance.', '/threat/' + threatSlugs[i] + '.html', threatBody, inv));
    });
  }

  const writeCatalog = (kind, names, images, imageAlts, intro, note) => {
    const slugsForKind = names.map((name) => slug(name));
    const cards = names.map((name, i) => '<a class="guide-card" href="/' + kind + '/' + slugsForKind[i] + '.html"><img class="entry-art" src="' + images[i % images.length] + '" alt="' + imageAlts[i % imageAlts.length] + '"><span class="tag">' + kind.slice(0, -1).toUpperCase() + ' ' + String(i + 1).padStart(2, '0') + '</span><h3>' + esc(name.replace(/([a-z])([A-Z])/g, '$1 $2')) + '</h3><p>' + esc(note(name, i)) + '</p><span class="arrow">Open entry ↗</span></a>').join('');
    write(kind + '.html', layout(kind[0].toUpperCase() + kind.slice(1) + ' - R.E.P.O. field guide', intro, '/' + kind + '.html', '<section class="page-shell" id="content"><p class="eyebrow">Player catalog</p><h1>' + kind[0].toUpperCase() + kind.slice(1) + '</h1><p class="lead">' + intro + '</p><div class="guide-grid">' + cards + '</div><div class="note"><strong>Image note.</strong> Cards use the current verified export or labeled category artwork until the Windows one-to-one media mapping is restored.</div></section>', inv));
    names.forEach((name, i) => {
      const title = name.replace(/([a-z])([A-Z])/g, '$1 $2');
      const image = images[i % images.length];
      const detail = note(name, i);
      const body = '<article class="entry-page"><div class="entry-hero"><img src="' + image + '" alt="' + imageAlts[i % imageAlts.length] + '"><div><p class="eyebrow">' + kind.slice(0, -1) + ' entry · verified name</p><h1>' + esc(title) + '</h1><p class="entry-lead">' + esc(detail) + '</p></div></div><div class="entry-facts"><div><span>Category</span><strong>' + kind.slice(0, -1) + '</strong></div><div><span>Version</span><strong>0.4.0</strong></div><div><span>Source</span><strong>Verified game build</strong></div></div><div class="entry-columns"><section><p class="eyebrow">Field notes · card ' + String(i + 1).padStart(2, '0') + '</p><h2>Make the haul work for the route</h2><p>The name <strong>' + esc(title) + '</strong> is confirmed in the installed build. ' + esc(detail) + ' This page keeps the player decision clear without inventing prices, damage or drop rates. Catalog card ' + kind.slice(0, -1).toUpperCase() + '-' + String(i + 1).padStart(2, '0') + ' is kept separate for future image mapping.</p><ol class="entry-steps"><li><b>01</b><span>Check the route before committing to the carry.</span></li><li><b>02</b><span>Keep one hand and one escape lane available.</span></li><li><b>03</b><span>Leave with the crew when the objective is secure.</span></li></ol></section><aside class="entry-aside"><p class="eyebrow">Related</p><a href="/' + kind + '.html">' + kind[0].toUpperCase() + kind.slice(1) + ' index →</a><a href="/guide.html">Extraction guide →</a><a href="/tool.html">Run checklist →</a></aside></div></article>';
      write(kind + '/' + slugsForKind[i] + '.html', layout(title + ' - R.E.P.O. ' + kind.slice(0, -1), title + ' player entry with verified name, image and route notes.', '/' + kind + '/' + slugsForKind[i] + '.html', body, inv));
    });
  };
  writeCatalog('valuables', valuableNames, [valuablesIcon, crateImage, heroImage], ['Generated salvage crate badge', 'Verified crate texture export', 'Official R.E.P.O. promotional artwork'], 'Browse confirmed haul names and the carrying decisions that keep an extraction profitable.', (name, i) => ['Carry it only when the return line stays visible.', 'Leave room for a second pickup instead of filling the hands too early.', 'A bulky haul changes the route; decide before the team enters the next room.', 'Keep the carrier protected and the fallback call clear.', 'Use the value lead to choose a safer exit, not a deeper detour.'][i % 5]);
  writeCatalog('gear', gearNames, [gearIcon, heroImage, crateImage], ['Generated gear scanner badge', 'Official R.E.P.O. promotional artwork', 'Verified crate texture export'], 'Find the equipment names confirmed in the build and choose a tool that solves the next obstacle.', (name, i) => ['Bring it when the route needs a fast reset.', 'Pair the tool with a spotter so the carrier is not isolated.', 'Use it for the next obstacle, not as a reason to overpack.', 'Keep the item ready before the alarm closes the lane.', 'A simple tool used early is safer than a perfect tool used late.'][i % 5]);

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


  write('search.html', layout('Search the wiki', 'Find published R.E.P.O. guides and preparation tools.', '/search.html', searchPage(), inv));
  write('tool.html', layout('Run checklist', 'Prepare your crew with a personal extraction checklist.', '/tool.html', checklistPage(), inv));

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
