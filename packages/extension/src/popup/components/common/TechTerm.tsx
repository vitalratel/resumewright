// ABOUTME: Technical terms with accessible tooltips/abbreviations.
// ABOUTME: Helps users understand unfamiliar jargon with native browser tooltips.

import type { JSX } from 'solid-js';
import { TECH_TERMS } from '../../constants/techTerms';

interface TechTermProps {
  /** The technical term to display */
  term: string;

  /** Full explanation of the term */
  explanation: string;

  /** Optional children (if not provided, term is used) */
  children?: JSX.Element;

  /** Whether to show as underlined abbreviation (default: true) */
  showUnderline?: boolean;
}

export function TechTerm(props: TechTermProps) {
  const showUnderline = () => props.showUnderline ?? true;
  return (
    <abbr
      title={props.explanation}
      class={`
        ${showUnderline() ? 'border-b border-dotted border-border' : ''}
        cursor-help no-underline transition-all duration-300
        hover:border-muted-foreground
        focus:outline-none focus:ring-2 focus:ring-ring
        rounded-md
      `
        .trim()
        .replace(/\s+/g, ' ')}
      aria-label={`${props.term}: ${props.explanation}`}
    >
      {props.children ?? props.term}
    </abbr>
  );
}

/**
 * Pre-configured TechTerm components for common terms
 */
export const TSX = () => <TechTerm {...TECH_TERMS.TSX} />;

export const WASM = () => <TechTerm {...TECH_TERMS.WASM} />;

export const ATS = () => <TechTerm {...TECH_TERMS.ATS} />;

export const PDF = () => <TechTerm {...TECH_TERMS.PDF} />;

export const CV = () => <TechTerm {...TECH_TERMS.CV} />;

export const DPI = () => <TechTerm {...TECH_TERMS.DPI} />;

export const MB = () => <TechTerm {...TECH_TERMS.MB} />;

export const KB = () => <TechTerm {...TECH_TERMS.KB} />;
