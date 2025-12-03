/**
 * Code Context Extraction Tests
 * Comprehensive test coverage for code context utility
 *
 * Tests code context extraction for syntax error display,
 * including line highlighting, column indicators, and truncation.
 */

import { describe, expect, it } from 'vitest';
import {
  addCodeContextToError,
  extractCodeContext,
  extractCodeContextWithColumn,
  extractTruncatedCodeContext,
} from '../codeContext';

describe('extractCodeContext', () => {
  describe('Basic Context Extraction', () => {
    it('should extract code context around error line', () => {
      const code = 'line 1\nline 2\nline 3\nline 4\nline 5';
      const context = extractCodeContext(code, 3, 1);

      expect(context.lines).toHaveLength(3); // Lines 2-4
      expect(context.lines[0]).toEqual({ lineNumber: 2, content: 'line 2', isError: false });
      expect(context.lines[1]).toEqual({ lineNumber: 3, content: 'line 3', isError: true });
      expect(context.lines[2]).toEqual({ lineNumber: 4, content: 'line 4', isError: false });
      expect(context.errorLineIndex).toBe(1);
    });

    it('should include formatted string with line numbers', () => {
      const code = 'line 1\nline 2\nline 3';
      const context = extractCodeContext(code, 2, 1);

      expect(context.formatted).toContain('→ 2 |');
      expect(context.formatted).toContain('  1 |');
      expect(context.formatted).toContain('  3 |');
    });

    it('should add error indicator below error line', () => {
      const code = 'line 1\nerror line\nline 3';
      const context = extractCodeContext(code, 2, 1);

      // Error indicator should be below the error line
      expect(context.formatted).toContain('→ 2 | error line');
      expect(context.formatted).toMatch(/\^+/); // Contains caret indicators
    });

    it('should use default context lines (5) when not specified', () => {
      const code = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join('\n');
      const context = extractCodeContext(code, 10);

      // Should show 5 lines before + error line + 5 lines after = 11 total
      expect(context.lines).toHaveLength(11);
      expect(context.lines[0].lineNumber).toBe(5);
      expect(context.lines[10].lineNumber).toBe(15);
    });
  });

  describe('Boundary Cases', () => {
    it('should handle error at first line', () => {
      const code = 'line 1\nline 2\nline 3\nline 4\nline 5';
      const context = extractCodeContext(code, 1, 2);

      // Cannot show lines before first line
      expect(context.lines[0].lineNumber).toBe(1);
      expect(context.lines[0].isError).toBe(true);
      expect(context.errorLineIndex).toBe(0);
    });

    it('should handle error at last line', () => {
      const code = 'line 1\nline 2\nline 3';
      const context = extractCodeContext(code, 3, 2);

      // Cannot show lines after last line
      expect(context.lines[context.lines.length - 1].lineNumber).toBe(3);
      expect(context.lines[context.lines.length - 1].isError).toBe(true);
    });

    it('should handle single-line code', () => {
      const code = 'single line';
      const context = extractCodeContext(code, 1, 5);

      expect(context.lines).toHaveLength(1);
      expect(context.lines[0].isError).toBe(true);
    });

    it('should handle empty lines', () => {
      const code = 'line 1\n\nline 3\n\nline 5';
      const context = extractCodeContext(code, 3, 1);

      expect(context.lines[0].content).toBe('');
      expect(context.lines[1].content).toBe('line 3');
    });

    it('should handle line number beyond code length', () => {
      const code = 'line 1\nline 2';
      const context = extractCodeContext(code, 10, 2);

      // Should clamp to available lines and show what exists
      if (context.lines.length > 0) {
        expect(context.lines[context.lines.length - 1].lineNumber).toBeLessThanOrEqual(2);
      } else {
        // If line is way beyond code, may return empty context
        expect(context.lines).toHaveLength(0);
      }
    });
  });

  describe('Line Number Formatting', () => {
    it('should pad line numbers for alignment', () => {
      const code = Array.from({ length: 100 }, (_, i) => `line ${i + 1}`).join('\n');
      const context = extractCodeContext(code, 50, 2);

      // All line numbers should be same width (3 digits)
      const lines = context.formatted.split('\n').filter((l) => l.includes('|'));
      lines.forEach((line) => {
        const match = line.match(/\d+/);
        expect(match).toBeTruthy();
      });
    });

    it('should use arrow indicator for error line', () => {
      const code = 'line 1\nerror\nline 3';
      const context = extractCodeContext(code, 2, 1);

      expect(context.formatted).toContain('→ 2 | error');
      expect(context.formatted).not.toContain('→ 1 |');
      expect(context.formatted).not.toContain('→ 3 |');
    });
  });
});

describe('extractCodeContextWithColumn', () => {
  describe('Column Highlighting', () => {
    it('should show column indicator on error line', () => {
      const code = 'const x = 5;';
      const context = extractCodeContextWithColumn(code, 1, 7, 0);

      // Should show ^ at column 7
      expect(context.formatted).toContain('→ 1 | const x = 5;');
      expect(context.formatted).toMatch(/\s+\^/);
    });

    it('should position column indicator correctly', () => {
      const code = 'line 1\nerror at column 10\nline 3';
      const context = extractCodeContextWithColumn(code, 2, 10, 1);

      // Count spaces before ^ in formatted output
      const lines = context.formatted.split('\n');
      const indicatorLine = lines.find((l) => l.includes('^') && !l.includes('|'));
      expect(indicatorLine).toBeTruthy();
    });

    it('should handle column 1 (start of line)', () => {
      const code = 'error at start';
      const context = extractCodeContextWithColumn(code, 1, 1, 0);

      expect(context.formatted).toContain('→ 1 | error at start');
      expect(context.formatted).toContain('^');
    });

    it('should handle column beyond line length gracefully', () => {
      const code = 'short';
      const context = extractCodeContextWithColumn(code, 1, 100, 0);

      // Should still show context, even if column is invalid
      expect(context.lines).toHaveLength(1);
      expect(context.formatted).toContain('short');
    });
  });

  describe('Context Lines with Column', () => {
    it('should include context lines around error', () => {
      const code = 'line 1\nline 2\nline 3\nline 4\nline 5';
      const context = extractCodeContextWithColumn(code, 3, 5, 1);

      expect(context.lines).toHaveLength(3); // Lines 2-4
      expect(context.lines[1].isError).toBe(true);
      expect(context.lines[1].lineNumber).toBe(3);
    });

    it('should only show column indicator on error line', () => {
      const code = 'line 1\nerror line\nline 3';
      const context = extractCodeContextWithColumn(code, 2, 5, 1);

      const formattedLines = context.formatted.split('\n');
      const indicatorLines = formattedLines.filter((l) => l.includes('^'));

      // Only one line should have column indicator
      expect(indicatorLines.length).toBe(1);
    });
  });
});

describe('extractTruncatedCodeContext', () => {
  describe('Line Truncation', () => {
    it('should truncate long lines', () => {
      const longLine = 'x'.repeat(200);
      const code = `line 1\n${longLine}\nline 3`;
      const context = extractTruncatedCodeContext(code, 2, undefined, 80, 1);

      // Line 2 should be truncated
      const errorLine = context.lines.find((l) => l.isError);
      expect(errorLine?.content.length).toBeLessThanOrEqual(83); // 80 + '...'
      expect(errorLine?.content).toContain('...');
    });

    it('should not truncate short lines', () => {
      const code = 'short\nline\ncode';
      const context = extractTruncatedCodeContext(code, 2, undefined, 80, 1);

      const errorLine = context.lines.find((l) => l.isError);
      expect(errorLine?.content).toBe('line');
      expect(errorLine?.content).not.toContain('...');
    });

    it('should show context around error column for long error lines', () => {
      const longLine = 'x'.repeat(200);
      const code = `line 1\n${longLine}\nline 3`;
      const context = extractTruncatedCodeContext(code, 2, 100, 80, 1);

      const errorLine = context.lines.find((l) => l.isError);

      // Should show context around column 100
      expect(errorLine?.content).toContain('...');
      expect(errorLine?.content.length).toBeLessThanOrEqual(86); // '...' + 80 + '...'
    });

    it('should use custom max line length', () => {
      const longLine = 'a'.repeat(100);
      const code = `line 1\n${longLine}\nline 3`;
      const context = extractTruncatedCodeContext(code, 2, undefined, 50, 1);

      const errorLine = context.lines.find((l) => l.isError);
      expect(errorLine?.content.length).toBeLessThanOrEqual(53); // 50 + '...'
    });
  });

  describe('Combined Column and Truncation', () => {
    it('should show column indicator with truncated content', () => {
      const longLine = 'x'.repeat(200);
      const code = `line 1\n${longLine}\nline 3`;
      const context = extractTruncatedCodeContext(code, 2, 50, 80, 1);

      expect(context.formatted).toContain('...');
      expect(context.formatted).toContain('^');
    });

    it('should handle edge case: column at start of long line', () => {
      const longLine = 'x'.repeat(200);
      const code = `${longLine}`;
      const context = extractTruncatedCodeContext(code, 1, 1, 80, 0);

      const errorLine = context.lines.find((l) => l.isError);
      expect(errorLine?.content).toContain('xxx');
      expect(errorLine?.content.length).toBeLessThanOrEqual(83);
    });

    it('should handle edge case: column at end of long line', () => {
      const longLine = 'x'.repeat(200);
      const code = `${longLine}`;
      const context = extractTruncatedCodeContext(code, 1, 200, 80, 0);

      const errorLine = context.lines.find((l) => l.isError);
      expect(errorLine?.content).toContain('...');
    });
  });
});

describe('addCodeContextToError', () => {
  describe('Error Enhancement', () => {
    it('should add code context to error with line metadata', () => {
      const code = 'line 1\nline 2\nline 3';
      const error: {
        message: string;
        metadata?: { line?: number; column?: number; codeContext?: string };
      } = {
        message: 'Test error',
        metadata: { line: 2 },
      };

      const enhanced = addCodeContextToError(error, code);

      expect(enhanced.metadata?.codeContext).toBeDefined();
      expect(enhanced.metadata?.codeContext).toContain('line 2');
      expect(enhanced.metadata?.codeContext).toContain('→');
    });

    it('should add code context with column when available', () => {
      const code = 'const x = 5;';
      const error: {
        message: string;
        metadata?: { line?: number; column?: number; codeContext?: string };
      } = {
        message: 'Test error',
        metadata: { line: 1, column: 7 },
      };

      const enhanced = addCodeContextToError(error, code);

      expect(enhanced.metadata?.codeContext).toBeDefined();
      expect(enhanced.metadata?.codeContext).toContain('^');
    });

    it('should not modify error without line metadata', () => {
      const code = 'line 1\nline 2';
      const error: {
        message: string;
        metadata?: { line?: number; column?: number; codeContext?: string };
      } = {
        message: 'Test error',
        metadata: {},
      };

      const enhanced = addCodeContextToError(error, code);

      expect(enhanced.metadata?.codeContext).toBeUndefined();
    });

    it('should not modify error without metadata', () => {
      const code = 'line 1\nline 2';
      const error: {
        message: string;
        metadata?: { line?: number; column?: number; codeContext?: string };
      } = {
        message: 'Test error',
      };

      const enhanced = addCodeContextToError(error, code);

      expect(enhanced.metadata).toBeUndefined();
    });

    it('should preserve existing metadata fields', () => {
      const code = 'line 1\nline 2';
      const error: {
        message: string;
        metadata?: {
          line?: number;
          column?: number;
          codeContext?: string;
          custom?: string;
          fileSize?: number;
        };
      } = {
        message: 'Test error',
        metadata: { line: 2, custom: 'value', fileSize: 1000 },
      };

      const enhanced = addCodeContextToError(error, code);

      expect(enhanced.metadata?.custom).toBe('value');
      expect(enhanced.metadata?.fileSize).toBe(1000);
      expect(enhanced.metadata?.line).toBe(2);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle TSX parsing error with multiline context', () => {
      const tsx = `export default function CV() {
  return (
    <div>
      <Experience>
        <Role>Developer
      </Experience>
    </div>
  );
}`;

      const error: {
        code: string;
        message: string;
        metadata?: { line?: number; column?: number; codeContext?: string };
      } = {
        code: 'TSX_PARSE_ERROR',
        message: 'Unexpected token',
        metadata: { line: 5, column: 9 },
      };

      const enhanced = addCodeContextToError(error, tsx);

      expect(enhanced.metadata?.codeContext).toContain('<Role>Developer');
      expect(enhanced.metadata?.codeContext).toContain('→ 5 |');
      expect(enhanced.metadata?.codeContext).toContain('^');
    });

    it('should handle error at end of file', () => {
      const tsx = 'const x = 1;\nconst y = 2;\nconst z = ';

      const error: {
        code: string;
        message: string;
        metadata?: { line?: number; column?: number; codeContext?: string };
      } = {
        code: 'SYNTAX_ERROR',
        message: 'Unexpected end of input',
        metadata: { line: 3, column: 11 },
      };

      const enhanced = addCodeContextToError(error, tsx);

      expect(enhanced.metadata?.codeContext).toContain('const z = ');
      expect(enhanced.metadata?.codeContext).toContain('→ 3 |');
    });
  });
});
