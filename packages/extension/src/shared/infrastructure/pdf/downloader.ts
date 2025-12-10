// ABOUTME: PDF download module using browser.downloads API.
// ABOUTME: Creates blob URL from PDF bytes and triggers browser download.

import { getLogger } from '../../infrastructure/logging/instance';
import { generateFilename } from '../../utils/filenameSanitization';

/**
 * Download PDF bytes as file using browser.downloads API.
 * Must be called from popup context (requires DOM APIs for blob URL).
 */
export async function downloadPDF(pdfBytes: Uint8Array, filename?: string): Promise<void> {
  const downloadFilename = filename || generateFilename(undefined);
  const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  try {
    if (!browser?.downloads) {
      throw new Error('browser.downloads API not available');
    }

    await browser.downloads.download({ url: blobUrl, filename: downloadFilename, saveAs: false });
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (error) {
    URL.revokeObjectURL(blobUrl);
    getLogger().error('PdfDownloader', 'Download failed', { error, filename: downloadFilename });
    throw new Error(`Download failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
