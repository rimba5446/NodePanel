import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{color: '#f87171', backgroundColor: '#0f172a', padding: '40px', minHeight: '100vh'}}>
          <h1 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '16px'}}>Something went wrong in React</h1>
          <pre style={{backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', overflowX: 'auto'}}>
            {this.state.error?.toString()}
            {'\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
