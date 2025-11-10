'use client';

import React, { useState } from 'react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Textarea from '@/app/components/ui/Textarea';
import { createInterpretation } from '@/app/actions/interpretations';
import { MESSAGE_MAX_CHARS, validateMessage } from '@/lib/character-validation';
import type { Message } from '@/types/entities';

export interface SubmitInterpretationStepProps {
  message: Message;
  currentUserId: string;
  attemptNumber: number;
  onInterpretationSubmitted: () => void;
}

/**
 * SubmitInterpretationStep - Step 2 of the interpretation flow
 * Allows user to write and submit their interpretation of the message
 * Hides the original message by default, with toggle to view it
 * Tracks how many times the user viewed the original message
 */
const SubmitInterpretationStep: React.FC<SubmitInterpretationStepProps> = ({
  message,
  currentUserId,
  attemptNumber,
  onInterpretationSubmitted,
}) => {
  const [interpretationText, setInterpretationText] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle toggling the original message view
  const handleToggleOriginal = () => {
    if (!showOriginal) {
      // User is viewing the original - increment count
      setViewCount(prev => prev + 1);
    }
    setShowOriginal(!showOriginal);
  };

  // Handle interpretation submission
  const handleSubmit = async () => {
    // Validate interpretation
    const validation = validateMessage(interpretationText);
    if (!validation.isValid) {
      setError(validation.errorMessage || 'Invalid interpretation');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create interpretation record
      await createInterpretation(
        message.id,
        currentUserId,
        interpretationText,
        attemptNumber
      );

      // Notify parent component
      onInterpretationSubmitted();
    } catch (err) {
      console.error('Error submitting interpretation:', err);
      setError('Failed to submit interpretation. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Check if submit should be enabled
  const validation = validateMessage(interpretationText);
  const canSubmit = validation.isValid && !isSubmitting;

  return (
    <div className="space-y-6">
      {/* Header with attempt number */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Write Your Interpretation
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Attempt <span className="font-semibold">{attemptNumber}</span> of 3
        </p>
      </div>

      {/* Tip text */}
      <Card variant="elevated" padding="md">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Tip:</strong> Use different words but convey the same meaning. 
            Show you understand the message by restating it in your own way.
          </p>
        </div>
      </Card>

      {/* Toggle button to view original */}
      <div className="text-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleOriginal}
          className="min-w-[180px]"
        >
          {showOriginal ? '✕ Hide Original' : '👁 View Original'}
        </Button>
      </div>

      {/* Original message (conditionally shown) */}
      {showOriginal && (
        <Card variant="elevated" padding="lg">
          <div className="mb-2">
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
      )}

      {/* Interpretation textarea (only shown when original is hidden) */}
      {!showOriginal && (
        <div>
          <Textarea
            label="Your Interpretation"
            placeholder="Restate the message in your own words..."
            value={interpretationText}
            onChange={(e) => setInterpretationText(e.target.value)}
            maxLength={MESSAGE_MAX_CHARS}
            showCharacterCount={true}
            rows={6}
            resize="none"
            className="font-sans"
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Submit button */}
      <div className="text-center space-y-3">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="min-w-[200px]"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Interpretation'}
        </Button>

        {!validation.isValid && interpretationText.length > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {validation.errorMessage}
          </p>
        )}
      </div>

      {/* View count at bottom */}
      <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You viewed the original message <span className="font-semibold">{viewCount}</span> time{viewCount !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};

export default SubmitInterpretationStep;
