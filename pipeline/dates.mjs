/**
 * Truthful content dates for the sitemap.
 *
 * A page's <lastmod> must be the date its content last changed, not the day the site was rebuilt. The only
 * truthful record of that change is the repository history of the source files, so this module derives one date
 * per page from the newest commit that touched the content file(s) the page is built from.
 *
 * The build never calls git: tools/content-dates.mjs writes the derivation to content/dates.json, the build reads
 * that file, and tests/site.test.mjs re-derives it to prove the committed file is current. A page whose date
 * cannot be derived gets no <lastmod> at all rather than a fabricated one.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { SITE, CATEGORIES, groupOf } from './site.mjs';

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** The dated source files every page is derived from. data/guide-questions.json feeds the home page cards. */
export const DATE_SOURCES = ['content/published', 'content/articles', 'content/updates.json', 'data/guide-questions.json'];

/** True when git can see full history (a shallow clone cannot answer "when did this file last change"). */
export function historyAvailable() {
  try {
    return execFileSync('git', ['rev-parse', '--is-shallow-repository'], { encoding: 'utf8' }).trim() === 'false';
  } catch {
    return false;
  }
}

/** Newest commit date per repo-relative path, from a single `git log` call. */
export function gitLastDates(paths = DATE_SOURCES) {
  const out = execFileSync('git', ['log', '--format=%cs', '--name-only', '--', ...paths], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  const dates = new Map();
  let current = null;
  for (const raw of out.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (DATE_RE.test(line)) { current = line; continue; }
    if (current && !dates.has(line)) dates.set(line, current);
  }
  return dates;
}

/** The content the player layer is built from. */
export function readContent() {
  const readJson = (p, fallback) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fallback; } };
  const entries = readdirSync('content/published').filter((f) => f.endsWith('.json'))
    .map((f) => readJson(join('content', 'published', f), null)).filter(Boolean);
  const articles = readdirSync('content/articles').filter((f) => f.endsWith('.json'))
    .map((f) => readJson(join('content', 'articles', f), null)).filter(Boolean);
  const updates = readJson('content/updates.json', []);
  return { entries, articles, updates: Array.isArray(updates) ? updates : [] };
}

/**
 * Derive the sitemap date map. Returns null when the full history is unavailable, so callers can say so instead
 * of inventing dates. `pages` is keyed by clean public path.
 */
export function deriveDates() {
  if (!historyAvailable()) return null;
  const commits = gitLastDates();
  const { entries, articles, updates } = readContent();
  const latest = (list) => list.filter(Boolean).sort().pop() ?? null;
  const fileDate = (p) => commits.get(p) ?? null;
  const entryDate = (e) => fileDate('content/published/' + e.id + '.json');
  const articleDate = (a) => fileDate('content/articles/' + a.id + '.json');
  const updateDates = updates.map((u) => String(u.date ?? '')).filter((d) => DATE_RE.test(d));
  const updatesPage = latest([fileDate('content/updates.json'), ...updateDates]);
  const pages = {};
  const put = (url, date) => { if (date && DATE_RE.test(date)) pages[url] = date; };
  for (const e of entries) put('/entries/' + e.id, entryDate(e));
  for (const a of articles) put('/articles/' + a.id, articleDate(a));
  put('/updates', updatesPage);
  // The home page lists updates, featured entries, question cards and per-category counts; a change to any of its
  // inputs changes it. The two index pages and each category page are generated from the entries they list.
  put('/', latest([
    ...entries.map(entryDate),
    ...articles.map(articleDate),
    updatesPage,
    fileDate('data/guide-questions.json'),
  ]));
  put('/entities/', latest(entries.map(entryDate)));
  for (const c of CATEGORIES) {
    const members = entries.filter((e) => groupOf(e.category).key === c.key);
    if (members.length) put('/entities/' + c.key, latest(members.map(entryDate)));
  }
  put('/articles/', latest(articles.map(articleDate)));
  const sorted = {};
  for (const key of Object.keys(pages).sort()) sorted[key] = pages[key];
  return { pages: sorted, source: 'git committer date of the newest commit touching each page\'s content source' };
}
