export function normalizePathname(pathname: string): string {
  const clean = (pathname || '/').replace(/\/$/, '') || '/';
  if (clean === '/index.html') return '/';
  const m = clean.match(/^\/(en|ro|es|de|pt|ru|zh)(\/|$)/);
  if (!m) return clean || '/';
  const rest = clean.slice(3);
  return (rest || '/').replace(/\/$/, '') || '/';
}

export function isInternalLink(a: HTMLAnchorElement): boolean {
  const href = a.getAttribute('href') ?? '';
  if (!href || href === '#' || href.startsWith('#')) return false;
  if (a.hasAttribute('download')) return false;
  const target = (a.getAttribute('target') ?? '').toLowerCase();
  if (target && target !== '_self') return false;
  if (a.getAttribute('rel')?.includes('external')) return false;
  if (a.getAttribute('data-no-spa') === '1') return false;
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (url.pathname.startsWith('/api/')) return false;
    return true;
  } catch {
    return false;
  }
}
