/**
 * PDF Download Module
 *
 * Handles PDF file downloads using browser API.
 */

import browser from 'webextension-polyfill';
import { getLogger } from '../../infrastructure/logging';
import { generateFilename } from '../../utils/filenameSanitization';

/**
 * Download PDF bytes as file
 *
 * @param {Uint8Array} pdfBytes - PDF file bytes
 * @param {string} filename - Optional filename (defaults to 'Resume_YYYY-MM-DD.pdf')
 * @returns {Promise<void>} Resolves when download starts successfully
 * @throws {Error} If download fails
 */
export async function downloadPDF(pdfBytes: Uint8Array, filename?: string): Promise<void> {
  // Use fallback filename with proper date stamping
  const downloadFilename = (filename !== null && filename !== undefined && filename !== '') ? filename : generateFilename(undefined);

  getLogger().debug('PdfDownloader', 'Starting download process', {
    pdfSize: pdfBytes.length,
    filename: downloadFilename,
    hasDownloadsAPI: typeof browser.downloads !== 'undefined',
  });

  // Create blob URL (works in popup/TSX extractor context with DOM APIs)
  // Note: This approach uses URL.createObjectURL which requires DOM APIs
  // This function should only be called from popup/TSX extractor, NOT service workers
  // Convert Uint8Array to regular array to satisfy BlobPart type
  const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  getLogger().debug('PdfDownloader', 'Created blob URL', {
    url: blobUrl,
    blobSize: blob.size,
  });

  try {
    // Use browser downloads API (cross-browser compatible via webextension-polyfill)
    if (browser?.downloads === null || browser?.downloads === undefined) {
      getLogger().error('PdfDownloader', 'browser.downloads API not available!');
      throw new Error('browser.downloads API not available');
    }

    getLogger().debug('PdfDownloader', 'Calling browser.downloads.download()', {
      url: blobUrl,
      filename: downloadFilename,
    });

    const downloadId = await browser.downloads.download({
      url: blobUrl,
      filename: downloadFilename,
      saveAs: false, // Auto-download to default location
    });

    getLogger().info('PdfDownloader', 'Download started successfully', {
      downloadId,
      filename: downloadFilename,
    });

    // Clean up blob URL after a short delay (allow browser to read the blob)
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
      getLogger().debug('PdfDownloader', 'Blob URL revoked');
    }, 1000);
  }
  catch (error) {
    // Clean up blob URL on error
    URL.revokeObjectURL(blobUrl);

    getLogger().error('PdfDownloader', 'Download failed', {
      error: error instanceof Error ? error.message : String(error),
      filename: downloadFilename,
    });
    throw new Error(`Download failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

