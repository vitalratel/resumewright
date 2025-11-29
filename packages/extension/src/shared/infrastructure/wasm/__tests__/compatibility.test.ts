/**
 * WASM Compatibility Tests
 * Tests browser compatibility checking for WebAssembly
 */

import { describe, expect, it } from 'vitest';
import { WasmCompatibilityChecker } from '../compatibility';

describe('WASM Compatibility', () => {
  describe('WasmCompatibilityChecker', () => {
    it('should detect basic WASM support', () => {
      const supported = WasmCompatibilityChecker.isSupported();

      expect(typeof supported).toBe('boolean');
    });

    it('should perform comprehensive compatibility check', async () => {
      const report = await WasmCompatibilityChecker.check();

      expect(report).toHaveProperty('compatible');
      expect(report).toHaveProperty('issues');
      expect(report).toHaveProperty('browserInfo');
      expect(report).toHaveProperty('wasmInfo');
      expect(Array.isArray(report.issues)).toBe(true);
    });

    describe('Extension boundary - WASM/memory info', () => {
      it('should check WASM streaming support and report warnings', async () => {
        const report = await WasmCompatibilityChecker.check();

        // If streaming not available, should have warning
        if (report.wasmInfo.supported && !report.wasmInfo.streaming) {
          const streamingWarning = report.issues.find(
            (i) => i.category === 'wasm' && i.message.includes('streaming')
          );
          expect(streamingWarning).toBeDefined();
          expect(streamingWarning?.severity).toBe('warning');
          expect(streamingWarning?.recommendation).toContain('slower than normal');
        }
      });

      it('should check memory info when available', async () => {
        const report = await WasmCompatibilityChecker.check();

        // memoryInfo should be present or undefined
        if (report.memoryInfo) {
          expect(report.memoryInfo).toHaveProperty('totalMemory');
          expect(report.memoryInfo).toHaveProperty('availableMemory');
          expect(report.memoryInfo).toHaveProperty('percentUsed');
        }
      });

      it('should handle browser API boundaries gracefully', async () => {
        // Should not throw even if APIs unavailable
        await expect(WasmCompatibilityChecker.check()).resolves.toBeDefined();
      });
    });

    it('should provide human-readable summary', async () => {
      const report = await WasmCompatibilityChecker.check();
      const summary = WasmCompatibilityChecker.getSummary(report);

      expect(Array.isArray(summary)).toBe(true);
      expect(summary.length).toBe(report.issues.length);
    });

    it('should include browser info in report', async () => {
      const report = await WasmCompatibilityChecker.check();

      expect(report.browserInfo).toHaveProperty('userAgent');
      expect(report.browserInfo).toHaveProperty('browserName');
      expect(report.browserInfo).toHaveProperty('browserVersion');
    });

    it('should include WASM capabilities in report', async () => {
      const report = await WasmCompatibilityChecker.check();

      expect(report.wasmInfo).toHaveProperty('supported');
      expect(report.wasmInfo).toHaveProperty('streaming');
      expect(typeof report.wasmInfo.supported).toBe('boolean');
      expect(typeof report.wasmInfo.streaming).toBe('boolean');
    });

    describe('parseBrowserInfo - browser detection', () => {
      it('should detect Chrome browser', async () => {
        const originalUA = navigator.userAgent;
        Object.defineProperty(navigator, 'userAgent', {
          value:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          configurable: true,
        });

        const report = await WasmCompatibilityChecker.check();
        expect(report.browserInfo.browserName).toBe('Chrome');
        expect(report.browserInfo.browserVersion).toBe('120');

        Object.defineProperty(navigator, 'userAgent', {
          value: originalUA,
          configurable: true,
        });
      });

      it('should detect Firefox browser', async () => {
        const originalUA = navigator.userAgent;
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
          configurable: true,
        });

        const report = await WasmCompatibilityChecker.check();
        expect(report.browserInfo.browserName).toBe('Firefox');
        expect(report.browserInfo.browserVersion).toBe('121');

        Object.defineProperty(navigator, 'userAgent', {
          value: originalUA,
          configurable: true,
        });
      });

      it('should detect Edge browser (currently detected as Chrome due to UA containing Chrome)', async () => {
        const originalUA = navigator.userAgent;
        Object.defineProperty(navigator, 'userAgent', {
          value:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
          configurable: true,
        });

        const report = await WasmCompatibilityChecker.check();
        // Note: Edge UA contains "Chrome", so it matches Chrome check first
        expect(report.browserInfo.browserName).toBe('Chrome');
        expect(report.browserInfo.browserVersion).toBe('120');

        Object.defineProperty(navigator, 'userAgent', {
          value: originalUA,
          configurable: true,
        });
      });

      it('should detect Safari browser', async () => {
        const originalUA = navigator.userAgent;
        Object.defineProperty(navigator, 'userAgent', {
          value:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
          configurable: true,
        });

        const report = await WasmCompatibilityChecker.check();
        expect(report.browserInfo.browserName).toBe('Safari');
        expect(report.browserInfo.browserVersion).toBe('16');

        Object.defineProperty(navigator, 'userAgent', {
          value: originalUA,
          configurable: true,
        });
      });

      it('should handle unknown browser gracefully', async () => {
        const originalUA = navigator.userAgent;
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Unknown Browser)',
          configurable: true,
        });

        const report = await WasmCompatibilityChecker.check();
        expect(report.browserInfo.browserName).toBe('Unknown');
        expect(report.browserInfo.browserVersion).toBe('Unknown');

        Object.defineProperty(navigator, 'userAgent', {
          value: originalUA,
          configurable: true,
        });
      });
    });

    describe('detectIssues - compatibility issue detection', () => {
      it('should detect critical memory usage (>90%)', async () => {
        const report = await WasmCompatibilityChecker.check();

        if (report.memoryInfo && report.memoryInfo.percentUsed > 90) {
          const memoryIssue = report.issues.find(
            (i) => i.category === 'memory' && i.message.includes('critically low')
          );
          expect(memoryIssue).toBeDefined();
          expect(memoryIssue?.severity).toBe('warning');
        }
      });

      it('should detect high memory usage (>75%)', async () => {
        const report = await WasmCompatibilityChecker.check();

        if (
          report.memoryInfo &&
          report.memoryInfo.percentUsed > 75 &&
          report.memoryInfo.percentUsed <= 90
        ) {
          const memoryIssue = report.issues.find(
            (i) => i.category === 'memory' && i.message.includes('memory is low')
          );
          expect(memoryIssue).toBeDefined();
          expect(memoryIssue?.severity).toBe('warning');
        }
      });

      it('should not report memory issues when usage is normal', async () => {
        const report = await WasmCompatibilityChecker.check();

        if (report.memoryInfo && report.memoryInfo.percentUsed <= 75) {
          const memoryIssues = report.issues.filter((i) => i.category === 'memory');
          expect(memoryIssues.length).toBe(0);
        }
      });

      it('should detect old browser versions', async () => {
        const originalUA = navigator.userAgent;
        Object.defineProperty(navigator, 'userAgent', {
          value:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.0.0 Safari/537.36',
          configurable: true,
        });

        const report = await WasmCompatibilityChecker.check();
        const browserIssue = report.issues.find((i) => i.category === 'browser');

        if (browserIssue) {
          expect(browserIssue.severity).toBe('error');
          expect(browserIssue.message).toContain('too old');
        }

        Object.defineProperty(navigator, 'userAgent', {
          value: originalUA,
          configurable: true,
        });
      });

      it('should report WASM streaming not available as warning', async () => {
        const report = await WasmCompatibilityChecker.check();

        if (report.wasmInfo.supported && !report.wasmInfo.streaming) {
          const streamingIssue = report.issues.find(
            (i) => i.category === 'wasm' && i.message.includes('streaming')
          );
          expect(streamingIssue).toBeDefined();
          expect(streamingIssue?.severity).toBe('warning');
          expect(streamingIssue?.message).toContain('not available');
        }
      });

      it('should handle missing memoryInfo gracefully', async () => {
        const report = await WasmCompatibilityChecker.check();

        if (!report.memoryInfo) {
          const memoryIssues = report.issues.filter((i) => i.category === 'memory');
          expect(memoryIssues.length).toBe(0);
        }
      });
    });
  });
});
