/**
 * ABOUTME: Tests for TechTerm component and pre-configured term components.
 * ABOUTME: Validates tooltip rendering, accessibility, underline styling, and term constants.
 */

import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';
import { TECH_TERMS } from '../../../constants/techTerms';
import { ATS, CV, DPI, KB, MB, PDF, TechTerm, TSX, WASM } from '../TechTerm';

describe('TechTerm', () => {
  describe('Basic Rendering', () => {
    it('renders term text', () => {
      const { getByText } = render(() => (
        <TechTerm term="API" explanation="Application Programming Interface" />
      ));
      expect(getByText('API')).toBeInTheDocument();
    });

    it('renders as abbr element', () => {
      const { container } = render(() => (
        <TechTerm term="API" explanation="Application Programming Interface" />
      ));
      const abbr = container.querySelector('abbr');
      expect(abbr).toBeInTheDocument();
    });

    it('sets title attribute with explanation', () => {
      const { container } = render(() => (
        <TechTerm term="API" explanation="Application Programming Interface" />
      ));
      const abbr = container.querySelector('abbr');
      expect(abbr).toHaveAttribute('title', 'Application Programming Interface');
    });

    it('sets aria-label with term and explanation', () => {
      const { container } = render(() => (
        <TechTerm term="API" explanation="Application Programming Interface" />
      ));
      const abbr = container.querySelector('abbr');
      expect(abbr).toHaveAttribute('aria-label', 'API: Application Programming Interface');
    });
  });

  describe('Children Prop', () => {
    it('displays term when no children provided', () => {
      const { getByText } = render(() => (
        <TechTerm term="PDF" explanation="Portable Document Format" />
      ));
      expect(getByText('PDF')).toBeInTheDocument();
    });

    it('displays children when provided', () => {
      const { getByText } = render(() => (
        <TechTerm term="PDF" explanation="Portable Document Format">
          PDF files
        </TechTerm>
      ));
      expect(getByText('PDF files')).toBeInTheDocument();
    });

    it('supports complex children', () => {
      const { getByText } = render(() => (
        <TechTerm term="WASM" explanation="WebAssembly">
          <strong>WASM</strong> module
        </TechTerm>
      ));
      expect(getByText('WASM')).toBeInTheDocument();
      expect(getByText('module')).toBeInTheDocument();
    });

    it('preserves aria-label even with children', () => {
      const { container } = render(() => (
        <TechTerm term="API" explanation="Application Programming Interface">
          API endpoint
        </TechTerm>
      ));
      const abbr = container.querySelector('abbr');
      expect(abbr).toHaveAttribute('aria-label', 'API: Application Programming Interface');
    });
  });

  describe('Underline Styling', () => {
    it('shows underline by default', () => {
      const { container } = render(() => <TechTerm term="TSX" explanation="TypeScript XML" />);
      const abbr = container.querySelector('abbr');
      expect(abbr).toHaveClass('border-b', 'border-dotted');
    });

    it('shows underline when showUnderline is true', () => {
      const { container } = render(() => (
        <TechTerm term="TSX" explanation="TypeScript XML" showUnderline={true} />
      ));
      const abbr = container.querySelector('abbr');
      expect(abbr).toHaveClass('border-b', 'border-dotted');
    });

    it('hides underline when showUnderline is false', () => {
      const { container } = render(() => (
        <TechTerm term="TSX" explanation="TypeScript XML" showUnderline={false} />
      ));
      const abbr = container.querySelector('abbr');
      expect(abbr).not.toHaveClass('border-b');
      expect(abbr).not.toHaveClass('border-dotted');
    });
  });

  describe('CSS Classes', () => {
    it('applies cursor-help class', () => {
      const { container } = render(() => <TechTerm term="CV" explanation="Curriculum Vitae" />);
      const abbr = container.querySelector('abbr');
      expect(abbr).toHaveClass('cursor-help');
    });

    it('applies no-underline class', () => {
      const { container } = render(() => <TechTerm term="CV" explanation="Curriculum Vitae" />);
      const abbr = container.querySelector('abbr');
      expect(abbr).toHaveClass('no-underline');
    });

    it('applies transition classes', () => {
      const { container } = render(() => <TechTerm term="CV" explanation="Curriculum Vitae" />);
      const abbr = container.querySelector('abbr');
      expect(abbr).toHaveClass('transition-all', 'duration-300');
    });

    it('applies rounded class', () => {
      const { container } = render(() => <TechTerm term="CV" explanation="Curriculum Vitae" />);
      const abbr = container.querySelector('abbr');
      expect(abbr).toHaveClass('rounded-md');
    });
  });

  describe('Accessibility', () => {
    it('provides both title and aria-label', () => {
      const { container } = render(() => (
        <TechTerm term="ATS" explanation="Applicant Tracking System" />
      ));
      const abbr = container.querySelector('abbr');
      expect(abbr).toHaveAttribute('title', 'Applicant Tracking System');
      expect(abbr).toHaveAttribute('aria-label', 'ATS: Applicant Tracking System');
    });

    it('aria-label includes both term and explanation', () => {
      const { container } = render(() => <TechTerm term="DPI" explanation="Dots Per Inch" />);
      const abbr = container.querySelector('abbr');
      const ariaLabel = abbr?.getAttribute('aria-label');
      expect(ariaLabel).toContain('DPI');
      expect(ariaLabel).toContain('Dots Per Inch');
    });

    it('title attribute shows on hover for native tooltips', () => {
      const { container } = render(() => (
        <TechTerm term="MB" explanation="Megabyte - Unit of digital storage" />
      ));
      const abbr = container.querySelector('abbr');
      expect(abbr).toHaveAttribute('title', 'Megabyte - Unit of digital storage');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty term', () => {
      const { container } = render(() => <TechTerm term="" explanation="Test explanation" />);
      expect(container.querySelector('abbr')).toBeInTheDocument();
    });

    it('handles empty explanation', () => {
      const { container } = render(() => <TechTerm term="TEST" explanation="" />);
      const abbr = container.querySelector('abbr');
      expect(abbr).toHaveAttribute('title', '');
      expect(abbr).toHaveAttribute('aria-label', 'TEST: ');
    });

    it('handles long explanations', () => {
      const longExplanation = 'A'.repeat(500);
      const { container } = render(() => <TechTerm term="TEST" explanation={longExplanation} />);
      const abbr = container.querySelector('abbr');
      expect(abbr).toHaveAttribute('title', longExplanation);
    });

    it('handles special characters in term', () => {
      const { getByText } = render(() => (
        <TechTerm term="C++" explanation="Programming language" />
      ));
      expect(getByText('C++')).toBeInTheDocument();
    });

    it('handles HTML entities in explanation', () => {
      const { container } = render(() => <TechTerm term="TEST" explanation="Uses <brackets>" />);
      const abbr = container.querySelector('abbr');
      expect(abbr).toHaveAttribute('title', 'Uses <brackets>');
    });
  });
});

describe('TECH_TERMS Constants', () => {
  it('contains all expected terms', () => {
    expect(TECH_TERMS).toHaveProperty('TSX');
    expect(TECH_TERMS).toHaveProperty('WASM');
    expect(TECH_TERMS).toHaveProperty('ATS');
    expect(TECH_TERMS).toHaveProperty('PDF');
    expect(TECH_TERMS).toHaveProperty('CV');
    expect(TECH_TERMS).toHaveProperty('DPI');
    expect(TECH_TERMS).toHaveProperty('MB');
    expect(TECH_TERMS).toHaveProperty('KB');
  });

  it('TSX has correct term and explanation', () => {
    expect(TECH_TERMS.TSX.term).toBe('TSX');
    expect(TECH_TERMS.TSX.explanation).toContain('TypeScript XML');
  });

  it('WASM has correct term and explanation', () => {
    expect(TECH_TERMS.WASM.term).toBe('WASM');
    expect(TECH_TERMS.WASM.explanation).toContain('WebAssembly');
  });

  it('ATS has correct term and explanation', () => {
    expect(TECH_TERMS.ATS.term).toBe('ATS');
    expect(TECH_TERMS.ATS.explanation).toContain('Applicant Tracking System');
  });

  it('PDF has correct term and explanation', () => {
    expect(TECH_TERMS.PDF.term).toBe('PDF');
    expect(TECH_TERMS.PDF.explanation).toContain('Portable Document Format');
  });

  it('CV has correct term and explanation', () => {
    expect(TECH_TERMS.CV.term).toBe('CV');
    expect(TECH_TERMS.CV.explanation).toContain('Curriculum Vitae');
  });

  it('DPI has correct term and explanation', () => {
    expect(TECH_TERMS.DPI.term).toBe('DPI');
    expect(TECH_TERMS.DPI.explanation).toContain('Dots Per Inch');
  });

  it('MB has correct term and explanation', () => {
    expect(TECH_TERMS.MB.term).toBe('MB');
    expect(TECH_TERMS.MB.explanation).toContain('Megabyte');
  });

  it('KB has correct term and explanation', () => {
    expect(TECH_TERMS.KB.term).toBe('KB');
    expect(TECH_TERMS.KB.explanation).toContain('Kilobyte');
  });
});

describe('Pre-configured Components', () => {
  it.each([
    ['TSX', TSX, TECH_TERMS.TSX],
    ['WASM', WASM, TECH_TERMS.WASM],
    ['ATS', ATS, TECH_TERMS.ATS],
    ['PDF', PDF, TECH_TERMS.PDF],
    ['CV', CV, TECH_TERMS.CV],
    ['DPI', DPI, TECH_TERMS.DPI],
    ['MB', MB, TECH_TERMS.MB],
    ['KB', KB, TECH_TERMS.KB],
  ])('%s renders term and has correct explanation', (termText, Component, termData) => {
    const { getByText, container } = render(() => <Component />);
    expect(getByText(termText)).toBeInTheDocument();
    const abbr = container.querySelector('abbr');
    expect(abbr).toHaveAttribute('title', termData.explanation);
  });

  it('all pre-configured components render without errors', () => {
    expect(() => render(() => <TSX />)).not.toThrow();
    expect(() => render(() => <WASM />)).not.toThrow();
    expect(() => render(() => <ATS />)).not.toThrow();
    expect(() => render(() => <PDF />)).not.toThrow();
    expect(() => render(() => <CV />)).not.toThrow();
    expect(() => render(() => <DPI />)).not.toThrow();
    expect(() => render(() => <MB />)).not.toThrow();
    expect(() => render(() => <KB />)).not.toThrow();
  });

  it('all pre-configured components have underlines by default', () => {
    const components = [TSX, WASM, ATS, PDF, CV, DPI, MB, KB];
    for (const Component of components) {
      const { container } = render(() => <Component />);
      const abbr = container.querySelector('abbr');
      expect(abbr).toHaveClass('border-b', 'border-dotted');
    }
  });
});
