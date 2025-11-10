'use client';

import React from 'react';
import Card from '@/app/components/ui/Card';
import Badge from '@/app/components/ui/Badge';
import type { Message, Interpretation, InterpretationGrading, InterpretationGradingResponse, Arbitration } from '@/types/entities';

export interface ArbitrationStepProps {
  message: Message;
  interpretation: Interpretation;
  grading: InterpretationGrading;
  arbitration: Arbitration;
  gradingResponse?: InterpretationGradingResponse | null;
}

/**
 * ArbitrationStep - Displays the results of an AI arbitration
 * Shows the final decision, explanation, and all relevant context
 * This is a read-only view of the arbitration outcome
 */
const ArbitrationStep: React.FC<ArbitrationStepProps> = ({
  message,
  interpretation,
  grading,
  arbitration,
  gradingResponse,
}) => {
  const isAccepted = arbitration.result === 'accept';
  const wasDisputed = !!gradingResponse;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-2">
          ⚖️ Arbitration Decision
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {wasDisputed 
            ? 'AI-mediated resolution of disputed interpretation'
            : 'Automatic arbitration after maximum attempts reached'}
        </p>
      </div>

      {/* Decision Badge */}
      <div className="flex justify-center">
        <Badge variant={isAccepted ? 'success' : 'error'} size="lg">
          {isAccepted ? '✓ Interpretation Accepted' : '✗ Interpretation Rejected'}
        </Badge>
      </div>

      {/* Arbitration Explanation */}
      <Card variant="elevated" padding="lg">
        <div className="mb-3">
          <h4 className="text-sm font-medium text-purple-700 dark:text-purple-400 uppercase tracking-wide">
            ⚖️ Arbitration Explanation
          </h4>
        </div>
        <div className={`rounded-lg p-4 ${isAccepted ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <p className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${isAccepted ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
            {arbitration.explanation}
          </p>
        </div>
      </Card>

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
          <div className={`text-sm font-medium ${isAccepted ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isAccepted ? 'Sufficient understanding' : 'Understanding gap detected'}
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

      {/* Interpretation */}
      <Card variant="elevated" padding="lg">
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Interpretation (Attempt {interpretation.attemptNumber})
            </h4>
            {isAccepted && (
              <Badge variant="success" size="sm">
                Accepted by Arbitration
              </Badge>
            )}
          </div>
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
            {interpretation.text}
          </p>
        </div>
      </Card>

      {/* Author's Rejection Feedback (if provided) */}
      {grading.notes && (
        <Card variant="elevated" padding="lg">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-red-700 dark:text-red-400 uppercase tracking-wide">
              Author's Rejection Feedback
            </h4>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <p className="text-sm text-red-900 dark:text-red-100 whitespace-pre-wrap break-words leading-relaxed">
              {grading.notes}
            </p>
          </div>
        </Card>
      )}

      {/* Dispute Reason (if this was a disputed arbitration) */}
      {gradingResponse && (
        <Card variant="elevated" padding="lg">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide">
              Interpreter's Dispute
            </h4>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap break-words leading-relaxed">
              {gradingResponse.text}
            </p>
          </div>
        </Card>
      )}

      {/* Final Status Info Box */}
      <Card variant="elevated" padding="md">
        <div className={`rounded-lg p-4 ${isAccepted ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-900'}`}>
          <p className={`text-sm ${isAccepted ? 'text-green-800 dark:text-green-200' : 'text-gray-800 dark:text-gray-200'}`}>
            {isAccepted ? (
              <>
                ✓ <strong>Decision Final:</strong> The interpretation has been accepted by AI arbitration. 
                The interpreter can now respond to this message.
              </>
            ) : (
              <>
                ℹ️ <strong>Decision Final:</strong> The interpretation has been rejected by AI arbitration. 
                The original author's rejection stands.
              </>
            )}
          </p>
        </div>
      </Card>

      {/* Arbitration Process Info */}
      <Card variant="elevated" padding="md">
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            ⚖️ <strong>About Arbitration:</strong> This decision was made by AI analysis comparing the original message, 
            the interpretation, and all feedback provided. Arbitration decisions are final and cannot be appealed.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ArbitrationStep;
