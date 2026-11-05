import type { ModernSigning, SigningScheme } from "./signing-block.ts";
export interface SignatureInfo {
  presence: "present" | "none-detected" | "unknown";
  schemes: SigningScheme[];
  verification: "not-verified";
  signatureFiles: string[];
  certSha256: string | null;
  certExtractionNote: string | null;
}

// --- Minimal DER (BER subset) reader --------------------------------------

interface DerNode {
  tag: number;
  /** Offset of this node's content (after tag+length bytes) within the buffer. */
  contentStart: number;
  contentLength: number;
  /** Offset of the tag byte itself — start of the full TLV. */
  start: number;
  /** End offset (exclusive) of the full TLV, i.e. contentStart + contentLength. */
  end: number;
}

function readDerLength(
  bytes: Uint8Array,
  pos: number,
): { length: number; next: number } {
  if (pos >= bytes.length) throw new Error("Truncated DER length");
  const first = bytes[pos];
  if ((first & 0x80) === 0) return { length: first, next: pos + 1 };
  const numBytes = first & 0x7f;
  if (numBytes === 0 || numBytes > 4)
    throw new Error("Unsupported DER length encoding");
  if (pos + 1 + numBytes > bytes.length)
    throw new Error("Truncated DER length");
  let length = 0;
  for (let i = 0; i < numBytes; i++) length = length * 256 + bytes[pos + 1 + i];
  return { length, next: pos + 1 + numBytes };
}

function readDerNode(bytes: Uint8Array, pos: number): DerNode {
  if (pos >= bytes.length) throw new Error("Unexpected end of DER data");
  const tag = bytes[pos];
  const { length, next } = readDerLength(bytes, pos + 1);
  const contentStart = next;
  const contentLength = length;
  if (contentStart + contentLength > bytes.length)
    throw new Error("DER length exceeds buffer");
  return {
    tag,
    contentStart,
    contentLength,
    start: pos,
    end: contentStart + contentLength,
  };
}

/** Direct children of a constructed DER node (SEQUENCE/SET), shallow — one level. */
function derChildren(bytes: Uint8Array, node: DerNode): DerNode[] {
  const children: DerNode[] = [];
  let pos = node.contentStart;
  while (pos < node.end) {
    const child = readDerNode(bytes, pos);
    if (child.end > node.end || children.length >= 1024)
      throw new Error("Invalid DER container");
    children.push(child);
    pos = child.end;
  }
  return children;
}

const TAG_SEQUENCE = 0x30;

/**
 * PKCS#7 SignedData structure (simplified, RFC 2315):
 *   ContentInfo ::= SEQUENCE { contentType OID, content [0] EXPLICIT SignedData }
 *   SignedData ::= SEQUENCE { version, digestAlgorithms SET, contentInfo SEQUENCE,
 *                             certificates [0] IMPLICIT SET OF Certificate, ... }
 * We walk down to the certificates SET and accept a single certificate only (a SET is unordered).
 * Any structural surprise aborts extraction rather than guessing.
 */
function extractSingleCertificateDer(pkcs7: Uint8Array): Uint8Array | null {
  try {
    const contentInfo = readDerNode(pkcs7, 0);
    if (contentInfo.tag !== TAG_SEQUENCE || contentInfo.end !== pkcs7.length)
      return null;
    const ci = derChildren(pkcs7, contentInfo);
    const [oid, explicit0] = ci;
    const signedDataOid = [0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 1, 7, 2];
    if (
      ci.length !== 2 ||
      oid.tag !== 6 ||
      oid.contentLength !== signedDataOid.length ||
      !signedDataOid.every((b, i) => pkcs7[oid.contentStart + i] === b)
    )
      return null;
    if (!explicit0 || explicit0.tag !== 0xa0) return null; // context-tagged, constructed

    const signedData = readDerNode(pkcs7, explicit0.contentStart);
    if (signedData.tag !== TAG_SEQUENCE || signedData.end !== explicit0.end)
      return null;

    const sdChildren = derChildren(pkcs7, signedData);
    // Find the first child tagged [0] IMPLICIT (constructed context tag 0xa0) —
    // that's the certificates SET per RFC 2315 §9.1.
    if (
      sdChildren[0]?.tag !== 2 ||
      sdChildren[1]?.tag !== 0x31 ||
      sdChildren[2]?.tag !== 0x30
    )
      return null;
    const certsField = sdChildren[3]?.tag === 0xa0 ? sdChildren[3] : undefined;
    if (!certsField) return null;

    // certsField's content IS the SET OF Certificate content directly (IMPLICIT tagging
    // replaces the universal SET tag with the context tag, but the inner bytes are
    // still one-or-more SEQUENCE certificates back to back).
    const first = readDerNode(pkcs7, certsField.contentStart);
    if (first.tag !== TAG_SEQUENCE || first.end !== certsField.end) return null;
    return pkcs7.slice(first.start, first.end);
  } catch {
    return null;
  }
}

function toColonHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(":");
}

/**
 * Inspects META-INF signature-file entries already extracted from the ZIP
 * (name -> raw bytes). Never throws.
 */
export async function analyzeSignature(
  signatureEntries: Map<string, Uint8Array>,
  modern: ModernSigning = {
    schemes: [],
    certificates: [],
    inconclusive: false,
  },
): Promise<SignatureInfo> {
  const signatureFiles = [...signatureEntries.keys()].sort();
  const schemes: SigningScheme[] = [
    ...(signatureFiles.length ? ["v1" as const] : []),
    ...modern.schemes,
  ];
  const result: SignatureInfo = {
    presence: schemes.length
      ? "present"
      : modern.inconclusive
        ? "unknown"
        : "none-detected",
    schemes,
    verification: "not-verified",
    signatureFiles,
    certSha256: null,
    certExtractionNote: modern.inconclusive
      ? "Signing block is incomplete or unsupported; certificate extraction is inconclusive."
      : null,
  };
  const candidates = modern.certificates.length
    ? modern.certificates.map((bytes) => ({
        bytes,
        source: "first certificate of an APK signing-block signer",
      }))
    : [...signatureEntries].map(([name, bytes]) => ({
        bytes: extractSingleCertificateDer(bytes),
        source: `single certificate in ${name}`,
      }));
  for (const candidate of candidates) {
    if (!candidate.bytes) continue;
    // Require the three-part X.509 envelope. This is structural extraction,
    // not trust validation, key ownership, or signature verification.
    try {
      const node = readDerNode(candidate.bytes, 0);
      const parts = derChildren(candidate.bytes, node);
      if (
        node.tag !== 0x30 ||
        node.end !== candidate.bytes.length ||
        parts.length !== 3 ||
        parts[0].tag !== 0x30 ||
        parts[1].tag !== 0x30 ||
        parts[2].tag !== 3
      )
        continue;
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new Uint8Array(candidate.bytes),
      );
      result.certSha256 = toColonHex(digest);
      result.certExtractionNote = `SHA-256 of the ${candidate.source}. Other signers may exist. Certificate extraction does not verify the package or establish its Play App Signing certificate.`;
      return result;
    } catch {
      /* Preserve presence even if extraction or SubtleCrypto fails. */
    }
  }
  if (schemes.length)
    result.certExtractionNote ??=
      "Signature material detected; no unambiguous certificate could be extracted. Not cryptographically verified.";
  return result;
}
