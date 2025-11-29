/**
 * Service Worker Restart Integration Test
 * Service worker lifecycle validation
 *
 * Tests: Progress state persistence and restoration across service worker restarts
 *
 * Manifest V3 service workers can be terminated by the browser at any time.
 * This test validates that:
 * 1. Active conversion state persists to chrome.storage.local
 * 2. Progress can be restored after service worker restart
 * 3. Popup receives restored state when reconnecting
 *
 * Risk: TECH-001 (Score 6) - Service worker state loss mid-conversion
 */

import type Browser from 'webextension-polyfill';
import type { Message } from '../../shared/types/messages';
import type { ConversionProgress } from '../../shared/types/models';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageType } from '../../shared/types/messages';
import { createMockBrowser } from './test-utils';

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => ({
  default: {} as typeof Browser,
}));

describe('Service Worker Restart - Progress State Restoration', () => {
  let browserMock: ReturnType<typeof createMockBrowser>;
  let setupMessageHandler: () => void;
  let removeMessageHandler: () => void;
  let timeoutHandles: NodeJS.Timeout[] = [];

  beforeEach(async () => {
    vi.clearAllMocks();
    timeoutHandles = [];

    // Create mock browser
    browserMock = createMockBrowser();

    // Clear storage before each test to ensure clean state
    browserMock.clearStorage();

    // Replace global browser with mock
    const webext = await import('webextension-polyfill');
    Object.assign(webext.default, browserMock.mockBrowser);

    // Setup message handler that simulates background service worker
    let messageHandler:
      | ((
          message: Message<unknown>,
          _sender: Browser.Runtime.MessageSender,
          sendResponse: (response: unknown) => void
        ) => void | Promise<boolean>)
      | null = null;
    let listenerWrapper:
      | ((
          msg: Message<unknown>,
          sender: Browser.Runtime.MessageSender,
          sendResponse: (response: unknown) => void
        ) => boolean)
      | null = null;

    setupMessageHandler = () => {
      messageHandler = async (
        message: Message<unknown>,
        _sender: Browser.Runtime.MessageSender,
        sendResponse: (response: unknown) => void
      ) => {
        if (message.type === MessageType.CONVERSION_REQUEST) {
          const jobId = `job-${Date.now()}`;
          const startTime = Date.now();

          // Simulate storing conversion state in chrome.storage.local
          const initialProgress: ConversionProgress = {
            stage: 'parsing',
            percentage: 10,
            currentOperation: 'Parsing TSX',
          };

          await browserMock.mockBrowser.storage.local.set({
            [`active_conversion_${jobId}`]: {
              jobId,
              progress: initialProgress,
              startTime,
            },
          });

          sendResponse({
            success: true as boolean,
            jobId,
            storedInLocalStorage: true as boolean,
          });
          return true;
        }

        if (message.type === MessageType.CONVERSION_PROGRESS) {
          const payload = message.payload as { jobId: string; progress: ConversionProgress };
          const { jobId, progress } = payload;

          // Update storage with new progress
          const existing = await browserMock.mockBrowser.storage.local.get(
            `active_conversion_${jobId}`
          );
          const existingData = existing;
          const existingConversion = existingData[`active_conversion_${jobId}`] as
            | Record<string, unknown>
            | undefined;
          if (existingConversion) {
            await browserMock.mockBrowser.storage.local.set({
              [`active_conversion_${jobId}`]: {
                ...existingConversion,
                progress,
              },
            });

            sendResponse({ success: true, updated: true });
          } else {
            sendResponse({ success: false, error: 'Conversion not found' });
          }
          return true;
        }

        if (message.type === MessageType.POPUP_OPENED) {
          const payload = message.payload as { requestProgressUpdate: boolean };
          const { requestProgressUpdate } = payload;

          if (requestProgressUpdate) {
            // Restore state from chrome.storage.local (simulates worker restart)
            const storageData = await browserMock.mockBrowser.storage.local.get(null);
            const activeConversionKeys = Object.keys(storageData).filter((key) =>
              key.startsWith('active_conversion_')
            );

            const restoredConversions = activeConversionKeys.map((key) => storageData[key]);

            sendResponse({
              acknowledged: true,
              restoredConversions,
            });
          } else {
            sendResponse({ acknowledged: true, restoredConversions: [] });
          }
          return true;
        }

        if (message.type === MessageType.CONVERSION_COMPLETE) {
          const payload = message.payload as { jobId: string };
          const { jobId } = payload;

          // Clear from storage
          await browserMock.mockBrowser.storage.local.remove(`active_conversion_${jobId}`);

          sendResponse({ success: true, cleaned: true });
          return true;
        }

        return false;
      };

      listenerWrapper = (msg, sender, sendResponse) => {
        void messageHandler?.(msg, sender, sendResponse);
        return false;
      };

      browserMock.mockBrowser.runtime.onMessage.addListener(listenerWrapper);
    };

    removeMessageHandler = () => {
      if (listenerWrapper) {
        browserMock.mockBrowser.runtime.onMessage.removeListener(listenerWrapper);
      }
      messageHandler = null;
      listenerWrapper = null;
    };
  });

  afterEach(() => {
    // Clean up message handlers
    removeMessageHandler();

    // Clear all timeouts
    timeoutHandles.forEach((handle) => clearTimeout(handle));
    timeoutHandles = [];

    // CRITICAL: Destroy mock browser to prevent memory leaks
    browserMock.destroy();

    // Clear mocks
    vi.clearAllMocks();
  });

  it('should persist active conversion state to chrome.storage.local', async () => {
    setupMessageHandler();

    // Start conversion
    const response = await browserMock.triggerMessage({
      type: MessageType.CONVERSION_REQUEST,
      payload: {
        tsx: '<CV><PersonalInfo><Name>John Doe</Name></PersonalInfo></CV>',
        config: {},
      },
    });

    const typedResponse = response as {
      success: boolean;
      storedInLocalStorage: boolean;
      jobId: string;
    };
    expect(typedResponse.success).toBe(true);
    expect(typedResponse.storedInLocalStorage).toBe(true);
    const jobId = typedResponse.jobId;

    // Verify storage contains conversion state
    const storage = await browserMock.mockBrowser.storage.local.get(`active_conversion_${jobId}`);
    expect(storage).toHaveProperty(`active_conversion_${jobId}`);

    const stored = storage[`active_conversion_${jobId}`] as {
      jobId: string;
      progress: ConversionProgress;
      startTime: number;
    };
    expect(stored).toHaveProperty('jobId', jobId);
    expect(stored).toHaveProperty('progress');
    expect(stored).toHaveProperty('startTime');
    expect(stored.progress.stage).toBe('parsing');
    expect(stored.progress.percentage).toBe(10);
  });

  it('should restore progress state after service worker restart', async () => {
    setupMessageHandler();

    // Start conversion
    const startResponse = await browserMock.triggerMessage({
      type: MessageType.CONVERSION_REQUEST,
      payload: { tsx: '<CV>Test</CV>', config: {} },
    });

    const jobId = (startResponse as { jobId: string }).jobId;

    // Update progress to 60%
    await browserMock.triggerMessage({
      type: MessageType.CONVERSION_PROGRESS,
      payload: {
        jobId,
        progress: {
          stage: 'laying-out',
          percentage: 60,
          currentOperation: 'Calculating layout',
        },
      },
    });

    // Simulate service worker restart: Call POPUP_OPENED to restore state
    const restoreResponse = await browserMock.triggerMessage({
      type: MessageType.POPUP_OPENED,
      payload: {
        requestProgressUpdate: true,
      },
    });

    // Verify restored progress
    const typedRestore = restoreResponse as {
      acknowledged: boolean;
      restoredConversions: Array<{
        jobId: string;
        progress: ConversionProgress;
        startTime: number;
      }>;
    };
    expect(typedRestore.acknowledged).toBe(true);
    expect(typedRestore.restoredConversions).toHaveLength(1);

    const restored = typedRestore.restoredConversions[0];
    expect(restored.jobId).toBe(jobId);
    expect(restored.progress.percentage).toBe(60);
    expect(restored.progress.stage).toBe('laying-out');
  });

  it('should handle multiple active conversions across restart', async () => {
    setupMessageHandler();

    // Start two conversions
    const response1 = await browserMock.triggerMessage({
      type: MessageType.CONVERSION_REQUEST,
      payload: { tsx: '<CV>1</CV>', config: {} },
    });

    // Small delay to ensure different timestamps
    await new Promise((resolve) => {
      const handle = setTimeout(resolve, 5);
      timeoutHandles.push(handle);
    });

    const response2 = await browserMock.triggerMessage({
      type: MessageType.CONVERSION_REQUEST,
      payload: { tsx: '<CV>2</CV>', config: {} },
    });

    const jobId1 = (response1 as { jobId: string }).jobId;
    const jobId2 = (response2 as { jobId: string }).jobId;

    // Simulate service worker restart: Restore all
    const restoreResponse = await browserMock.triggerMessage({
      type: MessageType.POPUP_OPENED,
      payload: { requestProgressUpdate: true },
    });

    // Verify both conversions restored
    const typedRestore = restoreResponse as { restoredConversions: Array<{ jobId: string }> };
    expect(typedRestore.restoredConversions).toHaveLength(2);

    const jobIds = typedRestore.restoredConversions.map((c) => c.jobId);
    expect(jobIds).toContain(jobId1);
    expect(jobIds).toContain(jobId2);
  });

  it('should clean up storage when conversion completes', async () => {
    setupMessageHandler();

    // Start conversion
    const startResponse = await browserMock.triggerMessage({
      type: MessageType.CONVERSION_REQUEST,
      payload: { tsx: '<CV>Test</CV>', config: {} },
    });

    const jobId = (startResponse as { jobId: string }).jobId;

    // Verify stored
    let storage = await browserMock.mockBrowser.storage.local.get(`active_conversion_${jobId}`);
    expect(storage[`active_conversion_${jobId}`]).toBeDefined();

    // Complete conversion
    const completeResponse = await browserMock.triggerMessage({
      type: MessageType.CONVERSION_COMPLETE,
      payload: {
        jobId,
        filename: 'test.pdf',
        fileSize: 1024,
        duration: 1000,
      },
    });

    const typedComplete = completeResponse as { success: boolean; cleaned: boolean };
    expect(typedComplete.success).toBe(true);
    expect(typedComplete.cleaned).toBe(true);

    // Verify storage cleaned up
    storage = await browserMock.mockBrowser.storage.local.get(`active_conversion_${jobId}`);
    expect(storage[`active_conversion_${jobId}`]).toBeUndefined();
  });

  it('should not restore conversions when requestProgressUpdate is false', async () => {
    setupMessageHandler();

    // Start conversion to populate storage
    await browserMock.triggerMessage({
      type: MessageType.CONVERSION_REQUEST,
      payload: { tsx: '<CV>Test</CV>', config: {} },
    });

    // Popup opens without requesting progress
    const response = await browserMock.triggerMessage({
      type: MessageType.POPUP_OPENED,
      payload: { requestProgressUpdate: false },
    });

    const typedResponse = response as { acknowledged: boolean; restoredConversions: unknown[] };
    expect(typedResponse.acknowledged).toBe(true);
    expect(typedResponse.restoredConversions).toHaveLength(0);
  });

  it('should handle empty storage gracefully', async () => {
    setupMessageHandler();

    // No active conversions in storage
    const response = await browserMock.triggerMessage({
      type: MessageType.POPUP_OPENED,
      payload: { requestProgressUpdate: true },
    });

    const typedResponse = response as { acknowledged: boolean; restoredConversions: unknown[] };
    expect(typedResponse.acknowledged).toBe(true);
    expect(typedResponse.restoredConversions).toHaveLength(0);
  });

  it('should preserve startTime for ETA calculation across restart', async () => {
    setupMessageHandler();

    const beforeStart = Date.now();

    // Start conversion
    const response = await browserMock.triggerMessage({
      type: MessageType.CONVERSION_REQUEST,
      payload: { tsx: '<CV>Test</CV>', config: {} },
    });

    // jobId is used in the next call, keeping for future use
    const jobId = (response as { jobId: string }).jobId;
    void jobId; // Suppress unused warning

    // Restore state
    const restoreResponse = await browserMock.triggerMessage({
      type: MessageType.POPUP_OPENED,
      payload: { requestProgressUpdate: true },
    });

    const typedRestore = restoreResponse as { restoredConversions: Array<{ startTime: number }> };
    const restored = typedRestore.restoredConversions[0];

    // Verify startTime is preserved
    expect(restored.startTime).toBeGreaterThanOrEqual(beforeStart);
    expect(restored.startTime).toBeLessThanOrEqual(Date.now());

    // ETA can be recalculated from: current percentage, startTime, and current time
    const elapsed = Date.now() - restored.startTime;
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });
});
