/**
 * Design Tokens
 * Centralized design system tokens for ResumeWright extension
 *
 * These tokens ensure consistent styling across all components
 * and eliminate code duplication. All components should use these
 * tokens instead of hardcoded Tailwind classes.
 */

export const tokens = {
  colors: {
    // Semantic colors for alerts and status messages
    error: {
      bg: 'bg-red-50 dark:bg-red-950',
      border: 'border-red-200 dark:border-red-700',
      text: 'text-red-700 dark:text-red-400',
      textStrong: 'text-red-800 dark:text-red-300',
      hover: 'hover:bg-red-100 dark:hover:bg-red-900',
      icon: 'text-red-600 dark:text-red-400',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-950',
      border: 'border-green-200 dark:border-green-700',
      borderStrong: 'border-green-500 dark:border-green-600',
      text: 'text-green-700 dark:text-green-400',
      textStrong: 'text-green-800 dark:text-green-300',
      hover: 'hover:bg-green-100 dark:hover:bg-green-900',
      icon: 'text-green-600 dark:text-green-400',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-200 dark:border-blue-700',
      text: 'text-blue-700 dark:text-blue-400',
      textStrong: 'text-blue-800 dark:text-blue-300',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900',
      icon: 'text-blue-600 dark:text-blue-400',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      border: 'border-yellow-200 dark:border-yellow-700',
      text: 'text-yellow-700 dark:text-yellow-400',
      textStrong: 'text-yellow-800 dark:text-yellow-300',
      hover: 'hover:bg-yellow-100 dark:hover:bg-yellow-900',
      icon: 'text-yellow-600 dark:text-yellow-400',
    },
    neutral: {
      text: 'text-gray-900 dark:text-gray-50',
      textMuted: 'text-gray-600 dark:text-gray-400',
      textLight: 'text-gray-600 dark:text-gray-400', // Changed from gray-500 (3.13:1) to gray-400 (5.96:1) for WCAG AA compliance
      icon: 'text-gray-600 dark:text-gray-400', // Icon color with proper dark mode contrast
      border: 'border-gray-300 dark:border-gray-700',
      borderLight: 'border-gray-200 dark:border-gray-800',
      bg: 'bg-gray-50 dark:bg-gray-850',
      bgWhite: 'bg-white dark:bg-gray-850',
      bgPage: 'bg-gray-50 dark:bg-gray-900', // Page/container background
      hover: 'hover:bg-gray-100 dark:hover:bg-gray-700',
    },
    borders: {
      default: 'border-gray-300 dark:border-gray-700',
      light: 'border-gray-200 dark:border-gray-800',
      primary: 'border-blue-300 dark:border-blue-600',
      success: 'border-green-500 dark:border-green-600',
      error: 'border-red-300 dark:border-red-700',
    },
    disabled: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-400 dark:text-gray-600',
      border: 'border-gray-200 dark:border-gray-700',
    },
    primary: {
      text: 'text-blue-600 dark:text-blue-300',
      bg: 'bg-blue-600 dark:bg-blue-700', // Changed from blue-500 (3.76:1) to blue-600 (4.68:1) for WCAG AA white text contrast
      // Enhanced hover contrast (blue-700 light, blue-500 dark)
      hover: 'hover:bg-blue-700 dark:hover:bg-blue-500',
      focus: 'focus:ring-blue-500 dark:focus:ring-blue-400',
    },
    link: {
      text: 'text-blue-600 dark:text-blue-400',
      hover: 'hover:text-blue-700 dark:hover:text-blue-300',
      underline: 'underline',
      hoverUnderline: 'hover:underline',
    },
    tooltip: {
      bg: 'bg-gray-900 dark:bg-gray-100',
      text: 'text-white dark:text-gray-900',
      arrow: 'bg-gray-900 dark:bg-gray-100',
    },
    loading: {
      spinner: 'border-blue-100 border-t-blue-600',
      spinnerDark: 'dark:border-blue-900 dark:border-t-blue-400',
      skeleton: 'bg-blue-50',
    },
  },
  spacing: {
    alert: 'p-3',
    card: 'p-4',
    cardSmall: 'p-3',
    cardGenerous: 'p-6 md:p-8',
    cardFullPage: 'p-8',
    gapSmall: 'gap-2',
    gapMedium: 'gap-3',
    gapLarge: 'gap-4',
    marginSmall: 'mb-3',
    marginMedium: 'mb-4',
    marginLarge: 'mb-6',
    paddingX: 'px-3',
    paddingY: 'py-2',
    paddingYContent: 'py-4',
    sectionGap: 'space-y-6 md:space-y-8',
    sectionGapCompact: 'space-y-4 md:space-y-6',
    stack: 'space-y-4',
    containerPadding: 'px-6 py-8 md:px-8 md:py-10',
    heroSpacing: 'space-y-6 md:space-y-8',
  },
  typography: {
    xs: 'text-xs',
    small: 'text-sm',
    base: 'text-base',
    large: 'text-lg',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    heroHeading: 'text-3xl md:text-3.5xl font-semibold text-balance',
    sectionHeading: 'text-2xl md:text-2.5xl font-semibold text-balance',
    cardHeading: 'text-xl font-medium text-balance',
    bodyLarge: 'text-base',
    bodyEmphasis: 'text-base font-medium',
    lineHeight: {
      tight: 'leading-tight',
      normal: 'leading-normal',
      relaxed: 'leading-relaxed',
    },
  },
  transitions: {
    // WCAG 2.2.2: 300-400ms for comfortable perception
    fast: 'transition-all duration-200', // For immediate feedback only
    default: 'transition-all duration-300', // Standard transitions (WCAG compliant)
    slow: 'transition-all duration-400', // For important state changes
    easeInOut: 'ease-in-out',
    // Respect user's motion preferences
    reducedMotion: 'motion-reduce:transition-none',
  },
  effects: {
    hoverScale: 'hover:scale-105 active:scale-95',
    hoverBorder: 'hover:border-gray-400 dark:hover:border-gray-600',
    focusRing: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-blue-400 dark:ring-offset-gray-900',
    focusRingLight: 'focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-400',
    focusRingEnhanced: 'focus:outline-none focus:ring-[3px] focus:ring-blue-600 dark:focus:ring-blue-500 focus:ring-offset-2 dark:ring-offset-gray-900', // Enhanced visibility for form inputs
    focusRounded: 'focus:outline-none focus:ring-2 focus:ring-blue-300 focus:rounded dark:focus:ring-blue-400',
    disabledState: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800',

    // Shadows - use borders in dark mode for subtle separation
    shadow: 'shadow-sm dark:shadow-none dark:border dark:border-gray-700',
    shadowMd: 'shadow-md dark:shadow-none dark:border dark:border-gray-700',
    shadowLg: 'shadow-lg dark:shadow-none dark:border dark:border-gray-600',
    shadowXl: 'shadow-xl dark:shadow-none dark:border-2 dark:border-gray-600',

    // Shadows for interactive elements (keep shadow in dark mode for depth)
    shadowInteractive: 'shadow-sm hover:shadow-md dark:shadow-sm dark:hover:shadow-lg',
    shadowInteractiveLg: 'shadow-lg hover:shadow-xl dark:shadow-md dark:hover:shadow-lg',
  },
  animations: {
    bounceOnce: 'animate-bounce-once',
    checkIn: 'animate-check-in',
    fadeIn: 'animate-fade-in',
    spin: 'animate-spin',
  },
  borders: {
    default: 'border',
    rounded: 'rounded-md',
    roundedLg: 'rounded-lg',
    full: 'rounded-full',
  },
  buttons: {
    compact: {
      primary: 'px-4 py-2 min-h-[38px]',
      secondary: 'px-3 py-1.5 min-h-[36px]',
    },
    default: {
      primary: 'px-6 py-3 min-h-12',
      secondary: 'px-5 py-2.5 min-h-11',
    },
    hero: {
      primary: 'px-8 py-4 min-h-14',
    },
    iconOnly: {
      default: 'min-w-11 min-h-11 p-2',
      large: 'min-w-12 min-h-12 p-2.5',
    },
    variants: {
      danger: 'bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-500 active:bg-red-700',
      warning: 'bg-yellow-600 dark:bg-yellow-500 hover:bg-yellow-700 dark:hover:bg-yellow-600 active:bg-yellow-800',
      success: 'bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-500 active:bg-green-700 dark:active:bg-green-400',
      // Improved dark mode hover contrast (gray-800 → gray-700 for 3:1 contrast ratio)
      // Fixed dark mode hover contrast (gray-700 → gray-600 for 3:1 WCAG ratio)
      ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 border border-transparent hover:border-gray-300 dark:hover:border-gray-600',
      ghostPrimary: 'hover:bg-blue-500/30 dark:hover:bg-blue-400/30',
      link: 'bg-transparent hover:underline hover:text-blue-600 dark:hover:text-blue-400 active:text-blue-700 dark:active:text-blue-300 p-0',
      // Improved dark mode hover contrast (gray-700 → gray-600)
      tertiary: 'hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500',
      secondaryBorder: 'hover:bg-gray-50 dark:hover:bg-gray-600 active:bg-gray-100 dark:active:bg-gray-500',
      iconActive: 'active:bg-gray-200 dark:active:bg-gray-700',
    },
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-gray-500',
  },
  icons: {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
    hero: 'w-12 h-12',
    xxl: 'w-16 h-16',
    // Icon background colors for feature cards and badges
    bgGreen: 'bg-green-500',
    bgBlue: 'bg-blue-500',
    bgGray: 'bg-gray-500',
  },
  layout: {
    maxWidthPopup: 'max-w-md',
    maxWidthConverter: '672px', // CSS value for inline style (equivalent to Tailwind max-w-2xl)
    // Extract popup dimensions to tokens
    popupWidth: 'max-w-md', // 448px in Tailwind
    popupHeight: '600px',
  },
  code: {
    inline: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-1 rounded',
    kbd: 'px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs',
  },
  gradients: {
    blueHeader: 'bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800',
  },
  marginPreview: {
    // Enhanced dark mode contrast for better visibility
    topBottom: 'bg-blue-200 dark:bg-blue-700 border-blue-400 dark:border-blue-500',
    topBottomText: 'text-blue-800 dark:text-blue-100',
    leftRight: 'bg-green-200 dark:bg-green-700 border-green-400 dark:border-green-500',
    leftRightText: 'text-green-800 dark:text-green-100',
    contentLine: 'bg-gray-800 dark:bg-gray-200',
    contentLineFade: 'bg-gray-600 dark:bg-gray-300',
  },
  table: {
    header: 'border-b border-gray-200 dark:border-gray-700',
    headerCell: 'py-2 text-gray-700 dark:text-gray-300 font-medium',
    body: 'divide-y divide-gray-100 dark:divide-gray-700',
    cell: 'py-2 text-gray-700 dark:text-gray-300',
  },
  slider: {
    // Slider/range input specific tokens for RangeSlider component
    // These colors are intentionally more vibrant than primary borders for better interactivity
    thumbBorder: 'blue-500',
    thumbBorderDark: 'blue-400',
    thumbHoverBorder: 'blue-600',
    thumbHoverBorderDark: 'blue-300',
    thumbActiveBorder: 'blue-700',
    thumbActiveBorderDark: 'blue-500',
  },
  zIndex: {
    // Z-index scale for consistent stacking contexts
    // Use these values for new components to maintain proper layering
    base: 0,
    dropdown: 10, // AppHeader (z-10), RangeSlider input (z-10)
    sticky: 20, // RangeSlider tooltip (currently z-20)
    backdrop: 40, // Modal backdrop (currently z-40)
    modal: 50, // ConfirmDialog (z-50), OnboardingModal (z-50), CVPreviewModal (z-50), skip link focus (z-50)
    tooltip: 60, // Reserved for future tooltips
  },
} as const;

/**
 * Type-safe token accessor
 * Use this to ensure tokens are used correctly throughout the codebase
 */
export type TokenPath
  = | keyof typeof tokens.colors
    | keyof typeof tokens.spacing
    | keyof typeof tokens.typography
    | keyof typeof tokens.transitions
    | keyof typeof tokens.effects
    | keyof typeof tokens.borders;
