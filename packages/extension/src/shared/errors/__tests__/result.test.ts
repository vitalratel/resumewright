// ABOUTME: Tests for Result pattern types and utilities.
// ABOUTME: Ensures proper re-export and type alias functionality.

import { describe, expect, it } from 'vitest';
import type {
  ConfigError,
  FontError,
  RetryExhaustedError,
  SettingsError,
  ValidationError,
  WasmError,
} from '../result';
import {
  type AsyncResult,
  err,
  errAsync,
  ok,
  okAsync,
  type Result,
  ResultAsync,
  type SyncResult,
} from '../result';

describe('Result pattern exports', () => {
  describe('ok and err', () => {
    it('should create success result with ok', () => {
      const result = ok(42);
      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
    });

    it('should create error result with err', () => {
      const result = err('error');
      expect(result.isErr()).toBe(true);
      expect(result.isOk()).toBe(false);
    });

    it('should unwrap success value', () => {
      const result = ok('success');
      expect(result._unsafeUnwrap()).toBe('success');
    });

    it('should unwrap error value', () => {
      const result = err('failure');
      expect(result._unsafeUnwrapErr()).toBe('failure');
    });
  });

  describe('okAsync and errAsync', () => {
    it('should create async success result', async () => {
      const result = okAsync(42);
      expect(result).toBeInstanceOf(ResultAsync);
      const resolved = await result;
      expect(resolved.isOk()).toBe(true);
    });

    it('should create async error result', async () => {
      const result = errAsync('error');
      expect(result).toBeInstanceOf(ResultAsync);
      const resolved = await result;
      expect(resolved.isErr()).toBe(true);
    });
  });

  describe('Result chaining', () => {
    it('should map success values', () => {
      const result = ok(5).map((x) => x * 2);
      expect(result._unsafeUnwrap()).toBe(10);
    });

    it('should not map error values', () => {
      const result = err<number, string>('error').map((x) => x * 2);
      expect(result._unsafeUnwrapErr()).toBe('error');
    });

    it('should andThen for success', () => {
      const result = ok(5).andThen((x) => ok(x * 2));
      expect(result._unsafeUnwrap()).toBe(10);
    });

    it('should short-circuit andThen for error', () => {
      const result = err<number, string>('error').andThen((x) => ok(x * 2));
      expect(result._unsafeUnwrapErr()).toBe('error');
    });
  });

  describe('Result.match', () => {
    it('should call ok handler for success', () => {
      const result = ok(42).match(
        (val) => `success: ${val}`,
        (err) => `error: ${err}`,
      );
      expect(result).toBe('success: 42');
    });

    it('should call err handler for failure', () => {
      const result = err('oops').match(
        (val) => `success: ${val}`,
        (err) => `error: ${err}`,
      );
      expect(result).toBe('error: oops');
    });
  });

  describe('Type aliases', () => {
    it('should SyncResult be compatible with Result', () => {
      const syncResult: SyncResult<number> = ok(42);
      expect(syncResult.isOk()).toBe(true);
    });

    it('should AsyncResult be compatible with ResultAsync', async () => {
      const asyncResult: AsyncResult<number> = okAsync(42);
      const resolved = await asyncResult;
      expect(resolved.isOk()).toBe(true);
    });
  });
});

describe('Result type narrowing', () => {
  it('should narrow type after isOk check', () => {
    const result: Result<number, string> = ok(42);
    if (result.isOk()) {
      // TypeScript should know this is safe
      const value: number = result.value;
      expect(value).toBe(42);
    }
  });

  it('should narrow type after isErr check', () => {
    const result: Result<number, string> = err('error');
    if (result.isErr()) {
      // TypeScript should know this is safe
      const error: string = result.error;
      expect(error).toBe('error');
    }
  });
});

describe('Domain error types', () => {
  describe('FontError', () => {
    it('should have required fields', () => {
      const fontError: FontError = {
        type: 'network_timeout',
        fontFamily: 'Roboto',
        message: 'Request timed out',
      };
      expect(fontError.type).toBe('network_timeout');
      expect(fontError.fontFamily).toBe('Roboto');
      expect(fontError.message).toBe('Request timed out');
    });

    it('should support all error types', () => {
      const types: FontError['type'][] = [
        'network_timeout',
        'network_error',
        'parse_error',
        'not_found',
      ];
      types.forEach((type) => {
        const error: FontError = { type, fontFamily: 'Test', message: 'test' };
        expect(error.type).toBe(type);
      });
    });
  });

  describe('WasmError', () => {
    it('should have required fields', () => {
      const wasmError: WasmError = {
        type: 'init_failed',
        message: 'WASM module failed to load',
      };
      expect(wasmError.type).toBe('init_failed');
      expect(wasmError.message).toBe('WASM module failed to load');
    });
  });

  describe('ValidationError', () => {
    it('should have required fields', () => {
      const validationError: ValidationError = {
        type: 'invalid_input',
        message: 'Input is required',
      };
      expect(validationError.type).toBe('invalid_input');
    });

    it('should support optional field', () => {
      const validationError: ValidationError = {
        type: 'schema_mismatch',
        field: 'margin.top',
        message: 'Must be a number',
      };
      expect(validationError.field).toBe('margin.top');
    });
  });

  describe('SettingsError', () => {
    it('should have required fields', () => {
      const settingsError: SettingsError = {
        type: 'validation_failed',
        message: 'Invalid settings format',
      };
      expect(settingsError.type).toBe('validation_failed');
    });
  });

  describe('ConfigError', () => {
    it('should have required fields', () => {
      const configError: ConfigError = {
        type: 'invalid_config',
        message: 'Config validation failed',
      };
      expect(configError.type).toBe('invalid_config');
    });

    it('should support optional field', () => {
      const configError: ConfigError = {
        type: 'invalid_config',
        field: 'pageSize',
        message: 'Invalid page size',
      };
      expect(configError.field).toBe('pageSize');
    });
  });

  describe('RetryExhaustedError', () => {
    it('should have required fields', () => {
      const retryError: RetryExhaustedError = {
        type: 'retry_exhausted',
        attempts: 3,
        lastError: new Error('Connection refused'),
        message: 'Max retries exceeded',
      };
      expect(retryError.type).toBe('retry_exhausted');
      expect(retryError.attempts).toBe(3);
      expect(retryError.lastError).toBeInstanceOf(Error);
    });
  });
});
