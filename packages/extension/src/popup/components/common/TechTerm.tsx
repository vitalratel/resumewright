/**
 * TechTerm Component
 * P2-A11Y-009: Technical terms explained with tooltips
 *
 * Wraps technical terms with accessible tooltips/abbreviations
 * to help users understand unfamiliar jargon.
 */

import type { ReactNode } from 'react';
import { TECH_TERMS } from '../../constants/techTerms';
import { tokens } from '../../styles/tokens';

interface TechTermProps {
  /** The technical term to display */
  term: string;

  /** Full explanation of the term */
  explanation: string;

  /** Optional children (if not provided, term is used) */
  children?: ReactNode;

  /** Whether to show as underlined abbreviation (default: true) */
  showUnderline?: boolean;
}

/**
 * TechTerm displays technical terms with accessible tooltips
 * Uses <abbr> element with title attribute for native browser tooltips
 * and keyboard/screen reader accessibility
 */
export function TechTerm({ term, explanation, children, showUnderline = true }: TechTermProps) {
  return (
    <abbr
      title={explanation}
      className={`
        ${showUnderline ? `border-b border-dotted ${tokens.colors.neutral.border}` : ''}
        cursor-help
        no-underline
        ${tokens.transitions.default}
        ${tokens.effects.hoverBorder}
        ${tokens.effects.focusRingLight}
        ${tokens.borders.rounded}
      `
        .trim()
        .replace(/\s+/g, ' ')}
      aria-label={`${term}: ${explanation}`}
    >
      {children ?? term}
    </abbr>
  );
}

// Add displayName for React DevTools
TechTerm.displayName = 'TechTerm';

/**
 * Pre-configured TechTerm components for common terms
 * DisplayNames added for React DevTools
 */
export const TSX = () => <TechTerm {...TECH_TERMS.TSX} />;
TSX.displayName = 'TSX';

export const WASM = () => <TechTerm {...TECH_TERMS.WASM} />;
WASM.displayName = 'WASM';

export const ATS = () => <TechTerm {...TECH_TERMS.ATS} />;
ATS.displayName = 'ATS';

export const PDF = () => <TechTerm {...TECH_TERMS.PDF} />;
PDF.displayName = 'PDF';

export const CV = () => <TechTerm {...TECH_TERMS.CV} />;
CV.displayName = 'CV';

export const DPI = () => <TechTerm {...TECH_TERMS.DPI} />;
DPI.displayName = 'DPI';

export const MB = () => <TechTerm {...TECH_TERMS.MB} />;
MB.displayName = 'MB';

export const KB = () => <TechTerm {...TECH_TERMS.KB} />;
KB.displayName = 'KB';
