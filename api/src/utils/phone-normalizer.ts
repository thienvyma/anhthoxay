/**
 * Phone Normalization Utility
 *
 * Normalizes Vietnamese phone numbers to a standard format (0xxxxxxxxx)
 * for accurate duplicate detection.
 *
 * **Feature: lead-duplicate-management**
 * **Requirements: 1.1, 1.2, 1.3**
 */

/**
 * Normalize phone number to standard format: 0xxxxxxxxx
 * - Remove spaces, dashes, parentheses, dots
 * - Convert +84 prefix to 0
 * - Convert 84 prefix (without plus) to 0
 *
 * @param phone - The phone number to normalize
 * @returns Normalized phone number or empty string if invalid
 *
 * @example
 * normalizePhone('+84 901 234 567') // '0901234567'
 * normalizePhone('84-901-234-567')  // '0901234567'
 * normalizePhone('0901 234 567')    // '0901234567'
 * normalizePhone('(090) 123-4567')  // '0901234567'
 */
export function normalizePhone(phone: string): string {
  // Handle empty or invalid input
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Step 1: Remove all special characters (spaces, dashes, parentheses, dots)
  let normalized = phone.replace(/[\s\-()./]/g, '');

  // Handle empty result after removing special chars
  if (!normalized) {
    return '';
  }

  // Step 2: Convert +84 prefix to 0
  if (normalized.startsWith('+84')) {
    normalized = '0' + normalized.slice(3);
  }
  // Step 3: Convert 84 prefix (without plus) to 0
  // Only if it starts with 84 and has enough digits for a Vietnamese phone number
  // Vietnamese phone numbers are typically 10 digits starting with 0
  // So 84xxxxxxxxx would be 11 digits
  else if (normalized.startsWith('84') && normalized.length >= 11) {
    normalized = '0' + normalized.slice(2);
  }

  // Step 4: Validate - should only contain digits after normalization
  if (!/^\d+$/.test(normalized)) {
    return '';
  }

  return normalized;
}

/**
 * Check if two phone numbers are equivalent after normalization
 *
 * @param phone1 - First phone number
 * @param phone2 - Second phone number
 * @returns true if both phones normalize to the same value
 *
 * @example
 * phonesMatch('+84 901 234 567', '0901234567') // true
 * phonesMatch('84-901-234-567', '0901 234 567') // true
 */
export function phonesMatch(phone1: string, phone2: string): boolean {
  const normalized1 = normalizePhone(phone1);
  const normalized2 = normalizePhone(phone2);

  // Both must be valid (non-empty) to match
  if (!normalized1 || !normalized2) {
    return false;
  }

  return normalized1 === normalized2;
}

/**
 * Validate if a phone number is a valid Vietnamese phone number
 * Vietnamese phone numbers:
 * - Start with 0 after normalization
 * - Have 10 digits total
 * - Second digit is typically 3, 5, 7, 8, or 9 for mobile
 *
 * @param phone - The phone number to validate
 * @returns true if valid Vietnamese phone number
 */
export function isValidVietnamesePhone(phone: string): boolean {
  const normalized = normalizePhone(phone);

  if (!normalized) {
    return false;
  }

  // Vietnamese phone numbers are 10 digits starting with 0
  // Mobile prefixes: 03x, 05x, 07x, 08x, 09x
  // Landline prefixes vary by region
  return /^0\d{9}$/.test(normalized);
}
