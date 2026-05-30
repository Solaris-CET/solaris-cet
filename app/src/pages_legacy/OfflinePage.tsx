export function OfflinePage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-2xl w-full">
        <div className="bento-card p-6 md:p-8 border border-white/10">
          <h1 className="text-white text-2xl md:text-3xl font-semibold tracking-tight">Offline</h1>
          <p className="mt-3 text-white/70 text-sm">
            You are currently offline. Check your connection and try again.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/"
              className="inline-flex min-h-11 items-center rounded-xl bg-solaris-gold text-solaris-dark px-5 text-sm font-semibold hover:bg-solaris-gold/90 transition-colors"
            >
              Go home
            </a>
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

