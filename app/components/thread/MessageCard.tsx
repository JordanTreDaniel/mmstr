'use client';

import React from 'react';
import Card from '@/app/components/ui/Card';
import { BrainIcon } from '@/app/components/icons/BrainIcon';
import { SpeakingIcon } from '@/app/components/icons/SpeakingIcon';
import { CheckmarkIcon } from '@/app/components/icons/CheckmarkIcon';
import { GradeIcon } from '@/app/components/icons/GradeIcon';
import type { Message } from '@/types/entities';
import type { MessageStatus } from '@/lib/message-status';

export interface MessageCardProps {
  /** The message to display */
  message: Message;
  /** User name to display (from localStorage) */
  userName: string;
  /** Status icon to display (brain/speaking/checkmark/none) */
  status: MessageStatus;
  /** Reply-to message snippet if this is a reply */
  replyingToSnippet?: string | null;
  /** Is this message from the current user? */
  isOwnMessage?: boolean;
  /** Callback when card is clicked */
  onClick?: () => void;
}

/**
 * Formats timestamp to human-readable format
 */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // Format as date for older messages
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Renders the appropriate status icon based on message status
 */
function StatusIcon({ status }: { status: MessageStatus }) {
  const iconSize = 18;
  const baseClasses = 'absolute -top-2 -right-2 p-1 sm:p-1.5 rounded-full shadow-md';
  
  switch (status) {
    case 'brain':
      return (
        <div className={`${baseClasses} bg-purple-500 text-white`} title="Interpretation needed">
          <BrainIcon size={iconSize} />
        </div>
      );
    case 'speaking':
      return (
        <div className={`${baseClasses} bg-blue-500 text-white`} title="Can respond now">
          <SpeakingIcon size={iconSize} />
        </div>
      );
    case 'checkmark':
      return (
        <div className={`${baseClasses} bg-green-500 text-white`} title="Completed">
          <CheckmarkIcon size={iconSize} />
        </div>
      );
    case 'grade':
      return (
        <div className={`${baseClasses} bg-orange-500 text-white`} title="Grade interpretations">
          <GradeIcon size={iconSize} />
        </div>
      );
    case 'none':
    default:
      return null;
  }
}

/**
 * MessageCard component
 * Displays an individual message with user info, timestamp, reply indicator, and status icon
 */
export function MessageCard({
  message,
  userName,
  status,
  replyingToSnippet,
  isOwnMessage = false,
  onClick,
}: MessageCardProps) {
  return (
    <div className={`relative flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`${isOwnMessage ? 'max-w-[95%] sm:max-w-[85%] lg:max-w-[80%] ml-auto' : 'max-w-[95%] sm:max-w-[85%] lg:max-w-[80%] mr-auto'}`}>
      <Card
        variant="default"
        padding="md"
        hoverable
        clickable={!!onClick}
        onClick={onClick}
          className={`relative ${isOwnMessage ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
      >
        {/* Status icon in top-right corner */}
        {status !== 'none' && <StatusIcon status={status} />}
        
        {/* Reply-to indicator */}
        {replyingToSnippet && (
          <div className="mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="none" 
                className="mt-0.5 flex-shrink-0"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M4 8H12M4 8L7 5M4 8L7 11" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              <span className="italic line-clamp-2">
                {replyingToSnippet}
              </span>
            </div>
          </div>
        )}
        
        {/* Message header: user and timestamp */}
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
            {userName}
          </span>
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
            {formatTimestamp(message.createdAt)}
          </span>
        </div>
        
        {/* Message text */}
        <div className="text-sm sm:text-base text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
          {message.text}
        </div>
      </Card>
      </div>
    </div>
  );
}
