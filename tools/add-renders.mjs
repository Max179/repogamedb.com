#!/usr/bin/env node
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';

const manifest = JSON.parse(readFileSync('content/images-manifest.json', 'utf8'));
const renders = [
  { entity: 'ENEMY.BOMB_THROWER', file: 'content/renders/ENEMY.BOMB_THROWER.png', kind: 'game' },
  { entity: 'ENEMY.HEAD', file: 'content/renders/ENEMY.HEAD.png', kind: 'game' },
  { entity: 'ENEMY.OOGLY', file: 'content/renders/ENEMY.OOGLY.png', kind: 'game' },
];

for (const r of renders) {
  const buf = readFileSync(r.file);
  const hash = createHash('sha256').update(buf).digest('hex');
  const stat = statSync(r.file);
  manifest.records.push({
    entity: r.entity,
    kind: r.kind,
    file: r.file.replace('content/', ''),
    sourceBundle: 'Blender 3.2.2 render from Unity prefab',
    assetName: r.entity,
    note: '3D model exported from game and rendered at 1024x1024',
    width: 1024,
    height: 1024,
    bytes: stat.size,
    sha256: hash,
  });
}

writeFileSync('content/images-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log('Added 3 renders to manifest');
