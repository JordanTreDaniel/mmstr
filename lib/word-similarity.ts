/**
 * Word similarity utilities for comparing original messages with interpretations
 * Detects when interpretations use too much of the same wording
 */

/**
 * Auto-reject threshold for word similarity
 * If more than this percentage of words are the same, auto-reject
 */
export const AUTO_REJECT_SIMILARITY_THRESHOLD = 0.7; // 70%

/**
 * Similarity check result
 */
export interface SimilarityResult {
  /** Percentage of words that match (0.0 to 1.0) */
  similarity: number;
  /** Should this interpretation be auto-rejected due to too-similar wording? */
  shouldAutoReject: boolean;
  /** Number of matching words */
  matchingWords: number;
  /** Total unique words considered */
  totalWords: number;
}

/**
 * Normalize a word for comparison
 * - Convert to lowercase
 * - Remove punctuation
 * @param word The word to normalize
 * @returns Normalized word
 */
function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^\w]/g, '');
}

/**
 * Extract and normalize words from text
 * @param text The text to extract words from
 * @returns Array of normalized words
 */
function extractWords(text: string): string[] {
  if (!text) {
    return [];
  }

  return text
    .split(/\s+/)
    .map(normalizeWord)
    .filter(word => word.length > 0);
}

/**
 * Calculate word overlap similarity between two texts
 * Returns the percentage of words that appear in both texts
 * @param originalText The original message text
 * @param interpretationText The interpretation text
 * @returns Similarity result with details
 */
export function calculateWordSimilarity(
  originalText: string,
  interpretationText: string
): SimilarityResult {
  const originalWords = extractWords(originalText);
  const interpretationWords = extractWords(interpretationText);

  if (originalWords.length === 0 || interpretationWords.length === 0) {
    return {
      similarity: 0,
      shouldAutoReject: false,
      matchingWords: 0,
      totalWords: 0,
    };
  }

  // Create sets for efficient lookup
  const originalSet = new Set(originalWords);
  const interpretationSet = new Set(interpretationWords);

  // Count how many words from interpretation appear in original
  let matchingWords = 0;
  interpretationSet.forEach(word => {
    if (originalSet.has(word)) {
      matchingWords++;
    }
  });

  // Calculate similarity as ratio of matching words to interpretation words
  const similarity = matchingWords / interpretationSet.size;

  return {
    similarity,
    shouldAutoReject: similarity > AUTO_REJECT_SIMILARITY_THRESHOLD,
    matchingWords,
    totalWords: interpretationSet.size,
  };
}

/**
 * Check if interpretation uses too much of the same wording as original
 * @param originalText The original message text
 * @param interpretationText The interpretation text
 * @returns true if wording is too similar (should be rejected)
 */
export function isTooSimilar(
  originalText: string,
  interpretationText: string
): boolean {
  const result = calculateWordSimilarity(originalText, interpretationText);
  return result.shouldAutoReject;
}

/**
 * Get a human-readable description of similarity
 * @param similarity Similarity ratio (0.0 to 1.0)
 * @returns Description string
 */
export function getSimilarityDescription(similarity: number): string {
  const percentage = Math.round(similarity * 100);
  
  if (similarity <= 0.3) {
    return `Low similarity (${percentage}% matching words)`;
  } else if (similarity <= 0.5) {
    return `Moderate similarity (${percentage}% matching words)`;
  } else if (similarity <= AUTO_REJECT_SIMILARITY_THRESHOLD) {
    return `High similarity (${percentage}% matching words)`;
  } else {
    return `Too similar (${percentage}% matching words - auto-reject)`;
  }
}

/**
 * Format similarity as percentage string
 * @param similarity Similarity ratio (0.0 to 1.0)
 * @returns Percentage string (e.g., "73%")
 */
export function formatSimilarityPercentage(similarity: number): string {
  return `${Math.round(similarity * 100)}%`;
}
