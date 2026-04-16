#!/usr/bin/env node
/**
 * scripts/encrypt-key.mjs
 *
 * CLI utility for encrypting a raw API key with AES-256-GCM before storing
 * it in production environment variables (Coolify, etc.).
 *
 * Usage:
 *   node scripts/encrypt-key.mjs <ENCRYPTION_SECRET> <RAW_API_KEY>
 *
 * Example:
 *   node scripts/encrypt-key.mjs "my-strong-secret-passphrase" "AIzaSyA-..."
 *
 * The printed base64url blob is what you paste as the value of
 * GEMINI_API_KEY_ENC (or GROK_API_KEY_ENC) in your host’s env (e.g. Coolify).
 *
 * The same ENCRYPTION_SECRET must be set as the ENCRYPTION_SECRET env var
 * on the server so the Edge Function can decrypt the key at runtime.
 *
 * Algorithm:
 *   PBKDF2-SHA-256(secret, salt="solaris-cet-api-key-v1", 100,000 iters)
 *   → 256-bit AES-GCM key
 *   → encrypt(plaintext) with random 12-byte IV
 *   → base64url(IV || ciphertext+authTag)
 *
 * Node.js >= 20 is required (globalThis.crypto Web Crypto API).
 */

const PBKDF2_SALT = 'solaris-cet-api-key-v1';

function toBase64Url(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

async function deriveKey(secret) {
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
    ['encrypt'],
  );
}

async function encryptApiKey(secret, plaintext) {
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

async function readStdin() {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on('data', (c) => chunks.push(Buffer.from(c)));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    process.stdin.on('error', reject);
  });
}

const argv = process.argv.slice(2);
const useStdin = argv.includes('--stdin');
const cleaned = argv.filter((x) => x !== '--stdin');
const secret = cleaned[0] || process.env.ENCRYPTION_SECRET;
let rawKey = cleaned[1] || process.env.RAW_API_KEY;

if (useStdin) {
  rawKey = (await readStdin()).trim();
}

if (!secret || !rawKey) {
  console.error('Usage: node scripts/encrypt-key.mjs <ENCRYPTION_SECRET> <RAW_API_KEY>');
  console.error('   or: ENCRYPTION_SECRET=... node scripts/encrypt-key.mjs --stdin   (paste key on stdin)');
  console.error('');
  console.error('Example:');
  console.error('  ENCRYPTION_SECRET="my-strong-passphrase" node scripts/encrypt-key.mjs --stdin');
  process.exit(1);
}

if (secret.length < 16) {
  console.warn('[WARN] ENCRYPTION_SECRET is shorter than 16 characters. Use at least 32.');
}

const encrypted = await encryptApiKey(secret, rawKey);
console.log('');
console.log('✅  Encrypted API key (base64url, AES-256-GCM):');
console.log('');
console.log(encrypted);
console.log('');
console.log('→  Set this as GEMINI_API_KEY_ENC or GROK_API_KEY_ENC in your host env (e.g. Coolify).');
console.log('→  Set ENCRYPTION_SECRET to the passphrase you used above.');
