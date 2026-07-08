import type { AdminRole } from './adminClient';
import type { AdminSectionKey } from './useAdminSection';

export type AdminNavItem = { key: AdminSectionKey; label: string; minRole: AdminRole };

export function buildAdminNav(newLeadsCount: number): AdminNavItem[] {
  return [
    { key: 'dashboard', label: 'Dashboard', minRole: 'viewer' },
    { key: 'invites', label: 'Invites', minRole: 'admin' },
    { key: 'blocks', label: 'Texte pagini', minRole: 'editor' },
    { key: 'posts', label: 'Blog', minRole: 'editor' },
    { key: 'media', label: 'Media', minRole: 'editor' },
    { key: 'token', label: 'Token', minRole: 'editor' },
    { key: 'cetuia', label: 'Cetățuia', minRole: 'editor' },
    { key: 'users', label: 'Utilizatori', minRole: 'admin' },
    { key: 'conversations', label: 'Conversații AI', minRole: 'admin' },
    { key: 'i18n', label: 'Traduceri', minRole: 'editor' },
    { key: 'settings', label: 'Setări', minRole: 'admin' },
    {
      key: 'leads',
      label: `Leads & Oferte${newLeadsCount > 0 ? ` (${newLeadsCount})` : ''}`,
      minRole: 'viewer',
    },
    { key: 'installers', label: 'Instalatori', minRole: 'viewer' },
    { key: 'twin-monitor', label: 'Twin monitor', minRole: 'viewer' },
    { key: 'twin-webhooks', label: 'Twin webhooks', minRole: 'viewer' },
    { key: 'twin-agent', label: 'Twin agent', minRole: 'viewer' },
    { key: 'survey-offline', label: 'Survey offline', minRole: 'viewer' },
    { key: 'audit', label: 'Audit', minRole: 'viewer' },
  ];
}

export function adminRoleRank(role: AdminRole): number {
  return role === 'admin' ? 3 : role === 'editor' ? 2 : 1;
}

export function canAccessAdminSection(userRole: AdminRole, required: AdminRole): boolean {
  return adminRoleRank(userRole) >= adminRoleRank(required);
}