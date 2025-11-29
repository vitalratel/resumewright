/**
 * Tests for localStorage utilities
 * Namespacing and key generation
 */

import { describe, expect, it } from 'vitest';
import { LocalStorageKeys, namespacedKey } from '../localStorage';

describe('localStorage', () => {
  describe('namespacedKey', () => {
    it('should add namespace prefix to key', () => {
      expect(namespacedKey('test')).toBe('resumewright-test');
    });

    it('should not double-namespace already namespaced keys', () => {
      expect(namespacedKey('resumewright-test')).toBe('resumewright-test');
    });

    it('should handle empty string', () => {
      expect(namespacedKey('')).toBe('resumewright-');
    });

    it('should handle keys with special characters', () => {
      expect(namespacedKey('test-key_123')).toBe('resumewright-test-key_123');
    });

    it('should handle keys with dots', () => {
      expect(namespacedKey('user.settings.theme')).toBe('resumewright-user.settings.theme');
    });

    it('should handle camelCase keys', () => {
      expect(namespacedKey('userPreferences')).toBe('resumewright-userPreferences');
    });

    it('should prevent double-namespacing when called multiple times', () => {
      const key = 'test';
      const namespaced1 = namespacedKey(key);
      const namespaced2 = namespacedKey(namespaced1);

      expect(namespaced1).toBe('resumewright-test');
      expect(namespaced2).toBe('resumewright-test');
    });

    it('should handle keys that partially match namespace', () => {
      // Key starts with 'resume' but not 'resumewright-'
      expect(namespacedKey('resume')).toBe('resumewright-resume');
      expect(namespacedKey('resumewright')).toBe('resumewright-resumewright');
    });

    it('should be case-sensitive', () => {
      // Namespace is lowercase, so this should get prefixed
      expect(namespacedKey('ResumeWright-test')).toBe('resumewright-ResumeWright-test');
    });
  });

  describe('LocalStorageKeys', () => {
    it('should define INFO_CARD_MINIMIZED key', () => {
      expect(LocalStorageKeys.INFO_CARD_MINIMIZED).toBe('resumewright-infoCardMinimized');
    });

    it('should define LAUNCH_COUNT key', () => {
      expect(LocalStorageKeys.LAUNCH_COUNT).toBe('resumewright-launchCount');
    });

    it('should define QUICK_SETTINGS_EXPANDED key', () => {
      expect(LocalStorageKeys.QUICK_SETTINGS_EXPANDED).toBe('resumewright-quickSettingsExpanded');
    });

    it('should have all keys properly namespaced', () => {
      const keys = Object.values(LocalStorageKeys);

      keys.forEach((key) => {
        expect(key).toMatch(/^resumewright-/);
      });
    });

    it('should have unique key values', () => {
      const values = Object.values(LocalStorageKeys);
      const uniqueValues = new Set(values);

      expect(uniqueValues.size).toBe(values.length);
    });

    it('should use namespacedKey function for consistency', () => {
      // All predefined keys should match what namespacedKey would generate
      expect(LocalStorageKeys.INFO_CARD_MINIMIZED).toBe(namespacedKey('infoCardMinimized'));
      expect(LocalStorageKeys.LAUNCH_COUNT).toBe(namespacedKey('launchCount'));
      expect(LocalStorageKeys.QUICK_SETTINGS_EXPANDED).toBe(namespacedKey('quickSettingsExpanded'));
    });
  });

  describe('Integration', () => {
    it('should prevent conflicts with raw localStorage keys', () => {
      const rawKey = 'infoCardMinimized';
      const namespacedKeyValue = LocalStorageKeys.INFO_CARD_MINIMIZED;

      expect(rawKey).not.toBe(namespacedKeyValue);
      expect(namespacedKeyValue).toBe('resumewright-infoCardMinimized');
    });

    it('should allow creating new namespaced keys on the fly', () => {
      const dynamicKey = namespacedKey('newFeature');

      expect(dynamicKey).toBe('resumewright-newFeature');
      expect(dynamicKey).toMatch(/^resumewright-/);
    });

    it('should maintain consistency between static and dynamic keys', () => {
      // If you create a key dynamically that matches a predefined one
      const dynamic = namespacedKey('launchCount');
      const predefined = LocalStorageKeys.LAUNCH_COUNT;

      expect(dynamic).toBe(predefined);
    });
  });
});
