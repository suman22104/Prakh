import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'An unexpected interface error occurred.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('Application boundary caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F3EA] flex items-center justify-center p-6">
          <div className="max-w-md w-full ledger-elevated p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#B42318]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h1 className="font-display text-xl font-semibold text-[#132A23]">
                Something went wrong
              </h1>
            </div>
            <p className="text-sm text-[#526058]">
              The application encountered an unexpected error. Your private messages were not saved
              without your consent.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.href = '/';
              }}
              className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#132A23] text-[#FFFDF8] text-sm font-semibold hover:bg-[#1E3B31] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
