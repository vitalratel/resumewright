// ABOUTME: Enhanced range slider with visual track fill and tooltip.
// ABOUTME: Accessible keyboard navigation with increment/decrement buttons.

import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import React, { useMemo, useRef, useState } from 'react';

interface RangeSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
  className?: string;
}

export const RangeSlider = React.memo(
  ({
    id,
    label,
    value,
    min,
    max,
    step,
    onChange,
    unit = '"',
    className = '',
  }: RangeSliderProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);

    // P1-A11Y-002: Help text ID for aria-describedby
    const helpTextId = `${id}-help`;

    // Calculate percentage for track fill
    // Memoize percentage to prevent recalculation on unrelated re-renders
    const percentage = useMemo(() => {
      return ((value - min) / (max - min)) * 100;
    }, [value, min, max]);

    // Memoize inline styles to prevent unnecessary re-renders
    const trackFillStyle = useMemo(
      () => ({
        width: `${percentage}%`,
      }),
      [percentage],
    );

    const tooltipStyle = useMemo(
      () => ({
        left: `calc(${percentage}% - 20px)`,
        transform: 'translateX(-50%)',
      }),
      [percentage],
    );

    // Format value with locale-specific number formatting
    const formatValue = (val: number): string => {
      return `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${unit}`;
    };

    // Increment/decrement handlers
    const handleDecrement = () => {
      const newValue = Math.max(min, value - step);
      onChange(newValue);
    };

    const handleIncrement = () => {
      const newValue = Math.min(max, value + step);
      onChange(newValue);
    };

    const handleMouseDown = () => {
      setIsDragging(true);
      setShowTooltip(true);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setShowTooltip(false);
    };

    // Show tooltip on focus/hover, hide on blur/leave
    const handleFocus = () => {
      setShowTooltip(true);
    };

    const handleBlur = () => {
      if (!isDragging) {
        setShowTooltip(false);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number.parseFloat(e.target.value));
    };

    return (
      <div className={`flex items-center justify-between gap-3 ${className}`}>
        <label htmlFor={id} className="text-sm capitalize w-16 shrink-0 text-foreground">
          {label}
        </label>

        <button
          onClick={handleDecrement}
          disabled={value <= min}
          className="p-1.5 hover:bg-muted active:bg-muted/80 rounded-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ring-offset-background"
          aria-label={`Decrease ${label} margin by ${step}${unit}`}
          type="button"
        >
          <MinusIcon className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
        </button>

        <div ref={sliderRef} className="flex-1 relative">
          <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 rounded-full bg-muted pointer-events-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background">
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-primary transition-all duration-200 ease-out"
              style={trackFillStyle}
              aria-hidden="true"
            />
          </div>

          <input
            id={id}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseEnter={handleFocus}
            onMouseLeave={handleBlur}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-label={`${label} in ${unit === '"' ? 'inches' : unit}`}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-valuetext={formatValue(value)}
            aria-describedby={helpTextId}
            className={`
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

          {showTooltip && (
            <div
              className="absolute -top-10 left-0 px-2 py-1 bg-foreground text-background text-sm rounded-md shadow-lg pointer-events-none whitespace-nowrap animate-[fadeIn_0.15s_ease-out] z-20"
              style={tooltipStyle}
              role="tooltip"
              aria-hidden="true"
            >
              {formatValue(value)}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45" />
            </div>
          )}

          <span id={helpTextId} className="sr-only">
            Adjust {label} margin. Range {min} to {max} {unit === '"' ? 'inches' : unit}. Current
            value: {formatValue(value)}
          </span>
        </div>

        <button
          onClick={handleIncrement}
          disabled={value >= max}
          className="p-1.5 hover:bg-muted active:bg-muted/80 rounded-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ring-offset-background"
          aria-label={`Increase ${label} margin by ${step}${unit}`}
          type="button"
        >
          <PlusIcon className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
        </button>

        <span
          className="text-sm w-16 text-right shrink-0 tabular-nums text-foreground"
          aria-hidden="true"
        >
          {formatValue(value)}
        </span>
      </div>
    );
  },
);
