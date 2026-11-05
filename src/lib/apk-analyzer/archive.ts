import { Inflate } from "fflate";
import { analysisLimits, type AnalysisLimits } from "./limits.ts";
export interface ArchiveEntry {
  path: string;
  compressedSize: number;
  uncompressedSize: number;
  offset: number;
  method: number;
  flags: number;
  crc: number;
}
const invalid = (detail: string): never => {
  throw new Error(
    `Invalid or unsupported ZIP archive: ${detail}. Export a standard APK/AAB and try again.`,
  );
};
export async function readSlice(
  file: Blob,
  start: number,
  size: number,
): Promise<Uint8Array> {
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(size) ||
    start < 0 ||
    size < 0 ||
    start + size > file.size
  )
    invalid("entry outside archive");
  return new Uint8Array(await file.slice(start, start + size).arrayBuffer());
}
const view = (b: Uint8Array) =>
  new DataView(b.buffer, b.byteOffset, b.byteLength);
const crcTable = Uint32Array.from({ length: 256 }, (_, i) => {
  let c = i;
  for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  return c >>> 0;
});
export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const b of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ b) & 255];
  return (crc ^ 0xffffffff) >>> 0;
}

export async function readArchive(
  file: Blob,
  overrides: Partial<AnalysisLimits> = {},
) {
  const limits = analysisLimits(overrides);
  if (file.size > limits.maxFileBytes)
    throw new Error(
      `File is too large. The analysis limit is ${limits.maxFileBytes / 1024 ** 2} MiB.`,
    );
  if (file.size < 22) invalid("missing ZIP end record");
  const tail = await readSlice(
    file,
    Math.max(0, file.size - 65557),
    Math.min(file.size, 65557),
  );
  const tv = view(tail);
  let end = -1;
  for (let i = tail.length - 22; i >= 0; i--)
    if (
      tv.getUint32(i, true) === 0x06054b50 &&
      i + 22 + tv.getUint16(i + 20, true) === tail.length
    ) {
      end = i;
      break;
    }
  if (end < 0) invalid("missing ZIP end record");
  const count = tv.getUint16(end + 10, true),
    directorySize = tv.getUint32(end + 12, true),
    directoryOffset = tv.getUint32(end + 16, true);
  if (
    tv.getUint16(end + 4, true) !== 0 ||
    tv.getUint16(end + 6, true) !== 0 ||
    tv.getUint16(end + 8, true) !== count
  )
    invalid("multidisk ZIP is not supported");
  if (
    count === 65535 ||
    directorySize === 0xffffffff ||
    directoryOffset === 0xffffffff
  )
    invalid("ZIP64 is not supported");
  if (count > limits.maxEntries || directorySize > limits.maxDirectoryBytes)
    throw new Error(
      "Archive metadata exceeds the analysis entry/directory limit.",
    );
  if (directoryOffset + directorySize !== file.size - tail.length + end)
    invalid("central directory bounds");
  const directory = await readSlice(file, directoryOffset, directorySize),
    dv = view(directory);
  const entries: ArchiveEntry[] = [];
  const names = new Set<string>();
  let pos = 0,
    total = 0;
  const decoder = new TextDecoder("utf-8", { fatal: true });
  for (let i = 0; i < count; i++) {
    if (pos + 46 > directory.length || dv.getUint32(pos, true) !== 0x02014b50)
      invalid("central directory entry");
    const flags = dv.getUint16(pos + 8, true),
      method = dv.getUint16(pos + 10, true),
      crc = dv.getUint32(pos + 16, true),
      compressedSize = dv.getUint32(pos + 20, true),
      uncompressedSize = dv.getUint32(pos + 24, true);
    const n = dv.getUint16(pos + 28, true),
      extra = dv.getUint16(pos + 30, true),
      comment = dv.getUint16(pos + 32, true),
      offset = dv.getUint32(pos + 42, true);
    if (!n || n > 4096 || pos + 46 + n + extra + comment > directory.length)
      invalid("entry name or length");
    if (flags & (1 | 32 | 64 | 8192) || (method !== 0 && method !== 8))
      invalid("encrypted entries or compression method");
    if (
      dv.getUint16(pos + 34, true) !== 0 ||
      offset === 0xffffffff ||
      compressedSize === 0xffffffff ||
      uncompressedSize === 0xffffffff
    )
      invalid("ZIP64 or multidisk entry");
    let path: string;
    try {
      path = decoder.decode(directory.subarray(pos + 46, pos + 46 + n));
    } catch {
      invalid("unsupported entry name encoding");
    }
    if (path!.includes("\0") || names.has(path!))
      invalid("duplicate or invalid entry path");
    names.add(path!);
    // Enforce expansion limits even on entries that will never be extracted.
    if (
      uncompressedSize > limits.maxTotalBytes ||
      (total += uncompressedSize) > limits.maxTotalBytes
    )
      throw new Error("Archive total size exceeds the analysis limit.");
    if (uncompressedSize > Math.max(1, compressedSize) * limits.maxRatio)
      throw new Error("Archive expansion ratio exceeds the safety limit.");
    if (
      (path! === "AndroidManifest.xml" ||
        /^META-INF\/[^/]+\.(RSA|DSA|EC)$/i.test(path!)) &&
      (uncompressedSize > limits.maxEntryBytes ||
        compressedSize > limits.maxEntryBytes)
    )
      throw new Error(
        "Manifest or certificate entry is too large for the extraction limit.",
      );
    if (offset + 30 + n + compressedSize > directoryOffset)
      invalid("entry overlaps central directory");
    entries.push({
      path: path!,
      compressedSize,
      uncompressedSize,
      offset,
      method,
      flags,
      crc,
    });
    pos += 46 + n + extra + comment;
  }
  if (pos !== directory.length) invalid("unexpected central directory data");
  const ordered = [...entries].sort((a, b) => a.offset - b.offset);
  for (let i = 1; i < ordered.length; i++)
    if (
      ordered[i - 1].offset +
        30 +
        new TextEncoder().encode(ordered[i - 1].path).length +
        ordered[i - 1].compressedSize >
      ordered[i].offset
    )
      invalid("overlapping entries");
  let extracted = 0;
  async function readEntry(entry: ArchiveEntry): Promise<Uint8Array> {
    if (!entries.includes(entry)) invalid("unknown entry");
    if (
      entry.uncompressedSize > limits.maxEntryBytes ||
      entry.compressedSize > limits.maxEntryBytes ||
      extracted + entry.uncompressedSize > limits.maxExtractedBytes
    )
      throw new Error("Extracted entry/total size exceeds the safety limit.");
    extracted += entry.uncompressedSize;
    const header = await readSlice(file, entry.offset, 30),
      hv = view(header);
    if (
      hv.getUint32(0, true) !== 0x04034b50 ||
      hv.getUint16(6, true) !== entry.flags ||
      hv.getUint16(8, true) !== entry.method
    )
      invalid("inconsistent local header");
    if (
      !(entry.flags & 8) &&
      (hv.getUint32(14, true) !== entry.crc ||
        hv.getUint32(18, true) !== entry.compressedSize ||
        hv.getUint32(22, true) !== entry.uncompressedSize)
    )
      invalid("inconsistent local sizes or CRC");
    const nameSize = hv.getUint16(26, true),
      extraSize = hv.getUint16(28, true);
    if (nameSize > 4096) invalid("local entry name");
    const localName = await readSlice(file, entry.offset + 30, nameSize);
    if (decoder.decode(localName) !== entry.path)
      invalid("inconsistent local name");
    const start = entry.offset + 30 + nameSize + extraSize;
    const next =
      ordered.find((e) => e.offset > entry.offset)?.offset ?? directoryOffset;
    if (start + entry.compressedSize > next) invalid("overlapping entry data");
    const output = new Uint8Array(entry.uncompressedSize);
    let written = 0;
    if (entry.method === 0) {
      if (entry.compressedSize !== entry.uncompressedSize)
        invalid("stored entry size");
      output.set(await readSlice(file, start, entry.compressedSize));
      written = output.length;
    } else {
      // fflate keeps a 32 KiB history window. 1 KiB input bounds temporary
      // DEFLATE expansion (~1 MiB) before ondata, even when headers lie.
      const inflater = new Inflate((chunk) => {
        if (written + chunk.length > output.length)
          throw new Error("Decompressed size exceeds the declared entry size.");
        output.set(chunk, written);
        written += chunk.length;
      });
      try {
        for (let p = 0; p < entry.compressedSize; p += 1024) {
          const size = Math.min(1024, entry.compressedSize - p);
          inflater.push(
            await readSlice(file, start + p, size),
            p + size === entry.compressedSize,
          );
        }
        if (entry.compressedSize === 0) invalid("empty deflate stream");
      } catch {
        throw new Error(
          "Could not decompress entry: malformed data or size limit exceeded.",
        );
      }
    }
    if (written !== output.length) invalid("decompressed size mismatch");
    if (crc32(output) !== entry.crc) invalid("entry CRC mismatch");
    return output;
  }
  return { entries, directoryOffset, limits, readEntry };
}
