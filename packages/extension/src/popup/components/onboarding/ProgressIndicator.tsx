/**
 * Progress Indicator
 * Visual progress dots for multi-step flows
 *
 * Reusable component for any multi-step wizard or onboarding flow
 */

import { memo } from 'react';

interface ProgressIndicatorProps {
  current: number;
  total: number;
}

export const ProgressIndicator = memo(({
  current,
  total,
}: ProgressIndicatorProps) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      {Array.from({ length: total }, (_, index) => (
        <div
          key={index}
          className={`h-1.5 rounded-full transition-all ${
            index === current
              ? 'w-8 bg-green-500'
              : index < current
                ? 'w-1.5 bg-green-300'
                : 'w-1.5 bg-gray-300'
          }`}
          role="presentation"
          aria-label={`Screen ${index + 1} ${
            index === current ? '(current)' : index < current ? '(completed)' : '(upcoming)'
          }`}
        />
      ))}
    </div>
  );
});
