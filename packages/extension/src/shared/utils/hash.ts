/**
 * Hash Utility
 * Computes SHA-256 hashes for content deduplication
 */

/**
 * Compute SHA-256 hash of a string
 * @param content - Content to hash
 * @returns Hex-encoded hash string
 */
export async function computeSha256Hash(content: string): Promise<string> {
  // Encode string as UTF-8
  const encoder = new TextEncoder();
  const data = encoder.encode(content);

  // Compute SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}
