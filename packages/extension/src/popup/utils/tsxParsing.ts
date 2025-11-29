/**
 * TSX Parsing Utilities
 * Helper functions for extracting information from TSX content
 */

/**
 * CV preview information extracted from TSX content
 */
export interface CVPreviewInfo {
  /** Candidate name (from first h1) */
  name?: string;
  /** Job title (from first h2) */
  title?: string;
  /** Number of sections in the CV */
  sections: number;
}

/**
 * Extract preview information from TSX content
 *
 * Parses TSX content to extract basic CV information for preview purposes.
 * This is a simple regex-based parser for quick preview generation.
 *
 * @param content - TSX content to parse
 * @returns Extracted CV preview information
 *
 * @example
 * const info = extractCVPreviewInfo('<h1>John Doe</h1><h2>Software Engineer</h2>...');
 * // { name: 'John Doe', title: 'Software Engineer', sections: 3 }
 */
export function extractCVPreviewInfo(content: string): CVPreviewInfo {
  const nameMatch = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const titleMatch = content.match(/<h2[^>]*>([^<]+)<\/h2>/i);
  const sectionMatches = content.match(/<section/gi) || [];

  return {
    name: nameMatch?.[1],
    title: titleMatch?.[1],
    sections: sectionMatches.length,
  };
}
