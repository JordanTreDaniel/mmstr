'use client';

import React, { useState } from 'react';
import Modal from '@/app/components/ui/Modal';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';

export interface ConversationWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  conversationTitle: string;
  isCreator?: boolean;
}

const ConversationWelcomeModal: React.FC<ConversationWelcomeModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  conversationTitle,
  isCreator = false,
}) => {
  const [copied, setCopied] = useState(false);
  
  // Generate shareable URL
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/conversations/${conversationId}`
    : '';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreator ? "🎉 Conversation Created!" : "Welcome to the Conversation"}
      size="lg"
      closeOnBackdropClick={true}
      closeOnEscape={true}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Success Message */}
        <div className="text-center">
          <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">✨</div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {conversationTitle}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {isCreator 
              ? "Your conversation is ready! Share the link below to invite others."
              : "You've joined this conversation. Share the link to invite others."}
          </p>
        </div>

        {/* Shareable URL */}
        <div className="space-y-2 sm:space-y-3">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
            Shareable Link
          </label>
          <div className="flex gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="flex-1"
            />
            <Button
              onClick={handleCopyUrl}
              variant={copied ? "primary" : "secondary"}
              className="whitespace-nowrap"
            >
              {copied ? (
                <>
                  <svg 
                    className="w-4 h-4 mr-2" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg 
                    className="w-4 h-4 mr-2" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
                    />
                  </svg>
                  Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Anyone with this link can join the conversation
          </p>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center">
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            How MMSTR Works
          </h4>
          <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-5 sm:ml-7">
            <li>• Before responding to a message, you must interpret it</li>
            <li>• The author grades your interpretation for accuracy</li>
            <li>• Only after approval can you post your response</li>
            <li>• This ensures everyone truly understands each other</li>
          </ul>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={onClose}
            variant="primary"
          >
            Start Discussion
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConversationWelcomeModal;
