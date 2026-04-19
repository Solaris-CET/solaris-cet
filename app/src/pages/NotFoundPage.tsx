import { useEffect } from 'react';

export function NotFoundPage({
  attemptedPath,
  staticRedirectHref,
}: {
  attemptedPath: string;
  staticRedirectHref?: string;
}) {
  useEffect(() => {
    if (!staticRedirectHref) return;
    const id = window.setTimeout(() => {
      window.location.assign(staticRedirectHref);
    }, 150);
    return () => window.clearTimeout(id);
  }, [staticRedirectHref]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-black/30 p-6">
        <h1 className="text-white text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 text-white/70 text-sm break-all">
          Path: <span className="font-mono">{attemptedPath}</span>
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/" className="px-4 py-2 rounded-xl bg-solaris-gold text-solaris-dark font-semibold">
            Go home
          </a>
          {staticRedirectHref ? (
            <a
              href={staticRedirectHref}
              className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 text-white font-semibold"
            >
              Open static page
            </a>
          ) : null}
        </div>
      </div>
    </main>
  );
}
