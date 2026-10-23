#!/usr/bin/env node
/**
 * Duplicate hero-image gate.
 *
 * Every published entry has one hero picture. Two entries may legitimately point at the same subject, but a
 * repeated hero makes the category cards look duplicated, so each hero file may belong to exactly one entry.
 * This gate is file-level only; it does not claim two different pictures of the same subject are distinct.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'content', 'published');
const byFile = new Map();
for (const f of readdirSync(dir).filter((name) => name.endsWith('.json')).sort()) {
  const entry = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const hero = (entry.images ?? [])[0];
  if (!hero?.file) continue;
  const list = byFile.get(hero.file) ?? [];
  list.push(entry.id);
  byFile.set(hero.file, list);
}

const duplicates = [...byFile.entries()].filter(([, entries]) => entries.length > 1);
if (duplicates.length) {
  console.error('[duplicate-images] ' + duplicates.length + ' duplicate hero file group(s)');
  for (const [file, entries] of duplicates) console.error('  ' + file + ' -> ' + entries.join(', '));
  process.exit(1);
}
console.log('[duplicate-images] ' + byFile.size + ' hero files, 0 duplicate groups');
