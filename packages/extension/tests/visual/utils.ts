/**
 * Visual Test Utilities
 * Helper functions for visual testing
 * 
 * Provides:
 * - Font upload helpers
 * - Storage statistics reading
 * - Wait utilities for font operations
 * - Font cleanup for test isolation
 */

import type { Page } from '@playwright/test';

/**
 * Upload a custom font through the UI
 * 
 * @param page - Playwright page object
 * @param fontPath - Absolute path to font file
 * @param metadata - Font metadata
 * @param metadata.family - Font family name
 * @param metadata.weight - Font weight (e.g., 400, 700)
 * @param metadata.style - Font style ('normal' or 'italic')
 */
export async function uploadCustomFont(
  page: Page,
  fontPath: string,
  metadata: {
    family: string;
    weight: number;
    style: 'normal' | 'italic';
  }
): Promise<void> {
  // Fill font metadata form
  await page.fill('#font-family', metadata.family);
  await page.selectOption('#font-weight', metadata.weight.toString());
  await page.selectOption('#font-style', metadata.style);
  
  // Upload font file
  const fileInput = page.locator('#font-file');
  await fileInput.setInputFiles(fontPath);
  
  // Wait for upload to complete
  await waitForFontUpload(page);
}

/**
 * Wait for font upload to complete
 * Checks for success message or error
 */
export async function waitForFontUpload(page: Page): Promise<void> {
  // Wait for either success or error message
  await page.waitForSelector('[role="status"], [role="alert"]', {
    timeout: 10000, // 10s timeout for decompression
  });
  
  // Additional wait for IndexedDB write to complete
  await page.waitForTimeout(500);
}

/**
 * Wait for custom font to be ready in IndexedDB
 * 
 * @param page - Playwright page object
 * @param fontFamily - Font family name to wait for
 */
export async function waitForFontReady(page: Page, fontFamily: string): Promise<void> {
  await page.waitForFunction(
    async (family) => {
      // Check if font exists in IndexedDB
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('resumewright-fonts', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      const transaction = db.transaction(['fonts'], 'readonly');
      const store = transaction.objectStore('fonts');
      const allFonts = await new Promise<Array<{family: string}>>((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
      });
      
      db.close();
      
      return allFonts.some((font) => font.family === family);
    },
    fontFamily,
    { timeout: 10000 }
  );
}

/**
 * Get storage statistics from the UI
 * 
 * @returns Storage stats object
 */
export async function getStorageStats(page: Page): Promise<{
  count: number;
  totalSize: number;
  maxSize: number;
  percentage: number;
}> {
  // Read from UI display
  const statsText = await page.locator('.bg-gray-50.rounded-md.text-sm').first().textContent();
  
  if (statsText === null || statsText === undefined || statsText.length === 0) {
    return { count: 0, totalSize: 0, maxSize: 20 * 1024 * 1024, percentage: 0 };
  }
  
  // Parse "X.X MB / Y MB" format
  const sizeMatch = statsText.match(/([\d.]+)\s*MB\s*\/\s*[\d.]+\s*MB/);
  const countMatch = statsText.match(/(\d+)\s*\/\s*\d+\s*fonts/);
  
  const totalSize = sizeMatch ? Number.parseFloat(sizeMatch[1]) * 1024 * 1024 : 0;
  const maxSize = 20 * 1024 * 1024;
  const count = countMatch ? Number.parseInt(countMatch[1], 10) : 0;
  const percentage = (totalSize / maxSize) * 100;
  
  return { count, totalSize, maxSize, percentage };
}

/**
 * Delete all custom fonts (cleanup for test isolation)
 */
export async function deleteAllCustomFonts(page: Page): Promise<void> {
  // Get all delete buttons
  const deleteButtons = page.locator('button:has-text("Delete")');
  const count = await deleteButtons.count();
  
  for (let i = 0; i < count; i += 1) {
    // Always click the first button (index changes as fonts are deleted)
    const button = deleteButtons.first();
    // eslint-disable-next-line no-await-in-loop
    await button.click();
    
    // Confirm deletion dialog
    page.once('dialog', async (dialog) => dialog.accept());
    
    // Wait for deletion to complete
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(500);
  }
}

/**
 * Check if a font exists in the font list
 * 
 * @param page - Playwright page object
 * @param fontFamily - Font family name to check
 * @returns true if font exists in list
 */
export async function fontExistsInList(page: Page, fontFamily: string): Promise<boolean> {
  const fontItem = page.locator(`.font-medium.text-sm:has-text("${fontFamily}")`);
  return (await fontItem.count()) > 0;
}

/**
 * Get font metadata from the list
 * 
 * @param page - Playwright page object
 * @param fontFamily - Font family name
 * @returns Font metadata or null if not found
 */
export async function getFontMetadata(
  page: Page,
  fontFamily: string
): Promise<{
  family: string;
  weight: number;
  style: string;
  format: string;
  size: string;
} | null> {
  const fontItem = page.locator(`div:has(.font-medium.text-sm:has-text("${fontFamily}"))`).first();
  
  if ((await fontItem.count()) === 0) {
    return null;
  }
  
  const familyText = await fontItem.locator('.font-medium.text-sm').textContent();
  const detailsText = await fontItem.locator('.text-xs.text-gray-600').textContent();
  const formatBadge = await fontItem.locator('span[aria-label^="Font format"]').textContent();
  
  // Parse "Weight: 400 • Style: normal • Size: 100 KB"
  const weightMatch = detailsText?.match(/Weight:\s*(\d+)/);
  const styleMatch = detailsText?.match(/Style:\s*(\w+)/);
  const sizeMatch = detailsText?.match(/Size:\s*([\d.]+\s*[A-Z]+)/);
  
  return {
    family: familyText?.trim() ?? '',
    weight: weightMatch ? Number.parseInt(weightMatch[1], 10) : 400,
    style: (styleMatch?.[1] ?? 'normal') as 'normal' | 'italic',
    format: formatBadge?.trim().toLowerCase() ?? 'ttf',
    size: sizeMatch ? sizeMatch[1] : '0 B',
  };
}

/**
 * Wait for decompression status to disappear (operation complete)
 */
export async function waitForDecompressionComplete(page: Page): Promise<void> {
  // Wait for "Decompressing font file..." to disappear
  const decompressionStatus = page.locator('text=Decompressing font file');
  
  if ((await decompressionStatus.count()) > 0) {
    await decompressionStatus.waitFor({ state: 'hidden', timeout: 10000 });
  }
}

/**
 * Create a mock font file for testing (minimal valid TTF)
 * 
 * Note: For real tests, use actual font files from tests/fixtures/fonts/
 * This is only for unit testing the upload flow.
 */
export function createMockTTFBytes(): Uint8Array {
  // Minimal TrueType header (not a valid font, just passes magic byte check)
  const header = new Uint8Array([
    0x00, 0x01, 0x00, 0x00, // TrueType magic
    0x00, 0x01, // numTables: 1
    0x00, 0x10, // searchRange
    0x00, 0x00, // entrySelector
    0x00, 0x00, // rangeShift
    // Table entry (head table)
    0x68, 0x65, 0x61, 0x64, // 'head'
    0x00, 0x00, 0x00, 0x00, // checksum
    0x00, 0x00, 0x00, 0x1C, // offset: 28
    0x00, 0x00, 0x00, 0x36, // length: 54
    // head table data (54 bytes of zeros - minimal)
    ...Array.from<number>({length: 54}).fill(0),
  ]);
  
  return header;
}

/**
 * Get progress bar color class
 */
export async function getProgressBarColor(page: Page): Promise<string> {
  const progressBar = page.locator('.h-2.rounded-full.transition-all');
  const classes = await progressBar.getAttribute('class');
  
  if (classes?.includes('bg-red-500')) return 'red';
  if (classes?.includes('bg-yellow-500')) return 'yellow';
  if (classes?.includes('bg-green-500')) return 'green';
  
  return 'unknown';
}
