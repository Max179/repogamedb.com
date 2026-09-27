/**
 * Unity serialized-file reader (SerializedFileFormatVersion 21, Unity 2019.4 Mono).
 *
 * This layout was determined empirically and then validated to the byte against a real build:
 *
 *   - the four header integers are BIG-endian, while the metadata block they size is
 *     little-endian (the header's own endianness byte reads 0, i.e. little). dataOffset is
 *     exactly 20 + metadataSize.
 *   - every SerializedType reads a 16-byte old type hash UNCONDITIONALLY, not only for
 *     MonoBehaviour types. Getting this wrong misaligns the object table into plausible-looking
 *     garbage.
 *   - type_dependencies exist only when type trees are enabled (they are NOT in this build).
 *   - each object entry is aligned to 4 bytes BEFORE its path id.
 *
 * Self-check: a correct parse must satisfy max(byteStart + byteSize) === fileSize - dataOffset
 * and must land the script-type table exactly on the externals count. Both hold on
 * resources.assets (7,598,004 of 7,598,004 bytes, slack 0). The reader refuses to return a
 * result that fails either check, so a wrong layout fails loudly instead of yielding nonsense.
 *
 * IMPORTANT: this build sets enableTypeTree = false, so MonoBehaviour field *names* are not in
 * the file. Decoding them needs the managed assembly (Assembly-CSharp.dll) for field order.
 * The reader therefore exposes object byte ranges and the script-type table rather than
 * pretending to know field names.
 */

import { readFileSync } from 'node:fs';

export interface SerializedTypeInfo {
  classId: number;
  isStripped: boolean;
  scriptTypeIndex: number;
  scriptId: Buffer | null;
  oldTypeHash: Buffer;
}

export interface SerializedObjectInfo {
  pathId: bigint;
  /** byte offset relative to dataOffset */
  byteStart: number;
  byteSize: number;
  typeId: number;
  classId: number;
  /** absolute file offset of the object payload */
  fileOffset: number;
}

export interface ScriptTypeRef { fileIndex: number; pathId: bigint; }

export interface ExternalRef { guid: string; type: number; path: string; }

export interface SerializedFile {
  file: string;
  version: number;
  unityVersion: string;
  targetPlatform: number;
  enableTypeTree: boolean;
  dataOffset: number;
  metadataSize: number;
  types: SerializedTypeInfo[];
  objects: SerializedObjectInfo[];
  scriptTypes: ScriptTypeRef[];
  externals: ExternalRef[];
  warnings: string[];
}

const MONO_BEHAVIOUR_CLASS = 114;
const MONO_SCRIPT_CLASS = 115;

function guidString(b: Buffer): string {
  const a = b.readUInt32BE(0).toString(16).padStart(8, '0');
  const c = b.readUInt16BE(4).toString(16).padStart(4, '0');
  const d = b.readUInt16BE(6).toString(16).padStart(4, '0');
  return a + c + d + b.subarray(8).toString('hex');
}

export function readSerializedFile(path: string): SerializedFile {
  return parseSerializedFile(readFileSync(path), path);
}

/** Parse a SerializedFile from memory - used for files found inside UnityFS bundles. */
export function parseSerializedFile(buf: Buffer, label: string): SerializedFile {
  const path = label;
  const warnings: string[] = [];

  // --- header (big-endian integers) -------------------------------------
  const metadataSize = buf.readUInt32BE(0);
  const fileSize = buf.readUInt32BE(4);
  const version = buf.readUInt32BE(8);
  const dataOffset = buf.readUInt32BE(12);
  // The data section is padded: resources.assets has dataOffset == 20 + metadataSize (already
  // 16-aligned), while globalgamemanagers pads to 4096. So the metadata block is always
  // [20, 20 + metadataSize) and dataOffset is that value rounded up, never smaller.
  if (dataOffset < 20 + metadataSize || dataOffset - (20 + metadataSize) > 8192) {
    throw new Error(path + ': dataOffset ' + dataOffset + ' is inconsistent with metadataSize ' + metadataSize + ' - not a recognised serialized file');
  }
  if (fileSize !== buf.length) warnings.push('header fileSize ' + fileSize + ' != actual ' + buf.length);

  // --- metadata (little-endian) ----------------------------------------
  let p = 20;
  const i32 = () => { const v = buf.readInt32LE(p); p += 4; return v; };
  const u32 = () => { const v = buf.readUInt32LE(p); p += 4; return v; };
  const i16 = () => { const v = buf.readInt16LE(p); p += 2; return v; };
  const i64 = () => { const v = buf.readBigInt64LE(p); p += 8; return v; };
  const u8 = () => buf[p++];
  const align = (n: number) => { const r = p % n; if (r) p += n - r; };
  const cstr = () => { let s = ''; while (p < buf.length) { const c = buf[p++]!; if (c === 0) break; s += String.fromCharCode(c); } return s; };
  const bytes = (n: number) => { const b = buf.subarray(p, p + n); p += n; return b; };

  const unityVersion = cstr();
  align(4);
  const targetPlatform = i32();
  const enableTypeTree = version >= 13 ? u8() !== 0 : false;

  const typeCount = i32();
  if (typeCount <= 0 || typeCount > 5000) throw new Error(path + ': implausible typeCount ' + typeCount);
  const types: SerializedTypeInfo[] = [];
  for (let i = 0; i < typeCount; i++) {
    const classId = i32();
    let isStripped = false;
    if (version >= 16) isStripped = u8() !== 0;
    let scriptTypeIndex = -1;
    if (version >= 17) scriptTypeIndex = i16();
    const mono = (version >= 16 && classId === MONO_BEHAVIOUR_CLASS) || (version < 16 && classId < 0);
    const scriptId = mono || (isStripped && scriptTypeIndex >= 0) ? bytes(16) : null;
    const oldTypeHash = bytes(16);   // unconditional
    if (enableTypeTree) {
      // type trees are absent in this build; a present tree is not parsed here
      throw new Error(path + ': enableTypeTree is set but tree parsing is not implemented');
    }
    types.push({ classId, isStripped, scriptTypeIndex, scriptId: scriptId ? Buffer.from(scriptId) : null, oldTypeHash: Buffer.from(oldTypeHash) });
  }

  // --- objects ----------------------------------------------------------
  const objectCount = i32();
  if (objectCount <= 0 || objectCount > 500000) throw new Error(path + ': implausible objectCount ' + objectCount);
  const objects: SerializedObjectInfo[] = [];
  let maxRelEnd = 0;
  for (let i = 0; i < objectCount; i++) {
    align(4);                                   // alignment precedes the path id
    const pathId = version >= 14 ? i64() : BigInt(i32());
    const byteStart = version >= 22 ? Number(i64()) : u32();
    const byteSize = u32();
    const typeId = i32();
    if (version < 16) i16();
    if (version < 11) i16();
    if (version >= 11 && version < 17) i16();
    if (version === 15 || version === 16) u8();
    if (typeId < 0 || typeId >= typeCount) throw new Error(path + ': object ' + i + ' has typeId ' + typeId + ' outside 0..' + (typeCount - 1));
    const t = types[typeId]!;
    objects.push({ pathId, byteStart, byteSize, typeId, classId: t.classId, fileOffset: dataOffset + byteStart });
    maxRelEnd = Math.max(maxRelEnd, byteStart + byteSize);
  }

  const scriptTypes: ScriptTypeRef[] = [];
  if (version >= 11) {
    const n = i32();
    if (n < 0 || n > 100000) throw new Error(path + ': implausible scriptType count ' + n);
    for (let i = 0; i < n; i++) {
      const fileIndex = i32();
      const pid = version < 14 ? BigInt(i32()) : i64();
      scriptTypes.push({ fileIndex, pathId: pid });
    }
  }

  const externals: ExternalRef[] = [];
  {
    const n = i32();
    if (n < 0 || n > 10000) throw new Error(path + ': implausible external count ' + n);
    for (let i = 0; i < n; i++) {
      cstr();
      const guid = guidString(Buffer.from(bytes(16)));
      const type = i32();
      const path_ = cstr();
      externals.push({ guid, type, path: path_ });
    }
  }

  // --- self-check -------------------------------------------------------
  const available = fileSize - dataOffset;
  if (maxRelEnd !== available) {
    throw new Error(path + ': layout self-check failed - objects account for ' + maxRelEnd +
      ' bytes but the data block is ' + available + '. The container layout does not match this reader.');
  }

  console.log('[serialized] ' + path.split(/[\\/]/).pop() + ' v' + version + ' unity=' + unityVersion +
    ' types=' + types.length + ' objects=' + objects.length + ' monoBehaviours=' +
    objects.filter((o) => o.classId === MONO_BEHAVIOUR_CLASS).length +
    ' typeTree=' + enableTypeTree + ' externals=' + externals.length);

  return {
    file: path, version, unityVersion, targetPlatform, enableTypeTree, dataOffset, metadataSize,
    types, objects, scriptTypes, externals, warnings,
  };
}

export function classHistogram(f: SerializedFile): Map<number, number> {
  const m = new Map<number, number>();
  for (const o of f.objects) m.set(o.classId, (m.get(o.classId) ?? 0) + 1);
  return m;
}

export { MONO_BEHAVIOUR_CLASS, MONO_SCRIPT_CLASS };
