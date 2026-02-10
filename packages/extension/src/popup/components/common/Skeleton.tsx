// ABOUTME: Skeleton loading components for better perceived performance.
// ABOUTME: Multiple variants (text, rect, circle) with pulse animation.

import { For } from 'solid-js';

interface SkeletonProps {
  /** Additional CSS classes for custom sizing */
  class?: string;
  /** Visual variant of skeleton */
  variant?: 'text' | 'rect' | 'circle';
}

export function Skeleton(props: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-muted';
  const variantClasses = {
    text: 'h-4 rounded-md',
    rect: 'rounded-md',
    circle: 'rounded-full',
  };
  const variant = () => props.variant ?? 'rect';

  return (
    <div
      class={`${baseClasses} ${variantClasses[variant()]} ${props.class ?? ''}`.trim()}
      aria-hidden="true"
    />
  );
}

export function SkeletonFileImport() {
  return (
    <div
      class="border-2 border-border rounded-lg p-4 space-y-6 md:space-y-8"
      aria-hidden="true"
      role="presentation"
    >
      <div class="flex justify-center">
        <Skeleton class="w-10 h-10" variant="circle" />
      </div>
      <div class="gap-2">
        <Skeleton class="w-48 h-4 mx-auto" variant="text" />
        <Skeleton class="w-12 h-3 mx-auto" variant="text" />
        <Skeleton class="w-24 h-8 mx-auto" />
        <Skeleton class="w-40 h-3 mx-auto" variant="text" />
      </div>
    </div>
  );
}

export function SkeletonSettings() {
  return (
    <div class="space-y-6 md:space-y-8" aria-hidden="true" role="presentation">
      <div class="gap-2">
        <Skeleton class="w-24 h-4" variant="text" />
        <div class="gap-2">
          <Skeleton class="w-full h-12" />
          <Skeleton class="w-full h-12" />
          <Skeleton class="w-full h-12" />
        </div>
      </div>
      <div class="gap-3">
        <Skeleton class="w-16 h-4" variant="text" />
        <Skeleton class="w-full h-4 mb-2" variant="text" />
        <For each={['top', 'right', 'bottom', 'left']}>
          {(_side) => (
            <div class="gap-2">
              <Skeleton class="w-12 h-3" variant="text" />
              <Skeleton class="w-full h-6" />
            </div>
          )}
        </For>
      </div>
      <div class="gap-3">
        <Skeleton class="w-full h-10" />
        <Skeleton class="w-full h-10" />
      </div>
    </div>
  );
}

export function SkeletonHeader() {
  return (
    <div
      class="flex justify-between items-center p-4 border-b border-border"
      aria-hidden="true"
      role="presentation"
    >
      <div class="flex items-center gap-2">
        <Skeleton class="w-6 h-6" variant="circle" />
        <Skeleton class="w-32 h-5" variant="text" />
      </div>
      <Skeleton class="w-8 h-8" variant="circle" />
    </div>
  );
}

export function SkeletonExportSection() {
  return (
    <div class="px-6 py-8 md:px-8 md:py-10 space-y-4" aria-hidden="true" role="presentation">
      <Skeleton class="w-full h-11" />
      <Skeleton class="w-48 h-3 mx-auto" variant="text" />
    </div>
  );
}
