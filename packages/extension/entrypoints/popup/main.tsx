/**
 * Popup Entry Point - Launcher
 *
 * Simplified popup that immediately opens the full-page converter.
 * This avoids popup limitations (closing on file picker, limited space).
 *
 * Security: Uses DOM APIs instead of innerHTML to avoid Firefox AMO warnings
 */

import './popup.css';

/**
 * Creates DOM elements safely without innerHTML
 */
function createLoadingUI(): void {
  const container = document.createElement('div');
  container.className = 'popup-container';

  const message = document.createElement('div');
  message.className = 'popup-message';
  message.textContent = 'Opening converter in new tab...';

  const subtitle = document.createElement('div');
  subtitle.className = 'popup-subtitle';
  subtitle.textContent = 'You can close this popup';

  container.appendChild(message);
  container.appendChild(subtitle);
  document.body.appendChild(container);
}

/**
 * Creates error UI safely without innerHTML
 */
function createErrorUI(): void {
  document.body.textContent = ''; // Clear existing content safely

  const errorDiv = document.createElement('div');
  errorDiv.className = 'popup-error';
  errorDiv.textContent = 'Error opening converter. Please try again.';

  document.body.appendChild(errorDiv);
}

void (async () => {
  try {
    createLoadingUI();

    // Open the converter page in a new tab
    await browser.tabs.create({
      url: browser.runtime.getURL('/converter.html'),
    });

    // Close popup after delay so users see feedback
    // Firefox: window.close() from popup is allowed
    // Chromium: window.close() works if popup was opened by user action
    setTimeout(() => {
      window.close();
    }, 2000);
  } catch {
    createErrorUI();
  }
})();
