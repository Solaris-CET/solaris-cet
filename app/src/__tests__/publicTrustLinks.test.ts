import { describe, it, expect } from 'vitest';
import {
  PUBLIC_CYBERSCOPE_URL,
  PUBLIC_FRESHCOINS_URL,
  PUBLIC_WHITEPAPER_IPFS_URL,
} from '@/lib/publicTrustLinks';

describe('publicTrustLinks', () => {
  it('exposes HTTPS URLs on expected hosts for audit surfaces', () => {
    expect(PUBLIC_CYBERSCOPE_URL).toMatch(/^https:\/\/www\.cyberscope\.io\/?$/);
    expect(PUBLIC_FRESHCOINS_URL).toMatch(/^https:\/\/www\.freshcoins\.io\/?$/);
    expect(PUBLIC_WHITEPAPER_IPFS_URL).toMatch(/^https:\/\//);
    expect(PUBLIC_WHITEPAPER_IPFS_URL).toContain('ipfs');
  });
});
