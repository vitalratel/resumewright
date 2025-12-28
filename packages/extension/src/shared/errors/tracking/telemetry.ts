// ABOUTME: Clipboard export utilities for error reports.
// ABOUTME: Provides formatting for error reports that users can copy for bug reports.

import { getLogger } from '../../infrastructure/logging/instance';

/**
 * Format timestamp for display
 * Format: YYYY-MM-DD HH:MM:SS
 */
export function formatErrorTimestamp(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Error details for copying to clipboard
 */
export interface ErrorDetails {
  timestamp: string;
  code: string;
  message: string;
  category?: string;
  technicalDetails?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Format error details for clipboard copy
 */
export function formatErrorDetailsForClipboard(details: ErrorDetails): string {
  const lines: string[] = [
    '=== ResumeWright Error Report ===',
    '',
    `Error Code: ${details.code}`,
    `Timestamp: ${details.timestamp}`,
    `Category: ${details.category !== null && details.category !== undefined && details.category !== '' ? details.category : 'N/A'}`,
    '',
    '--- User-Facing Message ---',
    details.message,
  ];

  if (
    details.technicalDetails !== null &&
    details.technicalDetails !== undefined &&
    details.technicalDetails !== ''
  ) {
    lines.push('', '--- Technical Details ---', details.technicalDetails);
  }

  if (
    details.metadata !== null &&
    details.metadata !== undefined &&
    Object.keys(details.metadata).length > 0
  ) {
    lines.push('', '--- Metadata ---', JSON.stringify(details.metadata, null, 2));
  }

  lines.push('', '=== End of Error Report ===');

  return lines.join('\n');
}

/**
 * Copy text to clipboard
 * Returns true if successful, false otherwise
 *
 * Uses the modern Clipboard API, which is supported in all target browsers:
 * - Chrome 63+ (2017)
 * - Edge 79+ (2020)
 * - Firefox 53+ (2017)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Clipboard API is available in all modern browsers
    if (typeof navigator.clipboard?.writeText !== 'function') {
      getLogger().error('ErrorTelemetry', 'Clipboard API not available');
      return false;
    }

    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    getLogger().error('ErrorTelemetry', 'Failed to copy to clipboard', error);
    return false;
  }
}
