// ABOUTME: Loading spinner with size variants and optional display delay.
// ABOUTME: Accessible with aria-hidden or aria-label for screen readers.

import { Show } from 'solid-js';
import { useDelayedSpinner } from '../../reactivity/spinner';

export type SpinnerSize = 'small' | 'medium' | 'large';

interface SpinnerProps {
  /** Spinner size variant */
  size?: SpinnerSize;
  /** Additional CSS classes */
  class?: string;
  /** Spinner color (Tailwind text-* class) */
  color?: string;
  /** Optional aria-label for screen readers when used as primary indicator */
  ariaLabel?: string;
  /** Delay in ms before showing spinner (default: 300ms, set to 0 to disable) */
  delayMs?: number;
}

const sizeClasses: Record<SpinnerSize, string> = {
  small: 'w-4 h-4',
  medium: 'w-6 h-6',
  large: 'w-8 h-8',
};

export function Spinner(props: SpinnerProps) {
  const size = () => props.size ?? 'medium';
  const color = () => props.color ?? 'text-primary';
  const cls = () => props.class ?? '';
  const delayMs = () => props.delayMs ?? 300;
  const shouldShow = useDelayedSpinner(delayMs());

  return (
    <Show when={shouldShow()}>
      <svg
        class={`animate-spin ${sizeClasses[size()]} ${color()} ${cls()}`.trim()}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden={props.ariaLabel ? undefined : 'true'}
        aria-label={props.ariaLabel}
        role={props.ariaLabel ? 'img' : undefined}
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </Show>
  );
}
