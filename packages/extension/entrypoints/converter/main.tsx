/**
 * Full-Page Converter Entry Point
 *
 * This is the main conversion interface that opens in a new tab.
 * Provides a stable environment for file handling and conversion,
 * avoiding popup limitations (e.g., closing on file picker in Firefox).
 *
 * Story: Full-page workflow implementation
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../../src/popup/App';
import { ErrorBoundary } from '../../src/popup/components/ErrorBoundary';
import './base.converter.css';
import '../../src/popup/index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
