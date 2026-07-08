// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BADGE_CLAIM_NFT_PATH, BADGE_CLAIM_NFT_PROBE, parseBadgeClaimSlug } from '../../api/lib/badgeClaimNft';

const claimMocks = vi.hoisted(() => {
  const schema = {
    badges: { id: 'badges.id', slug: 'badges.slug', active: 'badges.active', tonMetadataUri: 'badges.tonMetadataUri' },
    userBadges: { id: 'userBadges.id', userId: 'userBadges.userId', badgeId: 'userBadges.badgeId' },
    nftBadgeClaims: {
      userId: 'nftBadgeClaims.userId',
      badgeId: 'nftBadgeClaims.badgeId',
      status: 'nftBadgeClaims.status',
      requestedAt: 'nftBadgeClaims.requestedAt',
      mintedAt: 'nftBadgeClaims.mintedAt',
      txHash: 'nftBadgeClaims.txHash',
      nftAddress: 'nftBadgeClaims.nftAddress',
    },
  };

  const bag = {
    authOk: true,
    badgeFound: true,
    owned: true,
    claim: {
      status: 'requested',
      requestedAt: new Date('2026-07-07T10:00:00Z'),
      mintedAt: null,
      txHash: null,
      nftAddress: null,
    },
    insertCalled: false,
  };

  const getDb = () => ({
    select() {
      return {
        from(table: unknown) {
          if (table === schema.badges) {
            return {
              where() {
                return {
                  limit: async () =>
                    bag.badgeFound ? [{ id: 'badge-1', slug: 'solar-pioneer', tonMetadataUri: 'ipfs://meta' }] : [],
                };
              },
            };
          }
          if (table === schema.userBadges || table === schema.nftBadgeClaims) {
            return {
              where() {
                return {
                  limit: async () => {
                    if (table === schema.userBadges) return bag.owned ? [{ id: 'ub-1' }] : [];
                    return bag.claim ? [bag.claim] : [];
                  },
                };
              },
            };
          }
          return { where: () => ({ limit: async () => [] }) };
        },
      };
    },
    insert() {
      return {
        values() {
          return {
            onConflictDoNothing: async () => {
              bag.insertCalled = true;
            },
          };
        },
      };
    },
  });

  return Object.assign(bag, { schema, getDb });
});

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!claimMocks.authOk || !auth.startsWith('Bearer valid-token')) return null;
    return { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: claimMocks.getDb,
  schema: claimMocks.schema,
}));

import badgeClaimNftRoute, { BADGE_CLAIM_NFT_PROBE as routeProbe } from '../../api/gamification/badges/claim-nft/route';

function claimRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${BADGE_CLAIM_NFT_PATH}`, { ...init, headers });
}

describe('badgeClaimNft helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(BADGE_CLAIM_NFT_PROBE.path).toBe('/api/gamification/badges/claim-nft');
    expect(routeProbe.authRequired).toBe(true);
  });

  it('parseBadgeClaimSlug trims slug', () => {
    expect(parseBadgeClaimSlug({ badgeSlug: '  solar-pioneer  ' })).toBe('solar-pioneer');
    expect(parseBadgeClaimSlug({})).toBe('');
  });
});

describe('/api/gamification/badges/claim-nft e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    claimMocks.authOk = true;
    claimMocks.badgeFound = true;
    claimMocks.owned = true;
    claimMocks.insertCalled = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(BADGE_CLAIM_NFT_PATH);
    expect(src).toContain('api/gamification/badges/claim-nft/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await badgeClaimNftRoute(claimRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST without auth returns 401', async () => {
    claimMocks.authOk = false;
    const res = await badgeClaimNftRoute(
      claimRequest({ method: 'POST', body: JSON.stringify({ badgeSlug: 'solar-pioneer' }) }),
    );
    expect(res.status).toBe(401);
  });

  it('POST requests NFT claim for owned badge', async () => {
    const res = await badgeClaimNftRoute(
      claimRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ badgeSlug: 'solar-pioneer' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; claim: { status: string } | null };
    expect(body.ok).toBe(true);
    expect(body.claim?.status).toBe('requested');
    expect(claimMocks.insertCalled).toBe(true);
  });

  it('POST without owned badge returns 409', async () => {
    claimMocks.owned = false;
    const res = await badgeClaimNftRoute(
      claimRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ badgeSlug: 'solar-pioneer' }),
      }),
    );
    expect(res.status).toBe(409);
  });
});