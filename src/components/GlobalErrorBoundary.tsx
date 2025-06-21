import React from 'react';

export class GlobalErrorBoundary extends React.Component<{
  children: React.ReactNode
}, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Log error to console or external service
    console.error('Global error boundary caught:', error, errorInfo);
    alert('A critical error occurred: ' + (error?.message || error));
  }

  render() {
    if (this.state.hasError) {
      return <div style={{ color: 'red', padding: 24 }}>A critical error occurred: {String(this.state.error?.message || this.state.error)}</div>;
    }
    return this.props.children;
  }
}
