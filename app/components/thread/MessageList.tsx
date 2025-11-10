'use client';

import React from 'react';
import { MessageCard } from './MessageCard';
import type { Message } from '@/types/entities';
import type { MessageStatus } from '@/lib/message-status';

export interface MessageWithMetadata {
  message: Message;
  userName: string;
  status: MessageStatus;
  replyingToSnippet?: string | null;
}

export interface MessageListProps {
  /** Messages to display with their metadata */
  messages: MessageWithMetadata[];
  /** Current user ID for determining message alignment */
  currentUserId?: number | null;
  /** Callback when a message card is clicked */
  onMessageClick?: (messageId: string) => void;
}

/**
 * MessageList component
 * Renders a chronological list of messages in a conversation
 */
export function MessageList({ messages, currentUserId, onMessageClick }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
        <p className="text-sm sm:text-base px-4 text-center">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {messages.map(({ message, userName, status, replyingToSnippet }) => (
        <MessageCard
          key={message.id}
          message={message}
          userName={userName}
          status={status}
          replyingToSnippet={replyingToSnippet}
          isOwnMessage={currentUserId ? message.userId === currentUserId : false}
          onClick={onMessageClick ? () => onMessageClick(message.id) : undefined}
        />
      ))}
    </div>
  );
}
