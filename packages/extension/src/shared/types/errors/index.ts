/**
 * Error Types - Barrel Export
 *
 * Re-exports all error types, codes, messages, and metadata.
 * This maintains backward compatibility with existing imports.
 */

export { ErrorCategory, ErrorCode } from './codes';
export { ERROR_HELP_RESOURCES, getHelpLinkForSuggestion, getHelpResourcesForError, SUGGESTION_HELP_LINKS } from './helpResources';
export type { HelpLink } from './helpResources';
export { ERROR_MESSAGES, ERROR_RECOVERABLE, ERROR_SUGGESTIONS } from './messages';
export { ERROR_CATEGORIES } from './metadata';
