#!/usr/bin/env node
/**
 * Checks that every identifier an entry cites as evidence is a real identifier in this build.
 *
 * The content gate asserts that each fact carries an evidence pointer; it cannot tell whether the
 * pointer names something that exists. This does that half: it collects every \`identifier:\` and
 * \`identifiers:\` value from content/published, and looks each one up in the identifier universe of
 * the build.
 *
 * The universe is the union of
 *   - data/normalized/repo-object-names.json (every named object in the readable bundles)
 *   - the class, field, enum and enum-member names in data/normalized/p0-inventory.json
 * It is built on the Windows host, which is the only place the game package exists, and committed, so
 * this check runs anywhere.
 *
 * Identifiers may contain a dot (Unity material names such as babyhead_Material.007_BaseColor), so only
 * a comma or a semicolon separates them.
 *
 * Exits non-zero when a cited identifier is not in the universe. A miss is not automatically an error:
 * a class with no written instances is not in the inventory and an assembly outside Assembly-CSharp
 * holds its own names, so a miss has to be looked up in the build before the entry is changed.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const indexPath = join(root, 'data', 'normalized', 'repo-object-names.json');
const invPath = join(root, 'data', 'normalized', 'p0-inventory.json');
const known = new Set(existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')) : []);
if (existsSync(invPath)) {
  const inv = JSON.parse(readFileSync(invPath, 'utf8'));
  for (const c of inv.classes ?? []) {
    known.add(c.name);
    for (const f of c.fields ?? []) known.add(f.name);
  }
  for (const e of inv.enums ?? []) {
    known.add(e.name);
    for (const m of e.members ?? []) known.add(m.name);
  }
}

/**
 * Identifiers confirmed to exist in this build but outside the universe above. Each was found by
 * searching the shipped assemblies for the name; they are absent from the inventory because it lists
 * only classes with written instances, and from the object index because they are type names rather
 * than asset names. Recording them here keeps the check able to pass without weakening it: an
 * identifier that is in neither the universe nor this list still fails.
 */
const CONFIRMED_ELSEWHERE = new Map([
  ['TrapTV', 'Assembly-CSharp.dll'],
  ['CeilingEyeLine', 'Assembly-CSharp.dll'],
  ['ParticleScriptExplosion', 'Assembly-CSharp.dll'],
  ['LineBetweenTwoPoints', 'Assembly-CSharp.dll'],
  ['TricycleHandlebars', 'Assembly-CSharp.dll'],
  ['Photon.Voice.Unity', 'Assembly-CSharp.dll, Photon3Unity3D.dll, PhotonChat.dll']
]);

const dir = join(root, 'content', 'published');
const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
const cited = new Set();
const misses = new Map();
let facts = 0;
for (const f of files) {
  const entry = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  for (const fact of entry.facts ?? []) {
    facts += 1;
    for (const m of String(fact.evidence ?? '').matchAll(/identifier[s]?:(.+)/gi)) {
      for (const part of m[1].split(';')) {
        for (const piece of part.split(',')) {
          const id = piece.trim().replace(/\.+$/, '').trim();
          if (!id) continue;
          cited.add(id);
          if (!known.has(id) && !CONFIRMED_ELSEWHERE.has(id)) {
            if (!misses.has(id)) misses.set(id, []);
            misses.get(id).push(entry.id);
          }
        }
      }
    }
  }
}

console.log('[citations] entries=' + files.length + ' facts=' + facts +
  ' distinctIdentifiers=' + cited.size + ' universe=' + known.size +
  ' confirmedElsewhere=' + CONFIRMED_ELSEWHERE.size + ' unmatched=' + misses.size);
for (const [id, entries] of misses) console.log('  CHECK  ' + id + '  <- ' + [...new Set(entries)].join(', '));
process.exit(misses.size ? 1 : 0);
