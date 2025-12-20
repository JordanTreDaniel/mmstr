// Test file to verify LangChain imports work
// Load .env file (even though not strictly needed for this test)
import 'dotenv/config';

import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import axios from 'axios';

// Test that imports work
console.log('✓ LangChain imports successful');
console.log('✓ ChatAnthropic available:', typeof ChatAnthropic);
console.log('✓ ChatOpenAI available:', typeof ChatOpenAI);
console.log('✓ axios available:', typeof axios);

