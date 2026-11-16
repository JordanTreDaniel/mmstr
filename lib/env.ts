/**
 * Environment variable validation and access
 * Ensures required environment variables are present
 */

export type AIProvider = 'anthropic' | 'openai';

/**
 * Default model IDs.
 *
 * OpenAI retired `gpt-4` (API returns 404 `model_not_found`), which broke every
 * AI feature on 2026-11-16. Model IDs are now overridable at runtime via
 * `OPENAI_MODEL` / `ANTHROPIC_MODEL`, so the next retirement is an env change
 * in Doppler instead of a code change + redeploy.
 *
 * NOTE: `gpt-6-luna` is a reasoning model — it rejects any temperature but the
 * default (verified 400 on `temperature: 0.3`), so lib/ai/client.ts omits the
 * temperature for gpt-5+/gpt-6+/o-series models.
 */
export const DEFAULT_OPENAI_MODEL = 'gpt-6-luna';
export const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-5';

const optionalEnvVars = [
  'LANGSMITH_TRACING',
  'LANGSMITH_API_KEY',
  'LANGSMITH_ENDPOINT',
  'LANGSMITH_PROJECT',
] as const;

/**
 * Get the chosen AI provider from environment variable
 * Defaults to 'openai' if not set
 */
export function getChosenProvider(): AIProvider {
  const provider = process.env.CHOSEN_PROVIDER?.toLowerCase().trim();
  if (provider === 'anthropic' || provider === 'openai') {
    return provider;
  }
  // Default to OpenAI if not set or invalid
  return 'openai';
}

/**
 * Validates that all required environment variables are set
 * Throws an error if any are missing
 */
export function validateEnv(): void {
  const provider = getChosenProvider();
  const missing: string[] = [];

  // Check for provider-specific API key
  if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
    missing.push('ANTHROPIC_API_KEY');
  } else if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    missing.push('OPENAI_API_KEY');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for provider '${provider}': ${missing.join(', ')}\n` +
      'Please ensure these are set in your .env file.'
    );
  }
}

/**
 * Get Anthropic API key from environment
 */
export function getAnthropicApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
  }
  return key;
}

/**
 * Get OpenAI API key from environment
 */
export function getOpenAIApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  return key;
}

/**
 * Get the OpenAI model ID from environment (falls back to DEFAULT_OPENAI_MODEL)
 */
export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

/**
 * Get the Anthropic model ID from environment (falls back to DEFAULT_ANTHROPIC_MODEL)
 */
export function getAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;
}

/**
 * Get LangSmith configuration from environment
 */
export function getLangSmithConfig(): {
  tracing: boolean;
  apiKey?: string;
  endpoint?: string;
  project?: string;
} {
  return {
    tracing: process.env.LANGSMITH_TRACING === 'true',
    apiKey: process.env.LANGSMITH_API_KEY,
    endpoint: process.env.LANGSMITH_ENDPOINT,
    project: process.env.LANGSMITH_PROJECT,
  };
}

