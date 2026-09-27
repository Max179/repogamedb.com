// Decoder for MonoBehaviour payloads: primitives, strings, references to object classes in this assembly, and enums.
// Each rule is either measured on real bytes earlier (primitives with 4-byte field alignment; strings and PPtrs from
// the object header and MonoScript layouts) or derived from this game's own assembly (enum underlying size via
// value__). A decode is accepted ONLY when it consumes the payload exactly, so a wrong rule cannot pass silently.
import type { DotNetAssembly, DotNetField } from './dotnet-metadata.ts';
import { monoBehaviourClass, unitySerializedFields, decodeFieldSignature, fieldTypeName, reachesMonoBehaviour } from './dotnet-metadata.ts';
import { readMonoBehaviourHeader, PRIMITIVE_FIELD_SIZES, PPTR_SIZE } from './mono-layout.ts';

export { readMonoBehaviourHeader };

function isObjectReference(assembly: DotNetAssembly, typeName: string): boolean {
  const t = assembly.byName.get(typeName);
  if (!t) return false;
  if (reachesMonoBehaviour(assembly, t)) return true;
  const seen = new Set<string>();
  let cur: typeof t | undefined = t;
  while (cur && !seen.has(cur.name)) {
    seen.add(cur.name);
    if (cur.baseType === 'ScriptableObject') return true;
    cur = assembly.byName.get(cur.baseType ?? '');
  }
  return false;
}

/** Enums are written as their underlying integer; the size comes from the enum's own value__ field. */
function enumUnderlying(assembly: DotNetAssembly, typeName: string): string | null {
  const t = assembly.byName.get(typeName);
  if (!t || t.baseType !== 'Enum') return null;
  const v = t.fields.find((f) => f.name === 'value__');
  if (!v) return null;
  const kind = decodeFieldSignature(v.signature).kind;
  return PRIMITIVE_FIELD_SIZES[kind] !== undefined ? kind : null;
}

export interface DecodedValue { name: string; kind: string; value: number | boolean | string | null }

export function decodeValues(assembly: DotNetAssembly, className: string, payload: Buffer): DecodedValue[] | null {
  const type = monoBehaviourClass(assembly, className);
  if (!type) return null;
  const written = unitySerializedFields(assembly, type);
  if (!written.length) return null;

  const plans: { field: DotNetField; kind: string; size: number; read: string }[] = [];
  for (const field of written) {
    const kind = decodeFieldSignature(field.signature).kind;
    if (kind === 'string') { plans.push({ field, kind: 'string', size: -1, read: 'string' }); continue; }
    const prim = PRIMITIVE_FIELD_SIZES[kind];
    if (prim !== undefined) { plans.push({ field, kind, size: prim, read: kind }); continue; }
    const resolved = fieldTypeName(assembly, field.signature);
    if (kind === 'class' && isObjectReference(assembly, resolved)) { plans.push({ field, kind: 'reference', size: PPTR_SIZE, read: 'reference' }); continue; }
    const underlying = (kind === 'valuetype' || kind === 'class') ? enumUnderlying(assembly, resolved) : null;
    if (underlying) { plans.push({ field, kind: 'enum:' + resolved, size: PRIMITIVE_FIELD_SIZES[underlying]!, read: underlying }); continue; }
    return null;   // a size this decoder has not measured: refuse the class wholesale
  }

  const values: DecodedValue[] = [];
  let p = 0;
  for (const plan of plans) {
    if (plan.read === 'string') {
      if (p + 4 > payload.length) return null;
      const len = payload.readInt32LE(p);
      if (len < 0 || len > 4096 || p + 4 + len > payload.length) return null;
      values.push({ name: plan.field.name, kind: 'string', value: payload.subarray(p + 4, p + 4 + len).toString('utf8') });
      p += 4 + len; while (p % 4 !== 0) p++;
      continue;
    }
    if (plan.read === 'reference') {
      if (p + PPTR_SIZE > payload.length) return null;
      values.push({ name: plan.field.name, kind: 'reference', value: String(payload.readBigInt64LE(p + 4)) });
      p += PPTR_SIZE; while (p % 4 !== 0) p++;
      continue;
    }
    if (p + plan.size > payload.length) return null;
    const k = plan.read;
    let v: number | boolean;
    if (k === 'bool') v = payload.readUInt8(p) !== 0;
    else if (k === 'i1') v = payload.readInt8(p);
    else if (k === 'u1') v = payload.readUInt8(p);
    else if (k === 'i2') v = payload.readInt16LE(p);
    else if (k === 'u2' || k === 'char') v = payload.readUInt16LE(p);
    else if (k === 'int') v = payload.readInt32LE(p);
    else if (k === 'uint') v = payload.readUInt32LE(p);
    else if (k === 'float') v = payload.readFloatLE(p);
    else if (k === 'double') v = payload.readDoubleLE(p);
    else v = Number(payload.readBigInt64LE(p));
    values.push({ name: plan.field.name, kind: plan.kind, value: v });
    p += plan.size; while (p % 4 !== 0) p++;
  }
  if (p !== payload.length) return null;
  return values;
}
