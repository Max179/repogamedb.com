// End-to-end decode. Unity splits the engine into module assemblies; UnityEngine.dll here is a type-forwarding
// facade (21 types), so the real hierarchy comes from UnityEngine.CoreModule.dll. Parsing it lets references to
// Transform/GameObject/Camera be recognised as the 12-byte object references that were measured earlier.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { parseAssembly } from './dotnet-metadata.ts';
import type { DotNetAssembly } from './dotnet-metadata.ts';
import { decodeValues, readMonoBehaviourHeader } from './mono-values.ts';

// Derived from the working directory so one run reports one project's refusal profile. The previous list processed
// BOTH games, so each repository printed the other's numbers and the step could not be reproduced on a Mac.
const CWD = process.cwd().replace(/\\/g, '/');
const PROJECT = CWD.split('/').pop() ?? '';
const DLL_BY_PROJECT: Record<string, string> = {
  repo: 'data/raw/R.E.P.O.v0.4.0/REPO/REPO_Data/Managed/Assembly-CSharp.dll',
  // The TCG assembly lives in the installed game, outside the repository; that path stays absolute on purpose.
  'tcg-shop': 'C:/uTorria/Downloads/TCG Card Shop Simulator/Card Shop Simulator_Data/Managed/Assembly-CSharp.dll',
};
const DLL = DLL_BY_PROJECT[PROJECT];
if (!DLL) {
  console.error('decode_values2: run from a project directory (repo | tcg-shop), not ' + CWD);
  process.exit(1);
}
const jobs = [[
  PROJECT === 'repo' ? 'repo' : 'tcg',
  CWD + '/data/normalized/' + (PROJECT === 'repo' ? 'repo' : 'tcg') + '-mb-payloads.json',
  DLL.startsWith('C:') ? DLL : CWD + '/' + DLL,
]];
// Every managed assembly in the game's Managed folder is merged, not just the engine modules: the refusal
// breakdown measured 377 (repo) and 2909 (tcg) payloads refused because their class was not found, while 143 and
// 178 assemblies were never loaded. BCL/system assemblies are skipped and Assembly-CSharp keeps priority on clashes.
const SKIP_ASSEMBLY = /^(mscorlib|netstandard|System|Mono\.|Microsoft\.|Windows|Accessibility|UnityEditor)/i;
for (const [label, payloadPath, dll] of jobs) {
  let doc; try { doc = JSON.parse(readFileSync(payloadPath, 'utf8')); } catch { console.log(label + ': no dump'); continue; }
  const local = parseAssembly(dll);
  const byName = new Map(local.byName);
  const loaded: string[] = [];
  const managedDir = dirname(dll);
  const others = readdirSync(managedDir)
    .filter((f) => f.toLowerCase().endsWith('.dll') && !SKIP_ASSEMBLY.test(f) && f !== basename(dll))
    .sort();
  for (const file of others) {
    try {
      const ext = parseAssembly(join(managedDir, file));
      for (const [k, v] of ext.byName) if (!byName.has(k)) byName.set(k, v);
      loaded.push(file + '(' + ext.typeCount + ')');
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
