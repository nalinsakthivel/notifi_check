// Signature detection for APKs. Scope, deliberately bounded:
//  - Always safe: report which META-INF/*.{RSA,DSA,EC} signature files exist.
//  - Best-effort: walk the PKCS#7 DER structure far enough to isolate the
//    X.509 certificate's own DER bytes, then SHA-256 those via SubtleCrypto.
//    This is a shallow SEQUENCE/tag walker, not a general ASN.1 library — if
//    it can't confidently find the certificate boundary we report "signed:
//    yes" without a fingerprint rather than risk a wrong hash.

export interface SignatureInfo {
  signed: boolean;
  signatureFiles: string[];
  /** SHA-256 of the leaf certificate's DER bytes, as lowercase hex with colons, or null if not confidently extracted. */
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

function readDerLength(bytes: Uint8Array, pos: number): { length: number; next: number } {
  const first = bytes[pos];
  if ((first & 0x80) === 0) return { length: first, next: pos + 1 };
  const numBytes = first & 0x7f;
  if (numBytes === 0 || numBytes > 4) throw new Error("Unsupported DER length encoding");
  let length = 0;
  for (let i = 0; i < numBytes; i++) length = (length << 8) | bytes[pos + 1 + i];
  return { length, next: pos + 1 + numBytes };
}

function readDerNode(bytes: Uint8Array, pos: number): DerNode {
  if (pos >= bytes.length) throw new Error("Unexpected end of DER data");
  const tag = bytes[pos];
  const { length, next } = readDerLength(bytes, pos + 1);
  const contentStart = next;
  const contentLength = length;
  if (contentStart + contentLength > bytes.length) throw new Error("DER length exceeds buffer");
  return { tag, contentStart, contentLength, start: pos, end: contentStart + contentLength };
}

/** Direct children of a constructed DER node (SEQUENCE/SET), shallow — one level. */
function derChildren(bytes: Uint8Array, node: DerNode): DerNode[] {
  const children: DerNode[] = [];
  let pos = node.contentStart;
  while (pos < node.end) {
    const child = readDerNode(bytes, pos);
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
 * We walk down to the certificates SET and take its first entry as the leaf cert.
 * Any structural surprise aborts extraction rather than guessing.
 */
function extractLeafCertificateDer(pkcs7: Uint8Array): Uint8Array | null {
  try {
    const contentInfo = readDerNode(pkcs7, 0);
    if (contentInfo.tag !== TAG_SEQUENCE) return null;
    const [, explicit0] = derChildren(pkcs7, contentInfo); // [OID, [0] EXPLICIT content]
    if (!explicit0 || (explicit0.tag & 0xa0) !== 0xa0) return null; // context-tagged, constructed

    const signedData = readDerNode(pkcs7, explicit0.contentStart);
    if (signedData.tag !== TAG_SEQUENCE) return null;

    const sdChildren = derChildren(pkcs7, signedData);
    // Find the first child tagged [0] IMPLICIT (constructed context tag 0xa0) —
    // that's the certificates SET per RFC 2315 §9.1.
    const certsField = sdChildren.find((c) => c.tag === 0xa0);
    if (!certsField) return null;

    // certsField's content IS the SET OF Certificate content directly (IMPLICIT tagging
    // replaces the universal SET tag with the context tag, but the inner bytes are
    // still one-or-more SEQUENCE certificates back to back).
    const first = readDerNode(pkcs7, certsField.contentStart);
    if (first.tag !== TAG_SEQUENCE) return null;
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
): Promise<SignatureInfo> {
  const signatureFiles = [...signatureEntries.keys()].sort();
  if (signatureFiles.length === 0) {
    return { signed: false, signatureFiles: [], certSha256: null, certExtractionNote: null };
  }

  // Try each candidate until one yields a confidently-isolated cert.
  for (const [name, bytes] of signatureEntries) {
    const certDer = extractLeafCertificateDer(bytes);
    if (!certDer) continue;
    try {
      const digest = await crypto.subtle.digest("SHA-256", certDer.buffer as ArrayBuffer);
      return {
        signed: true,
        signatureFiles,
        certSha256: toColonHex(digest),
        certExtractionNote: `Fingerprint computed from the leaf certificate in ${name}.`,
      };
    } catch {
      // fall through to the "signed but no fingerprint" result below
    }
  }

  return {
    signed: true,
    signatureFiles,
    certSha256: null,
    certExtractionNote:
      "Found a signature block but could not confidently isolate the certificate bytes — " +
      "full DER/ASN.1 parsing of PKCS#7 is out of scope, so no fingerprint is shown rather than risking a wrong one.",
  };
}
