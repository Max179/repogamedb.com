// End-to-end: real game bytes -> class layout from that game's own assembly -> decoded values or an explicit refusal.
import { readFileSync } from 'node:fs';
import { parseAssembly, monoBehaviourClass } from './dotnet-metadata.ts';
import { readMonoBehaviourHeader, decodePrimitiveFields } from './mono-layout.ts';

const jobs = [
  ['repo', 'C:/Users/CHEN/Desktop/repo/data/normalized/repo-mb-payloads.json',
   'C:/Users/CHEN/Desktop/repo/data/raw/R.E.P.O.v0.4.0/REPO/REPO_Data/Managed/Assembly-CSharp.dll'],
  ['tcg', 'C:/Users/CHEN/Desktop/tcg-shop/data/normalized/tcg-mb-payloads.json',
   'C:/uTorria/Downloads/TCG Card Shop Simulator/Card Shop Simulator_Data/Managed/Assembly-CSharp.dll'],
];
for (const [label, payloadPath, dll] of jobs) {
  let doc;
  try { doc = JSON.parse(readFileSync(payloadPath, 'utf8')); } catch { console.log(label + ': no payload dump'); continue; }
  const asm = parseAssembly(dll);
  let decoded = 0, refusedHeader = 0, refusedClass = 0, refusedLayout = 0;
  const values: Record<string, unknown>[] = [];
  for (const o of doc.objects) {
    const buf = Buffer.from(o.payload, 'base64');
    const h = readMonoBehaviourHeader(buf);
    if (!h) { refusedHeader++; continue; }
    if (!monoBehaviourClass(asm, o.class)) { refusedClass++; continue; }
    const r = decodePrimitiveFields(asm, o.class, buf.subarray(h.bytes));
    if (!r) { refusedLayout++; continue; }
    decoded++;
    for (const v of r.values) if (values.length < 12) values.push({ class: o.class, field: v.name, value: v.value });
  }
  console.log('=== ' + label + ' objects=' + doc.objects.length + ' decoded=' + decoded +
    ' refused(header)=' + refusedHeader + ' refused(unknownClass)=' + refusedClass + ' refused(layout)=' + refusedLayout);
  for (const v of values) console.log('    ' + v.class + '.' + v.field + ' = ' + JSON.stringify(v.value));
}
