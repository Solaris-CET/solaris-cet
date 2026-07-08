// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminPanel } from '@/admin/AdminPanel';

const useAdminSessionMock = vi.fn();
const adminApiMock = vi.fn();

vi.mock('@/admin/useAdminSession', () => ({
  useAdminSession: () => useAdminSessionMock(),
}));

vi.mock('@/admin/adminClient', () => ({
  adminApi: (...args: unknown[]) => adminApiMock(...args),
  adminApiErr: () => 'Request failed',
}));

vi.mock('@/admin/sections/DashboardSection', () => ({ DashboardSection: () => <div data-testid="dash" /> }));
vi.mock('@/admin/sections/LeadsSection', () => ({ default: () => <div data-testid="leads" /> }));

describe('AdminPanel', () => {
  const fetchMock = vi.fn();
  const logout = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    window.history.replaceState({}, '', '/admin?section=dashboard');
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ total: 2 }) });
    adminApiMock.mockResolvedValue({
      ok: true,
      data: { admin: { email: 'admin@test.ro', role: 'viewer' } },
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    adminApiMock.mockReset();
    useAdminSessionMock.mockReset();
    logout.mockReset();
  });

  it('renders LoginView when not authenticated', () => {
    useAdminSessionMock.mockReturnValue({
      token: null,
      setToken: vi.fn(),
      admin: null,
      setAdmin: vi.fn(),
      isAuthenticated: false,
      logout,
    });

    render(<AdminPanel />);
    expect(screen.getByText('Admin Login')).toBeTruthy();
  });

  it('renders dashboard shell and nav for authenticated viewer', async () => {
    useAdminSessionMock.mockReturnValue({
      token: 'tok-viewer',
      setToken: vi.fn(),
      admin: { email: 'viewer@test.ro', role: 'viewer' },
      setAdmin: vi.fn(),
      isAuthenticated: true,
      logout,
    });

    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('viewer@test.ro')).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Leads & Oferte \(2\)/ })).toBeTruthy();
    expect(screen.getByTestId('dash')).toBeTruthy();
  });
});