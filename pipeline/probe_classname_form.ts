// Diagnostic only: for the residual classNotFound types (unique simple name, not reaching MonoBehaviour), is the
// base-type chain broken because the parent type is missing from the merged table?
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
const fullNames = new Set(pool.map((t) => t.name));
const simpleNames = new Set(pool.map((t) => t.name.split('.').pop() ?? t.name));
const bySimple = new Map<string, (typeof pool)[number]>();
for (const t of pool) { const s = t.name.split('.').pop() ?? t.name; if (!bySimple.has(s)) bySimple.set(s, t); }
const doc = JSON.parse(readFileSync(CWD + '/data/normalized/' + (PROJECT === 'repo' ? 'repo' : 'tcg') + '-mb-payloads.json', 'utf8'));
let refused = 0; let parentPresent = 0; let parentAbsent = 0; let parentEmpty = 0;
const samples: string[] = [];
for (const o of doc.objects) {
  const cls: string = o.class;
  if (monoBehaviourClass(merged, cls)) continue;
  const t = bySimple.get(cls);
  if (!t) continue;
  refused++;
  const base = t.baseType ?? '';
  if (!base) { parentEmpty++; continue; }
  const present = fullNames.has(base) || simpleNames.has(base);
  if (present) parentPresent++; else { parentAbsent++; if (samples.length < 6) samples.push(cls + ' <- ' + base); }
}
console.log(PROJECT + ': refused=' + refused + ' parentPresent=' + parentPresent + ' parentAbsent=' + parentAbsent + ' parentEmpty=' + parentEmpty);
console.log('  samples of missing parents: ' + samples.join(' | '));
