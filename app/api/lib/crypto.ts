/**
 * AES-256-GCM encryption utilities for Edge runtime (Web Crypto).
 *
 * API keys are stored as AES-256-GCM encrypted blobs in host environment
 * variables. A separate `ENCRYPTION_SECRET` env var holds the master
 * passphrase used to derive the 256-bit AES key via PBKDF2-SHA-256.
 *
 * This provides two independent layers of protection:
 *   1. Host-level env-var protection (at rest / in transit).
 *   2. Application-level AES-256-GCM encryption decrypted only at request
 *      time inside the Edge Function — the plaintext key is never persisted.
 *
 * Wire format  (base64url-encoded):
 *   [ 12-byte IV | ciphertext+authTag (variable length) ]
 *
 * The 128-bit GCM authentication tag is appended to the ciphertext
 * automatically by the Web Crypto API and verified on decryption.
 *
 * Usage:
 *   # Encrypt a raw API key before adding it to host env:
 *   node scripts/encrypt-key.mjs "$ENCRYPTION_SECRET" "raw-api-key"
 *
 *   # On the server (e.g. Coolify), set:
 *   ENCRYPTION_SECRET = <your-32+-char-random-passphrase>
 *   GROK_API_KEY_ENC  = <output of encrypt-key.mjs>
 *   GEMINI_API_KEY_ENC= <output of encrypt-key.mjs>
 */

/** Public salt — not secret, prevents cross-project key reuse. */
const PBKDF2_SALT = 'solaris-cet-api-key-v1';

/**
 * Derive a 256-bit AES-GCM key from `secret` using PBKDF2-SHA-256.
 */
async function deriveKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(PBKDF2_SALT),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Encode a Uint8Array to base64url (no padding). */
function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Decode a base64url string back to Uint8Array. */
function fromBase64Url(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

/**
 * Decrypt a base64url-encoded AES-256-GCM ciphertext that was produced by
 * `scripts/encrypt-key.mjs` (or the equivalent `encryptApiKey` below).
 *
 * @param secret    - The ENCRYPTION_SECRET passphrase.
 * @param encrypted - The base64url blob stored in the env var.
 * @returns The decrypted plaintext (raw API key).
 * @throws  If the ciphertext is malformed or the secret is wrong.
 */
export async function decryptApiKey(secret: string, encrypted: string): Promise<string> {
  const combined = fromBase64Url(encrypted);
  if (combined.length < 13) {
    throw new Error(
      `Invalid encrypted key: too short (minimum 13 bytes required, got ${combined.length})`,
    );
  }
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const key = await deriveKey(secret);
  const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plainBuffer);
}

/**
 * Encrypt a plaintext API key into a base64url AES-256-GCM blob.
 * Intended for use in `scripts/encrypt-key.mjs`; not called in the
 * hot path of the Edge Function.
 *
 * @param secret    - The ENCRYPTION_SECRET passphrase.
 * @param plaintext - The raw API key to encrypt.
 */
export async function encryptApiKey(secret: string, plaintext: string): Promise<string> {
  const key = await deriveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  );
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);
  return toBase64Url(combined);
}

/**
 * Resolve an API key from either an encrypted env var (`*_ENC`) or a
 * plaintext env var (fallback).  Always prefers the encrypted version when
 * `ENCRYPTION_SECRET` is present.
 *
 * @param encryptedValue  - Value of the `*_ENC` environment variable (may be undefined).
 * @param plaintextValue  - Value of the plaintext environment variable (fallback).
 * @param encryptionSecret - Value of `ENCRYPTION_SECRET` (may be undefined).
 * @returns The resolved plaintext API key, or `undefined` if neither source is available.
 */
export async function resolveApiKey(
  encryptedValue: string | undefined,
  plaintextValue: string | undefined,
  encryptionSecret: string | undefined,
): Promise<string | undefined> {
  if (encryptedValue && encryptionSecret) {
    try {
      return await decryptApiKey(encryptionSecret, encryptedValue);
    } catch {
      // Decryption failed (wrong secret or corrupted blob) — fall through to plaintext
    }
  }
  return plaintextValue;
}
