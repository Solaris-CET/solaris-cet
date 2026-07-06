import { Address } from '@ton/core';

export function parseTonAddress(raw: string): Address | null {
  const v = raw.trim();
  if (!v) return null;
  try {
    return Address.parse(v);
  } catch {
    try {
      return Address.parseFriendly(v).address;
    } catch {
      return null;
    }
  }
}

