// Mock AI Similarity Utility
// Calculates word overlap and returns similarity score

/**
 * Calculates word overlap between two texts and returns a similarity score
 * @param originalText The original message text
 * @param interpretationText The interpretation text
 * @returns Similarity score (0-100) and word overlap percentage
 */
export async function calculateSimilarity(
  originalText: string,
  interpretationText: string
): Promise<{
  similarityScore: number;
  wordOverlap: number;
  autoAcceptSuggested: boolean;
}> {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  // Calculate word overlap
  const originalWords = normalizeText(originalText);
  const interpretationWords = normalizeText(interpretationText);

  const originalWordSet = new Set(originalWords);
  const interpretationWordSet = new Set(interpretationWords);

  // Count overlapping words
  let overlapCount = 0;
  interpretationWordSet.forEach(word => {
    if (originalWordSet.has(word)) {
      overlapCount++;
    }
  });

  // Calculate overlap percentage
  const wordOverlap = interpretationWordSet.size > 0
    ? Math.round((overlapCount / interpretationWordSet.size) * 100)
    : 0;

  // Generate random similarity score between 70-95%
  // Adjust based on word overlap - penalize high overlap
  let similarityScore: number;
  
  if (wordOverlap > 70) {
    // High word overlap - likely copied, lower similarity score
    similarityScore = 70 + Math.random() * 10; // 70-80%
  } else if (wordOverlap > 50) {
    // Moderate overlap - decent score
    similarityScore = 75 + Math.random() * 15; // 75-90%
  } else {
    // Low overlap - good paraphrasing, higher score
    similarityScore = 80 + Math.random() * 15; // 80-95%
  }

  // Round to 1 decimal place
  similarityScore = Math.round(similarityScore * 10) / 10;

  // Auto-accept suggested if score >= 90%
  const autoAcceptSuggested = similarityScore >= 90;

  return {
    similarityScore,
    wordOverlap,
    autoAcceptSuggested
  };
}

/**
 * Normalizes text for comparison by:
 * - Converting to lowercase
 * - Removing punctuation
 * - Splitting into words
 * - Filtering out common stop words
 */
function normalizeText(text: string): string[] {
  // Convert to lowercase and remove punctuation
  const cleaned = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // Split into words
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  
  // Common stop words to exclude from comparison
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'this', 'but', 'they', 'have', 'had',
    'what', 'when', 'where', 'who', 'which', 'why', 'how'
  ]);
  
  // Filter out stop words
  return words.filter(word => !stopWords.has(word) && word.length > 2);
}
