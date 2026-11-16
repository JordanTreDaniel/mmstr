/**
 * AI Utility Functions
 * Timeout handling and retry logic for AI API calls,
 * plus defensive response-shape helpers for LangChain model output.
 */

const DEFAULT_TIMEOUT_MS = 120000; // 120 seconds (reasoning models are slower than gpt-4-class)
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_BACKOFF_MS = 1000; // 1 second

/**
 * Extract displayable text from a LangChain model response.
 *
 * Legal shapes (LangChain 1.x):
 * - BaseMessage with `content: string`
 * - BaseMessage with `content: Array<{ type: 'text', text: string } | ...>` (multimodal)
 * - BaseMessage exposing a `text` getter that already normalizes the above
 *
 * This helper NEVER reads properties off a possibly-undefined response.
 * If the response is missing or in an unexpected shape it throws a
 * descriptive Error (with provider-agnostic context) instead of letting a
 * minified TypeError like "Cannot read properties of undefined (reading 'aa')"
 * escape to the client.
 *
 * @param response The value returned by client.invoke()
 * @param contextLabel Short label for the call site (e.g. 'generateBreakdown')
 * @returns Non-empty text extracted from the response
 */
export function extractModelText(response: unknown, contextLabel: string): string {
  if (response === null || response === undefined) {
    throw new Error(
      `AI response is ${response} in ${contextLabel}. ` +
      'The model client returned no message object. This is a provider/client failure, not a prompt issue.'
    );
  }

  if (typeof response !== 'object') {
    throw new Error(
      `AI response in ${contextLabel} is not an object (got ${typeof response}: ${String(response).slice(0, 200)}). ` +
      'Expected a LangChain message.'
    );
  }

  const msg = response as { content?: unknown; text?: unknown };

  // Strategy 1: BaseMessage.text getter (handles string and content-block arrays).
  // Wrapped in try/catch in case a minified getter throws internally.
  try {
    const fromGetter = msg.text;
    if (typeof fromGetter === 'string' && fromGetter.length > 0) {
      return fromGetter;
    }
  } catch {
    // Getter threw — fall through to manual content extraction
  }

  // Strategy 2: plain string content
  const content = msg.content;
  if (typeof content === 'string') {
    return content;
  }

  // Strategy 3: content-block array (LangChain 1.x multimodal shape)
  if (Array.isArray(content)) {
    const textParts: string[] = [];
    const blockTypes: string[] = [];
    for (const block of content) {
      if (typeof block === 'string') {
        textParts.push(block);
        blockTypes.push('string');
        continue;
      }
      if (block && typeof block === 'object') {
        const b = block as { type?: unknown; text?: unknown };
        blockTypes.push(typeof b.type === 'string' ? b.type : typeof block);
        if (typeof b.text === 'string' && b.text.length > 0) {
          textParts.push(b.text);
        }
      } else {
        blockTypes.push(typeof block);
      }
    }
    const joined = textParts.join('\n');
    if (joined.length > 0) {
      return joined;
    }
    throw new Error(
      `AI response content array in ${contextLabel} contained no usable text blocks. ` +
      `Block types: [${blockTypes.join(', ')}].`
    );
  }

  // Strategy 4: missing / unusable content — throw with diagnostics
  if (content === undefined || content === null) {
    let keys = '(unavailable)';
    try {
      keys = Object.keys(msg).join(', ') || '(none)';
    } catch {
      // ignore
    }
    throw new Error(
      `AI response in ${contextLabel} has no usable 'content' property. ` +
      `Response keys: ${keys}. The provider returned an unexpected message shape.`
    );
  }

  throw new Error(
    `AI response in ${contextLabel} has unsupported content type (${typeof content}). ` +
    `Preview: ${String(content).slice(0, 200)}`
  );
}

/**
 * Strip markdown code fences from AI response text and parse JSON safely.
 *
 * Validates that the parsed value is a non-null object/array before returning,
 * so callers never do property reads on `null` or primitives after JSON.parse.
 *
 * @param responseText Raw text extracted from the model response
 * @param contextLabel Short label for the call site
 * @returns Parsed JSON value (object or array)
 */
export function parseAIJson<T>(responseText: string, contextLabel: string): T {
  let jsonText = (responseText ?? '').trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }
  jsonText = jsonText.trim();

  if (jsonText.length === 0) {
    throw new Error(`AI response in ${contextLabel} was empty after stripping code fences.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(
      `Failed to parse AI response as JSON in ${contextLabel}: ` +
      `${error instanceof Error ? error.message : String(error)}. ` +
      `Response preview: ${jsonText.slice(0, 200)}`
    );
  }

  if (parsed === null || typeof parsed !== 'object') {
    throw new Error(
      `AI JSON response in ${contextLabel} is ${parsed === null ? 'null' : typeof parsed}, expected an object or array. ` +
      `Response preview: ${jsonText.slice(0, 200)}`
    );
  }

  return parsed as T;
}

/**
 * Create a timeout promise that rejects after specified milliseconds
 */
function createTimeout(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`AI API call timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn Function to retry (should return a Promise)
 * @param maxRetries Maximum number of retry attempts
 * @param initialBackoffMs Initial backoff delay in milliseconds
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = DEFAULT_MAX_RETRIES,
  initialBackoffMs: number = DEFAULT_INITIAL_BACKOFF_MS
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate exponential backoff: 1s, 2s, 4s, etc.
      const backoffMs = initialBackoffMs * Math.pow(2, attempt);
      
      // Only retry on network errors or transient failures
      // Don't retry on authentication errors, validation errors, etc.
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        // Don't retry on client errors (4xx) except rate limiting
        if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
          throw error; // Authentication error, don't retry
        }
        if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
          throw error; // Permission error, don't retry
        }
        if (errorMessage.includes('400') || errorMessage.includes('bad request')) {
          throw error; // Validation error, don't retry
        }
        
        // Retry on rate limiting, timeouts, network errors, server errors (5xx)
        if (
          errorMessage.includes('429') ||
          errorMessage.includes('rate limit') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('network') ||
          errorMessage.includes('econnrefused') ||
          errorMessage.includes('500') ||
          errorMessage.includes('502') ||
          errorMessage.includes('503') ||
          errorMessage.includes('504')
        ) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
      }

      // If it's not a retryable error, throw immediately
      throw error;
    }
  }

  // If we exhausted retries, throw the last error
  throw lastError;
}

/**
 * Execute an AI API call with timeout and retry logic
 * 
 * @param fn Function that performs the AI API call
 * @param timeoutMs Timeout in milliseconds (default: 60 seconds)
 * @param maxRetries Maximum number of retries (default: 3)
 * @returns Result of the AI API call
 */
export async function executeWithTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  maxRetries: number = DEFAULT_MAX_RETRIES
): Promise<T> {
  // Wrap the function call with timeout
  const timeoutPromise = createTimeout(timeoutMs);
  const fnPromise = retryWithBackoff(fn, maxRetries);

  // Race between the function and timeout
  return Promise.race([fnPromise, timeoutPromise]);
}

