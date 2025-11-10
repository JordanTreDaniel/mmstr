'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header, PageContainer } from '@/app/components/layout';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import { MessageList, MessageComposer } from '@/app/components/thread';
import MessageModal from '@/app/components/modals/MessageModal';
import { useConversations } from '@/hooks/use-conversations';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getConversationMessages } from '@/app/actions/messages';
import { getInterpretationsByMessage, getGradingByInterpretation } from '@/app/actions/interpretations';
import { getMessageStatus } from '@/lib/message-status';
import { requiresInterpretation } from '@/lib/character-validation';
import type { Convo, Message } from '@/types/entities';
import type { MessageWithMetadata } from '@/app/components/thread';

interface ConversationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { getConversation } = useConversations();
  const { currentUserId, getUserById, loading: userLoading } = useCurrentUser();
  const [conversation, setConversation] = useState<Convo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesWithMetadata, setMessagesWithMetadata] = useState<MessageWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Redirect to landing page with invitation if user is not authenticated
  useEffect(() => {
    if (!userLoading && !currentUserId) {
      router.push(`/?join=${id}`);
    }
  }, [currentUserId, userLoading, id, router]);

  useEffect(() => {
    if (currentUserId) {
      loadConversation();
    }
  }, [id, currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      loadMessages();
    }
  }, [id, currentUserId]);

  const loadConversation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const convo = await getConversation(id);
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

  const loadMessages = async () => {
    try {
      const msgs = await getConversationMessages(id);
      setMessages(msgs);
      
      // Build metadata for each message with full interpretation status
      const withMetadata: MessageWithMetadata[] = await Promise.all(
        msgs.map(async (msg) => {
          const user = getUserById(msg.userId);
          const userName = user?.name || 'Unknown User';
          
          const isOwnMessage = msg.userId === currentUserId;
          const needsInterpretation = requiresInterpretation(msg.text);
          
          // Check if current user has an interpretation for this message
          let hasInterpretation = false;
          let interpretationStatus: 'pending' | 'accepted' | 'rejected' | undefined = undefined;
          
          if (currentUserId && !isOwnMessage && needsInterpretation) {
            const interpretations = await getInterpretationsByMessage(msg.id, currentUserId);
            if (interpretations.length > 0) {
              hasInterpretation = true;
              // Get the latest interpretation's grading status
              const latestInterpretation = interpretations[0];
              const grading = await getGradingByInterpretation(latestInterpretation.id);
              if (grading) {
                interpretationStatus = grading.status;
              }
            }
          }
          
          // Check if user has already responded to this message
          const hasResponded = msgs.some(m => 
            m.replyingToMessageId === msg.id && m.userId === currentUserId
          );
          
          const status = getMessageStatus({
            isOwnMessage,
            requiresInterpretation: needsInterpretation,
            hasInterpretation,
            interpretationStatus,
            hasResponded,
          });
          
          // Get reply-to snippet if applicable
          let replyingToSnippet: string | null = null;
          if (msg.replyingToMessageId) {
            const replyToMsg = msgs.find(m => m.id === msg.replyingToMessageId);
            if (replyToMsg) {
              replyingToSnippet = replyToMsg.text.length > 50
                ? `${replyToMsg.text.substring(0, 50)}...`
                : replyToMsg.text;
            }
          }
          
          return {
            message: msg,
            userName,
            status,
            replyingToSnippet,
          };
        })
      );
      
      setMessagesWithMetadata(withMetadata);
    } catch (err) {
      console.error('Error loading messages:', err);
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

        {/* Message List */}
        <Card variant="elevated" padding="lg">
          <MessageList 
            messages={messagesWithMetadata}
            onMessageClick={(messageId) => {
              setSelectedMessageId(messageId);
              setIsModalOpen(true);
            }}
          />
        </Card>

        {/* Message Composer */}
        <div className="mt-4">
          <Card variant="elevated" padding="none">
            <MessageComposer
              convoId={id}
              messages={messages}
              onMessageSent={loadMessages}
            />
          </Card>
        </div>
      </PageContainer>

      {/* Message Modal */}
      <MessageModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMessageId(null);
          // Refresh messages to update status icons after modal closes
          loadMessages();
        }}
        messageId={selectedMessageId}
        currentUserId={currentUserId}
      />
    </div>
  );
}
