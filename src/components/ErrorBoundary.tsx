import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-800 rounded-lg p-6 shadow-xl">
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              Coś poszło nie tak
            </h1>
            <div className="bg-slate-900 rounded p-4 mb-4">
              <p className="text-red-300 font-semibold mb-2">Błąd:</p>
              <pre className="text-sm text-slate-300 whitespace-pre-wrap break-words">
                {this.state.error?.toString()}
              </pre>
            </div>
            {this.state.errorInfo && (
              <div className="bg-slate-900 rounded p-4 mb-4">
                <p className="text-yellow-300 font-semibold mb-2">Stack trace:</p>
                <pre className="text-xs text-slate-400 whitespace-pre-wrap break-words max-h-64 overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-semibold transition"
              >
                Odśwież stronę
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-semibold transition"
              >
                Wyczyść dane i odśwież
              </button>
            </div>
            <p className="text-sm text-slate-400 mt-4 text-center">
              Jeśli problem się powtarza, skontaktuj się z supportem
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
