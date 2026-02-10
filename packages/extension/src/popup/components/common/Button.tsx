// ABOUTME: Reusable button component with multiple variants (primary, secondary, tertiary, danger, ghost, link).
// ABOUTME: Supports loading states, success feedback, micro-interactions, and accessibility features.

import { createEffect, createSignal, type JSX, onCleanup, Show, splitProps } from 'solid-js';

const PENDING_STATE_TIMEOUT_MS = 100;
const SPINNER_DELAY_MS = 300;

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'link';
  fullWidth?: boolean;
  children: JSX.Element;
  /** Loading state - shows spinner and disables button */
  loading?: boolean;
  /** Success state - shows checkmark briefly */
  success?: boolean;
  /** Icon to show before text (only when not loading/success) */
  icon?: (props: { class?: string; 'aria-hidden'?: string }) => JSX.Element;
}

export function Button(props: ButtonProps) {
  const [local, others] = splitProps(props, [
    'variant',
    'fullWidth',
    'children',
    'class',
    'loading',
    'success',
    'icon',
    'disabled',
    'onClick',
    'ref',
  ]);

  const variant = () => local.variant ?? 'primary';
  const fullWidth = () => local.fullWidth ?? true;
  const loading = () => local.loading ?? false;
  const success = () => local.success ?? false;

  // Local pending state to prevent double-clicks
  const [isPending, setIsPending] = createSignal(false);
  let pendingTimeout: ReturnType<typeof setTimeout> | undefined;

  onCleanup(() => {
    if (pendingTimeout) clearTimeout(pendingTimeout);
  });

  // Delayed spinner display to prevent janky flashing
  const [shouldShowSpinner, setShouldShowSpinner] = createSignal(false);
  let spinnerTimeout: ReturnType<typeof setTimeout> | undefined;

  createEffect(() => {
    const isActive = loading() || isPending();
    if (isActive) {
      spinnerTimeout = setTimeout(() => setShouldShowSpinner(true), SPINNER_DELAY_MS);
    } else {
      if (spinnerTimeout) clearTimeout(spinnerTimeout);
      setShouldShowSpinner(false);
    }
  });

  onCleanup(() => {
    if (spinnerTimeout) clearTimeout(spinnerTimeout);
  });

  const handleClick: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> = (event) => {
    if (local.disabled || loading() || isPending()) {
      return;
    }

    setIsPending(true);

    if (typeof local.onClick === 'function') {
      (local.onClick as (e: MouseEvent & { currentTarget: HTMLButtonElement }) => void)(event);
    }

    // Reset pending state after a short delay (parent's loading prop should take over)
    pendingTimeout = setTimeout(() => {
      setIsPending(false);
    }, PENDING_STATE_TIMEOUT_MS);
  };

  const baseClasses =
    'px-4 py-3 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ring-offset-ring-offset transition-all duration-200 ease-in-out relative overflow-hidden';

  const variantClasses: Record<string, string> = {
    primary:
      'bg-primary hover:bg-primary-hover hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] text-primary-foreground focus:ring-ring-focus disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none',
    secondary:
      'bg-elevated hover:bg-muted hover:scale-[1.01] hover:shadow-md active:scale-[0.99] text-link border-2 border-info focus:ring-ring-focus disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none',
    tertiary:
      'bg-muted hover:bg-muted-hover hover:scale-[1.01] hover:shadow-sm active:scale-[0.99] text-muted-foreground focus:ring-ring-focus disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none',
    danger:
      'bg-danger-action hover:bg-danger-action-hover hover:scale-[1.02] hover:shadow-lg active:bg-danger-action-active active:scale-[0.98] text-white focus:ring-ring-focus-danger disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none',
    ghost:
      'bg-transparent hover:bg-muted hover:scale-[1.01] active:scale-[0.99] text-muted-foreground focus:ring-ring-focus focus:ring-[3px] focus:bg-muted disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
    link: 'min-h-11 flex items-center bg-transparent hover:underline active:scale-[0.98] text-link focus:ring-ring-focus disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed disabled:hover:scale-100',
  };

  const widthClass = () => (fullWidth() ? 'w-full' : '');
  const isDisabled = () => local.disabled || loading() || isPending();

  return (
    <button
      type="button"
      {...others}
      ref={local.ref as HTMLButtonElement | ((el: HTMLButtonElement) => void) | undefined}
      class={`${baseClasses} ${variantClasses[variant()]} ${widthClass()} ${local.class ?? ''}`}
      disabled={isDisabled()}
      aria-busy={loading() || isPending()}
      aria-live={success() ? 'polite' : undefined}
      onClick={handleClick}
    >
      <span class="flex items-center justify-center gap-2">
        <Show when={shouldShowSpinner()}>
          <svg
            class="animate-spin w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </Show>

        <Show when={success() && !loading() && !isPending()}>
          <svg
            class="w-4 h-4 animate-scale-in"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </Show>

        <Show when={!loading() && !success() && !isPending() && local.icon}>
          {(() => {
            const Icon = local.icon;
            return Icon ? <Icon class="w-4 h-4" aria-hidden="true" /> : null;
          })()}
        </Show>

        <span>{local.children}</span>
      </span>
    </button>
  );
}
