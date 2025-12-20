/**
 * AI Utility Functions
 * Timeout handling and retry logic for AI API calls
 */

const DEFAULT_TIMEOUT_MS = 60000; // 60 seconds
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_BACKOFF_MS = 1000; // 1 second

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

