/**
 * Background Services
 *
 * Barrel export for background service layer.
 */

// Retry functionality moved to shared/infrastructure/retry
export type { IRetryPolicy, RetryCallback, RetryConfig } from '../../shared/domain/retry/IRetryPolicy';
export { ExponentialBackoffRetryPolicy } from '../../shared/infrastructure/retry/ExponentialBackoffRetryPolicy';
export { BadgeManager } from './badgeManager';
export { WasmStateManager, type WasmStatus, type WasmStatusInfo } from './wasmState';
