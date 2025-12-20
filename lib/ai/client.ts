/**
 * AI Client Configuration
 * Supports multiple AI providers (Anthropic/OpenAI) based on CHOSEN_PROVIDER env var
 * Configures LangSmith tracing if enabled
 */

import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { getChosenProvider, getAnthropicApiKey, getOpenAIApiKey, getLangSmithConfig } from '@/lib/env';

type AIClient = ChatAnthropic | ChatOpenAI;

let _client: AIClient | null = null;
let _currentProvider: string | null = null;

/**
 * Configure LangSmith tracing if enabled
 */
function configureLangSmithTracing(): void {
  const langSmithConfig = getLangSmithConfig();
  
  if (langSmithConfig.tracing) {
    if (langSmithConfig.apiKey) {
      process.env.LANGSMITH_API_KEY = langSmithConfig.apiKey;
    }
    if (langSmithConfig.endpoint) {
      process.env.LANGSMITH_ENDPOINT = langSmithConfig.endpoint;
    }
    if (langSmithConfig.project) {
      process.env.LANGSMITH_PROJECT = langSmithConfig.project;
    }
  }
}

/**
 * Get or create the AI chat client based on CHOSEN_PROVIDER
 * Supports both Anthropic and OpenAI
 */
export function getAIClient(): AIClient {
  const provider = getChosenProvider();
  
  // Reset client if provider changed
  if (_currentProvider !== provider) {
    _client = null;
    _currentProvider = provider;
  }
  
  if (!_client) {
    // Configure LangSmith tracing if enabled
    configureLangSmithTracing();

    const temperature = 0.3; // Lower temperature for more consistent, unbiased judgments

    if (provider === 'anthropic') {
      const apiKey = getAnthropicApiKey();
      _client = new ChatAnthropic({
        modelName: 'claude-3-5-sonnet-20241022', // Latest Claude 3.5 Sonnet model
        temperature,
        anthropicApiKey: apiKey,
      });
    } else {
      // Default to OpenAI
      const apiKey = getOpenAIApiKey();
      _client = new ChatOpenAI({
        modelName: 'gpt-4',
        temperature,
        openAIApiKey: apiKey,
      });
    }
  }

  return _client;
}

/**
 * Reset the client (useful for testing or reconfiguration)
 */
export function resetAIClient(): void {
  _client = null;
}

