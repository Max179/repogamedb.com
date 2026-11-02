#!/usr/bin/env node
/**
 * Write content/dates.json: the truthful last-content-change date for every page whose content comes from a dated
 * source file. Dates come from git history (the newest commit touching the file), never from the build date. Pages
 * with no dated source are omitted from the file, and the sitemap then omits their <lastmod>.
 *
 * Run manually after editing content: node tools/content-dates.mjs
 * It is not part of the build and not part of CI — the committed content/dates.json is what the build reads (the
 * test suite re-derives it and fails when it is stale).
 */
import { writeFileSync } from 'node:fs';
import { deriveDates } from '../pipeline/dates.mjs';

const derived = deriveDates();
if (!derived) {
  console.error('[content-dates] full git history is not available (shallow clone?); refusing to write dates');
  process.exit(1);
}
const out = {
  generatedBy: 'tools/content-dates.mjs',
  source: derived.source,
  note: 'Date per clean page URL. The sitemap emits <lastmod> only for a page listed here; pages with no dated content source get no <lastmod> rather than the build date.',
  pages: derived.pages,
};
writeFileSync('content/dates.json', JSON.stringify(out, null, 2) + '\n');
const count = Object.keys(derived.pages).length;
console.log('[content-dates] ' + count + ' page dates written to content/dates.json');
