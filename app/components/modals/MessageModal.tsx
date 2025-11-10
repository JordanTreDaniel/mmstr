'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Modal from '@/app/components/ui/Modal';
import { getMessageById } from '@/app/actions/messages';
import { getInterpretationsByMessage } from '@/app/actions/interpretations';
import { getUserById } from '@/app/actions/users';
import { getConversationById } from '@/app/actions/convos';
import { requiresInterpretation } from '@/lib/character-validation';
import ViewOriginalStep from '@/app/components/message-modal/ViewOriginalStep';
import SubmitInterpretationStep from '@/app/components/message-modal/SubmitInterpretationStep';
import ReviewInterpretationStep from '@/app/components/message-modal/ReviewInterpretationStep';
import RejectedInterpretationStep from '@/app/components/message-modal/RejectedInterpretationStep';
import { getGradingByInterpretation } from '@/app/actions/interpretations';
import type { Message, Interpretation, InterpretationGrading, Convo } from '@/types/entities';

export interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string | null;
  currentUserId: number | null;
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
 * Returns: 'view' | 'submit' | 'review' | 'rejected'
 */
function determineViewState(
  message: Message | null,
  interpretations: Interpretation[],
  gradings: Map<string, InterpretationGrading>,
  currentUserId: number | null
): 'view' | 'submit' | 'review' | 'rejected' {
  if (!message || !currentUserId) return 'view';
  
  // If current user is the author, they review interpretations
  if (message.userId === currentUserId) {
    // Check if there are pending interpretations to review from other users
    const pendingInterpretations = interpretations.filter(interp => {
      if (interp.userId === currentUserId) return false; // Skip own interpretations
      const grading = gradings.get(interp.id);
      return grading && grading.status === 'pending';
    });
    return pendingInterpretations.length > 0 ? 'review' : 'view';
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
  
  // Get the latest interpretation
  const latestInterpretation = userInterpretations[0]; // Already sorted by attempt_number DESC
  const latestGrading = gradings.get(latestInterpretation.id);
  
  // Check if latest interpretation was rejected
  if (latestGrading && latestGrading.status === 'rejected') {
    return 'rejected';
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
  const [convo, setConvo] = useState<Convo | null>(null);
  const [interpretations, setInterpretations] = useState<Interpretation[]>([]);
  const [gradings, setGradings] = useState<Map<string, InterpretationGrading>>(new Map());
  const [authorName, setAuthorName] = useState<string>('Loading...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'view-original' | 'submit-interpretation'>('view-original');


  const loadMessageData = useCallback(async () => {
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
      
      // Load conversation (for maxAttempts)
      const convoData = await getConversationById(msg.convoId);
      setConvo(convoData);
      
      // Load author name
      const author = await getUserById(msg.userId);
      setAuthorName(author?.name || 'Unknown User');
      
      // Load all interpretations for this message
      const interps = await getInterpretationsByMessage(messageId);
      setInterpretations(interps);
      
      // Load gradings for all interpretations
      const gradingsMap = new Map<string, InterpretationGrading>();
      for (const interp of interps) {
        const grading = await getGradingByInterpretation(interp.id);
        if (grading) {
          gradingsMap.set(interp.id, grading);
        }
      }
      setGradings(gradingsMap);
    } catch (err) {
      console.error('Error loading message data:', err);
      setError('Failed to load message data');
    } finally {
      setLoading(false);
    }
  }, [messageId]);

  useEffect(() => {
    if (isOpen && messageId) {
      loadMessageData();
      // Reset to initial step when modal opens
      setCurrentStep('view-original');
    }
  }, [isOpen, messageId, loadMessageData]);

  // Determine the current view state
  const viewState = determineViewState(message, interpretations, gradings, currentUserId);
  
  // Get the first pending interpretation for review (if author)
  const pendingInterpretationForReview = message && currentUserId && message.userId === currentUserId
    ? interpretations.find(interp => {
        if (interp.userId === currentUserId) return false;
        const grading = gradings.get(interp.id);
        return grading && grading.status === 'pending';
      })
    : undefined;

  // Get the latest rejected interpretation (if interpreter)
  const rejectedInterpretation = message && currentUserId && message.userId !== currentUserId
    ? interpretations.find(interp => {
        if (interp.userId !== currentUserId) return false;
        const grading = gradings.get(interp.id);
        return grading && grading.status === 'rejected';
      })
    : undefined;

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

  // Handle Try Again (from rejected interpretation)
  const handleTryAgain = () => {
    setCurrentStep('submit-interpretation');
  };

  // Handle Dispute Submitted
  const handleDisputeSubmitted = async () => {
    // Reload message data to reflect dispute
    await loadMessageData();
    // Close modal after dispute submission
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
      <div className="space-y-4 sm:space-y-6">
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
            {viewState === 'rejected' && rejectedInterpretation && convo && currentStep !== 'submit-interpretation' ? (
              // Rejected Interpretation View
              <RejectedInterpretationStep
                message={message}
                interpretation={rejectedInterpretation}
                grading={gradings.get(rejectedInterpretation.id)!}
                maxAttempts={convo.maxAttempts}
                onTryAgain={handleTryAgain}
                onDisputeSubmitted={handleDisputeSubmitted}
              />
            ) : viewState === 'submit' && needsInterpretation && currentStep === 'view-original' ? (
              // Step 1: View Original Message (for interpreters)
              <ViewOriginalStep
                message={message}
                onStartInterpreting={handleStartInterpreting}
              />
            ) : (viewState === 'submit' || viewState === 'rejected') && currentStep === 'submit-interpretation' && currentUserId ? (
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
            ) : viewState === 'review' && pendingInterpretationForReview ? (
              // Step 3: Review Interpretation (for message author)
              <ReviewInterpretationStep
                message={message}
                interpretation={pendingInterpretationForReview}
                grading={gradings.get(pendingInterpretationForReview.id)!}
                onReviewComplete={async () => {
                  // Reload message data to reflect updated grading
                  await loadMessageData();
                  // Close modal after successful review
                  onClose();
                }}
              />
            ) : (
              // Default view - Show message details and interpretation history
              <div className="space-y-4 sm:space-y-6">
                {/* Original Message */}
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                    Original Message
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 sm:p-4">
                    <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
                      {message.text}
                    </p>
                  </div>
                </div>

                {/* Interpretations Section */}
                {interpretations.length > 0 && (
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2 sm:mb-3">
                      Interpretations
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {interpretations.map((interp) => {
                        const grading = gradings.get(interp.id);
                        const isCurrentUser = interp.userId === currentUserId;
                        const isAuthor = message.userId === currentUserId;
                        
                        return (
                          <div
                            key={interp.id}
                            className={`rounded-lg border p-4 ${
                              grading?.status === 'accepted'
                                ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                                : grading?.status === 'rejected'
                                ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                                : 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900'
                            }`}
                          >
                            {/* Interpretation Header */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  {isCurrentUser ? 'Your Interpretation' : `Interpretation ${interp.attemptNumber}`}
                                </span>
                                {grading && (
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                      grading.status === 'accepted'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : grading.status === 'rejected'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    }`}
                                  >
                                    {grading.status === 'accepted'
                                      ? '✓ Accepted'
                                      : grading.status === 'rejected'
                                      ? '✗ Rejected'
                                      : '⏳ Pending Review'}
                                  </span>
                                )}
                              </div>
                              {grading && (
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  {grading.similarityScore}% similarity
                                </span>
                              )}
                            </div>

                            {/* Interpretation Text */}
                            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words mb-2">
                              {interp.text}
                            </p>

                            {/* Feedback Notes (if any) */}
                            {grading?.notes && (
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  {isAuthor ? 'Your Feedback:' : 'Author Feedback:'}
                                </p>
                                <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                                  {grading.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Status Message for Users */}
                {currentUserId && (
                  <div>
                    {message.userId === currentUserId ? (
                      // Author view
                      interpretations.length === 0 ? (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            💬 Waiting for others to interpret your message before they can respond.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                          <p className="text-sm text-green-800 dark:text-green-200">
                            ✓ {interpretations.filter(i => gradings.get(i.id)?.status === 'accepted').length} interpretation(s) accepted. 
                            {interpretations.filter(i => gradings.get(i.id)?.status === 'pending').length > 0 &&
                              ` ${interpretations.filter(i => gradings.get(i.id)?.status === 'pending').length} pending review.`
                            }
                          </p>
                        </div>
                      )
                    ) : (
                      // Interpreter view
                      (() => {
                        const userInterps = interpretations.filter(i => i.userId === currentUserId);
                        const latestInterp = userInterps[0];
                        const latestGrading = latestInterp ? gradings.get(latestInterp.id) : null;
                        
                        if (!latestInterp) {
                          return null; // Should not reach here as 'submit' state would handle it
                        }
                        
                        if (latestGrading?.status === 'accepted') {
                          return (
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                              <p className="text-sm text-green-800 dark:text-green-200">
                                ✓ Your interpretation was accepted! You can now respond to this message.
                              </p>
                            </div>
                          );
                        } else if (latestGrading?.status === 'pending') {
                          return (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                ⏳ Your interpretation is pending review by the author.
                              </p>
                            </div>
                          );
                        }
                        
                        return null;
                      })()
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MessageModal;
