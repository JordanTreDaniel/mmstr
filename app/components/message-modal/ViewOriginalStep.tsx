'use client';

import React from 'react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import type { Message } from '@/types/entities';

export interface ViewOriginalStepProps {
  message: Message;
  onStartInterpreting: () => void;
}

/**
 * ViewOriginalStep - Step 1 of the interpretation flow
 * Displays the original message and prompts the user to begin interpretation
 * This step is skipped if the message doesn't meet minimum requirements
 */
const ViewOriginalStep: React.FC<ViewOriginalStepProps> = ({
  message,
  onStartInterpreting,
}) => {
  return (
    <div className="space-y-6">
      {/* Explanation */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Before You Respond
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          To ensure understanding, please restate this message in your own words.
          The author will review your interpretation before you can reply.
        </p>
      </div>

      {/* Original Message Card */}
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

      {/* Call to Action */}
      <div className="text-center space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ready to demonstrate your understanding?
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={onStartInterpreting}
          className="min-w-[200px]"
        >
          Start Interpreting
        </Button>
      </div>
    </div>
  );
};

export default ViewOriginalStep;
