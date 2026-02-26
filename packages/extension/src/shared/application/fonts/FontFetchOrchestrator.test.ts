// ABOUTME: Tests for font fetch orchestration logic.
// ABOUTME: Covers source filtering, graceful degradation, progress callbacks, and mixed requirements.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FontRequirement, FontStyle, FontWeight } from '../../domain/fonts/types';
import type { ILogger } from '../../infrastructure/logging/logger';
import { fetchFontsFromRequirements } from './FontFetchOrchestrator';

const mockLogger: ILogger = {
  setLevel: vi.fn(),
  getLevel: vi.fn(() => 0),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

type FontSource = {
  fetchGoogleFont: (family: string, weight: FontWeight, style: FontStyle) => Promise<Uint8Array>;
};

function makeRepository(fetchGoogleFont = vi.fn()): FontSource {
  return { fetchGoogleFont };
}

const FONT_BYTES = new Uint8Array([1, 2, 3, 4]);

describe('fetchFontsFromRequirements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array for no requirements', async () => {
    const repo = makeRepository();
    const result = await fetchFontsFromRequirements([], repo, mockLogger);
    expect(result).toEqual([]);
    expect(repo.fetchGoogleFont).not.toHaveBeenCalled();
  });

  it('should skip websafe fonts without fetching', async () => {
    const repo = makeRepository();
    const requirements: FontRequirement[] = [
      { family: 'Arial', weight: 400 as FontWeight, style: 'normal', source: 'websafe' },
      { family: 'Times New Roman', weight: 700 as FontWeight, style: 'normal', source: 'websafe' },
    ];

    const result = await fetchFontsFromRequirements(requirements, repo, mockLogger);

    expect(result).toEqual([]);
    expect(repo.fetchGoogleFont).not.toHaveBeenCalled();
  });

  it('should fetch a google font and return correct FontData', async () => {
    const repo = makeRepository(vi.fn().mockResolvedValue(FONT_BYTES));
    const requirements: FontRequirement[] = [
      { family: 'Roboto', weight: 400 as FontWeight, style: 'normal', source: 'google' },
    ];

    const result = await fetchFontsFromRequirements(requirements, repo, mockLogger);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      family: 'Roboto',
      weight: 400,
      style: 'normal',
      bytes: FONT_BYTES,
      format: 'ttf',
    });
  });

  it('should fetch multiple google fonts', async () => {
    const repo = makeRepository(vi.fn().mockResolvedValue(FONT_BYTES));
    const requirements: FontRequirement[] = [
      { family: 'Roboto', weight: 400 as FontWeight, style: 'normal', source: 'google' },
      { family: 'Open Sans', weight: 700 as FontWeight, style: 'italic', source: 'google' },
    ];

    const result = await fetchFontsFromRequirements(requirements, repo, mockLogger);

    expect(result).toHaveLength(2);
    expect(repo.fetchGoogleFont).toHaveBeenCalledTimes(2);
    expect(repo.fetchGoogleFont).toHaveBeenCalledWith('Roboto', 400, 'normal');
    expect(repo.fetchGoogleFont).toHaveBeenCalledWith('Open Sans', 700, 'italic');
  });

  it('should warn about custom fonts but not fetch them', async () => {
    const repo = makeRepository();
    const requirements: FontRequirement[] = [
      { family: 'MyFont', weight: 400 as FontWeight, style: 'normal', source: 'custom' },
    ];

    const result = await fetchFontsFromRequirements(requirements, repo, mockLogger);

    expect(result).toEqual([]);
    expect(repo.fetchGoogleFont).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'FontFetchOrchestrator',
      expect.stringContaining('custom font upload is not available'),
    );
  });

  it('should handle mixed requirements: fetch google, skip websafe, warn on custom', async () => {
    const repo = makeRepository(vi.fn().mockResolvedValue(FONT_BYTES));
    const requirements: FontRequirement[] = [
      { family: 'Arial', weight: 400 as FontWeight, style: 'normal', source: 'websafe' },
      { family: 'Roboto', weight: 400 as FontWeight, style: 'normal', source: 'google' },
      { family: 'MyFont', weight: 400 as FontWeight, style: 'normal', source: 'custom' },
    ];

    const result = await fetchFontsFromRequirements(requirements, repo, mockLogger);

    expect(result).toHaveLength(1);
    expect(result[0].family).toBe('Roboto');
    expect(repo.fetchGoogleFont).toHaveBeenCalledOnce();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'FontFetchOrchestrator',
      expect.stringContaining('custom font upload is not available'),
    );
  });

  it('should call progress callback for each google font', async () => {
    const repo = makeRepository(vi.fn().mockResolvedValue(FONT_BYTES));
    const onProgress = vi.fn();
    const requirements: FontRequirement[] = [
      { family: 'Roboto', weight: 400 as FontWeight, style: 'normal', source: 'google' },
      { family: 'Open Sans', weight: 700 as FontWeight, style: 'normal', source: 'google' },
    ];

    await fetchFontsFromRequirements(requirements, repo, mockLogger, onProgress);

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenNthCalledWith(1, 1, 2, 'Roboto');
    expect(onProgress).toHaveBeenNthCalledWith(2, 2, 2, 'Open Sans');
  });

  it('should degrade gracefully when a fetch fails, continuing with remaining fonts', async () => {
    const repo = makeRepository(
      vi.fn().mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce(FONT_BYTES),
    );
    const requirements: FontRequirement[] = [
      { family: 'FailFont', weight: 400 as FontWeight, style: 'normal', source: 'google' },
      { family: 'Roboto', weight: 400 as FontWeight, style: 'normal', source: 'google' },
    ];

    const result = await fetchFontsFromRequirements(requirements, repo, mockLogger);

    expect(result).toHaveLength(1);
    expect(result[0].family).toBe('Roboto');
    expect(mockLogger.error).toHaveBeenCalledWith(
      'FontFetchOrchestrator',
      expect.stringContaining('FailFont'),
      expect.any(String),
    );
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'FontFetchOrchestrator',
      expect.stringContaining('FailFont'),
    );
  });

  it('should return empty array when all fetches fail', async () => {
    const repo = makeRepository(vi.fn().mockRejectedValue(new Error('Network error')));
    const requirements: FontRequirement[] = [
      { family: 'Font1', weight: 400 as FontWeight, style: 'normal', source: 'google' },
      { family: 'Font2', weight: 700 as FontWeight, style: 'normal', source: 'google' },
    ];

    const result = await fetchFontsFromRequirements(requirements, repo, mockLogger);

    expect(result).toEqual([]);
    expect(mockLogger.error).toHaveBeenCalledTimes(2);
  });

  it('should not call progress callback when there are no google fonts', async () => {
    const repo = makeRepository();
    const onProgress = vi.fn();
    const requirements: FontRequirement[] = [
      { family: 'Arial', weight: 400 as FontWeight, style: 'normal', source: 'websafe' },
    ];

    await fetchFontsFromRequirements(requirements, repo, mockLogger, onProgress);

    expect(onProgress).not.toHaveBeenCalled();
  });
});
