/**
 * Popup Entry Point - Launcher
 *
 * Simplified popup that immediately opens the full-page converter.
 * This avoids popup limitations (closing on file picker, limited space).
 *
 * CSP-FIX: No inline styles (causes CPU throttling from CSP violations)
 */

import browser from 'webextension-polyfill';
import './popup.css';

void (async () => {
  try {
    // Show loading message with better visibility (USABILITY-P1-002)
    // CSP-FIX: Use CSS classes instead of inline styles
    document.body.innerHTML = `
      <div class="popup-container">
        <div class="popup-message">
          Opening converter in new tab...
        </div>
        <div class="popup-subtitle">
          You can close this popup
        </div>
      </div>
    `;

    // Open the converter page in a new tab
    await browser.tabs.create({
      url: browser.runtime.getURL('/converter.html'),
    });

    // Firefox: window.close() from popup is allowed
    // Chromium: window.close() works if popup was opened by user action
    // USABILITY-P1-002: Longer delay (2s) so users see feedback
    setTimeout(() => {
      window.close();
    }, 2000);
  } catch (error) {
    console.error('[Popup] Failed to open converter:', error);
    // If we can't open the tab, show error
    // CSP-FIX: Use CSS class instead of inline styles
    document.body.innerHTML = `
      <div class="popup-error">
        Error opening converter. Please try again.
      </div>
    `;
  }
})();
