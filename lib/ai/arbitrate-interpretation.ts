/**
 * AI-Powered Arbitration
 * Resolves disputes about interpretation accuracy using dual breakdowns (original + interpretation)
 */

import { getAIClient } from './client';
import { getArbitrationSystemPrompt, xmlTag } from './prompts';
import { executeWithTimeoutAndRetry } from './utils';
import { generateBreakdown as generateBreakdownAI } from './generate-breakdown';
import type { Message } from '@/types/entities';
import type { BreakdownPoint } from './generate-breakdown';

export interface ArbitrationResult {
  result: 'accept' | 'reject';
  explanation: string;
}

/**
 * Arbitrate an interpretation dispute using AI
 * Generates breakdowns for both original message and interpretation, then evaluates accuracy
 * 
 * @param originalMessage The original message being interpreted
 * @param interpretationText The interpretation text
 * @param conversationMessages All messages in the conversation (for full context)
 * @param authorNotes Author's explanation for why they rejected the interpretation (optional)
 * @param disputeReason Interpreter's explanation for why the rejection is unfair
 * @returns Arbitration result with accept/reject decision and detailed explanation
 */
export async function arbitrateInterpretation(
  originalMessage: Message,
  interpretationText: string,
  conversationMessages: Message[],
  authorNotes: string | null,
  disputeReason: string
): Promise<ArbitrationResult> {
  const client = getAIClient();
  const systemPrompt = getArbitrationSystemPrompt();

  // Generate breakdowns for both original message and interpretation
  const [originalBreakdown, interpretationBreakdown] = await Promise.all([
    generateBreakdownAI(originalMessage.text),
    generateBreakdownAI(interpretationText),
  ]);

  // Format breakdown points for the prompt
  const formatBreakdown = (points: BreakdownPoint[]): string => {
    if (points.length === 0) return '(No points extracted)';
    return points.map((p, idx) => `${idx + 1}. ${p.text}`).join('\n');
  };

  // Build conversation context (all previous messages)
  const conversationContext = conversationMessages
    .filter(msg => msg.id !== originalMessage.id)
    .map(msg => `Message: ${msg.text}`)
    .join('\n');

  // Build the full prompt with XML structure
  const userPrompt = [
    xmlTag('conversation_context', conversationContext || '(No previous messages)'),
    xmlTag('original_message_breakdown', formatBreakdown(originalBreakdown)),
    xmlTag('interpretation_breakdown', formatBreakdown(interpretationBreakdown)),
    authorNotes ? xmlTag('author_notes', authorNotes) : '',
    xmlTag('dispute_reason', disputeReason),
    '\nEvaluate the dispute. Compare the breakdowns point-by-point. Respond with JSON only.',
  ].filter(Boolean).join('\n\n');

  try {
    // Log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[AI Arbitration] Request:', {
        originalBreakdownPoints: originalBreakdown.length,
        interpretationBreakdownPoints: interpretationBreakdown.length,
        hasAuthorNotes: !!authorNotes,
      });
    }

    // Make the AI call with timeout and retry logic
    const response = await executeWithTimeoutAndRetry(() =>
      client.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ])
    );

    // Parse the JSON response
    const responseText = typeof response.content === 'string' 
      ? response.content 
      : String(response.content);

    // Extract JSON from response (handle cases where AI wraps it in markdown code blocks)
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    jsonText = jsonText.trim();

    const result = JSON.parse(jsonText) as ArbitrationResult;

    // Validate the result structure
    if (result.result !== 'accept' && result.result !== 'reject') {
      throw new Error('Invalid result value from AI (must be "accept" or "reject")');
    }
    if (typeof result.explanation !== 'string') {
      throw new Error('Invalid explanation format from AI');
    }

    // Log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[AI Arbitration] Response:', {
        result: result.result,
        explanationLength: result.explanation.length,
      });
    }

    return result;
  } catch (error) {
    // Re-throw with more context if it's a parsing error
    if (error instanceof SyntaxError) {
      throw new Error(
        `Failed to parse AI arbitration response as JSON: ${error.message}. ` +
        'The AI may have returned an invalid format. This indicates an API issue.'
      );
    }
    
    // Re-throw original error for API failures
    throw new Error(
      `AI arbitration failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Arbitrate when max attempts reached (no dispute, just final judgment)
 * Similar to dispute arbitration but without dispute reason
 * 
 * @param originalMessage The original message
 * @param interpretationText The final interpretation after max attempts
 * @param conversationMessages All messages in the conversation
 * @param attemptCount Number of attempts made
 * @returns Arbitration result
 */
export async function arbitrateMaxAttempts(
  originalMessage: Message,
  interpretationText: string,
  conversationMessages: Message[],
  attemptCount: number
): Promise<ArbitrationResult> {
  // Use the same arbitration function but with a synthetic dispute reason
  const disputeReason = `After ${attemptCount} attempts, the interpreter believes this interpretation accurately captures the original message. Please evaluate if this interpretation should be accepted or if fundamental misunderstandings persist.`;

  return arbitrateInterpretation(
    originalMessage,
    interpretationText,
    conversationMessages,
    null, // No author notes for max attempts case
    disputeReason
  );
}

