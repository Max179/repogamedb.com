// Diagnostic only: classify the residual classNotFound cases into ambiguous / present-but-not-MonoBehaviour /
// absent, so any further rule is chosen from measurement instead of assumption.
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
const local = parseAssembly(dll);
const byName = new Map(local.byName);
const skip = /^(mscorlib|netstandard|System|Mono\.|Microsoft\.|Windows|Accessibility|UnityEditor)/i;
const dir = dirname(dll);
for (const f of readdirSync(dir).filter((x) => x.toLowerCase().endsWith('.dll') && !skip.test(x) && x !== basename(dll))) {
  try { const ext = parseAssembly(join(dir, f)); for (const [k, v] of ext.byName) if (!byName.has(k)) byName.set(k, v); } catch { /* skip */ }
}
const merged = { ...local, byName };
const pool = [...new Set(byName.values())];
const simpleCount = new Map<string, number>();
for (const t of pool) { const s = t.name.split('.').pop() ?? t.name; simpleCount.set(s, (simpleCount.get(s) ?? 0) + 1); }
const doc = JSON.parse(readFileSync(CWD + '/data/normalized/' + (PROJECT === 'repo' ? 'repo' : 'tcg') + '-mb-payloads.json', 'utf8'));
let ok = 0; let absent = 0; let ambiguous = 0; let uniqueNoMono = 0;
const ambSamples: string[] = [];
for (const o of doc.objects) {
  const cls: string = o.class;
  if (monoBehaviourClass(merged, cls)) { ok++; continue; }
  const n = simpleCount.get(cls) ?? 0;
  if (n === 0) absent++;
  else if (n > 1) { ambiguous++; if (ambSamples.length < 6) ambSamples.push(cls + 'x' + n); }
  else uniqueNoMono++;
}
console.log(PROJECT + ': payloads=' + doc.objects.length + ' resolved=' + ok + ' refused(absentName=' + absent + ' ambiguous=' + ambiguous + ' uniqueButNotMonoBehaviour=' + uniqueNoMono + ')');
console.log('  ambiguous samples: ' + ambSamples.join(', '));
