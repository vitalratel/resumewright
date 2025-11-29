/**
 * Device Profile Fixtures
 * Extracted from performance tests for reusability
 *
 * Provides standardized device simulation profiles for Playwright tests
 */

/**
 * Device profile configuration
 */
export interface DeviceProfile {
  /** Profile name for logging */
  name: string;
  
  /** CPU throttling rate (1 = no throttling, 4 = 4x slowdown) */
  cpuThrottling: number;
  
  /** Network throttling configuration (optional) */
  network?: {
    downloadThroughput: number; // bytes/sec
    uploadThroughput: number;   // bytes/sec
    latency: number;             // ms
  };
  
  /** Performance target expectations */
  targets: {
    /** Single-page conversion time (ms) */
    singlePage: number;
    
    /** Multi-page (2-3 pages) conversion time (ms) */
    multiPage: number;
    
    /** Large (6+ pages) conversion time (ms) */
    largePage: number;
  };
}

/**
 * High-end device profile
 * - Modern desktop/laptop
 * - 8GB+ RAM, modern CPU
 * - No throttling
 */
export const HIGH_END_DEVICE: DeviceProfile = {
  name: 'High-End Device',
  cpuThrottling: 1, // No throttling
  targets: {
    singlePage: 5000,   // 5s
    multiPage: 10000,   // 10s
    largePage: 15000,   // 15s
  },
};

/**
 * Low-end device profile
 * - Chromebook-level performance
 * - 4GB RAM, slow CPU
 * - 4x CPU throttling
 * - Slow 3G network
 */
export const LOW_END_DEVICE: DeviceProfile = {
  name: 'Low-End Device',
  cpuThrottling: 4, // 4x slowdown
  network: {
    // Slow 3G network throttling
    downloadThroughput: (500 * 1024) / 8, // 500kbps
    uploadThroughput: (500 * 1024) / 8,   // 500kbps
    latency: 400,                          // 400ms
  },
  targets: {
    singlePage: 8000,   // 8s
    multiPage: 15000,   // 15s
    largePage: 25000,   // 25s
  },
};

/**
 * Mid-range device profile
 * - Average consumer laptop
 * - 8GB RAM, moderate CPU
 * - 2x CPU throttling
 */
export const MID_RANGE_DEVICE: DeviceProfile = {
  name: 'Mid-Range Device',
  cpuThrottling: 2, // 2x slowdown
  targets: {
    singlePage: 6500,   // 6.5s
    multiPage: 12500,   // 12.5s
    largePage: 20000,   // 20s
  },
};

/**
 * Helper to apply device profile throttling via CDP
 * 
 * @param client - Playwright CDPSession
 * @param profile - Device profile to apply
 * 
 * @example
 * ```ts
 * const client = await context.newCDPSession(page);
 * await applyDeviceProfile(client, LOW_END_DEVICE);
 * // ... run tests ...
 * await resetDeviceProfile(client);
 * ```
 */
export async function applyDeviceProfile(
  client: any, // CDPSession from Playwright
  profile: DeviceProfile
): Promise<void> {
  // Apply CPU throttling
  await client.send('Emulation.setCPUThrottlingRate', { 
    rate: profile.cpuThrottling 
  });

  // Apply network throttling if specified
  if (profile.network) {
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: profile.network.downloadThroughput,
      uploadThroughput: profile.network.uploadThroughput,
      latency: profile.network.latency,
    });
  }
}

/**
 * Reset device profile throttling to normal
 * 
 * @param client - Playwright CDPSession
 */
export async function resetDeviceProfile(client: any): Promise<void> {
  // Reset CPU throttling
  await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });

  // Reset network throttling
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: -1,
    uploadThroughput: -1,
    latency: 0,
  });
}
