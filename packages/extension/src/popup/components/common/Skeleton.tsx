/**
 * Skeleton Component
 * P2: Skeleton loading screens for better perceived performance
 *
 * Provides reusable skeleton components with pulse animation
 * for loading states throughout the application.
 *
 * Features:
 * - Multiple variants: text, rect, circle
 * - Subtle pulse animation (60fps)
 * - Tailwind-based styling
 * - Accessibility: aria-hidden for screen readers
 * - Composable: combine multiple skeletons for complex layouts
 */

import React from 'react';
import { tokens } from '../../styles/tokens';

interface SkeletonProps {
  /** Additional CSS classes for custom sizing */
  className?: string;
  /** Visual variant of skeleton */
  variant?: 'text' | 'rect' | 'circle';
}

/**
 * Base skeleton component with pulse animation
 *
 * @example
 * // Text skeleton (default)
 * <Skeleton className="w-32 h-4" />
 *
 * @example
 * // Rectangle skeleton
 * <Skeleton className="w-full h-32" variant="rect" />
 *
 * @example
 * // Circle skeleton (for avatars/icons)
 * <Skeleton className="w-10 h-10" variant="circle" />
 */
export const Skeleton = React.memo(({
  className = '',
  variant = 'rect',
}: SkeletonProps) => {
  const baseClasses = `animate-pulse ${tokens.colors.neutral.bg}`;
  const variantClasses = {
    text: `h-4 ${tokens.borders.rounded}`,
    rect: tokens.borders.rounded,
    circle: tokens.borders.full,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`.trim()}
      aria-hidden="true"
    />
  );
});

/**
 * Skeleton for the file import area
 * Mimics the drag-and-drop zone layout
 */
export const SkeletonFileImport = React.memo(() => {
  return (
    <div className={`border-2 ${tokens.borders.default} ${tokens.borders.roundedLg} ${tokens.spacing.card} ${tokens.spacing.sectionGap}`} aria-hidden="true" role="presentation">
      {/* Icon skeleton */}
      <div className="flex justify-center">
        <Skeleton className="w-10 h-10" variant="circle" />
      </div>

      {/* Text skeletons */}
      <div className={tokens.spacing.gapSmall}>
        <Skeleton className="w-48 h-4 mx-auto" variant="text" />
        <Skeleton className="w-12 h-3 mx-auto" variant="text" />
        <Skeleton className="w-24 h-8 mx-auto" />
        {' '}
        {/* Button */}
        <Skeleton className="w-40 h-3 mx-auto" variant="text" />
      </div>
    </div>
  );
});

/**
 * Skeleton for settings controls
 * Mimics radio buttons and sliders
 */
export const SkeletonSettings = React.memo(() => {
  return (
    <div className={tokens.spacing.sectionGap} aria-hidden="true" role="presentation">
      {/* Page size section */}
      <div className={tokens.spacing.gapSmall}>
        <Skeleton className="w-24 h-4" variant="text" />
        <div className={tokens.spacing.gapSmall}>
          <Skeleton className="w-full h-12" />
          <Skeleton className="w-full h-12" />
          <Skeleton className="w-full h-12" />
        </div>
      </div>

      {/* Margins section */}
      <div className={tokens.spacing.gapMedium}>
        <Skeleton className="w-16 h-4" variant="text" />
        <Skeleton className="w-full h-4 mb-2" variant="text" />
        {' '}
        {/* Helper text */}
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={tokens.spacing.gapSmall}>
            <Skeleton className="w-12 h-3" variant="text" />
            <Skeleton className="w-full h-6" />
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className={tokens.spacing.gapMedium}>
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-full h-10" />
      </div>
    </div>
  );
});

/**
 * Skeleton for the main popup header
 */
export const SkeletonHeader = React.memo(() => {
  return (
    <div className={`flex justify-between items-center ${tokens.spacing.card} border-b ${tokens.borders.default}`} aria-hidden="true" role="presentation">
      <div className={`flex items-center ${tokens.spacing.gapSmall}`}>
        <Skeleton className="w-6 h-6" variant="circle" />
        <Skeleton className="w-32 h-5" variant="text" />
      </div>
      <Skeleton className="w-8 h-8" variant="circle" />
    </div>
  );
});

/**
 * Skeleton for export button and settings summary
 */
export const SkeletonExportSection = React.memo(() => {
  return (
    <div className={`${tokens.spacing.containerPadding} ${tokens.spacing.stack}`} aria-hidden="true" role="presentation">
      {/* Export button skeleton */}
      <Skeleton className="w-full h-11" />
      {/* Settings summary line skeleton */}
      <Skeleton className="w-48 h-3 mx-auto" variant="text" />
    </div>
  );
});
