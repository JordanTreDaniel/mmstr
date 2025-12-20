/**
 * AI-Powered Interpretation Grading
 * Uses OpenAI to evaluate if an interpretation accurately restates the original message
 */

import { getAIClient } from './client';
import { getInterpretationGradingSystemPrompt, xmlTag } from './prompts';
import { executeWithTimeoutAndRetry } from './utils';
import { getConversationMessages } from '@/app/actions/messages';
import type { Message } from '@/types/entities';

export interface InterpretationGradingResult {
  similarityScore: number;
  passes: boolean;
  autoAcceptSuggested: boolean;
  reasoning: string;
}

/**
 * Grade an interpretation using AI
 * Includes full conversation context (all previous messages) for better understanding
 * 
 * @param originalMessage The original message text
 * @param interpretationText The interpretation text
 * @param conversationMessages All messages in the conversation (for context, excluding interpretations)
 * @returns Grading result with similarity score, pass/fail, and reasoning
 */
export async function gradeInterpretation(
  originalMessage: Message,
  interpretationText: string,
  conversationMessages: Message[]
): Promise<InterpretationGradingResult> {
  const client = getAIClient();
  const systemPrompt = getInterpretationGradingSystemPrompt();

  // Filter out the current message from conversation context (it's the one being interpreted)
  const contextMessages = conversationMessages.filter(msg => msg.id !== originalMessage.id);

  // Build conversation context XML (only message texts, no interpretations)
  const conversationContext = contextMessages.length > 0
    ? contextMessages.map(msg => `Message: ${msg.text}`).join('\n')
    : '(No previous messages in conversation)';

  // Build the full prompt with XML structure
  const userPrompt = [
    xmlTag('conversation_context', conversationContext),
    xmlTag('original_message', originalMessage.text),
    xmlTag('interpretation', interpretationText),
    '\nEvaluate the interpretation. Respond with JSON only.',
  ].join('\n\n');

  try {
    // Log in development mode (not production to avoid sensitive data exposure)
    if (process.env.NODE_ENV === 'development') {
      console.log('[AI Grading] Request:', {
        originalMessage: originalMessage.text.substring(0, 100) + '...',
        interpretationText: interpretationText.substring(0, 100) + '...',
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

    const result = JSON.parse(jsonText) as InterpretationGradingResult;

    // Validate the result structure
    if (typeof result.similarityScore !== 'number' || 
        typeof result.passes !== 'boolean' ||
        typeof result.reasoning !== 'string') {
      throw new Error('Invalid response format from AI');
    }

    // Ensure similarity score is in valid range
    result.similarityScore = Math.max(0, Math.min(100, result.similarityScore));

    // Calculate autoAcceptSuggested if not provided
    if (typeof result.autoAcceptSuggested !== 'boolean') {
      result.autoAcceptSuggested = result.similarityScore >= 90 && result.passes === true;
    }

    // Log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[AI Grading] Response:', {
        similarityScore: result.similarityScore,
        passes: result.passes,
        autoAcceptSuggested: result.autoAcceptSuggested,
      });
    }

    return result;
  } catch (error) {
    // Re-throw with more context if it's a parsing error
    if (error instanceof SyntaxError) {
      throw new Error(
        `Failed to parse AI response as JSON: ${error.message}. ` +
        'The AI may have returned an invalid format. This indicates an API issue.'
      );
    }
    
    // Re-throw original error for API failures
    throw new Error(
      `AI grading failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

