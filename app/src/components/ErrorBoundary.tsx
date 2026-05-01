import { Component, type ErrorInfo,type ReactNode } from 'react';

import { isChunkLoadFailure, recoverAppOnce } from '@/lib/appRecovery';
import { shortSkillWhisper, skillSeedFromLabel } from '@/lib/meshSkillFeed';
import { captureExceptionLazy } from '@/lib/sentryClient';

import { getActiveLangSync } from '../hooks/useLanguage';
import translations from '../i18n/translations';

interface Props {
  children: ReactNode;
  /** Custom fallback UI shown when an error is caught. */
  fallback?: ReactNode;
  /** Called after a successful reset so parent components can react (e.g. refetch). */
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

/** Maximum number of in-place retries before offering a full page reload. */
const MAX_RETRIES = 2;

/**
 * ErrorBoundary — catches JavaScript errors anywhere in the child component
 * tree, logs them, and renders a fallback UI instead of crashing the page.
 *
 * Up to `MAX_RETRIES` times the user can retry in-place (the boundary resets
 * its state and attempts to re-render the children). If all retries are
 * exhausted, only the full-page reload option remains.
 *
 * @example
 * ```tsx
 * <ErrorBoundary onReset={() => refetch()}>
 *   <MySection />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    void captureExceptionLazy(error, { componentStack: errorInfo.componentStack });
  }

  /** Reset the error state so the children are re-rendered without a full page reload. */
  private handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: undefined,
      retryCount: prev.retryCount + 1,
    }));
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < MAX_RETRIES;
      const eb = translations[getActiveLangSync()].errorBoundary;
      const canRecover = isChunkLoadFailure(this.state.error);

      return (
        <div
          role="alert"
          className="min-h-dvh flex items-center justify-center bg-slate-950 text-white px-4 py-12"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.55)] p-8 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-solaris-gold/90 mb-3">
              SYSTEM
            </p>
            <h1 className="text-xl font-bold text-solaris-text mb-2">{eb.title}</h1>
            <p className="text-solaris-muted text-sm mb-4 break-words">
              {this.state.error?.message ?? eb.unexpectedMessage}
            </p>
            <p className="text-fuchsia-200/70 mb-6 text-[11px] font-mono leading-snug">
              {shortSkillWhisper(skillSeedFromLabel('errorBoundary|recovery'))}
            </p>
            <a
              href="/sovereign/"
              className="mb-5 block rounded-xl border border-solaris-gold/35 bg-solaris-gold/10 px-4 py-3 text-sm font-semibold text-solaris-gold hover:bg-solaris-gold/15 transition-colors"
            >
              {eb.sovereignLink}
            </a>
            <p className="text-solaris-muted/80 text-[11px] mb-4 leading-relaxed">{eb.sovereignHint}</p>
            <a
              href="/apocalypse/"
              className="mb-5 block rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-solaris-text hover:bg-white/10 transition-colors"
            >
              {eb.apocalypseLink}
            </a>
            <p className="text-solaris-muted/80 text-[11px] mb-6 leading-relaxed">{eb.apocalypseHint}</p>
            <div
              role="group"
              aria-label={eb.recoveryGroupAria}
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3"
            >
              {canRetry && (
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold transition-colors"
                >
                  {eb.tryAgain}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (canRecover) {
                    void recoverAppOnce();
                  } else {
                    window.location.reload();
                  }
                }}
                className={`px-6 py-2.5 rounded-xl font-semibold transition-colors ${
                  canRetry
                    ? 'bg-white/10 hover:bg-white/15 text-solaris-text'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                }`}
              >
                {eb.reloadPage}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
