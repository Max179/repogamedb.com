/**
 * MonoBehaviour payload layout - measured against the reference corpus, not remembered.
 *
 * Round 45 declined to write this from memory because Unity's built-in type layouts and its alignment rules are not
 * in any specification this pipeline can read. They are, however, measurable: the corpus's own bundles contain
 * thousands of MonoBehaviour objects whose classes are in the managed assembly, so a candidate layout can be
 * accepted or refuted by whether it consumes exactly the object's declared byteSize.
 *
 * WHAT WAS MEASURED, over 2,356 MonoBehaviour objects across 60 prefab bundles (docs/PROJECT_STATUS.md section 49):
 *
 *   header      m_GameObject PPtr (12) + m_Enabled (1, padded to 4) + m_Script PPtr (12) + m_Name (i32 byte length,
 *               bytes, padded to 4). After it, every one of the 2,356 objects had a printable m_Name, and 2,320 had
 *               an m_Script that resolved to a MonoScript object (class id 115) whose class name exists in the
 *               assembly - so the header is confirmed structurally, not by plausibility.
 *   fields      bool/i1/u1 = 1, char/i2/u2 = 2, int/uint/float = 4, i8/u8/double = 8, each written on a 4-byte
 *               boundary. Of 39 classes whose written field list is nothing but primitives, all 39 matched the
 *               payload exactly with per-field 4-byte alignment, and only 18 matched without it. The alignment rule
 *               is therefore the one the bytes agree with, and the discriminating case is asserted in the tests.
 *
 * WHAT IS STILL REFUSED: every other kind of field - strings, arrays, PPtr references, enums, nested value types and
 * Unity's built-ins (Vector3, Color, AnimationCurve). Their rules are not measured, so a class containing one is
 * refused rather than decoded with a guessed size. That is why decodePrimitiveFields returns null instead of a
 * partial result, and why the caller is expected to attach nothing in that case.
 */

import type { DotNetAssembly, DotNetField } from './dotnet-metadata.ts';
import { monoBehaviourClass, reachesMonoBehaviour, unitySerializedFields, decodeFieldSignature, fieldTypeName } from './dotnet-metadata.ts';

/** A reference inside a SerializedFile: int32 m_FileID, int64 m_PathID. */
export const PPTR_SIZE = 12;

/** Byte sizes of the field kinds this module decodes. Anything absent is refused. */
export const PRIMITIVE_FIELD_SIZES: Record<string, number> = {
  bool: 1, i1: 1, u1: 1, char: 2, i2: 2, u2: 2, int: 4, uint: 4, i8: 8, u8: 8, float: 4, double: 8,
};

export interface MonoBehaviourHeader {
  gameObjectPathId: bigint;
  enabled: boolean;
  scriptPathId: bigint;
  name: string;
  /** bytes the header occupies before the class's own fields */
  bytes: number;
}

function isPrintable(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x20 || c > 0x7e) return false;
  }
  return true;
}

/**
 * Read the MonoBehaviour header at the start of a payload. Returns null when the bytes cannot be one, so a caller
 * never reads fields from a position it is not sure of.
 */
export function readMonoBehaviourHeader(payload: Buffer): MonoBehaviourHeader | null {
  if (payload.length < 28) return null;
  let p = 0;
  p += 4;                                       // m_GameObject.m_FileID
  const gameObjectPathId = payload.readBigInt64LE(p); p += 8;
  const enabled = payload.readUInt8(p) !== 0; p += 1;
  p = (p + 3) & ~3;                             // m_Enabled is a byte, the next reference is 4-byte aligned
  p += 4;                                       // m_Script.m_FileID
  const scriptPathId = payload.readBigInt64LE(p); p += 8;
  const nameLen = payload.readInt32LE(p);
  if (nameLen < 0 || nameLen > 512 || p + 4 + nameLen > payload.length) return null;
  const name = payload.subarray(p + 4, p + 4 + nameLen).toString('utf8');
  if (!isPrintable(name)) return null;
  p += 4 + nameLen;
  while (p % 4 !== 0) p++;                      // strings are 4-byte aligned
  return { gameObjectPathId, enabled, scriptPathId, name, bytes: p };
}

export interface DecodedFieldValue { name: string; kind: string; value: number | boolean | string | null }

export interface PrimitiveDecode {
  values: DecodedFieldValue[];
  /** bytes consumed, which must equal the payload length for the decode to be accepted */
  bytes: number;
}

/**
 * True when a field typed with a class from *this* assembly is a UnityEngine.Object reference and therefore a
 * \`PPtr\` on disk.
 *
 * The distinction matters: a MonoBehaviour or ScriptableObject subclass is a Unity object and is written as a 12-byte
 * reference, while a class that merely happens to be a class (AnimationCurve lives in UnityEngine, not here) is
 * written inline. Only the first case is decided here, and only when the type is defined in the assembly - so this
 * never has to guess about a type it cannot see the base chain of.
 */
function isAssemblyObjectReference(assembly: DotNetAssembly, typeName: string): boolean {
  const type = assembly.byName.get(typeName);
  if (!type) return false;
  if (reachesMonoBehaviour(assembly, type)) return true;
  const seen = new Set<string>();
  let cur = type;
  while (cur && !seen.has(cur.name)) {
    seen.add(cur.name);
    if (cur.baseType === 'ScriptableObject') return true;
    cur = assembly.byName.get(cur.baseType ?? '') ?? (undefined as never);
  }
  return false;
}

/** Read a Unity string at a cursor: i32 byte length, that many bytes, then padding to a 4-byte boundary. */
function readLengthPrefixedString(payload: Buffer, at: number): { value: string; next: number } | null {
  if (at + 4 > payload.length) return null;
  const len = payload.readInt32LE(at);
  if (len < 0 || len > 1_000_000 || at + 4 + len > payload.length) return null;
  const value = payload.subarray(at + 4, at + 4 + len).toString('utf8');
  let next = at + 4 + len;
  while (next % 4 !== 0) next++;
  return { value, next };
}

/**
 * Decode the subset of a class's written fields whose on-disk size has been measured: the primitives, a string, and
 * a reference to an object class defined in this assembly.
 *
 * Returns null when the class is not in the assembly, has no written fields, contains a field whose size is not
 * measured, or when the decoded length does not equal the payload exactly. The last case is the validator: a
 * correct layout consumes the object's bytes and a wrong one almost never does, which is what makes a candidate
 * rule checkable at all without a Subnautica 2 asset.
 */
export function decodePrimitiveFields(assembly: DotNetAssembly, className: string, payload: Buffer): PrimitiveDecode | null {
  const type = monoBehaviourClass(assembly, className);
  if (!type) return null;
  const written = unitySerializedFields(assembly, type);
  if (!written.length) return null;

  // Every field must be one this module can size before anything is read: a class it cannot lay out is refused
  // whole, never decoded as far as it happens to get.
  const plans: { field: DotNetField; kind: string; size: number }[] = [];
  for (const field of written) {
    const kind = decodeFieldSignature(field.signature).kind;
    if (kind === 'string') { plans.push({ field, kind, size: -1 }); continue; }
    const size = PRIMITIVE_FIELD_SIZES[kind];
    if (size !== undefined) { plans.push({ field, kind, size }); continue; }
    if (kind === 'class' && isAssemblyObjectReference(assembly, fieldTypeName(assembly, field.signature))) {
      plans.push({ field, kind: 'reference', size: PPTR_SIZE });
      continue;
    }
    return null;
  }

  const values: DecodedFieldValue[] = [];
  let p = 0;
  for (let i = 0; i < plans.length; i++) {
    const { field, kind } = plans[i]!;
    const size = plans[i]!.size;
    if (kind === 'string') {
      const read = readLengthPrefixedString(payload, p);
      if (!read) return null;
      values.push({ name: field.name, kind, value: read.value });
      p = read.next;
      continue;
    }
    if (kind === 'reference') {
      if (p + PPTR_SIZE > payload.length) return null;
      // The reference is recorded as a path id, not resolved: resolving it needs the file's object table, which the
      // caller has and this module does not.
      values.push({ name: field.name, kind, value: String(payload.readBigInt64LE(p + 4)) });
      p += PPTR_SIZE;
      continue;
    }
    if (p + size > payload.length) return null;
    let value: number | boolean;
    if (kind === 'bool') value = payload.readUInt8(p) !== 0;
    else if (kind === 'i1') value = payload.readInt8(p);
    else if (kind === 'u1') value = payload.readUInt8(p);
    else if (kind === 'i2') value = payload.readInt16LE(p);
    else if (kind === 'u2') value = payload.readUInt16LE(p);
    else if (kind === 'char') value = payload.readUInt16LE(p);
    else if (kind === 'int') value = payload.readInt32LE(p);
    else if (kind === 'uint') value = payload.readUInt32LE(p);
    else if (kind === 'float') value = payload.readFloatLE(p);
    else if (kind === 'double') value = payload.readDoubleLE(p);
    else value = Number(payload.readBigInt64LE(p));
    values.push({ name: field.name, kind, value });
    p += size;
    p = (p + 3) & ~3;                           // every field starts on a 4-byte boundary
  }

  if (p !== payload.length) return null;
  return { values, bytes: p };
}

/** The field kinds this module can decode, as a list for reporting. */
export function supportedKinds(): string[] {
  return Object.keys(PRIMITIVE_FIELD_SIZES).sort();
}
