/**
 * External Links Configuration Tests
 *
 * Tests that external links are properly configured with valid URLs.
 */

import { describe, expect, it } from 'vitest';
import { EXTERNAL_LINKS } from '../externalLinks';

describe('EXTERNAL_LINKS', () => {
  describe('URLs', () => {
    it('should have correct HELP_URL', () => {
      expect(EXTERNAL_LINKS.HELP_URL).toBe('https://github.com/vitalratel/resumewright#readme');
    });

    it('should have correct GITHUB_REPO', () => {
      expect(EXTERNAL_LINKS.GITHUB_REPO).toBe('https://github.com/vitalratel/resumewright');
    });

    it('should have correct ISSUES_URL', () => {
      expect(EXTERNAL_LINKS.ISSUES_URL).toBe('https://github.com/vitalratel/resumewright/issues');
    });
  });

  describe('Type Safety', () => {
    it('should export as const object', () => {
      expect(typeof EXTERNAL_LINKS).toBe('object');
      expect(EXTERNAL_LINKS).not.toBeNull();
    });

    it('should have all required properties', () => {
      expect(EXTERNAL_LINKS).toHaveProperty('HELP_URL');
      expect(EXTERNAL_LINKS).toHaveProperty('GITHUB_REPO');
      expect(EXTERNAL_LINKS).toHaveProperty('ISSUES_URL');
    });

    it('should have string values for all URLs', () => {
      expect(typeof EXTERNAL_LINKS.HELP_URL).toBe('string');
      expect(typeof EXTERNAL_LINKS.GITHUB_REPO).toBe('string');
      expect(typeof EXTERNAL_LINKS.ISSUES_URL).toBe('string');
    });

    it('should not allow empty strings', () => {
      expect(EXTERNAL_LINKS.HELP_URL).not.toBe('');
      expect(EXTERNAL_LINKS.GITHUB_REPO).not.toBe('');
      expect(EXTERNAL_LINKS.ISSUES_URL).not.toBe('');
    });
  });

  describe('URL Validation', () => {
    it('should have valid URL format for HELP_URL', () => {
      expect(() => new URL(EXTERNAL_LINKS.HELP_URL)).not.toThrow();
      expect(EXTERNAL_LINKS.HELP_URL).toMatch(/^https?:\/\//);
    });

    it('should have valid URL format for GITHUB_REPO', () => {
      expect(() => new URL(EXTERNAL_LINKS.GITHUB_REPO)).not.toThrow();
      expect(EXTERNAL_LINKS.GITHUB_REPO).toMatch(/^https?:\/\//);
    });

    it('should have valid URL format for ISSUES_URL', () => {
      expect(() => new URL(EXTERNAL_LINKS.ISSUES_URL)).not.toThrow();
      expect(EXTERNAL_LINKS.ISSUES_URL).toMatch(/^https?:\/\//);
    });
  });
});
