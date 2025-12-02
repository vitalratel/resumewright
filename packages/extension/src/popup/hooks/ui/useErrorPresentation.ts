/**
 * Hook for error presentation (icon, colors, labels)
 * Extracted from ErrorState component for reusability
 */

import type { ErrorCategory } from '@/shared/errors/';
import { ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useMemo } from 'react';
import { ErrorCategory as ErrorCategoryEnum } from '@/shared/errors/';
import { tokens } from '../../styles/tokens';

interface ErrorPresentation {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconClass: string;
  bgClass: string;
  iconLabel: string;
}

/**
 * Get icon and color based on error category
 *
 * - Warning icon for fixable errors (SYNTAX, SIZE)
 * - Error icon for serious errors (SYSTEM, NETWORK, UNKNOWN)
 */
export function useErrorPresentation(category?: ErrorCategory): ErrorPresentation {
  return useMemo(() => {
    const isWarning = category === ErrorCategoryEnum.SYNTAX || category === ErrorCategoryEnum.SIZE;

    return {
      Icon: isWarning ? ExclamationTriangleIcon : XCircleIcon,
      iconClass: isWarning ? tokens.colors.warning.icon : tokens.colors.error.icon,
      bgClass: isWarning ? tokens.colors.warning.bg : tokens.colors.error.bg,
      iconLabel: isWarning ? 'Warning' : 'Error',
    };
  }, [category]);
}
