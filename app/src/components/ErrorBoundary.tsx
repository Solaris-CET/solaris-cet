import { Component, type ReactNode, type ErrorInfo } from 'react';
import translations, { type LangCode } from '../i18n/translations';
import { SUPPORTED_LANGS } from '../hooks/useLanguage';
import { shortSkillWhisper, skillSeedFromLabel } from '@/lib/meshSkillFeed';

/** Matches `useLanguage` / `localStorage` so the boundary UI respects the selected locale. */
function getLang(): LangCode {
  if (typeof window === 'undefined') return 'en';
  try {
    const s = localStorage.getItem('solaris_lang');
    if (s && (SUPPORTED_LANGS as readonly string[]).includes(s)) return s as LangCode;
  } catch {
    /* ignore */
  }
  return 'en';
}

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
      const eb = translations[getLang()].errorBoundary;

      return (
        <div role="alert" className="py-16 flex items-center justify-center text-white">
          <div className="text-center px-6">
            <h1 className="text-2xl font-bold mb-3">{eb.title}</h1>
            <p className="text-gray-400 mb-5 text-sm">
              {this.state.error?.message ?? eb.unexpectedMessage}
            </p>
            <p className="text-fuchsia-200/70 mb-5 text-[11px] font-mono leading-snug max-w-md mx-auto">
              {shortSkillWhisper(skillSeedFromLabel('errorBoundary|recovery'))}
            </p>
            <div
              role="group"
              aria-label={eb.recoveryGroupAria}
              className="flex items-center justify-center gap-3 flex-wrap"
            >
              {canRetry && (
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="px-6 py-2 bg-cyan-500 rounded-lg hover:bg-cyan-400 transition-all duration-200"
                >
                  {eb.tryAgain}
                </button>
              )}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                  canRetry
                    ? 'bg-white/10 hover:bg-white/20 text-gray-300'
                    : 'bg-cyan-500 hover:bg-cyan-400'
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
