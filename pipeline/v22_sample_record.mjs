#!/usr/bin/env node
/**
 * Record the first bytes of real Unity 6 level files into data/normalized/v22-header-samples.json.
 *
 * tests/site.test.mjs checks the v22 header reader against real game files. Those files are raw game data and stay on
 * the extraction host, so this record carries exactly what that check needs — each file's real length, its sha256 and
 * its first 512 bytes — and the test uses the file itself when the tree has it and the record when it does not. A tree
 * that has neither reports the check as unreadable rather than passing it.
 *
 * Run on the extraction host only:  node pipeline/v22_sample_record.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const CANDIDATES = [
  { source: 'C:/uTorria/Downloads/TCG Card Shop Simulator/Card Shop Simulator_Data/level1', relative: null },
  { source: 'C:/Users/CHEN/Desktop/repo/data/raw/R.E.P.O.v0.4.0/REPO/REPO_Data/level0', relative: 'data/raw/R.E.P.O.v0.4.0/REPO/REPO_Data/level0' },
];
const HEAD = 512;

const samples = [];
for (const c of CANDIDATES) {
  const path = [c.relative, c.source].find((p) => typeof p === 'string' && existsSync(p));
  if (!path) { console.error('[v22-record] not readable here: ' + c.source); continue; }
  const buf = readFileSync(path);
  samples.push({
    source: c.source,
    relative: c.relative,
    fileBytes: buf.length,
    sha256: createHash('sha256').update(buf).digest('hex'),
    headBytes: Math.min(HEAD, buf.length),
    headHex: buf.subarray(0, HEAD).toString('hex'),
  });
}
if (samples.length < CANDIDATES.length) {
  console.error('[v22-record] only ' + samples.length + ' of ' + CANDIDATES.length + ' samples are readable here; refusing to write a weaker record');
  process.exit(2);
}
const out = {
  schemaVersion: '1',
  note: 'the first bytes of real Unity 6 level files, recorded on the extraction host so the v22 header reader is checked against real game bytes on a machine that does not carry the game package',
  headerBytes: HEAD,
  samples,
};
writeFileSync('data/normalized/v22-header-samples.json', JSON.stringify(out, null, 2) + '\n');
console.log('[v22-record] ' + samples.length + ' samples: ' + samples.map((s) => s.source.split('/').pop() + ' ' + s.fileBytes + ' B sha256 ' + s.sha256.slice(0, 12)).join(' | '));
