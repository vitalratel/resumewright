// ABOUTME: Popup entry point that launches the full-page converter.
// ABOUTME: Opens converter in a new tab then closes the popup.

browser.tabs
  .create({ url: browser.runtime.getURL('/converter.html') })
  .then(() => setTimeout(() => window.close(), 2000))
  .catch(() => {
    const msg = document.querySelector('.popup-message');
    if (msg) msg.textContent = 'Error opening converter. Please try again.';
  });
