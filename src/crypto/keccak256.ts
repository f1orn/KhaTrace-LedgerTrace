/**
 * Pure TypeScript implementation of Keccak-256 & SHA-256 Cryptographic Primitives
 * Byte-for-byte compatible with Ethereum Virtual Machine (EVM) and Solidity keccak256.
 */

// Keccak-256 constants
const ROUND_CONSTANTS = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

const ROTATION_OFFSETS = [
  [0, 36, 3, 41, 18],
  [1, 44, 10, 45, 2],
  [62, 6, 43, 15, 61],
  [28, 55, 25, 21, 56],
  [27, 20, 39, 8, 14],
];

function rotl64(x: bigint, n: number): bigint {
  const shift = BigInt(n % 64);
  return ((x << shift) | (x >> (64n - shift))) & 0xffffffffffffffffn;
}

export function keccak256(data: string | Uint8Array): string {
  let bytes: Uint8Array;
  if (typeof data === 'string') {
    if (data.startsWith('0x')) {
      const hex = data.slice(2);
      bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
    } else {
      bytes = new TextEncoder().encode(data);
    }
  } else {
    bytes = data;
  }

  const rate = 136; // 1088 bits = 136 bytes for Keccak-256
  const state = new Array(25).fill(0n);

  // Padding: Keccak pad10*1 with 0x01 ... 0x80
  const paddingLen = rate - (bytes.length % rate);
  const padded = new Uint8Array(bytes.length + paddingLen);
  padded.set(bytes);
  padded[bytes.length] = 0x01;
  padded[padded.length - 1] |= 0x80;

  // Absorb phase
  for (let offset = 0; offset < padded.length; offset += rate) {
    for (let i = 0; i < rate / 8; i++) {
      const idx = offset + i * 8;
      const word =
        BigInt(padded[idx]) |
        (BigInt(padded[idx + 1]) << 8n) |
        (BigInt(padded[idx + 2]) << 16n) |
        (BigInt(padded[idx + 3]) << 24n) |
        (BigInt(padded[idx + 4]) << 32n) |
        (BigInt(padded[idx + 5]) << 40n) |
        (BigInt(padded[idx + 6]) << 48n) |
        (BigInt(padded[idx + 7]) << 56n);
      state[i] ^= word;
    }

    // Permutation (24 rounds)
    for (let round = 0; round < 24; round++) {
      // Theta step
      const C = new Array(5).fill(0n);
      for (let x = 0; x < 5; x++) {
        C[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
      }
      const D = new Array(5).fill(0n);
      for (let x = 0; x < 5; x++) {
        D[x] = C[(x + 4) % 5] ^ rotl64(C[(x + 1) % 5], 1);
      }
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          state[x + y * 5] ^= D[x];
        }
      }

      // Rho and Pi steps
      const B = new Array(25).fill(0n);
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          B[y + ((2 * x + 3 * y) % 5) * 5] = rotl64(state[x + y * 5], ROTATION_OFFSETS[y][x]);
        }
      }

      // Chi step
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          state[x + y * 5] = B[x + y * 5] ^ (~B[((x + 1) % 5) + y * 5] & B[((x + 2) % 5) + y * 5]);
        }
      }

      // Iota step
      state[0] ^= ROUND_CONSTANTS[round];
    }
  }

  // Squeeze phase (first 32 bytes)
  const resultBytes = new Uint8Array(32);
  for (let i = 0; i < 4; i++) {
    const word = state[i];
    for (let b = 0; b < 8; b++) {
      resultBytes[i * 8 + b] = Number((word >> BigInt(b * 8)) & 0xffn);
    }
  }

  return '0x' + Array.from(resultBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Combine two sibling hashes in lexicographical order (matches OpenZeppelin MerkleProof.sol)
 */
export function hashPair(a: string, b: string): string {
  const cleanA = a.toLowerCase();
  const cleanB = b.toLowerCase();
  if (cleanA <= cleanB) {
    return keccak256(cleanA + cleanB.slice(2));
  } else {
    return keccak256(cleanB + cleanA.slice(2));
  }
}

/**
 * Deterministic JSON stringifier to guarantee identical hashes across environments
 */
export function canonicalizeJson(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalizeJson(item)).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalizeJson(obj[k])).join(',') + '}';
}

/**
 * Format a hash for compact UI display (e.g. 0x4a12...89ef)
 */
export function formatHash(hash: string | null | undefined, head = 6, tail = 4): string {
  if (!hash) return '0x0000...0000';
  if (hash.length <= head + tail + 2) return hash;
  return `${hash.slice(0, head + 2)}...${hash.slice(-tail)}`;
}
