/**
 * Quick Start Screen - Onboarding Screen 3
 * First-Time User Guidance
 *
 * Feature icons tour showing what users can do with ResumeWright
 */

import type { ReactNode } from 'react';
import { ArrowDownTrayIcon, CogIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { memo } from 'react';
import { tokens } from '../../../styles/tokens';
import { TSX } from '../../common';

/**
 * Feature card with icon and description
 */
interface FeatureCardProps {
  icon: ReactNode;
  iconBgColor: string;
  title: string;
  description: ReactNode;
}

const FeatureCard = memo(({ icon, iconBgColor, title, description }: FeatureCardProps) => {
  return (
    <div
      className={`flex items-start ${tokens.spacing.gapMedium} ${tokens.spacing.alert} ${tokens.colors.neutral.bg} ${tokens.borders.roundedLg}`}
    >
      <div
        className={`flex-shrink-0 w-10 h-10 ${iconBgColor} rounded-lg flex items-center justify-center`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4
          className={`${tokens.typography.medium} ${tokens.colors.neutral.text} ${tokens.typography.small}`}
        >
          {title}
        </h4>
        <p className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted} mt-0.5`}>
          {description}
        </p>
      </div>
    </div>
  );
});

export const QuickStartScreen = memo(() => {
  return (
    <>
      {/* Icon */}
      <div className="flex justify-center">
        <div
          className={`w-16 h-16 ${tokens.colors.success.bg} rounded-full flex items-center justify-center`}
        >
          <CogIcon
            className={`${tokens.icons.lg} ${tokens.colors.success.icon}`}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Title and Description */}
      <div className="text-center">
        <h2
          className={`${tokens.typography.heroHeading} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}
        >
          Quick Start Guide
        </h2>
        <p className={tokens.colors.neutral.textMuted}>
          Here&apos;s what you can do with ResumeWright
        </p>
      </div>

      {/* Feature cards */}
      <div className={`${tokens.spacing.sectionGapCompact} text-left`}>
        <FeatureCard
          icon={
            <ArrowDownTrayIcon className={`${tokens.icons.sm} text-white`} aria-hidden="true" />
          }
          iconBgColor={tokens.icons.bgGreen}
          title="Convert to PDF"
          description="When we detect a CV, click 'Convert to PDF' to download."
        />
        <FeatureCard
          icon={<CogIcon className={`${tokens.icons.sm} text-white`} aria-hidden="true" />}
          iconBgColor={tokens.icons.bgGray}
          title="Customize Settings"
          description="Choose page size (Letter/A4), adjust margins, and set fonts."
        />
        <FeatureCard
          icon={<DocumentTextIcon className={`${tokens.icons.sm} text-white`} aria-hidden="true" />}
          iconBgColor={tokens.icons.bgBlue}
          title="Import Files"
          description={
            <>
              Import <TSX /> files downloaded from Claude to convert them to PDF.
            </>
          }
        />
      </div>

      {/* Keyboard shortcuts hint for discoverability */}
      <div
        className={`${tokens.colors.info.bg} ${tokens.spacing.alert} ${tokens.borders.roundedLg} border ${tokens.colors.info.border}`}
      >
        <p className={`${tokens.typography.small} ${tokens.colors.info.text}`}>
          💡 Tip: Press <kbd className={tokens.code.kbd}>Ctrl+/</kbd> to see all keyboard shortcuts
        </p>
      </div>
    </>
  );
});
