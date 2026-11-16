/**
 * AI Client Configuration
 * Supports multiple AI providers (Anthropic/OpenAI) based on CHOSEN_PROVIDER env var
 * Configures LangSmith tracing if enabled
 */

import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import {
  getChosenProvider,
  getAnthropicApiKey,
  getOpenAIApiKey,
  getAnthropicModel,
  getOpenAIModel,
  getLangSmithConfig,
} from '@/lib/env';

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

    // Reasoning models (gpt-5+, gpt-6+, o-series) reject any temperature but
    // the default. Verified against the live API: gpt-5-mini and gpt-6-luna
    // both return 400 "Unsupported value: 'temperature' does not support 0.3".
    const isReasoningModel = (model: string) => /^(gpt-[5-9]|o[1-9])/i.test(model);

    if (provider === 'anthropic') {
      const apiKey = getAnthropicApiKey();
      const model = getAnthropicModel();
      _client = new ChatAnthropic({
        modelName: model,
        ...(isReasoningModel(model) ? {} : { temperature }),
        anthropicApiKey: apiKey,
      });
    } else {
      // Default to OpenAI
      const apiKey = getOpenAIApiKey();
      const model = getOpenAIModel();
      _client = new ChatOpenAI({
        modelName: model,
        ...(isReasoningModel(model) ? {} : { temperature }),
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

