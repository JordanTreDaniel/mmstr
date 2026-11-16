'use client';

import React, { useState } from 'react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import {
  recoverUngradedInterpretations,
  discardUngradedInterpretations,
} from '@/app/actions/interpretations';
import type { Interpretation, Message } from '@/types/entities';

export interface UngradedInterpretationStepProps {
  message: Message;
  interpretation: Interpretation;
  currentUserId: number;
  /** Called after the attempt is graded or discarded so the modal can reload */
  onResolved: () => void | Promise<void>;
}

/**
 * UngradedInterpretationStep - recovery view for an attempt whose AI grading
 * call failed (e.g. provider outage, retired model).
 *
 * Previously this state was a dead end: the interpretation row existed, had no
 * grading, and the modal rendered read-only "view" mode - no feedback, no
 * retry, no way to respond. Now the user can either grade it or discard it.
 */
const UngradedInterpretationStep: React.FC<UngradedInterpretationStepProps> = ({
  message,
  interpretation,
  currentUserId,
  onResolved,
}) => {
  const [busy, setBusy] = useState<'grade' | 'discard' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGrade = async () => {
    setBusy('grade');
    setError(null);
    try {
      await recoverUngradedInterpretations(message.id, currentUserId);
      await onResolved();
    } catch (err) {
      console.error('Error grading interpretation:', err);
      setError(
        'Grading failed again. The AI provider may be unavailable — try once more, or discard this attempt.'
      );
    } finally {
      setBusy(null);
    }
  };

  const handleDiscard = async () => {
    setBusy('discard');
    setError(null);
    try {
      await discardUngradedInterpretations(message.id, currentUserId);
      await onResolved();
    } catch (err) {
      console.error('Error discarding interpretation:', err);
      setError('Could not discard this attempt. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Attempt Not Graded
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your interpretation was saved, but the AI grading step did not complete.
          This attempt does not count against your limit.
        </p>
      </div>

      <Card variant="elevated" padding="lg">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
          Your Interpretation
        </h4>
        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
          {interpretation.text}
        </p>
      </Card>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={handleGrade}
          disabled={busy !== null}
          className="min-w-[200px]"
        >
          {busy === 'grade' ? 'Grading...' : 'Grade This Attempt'}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={handleDiscard}
          disabled={busy !== null}
          className="min-w-[200px]"
        >
          {busy === 'discard' ? 'Discarding...' : 'Discard and Start Over'}
        </Button>
      </div>
    </div>
  );
};

export default UngradedInterpretationStep;
