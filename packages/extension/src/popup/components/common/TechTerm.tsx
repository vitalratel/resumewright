// ABOUTME: Technical terms with accessible tooltips/abbreviations.
// ABOUTME: Helps users understand unfamiliar jargon with native browser tooltips.

import type { ReactNode } from 'react';
import { TECH_TERMS } from '../../constants/techTerms';

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

export function TechTerm({ term, explanation, children, showUnderline = true }: TechTermProps) {
  return (
    <abbr
      title={explanation}
      className={`
        ${showUnderline ? 'border-b border-dotted border-border' : ''}
        cursor-help no-underline transition-all duration-300
        hover:border-muted-foreground
        focus:outline-none focus:ring-2 focus:ring-ring
        rounded-md
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
