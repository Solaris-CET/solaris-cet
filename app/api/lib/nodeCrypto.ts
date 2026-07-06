import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export function sha256Hex(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

export function hmacSha256(key: Uint8Array | string, message: string): Uint8Array {
  return createHmac('sha256', key).update(message).digest();
}

export function hmacSha256Hex(key: Uint8Array | string, message: string): string {
  return createHmac('sha256', key).update(message).digest('hex');
}

export function timingSafeEqualHex(aHex: string, bHex: string): boolean {
  const a = Buffer.from(aHex, 'hex');
  const b = Buffer.from(bHex, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
