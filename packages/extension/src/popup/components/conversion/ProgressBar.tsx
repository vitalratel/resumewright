// ABOUTME: Horizontal progress bar with percentage text for accessibility.
// ABOUTME: Supports visual variants (default, success, error) with smooth animations.

interface ProgressBarProps {
  /** Progress percentage (0-100) */
  percentage: number;

  /** Enable smooth width transition animation */
  animated?: boolean;

  /** Visual variant */
  variant?: 'default' | 'success' | 'error';
}

const bgColorClasses = {
  default: 'bg-primary',
  success: 'bg-success',
  error: 'bg-destructive',
} as const;

const textColorClasses = {
  default: 'text-foreground',
  success: 'text-success-text',
  error: 'text-destructive-text',
} as const;

export function ProgressBar(props: ProgressBarProps) {
  const animated = () => props.animated ?? true;
  const variant = () => props.variant ?? 'default';
  const clampedPercentage = () => Math.min(100, Math.max(0, props.percentage));
  const progressStyle = () => ({ width: `${clampedPercentage()}%` });

  return (
    <div class="flex items-center gap-3">
      <div class="flex-1 bg-muted rounded-full h-3 overflow-hidden">
        <div
          class={`${bgColorClasses[variant()]} h-full ${animated() ? 'transition-[width] duration-300 ease-out' : ''}`.trim()}
          style={progressStyle()}
          role="progressbar"
          aria-label="PDF conversion progress"
          aria-valuenow={clampedPercentage()}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span
        class={`text-sm font-medium ${textColorClasses[variant()]} min-w-[3ch] text-right`}
        aria-hidden="true"
      >
        {Math.round(clampedPercentage())}%
      </span>
    </div>
  );
}
