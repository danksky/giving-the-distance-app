/**
 * Shortcode generation for activity URLs
 * Uses a 58-character alphabet (no confusing characters: 0, O, I, l)
 */

import { db } from '@/lib/db';

// Base58 alphabet (Bitcoin-style) - removes confusing characters
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE = ALPHABET.length; // 58

/**
 * Generate a random shortcode
 * @param length - Length of the shortcode (default 5)
 * @returns Random shortcode string
 */
export function generateShortcode(length: number = 5): string {
  let shortcode = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * BASE);
    shortcode += ALPHABET[randomIndex];
  }
  return shortcode;
}

/**
 * Generate a unique shortcode that doesn't exist in the database
 * @param length - Length of the shortcode (default 5)
 * @param maxAttempts - Maximum number of attempts before giving up (default 10)
 * @returns Unique shortcode or null if failed
 */
export async function generateUniqueShortcode(
  length: number = 5,
  maxAttempts: number = 10
): Promise<string | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const shortcode = generateShortcode(length);
    
    // Check if shortcode already exists
    const existing = await db.activity.findUnique({
      where: { shortcode },
      select: { id: true },
    });

    if (!existing) {
      return shortcode;
    }
  }

  // If we couldn't find a unique code after max attempts, return null
  console.error(`Failed to generate unique shortcode after ${maxAttempts} attempts`);
  return null;
}

/**
 * Validate a shortcode format
 * @param shortcode - The shortcode to validate
 * @returns True if valid, false otherwise
 */
export function isValidShortcode(shortcode: string): boolean {
  if (!shortcode || shortcode.length !== 5) {
    return false;
  }

  // Check if all characters are in the alphabet
  return shortcode.split('').every(char => ALPHABET.includes(char));
}

/**
 * Convert a number to a shortcode (for sequential generation if needed)
 * @param num - Number to convert
 * @param minLength - Minimum length of the shortcode
 * @returns Shortcode string
 */
export function numberToShortcode(num: number, minLength: number = 5): string {
  if (num === 0) {
    return ALPHABET[0].repeat(minLength);
  }

  let shortcode = '';
  let n = num;

  while (n > 0) {
    shortcode = ALPHABET[n % BASE] + shortcode;
    n = Math.floor(n / BASE);
  }

  // Pad with first character if needed
  while (shortcode.length < minLength) {
    shortcode = ALPHABET[0] + shortcode;
  }

  return shortcode;
}

/**
 * Convert a shortcode to a number (reverse of numberToShortcode)
 * @param shortcode - Shortcode to convert
 * @returns Number representation
 */
export function shortcodeToNumber(shortcode: string): number {
  let num = 0;
  
  for (let i = 0; i < shortcode.length; i++) {
    const char = shortcode[i];
    const value = ALPHABET.indexOf(char);
    
    if (value === -1) {
      throw new Error(`Invalid character in shortcode: ${char}`);
    }
    
    num = num * BASE + value;
  }

  return num;
}
