/**
 * Popup Utilities Barrel Export
 * Re-exports all utility functions for convenient importing
 */

// Re-export debounce from shared utils instead of duplicating
export { debounce } from '../../shared/utils/debounce';

// Formatting utilities
export * from './formatting';

// Local storage utilities
export * from './localStorage';

// Margin preset utilities
export * from './marginPresets';

// Keyboard shortcut utilities
export * from './shortcuts';

// View context utilities
export * from './viewContext';
