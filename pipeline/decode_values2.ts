// End-to-end decode. Unity splits the engine into module assemblies; UnityEngine.dll here is a type-forwarding
// facade (21 types), so the real hierarchy comes from UnityEngine.CoreModule.dll. Parsing it lets references to
// Transform/GameObject/Camera be recognised as the 12-byte object references that were measured earlier.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseAssembly } from './dotnet-metadata.ts';
import type { DotNetAssembly } from './dotnet-metadata.ts';
import { decodeValues, readMonoBehaviourHeader } from './mono-values.ts';

const jobs = [
  ['repo', 'C:/Users/CHEN/Desktop/repo/data/normalized/repo-mb-payloads.json',
   'C:/Users/CHEN/Desktop/repo/data/raw/R.E.P.O.v0.4.0/REPO/REPO_Data/Managed/Assembly-CSharp.dll'],
  ['tcg', 'C:/Users/CHEN/Desktop/tcg-shop/data/normalized/tcg-mb-payloads.json',
   'C:/uTorria/Downloads/TCG Card Shop Simulator/Card Shop Simulator_Data/Managed/Assembly-CSharp.dll'],
];
const ENGINE_MODULES = ['UnityEngine.CoreModule.dll', 'UnityEngine.dll', 'UnityEngine.PhysicsModule.dll', 'UnityEngine.AnimationModule.dll'];
for (const [label, payloadPath, dll] of jobs) {
  let doc; try { doc = JSON.parse(readFileSync(payloadPath, 'utf8')); } catch { console.log(label + ': no dump'); continue; }
  const local = parseAssembly(dll);
  const byName = new Map(local.byName);
  const loaded: string[] = [];
  for (const mod of ENGINE_MODULES) {
    const p = join(dirname(dll), mod);
    if (!existsSync(p)) continue;
    try {
      const ext = parseAssembly(p);
      for (const [k, v] of ext.byName) if (!byName.has(k)) byName.set(k, v);
      loaded.push(mod + '(' + ext.typeCount + ')');
    } catch { /* skip */ }
  }
  const merged: DotNetAssembly = { ...local, byName };
  console.log(label + ': local=' + local.typeCount + ' merged=' + byName.size + ' engine modules: ' + (loaded.join(', ') || 'none'));
  let decoded = 0, refLayout = 0;
  const kinds = new Map<string, number>();
  for (const o of doc.objects) {
    const buf = Buffer.from(o.payload, 'base64');
    const h = readMonoBehaviourHeader(buf);
    if (!h) continue;
    const r = decodeValues(merged, o.class, buf.subarray(h.bytes));
    if (!r) { refLayout++; continue; }
    decoded++;
    for (const v of r) kinds.set(v.kind.split(':')[0]!, (kinds.get(v.kind.split(':')[0]!) ?? 0) + 1);
  }
  console.log('=== ' + label + ' objects=' + doc.objects.length + ' decoded=' + decoded + ' refused(layout)=' + refLayout);
  console.log('    kinds: ' + JSON.stringify([...kinds].sort((a, b) => b[1] - a[1]).slice(0, 7)));
}
