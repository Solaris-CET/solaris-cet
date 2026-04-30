import { useCallback, useMemo } from 'react';

const ADMIN_SECTION_KEYS = [
  'dashboard',
  'invites',
  'blocks',
  'posts',
  'media',
  'token',
  'cetuia',
  'users',
  'conversations',
  'i18n',
  'settings',
  'audit',
] as const;

export type AdminSectionKey = (typeof ADMIN_SECTION_KEYS)[number];

const DEFAULT: AdminSectionKey = 'dashboard';

function parseSection(v: string | null): AdminSectionKey {
  if (!v) return DEFAULT;
  return (ADMIN_SECTION_KEYS as readonly string[]).includes(v) ? (v as AdminSectionKey) : DEFAULT;
}

export function useAdminSection() {
  const section = useMemo(() => {
    if (typeof window === 'undefined') return DEFAULT;
    const url = new URL(window.location.href);
    return parseSection(url.searchParams.get('section'));
  }, []);

  const setSection = useCallback((next: AdminSectionKey) => {
    const url = new URL(window.location.href);
    url.searchParams.set('section', next);
    window.history.pushState({}, '', url.toString());
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  return { section, setSection };
}
