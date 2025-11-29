/**
 * WASM Initialization Message Handler
 *
 * Handles WASM module lifecycle and TSX validation operations:
 * - WASM initialization status queries from popup
 * - Manual retry of failed WASM initialization
 * - TSX syntax validation before conversion
 *
 * Thread Safety: Service workers are single-threaded, but storage reads/writes
 * can race with wasmInit.ts. Handlers read from storage (non-destructive) and
 * rely on wasmInit.ts for authoritative state updates.
 *
 * @module WasmHandler
 */

import type { TsxToPdfConverter } from '../../shared/domain/pdf/types';
import type {
  GetWasmStatusMessage,
  RetryWasmInitMessage,
  ValidateTsxMessage,
  WasmStatusPayload,
} from '../../shared/types/messages';
import type { MessageHandler } from './types';
import browser from 'webextension-polyfill';
import { picklist, safeParse } from '@/shared/domain/validation/valibot';
import { validateTsxSyntax } from '../../shared/domain/pdf/validation';
import { getLogger } from '../../shared/infrastructure/logging';
import { createConverterInstance } from '../../shared/infrastructure/wasm';
import { MessageType } from '../../shared/types/messages';
import { retryWasmInit } from '../wasmInit';

/**
 * Handles WASM-related messages for module lifecycle and validation
 *
 * Responsibilities:
 * - Query WASM initialization status from chrome.storage.local
 * - Trigger manual retry of failed WASM initialization
 * - Validate TSX syntax before conversion attempts
 * - Provide user-friendly error messages for WASM failures
 *
 * Storage Schema:
 * - wasmStatus: 'initializing' | 'success' | 'failed'
 * - wasmInitTime: number (performance.now() timestamp)
 * - wasmInitError: string (error message on failure)
 *
 * @example
 * ```ts
 * const handler = new WasmHandler();
 * const status = await handler.handle(getWasmStatusMessage, sender);
 * if (status.initialized) {
 *   console.log('WASM ready for conversion');
 * }
 * ```
 */
export class WasmHandler implements MessageHandler<MessageType.GET_WASM_STATUS | MessageType.RETRY_WASM_INIT | MessageType.VALIDATE_TSX> {
  readonly type = [MessageType.GET_WASM_STATUS, MessageType.RETRY_WASM_INIT, MessageType.VALIDATE_TSX] as const;

  constructor(
    private readonly getConverterInstance: () => TsxToPdfConverter = createConverterInstance,
  ) {}

  /**
   * Routes incoming messages to appropriate handlers
   *
   * @param message - WASM status, retry, or validation message
   * @param _sender - Message sender information (unused but required by MessageHandler interface)
   * @returns Promise resolving to handler-specific response
   */
  async handle(
    message: GetWasmStatusMessage | RetryWasmInitMessage | ValidateTsxMessage,
    _sender: browser.Runtime.MessageSender
  ): Promise<unknown> {
    switch (message.type) {
      case MessageType.GET_WASM_STATUS:
        return this.handleGetWasmStatus();

      case MessageType.RETRY_WASM_INIT:
        return this.handleRetryWasmInit();

      case MessageType.VALIDATE_TSX:
        return this.handleValidateTsx(message.payload as { tsx: string });
    }
  }

  /**
   * Queries WASM initialization status from storage
   *
   * Reads authoritative state from chrome.storage.local (set by wasmInit.ts).
   * Validates status enum with Valibot to handle storage corruption.
   *
   * Return shapes:
   * - Initializing: { initialized: false } - WASM loading in progress
   * - Failed: { initialized: false, error: string } - Init failed with reason
   * - Success: { initialized: true, initTime?: number } - Ready for conversion
   *
   * Storage Consistency: This method only reads storage, never writes.
   * Race conditions with wasmInit.ts are safe (reads are idempotent).
   *
   * @returns WASM status payload with initialization state
   * @throws Never - All errors caught and returned as { initialized: false, error }
   */
  private async handleGetWasmStatus(): Promise<WasmStatusPayload> {
    try {
      // Read WASM initialization status from storage
      const result = await browser.storage.local.get(['wasmStatus', 'wasmInitTime', 'wasmInitError']);

      const status = result.wasmStatus;
      const initTime = result.wasmInitTime;
      const error = result.wasmInitError;

      // Validate status with Valibot (handles storage corruption gracefully)
      const statusResult = safeParse(
        picklist(['initializing', 'success', 'failed']),
        status,
      );

      // Map status to appropriate payload using helper methods
      if (!statusResult.success || status === 'failed') {
        return this.createFailedStatusPayload(error);
      }

      if (status === 'initializing') {
        return this.createInitializingPayload();
      }

      // Status is 'success'
      return this.createSuccessPayload(initTime);
    }
    catch (error: unknown) {
      // If we can't read storage, assume not initialized (defensive fallback)
      return this.createStorageErrorPayload(error);
    }
  }

  /**
   * Creates payload for failed WASM initialization
   *
   * @param error - Error message from storage or default message
   * @returns Payload indicating initialization failure
   */
  private createFailedStatusPayload(error: unknown): WasmStatusPayload {
    return {
      initialized: false,
      error: typeof error === 'string' ? error : 'WASM initialization failed',
    };
  }

  /**
   * Creates payload for initializing WASM state
   *
   * @returns Payload indicating initialization in progress
   */
  private createInitializingPayload(): WasmStatusPayload {
    return {
      initialized: false,
    };
  }

  /**
   * Creates payload for successful WASM initialization
   *
   * @param initTime - Timestamp from storage (may be invalid)
   * @returns Payload indicating initialization success with optional timing
   */
  private createSuccessPayload(initTime: unknown): WasmStatusPayload {
    return {
      initialized: true,
      initTime: typeof initTime === 'number' ? initTime : undefined,
    };
  }

  /**
   * Creates payload for storage read errors
   *
   * @param error - Storage read error
   * @returns Payload indicating failure to check status
   */
  private createStorageErrorPayload(error: unknown): WasmStatusPayload {
    return {
      initialized: false,
      error: error instanceof Error ? error.message : 'Failed to check WASM status',
    };
  }

  /**
   * Triggers manual retry of failed WASM initialization
   *
   * Used when popup detects WASM failure and user clicks "Retry" button.
   * Delegates to wasmInit.ts retryWasmInit() which handles retry logic.
   *
   * On success:
   * - Clears wasmInitError from storage for clean state
   * - Returns WASM_INIT_SUCCESS message type
   *
   * On failure:
   * - Preserves error in storage (set by retryWasmInit)
   * - Returns WASM_INIT_ERROR with user-friendly message
   *
   * @returns Promise resolving to success status or error message
   * @throws Never - All errors caught and returned as { success: false, error }
   */
  private async handleRetryWasmInit(): Promise<unknown> {
    try {
      await retryWasmInit();
      // Clear error from storage on success (clean slate for next potential failure)
      await browser.storage.local.remove('wasmInitError');
      return {
        type: MessageType.WASM_INIT_SUCCESS,
        success: true,
      };
    }
    catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        type: MessageType.WASM_INIT_ERROR,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Validates TSX syntax before conversion attempt
   *
   * Performs lightweight syntax checking without full compilation.
   * Used by popup to provide early feedback on invalid TSX before
   * triggering expensive PDF conversion.
   *
   * Validation checks:
   * - JSX/TSX syntax correctness (via babel parser)
   * - Basic structural requirements
   * - Does NOT validate CV-specific requirements (handled by WASM)
   *
   * @param payload - Object containing TSX source code
   * @param payload.tsx - TSX source code to validate
   * @returns Promise resolving to { valid: true/false }
   */
  private async handleValidateTsx(payload: { tsx: string }): Promise<{ valid: boolean }> {
    const isValid = await validateTsxSyntax(payload.tsx, getLogger(), this.getConverterInstance());
    return { valid: isValid };
  }
}
