#!/usr/bin/env node
/**
 * Site tests for the R.E.P.O. build. Deterministic: builds into a temp dir and inspects the output.
 * A gate that cannot fail is not a gate, so every check below asserts something that has been wrong at least once
 * (a missing canonical, a page missing its source line, a sitemap listing the 404 page).
 */
import { readFileSync, existsSync, rmSync, readdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { build, lookupFields, SITE, NAV } from '../pipeline/site.mjs';

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
  ok('every sampled entity page names its source and game version', html.every((h) => h.includes('Assembly-CSharp.dll') && h.includes(inv.version)));
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
  ok('the machine-readable status matches this build',
    status.pages === stats.pages && status.indexable === stats.urls && status.noindex === stats.pages - stats.urls,
    JSON.stringify({ buildPages: stats.pages, statusPages: status.pages, buildUrls: stats.urls, statusUrls: status.indexable }));

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

console.log('[site-tests] ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
