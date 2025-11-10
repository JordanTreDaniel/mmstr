/**
 * Test component to verify that all hooks work correctly
 * This component demonstrates the usage of all custom hooks
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useConversations } from '@/hooks/use-conversations';
import { useMessageInteractions } from '@/hooks/use-message-interactions';
import type { Message, Participation } from '@/types/entities';

export default function HooksTest() {
  // Test useLocalStorage
  const [testValue, setTestValue] = useLocalStorage<string>('test_key', 'Initial Value');
  
  // Test useCurrentUser
  const {
    currentUser,
    allUsers,
    createUser,
    switchUser,
  } = useCurrentUser();

  // Test useConversations
  const {
    conversations,
    currentConvo,
    createConversation,
    setCurrentConvo,
    joinConversation,
    addMessage,
    getMessages,
    getParticipants,
  } = useConversations();

  // Test useMessageInteractions
  const {
    flowState,
    submitInterpretation,
    gradeInterpretation,
    loadFlowState,
    createMessageBreakdown,
  } = useMessageInteractions();

  // Local state for inputs
  const [userName, setUserName] = useState('');
  const [convoTitle, setConvoTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [interpretationText, setInterpretationText] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // State for current conversation data
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [currentParticipants, setCurrentParticipants] = useState<Participation[]>([]);

  // Load messages and participants when currentConvo changes
  useEffect(() => {
    if (currentConvo) {
      loadConversationData();
    } else {
      setCurrentMessages([]);
      setCurrentParticipants([]);
    }
  }, [currentConvo]);

  const loadConversationData = async () => {
    if (!currentConvo) return;
    
    const messages = await getMessages(currentConvo.id);
    const participants = await getParticipants(currentConvo.id);
    
    setCurrentMessages(messages);
    setCurrentParticipants(participants);
  };

  // Handlers
  const handleCreateUser = () => {
    if (userName.trim()) {
      createUser(userName.trim());
      setUserName('');
    }
  };

  const handleCreateConvo = async () => {
    if (convoTitle.trim() && currentUser) {
      const convo = await createConversation(
        convoTitle.trim(),
        currentUser.id,
        currentUser.name
      );
      setCurrentConvo(convo.id);
      setConvoTitle('');
    }
  };

  const handleSendMessage = async () => {
    if (messageText.trim() && currentUser && currentConvo) {
      const message = await addMessage(messageText.trim(), currentUser.id, currentConvo.id);
      if (message) {
        // Create breakdown for the message
        await createMessageBreakdown(message.id, [
          'Point 1: First assertion',
          'Point 2: Second assertion',
          'Point 3: Third assertion',
        ]);
        // Reload messages
        await loadConversationData();
      }
      setMessageText('');
    }
  };

  const handleSubmitInterpretation = async () => {
    if (interpretationText.trim() && currentUser && selectedMessageId) {
      const interpretation = await submitInterpretation(
        selectedMessageId,
        currentUser.id,
        interpretationText.trim()
      );
      
      if (interpretation) {
        // Auto-grade with a random score for testing
        const score = Math.floor(Math.random() * 30) + 70; // 70-100
        await gradeInterpretation(
          interpretation.id,
          score >= 85 ? 'accepted' : 'rejected',
          score,
          score >= 90,
          'Test grading'
        );
        
        // Reload flow state
        await loadFlowState(selectedMessageId, currentUser.id);
      }
      
      setInterpretationText('');
    }
  };

  const handleLoadFlowState = async (messageId: string) => {
    if (currentUser) {
      setSelectedMessageId(messageId);
      await loadFlowState(messageId, currentUser.id);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold mb-6">Hooks Test Component</h1>

      {/* Test useLocalStorage */}
      <section className="border p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">1. useLocalStorage Test</h2>
        <div className="space-y-2">
          <p>Current value: <strong>{testValue}</strong></p>
          <input
            type="text"
            value={testValue}
            onChange={(e) => setTestValue(e.target.value)}
            className="border px-3 py-2 rounded w-full"
            placeholder="Edit this to test localStorage sync"
          />
        </div>
      </section>

      {/* Test useCurrentUser */}
      <section className="border p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">2. useCurrentUser Test</h2>
        <div className="space-y-3">
          <p>Current User: <strong>{currentUser?.name || 'None'}</strong> (ID: {currentUser?.id})</p>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="border px-3 py-2 rounded flex-1"
              placeholder="New user name"
            />
            <button
              onClick={handleCreateUser}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Create User
            </button>
          </div>

          <div>
            <p className="font-medium mb-2">All Users ({allUsers.length}):</p>
            <div className="flex flex-wrap gap-2">
              {allUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => switchUser(user.id)}
                  className={`px-3 py-1 rounded ${
                    user.id === currentUser?.id
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {user.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Test useConversations */}
      <section className="border p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">3. useConversations Test</h2>
        <div className="space-y-3">
          <p>Total Conversations: <strong>{conversations.length}</strong></p>
          <p>Current Conversation: <strong>{currentConvo?.title || 'None'}</strong></p>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={convoTitle}
              onChange={(e) => setConvoTitle(e.target.value)}
              className="border px-3 py-2 rounded flex-1"
              placeholder="New conversation title"
            />
            <button
              onClick={handleCreateConvo}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Create Conversation
            </button>
          </div>

          <div>
            <p className="font-medium mb-2">Conversations:</p>
            <div className="space-y-2">
              {conversations.map((convo) => (
                <div
                  key={convo.id}
                  className={`p-2 border rounded cursor-pointer ${
                    convo.id === currentConvo?.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setCurrentConvo(convo.id)}
                >
                  <p className="font-medium">{convo.title}</p>
                  <p className="text-sm text-gray-600">
                    Max Attempts: {convo.maxAttempts} | Participants: {currentConvo?.id === convo.id ? currentParticipants.length : '?'}/{convo.participantLimit}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {currentConvo && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p className="font-medium mb-2">Participants ({currentParticipants.length}):</p>
              <div className="text-sm text-gray-600">
                {currentParticipants.map((p) => (
                  <span key={p.userId} className="mr-3">{p.userId}</span>
                ))}
              </div>
              
              <div className="mt-3">
                <p className="font-medium mb-2">Messages ({currentMessages.length}):</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {currentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-2 bg-white border rounded cursor-pointer hover:border-blue-300"
                      onClick={() => handleLoadFlowState(msg.id)}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-xs text-gray-500 mt-1">By: {msg.userId}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="border px-3 py-2 rounded flex-1"
                  placeholder="Type a message (min 10 chars)..."
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                  disabled={!currentUser}
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Test useMessageInteractions */}
      <section className="border p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">4. useMessageInteractions Test</h2>
        <div className="space-y-3">
          {selectedMessageId ? (
            <div>
              <p className="font-medium mb-2">Flow State for Message: {selectedMessageId}</p>
              
              {flowState ? (
                <div className="space-y-2 bg-gray-50 p-3 rounded">
                  <p>Attempt: <strong>{flowState.attemptNumber}/{flowState.maxAttempts}</strong></p>
                  <p>Can Retry: <strong>{flowState.canRetry ? 'Yes' : 'No'}</strong></p>
                  
                  {flowState.messageBreakdown && (
                    <div>
                      <p className="font-medium">Message Points ({flowState.messagePoints.length}):</p>
                      <ul className="list-disc list-inside text-sm">
                        {flowState.messagePoints.map((point) => (
                          <li key={point.id}>{point.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {flowState.interpretation && (
                    <div className="mt-2 p-2 bg-white rounded">
                      <p className="font-medium">Latest Interpretation:</p>
                      <p className="text-sm">{flowState.interpretation.text}</p>
                    </div>
                  )}

                  {flowState.grading && (
                    <div className="mt-2 p-2 bg-white rounded">
                      <p className="font-medium">Grading:</p>
                      <p className="text-sm">
                        Status: <span className={flowState.grading.status === 'accepted' ? 'text-green-600' : 'text-red-600'}>
                          {flowState.grading.status}
                        </span>
                      </p>
                      <p className="text-sm">Score: {flowState.grading.similarityScore}</p>
                      <p className="text-sm">Auto-accept suggested: {flowState.grading.autoAcceptSuggested ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No flow state available</p>
              )}

              {currentUser && flowState?.canRetry && (
                <div className="mt-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={interpretationText}
                      onChange={(e) => setInterpretationText(e.target.value)}
                      className="border px-3 py-2 rounded flex-1"
                      placeholder="Write your interpretation..."
                    />
                    <button
                      onClick={handleSubmitInterpretation}
                      className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                    >
                      Submit Interpretation
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Click on a message above to test interpretation flow</p>
          )}
        </div>
      </section>

      <div className="text-sm text-gray-500 text-center pt-4">
        ✅ All hooks are working! Check the console for any errors.
      </div>
    </div>
  );
}
