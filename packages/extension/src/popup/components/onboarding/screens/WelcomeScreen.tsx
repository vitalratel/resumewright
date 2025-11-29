/**
 * Welcome Screen - Onboarding Screen 1
 * First-Time User Guidance
 *
 * Displays value proposition with feature highlights
 */

import type { ReactNode } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { memo } from 'react';
import { tokens } from '../../../styles/tokens';
import { ATS } from '../../common';

/**
 * Reusable feature item component
 */
interface FeatureItemProps {
  icon: string;
  iconColor: 'green' | 'blue' | 'primary';
  title: ReactNode;
  description: string;
}

const FeatureItem = memo(({
  icon,
  iconColor,
  title,
  description,
}: FeatureItemProps) => {
  const colorClasses = {
    green: `${tokens.colors.success.bg} ${tokens.colors.success.text}`,
    blue: `${tokens.colors.info.bg} ${tokens.colors.info.text}`,
    primary: `${tokens.colors.primary.bg} ${tokens.colors.primary.text}`,
  };

  return (
    <div className={`flex items-start ${tokens.spacing.gapMedium}`}>
      <div className={`flex-shrink-0 w-8 h-8 ${colorClasses[iconColor]} rounded-full flex items-center justify-center mt-0.5`}>
        <span className={`${tokens.typography.semibold} ${tokens.typography.small}`}>{icon}</span>
      </div>
      <div>
        <h4 className={`${tokens.typography.medium} ${tokens.colors.neutral.text}`}>{title}</h4>
        <p className={`${tokens.typography.small} ${tokens.colors.neutral.textMuted}`}>{description}</p>
      </div>
    </div>
  );
});

export const WelcomeScreen = memo(() => {
  return (
    <>
      {/* Icon */}
      <div className="flex justify-center">
        <div className={`w-16 h-16 ${tokens.colors.success.bg} rounded-full flex items-center justify-center`}>
          <SparklesIcon className={`${tokens.icons.lg} ${tokens.colors.success.icon}`} aria-hidden="true" />
        </div>
      </div>

      {/* Title and Description */}
      <div className="text-center">
        <h2 id="onboarding-title" className={`${tokens.typography.heroHeading} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}>
          Welcome to ResumeWright!
        </h2>
        <p className={tokens.colors.neutral.textMuted}>
          Turn Claude-generated CVs into professional PDFs instantly.
        </p>
      </div>

      {/* Features */}
      <div className={`${tokens.spacing.sectionGap} text-left`}>
        <FeatureItem
          icon="✓"
          iconColor="green"
          title="100% Private"
          description="All processing happens in your browser. No data leaves your computer."
        />
        <FeatureItem
          icon="⚡"
          iconColor="blue"
          title="Lightning Fast"
          description="Convert your CV in seconds, not minutes."
        />
        <FeatureItem
          icon="📄"
          iconColor="primary"
          title={(
            <>
              <ATS />
              -Friendly
            </>
          )}
          description="PDFs optimized for applicant tracking systems."
        />
      </div>
    </>
  );
});
