// ABOUTME: Visual margin preview component for PDF settings.
// ABOUTME: Displays real-time margin visualization with page size awareness.

interface MarginPreviewProps {
  /** Current page size setting */
  pageSize: 'Letter' | 'A4' | 'Legal';

  /** Current margin settings in inches */
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  /** Optional CSS class name */
  className?: string;
}

/**
 * Page dimensions in inches for aspect ratio calculation
 */
const PAGE_DIMENSIONS = {
  Letter: { width: 8.5, height: 11 },
  A4: { width: 8.27, height: 11.69 },
  Legal: { width: 8.5, height: 14 },
};

export function MarginPreview({ pageSize, margins, className = '' }: MarginPreviewProps) {
  const dimensions = PAGE_DIMENSIONS[pageSize];

  // Calculate percentage margins for visual display
  // Removed useMemo - premature optimization for simple calculations
  const marginPercentages = {
    top: (margins.top / dimensions.height) * 100,
    right: (margins.right / dimensions.width) * 100,
    bottom: (margins.bottom / dimensions.height) * 100,
    left: (margins.left / dimensions.width) * 100,
  };

  // Calculate content area percentage
  const contentWidth = 100 - marginPercentages.left - marginPercentages.right;
  const contentHeight = 100 - marginPercentages.top - marginPercentages.bottom;

  // Inline styles without memoization - simpler, negligible performance cost
  const pageContainerStyle = {
    width: '200px',
    height: `${(dimensions.height / dimensions.width) * 200}px`,
  };

  const topMarginStyle = {
    height: `${marginPercentages.top}%`,
  };

  const leftMarginStyle = {
    width: `${marginPercentages.left}%`,
  };

  const rightMarginStyle = {
    width: `${marginPercentages.right}%`,
  };

  const bottomMarginStyle = {
    height: `${marginPercentages.bottom}%`,
  };

  const contentAreaStyle = {
    top: `${marginPercentages.top}%`,
    left: `${marginPercentages.left}%`,
    width: `${contentWidth}%`,
    height: `${contentHeight}%`,
  };

  // Static text line widths (no need to memoize since they're constant)
  const TEXT_LINE_WIDTHS = {
    full: { width: '100%' },
    wide: { width: '95%' },
    medium: { width: '90%' },
    narrow: { width: '85%' },
    mediumWide: { width: '92%' },
    mediumNarrow: { width: '88%' },
  };

  return (
    <div
      className={`margin-preview ${className}`}
      role="img"
      aria-label={`Page margin preview: ${margins.top}" top, ${margins.right}" right, ${margins.bottom}" bottom, ${margins.left}" left margins on ${pageSize} page`}
    >
      {/* Preview Container */}
      <div className="flex flex-col items-center">
        {/* Title */}
        <div className="text-xs font-semibold text-foreground mb-3">Margin Preview</div>

        {/* Page Preview */}
        <div
          className="relative bg-card border-2 border-border shadow-md dark:shadow-none"
          style={pageContainerStyle}
        >
          {/* Top Margin */}
          <div
            className="absolute top-0 left-0 right-0 bg-info/30 border-info/50 border-b-2 opacity-70"
            style={topMarginStyle}
            aria-hidden="true"
          >
            <div className="text-[9px] font-semibold text-info-text text-center mb-3">
              {margins.top}
              &quot;
            </div>
          </div>

          {/* Left Margin */}
          <div
            className="absolute top-0 left-0 bottom-0 bg-success/30 border-success/50 border-r-2 opacity-70"
            style={leftMarginStyle}
            aria-hidden="true"
          >
            <div className="text-[9px] font-semibold text-success-text absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap">
              {margins.left}
              &quot;
            </div>
          </div>

          {/* Right Margin */}
          <div
            className="absolute top-0 right-0 bottom-0 bg-success/30 border-success/50 border-l-2 opacity-70"
            style={rightMarginStyle}
            aria-hidden="true"
          >
            <div className="text-[9px] font-semibold text-success-text absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap">
              {margins.right}
              &quot;
            </div>
          </div>

          {/* Bottom Margin */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-info/30 border-info/50 border-t-2 opacity-70"
            style={bottomMarginStyle}
            aria-hidden="true"
          >
            <div className="text-[9px] font-semibold text-info-text text-center mb-3">
              {margins.bottom}
              &quot;
            </div>
          </div>

          {/* Content Area */}
          <div
            className="absolute bg-card flex flex-col justify-start p-1 overflow-hidden"
            style={contentAreaStyle}
            aria-hidden="true"
          >
            {/* Simulated text lines to show content area */}
            <div className="gap-2">
              <div className="h-1 bg-foreground rounded" style={TEXT_LINE_WIDTHS.full} />
              <div className="h-1 bg-muted-foreground rounded" style={TEXT_LINE_WIDTHS.wide} />
              <div className="h-1 bg-muted-foreground rounded" style={TEXT_LINE_WIDTHS.medium} />
              <div className="h-1 bg-muted-foreground rounded" style={TEXT_LINE_WIDTHS.narrow} />
              <div className="h-0.5" />
              <div className="h-1 bg-muted-foreground rounded" style={TEXT_LINE_WIDTHS.full} />
              <div
                className="h-1 bg-muted-foreground rounded"
                style={TEXT_LINE_WIDTHS.mediumWide}
              />
              <div
                className="h-1 bg-muted-foreground rounded"
                style={TEXT_LINE_WIDTHS.mediumNarrow}
              />
            </div>

            {/* Content area dimensions label */}
            <div
              className="absolute bottom-1 right-1 text-[8px] text-muted-foreground bg-card/90 px-1 rounded"
              data-testid="dimension-label"
            >
              {(dimensions.width - margins.left - margins.right).toFixed(2)}
              &quot; × {(dimensions.height - margins.top - margins.bottom).toFixed(2)}
              &quot;
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex gap-4 text-[10px] text-foreground">
          <div className="flex items-center gap-1.5">
            <div
              className="w-3.5 h-3.5 bg-info/30 border-info/50 border-2 opacity-70 rounded-sm"
              aria-hidden="true"
            />
            <span>Top/Bottom</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3.5 h-3.5 bg-success/30 border-success/50 border-2 opacity-70 rounded-sm"
              aria-hidden="true"
            />
            <span>Left/Right</span>
          </div>
        </div>
      </div>
    </div>
  );
}
