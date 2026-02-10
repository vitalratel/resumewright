/**
 * ABOUTME: Popup entry point that launches the full-page converter.
 * ABOUTME: Shows brief feedback then opens converter in a new tab.
 */

import { createSignal, onMount, Show } from 'solid-js';
import { render } from 'solid-js/web';
import './popup.css';

function Popup() {
  const [error, setError] = createSignal(false);

  onMount(() => {
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
  });

  return (
    <Show
      when={!error()}
      fallback={<div class="popup-error">Error opening converter. Please try again.</div>}
    >
      <div class="popup-container">
        <div class="popup-message">Opening converter in new tab...</div>
        <div class="popup-subtitle">You can close this popup</div>
      </div>
    </Show>
  );
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

render(() => <Popup />, root);
