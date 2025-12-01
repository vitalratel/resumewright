/**
 * WASM Compatibility Checker
 *
 * Checks browser compatibility and provides diagnostic information
 * for WASM initialization failures. Tests WebAssembly support, browser versions,
 * and memory availability.

 */

/**
 * Compatibility issue detected
 */
export interface CompatibilityIssue {
  /** Issue severity */
  severity: 'error' | 'warning';

  /** Issue category */
  category: 'wasm' | 'browser' | 'memory' | 'permissions';

  /** Human-readable issue description */
  message: string;

  /** Actionable recommendation for the user */
  recommendation: string;
}

/**
 * WASM compatibility report
 */
export interface WasmCompatibilityReport {
  /** Whether browser is compatible */
  compatible: boolean;

  /** List of detected issues */
  issues: CompatibilityIssue[];

  /** Browser information */
  browserInfo: {
    userAgent: string;
    browserName: string;
    browserVersion: string;
  };

  /** WebAssembly support details */
  wasmInfo: {
    supported: boolean;
    streaming: boolean;
    threads: boolean;
    simd: boolean;
  };

  /** Memory information (if available) */
  memoryInfo?: {
    available: boolean;
    usedMB: number;
    totalMB: number;
    percentUsed: number;
  };
}

/**
 * Parse user agent to extract browser information
 */
function parseBrowserInfo(userAgent: string): {
  browserName: string;
  browserVersion: string;
} {
  // Edge (must check before Chrome - Edge UA contains "Chrome")
  if (/Edg\/\d+/.test(userAgent)) {
    const match = userAgent.match(/Edg\/(\d+)/);
    return { browserName: 'Edge', browserVersion: match![1] };
  }

  // Chrome/Chromium
  if (/Chrome\/\d+/.test(userAgent)) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    return { browserName: 'Chrome', browserVersion: match![1] };
  }

  // Firefox
  if (/Firefox\/\d+/.test(userAgent)) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    return { browserName: 'Firefox', browserVersion: match![1] };
  }

  // Safari (must check after Chrome - Safari UA doesn't contain "Chrome")
  if (/Safari\/\d+/.test(userAgent)) {
    const match = userAgent.match(/Version\/(\d+)/);
    return { browserName: 'Safari', browserVersion: match ? match[1] : 'Unknown' };
  }

  return { browserName: 'Unknown', browserVersion: 'Unknown' };
}

/**
 * Check WebAssembly support and features
 */
function checkWasmSupport(): {
  supported: boolean;
  streaming: boolean;
  threads: boolean;
  simd: boolean;
} {
  const supported = typeof WebAssembly !== 'undefined';

  return {
    supported,
    streaming: supported && typeof WebAssembly.instantiateStreaming === 'function',
    threads: supported && typeof SharedArrayBuffer !== 'undefined',
    simd: false, // SIMD detection is complex, defaulting to false for safety
  };
}

/**
 * Get memory information (Chrome only)
 */
function getMemoryInfo(): WasmCompatibilityReport['memoryInfo'] {
  const performance = window.performance as {
    memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number; totalJSHeapSize: number };
  };

  if (!performance.memory) {
    return undefined;
  }

  const usedMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
  const totalMB = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024);
  const percentUsed = Math.round((usedMB / totalMB) * 100);

  return {
    available: true,
    usedMB,
    totalMB,
    percentUsed,
  };
}

/**
 * Detect compatibility issues
 */
function detectIssues(
  browserInfo: WasmCompatibilityReport['browserInfo'],
  wasmInfo: WasmCompatibilityReport['wasmInfo'],
  memoryInfo?: WasmCompatibilityReport['memoryInfo']
): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];

  // Check WebAssembly support
  if (!wasmInfo.supported) {
    issues.push({
      severity: 'error',
      category: 'wasm',
      message: 'WebAssembly is not supported in this browser',
      recommendation: 'Update your browser to the latest version or use Chrome/Firefox/Edge',
    });
  }

  // Check browser version
  const version = Number.parseInt(browserInfo.browserVersion, 10);
  const minVersions: Record<string, number> = {
    Chrome: 57,
    Firefox: 52,
    Edge: 79,
    Safari: 11,
  };

  if (browserInfo.browserName in minVersions) {
    const minVersion = minVersions[browserInfo.browserName];
    if (version < minVersion) {
      issues.push({
        severity: 'error',
        category: 'browser',
        message: `${browserInfo.browserName} version ${version} is too old`,
        recommendation: `Update ${browserInfo.browserName} to version ${minVersion} or later`,
      });
    }
  }

  // Check memory usage
  if (memoryInfo && memoryInfo.percentUsed > 90) {
    issues.push({
      severity: 'warning',
      category: 'memory',
      message: 'Available memory is critically low',
      recommendation: 'Close other tabs or applications to free up memory',
    });
  } else if (memoryInfo && memoryInfo.percentUsed > 75) {
    issues.push({
      severity: 'warning',
      category: 'memory',
      message: 'Available memory is low',
      recommendation: 'Consider closing some tabs to improve performance',
    });
  }

  // Check streaming support (warning only)
  if (wasmInfo.supported && !wasmInfo.streaming) {
    issues.push({
      severity: 'warning',
      category: 'wasm',
      message: 'WASM streaming compilation not available',
      recommendation: 'WASM will load slower than normal. Consider updating your browser.',
    });
  }

  return issues;
}

/**
 * Test WASM instantiation with a minimal module
 *
 * Attempts to instantiate a tiny WASM module to verify functionality.
 * Returns true if successful, false otherwise.
 */
async function testWasmInstantiation(): Promise<boolean> {
  try {
    // Minimal valid WASM module (empty module)
    const wasmBytes = new Uint8Array([
      0x00,
      0x61,
      0x73,
      0x6D, // magic number '\0asm'
      0x01,
      0x00,
      0x00,
      0x00, // version 1
    ]);

    await WebAssembly.instantiate(wasmBytes);
    return true;
  } catch {
    return false;
  }
}

/**
 * WasmCompatibilityChecker
 *
 * Checks browser compatibility for WASM and provides detailed diagnostics.
 */
export class WasmCompatibilityChecker {
  /**
   * Perform comprehensive compatibility check
   *
   * @returns Compatibility report with issues and recommendations
   */
  static async check(): Promise<WasmCompatibilityReport> {
    const userAgent = navigator.userAgent;
    const { browserName, browserVersion } = parseBrowserInfo(userAgent);

    const browserInfo = {
      userAgent,
      browserName,
      browserVersion,
    };

    const wasmInfo = checkWasmSupport();
    const memoryInfo = getMemoryInfo();

    // Detect issues
    const issues = detectIssues(browserInfo, wasmInfo, memoryInfo);

    // Test WASM instantiation if supported
    if (wasmInfo.supported) {
      const instantiationWorks = await testWasmInstantiation();
      if (!instantiationWorks) {
        issues.push({
          severity: 'error',
          category: 'wasm',
          message: 'WASM instantiation test failed',
          recommendation: 'Check browser security settings or try restarting the browser',
        });
      }
    }

    // Determine overall compatibility
    const hasErrors = issues.some((issue) => issue.severity === 'error');
    const compatible = !hasErrors;

    return {
      compatible,
      issues,
      browserInfo,
      wasmInfo,
      memoryInfo,
    };
  }

  /**
   * Quick check if WASM is supported (synchronous)
   *
   * @returns true if basic WASM support is present
   */
  static isSupported(): boolean {
    return typeof WebAssembly !== 'undefined';
  }

  /**
   * Get human-readable summary of compatibility issues
   *
   * @param report - Compatibility report
   * @returns Array of issue messages
   */
  static getSummary(report: WasmCompatibilityReport): string[] {
    return report.issues.map(
      (issue) => `[${issue.severity.toUpperCase()}] ${issue.message}: ${issue.recommendation}`
    );
  }
}
