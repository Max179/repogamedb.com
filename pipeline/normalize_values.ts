// Merge decoded instance values into the normalized inventory: a field becomes confidence=extracted only when every
// decoded instance of that class agrees on the value; otherwise it stays null/verified-schema.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { DotNetAssembly } from './dotnet-metadata.ts';
import { parseAssembly, monoBehaviourClass } from './dotnet-metadata.ts';
import { readMonoBehaviourHeader, decodeValues } from './mono-values.ts';

const JOBS = [
  ['C:/Users/CHEN/Desktop/repo/data/normalized/repo-mb-payloads.json',
   'C:/Users/CHEN/Desktop/repo/data/raw/R.E.P.O.v0.4.0/REPO/REPO_Data/Managed/Assembly-CSharp.dll',
   'C:/Users/CHEN/Desktop/repo/data/normalized/p0-inventory.json',
   'level0 + globalgamemanagers.assets'],
  ['C:/Users/CHEN/Desktop/tcg-shop/data/normalized/tcg-mb-payloads.json',
   'C:/uTorria/Downloads/TCG Card Shop Simulator/Card Shop Simulator_Data/Managed/Assembly-CSharp.dll',
   'C:/Users/CHEN/Desktop/tcg-shop/data/normalized/p0-inventory.json',
   'level1 + globalgamemanagers.assets'],
];

for (const [payloadPath, dll, invPath, source] of JOBS) {
  let doc, inv;
  try { doc = JSON.parse(readFileSync(payloadPath, 'utf8')); inv = JSON.parse(readFileSync(invPath, 'utf8')); }
  catch { console.log(payloadPath.split('/').slice(-3)[0] + ': missing input'); continue; }
  // The engine merge must be identical to the one the decoder runner uses, or the two report different counts.
  let asm: DotNetAssembly = parseAssembly(dll);
  {
    const byName = new Map(asm.byName);
    for (const mod of ['UnityEngine.CoreModule.dll', 'UnityEngine.dll', 'UnityEngine.PhysicsModule.dll', 'UnityEngine.AnimationModule.dll']) {
      const p = join(dirname(dll), mod);
      if (!existsSync(p)) continue;
      try { const ext = parseAssembly(p); for (const [k, v] of ext.byName) if (!byName.has(k)) byName.set(k, v); } catch { /* skip */ }
    }
    asm = { ...asm, byName };
  }
  const agg = new Map<string, Map<string, string>>();   // class -> field -> value (string form)
  const conflicts = new Set<string>();
  let decoded = 0;
  for (const o of doc.objects) {
    if (!monoBehaviourClass(asm, o.class)) continue;
    const buf = Buffer.from(o.payload, 'base64');
    const h = readMonoBehaviourHeader(buf);
    if (!h) continue;
    const values = decodeValues(asm, o.class, buf.subarray(h.bytes));
    if (!values) continue;
    decoded++;
    let fields = agg.get(o.class);
    if (!fields) { fields = new Map(); agg.set(o.class, fields); }
    for (const v of values) {
      const s = String(v.value);
      const prev = fields.get(v.name);
      if (prev === undefined) fields.set(v.name, s);
      else if (prev !== s) conflicts.add(o.class + '.' + v.name);
    }
  }
  let upgraded = 0;
  for (const c of inv.classes ?? []) {
    const fields = agg.get(c.name);
    for (const f of c.fields ?? []) {
      if (!fields) break;
      const v = fields.get(f.name);
      if (v === undefined || conflicts.has(c.name + '.' + f.name)) continue;
      f.value = /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v;
      f.confidence = 'extracted';
      f.fieldSource = source;
      upgraded++;
    }
  }
  // Classes the decoder proved but that the P0 name filter never selected are added rather than dropped: they are
  // verified data (a class that exists in the assembly and whose layout consumed its payload exactly).
  const known = new Set((inv.classes ?? []).map((c) => c.name));
  for (const [className, fields] of agg) {
    if (known.has(className)) continue;
    const type = monoBehaviourClass(asm, className);
    const entry = {
      name: className, namespace: type?.namespace ?? '', base: type?.baseType ?? null,
      declared: type?.fields.length ?? fields.size, written: fields.size,
      fields: [...fields].map(([name, value]) => ({
        name, type: 'unknown', kind: 'extracted-instance', source: inv.source.assembly, version: inv.version,
        checkedAt: inv.source.extractedAt, confidence: 'extracted', fieldSource: source,
        value: /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value,
      })),
    };
    (inv.classes ??= []).push(entry as never);
    upgraded += entry.fields.length;
  }
  const instances: { class: string; pathId: string; source: string; values: unknown }[] = [];
  for (const o of doc.objects) {
    const buf = Buffer.from(o.payload, 'base64');
    const h = readMonoBehaviourHeader(buf);
    if (!h) continue;
    const values = decodeValues(asm, o.class, buf.subarray(h.bytes));
    if (!values) continue;
    instances.push({ class: o.class, pathId: String(o.pathId), source, values });
  }
  writeFileSync(invPath.replace('p0-inventory.json', 'p0-instances.json'), JSON.stringify({
    game: inv.game, engine: inv.engine, version: inv.version,
    source: { ...inv.source, note: 'per-instance decoded values; each instance is one object whose layout consumed its payload exactly' },
    count: instances.length, instances,
  }, null, 2), 'utf8');
  console.log('  instances written: %d', instances.length);
  inv.provenance = { ...(inv.provenance ?? {}), extractedValues: 'confidence=extracted means every decoded instance of the class agreed on the value; the field layout was accepted only when it consumed the object payload exactly.' };
  writeFileSync(invPath, JSON.stringify(inv, null, 2), 'utf8');
  console.log('%s: objects decoded=%d classesWithValues=%d fieldsUpgraded=%d conflictsIgnored=%d',
    invPath.split('/').slice(-3)[0], decoded, agg.size, upgraded, conflicts.size);
}
