#!/usr/bin/env node
/**
 * Content gate: refuses to let the site publish something that is not a player-facing entry.
 * Reads content/published + content/reference and checks every rule written in content/README.md.
 * Exits non-zero and prints each violation, so a bad entry cannot reach the build.
 */
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const BANNED = ['il2cpp', 'serializedfile', 'pptr', 'schema', 'metadata', 'payload', 'monobehaviour',
  'scriptableobject', 'sha256', 'parser', 'namespace'];
const BANNED_WORDS = ['class', 'classes', 'field', 'fields'];
const IMAGE_FORMATS = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.avif'];
const MIN_IMAGE_BYTES = 1024;

const prose = (e) => [e.title, e.summary, ...(e.body ?? [])].join(' ').toLowerCase();

/** @returns {string[]} violations */
export function checkEntry(entry, dir, ids) {
  const bad = [];
  const p = prose(entry);
  for (const term of BANNED) if (p.includes(term)) bad.push('internal term "' + term + '" in prose');
  for (const w of BANNED_WORDS) if (new RegExp('\\b' + w + '\\b').test(p)) bad.push('internal word "' + w + '" in prose');
  if (!entry.title || entry.title.length < 8) bad.push('title missing or too short');
  if (entry.title && /^[a-z0-9_]+$/.test(entry.title)) bad.push('title is a bare identifier');
  if (!entry.summary || entry.summary.length < 80) bad.push('summary missing or under 80 characters');
  if (entry.summary && entry.title && entry.summary.toLowerCase().replace(/[^a-z ]/g, '').trim() === entry.title.toLowerCase()) bad.push('summary is just the title');
  if ((entry.body ?? []).length < 2) bad.push('needs at least two body paragraphs');
  if (!(entry.facts ?? []).length) bad.push('no fact with evidence');
  for (const f of entry.facts ?? []) if (!f.claim || !f.evidence) bad.push('fact without claim or evidence: ' + JSON.stringify(f));
  if (!(entry.images ?? []).length) bad.push('published entry without an image');
  for (const img of entry.images ?? []) {
    if (!img.file) { bad.push('image without file'); continue; }
    const onDisk = join(dir, img.file);
    if (!existsSync(onDisk)) { bad.push('image not on disk: ' + img.file); continue; }
    const size = statSync(onDisk).size;
    if (size < MIN_IMAGE_BYTES) bad.push('image smaller than 1 KB: ' + img.file);
    if (!IMAGE_FORMATS.includes(img.file.slice(img.file.lastIndexOf('.')).toLowerCase())) bad.push('unsupported image format: ' + img.file);
    if (img.kind !== 'game' && img.kind !== 'diagram') bad.push('image must declare kind "game" or "diagram": ' + img.file);
    if (img.kind === 'diagram' && !(img.disclaimer ?? '').length) bad.push('diagram must carry a disclaimer saying it is not a screenshot: ' + img.file);
    if (!img.alt || !img.alt.en || !img.alt.zh) bad.push('image needs English and Chinese alt text: ' + img.file);
  }
  for (const rel of entry.related ?? []) if (!ids.has(rel)) bad.push('related entry does not exist: ' + rel);
  if (!entry.sources || !entry.sources.length) bad.push('no version/source note');
  return bad;
}

if (process.argv[1] && process.argv[1].endsWith('content-gate.mjs')) {
  const root = process.cwd();
  const pubDir = join(root, 'content', 'published');
  const refDir = join(root, 'content', 'reference');
  const assetsDir = join(root, 'content', 'assets');
  const entries = [];
  for (const dir of [pubDir, refDir]) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
      entries.push({ file: join(dir, f), data: JSON.parse(readFileSync(join(dir, f), 'utf8')) });
    }
  }
  const ids = new Set(entries.map((e) => e.data.id));
  let violations = 0;
  const titles = new Map();
  for (const e of entries) {
    const isPublished = e.file.includes('published');
    if (!isPublished) continue;
    const bad = checkEntry(e.data, assetsDir, ids);
    if (e.data.title) titles.set(e.data.title, (titles.get(e.data.title) ?? 0) + 1);
    if (bad.length) { violations += bad.length; console.log('  FAIL ' + e.data.id + ': ' + bad.join('; ')); }
    else console.log('  OK   ' + e.data.id + ' (' + e.data.images.length + ' image(s), ' + e.data.facts.length + ' fact(s))');
  }
  for (const [t, n] of titles) if (n > 1) { violations++; console.log('  FAIL duplicate title: ' + t); }
  console.log('[content-gate] ' + (entries.length) + ' entry file(s), ' + violations + ' violation(s)');
  process.exit(violations ? 1 : 0);
}