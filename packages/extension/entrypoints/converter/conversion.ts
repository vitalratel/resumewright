// ABOUTME: Conversion module — drives the PDF conversion pipeline via background messaging.
// ABOUTME: Handles export click, progress updates, success download, error display, and countdown.

import { formatFileSize } from '@/popup/utils/formatting';
import { getLogger } from '@/shared/infrastructure/logging/instance';
import { onMessage, sendMessage } from '@/shared/messaging';
import type {
  ConversionCompletePayload,
  ConversionErrorPayload,
  ConversionProgressPayload,
} from '@/shared/types/messages';
import type { UIState } from './converter';
import { getElement } from './dom';
import { clearImportedFile, getImportedFile } from './file-import';

interface ConversionDeps {
  showState: (state: UIState) => void;
  announce: (message: string, assertive?: boolean) => void;
  getCurrentState: () => UIState;
}

// ─── Countdown state ─────────────────────────────────────────────────────────

const COUNTDOWN_SECONDS = 20;
let countdownTimer: ReturnType<typeof setInterval> | null = null;
let countdownRemaining = COUNTDOWN_SECONDS;
let countdownPaused = false;

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initConversion(deps: ConversionDeps): void {
  const { showState, announce, getCurrentState } = deps;

  // Export button
  getElement('btn-export').addEventListener('click', () => {
    handleExport(deps);
  });

  // Cancel button (during conversion)
  getElement('btn-cancel').addEventListener('click', () => {
    stopCountdown();
    clearImportedFile();
    showState('import');
    announce('Conversion cancelled');
  });

  // Success state actions
  getElement('btn-convert-another').addEventListener('click', () => {
    stopCountdown();
    clearImportedFile();
    showState('import');
    announce('Ready to import another file');
  });

  getElement('btn-pause-countdown').addEventListener('click', () => {
    toggleCountdown();
  });

  getElement('btn-close-tab').addEventListener('click', () => {
    stopCountdown();
    window.close();
  });

  // Copy filename button
  getElement('btn-copy-filename').addEventListener('click', async () => {
    const filename = getElement('success-filename').textContent ?? '';
    try {
      await navigator.clipboard.writeText(filename);
      announce('Filename copied');
    } catch {
      // Clipboard not available — silently ignore
    }
  });

  // Error state actions
  getElement('btn-retry').addEventListener('click', () => {
    handleExport(deps);
  });

  getElement('btn-import-different').addEventListener('click', () => {
    clearImportedFile();
    showState('import');
    announce('Ready to import a different file');
  });

  getElement('btn-report-issue').addEventListener('click', async () => {
    const message = getElement('error-message').textContent ?? '';
    const technical = getElement('error-technical').textContent ?? '';
    const report = technical ? `${message}\n\nTechnical details:\n${technical}` : message;
    try {
      await navigator.clipboard.writeText(report);
      announce('Error details copied to clipboard');
    } catch {
      // Clipboard not available — silently ignore
    }
  });

  // Subscribe to background messages
  onMessage('conversionProgress', ({ data }) => {
    if (getCurrentState() === 'converting') {
      handleProgress(data);
    }
  });

  onMessage('conversionComplete', ({ data }) => {
    handleComplete(data, deps);
  });

  onMessage('conversionError', ({ data }) => {
    handleError(data, deps);
  });
}

// ─── Export handler ───────────────────────────────────────────────────────────

async function handleExport(deps: ConversionDeps): Promise<void> {
  const { showState, announce } = deps;

  const file = getImportedFile();
  if (!file) {
    announce('No file imported', true);
    return;
  }

  showState('converting');
  announce('Starting conversion…');
  resetProgressUI();

  // Hide retry button (shown only after retryable error)
  getElement('btn-retry').hidden = true;

  try {
    getLogger().info('Conversion', 'Sending conversion request', {
      fileName: file.name,
      contentLength: file.content.length,
    });
    await sendMessage('startConversion', { tsx: file.content, fileName: file.name });
    getLogger().info('Conversion', 'Conversion request sent');
  } catch (err) {
    getLogger().error('Conversion', 'Failed to start conversion', err);
    showConversionError(
      {
        jobId: 'default',
        error: {
          code: 'CONVERSION_START_FAILED' as never,
          message: "We couldn't start converting your CV. This might be a temporary issue.",
          recoverable: true,
          suggestions: ['Try converting again', 'Reload the extension and try again'],
          technicalDetails: err instanceof Error ? err.message : String(err),
        },
      },
      deps,
    );
  }
}

// ─── Progress handler ─────────────────────────────────────────────────────────

function handleProgress(payload: ConversionProgressPayload): void {
  const { progress } = payload;
  const pct = Math.round(progress.percentage);

  getElement('progress-bar-fill').style.width = `${pct}%`;
  getElement('progress-bar-container').setAttribute('aria-valuenow', String(pct));
  getElement('progress-percent').textContent = `${pct}%`;
  getElement('progress-stage').textContent = progress.currentOperation;
}

function resetProgressUI(): void {
  getElement('progress-bar-fill').style.width = '0%';
  getElement('progress-bar-container').setAttribute('aria-valuenow', '0');
  getElement('progress-percent').textContent = '0%';
  getElement('progress-stage').textContent = '';
}

// ─── Complete handler ─────────────────────────────────────────────────────────

async function handleComplete(
  payload: ConversionCompletePayload,
  deps: ConversionDeps,
): Promise<void> {
  const { showState, announce } = deps;
  const filename = payload.filename ?? 'resume.pdf';

  // Trigger download
  try {
    const blob = new Blob([payload.pdfBytes as BlobPart], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    await browser.downloads.download({ url: blobUrl, filename, saveAs: false });
    URL.revokeObjectURL(blobUrl);
    getLogger().info('Conversion', 'PDF download triggered', {
      filename,
      fileSize: payload.fileSize,
    });
  } catch (err) {
    getLogger().error('Conversion', 'Download failed', err);
    // Continue to success state even if download fails — user sees the file info
  }

  // Populate success state
  getElement('success-filename').textContent = filename;
  getElement('success-filesize').textContent = formatFileSize(payload.fileSize);
  getElement('success-duration').textContent = `${(payload.duration / 1000).toFixed(1)}s`;

  showState('success');
  announce(`PDF ready: ${filename}. Downloaded to your computer.`);

  // Start countdown to auto-close
  startCountdown();
}

// ─── Error handler ────────────────────────────────────────────────────────────

function handleError(payload: ConversionErrorPayload, deps: ConversionDeps): void {
  showConversionError(payload, deps);
}

function showConversionError(payload: ConversionErrorPayload, deps: ConversionDeps): void {
  const { showState, announce } = deps;
  const { error } = payload;

  getElement('error-category').textContent = error.category ?? '';
  getElement('error-message').textContent = error.message;

  // Suggestions list — first item is the most likely fix
  const ul = getElement('error-suggestions');
  ul.innerHTML = '';
  error.suggestions.forEach((suggestion, i) => {
    const li = document.createElement('li');
    if (i === 0) {
      const badge = document.createElement('span');
      badge.textContent = 'Most likely';
      badge.className =
        'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-success/10 text-success border border-success/20 mr-2';
      li.appendChild(badge);
      li.appendChild(document.createTextNode(suggestion));
    } else {
      li.textContent = suggestion;
    }
    ul.appendChild(li);
  });

  // Technical details
  const detailsContainer = getElement('error-details-container');
  if (error.technicalDetails) {
    getElement('error-technical').textContent = error.technicalDetails;
    detailsContainer.classList.remove('hidden');
  } else {
    detailsContainer.classList.add('hidden');
  }

  // Show retry button only for recoverable errors
  getElement('btn-retry').hidden = !error.recoverable;

  showState('error');
  announce(`Conversion failed: ${error.message}`, true);
  getLogger().error('Conversion', 'Conversion error', { code: error.code, message: error.message });
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function startCountdown(): void {
  countdownRemaining = COUNTDOWN_SECONDS;
  countdownPaused = false;
  updateCountdownDisplay();

  const btn = getElement('btn-pause-countdown');
  btn.textContent = 'Pause';

  countdownTimer = setInterval(() => {
    if (countdownPaused) return;

    countdownRemaining -= 1;
    updateCountdownDisplay();

    if (countdownRemaining <= 0) {
      stopCountdown();
      window.close();
    }
  }, 1000);
}

function stopCountdown(): void {
  if (countdownTimer !== null) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function toggleCountdown(): void {
  countdownPaused = !countdownPaused;
  const btn = getElement('btn-pause-countdown');
  btn.textContent = countdownPaused ? 'Resume' : 'Pause';
}

function updateCountdownDisplay(): void {
  getElement('countdown-seconds').textContent = String(countdownRemaining);
}
