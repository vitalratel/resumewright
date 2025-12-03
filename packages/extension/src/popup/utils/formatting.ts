/**
 * Formatting Utilities
 * Common formatting functions used across the extension
 */

/**
 * Format file size in bytes to human-readable format
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB", "342.56 KB")
 *
 * @example
 * formatFileSize(1536) // "1.5 KB"
 * formatFileSize(1048576) // "1 MB"
 * formatFileSize(0) // "0 Bytes"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const value = bytes / k ** i;

  // For bytes (B), don't show decimals
  // For KB/MB/GB, always show 1 decimal place
  if (i === 0) {
    // Bytes - no decimal
    return `${Math.round(value)} ${sizes[i]}`;
  } else {
    // KB/MB/GB - always show 1 decimal place
    return `${value.toFixed(1)} ${sizes[i]}`;
  }
}
