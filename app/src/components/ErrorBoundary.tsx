import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  /** Custom fallback UI shown when an error is caught. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary — catches JavaScript errors anywhere in the child component
 * tree, logs them, and renders a fallback UI instead of crashing the page.
 *
 * The default fallback offers two recovery actions:
 * - **Try Again** — resets the boundary state so React re-renders the children.
 *   This is the preferred option for transient errors (e.g. network blips).
 * - **Reload Page** — falls back to a full page reload for persistent failures.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MySection />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset() {
    this.setState({ hasError: false, error: undefined });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="py-16 flex items-center justify-center text-white">
          <div className="text-center px-6">
            <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
            <p className="text-gray-400 mb-5 text-sm">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-6 py-2 bg-cyan-500 rounded-lg hover:bg-cyan-400 transition-colors"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-gray-300"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
