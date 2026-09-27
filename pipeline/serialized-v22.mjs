/* (plain block comment, not JSDoc: the offsets below are written as @24, and TypeScript parses @ inside a JSDoc
 * block as a tag, which fails the typecheck with "Identifier expected")
 *
 * Unity 6 (SerializedFile v22) header reader — the first implemented piece of the v22 container path.
 *
 * Every field here was measured, not assumed: the file length is known, so the u64 (big-endian) in the header that
 * equals it IS the fileSize field, and metadataSize/dataOffset sit at fixed relative slots. Measured over 8 files in
 * three different games (see reports/v22-header.md): the fileSize slot is @24 in 8/8, and dataOffset - metadataSize
 * is 53..62 bytes, i.e. header plus padding, in 8/8.
 *
 * The reference parser reads the Unity 2019.4 (v21) header as four u32s at 0/4/8/12 and refuses these files by its
 * own self-check. Nothing is guessed here: a header that does not satisfy the measured relations is rejected, so the
 * caller knows it is reading a file this reader does not understand.
 */

/** Read the measured v22 header fields, or null when the buffer is too short to hold one. */
export function readHeaderV22(buf) {
  if (!buf || buf.length < 40) return null;
  return {
    version: buf.readUInt32BE(8),
    metadataSize: Number(buf.readBigUInt64BE(16)),
    fileSize: Number(buf.readBigUInt64BE(24)),
    dataOffset: Number(buf.readBigUInt64BE(32)),
  };
}

/**
 * True when a header satisfies every relation the measurements established. `actualSize` is the file's real length,
 * which is what makes the fileSize slot identifiable in the first place.
 */
export function headerIsValid(header, actualSize) {
  if (!header) return false;
  if (header.version < 21 || header.version > 30) return false;
  if (!Number.isInteger(header.fileSize) || header.fileSize !== actualSize) return false;
  if (!(header.metadataSize > 0)) return false;
  const gap = header.dataOffset - header.metadataSize;
  if (!(gap >= 40 && gap <= 128)) return false;   // header + padding, measured 53..62 in 8/8 files
  if (header.dataOffset >= header.fileSize) return false;
  return true;
}

/** One call for the common case: read the header and say whether it is one this reader understands. */
export function headerOf(buf, actualSize = buf.length) {
  const header = readHeaderV22(buf);
  return headerIsValid(header, actualSize) ? header : null;
}
