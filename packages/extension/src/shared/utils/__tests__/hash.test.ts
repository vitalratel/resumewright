/**
 * Hash Utility Tests
 * Coverage for hash.ts
 */

import { describe, expect, it } from 'vitest';
import { computeSha256Hash } from '../hash';

describe('computeSha256Hash', () => {
  it('should compute correct SHA-256 hash for simple string', async () => {
    const result = await computeSha256Hash('hello world');

    // Expected SHA-256 hash of "hello world"
    expect(result).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  it('should compute correct SHA-256 hash for empty string', async () => {
    const result = await computeSha256Hash('');

    // Expected SHA-256 hash of empty string
    expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('should compute correct SHA-256 hash for TSX content', async () => {
    const tsx = 'export default function CV() { return <div>Resume</div>; }';
    const result = await computeSha256Hash(tsx);

    // Hash should be 64 characters (hex-encoded 256 bits)
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should produce different hashes for different content', async () => {
    const hash1 = await computeSha256Hash('content1');
    const hash2 = await computeSha256Hash('content2');

    expect(hash1).not.toBe(hash2);
  });

  it('should produce same hash for identical content', async () => {
    const content = 'test content';
    const hash1 = await computeSha256Hash(content);
    const hash2 = await computeSha256Hash(content);

    expect(hash1).toBe(hash2);
  });

  it('should handle Unicode characters', async () => {
    const unicode = '你好世界 🌍';
    const result = await computeSha256Hash(unicode);

    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should handle large content', async () => {
    const largeContent = 'x'.repeat(10000);
    const result = await computeSha256Hash(largeContent);

    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });
});
