/**
 * Error Sanitization Utility
 * Sanitize error messages to prevent information disclosure
 *
 * Removes sensitive information from error messages before displaying to users:
 * - Absolute file paths (Unix & Windows)
 * - Chrome/Firefox extension IDs
 * - Internal system details
 *
 * Full error details are preserved in console logs for debugging.
 */

/**
 * Sanitizes technical details (like stack traces) for user display
 * Less aggressive than message sanitization - keeps some context
 *
 * @param details - Technical error details or stack trace
 * @returns Sanitized technical details with paths redacted
 *
 * @example
 * ```ts
 * const stack = 'Error at /home/user/project/packages/extension/src/file.ts:42';
 * sanitizeTechnicalDetails(stack);
 * // Returns: 'Error at packages/extension/src/file.ts:42'
 * ```
 */
export function sanitizeTechnicalDetails(details: string | undefined): string | undefined {
  if (details === null || details === undefined || details === '') {
    return details;
  }

  let sanitized = details;

  // Remove Chrome/Firefox extension IDs (before path replacement)
  sanitized = sanitized.replace(/chrome-extension:\/\/[a-z0-9]{32}/gi, '[extension]');
  sanitized = sanitized.replace(/moz-extension:\/\/[a-f0-9-]{36}/gi, '[extension]');

  // Improved path sanitization with better edge case handling

  // Replace absolute paths with relative paths (keep packages/... for context)
  // Match: /any/path/to/packages/extension/src/file.ts
  // Keep: packages/extension/src/file.ts
  // Unix-style paths
  sanitized = sanitized.replace(/\/\S*(packages\/\S+)/g, '$1');
  // Windows-style paths (both \ and / separators)
  sanitized = sanitized.replace(/[A-Z]:[\\/]\S*(packages[\\/]\S+)/gi, '$1');
  // UNC network paths
  sanitized = sanitized.replace(/\\\\[^\s\\]+\\\S*(packages\\\S+)/gi, '$1');

  // Remove user home directories
  sanitized = sanitized.replace(/\/home\/[^/\s]+/g, '/home/[user]');
  sanitized = sanitized.replace(/\/Users\/[^/\s]+/g, '/Users/[user]');
  // Windows user directories (handle both backslash and forward slash)
  sanitized = sanitized.replace(/C:[\\/]Users[\\/][^\\/\s]+/gi, 'C:\\Users\\[user]');

  // Remove symlink indicators that might leak paths
  sanitized = sanitized.replace(/-> \/\S+/g, '-> [symlink]');

  return sanitized;
}
