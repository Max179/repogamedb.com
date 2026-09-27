// Diagnostic only: is classNotFound caused by a name-form mismatch? The dumper records the MonoScript class name
// (simple name); the assembly table is keyed by full name. Count how many refused class names exist in the merged
// table under a namespace-qualified key.
import { readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { parseAssembly, monoBehaviourClass } from './dotnet-metadata.ts';

const CWD = process.cwd().replace(/\\/g, '/');
const PROJECT = CWD.split('/').pop() ?? '';
const DLL_BY_PROJECT: Record<string, string> = {
  repo: 'data/raw/R.E.P.O.v0.4.0/REPO/REPO_Data/Managed/Assembly-CSharp.dll',
  'tcg-shop': 'C:/uTorria/Downloads/TCG Card Shop Simulator/Card Shop Simulator_Data/Managed/Assembly-CSharp.dll',
};
const raw = DLL_BY_PROJECT[PROJECT];
if (!raw) process.exit(1);
const dll = raw.startsWith('C:') ? raw : CWD + '/' + raw;
const asm = parseAssembly(dll);
const byName = new Map(asm.byName);
const skip = /^(mscorlib|netstandard|System|Mono\.|Microsoft\.|Windows|Accessibility|UnityEditor)/i;
const dir = dirname(dll);
for (const f of readdirSync(dir).filter((x) => x.toLowerCase().endsWith('.dll') && !skip.test(x) && x !== basename(dll))) {
  try { const ext = parseAssembly(join(dir, f)); for (const [k, v] of ext.byName) if (!byName.has(k)) byName.set(k, v); } catch { /* skip */ }
}
const simple = new Set<string>();
for (const k of byName.keys()) simple.add(k.split('.').pop() ?? k);
const doc = JSON.parse(readFileSync(CWD + '/data/normalized/' + (PROJECT === 'repo' ? 'repo' : 'tcg') + '-mb-payloads.json', 'utf8'));
let ok = 0; let viaSimple = 0; let none = 0;
const samples: string[] = [];
for (const o of doc.objects) {
  const cls: string = o.class;
  if (monoBehaviourClass(asm, cls)) { ok++; continue; }
  if (simple.has(cls)) { viaSimple++; if (samples.length < 5) samples.push(cls); } else none++;
}
console.log(PROJECT + ': payloads=' + doc.objects.length + ' resolved=' + ok + ' refusedButSimpleNameExists=' + viaSimple + ' trulyUnknown=' + none);
console.log('  sample refused classes whose simple name exists: ' + samples.join(', '));
