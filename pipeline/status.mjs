#!/usr/bin/env node
/**
 * Emit reports/status.json from measurements rather than prose, so the handoff status is machine-readable and can
 * be checked by a gate. Every number here comes from a fresh build into a temp directory plus git; none is typed in.
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { build, SITE } from './site.mjs';

const invPath = process.env.SITE_INVENTORY || 'data/normalized/p0-inventory.json';
const dir = mkdtempSync(join(tmpdir(), 'status-'));
try {
  const stats = build(invPath, dir);
  const inv = JSON.parse(readFileSync(invPath, 'utf8'));
  const out = {
    site: SITE.domain,
    head: execSync('git rev-parse --short HEAD').toString().trim(),
    commits: Number(execSync('git rev-list --count HEAD').toString().trim()),
    pages: stats.pages,
    indexable: stats.urls,
    noindex: stats.pages - stats.urls,
    classes: (inv.classes ?? []).length,
    fields: inv.totals?.fields ?? 0,
    version: inv.version ?? 'unknown',
    generatedBy: 'pipeline/status.mjs',
  };
  writeFileSync('reports/status.json', JSON.stringify(out, null, 2) + '\n');
  console.log('[status] ' + JSON.stringify(out));
} finally {
  rmSync(dir, { recursive: true, force: true });
}
