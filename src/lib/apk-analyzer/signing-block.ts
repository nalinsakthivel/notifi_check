import { readSlice } from "./archive.ts";
export type SigningScheme = "v1" | "v2" | "v3" | "v3.1";
export interface ModernSigning {
  schemes: SigningScheme[];
  certificates: Uint8Array[];
  inconclusive: boolean;
}
const magic = new TextEncoder().encode("APK Sig Block 42");
// All integer reads are bounded before allocating or descending.
export async function readSigningBlock(
  file: Blob,
  offset: number,
  maxBytes: number,
): Promise<ModernSigning> {
  const result: ModernSigning = {
    schemes: [],
    certificates: [],
    inconclusive: false,
  };
  if (offset < 24) return result;
  const footer = await readSlice(file, offset - 24, 24);
  if (!magic.every((b, i) => footer[8 + i] === b)) return result;
  try {
    const size = new DataView(footer.buffer).getBigUint64(0, true);
    if (
      size < BigInt(24) ||
      size > BigInt(maxBytes - 8) ||
      size + BigInt(8) > BigInt(offset)
    )
      throw Error();
    const block = await readSlice(
        file,
        offset - Number(size) - 8,
        Number(size) + 8,
      ),
      v = new DataView(block.buffer);
    if (v.getBigUint64(0, true) !== size) throw Error();
    let p = 8;
    const end = block.length - 24;
    const seen = new Set<number>();
    while (p < end) {
      if (p + 12 > end) throw Error();
      const len = v.getBigUint64(p, true);
      if (len < BigInt(4) || len > BigInt(end - p - 8)) throw Error();
      const id = v.getUint32(p + 8, true);
      if (seen.has(id)) throw Error();
      seen.add(id);
      const scheme: SigningScheme | undefined = (
        {
          [0x7109871a]: "v2",
          [0xf05368c0]: "v3",
          [0x1b93ad61]: "v3.1",
        } as Record<number, SigningScheme>
      )[id];
      if (scheme) {
        result.schemes.push(scheme);
        try {
          result.certificates.push(
            ...signerCertificates(block.subarray(p + 12, p + 8 + Number(len))),
          );
        } catch {
          result.inconclusive = true;
        }
      }
      p += 8 + Number(len);
    }
    if (p !== end) throw Error();
  } catch {
    result.inconclusive = true;
    result.schemes = [];
    result.certificates = [];
  }
  return result;
}
function signerCertificates(value: Uint8Array): Uint8Array[] {
  const children = (data: Uint8Array) => {
    const v = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const out: Uint8Array[] = [];
    let p = 0;
    while (p < data.length) {
      if (p + 4 > data.length || out.length >= 64) throw Error();
      const n = v.getUint32(p, true);
      p += 4;
      if (n > data.length - p) throw Error();
      out.push(data.subarray(p, p + n));
      p += n;
    }
    return out;
  };
  const outer = children(value);
  if (outer.length !== 1) throw Error();
  const signers = children(outer[0]);
  if (!signers.length) throw Error();
  const certs: Uint8Array[] = [];
  for (const signer of signers) {
    // v3 signer contains fixed SDK integers after signedData; parse only the first LP.
    if (signer.length < 4) throw Error();
    const n = new DataView(
      signer.buffer,
      signer.byteOffset,
      signer.byteLength,
    ).getUint32(0, true);
    if (n > signer.length - 4) throw Error();
    const data = signer.subarray(4, 4 + n);
    if (data.length < 8) throw Error();
    const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const digestLen = dv.getUint32(0, true);
    const c = 4 + digestLen;
    if (c + 4 > data.length) throw Error();
    const certLen = dv.getUint32(c, true);
    if (c + 4 + certLen > data.length) throw Error();
    const chain = children(data.subarray(c + 4, c + 4 + certLen));
    if (!chain.length) throw Error();
    certs.push(chain[0].slice());
  }
  return certs;
}
