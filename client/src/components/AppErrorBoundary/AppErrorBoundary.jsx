import { Component } from 'react';
import styles from './AppErrorBoundary.module.css';

export class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className={styles.fallback} role="alert">
        <p className={styles.eyebrow}>FORMULA DELTA</p>
        <h1>Dashboard temporarily unavailable</h1>
        <p>The live state contained an unexpected value. Reconnect to continue.</p>
        <button type="button" onClick={() => window.location.reload()}>
          Reload dashboard
        </button>
      </main>
    );
  }
}
