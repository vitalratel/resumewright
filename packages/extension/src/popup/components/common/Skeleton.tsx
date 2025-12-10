// ABOUTME: Skeleton loading components for better perceived performance.
// ABOUTME: Multiple variants (text, rect, circle) with pulse animation.

import React from 'react';

interface SkeletonProps {
  /** Additional CSS classes for custom sizing */
  className?: string;
  /** Visual variant of skeleton */
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton = React.memo(({ className = '', variant = 'rect' }: SkeletonProps) => {
  const baseClasses = 'animate-pulse bg-muted';
  const variantClasses = {
    text: 'h-4 rounded-md',
    rect: 'rounded-md',
    circle: 'rounded-full',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`.trim()}
      aria-hidden="true"
    />
  );
});

export const SkeletonFileImport = React.memo(() => {
  return (
    <div
      className="border-2 border-border rounded-lg p-4 space-y-6 md:space-y-8"
      aria-hidden="true"
      role="presentation"
    >
      <div className="flex justify-center">
        <Skeleton className="w-10 h-10" variant="circle" />
      </div>
      <div className="gap-2">
        <Skeleton className="w-48 h-4 mx-auto" variant="text" />
        <Skeleton className="w-12 h-3 mx-auto" variant="text" />
        <Skeleton className="w-24 h-8 mx-auto" />
        <Skeleton className="w-40 h-3 mx-auto" variant="text" />
      </div>
    </div>
  );
});

export const SkeletonSettings = React.memo(() => {
  return (
    <div className="space-y-6 md:space-y-8" aria-hidden="true" role="presentation">
      <div className="gap-2">
        <Skeleton className="w-24 h-4" variant="text" />
        <div className="gap-2">
          <Skeleton className="w-full h-12" />
          <Skeleton className="w-full h-12" />
          <Skeleton className="w-full h-12" />
        </div>
      </div>
      <div className="gap-3">
        <Skeleton className="w-16 h-4" variant="text" />
        <Skeleton className="w-full h-4 mb-2" variant="text" />
        {['top', 'right', 'bottom', 'left'].map((side) => (
          <div key={side} className="gap-2">
            <Skeleton className="w-12 h-3" variant="text" />
            <Skeleton className="w-full h-6" />
          </div>
        ))}
      </div>
      <div className="gap-3">
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-full h-10" />
      </div>
    </div>
  );
});

export const SkeletonHeader = React.memo(() => {
  return (
    <div
      className="flex justify-between items-center p-4 border-b border-border"
      aria-hidden="true"
      role="presentation"
    >
      <div className="flex items-center gap-2">
        <Skeleton className="w-6 h-6" variant="circle" />
        <Skeleton className="w-32 h-5" variant="text" />
      </div>
      <Skeleton className="w-8 h-8" variant="circle" />
    </div>
  );
});

export const SkeletonExportSection = React.memo(() => {
  return (
    <div className="px-6 py-8 md:px-8 md:py-10 space-y-4" aria-hidden="true" role="presentation">
      <Skeleton className="w-full h-11" />
      <Skeleton className="w-48 h-3 mx-auto" variant="text" />
    </div>
  );
});
