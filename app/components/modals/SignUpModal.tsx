'use client';

import React, { useState } from 'react';
import Modal from '@/app/components/ui/Modal';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';

export interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUp: (name: string) => Promise<void>;
  title?: string;
  description?: string;
}

/**
 * SignUpModal component
 * Modal for collecting user's name when they first create/join a conversation
 */
export default function SignUpModal({ 
  isOpen, 
  onClose, 
  onSignUp,
  title = "Create Your Account",
  description = "Choose a name to get started with MMSTR discussions"
}: SignUpModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    
    // Validate name length
    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (trimmedName.length > 50) {
      setError('Name must not exceed 50 characters');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSignUp(trimmedName);
      // Reset form on success
      setName('');
      setError(null);
    } catch (err) {
      console.error('Sign up error:', err);
      setError('Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setError(null);
    onClose();
  };

  const isValid = name.trim().length >= 2 && name.trim().length <= 50;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      size="md"
      closeOnBackdropClick={false}
      closeOnEscape={false}
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          {description}
        </p>

        <Input
          label="Your Name"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          autoFocus
          error={error || undefined}
          disabled={isSubmitting}
        />

        <div className="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

