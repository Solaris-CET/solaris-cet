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
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div role="alert" className="py-16 flex items-center justify-center text-white">
          <div className="text-center px-6">
            <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
            <p className="text-gray-400 mb-5 text-sm">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-cyan-500 rounded-lg hover:bg-cyan-400 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
