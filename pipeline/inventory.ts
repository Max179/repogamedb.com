// R.E.P.O. P0 inventory from the game's own managed assembly (Mono / ECMA-335).
// Architecture and method reused from the reference pipeline; no other game's data is used.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseAssembly, unitySerializedFields, fieldTypeName, decodeFieldSignature } from './dotnet-metadata.ts';

const DLL = 'C:/Users/CHEN/Desktop/repo/data/raw/R.E.P.O.v0.4.0/REPO/REPO_Data/Managed/Assembly-CSharp.dll';
const OUT = 'C:/Users/CHEN/Desktop/repo/data/normalized/p0-inventory.json';
// The version is the one the game itself carries: its main-menu text asset holds the record
// "Version - RELEASE" followed by "v0.4.0" (measured 2026-10-01). The player-settings slot in
// globalgamemanagers reads "0.1", a stale default, so that slot is not used as the version.
const VERSION_SOURCE = {
  file: 'REPO_Data/sharedassets0.assets', sha256: 'c4b42e9553f716578a9358b92b5e39705aa3e7edaa379c0d643d98395d0cf84a',
  bytes: 67228396, offset: 66428081, label: 'Version - RELEASE / v0.4.0',
  note: "the version label the game's own menu asset carries; the player-settings slot in globalgamemanagers reads 0.1, a stale default",
};
if (!existsSync(DLL)) { console.error('assembly missing: ' + DLL); process.exit(2); }
const asm = parseAssembly(DLL);
const RE = /item|valuable|enemy|monster|equipment|upgrade|location|level|objective|goal|danger|hazard|damage|health|price|value|shop|extraction|cart|truck|orb|diamond|coin|money|cost|stat|weapon|grenade|mine|turret|drone|vase|potion|museum|truck|haul/i;
const classes = asm.types.filter((t) => RE.test(t.name)).map((t) => {
  const written = unitySerializedFields(asm, t);
  return { name: t.name, namespace: t.namespace, base: t.baseType, declared: t.fields.length, written: written.length,
    fields: written.map((f) => ({ name: f.name, type: fieldTypeName(asm, f.signature), kind: decodeFieldSignature(f.signature).kind })) };
}).filter((c) => c.written > 0).sort((a, b) => b.written - a.written);
const enums: { name: string; members: { name: string; value: number }[] }[] = [];
for (const t of asm.types) {
  if (t.baseType !== 'Enum') continue;
  const members = t.fields.filter((f) => f.name !== 'value__' && f.constant !== undefined).map((f) => ({ name: f.name, value: f.constant as number }));
  if (members.length >= 2 && RE.test(t.name)) enums.push({ name: t.name, members });
}
mkdirSync(dirname(OUT), { recursive: true });
const payload = {
  game: 'R.E.P.O.', engine: 'unity', scriptBackend: 'mono',
  version: '0.4.0',
  source: { assembly: 'REPO_Data/Managed/Assembly-CSharp.dll', extractor: 'repo-p0-inventory@0.1.0', extractedAt: new Date().toISOString(), versionSource: VERSION_SOURCE },
  totals: { types: asm.typeCount, fields: asm.fieldCount, candidateClasses: classes.length, enums: enums.length },
  enums, classes,
};
writeFileSync(OUT, JSON.stringify(payload, null, 2), 'utf8');
console.log('types=' + asm.typeCount + ' fields=' + asm.fieldCount + ' candidateClasses=' + classes.length + ' enums=' + enums.length);
for (const c of classes.slice(0, 24)) console.log('  ' + c.name.padEnd(32) + ' written=' + String(c.written).padStart(3) + '  ' + c.fields.slice(0, 4).map((f) => f.name + ':' + f.type).join(', '));
for (const e of enums.slice(0, 8)) console.log('  enum ' + e.name + ' members=' + e.members.length + ' e.g. ' + e.members.slice(0, 5).map((m) => m.name + '=' + m.value).join(','));