'use client';

import React, { useEffect, useState } from 'react';
import Modal from '@/app/components/ui/Modal';
import { getMessageById } from '@/app/actions/messages';
import { getInterpretationsByMessage } from '@/app/actions/interpretations';
import { getUserById } from '@/app/actions/users';
import { requiresInterpretation } from '@/lib/character-validation';
import ViewOriginalStep from '@/app/components/message-modal/ViewOriginalStep';
import SubmitInterpretationStep from '@/app/components/message-modal/SubmitInterpretationStep';
import type { Message, Interpretation } from '@/types/entities';

export interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string | null;
  currentUserId: string | null;
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
 * Determines the view state for the modal based on the current state of interpretations
 * Returns: 'view' | 'submit' | 'review'
 */
function determineViewState(
  message: Message | null,
  interpretations: Interpretation[],
  currentUserId: string | null
): 'view' | 'submit' | 'review' {
  if (!message || !currentUserId) return 'view';
  
  // If current user is the author, they review interpretations
  if (message.userId === currentUserId) {
    // Check if there are pending interpretations to review
    const hasPendingInterpretations = interpretations.some(
      interp => interp.userId !== currentUserId
    );
    return hasPendingInterpretations ? 'review' : 'view';
  }
  
  // If current user is not the author
  // Check if they have already submitted an interpretation
  const userInterpretations = interpretations.filter(
    interp => interp.userId === currentUserId
  );
  
  if (userInterpretations.length === 0) {
    // No interpretations yet - they need to submit one
    return 'submit';
  }
  
  // They've submitted interpretations - just view mode for now
  return 'view';
}

const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  messageId,
  currentUserId,
}) => {
  const [message, setMessage] = useState<Message | null>(null);
  const [interpretations, setInterpretations] = useState<Interpretation[]>([]);
  const [authorName, setAuthorName] = useState<string>('Loading...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'view-original' | 'submit-interpretation'>('view-original');

  useEffect(() => {
    if (isOpen && messageId) {
      loadMessageData();
      // Reset to initial step when modal opens
      setCurrentStep('view-original');
    }
  }, [isOpen, messageId]);

  const loadMessageData = async () => {
    if (!messageId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Load message
      const msg = await getMessageById(messageId);
      if (!msg) {
        setError('Message not found');
        return;
      }
      setMessage(msg);
      
      // Load author name
      const author = await getUserById(msg.userId);
      setAuthorName(author?.name || 'Unknown User');
      
      // Load all interpretations for this message
      const interps = await getInterpretationsByMessage(messageId);
      setInterpretations(interps);
    } catch (err) {
      console.error('Error loading message data:', err);
      setError('Failed to load message data');
    } finally {
      setLoading(false);
    }
  };

  // Determine the current view state
  const viewState = determineViewState(message, interpretations, currentUserId);

  // Check if message requires interpretation
  const needsInterpretation = message ? requiresInterpretation(message.text) : false;

  // Handle starting interpretation
  const handleStartInterpreting = () => {
    setCurrentStep('submit-interpretation');
  };

  // Handle interpretation submission
  const handleInterpretationSubmitted = async () => {
    // Reload message data to get updated interpretations
    await loadMessageData();
    // Reset to view mode or show success message
    // For now, just close the modal
    onClose();
  };

  // Create modal title with author name and timestamp
  const modalTitle = message
    ? `${authorName} • ${formatTimestamp(message.createdAt)}`
    : 'Message Details';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="lg"
      closeOnBackdropClick={true}
      closeOnEscape={true}
    >
      <div className="space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="text-gray-600 dark:text-gray-400">Loading message...</div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-8">
            <div className="text-red-600 dark:text-red-400">{error}</div>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && message && (
          <div>
            {/* Conditional rendering based on view state and step */}
            {viewState === 'submit' && needsInterpretation && currentStep === 'view-original' ? (
              // Step 1: View Original Message (for interpreters)
              <ViewOriginalStep
                message={message}
                onStartInterpreting={handleStartInterpreting}
              />
            ) : viewState === 'submit' && currentStep === 'submit-interpretation' && currentUserId ? (
              // Step 2: Submit Interpretation Form
              <SubmitInterpretationStep
                message={message}
                currentUserId={currentUserId}
                attemptNumber={interpretations.filter(i => i.userId === currentUserId).length + 1}
                onInterpretationSubmitted={handleInterpretationSubmitted}
              />
            ) : viewState === 'submit' && !needsInterpretation ? (
              // Message doesn't require interpretation (too short)
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                    {message.text}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ This message is too short to require interpretation. You can respond directly.
                  </p>
                </div>
              </div>
            ) : (
              // Default view for authors and others
              <div>
                {/* Original Message */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Original Message
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                      {message.text}
                    </p>
                  </div>
                </div>

                {/* View State Information (Temporary - for debugging) */}
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 border-t border-gray-200 dark:border-gray-700">
                  <p>Current View State: <strong>{viewState}</strong></p>
                  <p className="mt-1">Interpretations: {interpretations.length}</p>
                </div>

                {/* TODO: Step views will be implemented in future tasks (6.3-6.7) */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 Review and other step views will be implemented in upcoming tasks.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MessageModal;
