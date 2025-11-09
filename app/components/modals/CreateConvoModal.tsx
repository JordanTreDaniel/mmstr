'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/app/components/ui/Modal';
import Input from '@/app/components/ui/Input';
import Textarea from '@/app/components/ui/Textarea';
import Button from '@/app/components/ui/Button';
import { createConversation } from '@/app/actions/convos';
import { createMessage } from '@/app/actions/messages';
import { useCurrentUser } from '@/hooks/use-current-user';

export interface CreateConvoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (convoId: string) => void;
}

const CreateConvoModal: React.FC<CreateConvoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [title, setTitle] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(20);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [firstMessage, setFirstMessage] = useState('');
  const [titleError, setTitleError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate title
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }

    // Ensure we have a current user
    if (!currentUser) {
      setTitleError('User not initialized. Please refresh the page.');
      return;
    }
    
    setTitleError('');
    setIsSubmitting(true);

    try {
      // Create the conversation
      const convo = await createConversation(title.trim(), maxAttempts, maxParticipants);

      // Create the first message if provided (before joining as participant)
      // The conversation page will auto-join the creator when they navigate to it
      if (firstMessage.trim()) {
        await createMessage(firstMessage.trim(), currentUser.id, convo.id);
      }
      
      // Reset form
      setTitle('');
      setMaxParticipants(20);
      setMaxAttempts(3);
      setFirstMessage('');
      
      // Close modal
      onClose();
      
      // Call success callback (for any additional handling)
      onSuccess?.(convo.id);
      
      // Navigate to conversation page
      router.push(`/conversations/${convo.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      setTitleError('Failed to create conversation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setTitle('');
      setMaxParticipants(20);
      setMaxAttempts(3);
      setFirstMessage('');
      setTitleError('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Conversation"
      size="lg"
      closeOnBackdropClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Input */}
        <Input
          label="Conversation Title"
          placeholder="Enter a title for this conversation"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (titleError) setTitleError('');
          }}
          error={titleError}
          required
          disabled={isSubmitting}
        />

        {/* Max Participants Slider */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Max Participants: {maxParticipants}
          </label>
          <input
            type="range"
            min="2"
            max="20"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            disabled={isSubmitting}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>2</span>
            <span>20</span>
          </div>
        </div>

        {/* Max Interpretation Attempts Slider */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Max Interpretation Attempts: {maxAttempts}
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            disabled={isSubmitting}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>1</span>
            <span>5</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Number of times users can retry their interpretation before arbitration
          </p>
        </div>

        {/* Optional First Message */}
        <Textarea
          label="First Message (Optional)"
          placeholder="Start the conversation with an opening message..."
          value={firstMessage}
          onChange={(e) => setFirstMessage(e.target.value)}
          maxLength={280}
          showCharacterCount={true}
          helperText="Optional: Start the conversation with your first message (280 character limit)"
          rows={4}
          disabled={isSubmitting}
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Conversation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateConvoModal;
