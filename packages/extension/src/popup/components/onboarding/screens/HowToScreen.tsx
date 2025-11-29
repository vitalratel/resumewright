/**
 * How-To Screen - Onboarding Screen 2
 * Visual example of Claude.ai UI
 *
 * Step-by-step instructions for downloading CV code from Claude.ai
 */

import type { ReactNode } from 'react';
import { ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { memo } from 'react';
import { tokens } from '../../../styles/tokens';
import { TSX } from '../../common';

/**
 * Instruction step with number prefix
 */
const InstructionStep = memo(({
  number,
  children,
}: {
  number: number;
  children: ReactNode;
}) => {
  return (
    <li className="flex items-start">
      <span className={`${tokens.typography.semibold} ${tokens.spacing.marginSmall} flex-shrink-0`}>
        {number}
        .
      </span>
      <span>{children}</span>
    </li>
  );
});

/**
 * Link to Claude.ai
 */
const ClaudeLink = memo(() => {
  return (
    <a
      href="https://claude.ai"
      target="_blank"
      rel="noopener noreferrer"
      className={`${tokens.colors.link.underline} hover:${tokens.colors.info.textStrong} ${tokens.effects.focusRingLight} rounded-sm ${tokens.transitions.default} active:${tokens.colors.info.textStrong}`}
    >
      Claude.ai
    </a>
  );
});

/**
 * Visual guide placeholder for download instructions
 */
const VisualGuidePlaceholder = memo(() => {
  return (
    <div className={`${tokens.spacing.marginMedium} border-2 border-dashed ${tokens.colors.neutral.border} ${tokens.borders.roundedLg} overflow-hidden ${tokens.colors.neutral.bg}`}>
      <div className={`${tokens.spacing.card} text-center`}>
        <div className={`flex items-center justify-center ${tokens.spacing.marginSmall}`}>
          <ArrowDownTrayIcon className={`${tokens.icons.lg} ${tokens.colors.neutral.icon}`} aria-hidden="true" />
        </div>
        <p className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}>
          Look for the Download Button
        </p>
        <p className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted} leading-relaxed`}>
          In Claude.ai, when you see a code file, hover over it to reveal the toolbar.
          Click the download icon (↓) in the top-right corner, then select &quot;Download as .tsx file&quot;.
        </p>
        <div className={`${tokens.spacing.marginMedium} inline-block ${tokens.colors.neutral.bgWhite} border ${tokens.colors.neutral.borderLight} ${tokens.borders.rounded} px-3 py-1.5 ${tokens.typography.xs} ${tokens.colors.neutral.textMuted}`}>
          Visual guide coming soon
        </div>
      </div>
    </div>
  );
});

export const HowToScreen = memo(() => {
  return (
    <>
      {/* Icon */}
      <div className="flex justify-center">
        <div className={`w-16 h-16 ${tokens.colors.success.bg} rounded-full flex items-center justify-center`}>
          <DocumentTextIcon className={`${tokens.icons.lg} ${tokens.colors.success.icon}`} aria-hidden="true" />
        </div>
      </div>

      {/* Title and Description */}
      <div className="text-center">
        <h2 className={`${tokens.typography.heroHeading} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}>
          How to Get Your CV Code
        </h2>
        <p className={tokens.colors.neutral.textMuted}>
          Import your CV file from Claude.ai to convert it to PDF
        </p>
      </div>

      {/* Step-by-step instructions */}
      <div className={`${tokens.spacing.sectionGap} text-left`}>
        <div className={`${tokens.colors.info.bg} border ${tokens.colors.info.border} ${tokens.borders.roundedLg} p-4`}>
          <h4 className={`${tokens.typography.medium} ${tokens.colors.info.textStrong} ${tokens.spacing.marginSmall}`}>Step-by-step:</h4>
          <ol className={`${tokens.spacing.gapSmall} ${tokens.typography.small} ${tokens.colors.info.text}`}>
            <InstructionStep number={1}>
              Open
              {' '}
              <ClaudeLink />
              {' '}
              and ask for a CV
            </InstructionStep>
            <InstructionStep number={2}>
              Download the CV code file as a
              {' '}
              <TSX />
              {' '}
              file
            </InstructionStep>
            <InstructionStep number={3}>
              Click the ResumeWright extension icon
            </InstructionStep>
            <InstructionStep number={4}>
              Import the
              {' '}
              <TSX />
              {' '}
              file and export to PDF!
            </InstructionStep>
          </ol>
        </div>

        {/* Visual Guide Placeholder - */}
        <VisualGuidePlaceholder />

        <div className={`${tokens.typography.small} ${tokens.colors.neutral.textMuted} italic`}>
          💡 Tip: The download button appears when you hover over the code file panel.
        </div>
      </div>
    </>
  );
});