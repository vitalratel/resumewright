/**
 * Filename Sanitization Utility
 *
 * Handles conversion of CV metadata (names, etc.) into safe, cross-platform filenames.
 * Supports Unicode transliteration, special character removal, and length limits.
 */

import { transliterate } from 'transliteration';
import { getLogger } from '../infrastructure/logging';

/**
 * Sanitizes a string for use in a filename.
 *
 * Rules applied:
 * 1. Remove emoji and Unicode symbols (🙂😀👍 → removed)
 * 2. Remove RTL control characters (invisible formatting marks)
 * 3. Transliterate Unicode to ASCII (José → Jose, 李明 → Li_Ming, محمد → mhmd)
 * 4. Replace spaces with underscores
 * 5. Remove Windows-forbidden characters: < > : " / \ | ? *
 * 6. Remove leading/trailing underscores and dots
 * 7. Collapse multiple underscores into single underscore
 * 8. Truncate to 255 characters (max filename length)
 * 9. Return fallback if result is empty string
 *
 * @param name - The name to sanitize (e.g., from CV metadata)
 * @param fallback - Fallback string if sanitization results in empty string
 * @returns Sanitized filename-safe string
 *
 * @example
 * sanitizeFilename('John Doe') // 'John_Doe'
 * sanitizeFilename('José García') // 'Jose_Garcia'
 * sanitizeFilename('李明') // 'Li_Ming'
 * sanitizeFilename('محمد علي') // 'mhmd_ly'
 * sanitizeFilename('John 😊 Doe') // 'John_Doe'
 * sanitizeFilename("John O'Brien & Associates") // 'John_OBrien_Associates'
 * sanitizeFilename('Resume: Final <Draft>') // 'Resume_Final_Draft'
 * sanitizeFilename('') // 'Resume'
 * sanitizeFilename(undefined) // 'Resume'
 */
export function sanitizeFilename(name: string | undefined, fallback = 'Resume'): string {
  // Handle undefined/null/empty
  if (name === null || name === undefined || name === '' || name.trim().length === 0) {
    return fallback;
  }

  let sanitized = name.trim();

  // Comprehensive Unicode handling

  // 1a. Remove emoji and other Unicode symbols that don't transliterate well
  // Emoji ranges: 🙂😀👍 etc.
  sanitized = sanitized.replace(/[\u{1F300}-\u{1F9FF}]/gu, ''); // Misc symbols & pictographs
  sanitized = sanitized.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
  sanitized = sanitized.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport & map symbols
  sanitized = sanitized.replace(/[\u{2600}-\u{26FF}]/gu, ''); // Misc symbols
  sanitized = sanitized.replace(/[\u{2700}-\u{27BF}]/gu, ''); // Dingbats
  sanitized = sanitized.replace(/[\u{FE00}-\u{FE0F}]/gu, ''); // Variation selectors
  sanitized = sanitized.replace(/[\u{1F900}-\u{1F9FF}]/gu, ''); // Supplemental symbols & pictographs

  // 1b. Handle RTL marks (Arabic, Hebrew) - remove invisible control characters
  sanitized = sanitized.replace(/[\u200E\u200F\u202A-\u202E]/g, ''); // LTR/RTL marks

  // 1c. Transliterate Unicode to ASCII
  // This handles Latin accents, Cyrillic, CJK, Greek, Arabic, etc.
  try {
    sanitized = transliterate(sanitized);
  }
  catch (error) {
    // If transliteration fails, strip non-ASCII characters as fallback
    getLogger().warn('FilenameSanitization', 'Transliteration failed, stripping non-ASCII', error);
    // Keep only printable ASCII (space through tilde), excluding control characters
    sanitized = sanitized.replace(/[^\x20-\x7E]/g, '')
  }

  // 2. Replace spaces with underscores
  sanitized = sanitized.replace(/\s+/g, '_');

  // 3. Remove Windows-forbidden characters: < > : " / \ | ? *
  // Also remove other problematic characters like @#$%^&*()+=[]{}',;.
  sanitized = sanitized.replace(/[<>:"/\\|?*@#$%^&()+=[\]{},;'.]/g, '');

  // 4. Remove leading/trailing underscores and dots
  sanitized = sanitized.replace(/^[_.]+|[_.]+$/g, '');

  // 5. Collapse multiple underscores into single underscore
  sanitized = sanitized.replace(/_+/g, '_');

  // 6. Truncate to 255 characters (max filename length on most filesystems)
  if (sanitized.length > 255) {
    sanitized = truncateAtWordBoundary(sanitized, 255);
  }

  // 7. Final validation - if empty after sanitization, use fallback
  return sanitized.length > 0 ? sanitized : fallback;
}

/**
 * Truncates a string at word boundary to avoid cutting words mid-way.
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string at word boundary
 *
 * @example
 * truncateAtWordBoundary('John_Alexander_Christopher_Smith', 20) // 'John_Alexander'
 */
function truncateAtWordBoundary(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }

  // Try to find last underscore (word boundary in our sanitized filenames)
  const truncated = str.substring(0, maxLength);
  const lastUnderscore = truncated.lastIndexOf('_');

  // If we found an underscore, truncate there; otherwise just hard truncate
  if (lastUnderscore > 0) {
    return truncated.substring(0, lastUnderscore);
  }

  return truncated;
}

/**
 * Generates a filename for a CV/resume PDF.
 *
 * Format: [SanitizedName]_Resume_YYYY-MM-DD.pdf
 *
 * @param name - Name from CV metadata (personalInfo.name)
 * @param date - Optional date (defaults to current date)
 * @returns Generated filename
 *
 * @example
 * generateFilename('John Doe') // 'John_Doe_Resume_2025-10-17.pdf'
 * generateFilename('José García') // 'Jose_Garcia_Resume_2025-10-17.pdf'
 * generateFilename(undefined) // 'Resume_2025-10-17.pdf'
 * generateFilename('', new Date('2025-12-25')) // 'Resume_2025-12-25.pdf'
 */
export function generateFilename(name: string | undefined, date: Date = new Date()): string {
  const sanitizedName = sanitizeFilename(name);
  const dateStr = formatDateForFilename(date);

  // If sanitizedName is "Resume" (fallback), don't duplicate it
  if (sanitizedName === 'Resume') {
    return `Resume_${dateStr}.pdf`;
  }

  return `${sanitizedName}_Resume_${dateStr}.pdf`;
}

/**
 * Formats a date as YYYY-MM-DD for filename use.
 *
 * @param date - Date to format
 * @returns Date string in YYYY-MM-DD format
 *
 * @example
 * formatDateForFilename(new Date('2025-10-17')) // '2025-10-17'
 */
function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
