// Minimal parser for Android Binary XML (AXML) — the format APKs use for
// AndroidManifest.xml at the ZIP root. This is a chunk-based binary format,
// NOT plain XML and NOT protobuf. Reference: chunk headers documented across
// AOSP's ResourceTypes.h and many third-party writeups; the chunk types and
// struct layouts below are the stable, well-documented subset needed to pull
// manifest-level facts out (no intent-filter / resource-value resolution).
//
// Chunk types:
//   0x0001 = RES_STRING_POOL_TYPE
//   0x0180 = RES_XML_RESOURCE_MAP_TYPE
//   0x0100 = RES_XML_START_NAMESPACE_TYPE
//   0x0101 = RES_XML_END_NAMESPACE_TYPE
//   0x0102 = RES_XML_START_ELEMENT_TYPE
//   0x0103 = RES_XML_END_ELEMENT_TYPE
//   0x0104 = RES_XML_CDATA_TYPE
//   0x0003 = RES_XML_TYPE (top-level document chunk)

export interface AxmlAttribute {
  name: string;
  /** Resolved best-effort string/number/boolean value */
  value: string;
}

export interface AxmlElement {
  name: string;
  attributes: AxmlAttribute[];
  children: AxmlElement[];
}

const CHUNK_STRING_POOL = 0x0001;
const CHUNK_START_NAMESPACE = 0x0100;
const CHUNK_END_NAMESPACE = 0x0101;
const CHUNK_START_ELEMENT = 0x0102;
const CHUNK_END_ELEMENT = 0x0103;

// Value types used in the "typed value" struct (Res_value.dataType) — subset
// we bother resolving to a display string.
const TYPE_STRING = 0x03;
const TYPE_INT_DEC = 0x10;
const TYPE_INT_HEX = 0x11;
const TYPE_INT_BOOLEAN = 0x12;

class ByteReader {
  view: DataView;
  offset = 0;
  constructor(buf: Uint8Array) {
    this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  u8() {
    return this.view.getUint8(this.offset++);
  }
  u16() {
    const v = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return v;
  }
  u32() {
    const v = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return v;
  }
  i32() {
    const v = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return v;
  }
}

function readStringPool(r: ByteReader, chunkStart: number, chunkSize: number): string[] {
  // Header (after the 8-byte generic chunk header already consumed): stringCount,
  // styleCount, flags, stringsStart, stylesStart — all u32.
  const stringCount = r.u32();
  const styleCount = r.u32();
  const flags = r.u32();
  const stringsStart = r.u32();
  r.u32(); // stylesStart, unused

  const isUtf8 = (flags & (1 << 8)) !== 0;
  const offsets: number[] = [];
  for (let i = 0; i < stringCount; i++) offsets.push(r.u32());
  for (let i = 0; i < styleCount; i++) r.u32(); // skip style offsets, unused

  const dataBase = chunkStart + stringsStart;
  const strings: string[] = [];
  for (let i = 0; i < stringCount; i++) {
    const strOffset = dataBase + offsets[i];
    if (strOffset < 0 || strOffset >= r.view.byteLength) {
      strings.push("");
      continue;
    }
    strings.push(isUtf8 ? readUtf8String(r.view, strOffset) : readUtf16String(r.view, strOffset));
  }
  // Position reader at end of this chunk regardless of how much of the string
  // data we actually walked, so the caller can resume at the next chunk.
  r.offset = chunkStart + chunkSize;
  return strings;
}

function readUtf16String(view: DataView, offset: number): string {
  // u16 length (or two u16s if high bit set for lengths > 0x7fff — rare in manifests).
  let len = view.getUint16(offset, true);
  let pos = offset + 2;
  if (len & 0x8000) {
    const lo = view.getUint16(pos, true);
    len = ((len & 0x7fff) << 16) | lo;
    pos += 2;
  }
  const chars: string[] = [];
  for (let i = 0; i < len; i++) {
    chars.push(String.fromCharCode(view.getUint16(pos, true)));
    pos += 2;
  }
  return chars.join("");
}

function readUtf8String(view: DataView, offset: number): string {
  // UTF-8 pool entries are prefixed with (char-length, byte-length), each
  // using the same 1-or-2-byte varint-ish encoding as UTF-16 lengths.
  let pos = offset;
  const readLen = () => {
    let len = view.getUint8(pos);
    pos += 1;
    if (len & 0x80) {
      const lo = view.getUint8(pos);
      pos += 1;
      len = ((len & 0x7f) << 8) | lo;
    }
    return len;
  };
  readLen(); // char length, unused (byte length below is authoritative for slicing)
  const byteLen = readLen();
  const bytes = new Uint8Array(view.buffer, view.byteOffset + pos, byteLen);
  return new TextDecoder("utf-8").decode(bytes);
}

function resolveValue(view: DataView, r: ByteReader, strings: string[]): string {
  // ResStringPool_ref rawValue (u32) followed by typed Res_value: size(u16),
  // res0(u8), dataType(u8), data(u32).
  const rawValue = r.u32();
  r.u16(); // size
  r.u8(); // res0
  const dataType = r.u8();
  const data = r.u32();
  switch (dataType) {
    case TYPE_STRING:
      return rawValue !== 0xffffffff && strings[rawValue] !== undefined ? strings[rawValue] : "";
    case TYPE_INT_BOOLEAN:
      return data !== 0 ? "true" : "false";
    case TYPE_INT_HEX:
      return `0x${data.toString(16)}`;
    case TYPE_INT_DEC:
    default:
      // Treat as signed int32 for things like versionCode/minSdkVersion.
      return String(new Int32Array([data])[0]);
  }
}

/**
 * Parses AXML bytes into a tree. Throws on structurally invalid input —
 * callers should wrap in try/catch and degrade gracefully.
 */
export function parseAxml(buf: Uint8Array): AxmlElement {
  const r = new ByteReader(buf);

  // Outer RES_XML_TYPE chunk header.
  r.u16(); // type (0x0003), unchecked — some tools omit/vary it
  r.u16(); // headerSize
  r.u32(); // total chunk size

  let strings: string[] = [];
  const root: AxmlElement = { name: "", attributes: [], children: [] };
  const stack: AxmlElement[] = [];
  let namespaces: Map<string, string> = new Map();

  while (r.offset + 8 <= buf.byteLength) {
    const chunkStart = r.offset;
    const type = r.u16();
    r.u16(); // headerSize
    const size = r.u32();
    if (size < 8 || chunkStart + size > buf.byteLength) break;

    if (type === CHUNK_STRING_POOL) {
      strings = readStringPool(r, chunkStart, size);
      continue;
    }

    if (type === CHUNK_START_NAMESPACE || type === CHUNK_END_NAMESPACE) {
      r.u32(); // lineNumber
      r.u32(); // comment
      const prefixIdx = r.u32();
      const uriIdx = r.u32();
      if (type === CHUNK_START_NAMESPACE) {
        namespaces = new Map(namespaces);
        namespaces.set(strings[uriIdx] ?? "", strings[prefixIdx] ?? "");
      }
      r.offset = chunkStart + size;
      continue;
    }

    if (type === CHUNK_START_ELEMENT) {
      r.u32(); // lineNumber
      r.u32(); // comment
      r.u32(); // namespaceUri (element's own namespace, unused)
      const nameIdx = r.u32();
      r.u16(); // attributeStart
      r.u16(); // attributeSize
      const attrCount = r.u16();
      r.u16(); // idIndex
      r.u16(); // classIndex
      r.u16(); // styleIndex

      const attributes: AxmlAttribute[] = [];
      for (let i = 0; i < attrCount; i++) {
        r.u32(); // attr namespace (unused — we don't disambiguate prefixes)
        const attrNameIdx = r.u32();
        // resolveValue consumes: rawValue(u32), size(u16), res0(u8), dataType(u8), data(u32)
        const value = resolveValue(r.view, r, strings);
        attributes.push({ name: strings[attrNameIdx] ?? `attr${i}`, value });
      }

      const el: AxmlElement = { name: strings[nameIdx] ?? "", attributes, children: [] };
      if (stack.length === 0) {
        root.name = el.name;
        root.attributes = el.attributes;
        stack.push(root);
      } else {
        stack[stack.length - 1].children.push(el);
        stack.push(el);
      }
      r.offset = chunkStart + size;
      continue;
    }

    if (type === CHUNK_END_ELEMENT) {
      if (stack.length > 1) stack.pop();
      r.offset = chunkStart + size;
      continue;
    }

    // Unhandled chunk type (CDATA, resource map, end document, …) — skip it.
    r.offset = chunkStart + size;
  }

  if (!root.name) throw new Error("Not a recognizable AndroidManifest.xml (AXML) structure.");
  return root;
}

export function findChildren(el: AxmlElement, name: string): AxmlElement[] {
  return el.children.filter((c) => c.name === name);
}

export function attr(el: AxmlElement, name: string): string | undefined {
  return el.attributes.find((a) => a.name === name)?.value;
}
