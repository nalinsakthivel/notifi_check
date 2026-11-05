// Bounded subset of Android ResourceTypes.h binary XML. Resource references
// stay unresolved: this parser does not have resources.arsc resolution.
export interface AxmlAttribute {
  name: string;
  namespace: string | null;
  value: string | null;
}
export interface AxmlElement {
  namespace: string | null;
  name: string;
  attributes: AxmlAttribute[];
  children: AxmlElement[];
}
const bad = (): never => {
  throw new Error(
    "Malformed or unsupported Android binary XML (AXML). Rebuild the APK with standard Android tooling.",
  );
};
export function parseAxml(buf: Uint8Array): AxmlElement {
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const range = (p: number, n: number, end = buf.length) => {
    if (p < 0 || n < 0 || p + n > end) bad();
  };
  const u16 = (p: number) => {
    range(p, 2);
    return v.getUint16(p, true);
  };
  const u32 = (p: number) => {
    range(p, 4);
    return v.getUint32(p, true);
  };
  if (buf.length < 8 || u16(0) !== 3 || u16(2) !== 8 || u32(4) !== buf.length)
    bad();
  let strings: string[] | null = null,
    root: AxmlElement | null = null,
    nodes = 0,
    returnedText = 0;
  const stack: AxmlElement[] = [];
  const str = (i: number): string => {
    if (!strings || i >= strings.length) bad();
    return strings![i];
  };
  for (let pos = 8; pos < buf.length; ) {
    range(pos, 8);
    const type = u16(pos),
      header = u16(pos + 2),
      size = u32(pos + 4),
      end = pos + size;
    if (header < 8 || size < header) bad();
    range(pos, size);
    if (type === 1) {
      if (strings || header < 28) bad();
      const count = u32(pos + 8),
        styles = u32(pos + 12),
        flags = u32(pos + 16),
        start = u32(pos + 20),
        styleStart = u32(pos + 24);
      if (
        count > 50000 ||
        styles > 50000 ||
        header + 4 * (count + styles) > start ||
        start > size ||
        (styleStart !== 0 && (styleStart < start || styleStart > size))
      )
        bad();
      const stringEnd = styleStart ? pos + styleStart : end;
      let textBytes = 0;
      strings = [];
      for (let i = 0; i < count; i++) {
        let p = pos + start + u32(pos + header + i * 4);
        range(p, 1, stringEnd);
        const len8 = () => {
          range(p, 1, stringEnd);
          let n = buf[p++];
          if (n & 128) {
            range(p, 1, stringEnd);
            n = ((n & 127) << 8) | buf[p++];
          }
          return n;
        };
        const len16 = () => {
          range(p, 2, stringEnd);
          let n = u16(p);
          p += 2;
          if (n & 32768) {
            range(p, 2, stringEnd);
            n = (n & 32767) * 65536 + u16(p);
            p += 2;
          }
          return n;
        };
        let text: string;
        if (flags & 256) {
          const chars = len8(),
            n = len8();
          range(p, n + 1, stringEnd);
          if (buf[p + n] !== 0) bad();
          try {
            text = new TextDecoder("utf-8", { fatal: true }).decode(
              buf.subarray(p, p + n),
            );
          } catch {
            bad();
          }
          if (text!.length !== chars) bad();
          textBytes += n;
        } else {
          const n = len16();
          if (n > 8192) bad();
          range(p, n * 2 + 2, stringEnd);
          if (u16(p + n * 2) !== 0) bad();
          text = new TextDecoder("utf-16le", { fatal: true }).decode(
            buf.subarray(p, p + n * 2),
          );
          textBytes += n * 2;
        }
        if (text!.length > 8192 || textBytes > 2 * 1024 ** 2) bad();
        strings.push(text!);
      }
    } else if (type === 0x102) {
      if (
        header !== 16 ||
        size < 36 ||
        !strings ||
        ++nodes > 10000 ||
        stack.length >= 128
      )
        bad();
      const elementNs = u32(pos + 16);
      const namespace = elementNs === 0xffffffff ? null : str(elementNs);
      const name = str(u32(pos + 20)),
        attrStart = u16(pos + 24),
        attrSize = u16(pos + 26),
        count = u16(pos + 28);
      if (
        attrStart < 20 ||
        attrSize < 20 ||
        count > 256 ||
        16 + attrStart + count * attrSize > size
      )
        bad();
      const attributes: AxmlAttribute[] = [];
      const seen = new Set<string>();
      for (let i = 0; i < count; i++) {
        const p = pos + 16 + attrStart + i * attrSize,
          ns = u32(p),
          name = str(u32(p + 4)),
          raw = u32(p + 8),
          kind = buf[p + 15],
          data = u32(p + 16);
        if (u16(p + 12) !== 8) bad();
        const namespace = ns === 0xffffffff ? null : str(ns);
        const key = `${namespace}:${name}`;
        if (seen.has(key)) bad();
        seen.add(key);
        let value: string | null = null;
        if (kind === 3)
          value = str(data); // typed string index is authoritative, raw may be absent
        else if (kind === 0x10) value = String(data);
        else if (kind === 0x11) value = `0x${data.toString(16)}`;
        else if (kind === 0x12) value = data ? "true" : "false";
        // TYPE_REFERENCE/ATTRIBUTE/FLOAT/etc remain unknown even with raw text.
        if (raw !== 0xffffffff) str(raw); // still validate the raw reference
        returnedText += name.length + (value?.length ?? 0);
        if (returnedText > 2 * 1024 ** 2) bad();
        attributes.push({ name, namespace, value });
      }
      const el = { namespace, name, attributes, children: [] };
      if (stack.length) stack[stack.length - 1].children.push(el);
      else {
        if (root) bad();
        root = el;
      }
      stack.push(el);
    } else if (type === 0x103) {
      if (
        header !== 16 ||
        size !== 24 ||
        !stack.length ||
        str(u32(pos + 20)) !== stack[stack.length - 1].name ||
        (u32(pos + 16) === 0xffffffff ? null : str(u32(pos + 16))) !==
          stack[stack.length - 1].namespace
      )
        bad();
      stack.pop();
    } else if (type === 0x100 || type === 0x101) {
      if (header !== 16 || size !== 24) bad();
      const prefix = u32(pos + 16);
      if (prefix !== 0xffffffff) str(prefix);
      str(u32(pos + 20));
    } else if (type === 0x180) {
      if (header !== 8 || (size - 8) % 4) bad();
    } else if (type !== 0x104) bad();
    pos = end;
  }
  if (
    !root ||
    stack.length ||
    root.name !== "manifest" ||
    root.namespace !== null
  )
    bad();
  return root!;
}
export function findChildren(el: AxmlElement, name: string): AxmlElement[] {
  return el.children.filter((c) => c.name === name && c.namespace === null);
}
const ANDROID = "http://schemas.android.com/apk/res/android";
export function attr(el: AxmlElement, name: string): string | undefined {
  const namespace = name === "package" ? null : ANDROID;
  return (
    el.attributes.find((a) => a.name === name && a.namespace === namespace)
      ?.value ?? undefined
  );
}
