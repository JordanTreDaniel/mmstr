'use client';

import React, { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { createMessage } from '@/app/actions/messages';
import Button from '@/app/components/ui/Button';
import Textarea from '@/app/components/ui/Textarea';
import type { Message } from '@/types/entities';

export interface MessageComposerProps {
  /** Conversation ID to send messages to */
  convoId: string;
  /** Available messages to reply to */
  messages: Message[];
  /** Callback when message is successfully sent */
  onMessageSent?: () => void;
}

/**
 * MessageComposer component
 * Allows users to compose and send messages with reply functionality
 */
export function MessageComposer({ convoId, messages, onMessageSent }: MessageComposerProps) {
  const { currentUserId } = useCurrentUser();
  const [text, setText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-select most recent message as reply target by default
  useEffect(() => {
    if (messages.length > 0 && replyingToId === null) {
      const mostRecentMessage = messages[messages.length - 1];
      setReplyingToId(mostRecentMessage.id);
    }
  }, [messages, replyingToId]);

  const handleSend = async () => {
    if (!currentUserId) {
      setError('No user logged in');
      return;
    }

    // Validate text length
    const trimmedText = text.trim();
    if (trimmedText.length < 10) {
      setError('Message must be at least 10 characters');
      return;
    }
    if (trimmedText.length > 280) {
      setError('Message must not exceed 280 characters');
      return;
    }

    setError(null);
    setIsSending(true);

    try {
      const newMessage = await createMessage(
        trimmedText,
        currentUserId,
        convoId,
        replyingToId
      );

      if (!newMessage) {
        setError('Failed to create message');
        return;
      }

      // Clear composer after successful send
      setText('');
      setError(null);
      
      // Notify parent component to refresh messages
      if (onMessageSent) {
        onMessageSent();
      }

      // Auto-select new message as reply target for next message
      setReplyingToId(newMessage.id);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  // Get the snippet for the selected reply-to message
  const getReplyToSnippet = () => {
    if (!replyingToId) return 'None';
    const message = messages.find(m => m.id === replyingToId);
    if (!message) return 'None';
    return message.text.length > 50 
      ? `${message.text.substring(0, 50)}...` 
      : message.text;
  };

  const isValid = text.trim().length >= 10 && text.trim().length <= 280;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 rounded-b-lg">
      <div className="space-y-3">
        {/* Reply-to selector */}
        <div>
          <label 
            htmlFor="reply-to" 
            className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300"
          >
            Replying to:
          </label>
          <select
            id="reply-to"
            value={replyingToId || ''}
            onChange={(e) => setReplyingToId(e.target.value || null)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={messages.length === 0 || isSending}
          >
            {messages.length === 0 ? (
              <option value="">No messages yet</option>
            ) : (
              messages.map((message, index) => (
                <option key={message.id} value={message.id}>
                  Message {index + 1}: {message.text.length > 60 
                    ? `${message.text.substring(0, 60)}...` 
                    : message.text}
                </option>
              ))
            )}
          </select>
          {replyingToId && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 italic">
              {getReplyToSnippet()}
            </p>
          )}
        </div>

        {/* Message input */}
        <div>
          <Textarea
            label="Your message"
            placeholder="Type your message here... (Ctrl/Cmd + Enter to send)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyPress}
            maxLength={280}
            showCharacterCount
            rows={4}
            resize="none"
            disabled={isSending}
            error={error || undefined}
            helperText={!error ? 'Messages must be 10-280 characters' : undefined}
          />
        </div>

        {/* Send button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!isValid || isSending || !currentUserId}
            className="min-w-[100px]"
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
