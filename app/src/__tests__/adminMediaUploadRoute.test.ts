// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_MEDIA_UPLOAD_PATH,
  ADMIN_MEDIA_UPLOAD_PROBE,
  isAllowedMediaMime,
} from '../../api/lib/adminMediaUpload';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'editor' as 'admin' | 'editor' | 'viewer',
}));

/** Minimal 1×1 PNG (67 bytes). */
const PNG_BYTES = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: (origin: string | null) =>
    origin === 'https://evil.test' ? 'https://allowed.test' : (origin ?? 'https://allowed.test'),
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/adminAudit', () => ({
  writeAdminAudit: vi.fn(async () => undefined),
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
import adminMediaUploadRoute, { ADMIN_MEDIA_UPLOAD_PROBE as routeProbe } from '../../api/admin/media/upload/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';

function uploadRequest(init: RequestInit = {}): Request {
  const fd = new FormData();
  fd.append('file', new File([PNG_BYTES], 'probe.png', { type: 'image/png' }));
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer admin-token');
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${ADMIN_MEDIA_UPLOAD_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: fd,
  });
}

describe('adminMediaUpload helpers', () => {
  it('isAllowedMediaMime accepts probe mimes and rejects unknown types', () => {
    expect(isAllowedMediaMime('image/png')).toBe(true);
    expect(isAllowedMediaMime('image/jpeg')).toBe(true);
    expect(isAllowedMediaMime('application/pdf')).toBe(false);
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_MEDIA_UPLOAD_PROBE.path).toBe('/api/admin/media/upload');
    expect(routeProbe.minRole).toBe('editor');
    expect(routeProbe.rateLimitKey).toBe('admin-media-upload');
    expect(routeProbe.auditAction).toBe('ASSET_UPLOADED');
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });
});

describe('/api/admin/media/upload e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'editor';
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_MEDIA_UPLOAD_PATH);
    expect(src).toContain('api/admin/media/upload/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminMediaUploadRoute(
      new Request(`http://test${ADMIN_MEDIA_UPLOAD_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('POST requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminMediaUploadRoute(uploadRequest());
    expect(res.status).toBe(ADMIN_MEDIA_UPLOAD_PROBE.unauthenticatedStatus);
  });

  it('POST uploads png and returns asset', async () => {
    const res = await adminMediaUploadRoute(uploadRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      asset: { id: string; filename: string; mimeType: string; bytes: number };
      url: string;
    };
    expect(body.asset).toEqual({
      id: 'asset-1',
      filename: 'probe.png',
      mimeType: 'image/png',
      bytes: PNG_BYTES.byteLength,
    });
    expect(body.url).toBe('/api/media?id=asset-1');
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ admin: expect.objectContaining({ id: 'admin_1' }) }),
      'ASSET_UPLOADED',
      'cms_asset',
      'asset-1',
      expect.objectContaining({ filename: 'probe.png', mimeType: 'image/png', bytes: PNG_BYTES.byteLength }),
    );
  });

  it('GET returns 405', async () => {
    const res = await adminMediaUploadRoute(
      new Request(`http://test${ADMIN_MEDIA_UPLOAD_PATH}`, {
        method: 'GET',
        headers: { Authorization: 'Bearer admin-token', origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(405);
  });
});