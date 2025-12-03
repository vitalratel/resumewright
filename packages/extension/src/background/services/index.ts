/**
 * Background Services
 *
 * Barrel export for background service layer.
 */

export type {
  IRetryPolicy,
  RetryCallback,
  RetryConfig,
} from '../../shared/infrastructure/retry/ExponentialBackoffRetryPolicy';
export { ExponentialBackoffRetryPolicy } from '../../shared/infrastructure/retry/ExponentialBackoffRetryPolicy';
export { BadgeManager } from './badgeManager';
export { WasmStateManager, type WasmStatus, type WasmStatusInfo } from './wasmState';
