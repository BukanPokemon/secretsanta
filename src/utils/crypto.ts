import { bytesToBase64Url, base64UrlToBytes } from "./base64url";

// Legacy (v1): a single key hardcoded into the public repo — this is
// obfuscation, not real security. Kept only so old `?from=&to=` links
// (which used this key) keep decrypting. New links use a random per-event
// key instead (see below).
const ENCRYPTION_KEY_BYTES = new Uint8Array([
  132, 41, 242, 153, 104, 87, 23, 190,
  54, 187, 224, 176, 15, 198, 167, 249,
  89, 120, 78, 45, 12, 201, 156, 34,
  165, 43, 98, 133, 251, 49, 176, 88
]);

let cachedKey: CryptoKey | null = null;

export async function getEncryptionKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  cachedKey = await crypto.subtle.importKey(
    "raw",
    ENCRYPTION_KEY_BYTES,
    { name: "AES-GCM" },
    false, // not extractable
    ["encrypt", "decrypt"]
  );

  return cachedKey;
}

export async function encryptText(text: string): Promise<string> {
  const key = await getEncryptionKey();
  const encodedText = new TextEncoder().encode(text);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv
    },
    key,
    encodedText
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + new Uint8Array(encryptedData).length);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptText(encryptedText: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));

    // Split IV and data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv
      },
      key,
      encryptedData
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt text');
  }
}

// Event-scoped (v2): a random 256-bit key generated per pairing-generation
// event. Unlike the legacy key it isn't shared across events or committed to
// the repo, but since a giver's link has to be decryptable by a recipient's
// browser that never touches the organizer's localStorage, the key still has
// to travel inside the link itself (see links.ts) — it's carried in the URL
// fragment, which browsers never send to a server, so it never appears in
// access logs, Referer headers, or link-preview fetches the way the old
// query-string payload did.

export function generateEventKey(): string {
  const keyBytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToBase64Url(keyBytes);
}

async function importEventKey(base64Key: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new Uint8Array(base64UrlToBytes(base64Key)),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

// Returns iv + ciphertext, concatenated.
export async function encryptWithKey(data: Uint8Array, base64Key: string): Promise<Uint8Array> {
  const key = await importEventKey(base64Key);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new Uint8Array(data));

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return combined;
}

// Expects iv + ciphertext, concatenated, as produced by encryptWithKey.
export async function decryptWithKey(ivAndCiphertext: Uint8Array, base64Key: string): Promise<Uint8Array> {
  const key = await importEventKey(base64Key);
  const bytes = new Uint8Array(ivAndCiphertext);
  const iv = bytes.slice(0, 12);
  const ciphertext = bytes.slice(12);

  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new Uint8Array(decrypted);
} 