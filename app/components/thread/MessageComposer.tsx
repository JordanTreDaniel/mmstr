'use client';

import React, { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { createMessage } from '@/app/actions/messages';
import { getInterpretationsByMessage, getGradingByInterpretation } from '@/app/actions/interpretations';
import { requiresInterpretation } from '@/lib/character-validation';
import { canRespondToMessage } from '@/lib/message-status';
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
  /** Callback to open message modal for interpretation */
  onOpenMessageModal?: (messageId: string) => void;
}

/**
 * MessageComposer component
 * Allows users to compose and send messages with reply functionality
 */
export function MessageComposer({ convoId, messages, onMessageSent, onOpenMessageModal }: MessageComposerProps) {
  const { currentUserId, currentUser, createUser, allUsers } = useCurrentUser();
  const [text, setText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canReply, setCanReply] = useState<boolean>(true);
  const [replyBlockReason, setReplyBlockReason] = useState<string | null>(null);
  const [isOwnMessage, setIsOwnMessage] = useState<boolean>(false);

  // Auto-select most recent message as reply target by default
  useEffect(() => {
    if (messages.length > 0 && currentUserId) {
      const mostRecentMessage = messages[messages.length - 1];
      // Don't auto-select if the most recent message is from the current user
      if (mostRecentMessage.userId === currentUserId) {
        // If currently selected message is also user's own or null, clear selection
        if (replyingToId === null || messages.find(m => m.id === replyingToId)?.userId === currentUserId) {
          setReplyingToId(null);
        }
        return;
      }

      // Only auto-update if we have no selection OR if the current selection is the user's own message
      if (replyingToId === null || messages.find(m => m.id === replyingToId)?.userId === currentUserId) {
        setReplyingToId(mostRecentMessage.id);
      }
    }
  }, [messages, replyingToId, currentUserId]);
  
  // Check if user can reply to the selected message
  useEffect(() => {
    async function checkReplyPermission() {
      // If no messages exist, allow writing the first message
      if (messages.length === 0) {
        setCanReply(true);
        setReplyBlockReason(null);
        return;
      }
      
      if (!replyingToId || !currentUserId) {
        setCanReply(false);
        setReplyBlockReason('No message selected');
        return;
      }
      
      const message = messages.find(m => m.id === replyingToId);
      if (!message) {
        setCanReply(false);
        setReplyBlockReason('Message not found');
        return;
      }
      
      const isOwn = message.userId === currentUserId;
      setIsOwnMessage(isOwn);
      const needsInterpretation = requiresInterpretation(message.text);
      
      // Check interpretation status if needed
      let interpretationStatus: 'pending' | 'accepted' | 'rejected' | undefined = undefined;
      
      if (!isOwn && needsInterpretation) {
        const interpretations = await getInterpretationsByMessage(message.id, currentUserId);
        if (interpretations.length > 0) {
          const latestInterpretation = interpretations[0];
          const grading = await getGradingByInterpretation(latestInterpretation.id);
          if (grading) {
            interpretationStatus = grading.status;
          }
        }
      }
      
      const canRespond = canRespondToMessage({
        isOwnMessage: isOwn,
        requiresInterpretation: needsInterpretation,
        hasInterpretation: interpretationStatus !== undefined,
        interpretationStatus,
        hasResponded: false, // Not relevant for this check
      });
      
      setCanReply(canRespond);
      
      if (!canRespond) {
        if (isOwn) {
          setReplyBlockReason('Cannot reply to your own message');
        } else if (needsInterpretation) {
          if (!interpretationStatus) {
            setReplyBlockReason('You must submit and get approval for your interpretation before replying');
          } else if (interpretationStatus === 'pending') {
            setReplyBlockReason('Your interpretation is pending review. Wait for approval before replying');
          } else if (interpretationStatus === 'rejected') {
            setReplyBlockReason('Your interpretation was rejected. Submit a new interpretation to reply');
          }
        }
      } else {
        setReplyBlockReason(null);
      }
    }
    
    checkReplyPermission();
  }, [replyingToId, currentUserId, messages, currentUser]);

  const handleSend = async () => {
    if (!canReply) {
      setError(replyBlockReason || 'Cannot reply to this message');
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
      // Validate user exists - should be handled by parent component
      if (!currentUser || !currentUser.id) {
        setError('You must be logged in to send a message.');
        return;
      }

      const newMessage = await createMessage(
        trimmedText,
        currentUser.id,
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

      // Don't auto-select the message we just sent (can't reply to own message)
      // The auto-select logic will pick it up when new messages arrive
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

  // If composer is blocked, show a helpful message instead
  if (!canReply) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 rounded-b-lg">
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="text-gray-700 dark:text-gray-300">
            <p className="font-medium mb-2 text-sm sm:text-base">Cannot Reply Yet</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {replyBlockReason || 'You need to complete the required steps before replying.'}
            </p>
          </div>
          {/* Only show Interpret button if it's NOT your own message */}
          {replyingToId && onOpenMessageModal && !isOwnMessage && (
            <Button
              variant="primary"
              onClick={() => onOpenMessageModal(replyingToId)}
            >
              Interpret Message
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-b-lg">
      <div className="space-y-2 sm:space-y-3">
        {/* Reply-to selector */}
        <div>
          <label 
            htmlFor="reply-to" 
            className="block text-xs sm:text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300"
          >
            Replying to:
          </label>
          <select
            id="reply-to"
            value={replyingToId || ''}
            onChange={(e) => setReplyingToId(e.target.value || null)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 sm:px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic">
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
            rows={3}
            resize="none"
            disabled={isSending || !canReply}
            error={error || undefined}
            helperText={!error && canReply ? 'Messages must be 10-280 characters' : !canReply ? replyBlockReason || undefined : undefined}
          />
        </div>

        {/* Send button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            onClick={handleSend}
            disabled={!isValid || isSending || !canReply}
            className="min-w-[80px] sm:min-w-[100px]"
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
