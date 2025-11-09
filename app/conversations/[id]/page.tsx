'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConversations } from '@/hooks/use-conversations';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Header, PageContainer } from '@/app/components/layout';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import ConversationWelcomeModal from '@/app/components/modals/ConversationWelcomeModal';
import type { Convo } from '@/types/entities';

interface ConversationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const [id, setId] = useState<string | null>(null);
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { 
    getConversation,
    joinConversation,
    checkParticipation 
  } = useConversations();
  
  const [convo, setConvo] = useState<Convo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isParticipant, setIsParticipant] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isNewConvo, setIsNewConvo] = useState(false);

  // Unwrap params promise (Next.js 15+)
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    
    const loadConversation = async () => {
      setLoading(true);
      try {
        // Load conversation details
        const loadedConvo = await getConversation(id);
        if (!loadedConvo) {
          // Conversation not found
          router.push('/');
          return;
        }
        
        setConvo(loadedConvo);

        // Check if user is a participant
        if (currentUser) {
          const participating = await checkParticipation(currentUser.id, id);
          setIsParticipant(participating);
          
          // If not participating, auto-join
          if (!participating) {
            await joinConversation(currentUser.id, id);
            setIsParticipant(true);
            setIsNewConvo(true);
            setShowWelcome(true);
          }
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentUser?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
        <Header />
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading conversation...</p>
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (!convo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
        <Header />
        <PageContainer>
          <Card variant="elevated" padding="lg" className="max-w-2xl mx-auto mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Conversation Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The conversation you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button onClick={() => router.push('/')}>
              Back to Home
            </Button>
          </Card>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
      <Header />
      <PageContainer>
        <Card variant="elevated" padding="lg" className="max-w-4xl mx-auto mt-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {convo.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Created {new Date(convo.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Conversation Settings
              </h3>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Max Participants: {convo.participantLimit}</li>
                <li>Max Interpretation Attempts: {convo.maxAttempts}</li>
              </ul>
            </div>

            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                Message thread will appear here
              </p>
            </div>
          </div>
        </Card>
      </PageContainer>

      {/* Welcome Modal */}
      {showWelcome && id && (
        <ConversationWelcomeModal
          isOpen={showWelcome}
          onClose={() => setShowWelcome(false)}
          conversationId={id}
          conversationTitle={convo.title}
          isCreator={isNewConvo}
        />
      )}
    </div>
  );
}
