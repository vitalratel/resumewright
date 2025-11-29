/**
 * Error Messages
 *
 * User-friendly error messages for each error code.
 */

import { ErrorCode } from './codes';

/**
 * Error Code to Human-Readable Message Mapping
 *
 * Provides default user-friendly messages for each error code.
 */
export const ERROR_MESSAGES: Record<ErrorCode, { title: string; description: string }> = {
  // Detection errors

  // Parsing errors (Simplified, plain language)
  [ErrorCode.TSX_PARSE_ERROR]: {
    title: 'Invalid CV file format',
    description: 'This file has invalid CV code. Try regenerating it in Claude or importing a different file.',
  },
  [ErrorCode.INVALID_TSX_STRUCTURE]: {
    title: 'Your CV structure isn\'t valid',
    description: 'The CV code doesn\'t match the expected format. Some required sections might be missing or incorrectly organized.',
  },

  // WASM errors (Simplified, plain language)
  [ErrorCode.WASM_INIT_FAILED]: {
    title: 'PDF converter couldn\'t start',
    description: 'Try reloading the extension or waiting a few seconds. If you\'re offline, connect to the internet and try again.',
  },
  [ErrorCode.WASM_EXECUTION_ERROR]: {
    title: 'Conversion failed unexpectedly',
    description: 'Something went wrong while converting your CV. This is usually temporary—try converting again.',
  },

  // PDF generation errors (Simplified, plain language)
  [ErrorCode.PDF_GENERATION_FAILED]: {
    title: 'Couldn\'t create your PDF',
    description: 'PDF generation failed, possibly due to complex formatting. Try simplifying your CV or using a different layout.',
  },
  [ErrorCode.PDF_LAYOUT_ERROR]: {
    title: 'We couldn\'t fit your content on the page',
    description: 'Your CV content is too wide or too tall for the page size you selected. This often happens with long text or large sections.',
  },

  // Download errors
  [ErrorCode.DOWNLOAD_FAILED]: {
    title: 'Couldn\'t download your PDF',
    description: 'The PDF was generated but couldn\'t be downloaded. Check your browser\'s download permissions and try again.',
  },

  // Resource errors (Simplified, plain language)
  [ErrorCode.FONT_LOAD_ERROR]: {
    title: 'Couldn\'t load fonts',
    description: 'Custom fonts didn\'t load. Check your internet connection or try using standard fonts instead.',
  },
  [ErrorCode.MEMORY_LIMIT_EXCEEDED]: {
    title: 'CV file is too large',
    description: 'Your CV is too big to process. Try simplifying it by removing sections, shortening text, or closing other browser tabs.',
  },

  // Timeout errors
  [ErrorCode.RENDER_TIMEOUT]: {
    title: 'Conversion is taking longer than expected',
    description: 'Your CV is very detailed and taking a while to process. We stopped to avoid freezing your browser.',
  },
  [ErrorCode.CONVERSION_TIMEOUT]: {
    title: 'Conversion took too long',
    description: 'The conversion didn\'t finish within the time limit. This usually happens with very complex or large CVs.',
  },

  // Conversion start errors
  [ErrorCode.CONVERSION_START_FAILED]: {
    title: 'Conversion couldn\'t start',
    description: 'The conversion process failed to start. This might be due to invalid CV code or a temporary issue.',
  },

  // Permission errors
  [ErrorCode.BROWSER_PERMISSION_DENIED]: {
    title: 'Extension needs page access',
    description: 'We need permission to read the CV code from this Claude.ai tab. You can grant this in your browser\'s extension settings.',
  },
  [ErrorCode.STORAGE_QUOTA_EXCEEDED]: {
    title: 'Browser storage is full',
    description: 'Your browser\'s storage is full and we can\'t save your settings or conversion history. You\'ll need to clear some space.',
  },

  // Validation errors
  [ErrorCode.INVALID_CONFIG]: {
    title: 'Your settings aren\'t valid',
    description: 'Some of your PDF settings (like page size or margins) have invalid values. We\'ve reset them to defaults.',
  },
  [ErrorCode.INVALID_METADATA]: {
    title: 'Your CV is missing required information',
    description: 'We need certain information (like your name) to create a proper CV. Check that your CV includes contact details.',
  },

  // Network errors
  [ErrorCode.NETWORK_ERROR]: {
    title: 'Connection problem',
    description: 'We couldn\'t connect to load necessary resources. Check your internet connection and try again.',
  },

  // Generic errors
  [ErrorCode.UNKNOWN_ERROR]: {
    title: 'Something unexpected happened',
    description: 'We encountered an error we didn\'t anticipate. This might be a bug. Please try again or report this issue.',
  },
};

/**
 * Error Code Suggestions
 *
 * Provides actionable suggestions for users to resolve errors.
 */
export const ERROR_SUGGESTIONS: Record<ErrorCode, string[]> = {
  [ErrorCode.TSX_PARSE_ERROR]: [
    'Check the line number below to see where the error is',
    'Ask Claude to regenerate your CV',
    'Copy the CV code again from Claude carefully',
    'Contact support if this keeps happening',
  ],
  [ErrorCode.INVALID_TSX_STRUCTURE]: [
    'Ask Claude to generate a properly formatted CV',
    'Make sure the CV includes all standard sections (name, experience, education)',
    'Try starting fresh with a new CV request to Claude',
  ],
  [ErrorCode.WASM_INIT_FAILED]: [
    'Wait a few seconds and click "Try Again"',
    'Refresh the page to restart the extension',
    'Check your internet connection',
    'Restart your browser if the problem continues',
  ],
  [ErrorCode.WASM_EXECUTION_ERROR]: [
    'Click "Try Again" to retry the conversion',
    'Refresh the page and try again',
    'Contact support if this error keeps appearing',
  ],
  [ErrorCode.PDF_GENERATION_FAILED]: [
    'Try simplifying your CV by removing some sections',
    'Reduce the number of bullet points or details',
    'Try a different page size in Settings (e.g., Letter instead of A4)',
    'Contact support if you need help',
  ],
  [ErrorCode.PDF_LAYOUT_ERROR]: [
    'Increase the page margins in Settings',
    'Use a larger page size (Letter instead of A4)',
    'Reduce the font size in Settings',
    'Simplify complex formatting or long text blocks',
  ],
  [ErrorCode.DOWNLOAD_FAILED]: [
    'Try exporting the file again',
    'Check browser download permissions',
    'Make sure downloads are not blocked by your browser',
    'Try a different browser if the issue persists',
  ],
  [ErrorCode.FONT_LOAD_ERROR]: [
    'Check your internet connection',
    'Try using a standard font instead of custom fonts',
    'Disable custom fonts in Settings',
    'Refresh the page and try again',
  ],
  [ErrorCode.MEMORY_LIMIT_EXCEEDED]: [
    'Reduce CV length by removing or shortening sections',
    'Remove images or complex graphics',
    'Simplify formatting (use basic styles instead of complex layouts)',
    'Split content into multiple documents (e.g., CV + publications)',
    'Use shorter bullet points and descriptions',
  ],
  [ErrorCode.RENDER_TIMEOUT]: [
    'Remove some sections or reduce detail',
    'Simplify complex formatting',
    'Wait a moment and try again',
    'Split very long CVs into multiple documents',
  ],
  [ErrorCode.CONVERSION_TIMEOUT]: [
    'Try a simpler, shorter CV',
    'Remove images or complex formatting',
    'Split your CV into multiple parts',
    'Close other browser tabs to free up resources',
  ],
  [ErrorCode.CONVERSION_START_FAILED]: [
    'Click "Try Again" to retry the conversion',
    'Refresh the page and try again',
    'Ask Claude to regenerate your CV',
    'Contact support if this keeps happening',
  ],
  [ErrorCode.BROWSER_PERMISSION_DENIED]: [
    'Click the ResumeWright icon in your browser toolbar',
    'Select "Allow on this site" or grant permissions',
    'Reload the page after granting permission',
    'Check browser extension settings if permission isn\'t available',
  ],
  [ErrorCode.STORAGE_QUOTA_EXCEEDED]: [
    'Clear your conversion history in Settings',
    'Clear your browser cache and cookies',
    'Free up storage space in your browser settings',
    'Try using a private/incognito window',
  ],
  [ErrorCode.INVALID_CONFIG]: [
    'Your settings have been reset to defaults',
    'Check Settings to customize again with valid values',
    'Make sure page size and margins are positive numbers',
  ],
  [ErrorCode.INVALID_METADATA]: [
    'Ask Claude to include your name in the CV',
    'Make sure the CV has a "Personal Info" or "Contact" section',
    'Check that your name appears at the top of the CV',
  ],
  [ErrorCode.NETWORK_ERROR]: [
    'Check your internet connection',
    'Wait a moment and try again',
    'Refresh the page',
    'Try again when you\'re back online',
  ],
  [ErrorCode.UNKNOWN_ERROR]: [
    'Try refreshing the page',
    'Restart the browser',
    'Clear your browser cache',
    'Report this issue so we can fix it',
  ],
};

/**
 * Error Recoverability
 *
 * Determines if an error is recoverable (user can retry).
 */
export const ERROR_RECOVERABLE: Record<ErrorCode, boolean> = {
  [ErrorCode.TSX_PARSE_ERROR]: true,
  [ErrorCode.INVALID_TSX_STRUCTURE]: false,
  [ErrorCode.WASM_INIT_FAILED]: true,
  [ErrorCode.WASM_EXECUTION_ERROR]: true,
  [ErrorCode.PDF_GENERATION_FAILED]: true,
  [ErrorCode.PDF_LAYOUT_ERROR]: true,
  [ErrorCode.DOWNLOAD_FAILED]: true,
  [ErrorCode.FONT_LOAD_ERROR]: true,
  [ErrorCode.MEMORY_LIMIT_EXCEEDED]: false,
  [ErrorCode.RENDER_TIMEOUT]: true,
  [ErrorCode.CONVERSION_TIMEOUT]: true,
  [ErrorCode.CONVERSION_START_FAILED]: true,
  [ErrorCode.BROWSER_PERMISSION_DENIED]: false,
  [ErrorCode.STORAGE_QUOTA_EXCEEDED]: false,
  [ErrorCode.INVALID_CONFIG]: true,
  [ErrorCode.INVALID_METADATA]: true,
  [ErrorCode.NETWORK_ERROR]: true,
  [ErrorCode.UNKNOWN_ERROR]: true,
};
