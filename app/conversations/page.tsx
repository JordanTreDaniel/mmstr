'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header, PageContainer } from '@/app/components/layout';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import CreateConvoModal from '@/app/components/modals/CreateConvoModal';
import { useConversations } from '@/hooks/use-conversations';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { Convo } from '@/types/entities';

export default function ConversationsPage() {
  const router = useRouter();
  const { conversations, loading, refresh } = useConversations();
  const { currentUser } = useCurrentUser();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Poll for new conversations every 10 seconds
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      // Only poll if document is visible (user is actively viewing the page)
      if (document.visibilityState === 'visible') {
        refresh();
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [currentUser, refresh]);

  const handleBackClick = () => {
    router.push('/');
  };

  const handleConversationClick = (convoId: string) => {
    router.push(`/conversations/${convoId}`);
  };

  const handleNewConversation = () => {
    setIsCreateModalOpen(true);
  };

  const handleConversationCreated = (convoId: string) => {
    router.push(`/conversations/${convoId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
      <Header
        showBackButton
        onBackClick={handleBackClick}
        rightContent={
          <Button 
            variant="primary" 
            size="sm"
            onClick={handleNewConversation}
          >
            New Conversation
          </Button>
        }
      />
      <PageContainer maxWidth="4xl" padding="md">
        <div className="py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Conversations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentUser ? `Logged in as ${currentUser.name}` : 'Not logged in'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600 dark:text-gray-400">Loading conversations...</div>
          </div>
        ) : conversations.length === 0 ? (
          <Card variant="elevated" padding="lg" className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No conversations yet. Start your first discussion!
            </p>
            <Button variant="primary" onClick={handleNewConversation}>
              Create Conversation
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {conversations.map((convo: Convo) => (
              <Card
                key={convo.id}
                variant="elevated"
                padding="lg"
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleConversationClick(convo.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {convo.title}
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <span>Max Attempts: {convo.maxAttempts}</span>
                      <span className="mx-2">•</span>
                      <span>Participants: {convo.participantLimit}</span>
                      <span className="mx-2">•</span>
                      <span>
                        Created: {new Date(convo.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConversationClick(convo.id);
                      }}
                    >
                      View →
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>

      <CreateConvoModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleConversationCreated}
      />
    </div>
  );
}

