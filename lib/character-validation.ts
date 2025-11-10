/**
 * Character and word validation utilities for messages and interpretations
 * Enforces min/max character limits and word count requirements
 */

/**
 * Message character limits based on spec
 */
export const MESSAGE_MIN_CHARS = 10;
export const MESSAGE_MAX_CHARS = 280;
export const MESSAGE_MIN_WORDS = 3;

/**
 * Validation result with detailed information
 */
export interface ValidationResult {
  /** Is the text valid? */
  isValid: boolean;
  /** Character count */
  charCount: number;
  /** Word count */
  wordCount: number;
  /** Error message if invalid */
  errorMessage?: string;
}

/**
 * Count words in a text string
 * Words are separated by whitespace
 * @param text The text to count words in
 * @returns The number of words
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }
  
  // Split by whitespace and filter out empty strings
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Check if text meets minimum requirements
 * @param text The text to validate
 * @returns true if text meets minimum character and word count
 */
export function meetsMinimum(text: string): boolean {
  if (!text) {
    return false;
  }
  
  const charCount = text.length;
  const wordCount = countWords(text);
  
  return charCount >= MESSAGE_MIN_CHARS && wordCount >= MESSAGE_MIN_WORDS;
}

/**
 * Check if text exceeds maximum character limit
 * @param text The text to check
 * @returns true if text is within max character limit
 */
export function withinMaximum(text: string): boolean {
  return text.length <= MESSAGE_MAX_CHARS;
}

/**
 * Validate message text for all requirements
 * @param text The message text to validate
 * @returns Validation result with details
 */
export function validateMessage(text: string): ValidationResult {
  const charCount = text.length;
  const wordCount = countWords(text);

  // Check if empty
  if (charCount === 0) {
    return {
      isValid: false,
      charCount,
      wordCount,
      errorMessage: 'Message cannot be empty',
    };
  }

  // Check minimum character count
  if (charCount < MESSAGE_MIN_CHARS) {
    return {
      isValid: false,
      charCount,
      wordCount,
      errorMessage: `Message must be at least ${MESSAGE_MIN_CHARS} characters (currently ${charCount})`,
    };
  }

  // Check minimum word count
  if (wordCount < MESSAGE_MIN_WORDS) {
    return {
      isValid: false,
      charCount,
      wordCount,
      errorMessage: `Message must have at least ${MESSAGE_MIN_WORDS} words (currently ${wordCount})`,
    };
  }

  // Check maximum character count
  if (charCount > MESSAGE_MAX_CHARS) {
    return {
      isValid: false,
      charCount,
      wordCount,
      errorMessage: `Message must not exceed ${MESSAGE_MAX_CHARS} characters (currently ${charCount})`,
    };
  }

  // All checks passed
  return {
    isValid: true,
    charCount,
    wordCount,
  };
}

/**
 * Check if a message requires interpretation before response
 * All messages require interpretation regardless of length
 * @param text The message text
 * @returns true if interpretation is required (always true)
 */
export function requiresInterpretation(text: string): boolean {
  return true;
}

/**
 * Get remaining characters before hitting the maximum
 * @param text The current text
 * @returns Number of characters remaining (negative if over limit)
 */
export function getRemainingChars(text: string): number {
  return MESSAGE_MAX_CHARS - text.length;
}

/**
 * Get a character count display string (e.g., "45/280")
 * @param text The current text
 * @returns Display string showing current count and max
 */
export function getCharCountDisplay(text: string): string {
  return `${text.length}/${MESSAGE_MAX_CHARS}`;
}

/**
 * Truncate text to maximum character limit
 * @param text The text to truncate
 * @returns Truncated text within character limit
 */
export function truncateToMax(text: string): string {
  if (text.length <= MESSAGE_MAX_CHARS) {
    return text;
  }
  return text.substring(0, MESSAGE_MAX_CHARS);
}
