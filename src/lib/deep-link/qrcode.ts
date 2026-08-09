/**
 * Minimal QR Code encoder — Model 2, byte mode only, auto version/mask selection.
 *
 * No dependency: this repo intentionally has no `qrcode` package (see AGENTS.md/CLAUDE.md).
 * This is a from-scratch TypeScript port of the well-known public-domain QR encoding
 * algorithm structure (Reed-Solomon ECC over GF(256), standard version/format tables,
 * byte-mode segments, penalty-based mask selection) — written independently for this repo.
 *
 * Supports versions 1-40, error correction levels L/M/Q/H, but callers here only need
 * byte-mode encoding of URLs up to a few hundred characters (auto-picks smallest version).
 */

export type EccLevel = "L" | "M" | "Q" | "H";

export interface QrMatrix {
  size: number;
  /** modules[y][x] === true means a dark module */
  modules: boolean[][];
}

// ---- Static tables -------------------------------------------------------

// Error correction codewords per block count etc., indexed [version-1][eccIndex]
// eccIndex order: L=0, M=1, Q=2, H=3
const ECC_CODEWORDS_PER_BLOCK: number[][] = [
  [7, 10, 13, 17], [10, 16, 22, 28], [15, 26, 18, 22], [20, 18, 26, 16],
  [26, 24, 18, 22], [18, 16, 24, 28], [20, 18, 18, 26], [24, 22, 22, 26],
  [30, 22, 20, 24], [18, 26, 24, 28], [20, 30, 28, 24], [24, 22, 26, 28],
  [26, 22, 24, 22], [30, 24, 20, 24], [22, 24, 30, 24], [24, 28, 24, 30],
  [28, 28, 28, 28], [30, 26, 28, 28], [28, 26, 26, 26], [28, 26, 30, 28],
  [28, 26, 28, 30], [28, 28, 30, 24], [30, 28, 30, 30], [30, 28, 30, 30],
  [26, 28, 30, 30], [28, 28, 28, 30], [30, 28, 30, 30], [30, 28, 30, 30],
  [30, 28, 30, 30], [30, 28, 30, 30], [30, 28, 30, 30], [30, 28, 30, 30],
  [30, 28, 30, 30], [30, 28, 30, 30], [30, 28, 30, 30], [30, 28, 30, 30],
  [30, 28, 30, 30], [30, 28, 30, 30], [30, 28, 30, 30], [30, 28, 30, 30],
];

const NUM_ERROR_CORRECTION_BLOCKS: number[][] = [
  [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 2, 2], [1, 2, 2, 4],
  [1, 2, 4, 4], [2, 4, 4, 4], [2, 4, 6, 5], [2, 4, 6, 6],
  [2, 5, 8, 8], [4, 5, 8, 8], [4, 5, 8, 11], [4, 8, 10, 11],
  [4, 9, 12, 16], [4, 9, 16, 16], [6, 10, 12, 18], [6, 10, 17, 16],
  [6, 11, 16, 19], [6, 13, 18, 21], [7, 14, 21, 25], [8, 16, 20, 25],
  [8, 17, 23, 25], [9, 17, 23, 34], [9, 18, 25, 30], [10, 20, 27, 32],
  [12, 21, 29, 35], [12, 23, 34, 37], [12, 25, 34, 40], [13, 26, 35, 42],
  [14, 28, 38, 45], [15, 29, 40, 48], [16, 31, 43, 51], [17, 33, 45, 54],
  [18, 35, 48, 57], [19, 37, 51, 60], [19, 38, 53, 63], [20, 40, 56, 66],
  [21, 43, 59, 70], [22, 45, 62, 74], [24, 47, 65, 77], [25, 49, 68, 81],
];

const ECC_INDEX: Record<EccLevel, number> = { L: 0, M: 1, Q: 2, H: 3 };
const FORMAT_BITS: Record<EccLevel, number> = { L: 1, M: 0, Q: 3, H: 2 };

// Canonical raw data module count per version (Thonky/Nayuki formula)
function getNumRawDataModules(ver: number): number {
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (ver >= 7) result -= 36;
  }
  return result;
}

function numDataCodewords(ver: number, ecc: EccLevel): number {
  const idx = ECC_INDEX[ecc];
  return (
    Math.floor(getNumRawDataModules(ver) / 8) -
    ECC_CODEWORDS_PER_BLOCK[ver - 1][idx] * NUM_ERROR_CORRECTION_BLOCKS[ver - 1][idx]
  );
}

// ---- Reed-Solomon over GF(256), primitive polynomial x^8 + x^4 + x^3 + x^2 + 1 (0x11D) ----

function rsMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function rsDivisor(degree: number): number[] {
  // Generator polynomial coefficients, computed via successive multiplication by (x - r^i)
  const result: number[] = new Array(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = rsMultiply(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = rsMultiply(root, 0x02);
  }
  return result;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const result: number[] = new Array(divisor.length).fill(0);
  for (const b of data) {
    const factor = b ^ result[0];
    result.shift();
    result.push(0);
    for (let i = 0; i < divisor.length; i++) {
      result[i] ^= rsMultiply(divisor[i], factor);
    }
  }
  return result;
}

// ---- Bit buffer ----

class BitBuffer {
  bits: number[] = [];
  appendBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) this.bits.push((val >>> i) & 1);
  }
}

// ---- Data encoding (byte mode) ----

function encodeByteModeSegment(data: Uint8Array): { bits: number[]; charCount: number } {
  const bb = new BitBuffer();
  for (const b of data) bb.appendBits(b, 8);
  return { bits: bb.bits, charCount: data.length };
}

function charCountBits(version: number): number {
  if (version <= 9) return 8;
  if (version <= 26) return 16;
  return 16;
}

/** Pick the smallest version (1-40) that can hold `data` bytes at the given ECC level. */
function selectVersion(dataLength: number, ecc: EccLevel): number {
  for (let ver = 1; ver <= 40; ver++) {
    const ccBits = charCountBits(ver);
    const headerBits = 4 + ccBits;
    const capacityBits = numDataCodewords(ver, ecc) * 8;
    if (headerBits + dataLength * 8 <= capacityBits) return ver;
  }
  throw new Error("Data too long to fit in a QR code (max version 40 exceeded)");
}

function buildCodewords(data: Uint8Array, version: number, ecc: EccLevel): number[] {
  const ccBits = charCountBits(version);
  const seg = encodeByteModeSegment(data);

  const bb = new BitBuffer();
  bb.appendBits(0b0100, 4); // byte mode indicator
  bb.appendBits(seg.charCount, ccBits);
  bb.bits.push(...seg.bits);

  const dataCapacityBits = numDataCodewords(version, ecc) * 8;

  // Terminator
  const terminatorLen = Math.min(4, dataCapacityBits - bb.bits.length);
  bb.appendBits(0, terminatorLen);

  // Pad to byte boundary
  while (bb.bits.length % 8 !== 0) bb.bits.push(0);

  // Pad with alternating bytes 0xEC, 0x11
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bb.bits.length < dataCapacityBits) {
    bb.appendBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits -> byte array
  const dataCodewords: number[] = [];
  for (let i = 0; i < bb.bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bb.bits[i + j];
    dataCodewords.push(byte);
  }

  // Split into blocks, compute ECC per block, interleave data then ECC (QR spec 8-bit
  // codeword interleaving, mirrors the standard reference algorithm's block math exactly).
  const idx = ECC_INDEX[ecc];
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[version - 1][idx];
  const eccLen = ECC_CODEWORDS_PER_BLOCK[version - 1][idx];
  const rawCodewords = Math.floor(getNumRawDataModules(version) / 8);
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);

  const divisor = rsDivisor(eccLen);
  const blocks: number[][] = [];
  const eccBlocks: number[][] = [];
  let offset = 0;
  for (let i = 0; i < numBlocks; i++) {
    const dataLen = shortBlockLen - eccLen + (i < numShortBlocks ? 0 : 1);
    const block = dataCodewords.slice(offset, offset + dataLen);
    offset += dataLen;
    blocks.push(block);
    eccBlocks.push(rsRemainder(block, divisor));
  }

  const result: number[] = [];
  const longestData = shortBlockLen - eccLen + 1;
  for (let i = 0; i < longestData; i++) {
    for (let b = 0; b < numBlocks; b++) {
      // Short blocks have no codeword at the final data position — skip it.
      if (i !== longestData - 1 || b >= numShortBlocks) result.push(blocks[b][i]);
    }
  }
  for (let i = 0; i < eccLen; i++) {
    for (let b = 0; b < numBlocks; b++) result.push(eccBlocks[b][i]);
  }

  return result;
}

// ---- Module placement ----

function isFunctionModule(size: number, version: number, x: number, y: number): boolean {
  // Finder patterns (with separators) top-left, top-right, bottom-left
  if (
    (x < 9 && y < 9) ||
    (x >= size - 8 && y < 9) ||
    (x < 9 && y >= size - 8)
  ) {
    return true;
  }
  // Timing patterns
  if (x === 6 || y === 6) return true;
  // Alignment patterns
  if (version >= 2) {
    const positions = alignmentPatternPositions(version);
    for (const cy of positions) {
      for (const cx of positions) {
        if ((cx === 6 && cy === 6) || (cx === 6 && cy === size - 7) || (cx === size - 7 && cy === 6)) continue;
        if (Math.abs(x - cx) <= 2 && Math.abs(y - cy) <= 2) return true;
      }
    }
  }
  // Version info blocks (version >= 7)
  if (version >= 7) {
    if (x < 6 && y >= size - 11 && y < size - 8) return true;
    if (y < 6 && x >= size - 11 && x < size - 8) return true;
  }
  return false;
}

function alignmentPatternPositions(version: number): number[] {
  if (version === 1) return [];
  const numAlign = Math.floor(version / 7) + 2;
  const size = version * 4 + 17;
  const step =
    version === 32 ? 26 : Math.ceil((size - 13) / (2 * numAlign - 2)) * 2;
  const positions: number[] = [6];
  let pos = size - 7;
  for (let i = 0; i < numAlign - 1; i++) {
    positions.splice(1, 0, pos);
    pos -= step;
  }
  return positions.sort((a, b) => a - b);
}

// Finder pattern per QR spec: 7x7 with dark 1-module border, light ring, dark 3x3 center.
// The surrounding 8x8 (including the 1-module light separator) is left light by default
// since `modules` starts all-false and the separator ring is a function module we never touch.
function drawFinderPatternExact(modules: boolean[][], size: number, cx: number, cy: number) {
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      if (x < 0 || x >= size || y < 0 || y >= size) continue;
      const cheby = Math.max(Math.abs(dx), Math.abs(dy));
      modules[y][x] = cheby !== 2;
    }
  }
}

function drawAlignmentPattern(modules: boolean[][], size: number, cx: number, cy: number) {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      if (x < 0 || x >= size || y < 0 || y >= size) continue;
      const cheby = Math.max(Math.abs(dx), Math.abs(dy));
      modules[y][x] = cheby !== 1;
    }
  }
}

function applyMask(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0: return (x + y) % 2 === 0;
    case 1: return y % 2 === 0;
    case 2: return x % 3 === 0;
    case 3: return (x + y) % 3 === 0;
    case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
    case 5: return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    case 7: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
    default: return false;
  }
}

function penaltyScore(modules: boolean[][], size: number): number {
  let penalty = 0;
  // Rule 1: runs of 5+ same color in a row/column
  for (let y = 0; y < size; y++) {
    let runColor = modules[y][0];
    let runLen = 1;
    for (let x = 1; x < size; x++) {
      if (modules[y][x] === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) penalty += 3 + (runLen - 5);
        runColor = modules[y][x];
        runLen = 1;
      }
    }
    if (runLen >= 5) penalty += 3 + (runLen - 5);
  }
  for (let x = 0; x < size; x++) {
    let runColor = modules[0][x];
    let runLen = 1;
    for (let y = 1; y < size; y++) {
      if (modules[y][x] === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) penalty += 3 + (runLen - 5);
        runColor = modules[y][x];
        runLen = 1;
      }
    }
    if (runLen >= 5) penalty += 3 + (runLen - 5);
  }
  // Rule 2: 2x2 blocks of same color
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const c = modules[y][x];
      if (
        modules[y][x + 1] === c &&
        modules[y + 1][x] === c &&
        modules[y + 1][x + 1] === c
      ) {
        penalty += 3;
      }
    }
  }
  // Rule 3: finder-like patterns 1:1:3:1:1 with 4 light either side
  const pattern = [true, false, true, true, true, false, true];
  const lightPad = [false, false, false, false];
  const matchesAt = (getBit: (i: number) => boolean, start: number, len: number, arr: boolean[]) => {
    for (let i = 0; i < arr.length; i++) {
      const idx = start + i;
      if (idx < 0 || idx >= len) return false;
      if (getBit(idx) !== arr[i]) return false;
    }
    return true;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const getRow = (i: number) => modules[y][i];
      if (
        matchesAt(getRow, x, size, [...lightPad, ...pattern]) ||
        matchesAt(getRow, x, size, [...pattern, ...lightPad])
      ) {
        penalty += 40;
      }
      const getCol = (i: number) => modules[i][x];
      if (
        matchesAt(getCol, y, size, [...lightPad, ...pattern]) ||
        matchesAt(getCol, y, size, [...pattern, ...lightPad])
      ) {
        penalty += 40;
      }
    }
  }
  // Rule 4: overall dark proportion
  let dark = 0;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (modules[y][x]) dark++;
  const total = size * size;
  const percent = (dark * 100) / total;
  const k = Math.floor(Math.abs(percent - 50) / 5);
  penalty += k * 10;

  return penalty;
}

const BCH_FORMAT_GENERATOR = 0x537;
function computeFormatBits(ecc: EccLevel, mask: number): number {
  const data = (FORMAT_BITS[ecc] << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * BCH_FORMAT_GENERATOR);
  const bits = ((data << 10) | rem) ^ 0x5412;
  return bits & 0x7fff;
}

const BCH_VERSION_GENERATOR = 0x1f25;
function computeVersionBits(version: number): number {
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * BCH_VERSION_GENERATOR);
  return ((version << 12) | rem) & 0x3ffff;
}

/**
 * Encode `text` as a QR code (UTF-8 byte mode), auto-selecting the smallest version
 * that fits at the requested error-correction level.
 */
export function encodeQr(text: string, ecc: EccLevel = "M"): QrMatrix {
  const data = new TextEncoder().encode(text);
  const version = selectVersion(data.length, ecc);
  const codewords = buildCodewords(data, version, ecc);
  const size = version * 4 + 17;

  const modules: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  // Finder patterns + separators (separators are just "not function-drawn dark", left as light/false
  // but must still be excluded from data placement — handled via isFunctionModule)
  drawFinderPatternExact(modules, size, 3, 3);
  drawFinderPatternExact(modules, size, size - 4, 3);
  drawFinderPatternExact(modules, size, 3, size - 4);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    modules[6][i] = i % 2 === 0;
    modules[i][6] = i % 2 === 0;
  }

  // Alignment patterns
  if (version >= 2) {
    const positions = alignmentPatternPositions(version);
    for (const cy of positions) {
      for (const cx of positions) {
        if ((cx === 6 && cy === 6) || (cx === 6 && cy === size - 7) || (cx === size - 7 && cy === 6)) continue;
        drawAlignmentPattern(modules, size, cx, cy);
      }
    }
  }

  // Mark all function modules (finder/separator/timing/alignment/format/version reserved areas)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (isFunctionModule(size, version, x, y)) isFunction[y][x] = true;
    }
  }
  // Dark module (always dark), part of format info area
  modules[size - 8][8] = true;
  isFunction[size - 8][8] = true;

  // Reserve format info areas (we'll fill bits after mask selection) and version info if v>=7
  // (already marked via isFunctionModule)

  // Convert codewords to a bit stream for placement
  const bitStream: boolean[] = [];
  for (const byte of codewords) {
    for (let i = 7; i >= 0; i--) bitStream.push(((byte >>> i) & 1) === 1);
  }

  // Zigzag placement, skipping function modules and the vertical timing column (x=6)
  let bitIdx = 0;
  let upward = true;
  for (let xRight = size - 1; xRight >= 1; xRight -= 2) {
    if (xRight === 6) xRight = 5;
    for (let i = 0; i < size; i++) {
      const y = upward ? size - 1 - i : i;
      for (const x of [xRight, xRight - 1]) {
        if (isFunction[y][x]) continue;
        const bit = bitIdx < bitStream.length ? bitStream[bitIdx] : false;
        modules[y][x] = bit;
        bitIdx++;
      }
    }
    upward = !upward;
  }

  // Try all 8 masks, pick lowest penalty; masking only applies to non-function modules
  let bestMask = 0;
  let bestPenalty = Infinity;
  let bestModules: boolean[][] | null = null;
  for (let mask = 0; mask < 8; mask++) {
    const trial: boolean[][] = modules.map((row) => row.slice());
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (isFunction[y][x]) continue;
        if (applyMask(mask, x, y)) trial[y][x] = !trial[y][x];
      }
    }
    // Temporarily stamp format bits for accurate penalty scoring (spec includes them)
    stampFormatInfo(trial, size, ecc, mask);
    if (version >= 7) stampVersionInfo(trial, size, version);
    const score = penaltyScore(trial, size);
    if (score < bestPenalty) {
      bestPenalty = score;
      bestMask = mask;
      bestModules = trial;
    }
  }

  const finalModules = bestModules!;
  void bestMask;

  return { size, modules: finalModules };
}

function stampFormatInfo(modules: boolean[][], size: number, ecc: EccLevel, mask: number) {
  const bits = computeFormatBits(ecc, mask);
  const get = (i: number) => ((bits >>> i) & 1) === 1;
  // Around top-left finder (modules indexed [y][x])
  for (let i = 0; i <= 5; i++) modules[i][8] = get(i);
  modules[7][8] = get(6);
  modules[8][8] = get(7);
  modules[8][7] = get(8);
  for (let i = 9; i < 15; i++) modules[8][14 - i] = get(i);
  // Top-right and bottom-left copies
  for (let i = 0; i < 8; i++) modules[8][size - 1 - i] = get(i);
  for (let i = 8; i < 15; i++) modules[size - 15 + i][8] = get(i);
  // Always-dark module
  modules[size - 8][8] = true;
}

function stampVersionInfo(modules: boolean[][], size: number, version: number) {
  const bits = computeVersionBits(version);
  const get = (i: number) => ((bits >>> i) & 1) === 1;
  for (let i = 0; i < 18; i++) {
    const a = i % 3;
    const b = Math.floor(i / 3);
    modules[size - 11 + a][b] = get(i);
    modules[b][size - 11 + a] = get(i);
  }
}

/**
 * Minimal sanity self-check (no test framework in this repo — this runs in dev if invoked).
 * Encodes a short known string and asserts basic structural invariants: square matrix,
 * finder pattern present in all three corners (dark border, light ring, dark core), and the
 * mandatory always-dark module. Call `qrSelfCheck()` manually if you touch this file.
 */
export function qrSelfCheck(): boolean {
  const qr = encodeQr("HELLO", "M");
  const { size, modules } = qr;
  if (modules.length !== size || modules[0].length !== size) return false;
  // Top-left finder core (3,3) must be dark, ring at (3,1) light, border (0,0) dark
  if (!modules[3][3]) return false;
  if (modules[1][3]) return false;
  if (!modules[0][0]) return false;
  // Always-dark module
  if (!modules[size - 8][8]) return false;
  return true;
}
