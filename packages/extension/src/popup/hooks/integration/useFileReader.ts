/**
 * useFileReader Hook
 *
 * Provides file reading functionality with Promise-based API
 * Abstracts FileReader API for easier use in React components
 */

import { useCallback } from 'react';

/**
 * Hook for reading files as text or data URL
 *
 * @returns Object with file reading methods
 *
 * @example
 * const { readAsText, readAsDataURL } = useFileReader();
 *
 * const content = await readAsText(file);
 * const dataUrl = await readAsDataURL(imageFile);
 */
export function useFileReader() {
  /**
   * Read file as text
   * @param file - File to read
   * @returns Promise resolving to file content as string
   * @throws Error if reading fails
   */
  const readAsText = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          resolve(content);
        }
        else {
          reject(new Error('Failed to read file as text'));
        }
      };

      reader.onerror = () => reject(new Error('File read error'));

      reader.readAsText(file);
    });
  }, []);

  /**
   * Read file as data URL (for images, fonts, etc.)
   * @param file - File to read
   * @returns Promise resolving to data URL string
   * @throws Error if reading fails
   */
  const readAsDataURL = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          resolve(content);
        }
        else {
          reject(new Error('Failed to read file as data URL'));
        }
      };

      reader.onerror = () => reject(new Error('File read error'));

      reader.readAsDataURL(file);
    });
  }, []);

  return { readAsText, readAsDataURL };
}
