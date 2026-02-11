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
  class?: string;
}

/**
 * Page dimensions in inches for aspect ratio calculation
 */
const PAGE_DIMENSIONS = {
  Letter: { width: 8.5, height: 11 },
  A4: { width: 8.27, height: 11.69 },
  Legal: { width: 8.5, height: 14 },
};

export function MarginPreview(props: MarginPreviewProps) {
  const dimensions = () => PAGE_DIMENSIONS[props.pageSize];

  const marginPercentages = () => ({
    top: (props.margins.top / dimensions().height) * 100,
    right: (props.margins.right / dimensions().width) * 100,
    bottom: (props.margins.bottom / dimensions().height) * 100,
    left: (props.margins.left / dimensions().width) * 100,
  });

  const contentWidth = () => 100 - marginPercentages().left - marginPercentages().right;
  const contentHeight = () => 100 - marginPercentages().top - marginPercentages().bottom;

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
      class={`margin-preview ${props.class ?? ''}`}
      role="img"
      aria-label={`Page margin preview: ${props.margins.top}" top, ${props.margins.right}" right, ${props.margins.bottom}" bottom, ${props.margins.left}" left margins on ${props.pageSize} page`}
    >
      <div class="flex flex-col items-center">
        <div class="text-xs font-semibold text-foreground mb-3">Margin Preview</div>

        <div
          class="relative bg-card border-2 border-border shadow-md dark:shadow-none"
          style={{
            width: '200px',
            height: `${(dimensions().height / dimensions().width) * 200}px`,
          }}
        >
          {/* Top Margin */}
          <div
            class="absolute top-0 left-0 right-0 bg-info/30 border-info/50 border-b-2 opacity-70"
            style={{ height: `${marginPercentages().top}%` }}
            aria-hidden="true"
          >
            <div class="text-[9px] font-semibold text-info-text text-center mb-3">
              {props.margins.top}&quot;
            </div>
          </div>

          {/* Left Margin */}
          <div
            class="absolute top-0 left-0 bottom-0 bg-success/30 border-success/50 border-r-2 opacity-70"
            style={{ width: `${marginPercentages().left}%` }}
            aria-hidden="true"
          >
            <div class="text-[9px] font-semibold text-success-text absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap">
              {props.margins.left}&quot;
            </div>
          </div>

          {/* Right Margin */}
          <div
            class="absolute top-0 right-0 bottom-0 bg-success/30 border-success/50 border-l-2 opacity-70"
            style={{ width: `${marginPercentages().right}%` }}
            aria-hidden="true"
          >
            <div class="text-[9px] font-semibold text-success-text absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap">
              {props.margins.right}&quot;
            </div>
          </div>

          {/* Bottom Margin */}
          <div
            class="absolute bottom-0 left-0 right-0 bg-info/30 border-info/50 border-t-2 opacity-70"
            style={{ height: `${marginPercentages().bottom}%` }}
            aria-hidden="true"
          >
            <div class="text-[9px] font-semibold text-info-text text-center mb-3">
              {props.margins.bottom}&quot;
            </div>
          </div>

          {/* Content Area */}
          <div
            class="absolute bg-card flex flex-col justify-start p-1 overflow-hidden"
            style={{
              top: `${marginPercentages().top}%`,
              left: `${marginPercentages().left}%`,
              width: `${contentWidth()}%`,
              height: `${contentHeight()}%`,
            }}
            aria-hidden="true"
          >
            <div class="gap-2">
              <div class="h-1 bg-foreground rounded" style={TEXT_LINE_WIDTHS.full} />
              <div class="h-1 bg-muted-foreground rounded" style={TEXT_LINE_WIDTHS.wide} />
              <div class="h-1 bg-muted-foreground rounded" style={TEXT_LINE_WIDTHS.medium} />
              <div class="h-1 bg-muted-foreground rounded" style={TEXT_LINE_WIDTHS.narrow} />
              <div class="h-0.5" />
              <div class="h-1 bg-muted-foreground rounded" style={TEXT_LINE_WIDTHS.full} />
              <div class="h-1 bg-muted-foreground rounded" style={TEXT_LINE_WIDTHS.mediumWide} />
              <div class="h-1 bg-muted-foreground rounded" style={TEXT_LINE_WIDTHS.mediumNarrow} />
            </div>

            <div
              class="absolute bottom-1 right-1 text-[8px] text-muted-foreground bg-card/90 px-1 rounded"
              data-testid="dimension-label"
            >
              {(dimensions().width - props.margins.left - props.margins.right).toFixed(2)}&quot; ×{' '}
              {(dimensions().height - props.margins.top - props.margins.bottom).toFixed(2)}&quot;
            </div>
          </div>
        </div>

        {/* Legend */}
        <div class="mt-4 flex gap-4 text-[10px] text-foreground">
          <div class="flex items-center gap-1.5">
            <div
              class="w-3.5 h-3.5 bg-info/30 border-info/50 border-2 opacity-70 rounded-sm"
              aria-hidden="true"
            />
            <span>Top/Bottom</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div
              class="w-3.5 h-3.5 bg-success/30 border-success/50 border-2 opacity-70 rounded-sm"
              aria-hidden="true"
            />
            <span>Left/Right</span>
          </div>
        </div>
      </div>
    </div>
  );
}
