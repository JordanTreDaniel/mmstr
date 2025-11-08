/**
 * Test script to verify storage utilities work correctly
 * This file can be imported in a component to test the storage functionality
 * Run this in the browser console or in a component mount
 */

import { getItem, setItem, removeItem, clear, hasKey, getAllKeys } from './storage';
import { STORAGE_KEYS } from './storage-keys';

interface TestConvo {
  id: string;
  title: string;
  created_at: string;
  max_attempts: number;
  participant_limit: number;
}

interface TestMessage {
  id: string;
  text: string;
  user_id: string;
  convo_id: string;
  created_at: string;
}

export function runStorageTests(): {
  success: boolean;
  results: string[];
  errors: string[];
} {
  const results: string[] = [];
  const errors: string[] = [];

  try {
    // Test 1: Write and read a conversation
    results.push('Test 1: Write and read a conversation');
    const testConvo: TestConvo = {
      id: 'test-convo-1',
      title: 'Test Conversation',
      created_at: new Date().toISOString(),
      max_attempts: 3,
      participant_limit: 20,
    };

    const writeSuccess = setItem(STORAGE_KEYS.CONVOS, [testConvo]);
    if (!writeSuccess) {
      errors.push('Failed to write conversation');
    } else {
      results.push('✓ Successfully wrote conversation');
    }

    const readConvos = getItem<TestConvo[]>(STORAGE_KEYS.CONVOS);
    if (!readConvos || readConvos.length !== 1 || readConvos[0].id !== 'test-convo-1') {
      errors.push('Failed to read conversation correctly');
    } else {
      results.push('✓ Successfully read conversation');
    }

    // Test 2: Check if key exists
    results.push('\nTest 2: Check if key exists');
    if (hasKey(STORAGE_KEYS.CONVOS)) {
      results.push('✓ Key exists check works');
    } else {
      errors.push('hasKey returned false for existing key');
    }

    // Test 3: Write and read a message
    results.push('\nTest 3: Write and read a message');
    const testMessage: TestMessage = {
      id: 'test-msg-1',
      text: 'This is a test message',
      user_id: 'user-1',
      convo_id: 'test-convo-1',
      created_at: new Date().toISOString(),
    };

    setItem(STORAGE_KEYS.MESSAGES, [testMessage]);
    const readMessages = getItem<TestMessage[]>(STORAGE_KEYS.MESSAGES);
    if (!readMessages || readMessages[0].text !== 'This is a test message') {
      errors.push('Failed to read message correctly');
    } else {
      results.push('✓ Successfully wrote and read message');
    }

    // Test 4: Get all keys
    results.push('\nTest 4: Get all keys');
    const allKeys = getAllKeys();
    const hasConvoKey = allKeys.some(k => k === STORAGE_KEYS.CONVOS);
    const hasMsgKey = allKeys.some(k => k === STORAGE_KEYS.MESSAGES);
    if (hasConvoKey && hasMsgKey) {
      results.push(`✓ getAllKeys returned ${allKeys.length} keys including our test keys`);
    } else {
      errors.push('getAllKeys did not return expected keys');
    }

    // Test 5: Remove a key
    results.push('\nTest 5: Remove a key');
    removeItem(STORAGE_KEYS.MESSAGES);
    if (!hasKey(STORAGE_KEYS.MESSAGES)) {
      results.push('✓ Successfully removed key');
    } else {
      errors.push('Failed to remove key');
    }

    // Test 6: Test with user settings
    results.push('\nTest 6: Write and read user settings');
    const testSettings = {
      autoAcceptThreshold: 90,
      maxAttempts: 3,
      theme: 'light',
    };
    setItem(STORAGE_KEYS.USER_SETTINGS, testSettings);
    const readSettings = getItem<typeof testSettings>(STORAGE_KEYS.USER_SETTINGS);
    if (readSettings?.autoAcceptThreshold === 90 && readSettings.theme === 'light') {
      results.push('✓ Successfully wrote and read user settings');
    } else {
      errors.push('Failed to read user settings correctly');
    }

    // Cleanup: Clear test data
    results.push('\nTest 7: Clear all test data');
    removeItem(STORAGE_KEYS.CONVOS);
    removeItem(STORAGE_KEYS.USER_SETTINGS);
    results.push('✓ Cleanup completed');

    return {
      success: errors.length === 0,
      results,
      errors,
    };
  } catch (error) {
    errors.push(`Unexpected error: ${error}`);
    return {
      success: false,
      results,
      errors,
    };
  }
}

// Export a function to print results to console
export function testStorageInConsole(): void {
  console.log('🧪 Running storage tests...\n');
  const { success, results, errors } = runStorageTests();
  
  console.log(results.join('\n'));
  
  if (errors.length > 0) {
    console.error('\n❌ Errors:', errors);
  }
  
  console.log(`\n${success ? '✅ All tests passed!' : '❌ Some tests failed'}`);
}
