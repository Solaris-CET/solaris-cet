// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PATH,
  ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PROBE,
  buildExportAdVideoPreviewUrl,
  exportAdVideoDimensions,
  parseExportAdVideoBody,
  parseExportAdVideoCta,
  parseExportAdVideoFormat,
} from '../../api/lib/adminAnimationsExportAdVideo';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'editor' as 'admin' | 'editor' | 'viewer',
  rateLimited: false,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: (origin: string | null) =>
    origin === 'https://evil.test' ? 'https://allowed.test' : (origin ?? 'https://allowed.test'),
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => (adminMocks.rateLimited ? new Response('Too Many', { status: 429 }) : null),
}));

vi.mock('../../api/lib/adminAuth', () => ({
  guardAdminRoute: async (req: Request, probe: {
    minRole: string | ((method: string) => string);
    unauthenticatedStatus?: number;
    unauthorizedError?: string;
    forbiddenStatus?: number;
    forbiddenError?: string;
  }) => {
    if (!adminMocks.authOk) {
      return {
        status: probe.unauthenticatedStatus ?? 401,
        error: probe.unauthorizedError ?? 'Unauthorized',
      };
    }
    const minRole = typeof probe.minRole === 'function' ? probe.minRole(req.method) : probe.minRole;
    const ranks: Record<string, number> = { viewer: 1, editor: 2, admin: 3 };
    if ((ranks[adminMocks.role] ?? 1) < (ranks[minRole] ?? 3)) {
      return {
        status: probe.forbiddenStatus ?? 403,
        error: probe.forbiddenError ?? 'Forbidden',
      };
    }
    return { admin: { id: 'admin_1', role: adminMocks.role }, sessionId: 'sess_1' };
  },
}));

import adminAnimationsExportAdVideoRoute, {
  ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PROBE as routeProbe,
} from '../../api/admin/animations/export-ad-video/route';

describe('adminAnimationsExportAdVideo helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PROBE.path).toBe('/api/admin/animations/export-ad-video');
    expect(routeProbe.minRole).toBe('editor');
  });
});

describe('/api/admin/animations/export-ad-video e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'editor';
    adminMocks.rateLimited = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PATH);
    expect(src).toContain('api/admin/animations/export-ad-video/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminAnimationsExportAdVideoRoute(
      new Request(`http://test${ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('rejects unknown origins', async () => {
    const res = await adminAnimationsExportAdVideoRoute(
      new Request(`http://test${ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PATH}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer admin-token', origin: 'https://evil.test' },
      }),
    );
    expect(res.status).toBe(403);
  });

  it('POST requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminAnimationsExportAdVideoRoute(
      adminRequest(ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animation: 'hero-loop' }),
      }),
    );
    expect(res.status).toBe(ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PROBE.unauthenticatedStatus);
  });

  it('POST requires editor role', async () => {
    adminMocks.role = 'viewer';
    const res = await adminAnimationsExportAdVideoRoute(
      adminRequest(ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animation: 'hero-loop' }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it('POST returns export payload for valid body', async () => {
    const res = await adminAnimationsExportAdVideoRoute(
      adminRequest(ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animation: 'hero-loop',
          format: '1920x1080',
          ctaText: 'Solaris CET',
        }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      videoUrl: string;
      metadata: { animation: string; format: string; width: number; height: number; ctaText: string };
    };
    expect(body.success).toBe(true);
    expect(body.videoUrl).toContain('animation=hero-loop');
    expect(body.metadata.format).toBe('1920x1080');
    expect(body.metadata.width).toBe(1920);
    expect(body.metadata.height).toBe(1080);
    expect(body.metadata.ctaText).toBe('Solaris CET');
  });

  it('POST returns 400 when animation is missing', async () => {
    const res = await adminAnimationsExportAdVideoRoute(
      adminRequest(ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('GET returns 405', async () => {
    const res = await adminAnimationsExportAdVideoRoute(
      adminRequest(ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PATH, { method: 'GET' }),
    );
    expect(res.status).toBe(405);
  });
});