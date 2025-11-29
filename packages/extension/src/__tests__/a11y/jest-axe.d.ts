/**
 * Type declarations for jest-axe
 * Provides type safety for accessibility testing matchers
 */

declare module 'jest-axe' {
  import type { RunOptions } from 'axe-core';

  export function axe(
    html: Element | Document | string,
    options?: RunOptions,
  ): Promise<{
    violations: Array<{
      id: string;
      impact: string | null;
      tags: string[];
      description: string;
      help: string;
      helpUrl: string;
      nodes: Array<{
        html: string;
        impact: string | null;
        target: string[];
      }>;
    }>;
  }>;

  export function toHaveNoViolations(): {
    toHaveNoViolations: (results: unknown) => {
      pass: boolean;
      message: () => string;
    };
  };
}
