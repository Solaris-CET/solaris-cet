type SentryInitConfig = {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate: number;
};

let config: SentryInitConfig | null = null;
let initPromise: Promise<(typeof import('@sentry/browser')) | null> | null = null;

async function ensureSentry(): Promise<(typeof import('@sentry/browser')) | null> {
  if (!config?.dsn) return null;
  if (initPromise) return initPromise;
  initPromise = import('@sentry/browser')
    .then((Sentry) => {
      Sentry.init({
        dsn: config!.dsn,
        environment: config!.environment,
        release: config!.release,
        tracesSampleRate: config!.tracesSampleRate,
        sendDefaultPii: false,
      });
      return Sentry;
    })
    .catch(() => null);
  return initPromise;
}

export function scheduleSentryInit(next: SentryInitConfig) {
  config = next;
  if (!next.dsn) return;
  if (typeof window === 'undefined') return;

  let fired = false;
  const fire = () => {
    if (fired) return;
    fired = true;
    cleanup();
    void ensureSentry();
  };
  const cleanup = () => {
    window.removeEventListener('pointerdown', fire);
    window.removeEventListener('keydown', fire);
    window.removeEventListener('scroll', fire);
    window.removeEventListener('touchstart', fire);
  };
  window.addEventListener('pointerdown', fire, { passive: true });
  window.addEventListener('keydown', fire);
  window.addEventListener('scroll', fire, { passive: true });
  window.addEventListener('touchstart', fire, { passive: true });

  const w = window as unknown as {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof w.requestIdleCallback === 'function') {
    const id = w.requestIdleCallback(fire, { timeout: 4500 });
    return () => {
      cleanup();
      w.cancelIdleCallback?.(id);
    };
  }
  const t = window.setTimeout(fire, 3500);
  return () => {
    cleanup();
    window.clearTimeout(t);
  };
}

export async function captureExceptionLazy(
  error: unknown,
  extras?: Record<string, unknown>,
): Promise<void> {
  const Sentry = await ensureSentry();
  if (!Sentry) return;
  try {
    const api = Sentry as unknown as {
      withScope: (cb: (scope: { setExtras: (extras: Record<string, unknown>) => void }) => void) => void;
      captureException: (error: unknown) => void;
    };
    api.withScope((scope) => {
      scope.setExtras(extras ?? {});
      api.captureException(error);
    });
  } catch {
    void 0;
  }
}
