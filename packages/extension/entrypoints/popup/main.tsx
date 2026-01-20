/**
 * ABOUTME: Popup entry point that launches the full-page converter.
 * ABOUTME: Shows brief feedback then opens converter in a new tab.
 */

import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './popup.css';

function Popup() {
  const [error, setError] = useState(false);

  useEffect(() => {
    const openConverter = async () => {
      try {
        await browser.tabs.create({
          url: browser.runtime.getURL('/converter.html'),
        });

        setTimeout(() => {
          window.close();
        }, 2000);
      } catch {
        setError(true);
      }
    };

    openConverter();
  }, []);

  if (error) {
    return <div className="popup-error">Error opening converter. Please try again.</div>;
  }

  return (
    <div className="popup-container">
      <div className="popup-message">Opening converter in new tab...</div>
      <div className="popup-subtitle">You can close this popup</div>
    </div>
  );
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

createRoot(root).render(<Popup />);
