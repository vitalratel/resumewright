/**
 * Tests for TSX parsing utilities
 * CV preview information extraction
 */

import { describe, expect, it } from 'vitest';
import { extractCVPreviewInfo } from '../tsxParsing';

describe('tsxParsing', () => {
  describe('extractCVPreviewInfo', () => {
    it('should extract complete CV information', () => {
      const content = `
        <h1>John Doe</h1>
        <h2>Software Engineer</h2>
        <section>Experience</section>
        <section>Education</section>
        <section>Skills</section>
      `;

      const result = extractCVPreviewInfo(content);

      expect(result).toEqual({
        name: 'John Doe',
        title: 'Software Engineer',
        sections: 3,
      });
    });

    it('should handle missing name', () => {
      const content = `
        <h2>Software Engineer</h2>
        <section>Experience</section>
      `;

      const result = extractCVPreviewInfo(content);

      expect(result).toEqual({
        name: undefined,
        title: 'Software Engineer',
        sections: 1,
      });
    });

    it('should handle missing title', () => {
      const content = `
        <h1>John Doe</h1>
        <section>Experience</section>
      `;

      const result = extractCVPreviewInfo(content);

      expect(result).toEqual({
        name: 'John Doe',
        title: undefined,
        sections: 1,
      });
    });

    it('should handle missing sections', () => {
      const content = `
        <h1>John Doe</h1>
        <h2>Software Engineer</h2>
      `;

      const result = extractCVPreviewInfo(content);

      expect(result).toEqual({
        name: 'John Doe',
        title: 'Software Engineer',
        sections: 0,
      });
    });

    it('should handle empty content', () => {
      const result = extractCVPreviewInfo('');

      expect(result).toEqual({
        name: undefined,
        title: undefined,
        sections: 0,
      });
    });

    it('should extract first h1 only', () => {
      const content = `
        <h1>John Doe</h1>
        <h1>Another Name</h1>
        <h2>Software Engineer</h2>
      `;

      const result = extractCVPreviewInfo(content);

      expect(result.name).toBe('John Doe');
    });

    it('should extract first h2 only', () => {
      const content = `
        <h1>John Doe</h1>
        <h2>Software Engineer</h2>
        <h2>Another Title</h2>
      `;

      const result = extractCVPreviewInfo(content);

      expect(result.title).toBe('Software Engineer');
    });

    it('should count all sections', () => {
      const content = `
        <section>One</section>
        <section>Two</section>
        <section>Three</section>
        <section>Four</section>
        <section>Five</section>
      `;

      const result = extractCVPreviewInfo(content);

      expect(result.sections).toBe(5);
    });

    it('should handle h1/h2 with attributes', () => {
      const content = `
        <h1 class="name" id="header">Jane Smith</h1>
        <h2 style="color: blue;">Product Manager</h2>
        <section>Experience</section>
      `;

      const result = extractCVPreviewInfo(content);

      expect(result).toEqual({
        name: 'Jane Smith',
        title: 'Product Manager',
        sections: 1,
      });
    });

    it('should handle self-closing section tags', () => {
      const content = `
        <h1>John Doe</h1>
        <h2>Engineer</h2>
        <section/>
        <section />
        <section></section>
      `;

      const result = extractCVPreviewInfo(content);

      // Regex should match all three section tags
      expect(result.sections).toBe(3);
    });

    it('should handle nested content in headings', () => {
      const content = `
        <h1><span>John</span> Doe</h1>
        <h2>Software Engineer</h2>
      `;

      const result = extractCVPreviewInfo(content);

      // Regex [^<]+ doesn't match nested tags, so returns undefined
      // This is expected behavior - the parser is for simple CVs
      expect(result.name).toBeUndefined();
    });

    it('should handle case-insensitive tags', () => {
      const content = `
        <H1>John Doe</H1>
        <H2>Software Engineer</H2>
        <SECTION>Experience</SECTION>
      `;

      const result = extractCVPreviewInfo(content);

      expect(result).toEqual({
        name: 'John Doe',
        title: 'Software Engineer',
        sections: 1,
      });
    });

    it('should handle multiline headings', () => {
      const content = `
        <h1>
          John Doe
        </h1>
        <h2>
          Software Engineer
        </h2>
      `;

      const result = extractCVPreviewInfo(content);

      expect(result.name?.trim()).toBe('John Doe');
      expect(result.title?.trim()).toBe('Software Engineer');
    });

    it('should handle special characters in text', () => {
      const content = `
        <h1>John O'Doe-Smith</h1>
        <h2>Software Engineer & Architect</h2>
        <section>Experience</section>
      `;

      const result = extractCVPreviewInfo(content);

      expect(result).toEqual({
        name: "John O'Doe-Smith",
        title: 'Software Engineer & Architect',
        sections: 1,
      });
    });

    it('should handle typical CV structure', () => {
      const content = `
        <div class="cv">
          <h1>Alice Johnson</h1>
          <h2>Senior Data Scientist</h2>
          <section id="summary">Summary</section>
          <section id="experience">Experience</section>
          <section id="education">Education</section>
          <section id="skills">Skills</section>
          <section id="projects">Projects</section>
        </div>
      `;

      const result = extractCVPreviewInfo(content);

      expect(result).toEqual({
        name: 'Alice Johnson',
        title: 'Senior Data Scientist',
        sections: 5,
      });
    });

    it('should handle whitespace variations', () => {
      const content = `<h1>John Doe</h1><h2>Engineer</h2><section></section><section></section>`;

      const result = extractCVPreviewInfo(content);

      expect(result).toEqual({
        name: 'John Doe',
        title: 'Engineer',
        sections: 2,
      });
    });

    it('should handle unicode characters', () => {
      const content = `
        <h1>João Silva</h1>
        <h2>Développeur Logiciel</h2>
        <section>経験</section>
      `;

      const result = extractCVPreviewInfo(content);

      expect(result).toEqual({
        name: 'João Silva',
        title: 'Développeur Logiciel',
        sections: 1,
      });
    });
  });
});
