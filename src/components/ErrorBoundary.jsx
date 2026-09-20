import { Component } from 'react';

/**
 * Catches runtime errors inside any wrapped page and shows the message
 * on screen instead of a blank white page. Clicking reloads the app.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Page crashed:', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          padding: 24,
          textAlign: 'center',
        }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>
            Something went wrong on this page
          </h1>
          <pre style={{
            maxWidth: 640,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            fontSize: 13,
            color: 'var(--accent-danger)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 16,
          }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            className="btn-primary"
            onClick={() => window.location.assign('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
