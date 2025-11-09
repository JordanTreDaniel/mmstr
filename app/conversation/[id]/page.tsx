'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header, PageContainer } from '@/app/components/layout';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import { useConversations } from '@/hooks/use-conversations';
import type { Convo } from '@/types/entities';

interface ConversationPageProps {
  params: {
    id: string;
  };
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const router = useRouter();
  const { getConversation } = useConversations();
  const [conversation, setConversation] = useState<Convo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversation();
  }, [params.id]);

  const loadConversation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const convo = await getConversation(params.id);
      if (convo) {
        setConversation(convo);
      } else {
        setError('Conversation not found');
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    router.push('/');
  };

  const handleShareClick = async () => {
    const url = window.location.href;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: conversation?.title || 'MMSTR Conversation',
          url: url,
        });
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
        <Header
          showBackButton
          onBackClick={handleBackClick}
        />
        <PageContainer maxWidth="4xl" padding="md">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600 dark:text-gray-400">Loading conversation...</div>
          </div>
        </PageContainer>
      </div>
    );
  }

  // Error state - 404 or other errors
  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
        <Header
          showBackButton
          onBackClick={handleBackClick}
        />
        <PageContainer maxWidth="4xl" padding="md">
          <Card variant="elevated" padding="lg" className="text-center max-w-md mx-auto mt-12">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error === 'Conversation not found' ? 'Conversation Not Found' : 'Error'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error === 'Conversation not found' 
                ? "The conversation you're looking for doesn't exist or has been deleted."
                : 'Failed to load conversation. Please try again.'}
            </p>
            <Button variant="primary" onClick={handleBackClick}>
              Go Back Home
            </Button>
          </Card>
        </PageContainer>
      </div>
    );
  }

  // Main conversation view
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
      <Header
        showBackButton
        onBackClick={handleBackClick}
        rightContent={
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleShareClick}
            className="flex items-center gap-2"
          >
            <span>🔗</span>
            <span>Share</span>
          </Button>
        }
      />
      <PageContainer maxWidth="4xl" padding="md">
        {/* Conversation Title */}
        <div className="py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {conversation.title}
          </h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <span>Max Attempts: {conversation.maxAttempts}</span>
            <span className="mx-2">•</span>
            <span>Participant Limit: {conversation.participantLimit}</span>
          </div>
        </div>

        {/* Placeholder for messages (to be implemented in task 5.2) */}
        <Card variant="elevated" padding="lg" className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Message list will be displayed here (Task 5.2)
          </p>
        </Card>
      </PageContainer>
    </div>
  );
}
