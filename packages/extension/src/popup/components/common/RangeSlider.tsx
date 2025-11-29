/**
 * RangeSlider Component
 * Enhanced range slider with visual improvements
 *
 * Features:
 * - Visual track fill showing current value
 * - Tooltip showing value on hover/drag
 * - Better step granularity (0.1 instead of 0.25)
 * - Enhanced thumb styling with shadow/hover effects
 * - Accessible keyboard navigation
 */

import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { tokens } from '../../styles/tokens';

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

export const RangeSlider = React.memo(({
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
  const trackFillStyle = useMemo(() => ({
    width: `${percentage}%`,
  }), [percentage]);

  const tooltipStyle = useMemo(() => ({
    left: `calc(${percentage}% - 20px)`,
    transform: 'translateX(-50%)',
  }), [percentage]);

  // Format value with locale-specific number formatting
  const formatValue = useCallback((val: number): string => {
    return `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${unit}`;
  }, [unit]);

  // Increment/decrement handlers
  const handleDecrement = useCallback(() => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  }, [value, min, step, onChange]);

  const handleIncrement = useCallback(() => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  }, [value, max, step, onChange]);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
    setShowTooltip(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setShowTooltip(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setShowTooltip(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) {
      setShowTooltip(false);
    }
  }, [isDragging]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number.parseFloat(e.target.value));
  }, [onChange]);

  return (
    <div className={`flex items-center justify-between ${tokens.spacing.gapMedium} ${className}`}>
      <label htmlFor={id} className={`${tokens.typography.small} capitalize w-16 flex-shrink-0 ${tokens.colors.neutral.text}`}>
        {label}
      </label>

      {/* Decrement button */}
      <button
        onClick={handleDecrement}
        disabled={value <= min}
        className={`p-1.5 ${tokens.colors.neutral.hover} ${tokens.buttons.variants.iconActive} ${tokens.borders.rounded} disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent ${tokens.transitions.fast} focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1 dark:ring-offset-gray-900`
          .trim()
          .replace(/\s+/g, ' ')}
        aria-label={`Decrease ${label} margin by ${step}${unit}`}
        type="button"
      >
        <MinusIcon className={`${tokens.icons.md} ${tokens.colors.neutral.textMuted}`} aria-hidden="true" />
      </button>

      <div
        ref={sliderRef}
        className="flex-1 relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Track background and fill */}
        {/* Added focus-within ring for WCAG 2.4.7 compliance */}
        <div className={`absolute top-1/2 -translate-y-1/2 w-full h-2 ${tokens.borders.full} ${tokens.colors.neutral.bg} pointer-events-none focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-blue-400 focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-900`}>
          {/* Filled portion */}
          <div
            className={`absolute top-0 left-0 h-full ${tokens.borders.full} ${tokens.colors.primary.bg} ${tokens.transitions.fast} ease-out`}
            style={trackFillStyle}
            aria-hidden="true"
          />
        </div>

        {/* Actual range input - Enhanced focus ring */}
        {/* WCAG 2.4.7 - Enhanced focus ring (3px, darker blue) */}
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
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          aria-label={`${label} in ${unit === '"' ? 'inches' : unit}`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={formatValue(value)}
          aria-describedby={helpTextId}
          className={`
            relative w-full h-2 appearance-none bg-transparent cursor-pointer z-${tokens.zIndex.dropdown}
            focus:outline-none focus:ring-[3px] focus:ring-blue-600 dark:focus:ring-blue-500 focus:ring-offset-2 dark:ring-offset-gray-900 rounded-full
            transition-all duration-200

            /* Webkit (Chrome/Safari) thumb styling - Enhanced states - WCAG 2.5.5: 24px min */
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            dark:[&::-webkit-slider-thumb]:bg-gray-100
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-${tokens.slider.thumbBorder}
            dark:[&::-webkit-slider-thumb]:border-${tokens.slider.thumbBorderDark}
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-all
            [&::-webkit-slider-thumb]:duration-200
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:hover:shadow-lg
            [&::-webkit-slider-thumb]:hover:border-${tokens.slider.thumbHoverBorder}
            dark:[&::-webkit-slider-thumb]:hover:border-${tokens.slider.thumbHoverBorderDark}
            [&::-webkit-slider-thumb]:active:scale-105
            [&::-webkit-slider-thumb]:active:shadow-xl
            [&::-webkit-slider-thumb]:active:border-${tokens.slider.thumbActiveBorder}
            dark:[&::-webkit-slider-thumb]:active:border-${tokens.slider.thumbActiveBorderDark}

            /* Firefox thumb styling - Enhanced states - WCAG 2.5.5: 24px min */
            [&::-moz-range-thumb]:appearance-none
            [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            dark:[&::-moz-range-thumb]:bg-gray-100
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-${tokens.slider.thumbBorder}
            dark:[&::-moz-range-thumb]:border-${tokens.slider.thumbBorderDark}
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:transition-all
            [&::-moz-range-thumb]:duration-200
            [&::-moz-range-thumb]:hover:scale-110
            [&::-moz-range-thumb]:hover:shadow-lg
            [&::-moz-range-thumb]:hover:border-${tokens.slider.thumbHoverBorder}
            dark:[&::-moz-range-thumb]:hover:border-${tokens.slider.thumbHoverBorderDark}
            [&::-moz-range-thumb]:active:scale-105
            [&::-moz-range-thumb]:active:shadow-xl
            [&::-moz-range-thumb]:active:border-${tokens.slider.thumbActiveBorder}
            dark:[&::-moz-range-thumb]:active:border-${tokens.slider.thumbActiveBorderDark}

            /* Hide default track */
            [&::-webkit-slider-runnable-track]:appearance-none
            [&::-webkit-slider-runnable-track]:h-2
            [&::-webkit-slider-runnable-track]:bg-transparent
            [&::-moz-range-track]:appearance-none
            [&::-moz-range-track]:h-2
            [&::-moz-range-track]:bg-transparent
          `}
        />

        {/* Tooltip */}
        {showTooltip && (
          <div
            className={`absolute -top-10 left-0 px-2 py-1 ${tokens.colors.tooltip.bg} ${tokens.colors.tooltip.text} ${tokens.typography.small} ${tokens.borders.rounded} shadow-lg pointer-events-none whitespace-nowrap animate-[fadeIn_0.15s_ease-out] z-${tokens.zIndex.sticky}`
              .trim()
              .replace(/\s+/g, ' ')}
            style={tooltipStyle}
            role="tooltip"
            aria-hidden="true"
          >
            {formatValue(value)}
            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 ${tokens.colors.tooltip.arrow} rotate-45`} />
          </div>
        )}

        {/* P1-A11Y-002: Help text for screen readers */}
        <span id={helpTextId} className="sr-only">
          Adjust
          {' '}
          {label}
          {' '}
          margin. Range
          {' '}
          {min}
          {' '}
          to
          {' '}
          {max}
          {' '}
          {unit === '"' ? 'inches' : unit}
          . Current value:
          {' '}
          {formatValue(value)}
        </span>
      </div>

      {/* Increment button */}
      <button
        onClick={handleIncrement}
        disabled={value >= max}
        className={`p-1.5 ${tokens.colors.neutral.hover} ${tokens.buttons.variants.iconActive} ${tokens.borders.rounded} disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent ${tokens.transitions.fast} focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1 dark:ring-offset-gray-900`
          .trim()
          .replace(/\s+/g, ' ')}
        aria-label={`Increase ${label} margin by ${step}${unit}`}
        type="button"
      >
        <PlusIcon className={`${tokens.icons.md} ${tokens.colors.neutral.textMuted}`} aria-hidden="true" />
      </button>

      {/* Value display */}
      <span className={`${tokens.typography.small} w-16 text-right flex-shrink-0 tabular-nums ${tokens.colors.neutral.text}`} aria-hidden="true">
        {formatValue(value)}
      </span>
    </div>
  );
});
