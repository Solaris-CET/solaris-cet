import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import type { AdminRole, AdminSession } from './adminClient';
import { adminApi } from './adminClient';
import { AuditSection } from './sections/AuditSection';
import { BlocksSection } from './sections/BlocksSection';
import { CetuiaSection } from './sections/CetuiaSection';
import { ConversationsSection } from './sections/ConversationsSection';
import { DashboardSection } from './sections/DashboardSection';
import { I18nSection } from './sections/I18nSection';
import { InvitesSection } from './sections/InvitesSection';
import { LoginView } from './sections/LoginView';
import { MediaSection } from './sections/MediaSection';
import { PostsSection } from './sections/PostsSection';
import { SettingsSection } from './sections/SettingsSection';
import { TokenSection } from './sections/TokenSection';
import { UsersSection } from './sections/UsersSection';
import type { AdminSectionKey } from './useAdminSection';
import { useAdminSession } from './useAdminSession';

type NavItem = { key: AdminSectionKey; label: string; minRole: AdminRole };

const NAV: NavItem[] = [
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
  { key: 'audit', label: 'Audit', minRole: 'viewer' },
];

function rank(role: AdminRole) {
  return role === 'admin' ? 3 : role === 'editor' ? 2 : 1;
}

function canAccess(userRole: AdminRole, required: AdminRole) {
  return rank(userRole) >= rank(required);
}

function parseSection(v: string | null): AdminSectionKey {
  if (
    v === 'dashboard' ||
    v === 'invites' ||
    v === 'blocks' ||
    v === 'posts' ||
    v === 'media' ||
    v === 'token' ||
    v === 'cetuia' ||
    v === 'users' ||
    v === 'conversations' ||
    v === 'i18n' ||
    v === 'settings' ||
    v === 'audit'
  ) {
    return v;
  }
  return 'dashboard';
}

function useSectionState() {
  const [section, setSection] = useState<AdminSectionKey>(() => {
    if (typeof window === 'undefined') return 'dashboard';
    return parseSection(new URL(window.location.href).searchParams.get('section'));
  });

  useEffect(() => {
    const onPop = () => setSection(parseSection(new URL(window.location.href).searchParams.get('section')));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (next: AdminSectionKey) => {
    const url = new URL(window.location.href);
    url.searchParams.set('section', next);
    window.history.pushState({}, '', url.toString());
    setSection(next);
  };

  return { section, navigate };
}

export function AdminPanel() {
  const { token, setToken, admin, setAdmin, isAuthenticated, logout } = useAdminSession();
  const { section, navigate } = useSectionState();
  const [bootError, setBootError] = useState<string | null>(null);

  const role = (admin?.role ?? 'viewer') as AdminRole;
  const items = useMemo(() => NAV.filter((i) => canAccess(role, i.minRole)), [role]);
  const active = items.some((i) => i.key === section) ? section : 'dashboard';

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      const res = await adminApi<{ admin: AdminSession['admin'] }>('/api/admin/me', { token });
      if (!res.ok) {
        if (!cancelled) {
          setBootError(res.error);
          logout();
        }
        return;
      }
      if (!cancelled) {
        setAdmin(res.data.admin);
        setBootError(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, setAdmin, logout]);

  if (!isAuthenticated || !token) {
    return (
      <LoginView
        onLoggedIn={(session) => {
          setToken(session.token);
          setAdmin(session.admin);
          const url = new URL(window.location.href);
          url.searchParams.delete('invite');
          url.searchParams.set('section', 'dashboard');
          window.history.replaceState({}, '', url.toString());
        }}
      />
    );
  }

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[80vh] px-4 sm:px-6 py-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        <Card className="border border-white/10 bg-black/30 p-4">
          <div className="text-white font-semibold">Admin</div>
          <div className="text-xs text-white/60 mt-1 break-all">{admin?.email ?? '—'} · {role}</div>
          <div className="mt-4 space-y-1">
            {items.map((i) => (
              <button
                key={i.key}
                onClick={() => navigate(i.key)}
                className={`w-full text-left rounded px-3 py-2 text-sm border ${active === i.key ? 'border-amber-200/30 bg-white/5 text-white' : 'border-white/10 hover:bg-white/5 text-white/80'}`}
              >
                {i.label}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await adminApi('/api/admin/logout', { token, method: 'POST' });
                logout();
              }}
            >
              Logout
            </Button>
          </div>
          {bootError ? <div className="mt-3 text-xs text-red-300">{bootError}</div> : null}
        </Card>
        <div className="border border-white/10 bg-black/30 rounded-2xl p-4 sm:p-6">
          {active === 'dashboard' ? <DashboardSection token={token} /> : null}
          {active === 'invites' ? <InvitesSection token={token} /> : null}
          {active === 'blocks' ? <BlocksSection token={token} /> : null}
          {active === 'posts' ? <PostsSection token={token} /> : null}
          {active === 'media' ? <MediaSection token={token} /> : null}
          {active === 'token' ? <TokenSection token={token} /> : null}
          {active === 'cetuia' ? <CetuiaSection token={token} /> : null}
          {active === 'users' ? <UsersSection token={token} /> : null}
          {active === 'conversations' ? <ConversationsSection token={token} /> : null}
          {active === 'i18n' ? <I18nSection token={token} /> : null}
          {active === 'settings' ? <SettingsSection token={token} /> : null}
          {active === 'audit' ? <AuditSection token={token} /> : null}
        </div>
      </div>
    </main>
  );
}
