import crypto from 'node:crypto';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SALT_BYTES = 16;
const DKLEN = 64;

function b64(buf: Buffer): string {
  return buf.toString('base64').replace(/=+$/g, '');
}

function b64Decode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  return Buffer.from(input + pad, 'base64');
}

function scryptAsync(password: string, salt: Buffer, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      keylen,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 64 * 1024 * 1024 },
      (err, derivedKey) => {
        if (err) return reject(err);
        resolve(derivedKey as Buffer);
      },
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_BYTES);
  const dk = await scryptAsync(password, salt, DKLEN);
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${b64(salt)}$${b64(dk)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 7) return false;
  if (parts[0] !== 'scrypt') return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (N !== SCRYPT_N || r !== SCRYPT_R || p !== SCRYPT_P) return false;
  const salt = b64Decode(parts[4] ?? '');
  const expected = b64Decode(parts[5] ?? '');
  if (salt.length !== SALT_BYTES) return false;
  if (expected.length !== DKLEN) return false;
  let dk: Buffer;
  try {
    dk = await scryptAsync(password, salt, DKLEN);
  } catch {
    return false;
  }
  if (dk.length !== expected.length) return false;
  return crypto.timingSafeEqual(dk, expected);
}

