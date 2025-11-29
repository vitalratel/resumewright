/**
 * Custom Font Storage Service
 * IndexedDB storage for custom fonts
 *
 * Provides CRUD operations for custom fonts with storage limits.
 */

import type { CustomFont } from '@/shared/domain/fonts/models/Font';
import { CUSTOM_FONT_LIMITS, CustomFontError, CustomFontErrorType } from '@/shared/domain/fonts/models/Font';
import { getLogger } from '@/shared/infrastructure/logging';

const DB_NAME = 'resumewright-fonts';
const DB_VERSION = 1;
const STORE_NAME = 'custom-fonts';

/**
 * Opens IndexedDB connection
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new CustomFontError(
        CustomFontErrorType.STORAGE_ERROR,
        `Failed to open IndexedDB: ${request.error?.message}`,
      ));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

        // Create indexes for querying
        store.createIndex('family', 'family', { unique: false });
        store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
      }
    };
  });
}

/**
 * Retrieves all custom fonts from IndexedDB
 */
export async function getAllCustomFonts(): Promise<CustomFont[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const fonts = request.result as CustomFont[];

      // Convert stored ArrayBuffers back to Uint8Array
      const fontsWithBytes = fonts.map(font => ({
        ...font,
        bytes: new Uint8Array(font.bytes as unknown as ArrayBuffer),
      }));

      resolve(fontsWithBytes);
    };

    request.onerror = () => {
      reject(new CustomFontError(
        CustomFontErrorType.STORAGE_ERROR,
        `Failed to retrieve fonts: ${request.error?.message}`,
      ));
    };
  });
}

/**
 * Retrieves a custom font by ID
 */
export async function getCustomFontById(id: string): Promise<CustomFont | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const font = request.result as CustomFont | undefined;

      if (font) {
        // Convert stored ArrayBuffer back to Uint8Array
        resolve({
          ...font,
          bytes: new Uint8Array(font.bytes as unknown as ArrayBuffer),
        });
      }
      else {
        resolve(null);
      }
    };

    request.onerror = () => {
      reject(new CustomFontError(
        CustomFontErrorType.STORAGE_ERROR,
        `Failed to retrieve font: ${request.error?.message}`,
      ));
    };
  });
}

/**
 * Saves a custom font to IndexedDB
 *
 * @throws {CustomFontError} If storage limits exceeded or storage fails
 */
export async function saveCustomFont(font: CustomFont): Promise<void> {
  // Check font count limit
  const existingFonts = await getAllCustomFonts();

  if (existingFonts.length >= CUSTOM_FONT_LIMITS.MAX_FONT_COUNT) {
    throw new CustomFontError(
      CustomFontErrorType.TOO_MANY_FONTS,
      `Maximum ${CUSTOM_FONT_LIMITS.MAX_FONT_COUNT} custom fonts allowed`,
    );
  }

  // Check total storage limit
  const totalSize = existingFonts.reduce((sum, f) => sum + f.fileSize, 0) + font.fileSize;

  if (totalSize > CUSTOM_FONT_LIMITS.MAX_TOTAL_SIZE) {
    const totalMB = (totalSize / (1024 * 1024)).toFixed(1);
    const limitMB = (CUSTOM_FONT_LIMITS.MAX_TOTAL_SIZE / (1024 * 1024)).toFixed(0);

    throw new CustomFontError(
      CustomFontErrorType.STORAGE_QUOTA_EXCEEDED,
      `Total storage would exceed ${limitMB}MB (current: ${totalMB}MB)`,
    );
  }

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // IndexedDB stores Uint8Array as ArrayBuffer, so no conversion needed
    const request = store.put(font);

    request.onsuccess = () => {
      getLogger().debug('CustomFontStore', `Saved font: ${font.family} (${font.id})`);
      resolve();
    };

    request.onerror = () => {
      // Check for quota exceeded error
      if (request.error?.name === 'QuotaExceededError') {
        reject(new CustomFontError(
          CustomFontErrorType.STORAGE_QUOTA_EXCEEDED,
          'Browser storage quota exceeded',
        ));
      }
      else {
        reject(new CustomFontError(
          CustomFontErrorType.STORAGE_ERROR,
          `Failed to save font: ${request.error?.message}`,
        ));
      }
    };
  });
}

/**
 * Deletes a custom font from IndexedDB
 */
export async function deleteCustomFont(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      getLogger().debug('CustomFontStore', `Deleted font: ${id}`);
      resolve();
    };

    request.onerror = () => {
      reject(new CustomFontError(
        CustomFontErrorType.STORAGE_ERROR,
        `Failed to delete font: ${request.error?.message}`,
      ));
    };
  });
}

/**
 * Deletes all custom fonts from IndexedDB
 */
export async function deleteAllCustomFonts(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      getLogger().debug('CustomFontStore', 'Cleared all custom fonts');
      resolve();
    };

    request.onerror = () => {
      reject(new CustomFontError(
        CustomFontErrorType.STORAGE_ERROR,
        `Failed to clear fonts: ${request.error?.message}`,
      ));
    };
  });
}

/**
 * Gets storage statistics
 */
export async function getStorageStats(): Promise<{
  count: number;
  totalSize: number;
  fonts: Array<{ id: string; family: string; size: number }>;
}> {
  const fonts = await getAllCustomFonts();

  return {
    count: fonts.length,
    totalSize: fonts.reduce((sum, f) => sum + f.fileSize, 0),
    fonts: fonts.map(f => ({
      id: f.id,
      family: f.family,
      size: f.fileSize,
    })),
  };
}
