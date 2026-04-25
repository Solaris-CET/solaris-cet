import { createHmac, randomBytes } from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(input: string): Uint8Array {
  const cleaned = input.toUpperCase().replace(/=+$/g, '').replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Uint8Array.from(out);
}

function hotp(secret: Uint8Array, counter: number, digits: number): string {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = createHmac('sha1', Buffer.from(secret)).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const mod = 10 ** digits;
  return String(code % mod).padStart(digits, '0');
}

export function generateTotpSecretBase32(bytes = 20): string {
  return base32Encode(randomBytes(bytes));
}

export function buildOtpAuthUrl(opts: { issuer: string; accountName: string; secretBase32: string }): string {
  const issuer = encodeURIComponent(opts.issuer);
  const label = encodeURIComponent(`${opts.issuer}:${opts.accountName}`);
  const secret = encodeURIComponent(opts.secretBase32);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

export function verifyTotpCode(secretBase32: string, code: string, nowMs: number, window = 1): boolean {
  const c = String(code ?? '').trim();
  if (!/^\d{6}$/.test(c)) return false;
  const secret = base32Decode(secretBase32);
  const step = 30;
  const counter = Math.floor(nowMs / 1000 / step);
  for (let w = -window; w <= window; w += 1) {
    if (hotp(secret, counter + w, 6) === c) return true;
  }
  return false;
}

