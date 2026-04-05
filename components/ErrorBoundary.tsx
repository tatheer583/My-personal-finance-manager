import React, { ReactNode, ErrorInfo } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary Component
 * @description Catches runtime errors in child components and displays a fallback UI
 * @param {ReactNode} children - Child components to wrap
 * @returns Error UI or normal component tree
 */
export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-8 max-w-md text-center shadow-2xl">
                        <div className="flex justify-center mb-4">
                            <AlertCircle className="w-16 h-16 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-4">
                            Oops! Something went wrong
                        </h1>
                        <p className="text-slate-400 mb-6">
                            An unexpected error occurred. Please refresh the page or contact support.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="text-left bg-slate-900 rounded p-4 mb-6">
                                <summary className="cursor-pointer text-sm font-mono text-red-400 hover:text-red-300">
                                    Error Details
                                </summary>
                                <pre className="text-xs text-slate-300 mt-3 overflow-auto max-h-40">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors duration-200"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
