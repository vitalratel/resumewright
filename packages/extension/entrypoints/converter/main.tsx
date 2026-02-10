/**
 * ABOUTME: Converter entry point that opens the main conversion UI in a new tab.
 * ABOUTME: Wraps the App component with error boundary for crash recovery.
 */

import { ErrorBoundary } from 'solid-js';
import { render } from 'solid-js/web';
import App from '../../src/popup/App';
import './base.converter.css';
import '../../src/popup/index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

render(
  () => (
    <ErrorBoundary fallback={(err) => <div>Something went wrong: {err.message}</div>}>
      <App />
    </ErrorBoundary>
  ),
  root,
);
