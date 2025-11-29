/**
 * Integration Test Utilities
 *
 * Provides mocking utilities for cross-component integration tests
 * testing popup-to-background-to-content script flows.
 */

import type Browser from 'webextension-polyfill';
import type {
  ConversionRequestPayload,
  Message,
  UpdateSettingsPayload,
} from '../../shared/types/messages';
import type { UserSettings } from '../../shared/types/settings';
import { vi } from 'vitest';
import { MessageType } from '../../shared/types/messages';

/**
 * Mock browser API with message passing support
 *
 * IMPORTANT: Always call destroy() in afterEach to prevent memory leaks!
 *
 * Example:
 * ```typescript
 * let browserMock: ReturnType<typeof createMockBrowser>;
 *
 * beforeEach(() => {
 *   browserMock = createMockBrowser();
 * });
 *
 * afterEach(() => {
 *   browserMock.destroy(); // Critical for preventing memory leaks!
 * });
 * ```
 */
export function createMockBrowser() {
  // Use Set for efficient add/remove of listeners
  type MessageListener = (
    message: Message<unknown>,
    sender: Browser.Runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ) => void;
  const messageListeners = new Set<MessageListener>();

  // Track storage data - will be completely released on destroy()
  let storageData: Record<string, unknown> = {};

  // Track all mock functions for cleanup
  const mockFunctions: Array<ReturnType<typeof vi.fn>> = [];

  // Track if destroyed to prevent use-after-destroy
  let isDestroyed = false;

  const checkNotDestroyed = () => {
    if (isDestroyed) {
      throw new Error(
        'Attempted to use mock browser after destroy() was called. This indicates a test cleanup issue.'
      );
    }
  };

  const mockBrowser = {
    runtime: {
      onMessage: {
        addListener: ((listener: MessageListener) => {
          checkNotDestroyed();
          messageListeners.add(listener);
        }) as (listener: MessageListener) => void,
        removeListener: ((listener: MessageListener) => {
          checkNotDestroyed();
          messageListeners.delete(listener); // Actually remove from Set
        }) as (listener: MessageListener) => void,
      },
      sendMessage: (async (message: Message<unknown>) => {
        checkNotDestroyed();
        // Simulate message routing to all listeners

        /**
         * Recursive function to call listeners sequentially
         * Avoids await-in-loop ESLint warning
         */
        async function callListener(listeners: MessageListener[], index: number): Promise<unknown> {
          if (index >= listeners.length) {
            return undefined;
          }

          const listener = listeners[index];
          const result = await new Promise((resolve) => {
            listener(message, { tab: { id: 1 } } as Browser.Runtime.MessageSender, (resp) => {
              resolve(resp);
            });
          });

          if (result !== undefined) {
            return result;
          }

          return callListener(listeners, index + 1);
        }

        return callListener(Array.from(messageListeners), 0);
      }) as (message: Message<unknown>) => Promise<unknown>,
      lastError: null,
    },
    tabs: {
      query: vi.fn(async () =>
        Promise.resolve([{ id: 1, url: 'https://claude.ai/chat' } as Browser.Tabs.Tab])
      ),
      sendMessage: vi.fn(async () => Promise.resolve(undefined)),
      onRemoved: {
        addListener: vi.fn(() => undefined),
      },
      onUpdated: {
        addListener: vi.fn(() => undefined),
      },
    },
    action: {
      setBadgeText: vi.fn(async () => Promise.resolve(undefined)),
      setBadgeBackgroundColor: vi.fn(async () => Promise.resolve(undefined)),
    },
    storage: {
      local: {
        get: vi.fn(async (keys: string | string[] | null) => {
          checkNotDestroyed();
          if (keys === null) {
            return storageData;
          }
          if (typeof keys === 'string') {
            return { [keys]: storageData[keys] };
          }
          const result: Record<string, unknown> = {};
          for (const key of keys) {
            if (key in storageData) {
              result[key] = storageData[key];
            }
          }
          return result;
        }) as (
          keys?: string | string[] | Record<string, unknown> | null
        ) => Promise<Record<string, unknown>>,
        set: vi.fn(async (items: Record<string, unknown>) => {
          checkNotDestroyed();
          Object.assign(storageData, items);
        }) as (items: Record<string, unknown>) => Promise<void>,
        remove: vi.fn(async (keys: string | string[]) => {
          checkNotDestroyed();
          const keysArray = Array.isArray(keys) ? keys : [keys];
          for (const key of keysArray) {
            delete storageData[key];
          }
        }) as (keys: string | string[]) => Promise<void>,
      },
    },
  };

  return {
    mockBrowser,

    /**
     * Manually trigger a message to all registered listeners
     */
    triggerMessage: async (message: Message<unknown>) => {
      checkNotDestroyed();
      return mockBrowser.runtime.sendMessage(message);
    },

    /**
     * Clear all stored data (but keep object reference)
     */
    clearStorage: () => {
      checkNotDestroyed();
      Object.keys(storageData).forEach((key) => {
        delete storageData[key];
      });
    },

    /**
     * CRITICAL: Call this in afterEach to prevent memory leaks!
     *
     * This method:
     * - Clears all message listeners
     * - Releases storage data object
     * - Clears all mock function call histories
     * - Marks the mock as destroyed to catch use-after-destroy bugs
     */
    destroy: () => {
      if (isDestroyed) {
        return; // Already destroyed, idempotent
      }

      // Clear all listeners
      messageListeners.clear();

      // Release storage data object completely
      storageData = {};

      // Clear all mock function call histories and reset mocks
      for (const mock of mockFunctions) {
        mock.mockClear();
        mock.mockReset();
      }
      mockFunctions.length = 0;

      // Mark as destroyed
      isDestroyed = true;
    },
  };
}

/**
 * Mock WASM converter module
 */
export function createMockWasm() {
  return {
    convertTsxToPdfWithFonts: vi.fn().mockResolvedValue(
      new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]) // PDF header
    ),
    validateTsx: vi.fn().mockResolvedValue(true),
  };
}

/**
 * Helper to wait for a condition with proper cleanup
 *
 * Uses AbortController to ensure all pending timeouts are cleared
 * even if the function rejects due to timeout.
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 50
): Promise<void> {
  const startTime = Date.now();
  const controller = new AbortController();
  const { signal } = controller;

  /**
   * Recursive function to poll condition
   * Avoids await-in-loop ESLint warning
   */
  async function checkCondition(): Promise<void> {
    if (Date.now() - startTime >= timeout) {
      throw new Error(`Timeout waiting for condition after ${timeout}ms`);
    }

    if (signal.aborted) {
      throw new Error('Wait aborted');
    }

    if (await condition()) {
      return; // Success - cleanup in finally
    }

    // Use signal-aware timeout
    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => resolve(), interval);

      // Clean up timeout if aborted
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timeoutId);
          reject(new Error('Wait aborted'));
        },
        { once: true }
      );
    });

    return checkCondition();
  }

  try {
    await checkCondition();
  } finally {
    // Ensure any pending timeouts are cleared
    controller.abort();
  }
}

/**
 * Helper to create mock TSX content
 */
export const mockTsxContent = `
<CV>
  <PersonalInfo>
    <Name>John Doe</Name>
    <Email>john.doe@example.com</Email>
    <Phone>+1234567890</Phone>
  </PersonalInfo>
  <Experience>
    <Job>
      <Title>Senior Software Engineer</Title>
      <Company>Tech Corp</Company>
      <StartDate>2020-01</StartDate>
      <EndDate>Present</EndDate>
    </Job>
  </Experience>
  <Education>
    <Degree>
      <Title>B.S. Computer Science</Title>
      <Institution>University of Technology</Institution>
      <Year>2019</Year>
    </Degree>
  </Education>
</CV>
`.trim();

/**
 * Helper to create default conversion config
 */
export const mockConversionConfig = {
  pageSize: 'Letter' as const,
  margin: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
  fontSize: 12,
  fontFamily: 'Arial',
  compress: false,
};

/**
 * Message factory helpers
 */
export const createMessage = {
  conversionRequest: (
    tsx: string,
    config = mockConversionConfig
  ): Message<ConversionRequestPayload> => ({
    type: MessageType.CONVERSION_REQUEST,
    payload: { tsx, config },
  }),

  updateSettings: (settings: unknown): Message<UpdateSettingsPayload> => ({
    type: MessageType.UPDATE_SETTINGS,
    payload: { settings: settings as Partial<UserSettings> },
  }),
};
