// ABOUTME: Tests for Result pattern adapter utilities.
// ABOUTME: Tests tryCatch and tryCatchAsync for wrapping throwing functions.

import { describe, expect, it, vi } from 'vitest';
import { tryCatch, tryCatchAsync } from '../adapters';

describe('tryCatch', () => {
  it('should return ok for successful sync functions', () => {
    const result = tryCatch(() => 42);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(42);
  });

  it('should return err for throwing sync functions', () => {
    const result = tryCatch(() => {
      throw new Error('sync error');
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Error);
    expect((result._unsafeUnwrapErr() as Error).message).toBe('sync error');
  });

  it('should use error mapper when provided', () => {
    const result = tryCatch(
      () => {
        throw new Error('original');
      },
      (e) => `mapped: ${(e as Error).message}`,
    );
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe('mapped: original');
  });

  it('should handle non-Error thrown values', () => {
    const result = tryCatch(() => {
      throw 'string error';
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe('string error');
  });

  it('should handle null thrown', () => {
    const result = tryCatch(() => {
      throw null;
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeNull();
  });

  it('should handle undefined thrown', () => {
    const result = tryCatch(() => {
      throw undefined;
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeUndefined();
  });

  it('should return correct type from ok result', () => {
    const result = tryCatch(() => ({ name: 'test', value: 123 }));
    expect(result.isOk()).toBe(true);
    const value = result._unsafeUnwrap();
    expect(value.name).toBe('test');
    expect(value.value).toBe(123);
  });
});

describe('tryCatchAsync', () => {
  it('should return ok for successful async functions', async () => {
    const result = await tryCatchAsync(async () => 42);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(42);
  });

  it('should return err for throwing async functions', async () => {
    const result = await tryCatchAsync(async () => {
      throw new Error('async error');
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Error);
    expect((result._unsafeUnwrapErr() as Error).message).toBe('async error');
  });

  it('should return err for rejected promises', async () => {
    const result = await tryCatchAsync(() => Promise.reject(new Error('rejected')));
    expect(result.isErr()).toBe(true);
    expect((result._unsafeUnwrapErr() as Error).message).toBe('rejected');
  });

  it('should use error mapper when provided', async () => {
    const result = await tryCatchAsync(
      async () => {
        throw new Error('original');
      },
      (e) => `mapped: ${(e as Error).message}`,
    );
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe('mapped: original');
  });

  it('should handle non-Error rejected values', async () => {
    const result = await tryCatchAsync(() => Promise.reject('string rejection'));
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe('string rejection');
  });

  it('should preserve async context', async () => {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const fn = vi.fn(async () => {
      await delay(10);
      return 'delayed';
    });

    const result = await tryCatchAsync(fn);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe('delayed');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should handle complex async chains', async () => {
    const result = await tryCatchAsync(async () => {
      const a = await Promise.resolve(1);
      const b = await Promise.resolve(2);
      return a + b;
    });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(3);
  });

  it('should catch errors in async chains', async () => {
    const result = await tryCatchAsync(async () => {
      await Promise.resolve();
      throw new Error('mid-chain error');
    });
    expect(result.isErr()).toBe(true);
    expect((result._unsafeUnwrapErr() as Error).message).toBe('mid-chain error');
  });
});

describe('Error mapping integration', () => {
  interface AppError {
    type: string;
    message: string;
  }

  const mapToAppError = (e: unknown): AppError => ({
    type: e instanceof TypeError ? 'type_error' : 'unknown',
    message: e instanceof Error ? e.message : String(e),
  });

  it('should map sync errors to custom error type', () => {
    const result = tryCatch(() => {
      throw new TypeError('invalid type');
    }, mapToAppError);

    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error.type).toBe('type_error');
    expect(error.message).toBe('invalid type');
  });

  it('should map async errors to custom error type', async () => {
    const result = await tryCatchAsync(async () => {
      throw new TypeError('invalid async type');
    }, mapToAppError);

    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error.type).toBe('type_error');
    expect(error.message).toBe('invalid async type');
  });
});
