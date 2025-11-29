/**
 * Page Layout Preview Component
 * Visual preview of PDF page layout with margin guides
 *
 * Shows a scaled-down representation of the PDF page with:
 * - Page boundaries
 * - Margin guides (top, right, bottom, left)
 * - Content area
 * - Dimensions display
 *
 * @example
 * ```tsx
 * <PageLayoutPreview
 *   pageSize="Letter"
 *   margins={{ top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 }}
 * />
 * ```
 */

import React from 'react';
import { tokens } from '../../styles/tokens';

interface PageLayoutPreviewProps {
  /** Page size (Letter, A4, or Legal) */
  pageSize: 'Letter' | 'A4' | 'Legal';

  /** Margins in inches for all sides */
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  /** Optional class name for container */
  className?: string;
}

/**
 * Page dimensions in inches (width x height)
 */
const PAGE_DIMENSIONS = {
  Letter: { width: 8.5, height: 11, label: '8.5" × 11"' },
  A4: { width: 8.27, height: 11.69, label: '210mm × 297mm' },
  Legal: { width: 8.5, height: 14, label: '8.5" × 14"' },
} as const;

/**
 * PageLayoutPreview displays a visual representation of the PDF page layout
 * with margin guides and content area highlighted.
 */
export const PageLayoutPreview = React.memo(({
  pageSize,
  margins,
  className = '',
}: PageLayoutPreviewProps) => {
  const dimensions = PAGE_DIMENSIONS[pageSize];

  // Calculate percentages for margins
  const topPercent = (margins.top / dimensions.height) * 100;
  const rightPercent = (margins.right / dimensions.width) * 100;
  const bottomPercent = (margins.bottom / dimensions.height) * 100;
  const leftPercent = (margins.left / dimensions.width) * 100;

  // Content area dimensions
  const contentWidthPercent = 100 - leftPercent - rightPercent;
  const contentHeightPercent = 100 - topPercent - bottomPercent;

  return (
    <div className={`flex flex-col items-center ${tokens.spacing.gapMedium} ${className}`}>
      {/* Page info */}
      <div className="text-center">
        <h4 className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.text}`}>
          {pageSize}
          {' '}
          Page Layout
        </h4>
        <p className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted}`}>
          {dimensions.label}
        </p>
      </div>

      {/* Page preview container - aspect ratio preserved */}
      <div
        className={`relative ${tokens.colors.neutral.bgWhite} border-2 ${tokens.colors.neutral.border} ${tokens.effects.shadowLg}`}
        style={{
          width: '200px',
          height: `${(dimensions.height / dimensions.width) * 200}px`,
        }}
        role="img"
        aria-label={`Page layout preview for ${pageSize} with ${margins.top} inch top, ${margins.right} inch right, ${margins.bottom} inch bottom, ${margins.left} inch left margins`}
      >
        {/* Margin guides */}
        {/* Top margin */}
        <div
          className={`absolute left-0 right-0 ${tokens.marginPreview.topBottom} ${tokens.marginPreview.topBottomText} flex items-center justify-center ${tokens.typography.xs} ${tokens.typography.medium} opacity-70`}
          style={{
            top: 0,
            height: `${topPercent}%`,
          }}
        >
          {topPercent > 8 && (
            <span>
              {margins.top}
              &quot;
            </span>
          )}
        </div>

        {/* Bottom margin */}
        <div
          className={`absolute left-0 right-0 ${tokens.marginPreview.topBottom} ${tokens.marginPreview.topBottomText} flex items-center justify-center ${tokens.typography.xs} font-medium opacity-70`}
          style={{
            bottom: 0,
            height: `${bottomPercent}%`,
          }}
        >
          {bottomPercent > 8 && (
            <span>
              {margins.bottom}
              &quot;
            </span>
          )}
        </div>

        {/* Left margin */}
        <div
          className={`absolute top-0 bottom-0 ${tokens.marginPreview.leftRight} ${tokens.marginPreview.leftRightText} flex items-center justify-center ${tokens.typography.xs} ${tokens.typography.medium} opacity-70`}
          style={{
            left: 0,
            width: `${leftPercent}%`,
          }}
        >
          {leftPercent > 8 && (
            <span className="transform -rotate-90 whitespace-nowrap">
              {margins.left}
              &quot;
            </span>
          )}
        </div>

        {/* Right margin */}
        <div
          className={`absolute top-0 bottom-0 ${tokens.marginPreview.leftRight} ${tokens.marginPreview.leftRightText} flex items-center justify-center ${tokens.typography.xs} font-medium opacity-70`}
          style={{
            right: 0,
            width: `${rightPercent}%`,
          }}
        >
          {rightPercent > 8 && (
            <span className="transform -rotate-90 whitespace-nowrap">
              {margins.right}
              &quot;
            </span>
          )}
        </div>

        {/* Content area */}
        <div
          className={`absolute ${tokens.colors.neutral.bg} flex items-center justify-center`}
          style={{
            top: `${topPercent}%`,
            left: `${leftPercent}%`,
            width: `${contentWidthPercent}%`,
            height: `${contentHeightPercent}%`,
          }}
        >
          {/* Content lines simulation */}
          <div className="w-full h-full p-2 space-y-1">
            {Array.from({ length: 8 }, (_, i) => ({ id: `line-${i}`, index: i })).map(({ id, index: i }) => (
              <div
                key={id}
                className={`h-1 ${tokens.marginPreview.contentLine} ${tokens.borders.rounded}`}
                style={{
                  width: i % 3 === 0 ? '90%' : '100%',
                  opacity: 0.3,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content area dimensions */}
      <div className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted} text-center`}>
        Content area:
        {' '}
        {(dimensions.width - margins.left - margins.right).toFixed(2)}
        &quot; ×
        {' '}
        {(dimensions.height - margins.top - margins.bottom).toFixed(2)}
        &quot;
      </div>
    </div>
  );
});

// Add displayName for React DevTools
PageLayoutPreview.displayName = 'PageLayoutPreview';
