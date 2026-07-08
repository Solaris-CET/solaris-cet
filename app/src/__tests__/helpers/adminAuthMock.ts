import type { AdminRole } from '../../../api/lib/adminAuth';

export type AdminAuthMockState = {
  authOk: boolean;
  role?: AdminRole;
};

const ROLE_RANK: Record<AdminRole, number> = { viewer: 1, editor: 2, admin: 3 };

export function buildGuardAdminRouteMock(
  getState: () => AdminAuthMockState,
  adminShape: (state: AdminAuthMockState) => Record<string, unknown> = (state) => ({
    id: 'admin_1',
    role: state.role ?? 'admin',
  }),
  options: { checkRole?: boolean } = { checkRole: true },
) {
  return async (
    req: Request,
    probe: {
      minRole: AdminRole | ((method: string) => AdminRole);
      unauthenticatedStatus?: number;
      unauthorizedError?: string;
      forbiddenStatus?: number;
      forbiddenError?: string;
    },
  ) => {
    const state = getState();
    if (!state.authOk) {
      return {
        status: probe.unauthenticatedStatus ?? 401,
        error: probe.unauthorizedError ?? 'Unauthorized',
      };
    }
    if (options.checkRole !== false) {
      const minRole = typeof probe.minRole === 'function' ? probe.minRole(req.method) : probe.minRole;
      const role = state.role ?? 'admin';
      if ((ROLE_RANK[role] ?? 1) < (ROLE_RANK[minRole] ?? 3)) {
        return {
          status: probe.forbiddenStatus ?? 403,
          error: probe.forbiddenError ?? 'Forbidden',
        };
      }
    }
    return { admin: adminShape(state), sessionId: 'sess_1' };
  };
}