// ABOUTME: Enhanced range slider with visual track fill and tooltip.
// ABOUTME: Accessible keyboard navigation with increment/decrement buttons.

import { HiOutlineMinus, HiOutlinePlus } from 'solid-icons/hi';
import { createSignal, Show } from 'solid-js';

interface RangeSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
  class?: string;
}

export function RangeSlider(props: RangeSliderProps) {
  const unit = () => props.unit ?? '"';

  const [isDragging, setIsDragging] = createSignal(false);
  const [showTooltip, setShowTooltip] = createSignal(false);

  // P1-A11Y-002: Help text ID for aria-describedby
  const helpTextId = () => `${props.id}-help`;

  // Calculate percentage for track fill
  const percentage = () => ((props.value - props.min) / (props.max - props.min)) * 100;

  const trackFillStyle = () => ({
    width: `${percentage()}%`,
  });

  const tooltipStyle = () => ({
    left: `calc(${percentage()}% - 20px)`,
    transform: 'translateX(-50%)',
  });

  // Format value with locale-specific number formatting
  const formatValue = (val: number): string => {
    return `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${unit()}`;
  };

  // Increment/decrement handlers
  const handleDecrement = () => {
    const newValue = Math.max(props.min, props.value - props.step);
    props.onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(props.max, props.value + props.step);
    props.onChange(newValue);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
    setShowTooltip(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setShowTooltip(false);
  };

  const handleFocus = () => {
    setShowTooltip(true);
  };

  const handleBlur = () => {
    if (!isDragging()) {
      setShowTooltip(false);
    }
  };

  const handleInput = (e: Event) => {
    props.onChange(Number.parseFloat((e.target as HTMLInputElement).value));
  };

  return (
    <div class={`flex items-center justify-between gap-3 ${props.class ?? ''}`}>
      <label for={props.id} class="text-sm capitalize w-16 shrink-0 text-foreground">
        {props.label}
      </label>

      <button
        onClick={handleDecrement}
        disabled={props.value <= props.min}
        class="p-1.5 hover:bg-muted active:bg-muted/80 rounded-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ring-offset-background"
        aria-label={`Decrease ${props.label} margin by ${props.step}${unit()}`}
        type="button"
      >
        <HiOutlineMinus class="w-6 h-6 text-muted-foreground" aria-hidden="true" />
      </button>

      <div class="flex-1 relative">
        <div class="absolute top-1/2 -translate-y-1/2 w-full h-2 rounded-full bg-muted pointer-events-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background">
          <div
            class="absolute top-0 left-0 h-full rounded-full bg-primary transition-all duration-200 ease-out"
            style={trackFillStyle()}
            aria-hidden="true"
          />
        </div>

        <input
          id={props.id}
          type="range"
          min={props.min}
          max={props.max}
          step={props.step}
          value={props.value}
          onInput={handleInput}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseEnter={handleFocus}
          onMouseLeave={handleBlur}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-label={`${props.label} in ${unit() === '"' ? 'inches' : unit()}`}
          aria-valuemin={props.min}
          aria-valuemax={props.max}
          aria-valuenow={props.value}
          aria-valuetext={formatValue(props.value)}
          aria-describedby={helpTextId()}
          class={`
            relative w-full h-2 appearance-none bg-transparent cursor-pointer z-10
            focus:outline-none focus:ring-[3px] focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset rounded-full
            transition-all duration-200

            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-background
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-primary
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-all
            [&::-webkit-slider-thumb]:duration-200
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:hover:shadow-lg
            [&::-webkit-slider-thumb]:hover:border-primary/80
            [&::-webkit-slider-thumb]:active:scale-105
            [&::-webkit-slider-thumb]:active:shadow-xl
            [&::-webkit-slider-thumb]:active:border-primary/70

            [&::-moz-range-thumb]:appearance-none
            [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-background
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-primary
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:transition-all
            [&::-moz-range-thumb]:duration-200
            [&::-moz-range-thumb]:hover:scale-110
            [&::-moz-range-thumb]:hover:shadow-lg
            [&::-moz-range-thumb]:hover:border-primary/80
            [&::-moz-range-thumb]:active:scale-105
            [&::-moz-range-thumb]:active:shadow-xl
            [&::-moz-range-thumb]:active:border-primary/70

            [&::-webkit-slider-runnable-track]:appearance-none
            [&::-webkit-slider-runnable-track]:h-2
            [&::-webkit-slider-runnable-track]:bg-transparent
            [&::-moz-range-track]:appearance-none
            [&::-moz-range-track]:h-2
            [&::-moz-range-track]:bg-transparent
          `}
        />

        <Show when={showTooltip()}>
          <div
            class="absolute -top-10 left-0 px-2 py-1 bg-foreground text-background text-sm rounded-md shadow-lg pointer-events-none whitespace-nowrap animate-[fadeIn_0.15s_ease-out] z-20"
            style={tooltipStyle()}
            role="tooltip"
            aria-hidden="true"
          >
            {formatValue(props.value)}
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45" />
          </div>
        </Show>

        <span id={helpTextId()} class="sr-only">
          Adjust {props.label} margin. Range {props.min} to {props.max}{' '}
          {unit() === '"' ? 'inches' : unit()}. Current value: {formatValue(props.value)}
        </span>
      </div>

      <button
        onClick={handleIncrement}
        disabled={props.value >= props.max}
        class="p-1.5 hover:bg-muted active:bg-muted/80 rounded-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ring-offset-background"
        aria-label={`Increase ${props.label} margin by ${props.step}${unit()}`}
        type="button"
      >
        <HiOutlinePlus class="w-6 h-6 text-muted-foreground" aria-hidden="true" />
      </button>

      <span
        class="text-sm w-16 text-right shrink-0 tabular-nums text-foreground"
        aria-hidden="true"
      >
        {formatValue(props.value)}
      </span>
    </div>
  );
}
