/**
 * Shortcuts Tests
 * Tests for keyboard shortcut rendering and platform detection
 */

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPlatformShortcut, renderShortcut } from '../shortcuts';

describe('shortcuts', () => {
  describe('getPlatformShortcut', () => {
    const originalNavigator = global.navigator;

    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      // Restore original navigator
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
    });

    it('should replace Ctrl with ⌘ on Mac', () => {
      // Mock Mac userAgent
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
        writable: true,
        configurable: true,
      });

      const result = getPlatformShortcut('Ctrl+S');
      expect(result).toBe('⌘+S');
    });

    it('should keep Ctrl on Windows', () => {
      // Mock Windows userAgent
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        writable: true,
        configurable: true,
      });

      const result = getPlatformShortcut('Ctrl+S');
      expect(result).toBe('Ctrl+S');
    });

    it('should keep Ctrl on Linux', () => {
      // Mock Linux userAgent
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' },
        writable: true,
        configurable: true,
      });

      const result = getPlatformShortcut('Ctrl+S');
      expect(result).toBe('Ctrl+S');
    });

    it('should handle multiple Ctrl occurrences', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
        writable: true,
        configurable: true,
      });

      // Note: Current implementation only replaces first occurrence
      const result = getPlatformShortcut('Ctrl+Ctrl+S');
      expect(result).toBe('⌘+Ctrl+S');
    });

    it('should handle case-insensitive MAC detection', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (macintosh; Intel Mac OS X 10_15_7)' }, // lowercase mac
        writable: true,
        configurable: true,
      });

      const result = getPlatformShortcut('Ctrl+S');
      expect(result).toBe('⌘+S');
    });

    it('should not replace other text', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
        writable: true,
        configurable: true,
      });

      const result = getPlatformShortcut('Ctrl+Control');
      expect(result).toBe('⌘+Control');
    });

    it('should handle empty string', () => {
      const result = getPlatformShortcut('');
      expect(result).toBe('');
    });

    it('should handle shortcuts without Ctrl', () => {
      const result = getPlatformShortcut('Alt+S');
      expect(result).toBe('Alt+S');
    });

    it('should handle undefined navigator gracefully', () => {
      // Mock undefined navigator
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Should default to non-Mac behavior
      const result = getPlatformShortcut('Ctrl+S');
      expect(result).toBe('Ctrl+S');
    });
  });

  describe('renderShortcut', () => {
    beforeEach(() => {
      // Mock non-Mac userAgent for consistent tests
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        writable: true,
        configurable: true,
      });
    });

    it('should render shortcut in kbd element', () => {
      const { container } = render(renderShortcut('Ctrl+S'));

      const kbd = container.querySelector('kbd');
      expect(kbd).toBeInTheDocument();
      expect(kbd).toHaveTextContent('Ctrl+S');
    });

    it('should apply correct CSS classes', () => {
      const { container } = render(renderShortcut('Ctrl+S'));

      const kbd = container.querySelector('kbd');
      expect(kbd).toHaveClass('ml-2', 'text-xs', 'opacity-60', 'px-2', 'py-0.5');
      expect(kbd).toHaveClass('bg-gray-100', 'rounded', 'border', 'border-gray-300', 'font-mono');
    });

    it('should render Mac shortcut on Mac', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
        writable: true,
        configurable: true,
      });

      render(renderShortcut('Ctrl+S'));
      expect(screen.getByText('⌘+S')).toBeInTheDocument();
    });

    it('should render Windows shortcut on Windows', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        writable: true,
        configurable: true,
      });

      render(renderShortcut('Ctrl+S'));
      expect(screen.getByText('Ctrl+S')).toBeInTheDocument();
    });

    it('should render complex shortcuts', () => {
      render(renderShortcut('Ctrl+Shift+P'));
      expect(screen.getByText('Ctrl+Shift+P')).toBeInTheDocument();
    });

    it('should render shortcuts without Ctrl', () => {
      render(renderShortcut('Alt+F4'));
      expect(screen.getByText('Alt+F4')).toBeInTheDocument();
    });

    it('should handle empty shortcut', () => {
      const { container } = render(renderShortcut(''));
      const kbd = container.querySelector('kbd');
      expect(kbd).toBeInTheDocument();
      expect(kbd).toHaveTextContent('');
    });

    it('should handle special characters', () => {
      render(renderShortcut('Ctrl+<'));
      expect(screen.getByText('Ctrl+<')).toBeInTheDocument();
    });
  });
});
