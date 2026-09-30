#!/usr/bin/env node
/**
 * Site tests for the R.E.P.O. build. Deterministic: builds into a temp dir and inspects the output.
 * A gate that cannot fail is not a gate, so every check below asserts something that has been wrong at least once
 * (a missing canonical, a page missing its source line, a sitemap listing the 404 page).
 */
import { readFileSync, existsSync, rmSync, readdirSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { build, lookupFields, SITE, NAV, CATEGORIES, REFERENCE_PATHS } from '../pipeline/site.mjs';

const INV = 'data/normalized/p0-inventory.json';
let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => { if (cond) { pass++; console.log('  PASS ' + name); } else { fail++; console.log('  FAIL ' + name + (detail ? ' :: ' + detail : '')); } };

const inv = JSON.parse(readFileSync(INV, 'utf8'));

// --- the tool's pure function: normal, boundary, invalid
ok('lookupFields returns rows for a real query', lookupFields(inv, 'valuable', 5).length > 0);
ok('lookupFields is case-insensitive', lookupFields(inv, 'VALUABLE', 5).length === lookupFields(inv, 'valuable', 5).length);
ok('lookupFields returns an empty list (not an error) when nothing matches', lookupFields(inv, 'zzz-no-such-field-zzz', 5).length === 0);
ok('lookupFields clamps the limit to its documented range', lookupFields(inv, '', 10_000).length <= 200 && lookupFields(inv, '', 0).length >= 1);
ok('lookupFields refuses a non-string query rather than coercing it', (() => { try { lookupFields(inv, 42); return false; } catch { return true; } })());

// --- the build
const dir = mkdtempSync(join(tmpdir(), 'repo-site-'));
let stats;
try {
  stats = build(INV, dir);
  const required = ['index.html', 'search.html', 'collection.html', 'guide.html', 'tool.html', 'sources.html',
    'about.html', 'contact.html', 'disclaimer.html', 'privacy.html', 'terms.html', '404.html', 'sitemap.xml', 'robots.txt'];
  const missing = required.filter((f) => !existsSync(join(dir, f)));
  ok('every required route is emitted', missing.length === 0, missing.join(', '));
  ok('an entity page is emitted for every P0 class',
    readdirSync(join(dir, 'entity')).filter((f) => f.endsWith('.html')).length === (inv.classes ?? []).length,
    readdirSync(join(dir, 'entity')).length + ' pages for ' + inv.classes.length + ' classes');

  const html = readdirSync(join(dir, 'entity')).slice(0, 25).map((f) => readFileSync(join(dir, 'entity', f), 'utf8'));
  ok('every sampled entity page carries a canonical URL', html.every((h) => h.includes('<link rel="canonical" href="' + SITE.url + '/entity/')));
  ok('every sampled reference page names its source and game version', html.every((h) => h.includes('Assembly-CSharp.dll') && h.includes(inv.version)));
  const f0 = inv.classes[0].fields[0];
  const confidences = new Set();
  let extracted = 0;
  for (const c of inv.classes) for (const f of c.fields ?? []) { confidences.add(f.confidence); if (f.confidence === 'extracted') extracted++; }
  ok('every field carries per-field provenance',
    f0.source === inv.source.assembly && f0.version === inv.version && 'value' in f0 &&
    [...confidences].every((c) => c === 'verified-schema' || c === 'extracted'), [...confidences].join(','));
  // Invariant rather than a count: a field may claim `extracted` only when it carries a non-null value. Whether a
  // title has any extracted values yet depends on its classes (R.E.P.O. 45, TCG 0 because its classes live in
  // UnityEngine), so asserting a minimum here would fail an honest dataset.
  let extractedWithoutValue = 0;
  for (const c of inv.classes) for (const f of c.fields ?? []) if (f.confidence === 'extracted' && (f.value === null || f.value === undefined)) extractedWithoutValue++;
  ok('no field claims an extracted value it does not have', extractedWithoutValue === 0, extractedWithoutValue + ' field(s)');
  ok('per-field provenance is rendered on an entity page',
    readFileSync(join(dir, 'entity', readdirSync(join(dir, 'entity')).find((f) => f.endsWith('.html'))), 'utf8').includes('verified-schema'));

  ok('every sampled entity page marks the values it does not have as unknown', html.every((h) => /unknown/i.test(h)));

  const sitemap = readFileSync(join(dir, 'sitemap.xml'), 'utf8');
  const locs = (sitemap.match(/<loc>/g) ?? []).length;
  ok('the sitemap omits the 404 page and lists every other page', !sitemap.includes('/404.html') && locs === stats.urls, locs + ' vs ' + stats.urls);
  ok('robots.txt points at the sitemap', readFileSync(join(dir, 'robots.txt'), 'utf8').includes('Sitemap: ' + SITE.url + '/sitemap.xml'));
  ok('the build reports the page count it emitted', stats.pages > 300, String(stats.pages));
  // A nav target that is not emitted is a dangling link on every page; the route list check did not cover it.
  const missingNav = NAV.filter(([href]) => !existsSync(join(dir, href.replace(/^\//, ''))));
  ok('every navigation target is a page that exists', missingNav.length === 0, missingNav.map(([h]) => h).join(', '));
  // The product routes named by the objective must each carry a canonical URL, an index directive and the source
  // line in the footer; their existence is already covered by "every required route is emitted" above.
  const PRODUCT = required.filter((f) => f.endsWith('.html') && f !== '404.html');
  const weakMeta = PRODUCT.filter((f) => existsSync(join(dir, f))).filter((f) => {
    const h = readFileSync(join(dir, f), 'utf8');
    const robots = /content="(no)?index, follow"/.test(h);
    return !h.includes('rel="canonical"') || !robots || !h.includes('Source:');
  });
  ok('every product route carries canonical, a robots directive and its source line', weakMeta.length === 0, weakMeta.join(', '));
  // Two indexable pages that answer the same query with the same text are duplicate content; the audit that
  // prompted this gate found search.html and tool.html sharing 98.8% of their main text.
  const mains = {};
  for (const m of (sitemap.match(/<loc>([^<]+)<\/loc>/g) ?? [])) {
    const rel = m.replace('<loc>' + SITE.url + '/', '').replace('</loc>', '') || 'index.html';
    const h = readFileSync(join(dir, rel), 'utf8');
    const body = h.match(/<main>([\s\S]*?)<\/main>/);
    mains[rel] = (body ? body[1] : h).replace(/\s+/g, ' ').trim();
  }
  // Character 40-grams with CONTAINMENT. Two earlier versions of this metric failed and are recorded here so the
  // reasoning is not repeated: a Jaccard over character shingles measured 0.070 (union denominator plus a shifted
  // page), and word 6-grams measured 0.048 because the inline JSON payload has almost no whitespace (42 grams for
  // an 18 KB page). Containment against the smaller page tolerates a contiguous insertion and dense payloads.
  // Every 40-character window (stride 1, hashed to an int to keep memory bounded). The stride-10 version of this
  // function was measured at 0.131 containment on two pages whose longest common block is 17284 of 18173
  // characters: sampled shingles land on different phases in the two pages, so the sampled sets barely intersect.
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
  const keys = Object.keys(mains).map((k) => ({ name: k, grams: grams(mains[k]) }));
  const tooSimilar = [];
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const s = containment(keys[i].grams, keys[j].grams);
      if (s > 0.9) tooSimilar.push(keys[i].name + ' ~ ' + keys[j].name + ' = ' + s.toFixed(2));
    }
  }
  ok('no two indexable pages share more than 90% of their main content', tooSimilar.length === 0, tooSimilar.join(', '));

  const status = JSON.parse(readFileSync('reports/status.json', 'utf8'));
  ok('the status records the decoded value layer with a positive count',
    status.valueLayer !== null && status.valueLayer.count > 0, JSON.stringify(status.valueLayer));
  ok('the status manifest records a source-only handoff',
    status.handoff.excludedCount === 0 && (status.handoff.byTop['data/raw'] ?? 0) === 0 &&
    (status.handoff.byTop['data'] ?? 0) > 0 && status.handoff.trackedFiles > 5,
    JSON.stringify(status.handoff));
  ok('the machine-readable status matches this build',
    status.pages === stats.pages && status.indexable === stats.urls && status.noindex === stats.pages - stats.urls,
    JSON.stringify({ buildPages: stats.pages, statusPages: status.pages, buildUrls: stats.urls, statusUrls: status.indexable }));

  // Every internal href must resolve: a dangling link is a broken page for a reader and for a crawler.
  const htmlFiles = [];
  const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const f = join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith('.html')) htmlFiles.push(f); } };
  walk(dir);
  const dangling = [];
  for (const f of htmlFiles) {
    const h = readFileSync(f, 'utf8');
    for (const m of h.matchAll(/href="(\/[^"#?]*)([#?][^"]*)?"/g)) {
      const t = m[1] === '/' ? 'index.html' : m[1].slice(1);
      if (!existsSync(join(dir, t)) && !existsSync(join(dir, t, 'index.html'))) dangling.push(f.slice(dir.length) + ' -> ' + m[1]);
    }
  }
  ok('every internal link resolves to an emitted file', dangling.length === 0, dangling.slice(0, 5).join(', '));

  // A title that repeats the site name, or two pages sharing a title or description, is a real SEO defect.
  const seenTitles = new Set(); const seenDescs = new Set(); const badMeta = [];
  for (const u of (sitemap.match(/<loc>([^<]+)<\/loc>/g) ?? [])) {
    const rel = u.replace('<loc>' + SITE.url + '/', '').replace('</loc>', '') || 'index.html';
    const h = readFileSync(join(dir, rel), 'utf8');
    const t = (h.match(/<title>([^<]*)<\/title>/) ?? [])[1] ?? '';
    const d = (h.match(/<meta name="description" content="([^"]*)"/) ?? [])[1] ?? '';
    const repeats = t.split(SITE.name).length - 1;
    if (!t || !d || seenTitles.has(t) || seenDescs.has(d) || repeats > 1) badMeta.push(rel + (repeats > 1 ? ' (site name x' + repeats + ')' : ''));
    seenTitles.add(t); seenDescs.add(d);
  }
  ok('every indexable page has a unique title and description, without a repeated site name', badMeta.length === 0, badMeta.slice(0, 4).join(', '));

  // Page-weight budget: every page must stay openable on a phone. The ceiling is 1 MiB; the largest page today is
  // the 782 KiB field-name list, which the reports record as the next optimisation target.
  const heavyPages = [];
  for (const f of htmlFiles) {
    const bytes = readFileSync(f).length;
    if (bytes > 1048576) heavyPages.push(f.slice(dir.length) + ' = ' + Math.round(bytes / 1024) + ' KiB');
  }
  ok('no emitted page exceeds the 1 MiB weight budget', heavyPages.length === 0, heavyPages.join(', '));

  // Claims this project already falsified must not come back. Each phrase below was true once and is not now, so a
  // page asserting one would be a false statement to a reader rather than a style issue.
  const FORBIDDEN = ['does not parse yet', 'no field is listed', 'Every field value'];
  const offenders = [];
  for (const f of htmlFiles) {
    const h = readFileSync(f, 'utf8');
    for (const phrase of FORBIDDEN) if (h.includes(phrase)) offenders.push(f.slice(dir.length) + ' :: ' + phrase);
  }
  ok('no page repeats a claim this project has already falsified', offenders.length === 0, offenders.slice(0, 4).join(', '));

  // Neither value-pipeline script may name the other project: that is how a run here rewrote the other repository.
  {
    const other = SITE.domain === 'repogamedb.com' ? 'tcg-shop' : 'repo';
    const offenders = ['pipeline/normalize_values.ts', 'pipeline/decode_values2.ts']
      .filter((f) => readFileSync(f, 'utf8').includes('/Desktop/' + other));
    ok('the value pipeline only ever touches this project', offenders.length === 0, 'cross-project path in ' + offenders.join(', '));
  }

  // The content model decides what may become a page: an entry that fails its rules must not reach the build.
  ok('the published entries pass the content gate', (() => {
    try { execFileSync(process.execPath, ['tools/content-gate.mjs'], { stdio: 'pipe' }); return true; }
    catch (e) { return String(e.stdout ?? '') + String(e.message ?? ''); }
  })() === true);

  const published = readdirSync('content/published').filter((x) => x.endsWith('.json')).map((x) => JSON.parse(readFileSync(join('content', 'published', x), 'utf8')));
  // Entities with a confirmed game picture are published under /entries/. A subject with no confirmed picture is a
  // noindex note in the evidence layer, out of the sitemap, never dressed up as a finished entry.
  const entityFile = (e) => (e.imageTier === 'game-image' ? join(dir, 'entries', e.id + '.html') : join(dir, 'reference', 'notes', e.id + '.html'));
  const missingPages = published.filter((e) => !existsSync(entityFile(e)));
  ok('every published subject has a page: entities under /entries/, picture-less subjects as notes', missingPages.length === 0, missingPages.map((e) => e.id).join(', '));
  const misSitemapped = published.filter((e) => (e.imageTier === 'game-image'
    ? !sitemap.includes(SITE.url + '/entries/' + e.id + '.html')
    : sitemap.includes(SITE.url + '/reference/notes/' + e.id + '.html')));
  ok('the sitemap lists entities only, and keeps picture-less subjects out of it', misSitemapped.length === 0, misSitemapped.map((e) => e.id).join(', '));
  const thin = [];
  for (const e of published) {
    const h = readFileSync(entityFile(e), 'utf8');
    if (!h.includes(e.title) || !h.includes(e.summary)) thin.push(e.id + ':text');
    if (e.imageTier === 'game-image') {
      if (!h.includes('What the game establishes') || !h.includes('Version and sources')) thin.push(e.id + ':structure');
    } else if (!h.includes('No confirmed picture from the game yet')) thin.push(e.id + ':note-label');
    if (!/<img[^>]+alt="[^"]+"/.test(h)) thin.push(e.id + ':image');
    // Only code-style names count as a leak: a plain English word such as "Shelf" is also the subject of the entry.
    const ids = (e.facts ?? []).flatMap((x) => String(x.evidence).replace(/^identifiers?:?\s*/, '').split(/[,\s]+/))
      .filter((x) => /[a-z][A-Z]|[0-9]|_/.test(x));
    for (const id of ids) if (h.includes(id)) thin.push(e.id + ': leaks ' + id + ' to players');
  }
  ok('every entity page carries its text, structure and image, leaks no identifier; every note says why it is a note', thin.length === 0, thin.slice(0, 6).join(', '));
  const badRefPages = [...REFERENCE_PATHS].filter((rel) => {
    const file = rel.endsWith('/') ? join(dir, rel.slice(1), 'index.html') : join(dir, rel.slice(1));
    const h = readFileSync(file, 'utf8');
    return !h.includes('noindex, follow') || sitemap.includes(SITE.url + rel);
  });
  ok('technical reference pages are noindex and stay out of the sitemap', badRefPages.length === 0, badRefPages.join(', '));

  // The picture rule, checked on the built pages rather than only in the content files: an entry must say whether
  // its picture came from the game or is an original diagram, and most entries must actually carry a game image.
  const unlabelled = [];
  for (const e of published) {
    const h = readFileSync(entityFile(e), 'utf8');
    const hasGame = (e.images ?? []).some((i) => i.kind === 'game');
    if (hasGame && !h.includes('Picture taken from the game')) unlabelled.push(e.id + ':game');
    if (!hasGame && !h.includes('No confirmed picture from the game yet')) unlabelled.push(e.id + ':diagram');
  }
  ok('every page says whether its picture came from the game or is a diagram note', unlabelled.length === 0, unlabelled.slice(0, 5).join(', '));

  const illustrated = published.filter((e) => (e.images ?? []).some((i) => i.kind === 'game'));
  ok('at least half of the published entries carry an image taken from the game',
    illustrated.length * 2 >= published.length, illustrated.length + ' of ' + published.length + ' entries');

  // The five player sections, in order; the technical reference lives in the footer only.
  const expectedNav = ['/guide.html', '/entities/', '/articles/', '/tools/', '/updates.html'];
  ok('the top navigation is exactly the five player sections, in order',
    NAV.length === expectedNav.length && NAV.every(([h], i) => h === expectedNav[i]) &&
    !NAV.some(([h]) => h === '/reference/' || h === '/collection.html'), NAV.map(([h]) => h).join(' '));
  ok('the home page leads with the game, not with build statistics or internal terminology', (() => {
    const h = readFileSync(join(dir, 'index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
    return !/\b(schema|il2cpp|assembly-csharp|metadata|namespace|class|classes|field|fields)\b/i.test(h) && !/gameClasses|engineClasses/.test(h);
  })());
  const catPages = CATEGORIES.filter((c) => published.some((e) => c.src.includes(e.category) && e.imageTier === 'game-image'));
  const badCatPages = catPages.filter((c) => {
    const rel = 'entities/' + c.key + '.html';
    if (!existsSync(join(dir, rel)) || !sitemap.includes(SITE.url + '/' + rel)) return true;
    const h = readFileSync(join(dir, rel), 'utf8');
    return !/<figure class="banner">[\s\S]*?<img/.test(h) || !/id="f"/.test(h) || !/class="card"/.test(h);
  });
  ok('every player category has an indexable page with a cover picture, a filter and cards',
    catPages.length > 0 && badCatPages.length === 0, badCatPages.map((c) => c.key).join(', '));

  const articles = readdirSync('content/articles').filter((x) => x.endsWith('.json')).map((x) => JSON.parse(readFileSync(join('content', 'articles', x), 'utf8')));
  ok('every published article has a page', articles.every((a) => existsSync(join(dir, 'articles', a.id + '.html'))));
  const thinArticles = [];
  for (const a of articles) {
    const h = readFileSync(join(dir, 'articles', a.id + '.html'), 'utf8');
    for (const section of ['Applies to', 'Before you start', 'Steps', 'Common mistakes', 'Related entries', 'Sources']) if (!h.includes(section)) thinArticles.push(a.id + ':' + section);
    if (!/<ol[\s>]/.test(h) || (a.steps ?? []).length < 3) thinArticles.push(a.id + ':steps');
    if (!sitemap.includes(SITE.url + '/articles/' + a.id + '.html')) thinArticles.push(a.id + ':not in sitemap');
    const ids = (a.steps ?? []).flatMap((s) => String(s.because).split(/[(),\s]+/)).filter((x) => /[a-z][A-Z]|[0-9]|_/.test(x));
    for (const id of ids) if (h.includes(id)) thinArticles.push(a.id + ': leaks ' + id);
  }
  ok('every article page carries its goal, version, prerequisites, steps, mistakes, related entities and sources', thinArticles.length === 0, thinArticles.slice(0, 6).join(', '));
  // The player questions live in a file of their own and the build swallows a broken one, so check the file
  // itself and that every question belongs to a published guide (not every guide has one here).
  let questions = null;
  try { questions = JSON.parse(readFileSync(join('data', 'guide-questions.json'), 'utf8')); } catch (e) { questions = null; }
  const questionProblems = [];
  if (!questions) questionProblems.push('data/guide-questions.json does not parse');
  for (const id of Object.keys(questions ?? {})) if (!articles.some((a) => a.id === id)) questionProblems.push(id + ':not a published guide');
  ok('the player questions parse and belong to published guides', questionProblems.length === 0, questionProblems.slice(0, 6).join(', '));

  // An image claiming to come from the game must match the manifest that documents where it came from.
  const manifest = JSON.parse(readFileSync('content/images-manifest.json', 'utf8'));
  const gameImages = published.flatMap((e) => (e.images ?? []).filter((i) => i.kind === 'game').map((i) => ({ id: e.id, img: i })));
  const badGame = gameImages.filter(({ img }) => !(manifest.records ?? []).some((r) => r.file === img.file) || !existsSync(join(dir, img.file)));
    // The binding picture rule is enforced in two steps: tools/image-sanity.py flags every exported file that carries
  // almost no variation, and this gate refuses to let a flag go unanswered. Every flagged file must have a verdict
  // written into reports/image-reviews.md, so a near-blank or flat sheet cannot sit in the manifest unexamined.
  ok('the sanity report covers every mapped picture', (() => {
    const manifestCount = JSON.parse(readFileSync('content/images-manifest.json', 'utf8')).records.length;
    const totals = readFileSync('reports/image-sanity.md', 'utf8').match(/Totals: (\d+) records, (\d+) flagged/);
    return totals && Number(totals[1]) === manifestCount ? true : 'sanity report does not cover the manifest';
  })() === true);
  ok('every picture the sanity pass flagged has a verdict in the review ledger', (() => {
    const sanity = readFileSync('reports/image-sanity.md', 'utf8');
    const ledger = readFileSync('reports/image-reviews.md', 'utf8');
    const files = [...new Set([...sanity.matchAll(/mapped\/[^\s|)]+/g)].map((m) => m[0].split('/').pop()))];
    const missing = files.filter((f) => !ledger.includes(f));
    return missing.length ? missing.join(', ') : true;
  })() === true);

ok('every game image used in an entry has a manifest record and exists in the build', badGame.length === 0 && gameImages.length > 0,
    badGame.map((x) => x.id + ':' + x.img.file).join(', ') || (gameImages.length ? '' : 'no game image is used yet'));

  const urlsCfg = JSON.parse(readFileSync('config/urls.json', 'utf8'));
  const classified = new Map((urlsCfg.entries ?? []).map((e) => [e.url, e.action]));
  const emitted = htmlFiles.map((f) => '/' + f.slice(dir.length + 1).split('\\').join('/')).filter((p) => p !== '/404.html');
  const unclassified = emitted.filter((p) => !classified.has(p));
  const keepNotInSitemap = [...classified].filter(([u, a]) => a === 'keep' && !sitemap.includes(SITE.url + u)).map(([u]) => u);
  const noindexInSitemap = [...classified].filter(([u, a]) => a === 'noindex' && sitemap.includes(SITE.url + u)).map(([u]) => u);
  const badRedirects = (urlsCfg.redirects ?? []).filter((r) => !existsSync(join(dir, String(r.to).replace(/^\//, ''))));
  ok('every emitted page is classified in config/urls.json and the classification matches the sitemap',
    unclassified.length === 0 && keepNotInSitemap.length === 0 && noindexInSitemap.length === 0 && badRedirects.length === 0,
    JSON.stringify({ unclassified: unclassified.slice(0, 3), keepNotInSitemap: keepNotInSitemap.slice(0, 3), noindexInSitemap: noindexInSitemap.slice(0, 3), badRedirects: badRedirects.slice(0, 3) }));
  const missingAlternates = htmlFiles.filter((f) => {
    const h = readFileSync(f, 'utf8');
    return !h.includes('hreflang="en"') || !h.includes('hreflang="x-default"');
  });
  ok('every page declares the languages it really has (en plus x-default, self-referencing)', missingAlternates.length === 0, missingAlternates.slice(0, 3).join(', '));
  const notMobile = htmlFiles.filter((f) => {
    const h = readFileSync(f, 'utf8');
    if (!h.includes('name="viewport"') || !h.includes('width=device-width')) return true;
    for (const m of h.matchAll(/style="[^"]*width:\s*(\d+)px/gi)) if (Number(m[1]) > 400) return true;
    return false;
  });
  ok('mobile smoke: every page has a responsive viewport and no fixed width wider than a phone', notMobile.length === 0, notMobile.slice(0, 3).join(', '));

  // The deploy target is declared twice (workflow flag and wrangler.toml); the two must agree.
  {
    const wfText = readFileSync('.github/workflows/publish.yml', 'utf8');
    const wrangler = readFileSync('wrangler.toml', 'utf8');
    const inWorkflow = (wfText.match(/--project-name=([a-z0-9-]+)/) ?? [])[1];
    const inWrangler = (wrangler.match(/name = "([a-z0-9-]+)"/) ?? [])[1];
    ok('the workflow and wrangler.toml agree on the Cloudflare Pages project, and the workflow gates the deploy',
      !!inWorkflow && inWorkflow === inWrangler && /needs:\s*gate\b/.test(wfText) && wfText.includes('node tests/site.test.mjs') && wfText.includes('preflight'),
      JSON.stringify({ workflow: inWorkflow, wrangler: inWrangler }));
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

// --- Unity 6 (v22) header reader: the measured relations, checked against real game files
{
  const v22 = await import('../pipeline/serialized-v22.mjs');
  const samples = [
    'C:/uTorria/Downloads/TCG Card Shop Simulator/Card Shop Simulator_Data/level1',
    'C:/Users/CHEN/Desktop/repo/data/raw/R.E.P.O.v0.4.0/REPO/REPO_Data/level0',
  ];
  let seen = 0;
  for (const path of samples) {
    try {
      const buf = readFileSync(path);
      const h = v22.readHeaderV22(buf);
      if (h && v22.headerIsValid(h, buf.length) && h.version === 22) seen++;
    } catch { /* file not on this machine */ }
  }
  ok('the measured v22 header validates against real game files', seen >= 1, seen + ' of ' + samples.length);
  const synthetic = Buffer.alloc(64);
  synthetic.writeUInt32BE(22, 8);
  synthetic.writeBigUInt64BE(1000n, 16);
  synthetic.writeBigUInt64BE(2000n, 24);
  synthetic.writeBigUInt64BE(1060n, 32);
  ok('a fileSize that does not equal the file length is refused', v22.headerOf(synthetic, 2000) !== null && v22.headerOf(synthetic, 1999) === null);
  const badGap = Buffer.from(synthetic);
  badGap.writeBigUInt64BE(1900n, 32);
  ok('a dataOffset gap outside the measured range is refused', v22.headerOf(badGap, 2000) === null);
  ok('a short buffer is refused rather than read past', v22.readHeaderV22(Buffer.alloc(8)) === null);
}

// --- the publish configuration is part of the deliverable, so it is gated with the site
{
  const wf = readFileSync('.github/workflows/publish.yml', 'utf8');
  const wr = readFileSync('wrangler.toml', 'utf8');
  ok('the publish workflow builds the site and runs the gates', wf.includes('node pipeline/site.mjs') && wf.includes('node tests/site.test.mjs'));
  ok('the deploy job cannot run unless the gate job succeeded', /needs:\s*gate\b/.test(wf));
  ok('the deploy uses a secret and no token is committed',
    wf.includes('secrets.CLOUDFLARE_API_TOKEN') && !/apiToken:\s*[A-Za-z0-9_-]{20,}/.test(wf));
  ok('the Pages project and its output directory are declared', /name = "[a-z0-9-]+"/.test(wr) && wr.includes('pages_build_output_dir = "web/dist"'));
  ok('a portable typecheck config exists for a clean runner', readFileSync('tsconfig.ci.json', 'utf8').includes('typeRoots'));
  ok('the workflow runs the preflight before deploying', wf.includes('node tools/preflight.mjs'));
  ok('the workflow is free of tabs and uses 2-space indentation levels',
    !/\t/.test(wf) && wf.split('\n').every((l) => l.trim() === '' || (l.match(/^ */)[0].length % 2) === 0));
}


// --- every recorded image origin is re-checkable: the file on disk must match
// the manifest's bytes, sha256 and dimensions. A mapping that cannot be
// re-checked is not evidence, so this is gated rather than reported.
{
  const manifest = JSON.parse(readFileSync('content/images-manifest.json', 'utf8'));
  const pngOrJpegDims = (b) => {
    if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) {
      return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
    }
    if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
        const len = b.readUInt16BE(i + 2);
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
          return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
        }
        i += 2 + len;
      }
    }
    return null;
  };
  const records = manifest.records ?? [];
  const bad = [];
  let checked = 0;
  for (const r of records) {
    const f = join('content', 'assets', r.file);
    if (!existsSync(f)) { bad.push(r.file + ' (missing)'); continue; }
    const buf = readFileSync(f);
    const sha = createHash('sha256').update(buf).digest('hex');
    const dim = pngOrJpegDims(buf);
    if (buf.length !== r.bytes) bad.push(r.file + ' (bytes)');
    else if (sha !== r.sha256) bad.push(r.file + ' (sha256)');
    else if (dim && (dim.width !== r.width || dim.height !== r.height)) bad.push(r.file + ' (dimensions)');
    else checked++;
  }
  ok('every image manifest record matches the file on disk (bytes, sha256, dimensions)',
    bad.length === 0, bad.slice(0, 3).join(', '));
  ok('the image manifest is not empty', checked > 0);
}

// --- every identifier an entry cites as evidence must be a real identifier in this build
{
  let passed = true, out = '';
  try {
    out = execFileSync(process.execPath, ['tools/verify-citations.mjs'], { encoding: 'utf8' });
  } catch (e) {
    passed = false;
    out = String((e.stdout ?? '') + (e.stderr ?? ''));
  }
  ok('every identifier cited as evidence exists in this build', passed,
    out.trim().split('\n').filter((l) => l.includes('CHECK')).slice(0, 3).join(' | '));
}

// --- every picture the site shows from the game must have been opened and judged.
// The ledger preamble calls the review a separate human step, but a gate only required a verdict for
// pictures the sanity pass happened to flag, so most mappings were never looked at. This closes that:
// a manifest record without a verdict now fails the suite.
{
  const manifest = JSON.parse(readFileSync('content/images-manifest.json', 'utf8'));
  const ledger = readFileSync('reports/image-reviews.md', 'utf8');
  const judged = new Set([...ledger.matchAll(/\|\s*(mapped\/[^\s|]+)\s*\|/g)].map((m) => m[1].trim()));
  const unjudged = manifest.records.filter((r) => !judged.has(r.file)).map((r) => r.file);
  ok('every mapped picture has a verdict in the review ledger', unjudged.length === 0,
    unjudged.slice(0, 3).join(', '));
}

console.log('[site-tests] ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);