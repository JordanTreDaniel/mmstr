/**
 * AI-Powered Breakdown Generation
 * Breaks down text into atomic, non-overlapping points capturing every meaningful element
 */
import { getAIClient } from './client';
import { getBreakdownSystemPrompt, xmlTag } from './prompts';
import { executeWithTimeoutAndRetry } from './utils';

export interface BreakdownPoint {
  text: string;
  order: number;
  //TODO: The breakdown text should have a quote, but also an expert-derived (llm) interpretation of the quote.
}

/**
 * Generate atomic breakdown points from text
 * Extracts every meaningful assertion, including adjectives, purposes, motivations, etc.
 * 
 * @param text The text to break down
 * @returns Array of atomic points with order indices
 */
export async function generateBreakdown(text: string): Promise<BreakdownPoint[]> {
  const client = getAIClient();
  const systemPrompt = getBreakdownSystemPrompt();

  // Build the user prompt
  const userPrompt = [
    xmlTag('text', text),
    '\nBreak down this text into atomic points. Respond with JSON array only.',
  ].join('\n\n');

  try {
    // Log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[AI Breakdown] Request:', {
        textLength: text.length,
        textPreview: text.substring(0, 100) + '...',
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

    const points = JSON.parse(jsonText) as BreakdownPoint[];

    // Validate the result structure
    if (!Array.isArray(points)) {
      throw new Error('AI response is not an array');
    }

    // Validate each point has required fields
    for (const point of points) {
      if (typeof point.text !== 'string' || typeof point.order !== 'number') {
        throw new Error('Invalid point structure in AI response');
      }
    }

    // Sort by order to ensure correct sequence (in case AI doesn't order them correctly)
    const sortedPoints = points.sort((a, b) => a.order - b.order);

    // Ensure order indices start at 0 and are sequential (renumber if needed)
    const finalPoints = sortedPoints.map((point, index) => ({
      text: point.text.trim(),
      order: index,
    }));

    // Log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[AI Breakdown] Response:', {
        pointCount: finalPoints.length,
      });
    }

    return finalPoints;
  } catch (error) {
    // Re-throw with more context if it's a parsing error
    if (error instanceof SyntaxError) {
      throw new Error(
        `Failed to parse AI breakdown response as JSON: ${error.message}. ` +
        'The AI may have returned an invalid format. This indicates an API issue.'
      );
    }
    
    // Re-throw original error for API failures
    throw new Error(
      `AI breakdown generation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

