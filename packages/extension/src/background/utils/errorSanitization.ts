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
 * Sanitizes error message for user display
 * Removes file paths, extension IDs, and replaces technical errors with friendly messages
 *
 * @param message - Raw error message that may contain sensitive information
 * @returns Sanitized, user-friendly error message
 *
 * @example
 * ```ts
 * const error = new Error('Failed at /Users/dev/file.tsx:123');
 * sanitizeErrorMessage(error.message);
 * // Returns: 'Failed at [file]:123'
 * ```
 */
export function sanitizeErrorMessage(message: string): string {
  let sanitized = message;

  // IMPORTANT: Order matters! Do broader patterns first to avoid partial matches

  // Remove generic file:// URIs that may leak paths (before file path regex)
  sanitized = sanitized.replace(/file:\/\/\S+/g, '[file-uri]');

  // Remove Chrome extension IDs (chrome-extension://abcdefghijklmnop...)
  sanitized = sanitized.replace(/chrome-extension:\/\/[a-z0-9]{32}/gi, '[extension]');

  // Remove Firefox extension UUIDs (moz-extension://12345678-1234-1234-1234-123456789abc)
  sanitized = sanitized.replace(/moz-extension:\/\/[a-f0-9-]{36}/gi, '[extension]');

  // Improved regex robustness for edge cases

  // Remove Windows UNC network paths (\\server\share\path\file.tsx)
  sanitized = sanitized.replace(
    /\\\\[^\s\\]+\\\S+\.(?:json|wasm|tsx|jsx|map|ts|js|rs)/gi,
    '[file]',
  );

  // Remove absolute Unix file paths (must have at least 2 path segments: /path/to/file.tsx)
  // This prevents matching relative paths like /background.js
  // Expanded file extensions to cover more cases
  sanitized = sanitized.replace(
    /\/[^/\s]+\/\S+\.(?:json|wasm|html|tsx|jsx|css|map|ts|js|rs)/g,
    '[file]',
  );

  // Remove absolute Windows file paths (C:\path\to\file.tsx)
  // Also handles mixed separators (C:/path/to/file.tsx)
  sanitized = sanitized.replace(
    /[A-Z]:[\\/]\S+\.(?:json|wasm|html|tsx|jsx|css|map|ts|js|rs)/gi,
    '[file]',
  );

  // Replace technical error patterns with user-friendly messages
  const friendlyReplacements: Array<[RegExp, string]> = [
    // WASM errors
    [
      /WASM module not initialized|WebAssembly instantiation failed/i,
      'PDF generator is still loading. Please wait a moment and try again.',
    ],
    [
      /Invalid WASM module|WASM validation failed/i,
      'PDF generator failed to initialize. Please reload the extension.',
    ],

    // Memory errors
    [
      /Out of memory|Memory allocation failed|heap/i,
      'Your CV is too large to process. Try reducing image sizes or content length.',
    ],

    // Parse errors
    [
      /Parse error|Syntax error|unexpected token/i,
      'There was an error reading your CV file. Please check the syntax.',
    ],

    // Network errors
    [
      /Network error|Failed to fetch|CORS|ERR_NETWORK/i,
      'Could not load required resources. Please check your internet connection.',
    ],

    // Font errors
    [
      /Font not found|Failed to load font|font-family/i,
      'A required font could not be loaded. The PDF will use a fallback font.',
    ],
  ];

  // Apply friendly replacements if message contains technical patterns
  for (const [pattern, replacement] of friendlyReplacements) {
    if (pattern.test(sanitized)) {
      return replacement;
    }
  }

  // Return sanitized message if no friendly replacement matched
  return sanitized;
}

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

/**
 * Sanitizes error for console logging
 * Keeps relative paths for debugging but removes sensitive absolute paths
 *
 * @param error - Error object to sanitize
 * @returns Sanitized error with modified stack trace
 */
export function sanitizeErrorForLogging(error: Error): Error {
  const sanitized = new Error(error.message);
  sanitized.name = error.name;

  // Sanitize stack trace (keep relative paths, remove absolute paths)
  if (error.stack !== null && error.stack !== undefined && error.stack !== '') {
    sanitized.stack = sanitizeTechnicalDetails(error.stack);
  } else {
    // Explicitly preserve undefined stack if original had none
    sanitized.stack = undefined;
  }

  return sanitized;
}
