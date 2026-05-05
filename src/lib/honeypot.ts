/**
 * Honeypot validation for bot detection
 * The honeypot field should remain empty for legitimate users
 */

export const HONEYPOT_FIELD_NAME = 'website_url';

/**
 * Validate honeypot field
 * Returns true if the honeypot field is filled (bot detected)
 * Returns false if the honeypot field is empty (legitimate user)
 */
export function isHoneypoFilled(honeypotValue: any): boolean {
  return honeypotValue && honeypotValue.toString().trim() !== '';
}

/**
 * Check if honeypot was triggered and return appropriate error
 */
export function validateHoneypot(honeypotValue: any): {
  isValid: boolean;
  error?: string;
} {
  if (isHoneypoFilled(honeypotValue)) {
    return {
      isValid: false,
      error: 'Suspicious activity detected',
    };
  }
  return { isValid: true };
}
