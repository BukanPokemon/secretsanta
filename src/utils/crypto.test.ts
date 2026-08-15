import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  encryptText,
  decryptText,
  generateEventKey,
  encryptWithKey,
  decryptWithKey,
} from './crypto';

describe('legacy hardcoded-key encryption (v1)', () => {
  it('round-trips arbitrary text, including Unicode and emoji', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (text) => {
        const encrypted = await encryptText(text);
        const decrypted = await decryptText(encrypted);
        expect(decrypted).toBe(text);
      }),
      { numRuns: 50 }
    );
  });

  it('round-trips names with emoji and multi-byte characters', async () => {
    const samples = ['Budi 🎁', 'Nguyễn Văn A', '田中太郎', '👨‍👩‍👧‍👦 Keluarga'];
    for (const text of samples) {
      const encrypted = await encryptText(text);
      expect(await decryptText(encrypted)).toBe(text);
    }
  });

  it('rejects corrupted ciphertext instead of returning garbage', async () => {
    const encrypted = await encryptText('hello');
    await expect(decryptText(encrypted.slice(0, -4) + 'abcd')).rejects.toThrow();
  });
});

describe('per-event key encryption (v2)', () => {
  it('generates distinct 256-bit keys', () => {
    const a = generateEventKey();
    const b = generateEventKey();
    expect(a).not.toBe(b);

    // base64url-decoded length should be 32 bytes (256 bits)
    const padded = a.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(a.length / 4) * 4, '=');
    expect(atob(padded).length).toBe(32);
  });

  it('round-trips arbitrary byte payloads under a random key', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uint8Array(), async (bytes) => {
        const key = generateEventKey();
        const encrypted = await encryptWithKey(bytes, key);
        const decrypted = await decryptWithKey(encrypted, key);
        expect(Array.from(decrypted)).toEqual(Array.from(bytes));
      }),
      { numRuns: 50 }
    );
  });

  it('round-trips Unicode and emoji text encoded as bytes', async () => {
    const samples = ['Budi 🎁', 'Nguyễn Văn A', '田中太郎', 'Jl. Merdeka No. 17, RT 03/RW 02'];
    const key = generateEventKey();

    for (const text of samples) {
      const bytes = new TextEncoder().encode(text);
      const encrypted = await encryptWithKey(bytes, key);
      const decrypted = await decryptWithKey(encrypted, key);
      expect(new TextDecoder().decode(decrypted)).toBe(text);
    }
  });

  it('fails to decrypt with the wrong key', async () => {
    const key = generateEventKey();
    const wrongKey = generateEventKey();
    const encrypted = await encryptWithKey(new TextEncoder().encode('secret'), key);

    await expect(decryptWithKey(encrypted, wrongKey)).rejects.toThrow();
  });
});
