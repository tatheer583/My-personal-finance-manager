import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render-time errors anywhere in the tree and shows a recoverable
 * screen instead of a blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[finance] Unhandled error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-canvas p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-pop">
            <div className="mb-4 flex justify-center">
              <TriangleAlert className="size-12 text-negative" aria-hidden="true" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-fg">Something went wrong</h1>
            <p className="mb-6 text-sm leading-relaxed text-muted">
              An unexpected error interrupted the app. Your saved data is safe — reloading
              usually fixes it.
            </p>

            {import.meta.env.DEV && this.state.error ? (
              <details className="mb-6 rounded-lg bg-surface-2 p-3 text-left">
                <summary className="cursor-pointer text-xs font-medium text-negative">
                  Error details
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto text-xs text-muted">
                  {this.state.error.message}
                </pre>
              </details>
            ) : null}

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Reload the app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
