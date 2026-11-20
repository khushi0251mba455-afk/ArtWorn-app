import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected studio error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ArtWorn ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      let friendly = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed?.error) {
          friendly = `Database access notice (${parsed.operationType}): ${parsed.error}`;
        }
      } catch {
        // Not JSON
      }

      return (
        <div className="min-h-screen bg-[#FAF6F0] dark:bg-[#141210] text-[#1F1D1B] dark:text-[#F5EFE6] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#332D27] p-8 shadow-sm text-center">
            <p className="text-xs uppercase tracking-widest text-[#C65D3B] font-semibold">ArtWorn Studio</p>
            <h1 className="font-serif text-2xl font-semibold mt-2">Something went off-canvas</h1>
            <p className="text-sm text-[#5C554E] dark:text-[#B5ADA4] mt-3 leading-relaxed">{friendly}</p>
            <button
              onClick={() => window.location.assign('/')}
              className="mt-6 px-5 py-2.5 rounded-xl bg-[#C65D3B] text-white text-sm font-medium hover:bg-[#B24F30] transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
