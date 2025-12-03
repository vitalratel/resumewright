/**
 * Help Resources for Error Messages
 * Link error suggestions to help resources
 *
 * Provides clickable help links for error suggestions to guide users
 * to relevant documentation and support resources.
 */

import { ErrorCode } from './codes';

interface HelpLink {
  text: string;
  url: string;
  type: 'external' | 'internal';
}

/**
 * Error-specific help resources
 * Maps error codes to relevant help documentation
 */
const ERROR_HELP_RESOURCES: Partial<Record<ErrorCode, HelpLink[]>> = {
  [ErrorCode.TSX_PARSE_ERROR]: [
    {
      text: 'TSX Syntax Guide',
      url: 'https://react.dev/learn/writing-markup-with-jsx',
      type: 'external',
    },
    {
      text: 'Common CV Format Mistakes',
      url: '#help-tsx-errors',
      type: 'internal',
    },
  ],
  [ErrorCode.INVALID_TSX_STRUCTURE]: [
    {
      text: 'CV Structure Requirements',
      url: '#help-cv-structure',
      type: 'internal',
    },
    {
      text: 'How to Ask Claude for a Valid CV',
      url: '#help-claude-prompts',
      type: 'internal',
    },
  ],
  [ErrorCode.PDF_LAYOUT_ERROR]: [
    {
      text: 'Adjusting Page Layout',
      url: '#help-layout-settings',
      type: 'internal',
    },
    {
      text: 'Best Practices for CV Formatting',
      url: '#help-cv-formatting',
      type: 'internal',
    },
  ],
  [ErrorCode.MEMORY_LIMIT_EXCEEDED]: [
    {
      text: 'Optimizing CV File Size',
      url: '#help-reduce-size',
      type: 'internal',
    },
  ],
  [ErrorCode.FONT_LOAD_ERROR]: [
    {
      text: 'Troubleshooting Font Issues',
      url: '#help-fonts',
      type: 'internal',
    },
  ],
  [ErrorCode.WASM_INIT_FAILED]: [
    {
      text: 'Extension Troubleshooting',
      url: '#help-wasm-issues',
      type: 'internal',
    },
  ],
  [ErrorCode.BROWSER_PERMISSION_DENIED]: [
    {
      text: 'Granting Extension Permissions',
      url: '#help-permissions',
      type: 'internal',
    },
  ],
  [ErrorCode.STORAGE_QUOTA_EXCEEDED]: [
    {
      text: 'Managing Browser Storage',
      url: '#help-storage',
      type: 'internal',
    },
  ],
};

/**
 * Suggestion-specific help links
 * Maps specific suggestion text patterns to help resources
 */
const SUGGESTION_HELP_LINKS: Record<string, HelpLink> = {
  'Ask Claude to regenerate your CV': {
    text: 'Learn how',
    url: '#help-regenerate-cv',
    type: 'internal',
  },
  'Try a different page size': {
    text: 'View options',
    url: '#help-page-sizes',
    type: 'internal',
  },
  'Increase the page margins': {
    text: 'Adjust margins',
    url: '#help-margins',
    type: 'internal',
  },
  'Reduce CV length': {
    text: 'Tips',
    url: '#help-reduce-size',
    type: 'internal',
  },
  'Remove images': {
    text: 'How to',
    url: '#help-remove-images',
    type: 'internal',
  },
  'Clear your browser cache': {
    text: 'Instructions',
    url: 'https://support.google.com/accounts/answer/32050',
    type: 'external',
  },
  'Check your internet connection': {
    text: 'Troubleshoot',
    url: 'https://support.google.com/chrome/answer/95346',
    type: 'external',
  },
};

/**
 * Get help link for a suggestion if available
 */
export function getHelpLinkForSuggestion(suggestionText: string): HelpLink | undefined {
  // Check for exact match first
  if (SUGGESTION_HELP_LINKS[suggestionText] != null) {
    return SUGGESTION_HELP_LINKS[suggestionText];
  }

  // Check for partial matches
  for (const [key, link] of Object.entries(SUGGESTION_HELP_LINKS)) {
    if (suggestionText.toLowerCase().includes(key.toLowerCase())) {
      return link;
    }
  }

  return undefined;
}

/**
 * Get help resources for an error code
 */
export function getHelpResourcesForError(errorCode: ErrorCode): HelpLink[] {
  return ERROR_HELP_RESOURCES[errorCode] || [];
}
