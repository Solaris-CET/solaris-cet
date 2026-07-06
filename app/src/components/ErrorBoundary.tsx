import { Component, type ErrorInfo, type ReactNode } from 'react';

import { isChunkLoadFailure, recoverAppOnce } from '../lib/appRecovery';

function asMessage(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'message' in value) {
    const message = (value as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  try {
    return String(value);
  } catch {
    return '';
  }
}

function isStaleRuntimeFailure(value: unknown): boolean {
  const message = asMessage(value);
  if (!message) return false;
  return (
    /useLocation\(\) may be used only in the context of a <Router> component/i.test(message) ||
    /useNavigate\(\) may be used only in the context of a <Router> component/i.test(message) ||
    /useRoutes\(\) may be used only in the context of a <Router> component/i.test(message)
  );
}

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null; countdown: number };

export class ErrorBoundary extends Component<Props, State> {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, countdown: 10 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, countdown: 10 };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);

    // Log to Sentry if available
    try {
      import('../lib/sentryClient').then((mod) => {
        if (typeof mod.captureException === 'function') {
          mod.captureException(error, { extra: { componentStack: info.componentStack } });
        }
      }).catch(() => {});
    } catch {
      // ignore
    }

    if (
      isChunkLoadFailure(error) ||
      isChunkLoadFailure(error?.message) ||
      isStaleRuntimeFailure(error) ||
      isStaleRuntimeFailure(error?.message)
    ) {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      void recoverAppOnce('stale_runtime_recovery');
      return;
    }

    // Start auto-reload countdown
    this.timer = setInterval(() => {
      this.setState((prev) => {
        if (prev.countdown <= 1) {
          if (this.timer) clearInterval(this.timer);
          window.location.reload();
          return { countdown: 0 };
        }
        return { countdown: prev.countdown - 1 };
      });
    }, 1000);
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
  }

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === 'development';

      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-8">
          <div className="max-w-md rounded-3xl border border-white/10 bg-black/30 p-8 text-center">
            <div className="text-6xl mb-4">😔</div>
            <h1 className="text-2xl font-bold text-white">Ceva nu a mers bine</h1>
            <p className="mt-3 text-slate-300">A apărut o eroare neașteptată.</p>

            {isDev && this.state.error && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-left">
                <p className="text-xs font-mono text-red-300 break-all">{this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="mt-2 text-xs font-mono text-red-200/70 whitespace-pre-wrap overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            <p className="mt-4 text-sm text-slate-400">
              Se reîncarcă automat în <strong className="text-amber-400">{this.state.countdown}</strong> secunde...
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="rounded-2xl bg-amber-400 px-6 py-3 text-sm font-black text-black"
              >
                🔄 Reîncarcă pagina
              </button>
              <a
                href="/"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                🏠 Mergi la pagina principală
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
