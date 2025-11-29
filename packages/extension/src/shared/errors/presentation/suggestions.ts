/**
 * Error Suggestion Prioritization
 * Prioritize error suggestions
 *
 * Provides intelligent prioritization of error recovery suggestions
 * based on likelihood of success and historical effectiveness.
 *
 * Features:
 * - Suggestions ordered by success probability
 * - "Most likely" indicator for top suggestion
 * - Context-aware prioritization
 * - Retry attempt awareness
 */

import { ErrorCode } from '../../types/errors/';

/**
 * Suggestion with priority metadata
 */
export interface PrioritizedSuggestion {
  /** Suggestion text */
  text: string;

  /** Priority level (1 = highest, 3 = lowest) */
  priority: 1 | 2 | 3;

  /** Whether this is the most likely to help */
  mostLikely: boolean;

  /** Optional explanation of why this might help */
  rationale?: string;
}

/**
 * Suggestion priority mappings for each error code
 * Priority: 1 = most likely to work, 2 = moderate, 3 = less likely
 */
export const SUGGESTION_PRIORITIES: Record<ErrorCode, number[]> = {
  [ErrorCode.TSX_PARSE_ERROR]: [1, 1, 2, 3],
  [ErrorCode.INVALID_TSX_STRUCTURE]: [1, 2, 3],
  [ErrorCode.WASM_INIT_FAILED]: [1, 2, 2, 3],
  [ErrorCode.WASM_EXECUTION_ERROR]: [1, 2, 3],
  [ErrorCode.PDF_GENERATION_FAILED]: [2, 2, 1, 3],
  [ErrorCode.PDF_LAYOUT_ERROR]: [1, 1, 2, 3],
  [ErrorCode.DOWNLOAD_FAILED]: [1, 1, 2, 3],
  [ErrorCode.FONT_LOAD_ERROR]: [2, 1, 1, 3],
  [ErrorCode.MEMORY_LIMIT_EXCEEDED]: [1, 2, 3, 3],
  [ErrorCode.RENDER_TIMEOUT]: [2, 2, 1, 3],
  [ErrorCode.CONVERSION_TIMEOUT]: [2, 2, 1, 3],
  [ErrorCode.CONVERSION_START_FAILED]: [1, 2, 3, 3],
  [ErrorCode.BROWSER_PERMISSION_DENIED]: [1, 2, 3, 3],
  [ErrorCode.STORAGE_QUOTA_EXCEEDED]: [1, 2, 3, 3],
  [ErrorCode.INVALID_CONFIG]: [1, 2, 3],
  [ErrorCode.INVALID_METADATA]: [1, 2, 3],
  [ErrorCode.NETWORK_ERROR]: [2, 1, 2, 3],
  [ErrorCode.UNKNOWN_ERROR]: [2, 2, 2, 1],
};

/**
 * Rationales for why certain suggestions work
 * Helps users understand the fix
 */
const SUGGESTION_RATIONALES: Partial<Record<ErrorCode, string[]>> = {
  [ErrorCode.TSX_PARSE_ERROR]: [
    'Claude can regenerate valid code automatically',
    'A fresh copy avoids copy-paste errors',
  ],
  [ErrorCode.PDF_LAYOUT_ERROR]: [
    'More margin space gives content room to fit',
    'Larger pages have more space for content',
  ],
  [ErrorCode.WASM_INIT_FAILED]: [
    'The converter just needs a moment to load',
  ],
  [ErrorCode.FONT_LOAD_ERROR]: [
    'Standard fonts don\'t require network access',
  ],
};

/**
 * Get size-specific reduction tips based on error metadata
 * Size error guidance missing
 */
export function getSizeReductionTips(fileSize?: number, maxSize?: number): string[] {
  const tips: string[] = [];

  if ((fileSize !== null && fileSize !== undefined && fileSize !== 0 && !Number.isNaN(fileSize)) && (maxSize !== null && maxSize !== undefined && maxSize !== 0 && !Number.isNaN(maxSize))) {
    const overage = fileSize - maxSize;
    const percentOver = Math.round((overage / maxSize) * 100);

    if (percentOver > 100) {
      // Severely oversized (2x+ limit)
      tips.push(`Your CV is ${percentOver}% over the size limit. Consider major reductions.`);
      tips.push('Remove all images and graphics');
      tips.push('Keep only the most recent 2-3 work experiences');
      tips.push('Split your CV into separate documents (CV + detailed portfolio)');
    }
    else if (percentOver > 50) {
      // Significantly oversized (1.5x+ limit)
      tips.push(`Your CV is ${percentOver}% over the size limit. Moderate reductions needed.`);
      tips.push('Remove or compress images');
      tips.push('Shorten bullet points to 1-2 lines each');
      tips.push('Remove older or less relevant experiences');
    }
    else {
      // Slightly oversized (just over limit)
      tips.push(`Your CV is ${percentOver}% over the size limit. Small reductions should work.`);
      tips.push('Remove any images or logos');
      tips.push('Trim a few bullet points');
      tips.push('Use shorter section descriptions');
    }
  }
  else {
    // Generic tips when size metadata not available
    tips.push('Remove images, graphics, or logos');
    tips.push('Shorten work experience descriptions');
    tips.push('Keep only recent positions (last 10-15 years)');
    tips.push('Use concise bullet points (1-2 lines each)');
  }

  return tips;
}

/**
 * Prioritize error suggestions based on likelihood of success
 *
 * @param errorCode - Error code to get suggestions for
 * @param suggestions - Original suggestions array
 * @param retryAttempt - Number of retry attempts (affects prioritization)
 * @returns Prioritized suggestions with metadata
 */
export function prioritizeSuggestions(
  errorCode: ErrorCode,
  suggestions: string[],
  retryAttempt: number = 0,
): PrioritizedSuggestion[] {
  const priorities = (SUGGESTION_PRIORITIES[errorCode] !== null && SUGGESTION_PRIORITIES[errorCode] !== undefined) ? SUGGESTION_PRIORITIES[errorCode] : suggestions.map(() => 2);
  const rationales = (SUGGESTION_RATIONALES[errorCode] !== null && SUGGESTION_RATIONALES[errorCode] !== undefined) ? SUGGESTION_RATIONALES[errorCode] : [];

  // Create prioritized suggestions
  const prioritized: PrioritizedSuggestion[] = suggestions.map((text, index) => ({
    text,
    priority: (priorities[index] || 2) as 1 | 2 | 3,
    mostLikely: false,
    rationale: rationales[index],
  }));

  // Sort by priority (1 first, then 2, then 3)
  prioritized.sort((a, b) => a.priority - b.priority);

  // On retry attempts, deprioritize the first suggestion if it likely already failed
  if (retryAttempt > 0 && prioritized.length > 1) {
    // Move first suggestion down one position
    const [first, second, ...rest] = prioritized;
    const reordered = [second, first, ...rest];

    // Mark the new first as most likely
    if (reordered[0] !== null && reordered[0] !== undefined) {
      reordered[0].mostLikely = true;
    }

    return reordered;
  }

  // Mark the first (highest priority) suggestion as most likely
  if (prioritized[0] !== null && prioritized[0] !== undefined) {
    prioritized[0].mostLikely = true;
  }

  return prioritized;
}

/**
 * Get priority label for display
 */
export function getPriorityLabel(priority: 1 | 2 | 3): string {
  switch (priority) {
    case 1:
      return 'Most likely to help';
    case 2:
      return 'Might help';
    case 3:
      return 'Worth trying';
  }
}

/**
 * Get priority color classes
 */
export function getPriorityColors(priority: 1 | 2 | 3): {
  bg: string;
  text: string;
  border: string;
} {
  switch (priority) {
    case 1:
      return {
        bg: 'bg-green-50',
        text: 'text-green-800',
        border: 'border-green-300',
      };
    case 2:
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-300',
      };
    case 3:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-300',
      };
  }
}
