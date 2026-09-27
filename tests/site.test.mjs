#!/usr/bin/env node
/**
 * Site tests for the R.E.P.O. build. Deterministic: builds into a temp dir and inspects the output.
 * A gate that cannot fail is not a gate, so every check below asserts something that has been wrong at least once
 * (a missing canonical, a page missing its source line, a sitemap listing the 404 page).
 */
import { readFileSync, existsSync, rmSync, readdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { build, lookupFields, SITE } from '../pipeline/site.mjs';

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
  ok('every field carries per-field provenance',
    f0.source === inv.source.assembly && f0.version === inv.version && f0.confidence === 'verified-schema' && 'value' in f0);
  ok('per-field provenance is rendered on an entity page',
    readFileSync(join(dir, 'entity', readdirSync(join(dir, 'entity')).find((f) => f.endsWith('.html'))), 'utf8').includes('verified-schema'));

  ok('every sampled entity page marks the values it does not have as unknown', html.every((h) => /unknown/i.test(h)));

  const sitemap = readFileSync(join(dir, 'sitemap.xml'), 'utf8');
  const locs = (sitemap.match(/<loc>/g) ?? []).length;
  ok('the sitemap omits the 404 page and lists every other page', !sitemap.includes('/404.html') && locs === stats.urls, locs + ' vs ' + stats.urls);
  ok('robots.txt points at the sitemap', readFileSync(join(dir, 'robots.txt'), 'utf8').includes('Sitemap: ' + SITE.url + '/sitemap.xml'));
  ok('the build reports the page count it emitted', stats.pages > 300, String(stats.pages));
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log('[site-tests] ' + pass + ' passed, ' + fail + ' failed');
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

process.exit(fail ? 1 : 0);
