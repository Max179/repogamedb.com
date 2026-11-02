#!/usr/bin/env node
/** Write config/urls.json: one classification per emitted page, so an old URL can never be forgotten.
 *  keep    - player-facing page, indexable and in the sitemap
 *  noindex - reachable for readers or modders, deliberately kept out of search engines
 *  redirect- listed in "redirects" with the target it must point at
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { SITE } from '../pipeline/site.mjs';

const dist = 'web/dist';
if (!existsSync(dist)) { console.error('run the site build first'); process.exit(1); }
const walk = (d, out = []) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
};
const emitted = walk(dist).map((p) => '/' + relative(dist, p).split('\\').join('/')).sort();
const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
// The sitemap publishes clean URLs (/about) while the build emits files (/about.html): map each located clean URL back
// to the emitted file it is served from, or every page would be classified noindex.
const fileForClean = (p) => (p === '/' ? '/index.html' : p.endsWith('/') ? p + 'index.html' : p + '.html');
const located = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => fileForClean(new URL(m[1]).pathname));
const missingTargets = located.filter((p) => !emitted.includes(p));
if (missingTargets.length) {
  console.error('[classify] sitemap URL(s) have no emitted file: ' + missingTargets.slice(0, 5).join(', '));
  process.exit(1);
}
const indexable = new Set(located);
const previous = existsSync('config/urls.json') ? JSON.parse(readFileSync('config/urls.json', 'utf8')) : { redirects: [] };
const entries = emitted.filter((p) => p !== '/404.html').map((p) => ({
  url: p,
  action: indexable.has(p) ? 'keep' : 'noindex',
  reason: indexable.has(p) ? 'player-facing page: a question a player asks' : 'technical reference or duplicate kept reachable but not indexed',
}));
// A partial or stale web/dist would silently shrink this file, and the site tests compare it against a
// full build, so a short run here surfaces later as "unclassified" pages. Refuse to overwrite a
// classification with a much smaller one unless the operator asks for it.
const previousCount = (previous.entries ?? []).length;
if (previousCount && entries.length < previousCount / 2 && !process.argv.includes('--force')) {
  console.error('[classify] refusing to write ' + entries.length + ' entries over the existing ' + previousCount +
    ': web/dist looks partial or stale (rebuild the site first, or pass --force)');
  process.exit(2);
}
mkdirSync('config', { recursive: true });
writeFileSync('config/urls.json', JSON.stringify({
  site: SITE.domain,
  note: 'One line per emitted page. "redirects" stays empty until this site has ever been published under an older URL; a redirect entry must point at a page that exists.',
  generatedBy: 'tools/classify-urls.mjs',
  redirects: previous.redirects ?? [],
  entries,
}, null, 2) + '\n');
console.log('[classify] ' + entries.filter((e) => e.action === 'keep').length + ' keep, ' + entries.filter((e) => e.action === 'noindex').length + ' noindex, ' + (previous.redirects ?? []).length + ' redirect(s)');
