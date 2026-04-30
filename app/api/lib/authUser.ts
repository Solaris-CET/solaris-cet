import { requireAuth } from './auth';

export type AuthedUser = {
  id: string;
  walletAddress: string;
  role: string;
};

export async function requireUser(req: Request): Promise<AuthedUser | null> {
  const ctx = await requireAuth(req);
  if ('error' in ctx) return null;
  return { id: ctx.user.id, walletAddress: ctx.user.walletAddress, role: ctx.user.role };
}

export function isAdminRole(role: string): boolean {
  const r = String(role ?? '').toLowerCase();
  return r === 'admin' || r === 'support';
}
