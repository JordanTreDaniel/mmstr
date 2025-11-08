// Mock AI Arbitration Utility
// Randomly accepts/rejects interpretations with explanations

/**
 * Simulates AI arbitration of a disputed interpretation
 * @param originalMessage The original message text
 * @param interpretation The interpretation text
 * @param rejectionNotes Author's notes explaining why they rejected
 * @param disputeReason Interpreter's explanation of why rejection is unfair
 * @returns Arbitration result with decision and explanation
 */
export async function arbitrateInterpretation(
  originalMessage: string,
  interpretation: string,
  rejectionNotes: string | null,
  disputeReason: string
): Promise<{
  result: 'accept' | 'reject';
  explanation: string;
}> {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  // Randomly decide: 60% accept, 40% reject
  const shouldAccept = Math.random() < 0.6;

  const result: 'accept' | 'reject' = shouldAccept ? 'accept' : 'reject';

  // Generate explanation based on result
  const explanation = generateExplanation(
    result,
    originalMessage,
    interpretation,
    rejectionNotes,
    disputeReason
  );

  return {
    result,
    explanation
  };
}

/**
 * Generates a plausible explanation for the arbitration decision
 */
function generateExplanation(
  result: 'accept' | 'reject',
  originalMessage: string,
  interpretation: string,
  rejectionNotes: string | null,
  disputeReason: string
): string {
  const acceptExplanations = [
    'After careful analysis, the interpretation captures the essential meaning of the original message. While the wording differs, the core points are accurately restated.',
    'The interpreter demonstrates clear understanding of the main assertions. Minor differences in phrasing do not substantially alter the meaning.',
    'The interpretation successfully conveys the key points without distortion. The author\'s concerns appear to focus on stylistic differences rather than substantive misunderstanding.',
    'The interpreter has accurately restated the message in their own words. The dispute appears to stem from expectations about specific terminology rather than actual comprehension failure.',
    'Upon review, the interpretation maintains fidelity to the original message\'s intent. The interpreter\'s understanding is evident despite different word choices.'
  ];

  const rejectExplanations = [
    'The interpretation omits or significantly alters key assertions from the original message. The author\'s concerns about accuracy are justified.',
    'Critical nuances in the original message are not captured in the interpretation. The core meaning has been substantively changed.',
    'The interpretation introduces assumptions or implications not present in the original message, indicating incomplete understanding.',
    'While some points are captured, essential elements are missing or misrepresented. The author\'s rejection is warranted.',
    'The interpretation demonstrates partial understanding but fails to accurately restate crucial aspects of the message. Additional attempts are recommended.'
  ];

  if (result === 'accept') {
    return acceptExplanations[Math.floor(Math.random() * acceptExplanations.length)];
  } else {
    return rejectExplanations[Math.floor(Math.random() * rejectExplanations.length)];
  }
}

/**
 * Simulates AI arbitration based on max attempts reached (no dispute)
 * @param originalMessage The original message text
 * @param interpretation The final interpretation text
 * @param attemptCount Number of attempts made
 * @returns Arbitration result with decision and explanation
 */
export async function arbitrateMaxAttempts(
  originalMessage: string,
  interpretation: string,
  attemptCount: number
): Promise<{
  result: 'accept' | 'reject';
  explanation: string;
}> {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  // Slightly more lenient: 70% accept after max attempts
  const shouldAccept = Math.random() < 0.7;

  const result: 'accept' | 'reject' = shouldAccept ? 'accept' : 'reject';

  let explanation: string;

  if (result === 'accept') {
    explanation = `After ${attemptCount} attempts, the interpreter has demonstrated sufficient understanding of the core message. While not perfect, the interpretation captures the essential points adequately to proceed with the conversation.`;
  } else {
    explanation = `Despite ${attemptCount} attempts, the interpretation fails to accurately capture the original message's meaning. Fundamental misunderstandings persist. Further dialogue may be needed before this participant can respond meaningfully.`;
  }

  return {
    result,
    explanation
  };
}
