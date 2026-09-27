// Diagnostic only: dump the base-type chain of refused classes hop by hop, to observe where resolution stops.
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
const simpleIdx = new Map<string, (typeof pool)[number]>();
for (const t of pool) { const s = t.name.split('.').pop() ?? t.name; if (!simpleIdx.has(s)) simpleIdx.set(s, t); }
const candidates = (cls: string) => pool.filter((t) => (t.name.split('.').pop() ?? t.name) === cls);
function chain(t: (typeof pool)[number]): string[] {
  const out: string[] = [];
  let cur: (typeof pool)[number] | undefined = t;
  const seen = new Set<string>();
  while (cur && !seen.has(cur.name) && out.length < 6) {
    seen.add(cur.name);
    const base = cur.baseType ?? '';
    const simple = base.split('.').pop() ?? base;
    const mark = base === '' ? '(none)' : byName.has(base) ? 'exact' : simpleIdx.has(simple) ? 'simple-only' : 'MISSING';
    out.push(cur.name + '  --base: ' + base + '  [' + mark + ']');
    cur = byName.get(base) ?? simpleIdx.get(simple);
  }
  return out;
}
const doc = JSON.parse(readFileSync(CWD + '/data/normalized/' + (PROJECT === 'repo' ? 'repo' : 'tcg') + '-mb-payloads.json', 'utf8'));
const refused = [...new Set(doc.objects.filter((o: { class: string }) => !monoBehaviourClass(merged, o.class)).map((o: { class: string }) => o.class))];
console.log(PROJECT + ': distinct refused classes=' + refused.length + ' first=' + refused.slice(0, 4).join(', '));
for (const cls of refused.slice(0, 3)) {
  const cs = candidates(cls as string);
  console.log('  ' + cls + ': ' + cs.length + ' candidate(s)');
  for (const c of cs.slice(0, 2)) for (const line of chain(c)) console.log('     ' + line);
}
