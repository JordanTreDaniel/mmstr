/**
 * Test AI client initialization and basic functionality
 * Requires API key based on CHOSEN_PROVIDER (anthropic or openai)
 */

// Load .env file before importing other modules
import 'dotenv/config';

import { getAIClient } from '@/lib/ai/client';
import { validateEnv, getChosenProvider } from '@/lib/env';

async function testAIClient() {
  try {
    const provider = getChosenProvider();
    console.log(`Using provider: ${provider}`);
    
    // Validate environment
    validateEnv();
    console.log('✓ Environment variables validated');

    // Get client
    const client = getAIClient();
    console.log('✓ AI client initialized');

    // Make a simple test call
    const response = await client.invoke('Say "Hello, AI integration test successful!"');
    console.log('✓ AI response received:', response.content);
    
    console.log('\n✅ All tests passed - AI client is working correctly');
  } catch (error) {
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('api_key') || errorMsg.includes('missing required')) {
        console.error('❌ Test requires API key to be set in .env file');
        console.error('   Set CHOSEN_PROVIDER=anthropic and ANTHROPIC_API_KEY=...');
        console.error('   OR set CHOSEN_PROVIDER=openai and OPENAI_API_KEY=...');
        console.error('   (Default provider is openai if CHOSEN_PROVIDER is not set)');
      } else {
        console.error('❌ Test failed:', error.message);
        throw error;
      }
    } else {
      console.error('❌ Test failed:', error);
      throw error;
    }
  }
}

testAIClient();

