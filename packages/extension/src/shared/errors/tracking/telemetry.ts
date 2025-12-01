/**
 * Error Tracking and Telemetry
 *
 * Provides error tracking with local telemetry storage for debugging.
 * Privacy-focused: Stores errors locally in chrome.storage.local, no external reporting.
 * Users can export error logs for bug reports.
 */

import { getLogger } from '../../infrastructure/logging';
import { localExtStorage } from '../../infrastructure/storage';

/**
 * Generate a unique error ID based on timestamp and random component
 * Format: ERR-YYYYMMDD-HHMMSS-XXXX
 * Example: ERR-20251018-143025-A3F2
 */
export function generateErrorId(): string {
  const now = new Date();

  // Date component: YYYYMMDD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Time component: HHMMSS
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeStr = `${hours}${minutes}${seconds}`;

  // Random component: 4 hex chars for uniqueness
  const randomStr = Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, '0');

  return `ERR-${dateStr}-${timeStr}-${randomStr}`;
}

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
  errorId: string;
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
    `Error ID: ${details.errorId}`,
    `Timestamp: ${details.timestamp}`,
    `Error Code: ${details.code}`,
    `Category: ${(details.category !== null && details.category !== undefined && details.category !== '') ? details.category : 'N/A'}`,
    '',
    '--- User-Facing Message ---',
    details.message,
  ];

  if (details.technicalDetails !== null && details.technicalDetails !== undefined && details.technicalDetails !== '') {
    lines.push('', '--- Technical Details ---', details.technicalDetails);
  }

  if ((details.metadata !== null && details.metadata !== undefined) && Object.keys(details.metadata).length > 0) {
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
  }
  catch (error) {
    getLogger().error('ErrorTelemetry', 'Failed to copy to clipboard', error);
    return false;
  }
}

// =======================
// Error Telemetry System
// =======================

/**
 * Stored error event for telemetry
 */
export interface ErrorEvent {
  errorId: string;
  timestamp: number;
  code: string;
  message: string;
  category?: string;
  technicalDetails?: string;
  metadata?: Record<string, unknown>;
  context: {
    url?: string;
    userAgent?: string;
    extensionVersion?: string;
  };
}

/**
 * Maximum number of errors to store (prevent unbounded growth)
 */
const MAX_STORED_ERRORS = 100;

/**
 * Maximum age of errors to keep (30 days in milliseconds)
 */
const MAX_ERROR_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const logger = getLogger();

/**
 * Track an error in local telemetry
 *
 * Stores error details in chrome.storage.local for later export/debugging.
 * Automatically manages storage limits (max 100 errors, 30 days retention).
 *
 * @param details - Error details to track
 * @returns Promise that resolves when error is stored
 */
export async function trackError(details: ErrorDetails): Promise<void> {
  try {
    // Check if telemetry is enabled
    const settings = await localExtStorage.getItem('resumewright-settings');
    if (settings?.telemetryEnabled === false) {
      logger.debug('ErrorTelemetry', 'Telemetry disabled, skipping error tracking');
      return;
    }

    // Create error event
    const event: ErrorEvent = {
      errorId: details.errorId,
      timestamp: Date.now(),
      code: details.code,
      message: details.message,
      category: details.category,
      technicalDetails: details.technicalDetails,
      metadata: details.metadata,
      context: {
        url: typeof window !== 'undefined' ? window.location?.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        extensionVersion: browser.runtime.getManifest().version,
      },
    };

    // Get existing errors
    let errors: ErrorEvent[] = await localExtStorage.getItem('errorTelemetry') ?? [];

    // Clean old errors
    const now = Date.now();
    errors = errors.filter(e => now - e.timestamp < MAX_ERROR_AGE_MS);

    // Add new error
    errors.push(event);

    // Enforce max limit (keep most recent)
    if (errors.length > MAX_STORED_ERRORS) {
      errors = errors.slice(-MAX_STORED_ERRORS);
    }

    // Save back to storage
    await localExtStorage.setItem('errorTelemetry', errors);

    logger.debug('ErrorTelemetry', 'Error tracked', {
      errorId: details.errorId,
      code: details.code,
      totalStored: errors.length,
    });
  }
  catch (error) {
    // Don't fail the app if telemetry fails
    logger.error('ErrorTelemetry', 'Failed to track error', error);
  }
}

/**
 * Get all stored error events
 *
 * @returns Promise resolving to array of stored errors
 */
export async function getStoredErrors(): Promise<ErrorEvent[]> {
  try {
    return await localExtStorage.getItem('errorTelemetry') ?? [];
  }
  catch (error) {
    logger.error('ErrorTelemetry', 'Failed to get stored errors', error);
    return [];
  }
}

/**
 * Clear all stored error events
 *
 * @returns Promise that resolves when errors are cleared
 */
export async function clearStoredErrors(): Promise<void> {
  try {
    await localExtStorage.removeItem('errorTelemetry');
    logger.info('ErrorTelemetry', 'Cleared all stored errors');
  }
  catch (error) {
    logger.error('ErrorTelemetry', 'Failed to clear stored errors', error);
    throw error;
  }
}

/**
 * Export stored errors as JSON string for bug reports
 *
 * @returns Promise resolving to JSON string of all errors
 */
export async function exportErrors(): Promise<string> {
  try {
    const errors = await getStoredErrors();
    return JSON.stringify(errors, null, 2);
  }
  catch (error) {
    logger.error('ErrorTelemetry', 'Failed to export errors', error);
    throw error;
  }
}

/**
 * Get telemetry statistics
 *
 * @returns Promise resolving to telemetry stats
 */
export async function getTelemetryStats(): Promise<{
  totalErrors: number;
  errorsByCode: Record<string, number>;
  errorsByCategory: Record<string, number>;
  oldestError: number | null;
  newestError: number | null;
}> {
  try {
    const errors = await getStoredErrors();

    if (errors.length === 0) {
      return {
        totalErrors: 0,
        errorsByCode: {},
        errorsByCategory: {},
        oldestError: null,
        newestError: null,
      };
    }

    const errorsByCode: Record<string, number> = {};
    const errorsByCategory: Record<string, number> = {};

    errors.forEach((error) => {
      errorsByCode[error.code] = (errorsByCode[error.code] || 0) + 1;
      if (error.category !== null && error.category !== undefined && error.category !== '') {
        errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      }
    });

    return {
      totalErrors: errors.length,
      errorsByCode,
      errorsByCategory,
      oldestError: Math.min(...errors.map(e => e.timestamp)),
      newestError: Math.max(...errors.map(e => e.timestamp)),
    };
  }
  catch (error) {
    logger.error('ErrorTelemetry', 'Failed to get telemetry stats', error);
    throw error;
  }
}

// Backward compatibility alias
export { trackError as logErrorToService };
