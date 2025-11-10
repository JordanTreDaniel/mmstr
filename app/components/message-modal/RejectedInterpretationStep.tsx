'use client';

import React, { useState } from 'react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Badge from '@/app/components/ui/Badge';
import Textarea from '@/app/components/ui/Textarea';
import { createGradingResponse } from '@/app/actions/interpretations';
import type { Message, Interpretation, InterpretationGrading, Arbitration } from '@/types/entities';

export interface RejectedInterpretationStepProps {
  message: Message;
  interpretation: Interpretation;
  grading: InterpretationGrading;
  maxAttempts: number;
  arbitration?: Arbitration | null; // Optional arbitration result
  onTryAgain: () => void;
  onDisputeSubmitted: () => void;
}

/**
 * RejectedInterpretationStep - Shows rejection feedback to interpreter
 * Displays author's feedback, attempt count, and options to try again or dispute
 */
const RejectedInterpretationStep: React.FC<RejectedInterpretationStepProps> = ({
  message,
  interpretation,
  grading,
  maxAttempts,
  arbitration,
  onTryAgain,
  onDisputeSubmitted,
}) => {
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeText, setDisputeText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingAttempts = maxAttempts - interpretation.attemptNumber;
  const hasAttemptsRemaining = remainingAttempts > 0;
  const hasArbitration = !!arbitration;

  // Handle dispute submission
  const handleSubmitDispute = async () => {
    if (!disputeText.trim()) {
      setError('Please explain why you believe this interpretation is accurate.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createGradingResponse(grading.id, disputeText);
      onDisputeSubmitted();
    } catch (err) {
      console.error('Error submitting dispute:', err);
      setError('Failed to submit dispute. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className={`text-lg font-semibold mb-2 ${hasArbitration ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
          {hasArbitration ? 'Arbitration Decision' : 'Interpretation Rejected'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Attempt <span className="font-semibold">{interpretation.attemptNumber}</span> of {maxAttempts}
          {hasAttemptsRemaining && !hasArbitration && (
            <span className="ml-2 text-green-600 dark:text-green-400">
              ({remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining)
            </span>
          )}
        </p>
      </div>

      {/* Rejection/Arbitration Status Badge */}
      <div className="flex justify-center">
        {hasArbitration ? (
          <Badge variant={arbitration.result === 'accept' ? 'success' : 'error'} size="lg">
            {arbitration.result === 'accept' ? '✓ Accepted by Arbitration' : '✗ Rejected by Arbitration'}
          </Badge>
        ) : hasAttemptsRemaining ? (
          <Badge variant="warning" size="lg">
            ⚠️ Can Try Again
          </Badge>
        ) : (
          <Badge variant="error" size="lg">
            ❌ Max Attempts Reached
          </Badge>
        )}
      </div>

      {/* Arbitration Explanation */}
      {hasArbitration && (
        <Card variant="elevated" padding="lg">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-purple-700 dark:text-purple-400 uppercase tracking-wide">
              ⚖️ Arbitration Explanation
            </h4>
          </div>
          <div className={`rounded-lg p-4 ${arbitration.result === 'accept' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <p className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${arbitration.result === 'accept' ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
              {arbitration.explanation}
            </p>
          </div>
        </Card>
      )}

      {/* Similarity Score */}
      <Card variant="elevated" padding="md">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              AI Similarity Score
            </h4>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {grading.similarityScore}%
            </span>
          </div>
          <div className="text-sm text-red-600 dark:text-red-400">
            {grading.similarityScore >= 60 ? 'Close, but needs improvement' : 'Significant differences detected'}
          </div>
        </div>
      </Card>

      {/* Original Message Reference */}
      <Card variant="elevated" padding="lg">
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Original Message
          </h4>
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
            {message.text}
          </p>
        </div>
      </Card>

      {/* Your Interpretation */}
      <Card variant="elevated" padding="lg">
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Your Interpretation
          </h4>
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
            {interpretation.text}
          </p>
        </div>
      </Card>

      {/* Author's Feedback */}
      {grading.notes && (
        <Card variant="elevated" padding="lg">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-red-700 dark:text-red-400 uppercase tracking-wide">
              Author's Feedback
            </h4>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <p className="text-sm text-red-900 dark:text-red-100 whitespace-pre-wrap break-words leading-relaxed">
              {grading.notes}
            </p>
          </div>
        </Card>
      )}

      {/* Action Buttons or Dispute Form */}
      {hasArbitration ? (
        <div className="space-y-4">
          {/* Arbitration Complete - Show final status */}
          <Card variant="elevated" padding="md">
            <div className={`rounded-lg p-4 ${arbitration.result === 'accept' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
              <p className={`text-sm ${arbitration.result === 'accept' ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'}`}>
                {arbitration.result === 'accept' ? (
                  <>
                    ✓ <strong>Arbitration Complete:</strong> Your interpretation has been accepted. You can now respond to this message.
                  </>
                ) : (
                  <>
                    ℹ️ <strong>Arbitration Complete:</strong> The arbitration has concluded. The original rejection stands.
                  </>
                )}
              </p>
            </div>
          </Card>
        </div>
      ) : !showDisputeForm ? (
        <div className="space-y-4">
          {/* Action buttons */}
          {hasAttemptsRemaining ? (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowDisputeForm(true)}
                className="min-w-[150px]"
              >
                Dispute Rejection
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={onTryAgain}
                className="min-w-[150px]"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowDisputeForm(true)}
                className="min-w-[200px]"
              >
                Dispute Rejection
              </Button>
            </div>
          )}

          {/* Info Box */}
          <Card variant="elevated" padding="md">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {hasAttemptsRemaining ? (
                  <>
                    💡 <strong>Tip:</strong> Review the feedback and try rephrasing your interpretation. 
                    If you believe your interpretation was accurate, you can dispute the rejection.
                  </>
                ) : (
                  <>
                    💡 <strong>Note:</strong> You've reached the maximum number of attempts. 
                    If you believe your interpretation was accurate, you can submit a dispute for arbitration.
                  </>
                )}
              </p>
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Dispute Form */}
          <Card variant="elevated" padding="lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
              Dispute Rejection
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Explain why you believe your interpretation accurately captured the original message's meaning.
            </p>
            <Textarea
              label="Your Dispute"
              placeholder="Explain why your interpretation is accurate..."
              value={disputeText}
              onChange={(e) => setDisputeText(e.target.value)}
              rows={6}
              resize="vertical"
              className="font-sans"
            />
          </Card>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Dispute Action Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setShowDisputeForm(false);
                setDisputeText('');
                setError(null);
              }}
              disabled={isSubmitting}
              className="min-w-[150px]"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmitDispute}
              disabled={isSubmitting || !disputeText.trim()}
              className="min-w-[150px]"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
            </Button>
          </div>

          {/* Dispute Info */}
          <Card variant="elevated" padding="md">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚖️ <strong>Arbitration:</strong> Your dispute will trigger AI arbitration. 
                The AI will review both the original message and your interpretation to make a final decision.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RejectedInterpretationStep;
