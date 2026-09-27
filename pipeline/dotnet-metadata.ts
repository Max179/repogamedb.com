/**
 * .NET assembly metadata reader (ECMA-335) - derived from the specification, not fitted to the data.
 *
 * Why this exists: Subnautica is a Mono build and the Unity player files carry no type trees, so a
 * MonoBehaviour's field *names* are nowhere in the assets. They are in the managed assembly. Unity serialises a
 * MonoBehaviour's fields in C# declaration order (base class first), so a class's field list is exactly what is
 * needed to lay out the bytes that follow its script reference.
 *
 * Only metadata tables are read. The assembly's IL is never executed or interpreted - field order, names, flags
 * and signatures are all table data.
 *
 * Pipeline: DOS header -> PE header -> section table -> CLI header (data directory 14) -> metadata root ("BSJB")
 * -> streams (#~, #Strings, #Blob) -> table rows.
 *
 * -----------------------------------------------------------------------------------------------------------
 * WHAT CHANGED IN ROUND 41, AND WHY THE EARLIER DIAGNOSIS WAS WRONG
 *
 * The round-12 note in docs/unity-format.md section 7 blamed the Module and TypeRef row sizes and placed the
 * TypeDef table "about 2,088 bytes past its real position". Both were misreadings:
 *
 *   - The row sizes the specification gives are correct and always were. Read at the offset they produce,
 *     Assembly-CSharp.dll's first TypeDef row is exactly `<Module>` (ECMA-335 requires the module type to be
 *     row 1) and the next rows are real classes: SimpleFogBoxVolume, VolumetricObjectBase, AimIKTarget, Bench,
 *     IMovementPlatform. Module is 2 + stringIdx + 3 x guidIdx = 12 bytes here, TypeRef is
 *     resolutionScope + 2 x stringIdx = 10 bytes, and neither needed adjusting.
 *
 *   - The calibration failed on 129 of 137 assemblies because its *plausibility scorer* read a 4-byte name index
 *     (`readUInt32LE(b + 4)`) no matter what the #Strings heap size said. Assemblies whose string heap is small
 *     enough to use 2-byte indexes - 129 of them - were scored on bytes that are not the name index, so the fit
 *     collapsed. The scorer was measuring its own bug.
 *
 *   - A plausibility score cannot settle this layout at all: a shift of one row still lands on other real class
 *     names (reading 2,088 bytes late yields BaseLight, BaseModuleLighting, BaseNuclearReactorGeometry), so both
 *     the right and the wrong layout look plausible. That is why nothing here is fitted any more.
 *
 * The reader now derives every index size from the #~ header and validates what it read against invariants the
 * specification guarantees - row 1 is `<Module>`, FieldList is non-decreasing and inside the Field table, every
 * field blob starts with the FIELD signature byte 0x06, every name is printable - instead of grading a guess.
 * A structural failure throws. `dotnet-metadata.test.ts` runs it over all 137 managed assemblies and requires
 * every one to pass.
 * -----------------------------------------------------------------------------------------------------------
 */

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

export interface DotNetField {
  name: string;
  flags: number;
  /** Custom attribute type names declared on the field, e.g. 'UnityEngine.SerializeField'. Absent when there are none. */
  attributes?: string[];
  /** raw field signature blob (see decodeFieldSignature) */
  signature: Buffer;
  /** value when this field is a compile-time constant, e.g. an enum member */
  constant?: number;
}

export interface DotNetType {
  index: number;
  name: string;
  namespace: string;
  flags: number;
  /** resolved base type name, or null for System.Object */
  baseType: string | null;
  /** raw Extends coded index, kept for resolution fallback */
  extendsRaw: number;
  fields: DotNetField[];
}

/** What the reader had to decide to walk the tables, kept so a failure can be diagnosed without a debugger. */
export interface DotNetTables {
  /** table id -> row count, for every table the valid mask declares */
  rows: number[];
  heapSizes: number;
  stringIdxSize: number;
  guidIdxSize: number;
  blobIdxSize: number;
  /** byte sizes derived for the tables this reader walks */
  sizes: Record<string, number>;
  /** byte offset of the table data inside the #~ stream */
  dataStart: number;
  /** file offset of the #~ stream, so a test can address a table row in the file */
  streamOffset: number;
  /** file offset of the metadata root ("BSJB") */
  metadataOffset: number;
}

export interface DotNetAssembly {
  file: string;
  runtimeVersion: string;
  typeCount: number;
  fieldCount: number;
  types: DotNetType[];
  byName: Map<string, DotNetType>;
  /** TypeRef rows, in row order: the types this assembly references but does not define. */
  typeRefs: { name: string; namespace: string }[];
  tables: DotNetTables;
  warnings: string[];
}

// ---------------------------------------------------------------- PE + metadata

interface Section { va: number; vsize: number; ptr: number }

function rvaToOffset(sections: Section[], rva: number): number {
  for (const s of sections) {
    if (rva >= s.va && rva < s.va + Math.max(s.vsize, 1)) return rva - s.va + s.ptr;
  }
  return -1;
}

interface Stream { offset: number; size: number }

function readMetadataRoot(buf: Buffer, metaOffset: number): { runtimeVersion: string; streams: Record<string, Stream> } {
  let p = metaOffset;
  const sig = buf.readUInt32LE(p); p += 4;
  if (sig !== 0x424a5342) throw new Error('metadata signature 0x' + sig.toString(16) + ' != BSJB');
  p += 4;                                  // major/minor version
  p += 4;                                  // reserved
  const versionLen = buf.readUInt32LE(p); p += 4;
  if (versionLen > 255) throw new Error('metadata runtime version length ' + versionLen + ' is implausible');
  const runtimeVersion = buf.subarray(p, p + versionLen).toString('ascii').replace(/[\0\s]+$/, '');
  p += versionLen;
  p += 2;                                  // flags
  const streamCount = buf.readUInt16LE(p); p += 2;
  if (streamCount > 32) throw new Error('metadata stream count ' + streamCount + ' is implausible');

  const streams: Record<string, Stream> = {};
  for (let i = 0; i < streamCount; i++) {
    const offset = buf.readUInt32LE(p); p += 4;
    const size = buf.readUInt32LE(p); p += 4;
    let name = '';
    while (p < buf.length && buf[p] !== 0) name += String.fromCharCode(buf[p++]!);
    p++;
    // stream headers are padded to a 4-byte boundary
    while (p % 4 !== 0) p++;
    streams[name] = { offset: metaOffset + offset, size };
  }
  return { runtimeVersion, streams };
}

// ------------------------------------------------------------------ table read

/** Table ids used by name, in the order they are stored. */
const T_MODULE = 0x00, T_TYPEREF = 0x01, T_TYPEDEF = 0x02, T_FIELDPTR = 0x03, T_FIELD = 0x04;
const T_MEMBERREF = 0x0a, T_CONSTANT = 0x0b, T_CUSTOMATTRIBUTE = 0x0c;

/** Coded-index tag widths, from ECMA-335 II.24.2.6. */
const CODED = {
  ResolutionScope: { tables: [0x00, 0x1a, 0x23, 0x01], tagBits: 2 },
  TypeDefOrRef: { tables: [0x02, 0x01, 0x1b], tagBits: 2 },
  HasConstant: { tables: [0x04, 0x08, 0x17], tagBits: 2 },
  MemberRefParent: { tables: [0x02, 0x01, 0x1a, 0x06, 0x1b], tagBits: 3 },
  CustomAttributeType: { tables: [0x06, 0x0a], tagBits: 3 },
  // ECMA-335 II.24.2.6 lists the HasCustomAttribute set; the row count of each matters for the tag width.
  HasCustomAttribute: {
    tables: [0x06, 0x04, 0x01, 0x02, 0x08, 0x09, 0x0a, 0x00, 0x0e, 0x17, 0x14, 0x11, 0x1a, 0x1b, 0x20, 0x23, 0x26, 0x27, 0x28, 0x2a, 0x2c, 0x2b],
    tagBits: 5,
  },
};

/** ECMA-335 II.23.2 compressed unsigned integer. */
function readCompressedUInt(buf: Buffer, at: number): { value: number; next: number } {
  const b0 = buf[at];
  if (b0 === undefined) throw new Error('compressed integer: byte ' + at + ' is past the end');
  if ((b0 & 0x80) === 0) return { value: b0, next: at + 1 };
  if ((b0 & 0xc0) === 0x80) {
    const b1 = buf[at + 1];
    if (b1 === undefined) throw new Error('compressed integer: truncated 2-byte form at ' + at);
    return { value: ((b0 & 0x3f) << 8) | b1, next: at + 2 };
  }
  if ((b0 & 0xe0) === 0xc0) {
    if (at + 3 >= buf.length) throw new Error('compressed integer: truncated 4-byte form at ' + at);
    return { value: ((b0 & 0x1f) << 24) | (buf[at + 1]! << 16) | (buf[at + 2]! << 8) | buf[at + 3]!, next: at + 4 };
  }
  throw new Error('compressed integer: invalid prefix 0x' + b0.toString(16) + ' at ' + at);
}

/** Printable ASCII with no space: every identifier and namespace in this corpus is written that way. */
function isIdent(s: string): boolean {
  if (!s) return false;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x21 || c > 0x7e) return false;
  }
  return true;
}

export function parseAssembly(path: string): DotNetAssembly {
  const buf = readFileSync(path);
  const name = basename(path);
  if (buf.length < 0x40 || buf.readUInt16LE(0) !== 0x5a4d) throw new Error(name + ': not a PE file (no MZ)');
  const peOffset = buf.readUInt32LE(0x3c);
  if (peOffset + 24 > buf.length || buf.readUInt32LE(peOffset) !== 0x00004550) throw new Error(name + ': no PE signature');
  const coff = peOffset + 4;
  const sectionCount = buf.readUInt16LE(coff + 2);
  const optSize = buf.readUInt16LE(coff + 16);
  const opt = coff + 20;

  const sections: Section[] = [];
  for (let i = 0; i < sectionCount; i++) {
    const s = opt + optSize + i * 40;
    if (s + 40 > buf.length) throw new Error(name + ': section table runs past the end of the file');
    sections.push({ vsize: buf.readUInt32LE(s + 8), va: buf.readUInt32LE(s + 12), ptr: buf.readUInt32LE(s + 20) });
  }

  const magic = buf.readUInt16LE(opt);
  const ddBase = opt + (magic === 0x20b ? 112 : 96);
  const cliRva = buf.readUInt32LE(ddBase + 14 * 8);
  if (!cliRva) throw new Error(name + ': no CLI header (not a managed assembly)');
  const cli = rvaToOffset(sections, cliRva);
  if (cli < 0) throw new Error(name + ': CLI header RVA not mapped');
  const metaRva = buf.readUInt32LE(cli + 8);
  const metaOffset = rvaToOffset(sections, metaRva);
  if (metaOffset < 0) throw new Error(name + ': metadata RVA not mapped');

  const { runtimeVersion, streams } = readMetadataRoot(buf, metaOffset);
  const tables = streams['#~'] ?? streams['#-'];
  const strings = streams['#Strings'];
  const blob = streams['#Blob'];
  if (!tables || !strings || !blob) {
    throw new Error(name + ': missing required metadata streams (have: ' + Object.keys(streams).join(', ') + ')');
  }

  // ---- #~ header (ECMA-335 II.24.2.6) -----------------------------------
  let p = tables.offset;
  const headerEnd = tables.offset + tables.size;
  p += 4;                                  // reserved
  p += 2;                                  // major / minor version
  const heapSizes = buf[p]!; p += 1;
  p += 1;                                  // reserved
  const validLo = buf.readUInt32LE(p); const validHi = buf.readUInt32LE(p + 4); p += 8;
  p += 8;                                  // sorted mask
  const rows: number[] = new Array(64).fill(0);
  for (let i = 0; i < 64; i++) {
    const bit = i < 32 ? (validLo >>> i) & 1 : (validHi >>> (i - 32)) & 1;
    if (bit) { rows[i] = buf.readUInt32LE(p); p += 4; }
  }
  const dataStart = p - tables.offset;

  const stringIdxSize = (heapSizes & 0x01) ? 4 : 2;
  const guidIdxSize = (heapSizes & 0x02) ? 4 : 2;
  const blobIdxSize = (heapSizes & 0x04) ? 4 : 2;
  const simple = (table: number) => (rows[table]! < 0x10000 ? 2 : 4);
  const coded = (spec: { tables: number[]; tagBits: number }) =>
    (Math.max(...spec.tables.map((x) => rows[x]!)) < (1 << (16 - spec.tagBits)) ? 2 : 4);

  const resolutionScope = coded(CODED.ResolutionScope);
  const typeDefOrRef = coded(CODED.TypeDefOrRef);
  const hasConstant = coded(CODED.HasConstant);
  const memberRefParent = coded(CODED.MemberRefParent);

  // Row sizes for every table this reader walks. Each is the sum of its columns (ECMA-335 II.22).
  const sizes: Record<string, number> = {
    Module: 2 + stringIdxSize + guidIdxSize * 3,
    TypeRef: resolutionScope + stringIdxSize * 2,
    TypeDef: 4 + stringIdxSize * 2 + typeDefOrRef + simple(T_FIELD) + simple(0x06),
    Field: 2 + stringIdxSize + blobIdxSize,
    FieldPtr: simple(T_FIELD),
    MethodPtr: simple(0x06),
    MethodDef: 4 + 2 + 2 + stringIdxSize + blobIdxSize + simple(0x08),
    ParamPtr: simple(0x08),
    Param: 2 + 2 + stringIdxSize,
    InterfaceImpl: simple(T_TYPEDEF) + typeDefOrRef,
    MemberRef: memberRefParent + stringIdxSize + blobIdxSize,
    Constant: 1 + 1 + hasConstant + blobIdxSize,
    CustomAttribute: coded(CODED.HasCustomAttribute) + coded(CODED.CustomAttributeType) + blobIdxSize,
  };
  const tableInfo: DotNetTables = {
    rows, heapSizes, stringIdxSize, guidIdxSize, blobIdxSize, sizes, dataStart,
    streamOffset: tables.offset, metadataOffset: metaOffset,
  };

  // ---- helpers over the heaps -------------------------------------------
  const readString = (i: number): string | null => {
    if (i === 0) return '';
    const at = strings.offset + i;
    if (i < 0 || at >= strings.offset + strings.size) return null;
    let e = at;
    const end = strings.offset + strings.size;
    while (e < end && buf[e] !== 0) e++;
    return buf.subarray(at, e).toString('utf8');
  };
  const readBlob = (i: number): Buffer | null => {
    if (i < 0 || i >= blob.size) return null;
    const at = blob.offset + i;
    const len = readCompressedUInt(buf, at);
    const from = len.next;
    if (from + len.value > blob.offset + blob.size) return null;
    return Buffer.from(buf.subarray(from, from + len.value));
  };

  // ---- walk the tables in id order --------------------------------------
  const typeRefs: { name: string; ns: string }[] = [];
  const typeDefs: DotNetType[] = [];
  const fieldNames: string[] = [];
  const fieldFlags: number[] = [];
  const fieldSigs: Buffer[] = [];
  const constantByFieldRow = new Map<number, number>();
  /** MemberRef row (1-based) -> the attribute/type name its constructor belongs to. */
  const memberRefClass: string[] = [];
  /** Field row (1-based) -> attribute type names declared on it. */
  const attributesByFieldRow = new Map<number, string[]>();
  /** 1-based FieldList value per TypeDef row, in row order. */
  const fieldStarts: number[] = [];

  p = tables.offset + dataStart;
  const skip = (n: number) => { p += n; };
  const u8 = () => buf[p++]!;
  const u16 = () => { const v = buf.readUInt16LE(p); p += 2; return v; };
  const u32 = () => { const v = buf.readUInt32LE(p); p += 4; return v; };
  const idx = (size: number) => (size === 2 ? u16() : u32());

  for (let id = 0; id <= T_CUSTOMATTRIBUTE; id++) {
    const n = rows[id]!;
    if (n === 0) continue;
    switch (id) {
      case T_MODULE:
        skip(sizes['Module']! * n);
        break;
      case T_TYPEREF:
        for (let i = 0; i < n; i++) {
          skip(resolutionScope);
          const nm = readString(idx(stringIdxSize));
          const ns = readString(idx(stringIdxSize));
          if (nm === null || ns === null) throw new Error(name + ': TypeRef row ' + (i + 1) + ' name/namespace index is outside the #Strings heap');
          typeRefs.push({ name: nm, ns });
        }
        break;
      case T_TYPEDEF: {
        const start = p;
        const rowSize = sizes['TypeDef']!;
        for (let i = 0; i < n; i++) {
          p = start + i * rowSize;
          const flags = u32();
          const nmIdx = idx(stringIdxSize);
          const nsIdx = idx(stringIdxSize);
          const extendsRaw = idx(typeDefOrRef);
          const fieldList = idx(simple(T_FIELD));
          skip(simple(0x06));                 // MethodList
          const nm = readString(nmIdx);
          const ns = readString(nsIdx);
          if (nm === null || ns === null) throw new Error(name + ': TypeDef row ' + (i + 1) + ' name/namespace index is outside the #Strings heap');
          typeDefs.push({ index: i, name: nm, namespace: ns, flags, baseType: null, extendsRaw, fields: [] });
          fieldStarts.push(fieldList);
        }
        p = start + n * rowSize;
        break;
      }
      case T_FIELDPTR:
        skip(sizes['FieldPtr']! * n);
        break;
      case T_FIELD:
        for (let i = 0; i < n; i++) {
          const flags = u16();
          const nmIdx = idx(stringIdxSize);
          const sigIdx = idx(blobIdxSize);
          const nm = readString(nmIdx);
          if (nm === null) throw new Error(name + ': Field row ' + (i + 1) + ' name index is outside the #Strings heap');
          const sig = readBlob(sigIdx);
          if (sig === null) throw new Error(name + ': Field row ' + (i + 1) + ' signature index ' + sigIdx + ' is outside the #Blob heap');
          fieldFlags.push(flags);
          fieldNames.push(nm);
          fieldSigs.push(sig);
        }
        break;
      case 0x05: skip(sizes['MethodPtr']! * n); break;
      case 0x06: skip(sizes['MethodDef']! * n); break;
      case 0x07: skip(sizes['ParamPtr']! * n); break;
      case 0x08: skip(sizes['Param']! * n); break;
      case 0x09: skip(sizes['InterfaceImpl']! * n); break;
      case T_MEMBERREF:
        for (let i = 0; i < n; i++) {
          const parent = idx(memberRefParent);
          const refName = readString(idx(stringIdxSize));
          skip(blobIdxSize);
          const tag = parent & 7;
          const row = parent >>> 3;
          // Only the cases an attribute constructor can arrive through need a name; anything else is recorded as
          // unresolved rather than guessed at.
          let owner = '';
          if (tag === 0) owner = typeDefs[row - 1]?.name ?? '';
          else if (tag === 1) owner = typeRefs[row - 1] ? (typeRefs[row - 1]!.ns ? typeRefs[row - 1]!.ns + '.' + typeRefs[row - 1]!.name : typeRefs[row - 1]!.name) : '';
          memberRefClass.push(owner || 'unresolved#' + row);
          void refName;
        }
        break;
      case T_CONSTANT:
        for (let i = 0; i < n; i++) {
          u8();                               // element type
          u8();                               // padding
          const parent = idx(hasConstant);
          const valIdx = idx(blobIdxSize);
          const value = readBlob(valIdx);
          if (value === null) throw new Error(name + ': Constant row ' + (i + 1) + ' value index is outside the #Blob heap');
          let v = 0;
          if (value.length === 4) v = value.readInt32LE(0);
          else if (value.length === 2) v = value.readInt16LE(0);
          else if (value.length === 1) v = value.readUInt8(0);
          else if (value.length === 8) v = Number(value.readBigInt64LE(0));
          // HasConstant: 2 tag bits; tag 0 is Field, and the rest is a 1-based row index
          if ((parent & 3) === 0) constantByFieldRow.set(parent >>> 2, v);
        }
        break;
      case T_CUSTOMATTRIBUTE:
        // A custom attribute on a field is how [SerializeField] reaches a private field: the metadata flag alone
        // cannot tell such a field from one Unity never writes, which is why the asset decoder needs this table.
        for (let i = 0; i < n; i++) {
          const parent = idx(coded(CODED.HasCustomAttribute));
          const type = idx(coded(CODED.CustomAttributeType));
          skip(blobIdxSize);
          if ((parent & 0x1f) !== 1) continue;            // HasCustomAttribute tag 1 is Field
          const fieldRow = parent >>> 5;
          if (fieldRow === 0) continue;
          const tag = type & 7;
          const row = type >>> 3;
          const name = tag === 3 ? (memberRefClass[row - 1] ?? 'MemberRef#' + row) : 'MethodDef#' + row;
          const list = attributesByFieldRow.get(fieldRow) ?? [];
          list.push(name);
          attributesByFieldRow.set(fieldRow, list);
        }
        break;
    }
  }

  // ---- structural validation -------------------------------------------
  //
  // These are invariants the specification guarantees, so a failure means the table layout is wrong. They are
  // what replaces the round-12 plausibility score, which could not tell a correct read from a one-row shift.
  const problems: string[] = [];
  if (!typeDefs.length) problems.push('no TypeDef rows were decoded');
  else if (typeDefs[0]!.name !== '<Module>') {
    problems.push('TypeDef row 1 is ' + JSON.stringify(typeDefs[0]!.name) + ', not <Module>');
  }
  const badTypeName = typeDefs.find((t) => !isIdent(t.name));
  if (badTypeName) problems.push('TypeDef row ' + (badTypeName.index + 1) + ' has a non-identifier name ' + JSON.stringify(badTypeName.name));
  const badFieldName = fieldNames.findIndex((n) => !isIdent(n));
  if (badFieldName >= 0) problems.push('Field row ' + (badFieldName + 1) + ' has a non-identifier name ' + JSON.stringify(fieldNames[badFieldName]));
  let prev = 0;
  for (let i = 0; i < fieldStarts.length; i++) {
    const f = fieldStarts[i]!;
    if (f < 1 || f > rows[T_FIELD]! + 1) { problems.push('TypeDef row ' + (i + 1) + ' FieldList ' + f + ' is outside the Field table (1..' + (rows[T_FIELD]! + 1) + ')'); break; }
    if (f < prev) { problems.push('TypeDef row ' + (i + 1) + ' FieldList ' + f + ' goes backwards from ' + prev); break; }
    prev = f;
  }
  const badSig = fieldSigs.findIndex((s) => s.length === 0 || s[0] !== 0x06);
  if (badSig >= 0) problems.push('Field row ' + (badSig + 1) + ' signature does not start with the FIELD element type 0x06');
  if (problems.length) {
    throw new Error(name + ': metadata failed structural validation - ' + problems.slice(0, 3).join('; ') +
      ' (rows: TypeDef=' + rows[T_TYPEDEF] + ' Field=' + rows[T_FIELD] + ' stringIdxSize=' + stringIdxSize + ')');
  }

  // ---- attach fields to their type --------------------------------------
  //
  // FieldList is a 1-based index into the Field table and is sorted, so a type owns the half-open range
  // [FieldList[i], FieldList[i+1]) and the last type owns everything to the end of the table.
  for (let i = 0; i < typeDefs.length; i++) {
    const start = fieldStarts[i]!;
    const end = i + 1 < typeDefs.length ? fieldStarts[i + 1]! : fieldNames.length + 1;
    for (let f = start; f < end; f++) {
      const fi = f - 1;
      if (fi < 0 || fi >= fieldNames.length) continue;
      const field: DotNetField = { name: fieldNames[fi]!, flags: fieldFlags[fi]!, signature: fieldSigs[fi]! };
      const c = constantByFieldRow.get(fi + 1);
      if (c !== undefined) field.constant = c;
      const attrs = attributesByFieldRow.get(fi + 1);
      if (attrs && attrs.length) field.attributes = attrs;
      typeDefs[i]!.fields.push(field);
    }
  }

  // ---- resolve base types + build the name index ------------------------
  const byName = new Map<string, DotNetType>();
  for (const td of typeDefs) if (!byName.has(td.name)) byName.set(td.name, td);
  for (const td of typeDefs) {
    const raw = td.extendsRaw;
    if (!raw) continue;
    const tag = raw & 3;
    const rowIndex = raw >>> 2;
    if (rowIndex === 0) continue;
    if (tag === 0) td.baseType = typeDefs[rowIndex - 1]?.name ?? null;
    else if (tag === 1) td.baseType = typeRefs[rowIndex - 1]?.name ?? null;
  }

  return {
    file: path, runtimeVersion, typeCount: typeDefs.length, fieldCount: fieldNames.length,
    types: typeDefs, byName,
    typeRefs: typeRefs.map((r) => ({ name: r.name, namespace: r.ns })),
    tables: tableInfo, warnings: [],
  };
}

/**
 * Field signature blob: 0x06 (FIELD), then the element type, then type-specific data.
 * Only value types and simple references are decoded here; anything else is reported by name.
 */
const ELEMENT_KIND: Record<number, string> = {
  0x01: 'void', 0x02: 'bool', 0x03: 'char', 0x04: 'i1', 0x05: 'u1', 0x06: 'i2', 0x07: 'u2',
  0x08: 'int', 0x09: 'uint', 0x0a: 'i8', 0x0b: 'u8', 0x0c: 'float', 0x0d: 'double',
  0x0e: 'string', 0x0f: 'ptr', 0x10: 'byref', 0x13: 'var', 0x16: 'typedbyref',
  0x18: 'nativeint', 0x19: 'unativeint', 0x1b: 'fnptr', 0x1c: 'object', 0x1e: 'mvar',
};

/** Decode a type from a signature blob at `at`. Arrays recurse: 642 fields in the corpus are arrays. */
function decodeType(sig: Buffer, at: number): { kind: string; name?: string } {
  const T = sig[at];
  if (T === undefined) return { kind: 'unknown' };
  const simple = ELEMENT_KIND[T];
  if (simple) return { kind: simple };
  // ELEMENT_TYPE_VALUETYPE 0x11 / ELEMENT_TYPE_CLASS 0x12, then a TypeDefOrRef compressed index
  if (T === 0x11 || T === 0x12) {
    const b0 = sig[at + 1];
    if (b0 === undefined) return { kind: T === 0x11 ? 'valuetype' : 'class' };
    let v: number;
    if ((b0 & 0x80) === 0) v = b0;
    else if ((b0 & 0xc0) === 0x80) v = ((b0 & 0x3f) << 8) | (sig[at + 2] ?? 0);
    else v = ((b0 & 0x1f) << 24) | ((sig[at + 2] ?? 0) << 16) | ((sig[at + 3] ?? 0) << 8) | (sig[at + 4] ?? 0);
    return { kind: T === 0x11 ? 'valuetype' : 'class', name: '#' + v };
  }
  // SZARRAY 0x1d has just an element type; ARRAY 0x14 continues with rank and bounds, which this reader
  // does not interpret - the element type is what a field-layout consumer needs.
  if (T === 0x1d || T === 0x14) {
    const inner = decodeType(sig, at + 1);
    return { kind: T === 0x1d ? 'array' : 'multidimarray', name: inner.name ?? inner.kind };
  }
  if (T === 0x15) return { kind: 'generic' };
  return { kind: 'elem0x' + T.toString(16) };
}

export function decodeFieldSignature(sig: Buffer): { kind: string; name?: string } {
  if (sig.length < 2 || sig[0] !== 0x06) return { kind: 'unknown' };
  return decodeType(sig, 1);
}

/**
 * The declared type of a field, as a name a reader can use.
 *
 * `decodeFieldSignature` reports `class`/`valuetype` with the raw TypeDefOrRef coded index, which is accurate and
 * useless on a page. This resolves that index against the assembly: tag 0 is a TypeDef row, tag 1 a TypeRef row,
 * and tag 2 a TypeSpec (a generic instantiation, reported as such rather than guessed). Arrays recurse.
 */
export function fieldTypeName(assembly: DotNetAssembly, sig: Buffer): string {
  const d = decodeFieldSignature(sig);
  if (d.kind === 'array' || d.kind === 'multidimarray') {
    const inner = d.name === undefined ? 'unknown' : resolveCodedName(assembly, d.name);
    return (d.kind === 'array' ? '' : '[,] ') + inner + '[]';
  }
  if ((d.kind === 'class' || d.kind === 'valuetype') && d.name) return resolveCodedName(assembly, d.name);
  return d.kind;
}

/** Resolve the '#<coded index>' that decodeType emits, or describe why it could not be resolved. */
function resolveCodedName(assembly: DotNetAssembly, coded: string): string {
  if (coded.charAt(0) !== '#') return coded;
  const v = Number(coded.slice(1));
  if (!Number.isFinite(v)) return coded;
  const tag = v & 3;
  const row = v >>> 2;
  if (row === 0) return 'unknown';
  if (tag === 0) return assembly.types[row - 1]?.name ?? 'TypeDef#' + row;
  if (tag === 1) return assembly.typeRefs[row - 1]?.name ?? 'TypeRef#' + row;
  return 'TypeSpec#' + row;
}

/**
 * The class a MonoBehaviour class name refers to, or null when the name is absent, ambiguous, or not a
 * MonoBehaviour.
 *
 * Prefab bundles name the class on their MonoScript objects and nothing else, so the only way to know what a name
 * means is the assembly. Ambiguity is refused rather than resolved: two namespaces can declare the same class name,
 * and picking one would attach the wrong field list to a page.
 */
export function monoBehaviourClass(assembly: DotNetAssembly, name: string): DotNetType | null {
  // The payload dumper records the MonoScript class name, which is the SIMPLE name, while types here carry their
  // full name. The refusal probe showed every classNotFound payload (repo 377/377, tcg 2909/2909) has its simple
  // name in the merged table, so fall back to a simple-name match - and still refuse when more than one type
  // matches, so an ambiguous name is never guessed.
  // Search the MERGED table (byName), not assembly.types: the engine/package merge fills byName while
  // assembly.types still holds only Assembly-CSharp, which is why class lookup failed even after merging.
  const pool = [...new Set(assembly.byName.values())];
  const exact = pool.filter((t) => t.name === name);
  const candidates = exact.length ? exact : pool.filter((t) => (t.name.split('.').pop() ?? t.name) === name);
  if (!candidates.length) return null;
  const mono = candidates.filter((t) => reachesMonoBehaviour(assembly, t));
  if (mono.length !== 1) return null;
  return mono[0]!;
}

/**
 * The members of an enum type, as name -> value, or null when the name is not an enum here.
 *
 * An enum is recognised the way the metadata defines one: it derives from `System.Enum` and its first field is
 * `value__`, which is what the runtime stores. Members are the remaining fields that carry a compile-time constant -
 * a member without one is a declaration this reader cannot claim a value for, so it is left out rather than
 * defaulted to zero. If two types share the name, the enum is used when exactly one of them is one.
 */
export function enumMembers(assembly: DotNetAssembly, name: string): Map<string, number> | null {
  const candidates = assembly.types.filter((t) => t.name === name);
  if (!candidates.length) return null;
  const enums = candidates.filter((t) => t.baseType === 'Enum' && t.fields.some((f) => f.name === 'value__'));
  if (enums.length !== 1) return null;
  const members = new Map<string, number>();
  for (const field of enums[0]!.fields) {
    if (field.name === 'value__' || field.constant === undefined) continue;
    members.set(field.name, field.constant);
  }
  return members;
}

// FieldAttributes bits this reader needs (ECMA-335 II.23.1.5).
const FIELD_ACCESS_MASK = 0x0007, FIELD_PUBLIC = 0x0006, FIELD_STATIC = 0x0010, FIELD_LITERAL = 0x0040, FIELD_NOT_SERIALIZED = 0x0080;

/**
 * Unity's rule for whether a field is written into the asset, from the metadata alone.
 *
 * Public fields are written unless marked [NonSerialized]; private and internal fields are written only when
 * [SerializeField] is present, and that attribute is *not* a metadata flag - it lives in the CustomAttribute table,
 * which is why this reader decodes that table at all. Static and const fields are never written.
 */
export function isUnitySerializedField(field: DotNetField): boolean {
  if ((field.flags & FIELD_STATIC) !== 0 || (field.flags & FIELD_LITERAL) !== 0) return false;
  if ((field.flags & FIELD_NOT_SERIALIZED) !== 0) return false;
  if ((field.flags & FIELD_ACCESS_MASK) === FIELD_PUBLIC) return true;
  return (field.attributes ?? []).some((a) => a === 'SerializeField' || a.endsWith('.SerializeField'));
}

/**
 * The fields Unity writes for an instance of this class, in the order it writes them: every base class's fields
 * first, then the class's own, in declaration order within each.
 *
 * The chain stops where the assembly's own types stop. `MonoBehaviour`, `Behaviour`, `Component` and `Object` live
 * in UnityEngine and their state (m_GameObject, m_Enabled, m_Script, m_Name) is written by Unity's own object header
 * rather than by this class's field list, so including them here would misalign every value after them.
 */
export function unitySerializedFields(assembly: DotNetAssembly, type: DotNetType): DotNetField[] {
  const chain: DotNetType[] = [];
  const seen = new Set<string>();
  let cur: DotNetType | undefined = type;
  const stop = new Set(['MonoBehaviour', 'ScriptableObject', 'Object', 'Behaviour', 'Component']);
  while (cur && !seen.has(cur.name)) {
    seen.add(cur.name);
    chain.unshift(cur);
    const base = cur.baseType;
    if (!base || stop.has(base)) break;
    cur = assembly.byName.get(base);
  }
  const out: DotNetField[] = [];
  for (const t of chain) for (const field of t.fields) if (isUnitySerializedField(field)) out.push(field);
  return out;
}

/** True when the class's base chain reaches MonoBehaviour within this assembly. */
export function reachesMonoBehaviour(assembly: DotNetAssembly, type: DotNetType): boolean {
  const seen = new Set<string>();
  let cur: DotNetType | undefined = type;
  while (cur && !seen.has(cur.name)) {
    seen.add(cur.name);
    const base = cur.baseType;
    if (!base) return false;
    if (base === 'MonoBehaviour') return true;
    if (base === 'ScriptableObject' || base === 'Object' || base === 'Enum' || base === 'ValueType') return false;
    cur = assembly.byName.get(base);
  }
  return false;
}
