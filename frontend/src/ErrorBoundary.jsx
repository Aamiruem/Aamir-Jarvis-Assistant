import { Component } from 'react';

// If any component crashes while rendering, show what happened (and a way out)
// instead of React unmounting everything and leaving a blank dark screen.
export default class ErrorBoundary extends Component {
  state = { error: null, where: '' };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Azarvis UI crashed:', error, info.componentStack);
    this.setState({ where: info.componentStack });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="center-screen">
        <div className="card login stack" role="alert">
          <div className="orb" />
          <h3>Something went wrong on this screen</h3>
          <p className="error crash-msg">{String(error.message || error)}</p>
          {import.meta.env.DEV && this.state.where && <pre className="hint crash-msg">{this.state.where.trim().split('\n').slice(0, 6).join('\n')}</pre>}
          <button className="btn primary full" onClick={() => this.setState({ error: null, where: '' })}>Try again</button>
          <button className="btn ghost full" onClick={() => window.location.reload()}>Reload the page</button>
        </div>
      </div>
    );
  }
}

