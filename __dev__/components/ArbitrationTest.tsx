'use client';

import React, { useState } from 'react';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import MessageModal from '@/app/components/modals/MessageModal';
import { createConversation } from '@/app/actions/convos';
import { createMessage } from '@/app/actions/messages';
import { createUser } from '@/app/actions/users';
import { createInterpretation, gradeInterpretation, updateGrading, createGradingResponse } from '@/app/actions/interpretations';

/**
 * ArbitrationTest Component
 * 
 * Tests the arbitration flow end-to-end:
 * 1. Dispute-triggered arbitration: Interpreter disputes a rejection
 * 2. Max-attempts arbitration: Interpreter reaches maximum attempts
 */
export default function ArbitrationTest() {
  const [testLog, setTestLog] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [testRunning, setTestRunning] = useState(false);

  const addLog = (message: string) => {
    setTestLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(message);
  };

  const clearLog = () => {
    setTestLog([]);
  };

  /**
   * Test Case 1: Dispute-triggered arbitration
   * Flow:
   * 1. Create a conversation and message
   * 2. Create an interpretation
   * 3. Reject the interpretation with feedback
   * 4. Submit a dispute
   * 5. Verify arbitration is triggered automatically
   * 6. Open modal to view arbitration result
   */
  const testDisputeArbitration = async () => {
    setTestRunning(true);
    clearLog();
    
    try {
      addLog('=== TEST CASE 1: Dispute-Triggered Arbitration ===');
      
      // Step 1: Create users
      addLog('Creating test users...');
      const author = await createUser('Test Author');
      const interpreter = await createUser('Test Interpreter');
      addLog(`✓ Created author (ID: ${author.id}) and interpreter (ID: ${interpreter.id})`);
      
      // Step 2: Create conversation
      addLog('Creating conversation...');
      const convo = await createConversation(
        'Arbitration Test Conversation',
        author.id,
        author.name,
        3 // maxAttempts
      );
      addLog(`✓ Created conversation (ID: ${convo.id})`);
      
      // Step 3: Create a message that requires interpretation
      addLog('Creating message...');
      const message = await createMessage(
        'This is a longer message that definitely requires interpretation to demonstrate understanding before responding. It contains multiple ideas and concepts that need to be properly understood.',
        author.id,
        convo.id,
        null
      );
      if (!message) {
        throw new Error('Failed to create message');
      }
      addLog(`✓ Created message (ID: ${message.id})`);
      
      // Step 4: Create an interpretation
      addLog('Creating interpretation (attempt 1)...');
      const interpretation = await createInterpretation(
        message.id,
        interpreter.id,
        'I understand that you want me to show comprehension of your complex message with various ideas.',
        1
      );
      addLog(`✓ Created interpretation (ID: ${interpretation.id})`);
      
      // Step 5: Grade the interpretation
      addLog('Grading interpretation...');
      const grading = await gradeInterpretation(interpretation.id);
      addLog(`✓ Grading created with ${grading.similarityScore}% similarity (Status: ${grading.status})`);
      
      // Step 6: Reject the interpretation (author's decision)
      addLog('Author rejecting interpretation...');
      await updateGrading(grading.id, {
        status: 'rejected',
        notes: 'You did not capture the specific concepts I mentioned. Please try again.'
      });
      addLog('✓ Interpretation rejected by author');
      
      // Step 7: Interpreter disputes the rejection
      addLog('Interpreter submitting dispute...');
      const dispute = await createGradingResponse(
        grading.id,
        'I believe my interpretation accurately captured the core meaning. The differences are stylistic, not substantive.'
      );
      addLog(`✓ Dispute submitted (ID: ${dispute.id})`);
      addLog('⚖️  Arbitration should now be triggered automatically...');
      
      // Wait a moment for arbitration to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      addLog('✓ Test setup complete! Opening modal to view arbitration result...');
      
      // Open the modal to view the result
      setCurrentUserId(interpreter.id);
      setCurrentMessageId(message.id);
      setIsModalOpen(true);
      
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Test error:', error);
    } finally {
      setTestRunning(false);
    }
  };

  /**
   * Test Case 2: Max-attempts arbitration
   * Flow:
   * 1. Create a conversation with maxAttempts=3
   * 2. Create a message
   * 3. Submit 3 interpretations, all rejected
   * 4. Verify arbitration is triggered on the 3rd rejection
   * 5. Open modal to view arbitration result
   */
  const testMaxAttemptsArbitration = async () => {
    setTestRunning(true);
    clearLog();
    
    try {
      addLog('=== TEST CASE 2: Max-Attempts Arbitration ===');
      
      // Step 1: Create users
      addLog('Creating test users...');
      const author = await createUser('Test Author 2');
      const interpreter = await createUser('Test Interpreter 2');
      addLog(`✓ Created author (ID: ${author.id}) and interpreter (ID: ${interpreter.id})`);
      
      // Step 2: Create conversation with maxAttempts = 3
      addLog('Creating conversation with maxAttempts=3...');
      const convo = await createConversation(
        'Max Attempts Test Conversation',
        author.id,
        author.name,
        3
      );
      addLog(`✓ Created conversation (ID: ${convo.id})`);
      
      // Step 3: Create a message
      addLog('Creating message...');
      const message = await createMessage(
        'This is another complex message that requires proper interpretation to ensure understanding before allowing responses.',
        author.id,
        convo.id,
        null
      );
      if (!message) {
        throw new Error('Failed to create message');
      }
      addLog(`✓ Created message (ID: ${message.id})`);
      
      // Step 4-6: Submit 3 interpretations, reject each one
      for (let attemptNum = 1; attemptNum <= 3; attemptNum++) {
        addLog(`\n--- Attempt ${attemptNum}/3 ---`);
        
        // Create interpretation
        addLog(`Creating interpretation (attempt ${attemptNum})...`);
        const interpretation = await createInterpretation(
          message.id,
          interpreter.id,
          `Attempt ${attemptNum}: I think I understand what you're saying about the complex topic.`,
          attemptNum
        );
        addLog(`✓ Created interpretation (ID: ${interpretation.id})`);
        
        // Grade the interpretation
        addLog('Grading interpretation...');
        const grading = await gradeInterpretation(interpretation.id);
        addLog(`✓ Grading created with ${grading.similarityScore}% similarity (Status: ${grading.status})`);
        
        // Reject the interpretation
        addLog(`Author rejecting interpretation (attempt ${attemptNum})...`);
        await updateGrading(grading.id, {
          status: 'rejected',
          notes: `Attempt ${attemptNum} is still not accurate enough. ${attemptNum === 3 ? 'This is your final attempt.' : 'Please try again.'}`
        });
        addLog(`✓ Interpretation rejected by author`);
        
        if (attemptNum === 3) {
          addLog('⚖️  Maximum attempts reached! Arbitration should be triggered automatically...');
          // Wait for arbitration to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      addLog('\n✓ Test setup complete! Opening modal to view arbitration result...');
      
      // Open the modal to view the result
      setCurrentUserId(interpreter.id);
      setCurrentMessageId(message.id);
      setIsModalOpen(true);
      
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Test error:', error);
    } finally {
      setTestRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card variant="elevated" padding="lg">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          ⚖️ Arbitration Flow Test
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          End-to-end testing of the arbitration system with both dispute-triggered and max-attempts scenarios.
        </p>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Test Case 1: Dispute-Triggered Arbitration
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Tests the flow when an interpreter disputes a rejection:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4 ml-4">
              <li>• Creates message and interpretation</li>
              <li>• Author rejects interpretation</li>
              <li>• Interpreter disputes rejection</li>
              <li>• Arbitration is triggered automatically</li>
              <li>• Result displayed in MessageModal</li>
            </ul>
            <Button
              onClick={testDisputeArbitration}
              disabled={testRunning}
              variant="primary"
              size="md"
            >
              {testRunning ? 'Running Test...' : 'Run Test 1: Dispute Arbitration'}
            </Button>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Test Case 2: Max-Attempts Arbitration
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Tests the flow when maximum interpretation attempts are reached:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4 ml-4">
              <li>• Creates message with maxAttempts=3</li>
              <li>• Submits 3 interpretations, all rejected</li>
              <li>• Arbitration triggered on 3rd rejection</li>
              <li>• Result displayed in MessageModal</li>
            </ul>
            <Button
              onClick={testMaxAttemptsArbitration}
              disabled={testRunning}
              variant="primary"
              size="md"
            >
              {testRunning ? 'Running Test...' : 'Run Test 2: Max Attempts Arbitration'}
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Test Log */}
      {testLog.length > 0 && (
        <Card variant="outlined" padding="lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Test Log
            </h3>
            <Button
              onClick={clearLog}
              variant="outline"
              size="sm"
            >
              Clear Log
            </Button>
          </div>
          <div className="bg-gray-900 dark:bg-black rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
              {testLog.join('\n')}
            </pre>
          </div>
        </Card>
      )}
      
      {/* Instructions */}
      <Card variant="outlined" padding="md">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          📋 Testing Instructions
        </h3>
        <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 ml-4 list-decimal">
          <li>Click one of the test buttons above to set up a test scenario</li>
          <li>Wait for the test setup to complete (watch the log)</li>
          <li>The MessageModal will open automatically showing the arbitration result</li>
          <li>Verify the ArbitrationStep component displays correctly with:
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li>Arbitration decision badge (accept/reject)</li>
              <li>Detailed explanation from AI</li>
              <li>Similarity score</li>
              <li>Original message and interpretation</li>
              <li>Author's feedback (if any)</li>
              <li>Dispute reason (for dispute-triggered arbitration)</li>
            </ul>
          </li>
          <li>Close the modal and run the other test case</li>
          <li>Verify both arbitration paths work correctly</li>
        </ol>
      </Card>
      
      {/* MessageModal for viewing results */}
      {currentMessageId && currentUserId && (
        <MessageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          messageId={currentMessageId}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
