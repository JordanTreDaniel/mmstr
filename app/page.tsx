'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Modal from '@/app/components/ui/Modal';
import { Header, PageContainer } from '@/app/components/layout';
import CreateConvoModal from '@/app/components/modals/CreateConvoModal';
import SignUpModal from '@/app/components/modals/SignUpModal';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getConversationById } from '@/app/actions/convos';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinConvoId = searchParams.get('join');
  const { currentUser, createUser, allUsers } = useCurrentUser();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [signUpIntent, setSignUpIntent] = useState<'create' | 'join' | null>(null);
  const [joiningConvo, setJoiningConvo] = useState<{ id: string; title: string; createdBy: number; } | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const handleNewConversation = () => {
    if (!currentUser) {
      setSignUpIntent('create');
      setIsSignUpModalOpen(true);
    } else {
      setIsCreateModalOpen(true);
    }
  };

  const handleConversationCreated = (convoId: string) => {
    console.log('Conversation created:', convoId);
    // TODO: Navigate to conversation page in future task
  };

  const handleConversationsClick = () => {
    router.push('/conversations');
  };

  // Track if component is mounted to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle conversation invitation
  useEffect(() => {
    async function handleJoinInvitation() {
      if (joinConvoId && !currentUser && isMounted) {
        // Fetch conversation details
        try {
          const convo = await getConversationById(joinConvoId);
          if (convo) {
            setJoiningConvo({ id: convo.id, title: convo.title, createdBy: convo.createdBy });
            setIsJoinModalOpen(true);
          }
        } catch (error) {
          console.error('Failed to fetch conversation:', error);
        }
      }
    }
    handleJoinInvitation();
  }, [joinConvoId, currentUser, isMounted]);

  const handleJoinDiscussion = async () => {
    if (!joiningConvo) return;

    // Check if user needs to sign up first
    if (!currentUser) {
      setSignUpIntent('join');
      setIsSignUpModalOpen(true);
      setIsJoinModalOpen(false);
      return;
    }

    setIsJoining(true);
    try {
      // Redirect to conversation (participation will be added automatically when they interact)
      router.push(`/conversations/${joiningConvo.id}`);
    } catch (error) {
      console.error('Failed to join conversation:', error);
      alert('Failed to join conversation. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleSignUp = async (name: string) => {
    try {
      await createUser(name);
      setIsSignUpModalOpen(false);
      // Note: We'll open the appropriate modal in the useEffect below once currentUser is updated
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  };

  // After sign up completes and currentUser is updated, open the appropriate modal
  useEffect(() => {
    // Ensure user has a valid ID before proceeding
    if (currentUser && currentUser.id && currentUser.id > 0 && signUpIntent) {
      // Small delay to ensure state is fully propagated
      setTimeout(() => {
        if (signUpIntent === 'create') {
          setIsCreateModalOpen(true);
        } else if (signUpIntent === 'join' && joiningConvo) {
          setIsJoinModalOpen(true);
        }
        setSignUpIntent(null);
      }, 100);
    }
  }, [currentUser, signUpIntent, joiningConvo]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
      <Header
        rightContent={
          isMounted && currentUser ? (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleConversationsClick}
            >
              Conversations
            </Button>
          ) : (
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          )
        }
      />
      <PageContainer maxWidth="5xl" padding="md">
        {/* Hero Section */}
        <section className="text-center mb-12 pt-8">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Make Me Say That&apos;s Right
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Turn-based discussions that enforce comprehension before rebuttal
          </p>
          
          {/* New Conversation Button */}
          <div className="flex justify-center">
            <Button 
              variant="primary" 
              size="lg"
              onClick={handleNewConversation}
              className="shadow-lg hover:shadow-xl"
            >
              Start Discussing
            </Button>
          </div>
        </section>

        {/* What is MMSTR Section */}
        <section className="mb-12">
          <Card variant="elevated" padding="lg" className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              What is MMSTR?
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              &quot;Make Me Say That&apos;s Right&quot; - a negotiation technique by Chris Voss 
              that supercharges communication
            </p>
          </Card>
        </section>

        {/* How It Works + Benefits - Side by side on wide, stacked on mobile */}
        <section className="mb-12 flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* How does MMSTR help? - First on mobile, right on desktop */}
          <div className="flex-1 lg:order-2">
            <Card variant="elevated" padding="lg" className="h-full">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                How does MMSTR help??
              </h2>
              <ul className="space-y-3 text-lg text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-3 flex-shrink-0 text-xl">✓</span>
                  <span>Ensures clarity (what you said vs what they heard)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-3 flex-shrink-0 text-xl">✓</span>
                  <span>Prevents looping arguments</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-3 flex-shrink-0 text-xl">✓</span>
                  <span>Blocks strawmanning and misinterpretations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-3 flex-shrink-0 text-xl">✓</span>
                  <span>Teaches active listening</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-3 flex-shrink-0 text-xl">✓</span>
                  <span>Makes people feel heard</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-3 flex-shrink-0 text-xl">✓</span>
                  <span>Forces proof of understanding</span>
                </li>
              </ul>
            </Card>
          </div>

          {/* How does it work - Second on mobile, left on desktop */}
          <div className="flex-1 lg:order-1">
            <Card variant="elevated" padding="lg" className="h-full">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                How does it work?
              </h2>
              <ol className="space-y-4 text-lg text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="font-bold text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0">1.</span>
                  <span>Someone makes a statement</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0">2.</span>
                  <span>You must restate it in your own words</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0">3.</span>
                  <span>They confirm you understood correctly</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0">4.</span>
                  <span>Only then can you respond</span>
                </li>
              </ol>
            </Card>
          </div>
        </section>
      </PageContainer>

      {/* Create Conversation Modal - only render if user is logged in */}
      {currentUser && currentUser.id && (
        <CreateConvoModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleConversationCreated}
        />
      )}

      {/* Join Conversation Modal */}
      <Modal
        isOpen={isJoinModalOpen}
        onClose={() => !isJoining && setIsJoinModalOpen(false)}
        title="Join Conversation"
        size="md"
        closeOnBackdropClick={!isJoining}
        closeOnEscape={!isJoining}
      >
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
              You&apos;ve been invited by <strong>{joiningConvo ? (allUsers.find(u => u.id === joiningConvo.createdBy)?.name || 'Unknown User') : ''}</strong> to join:
            </p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {joiningConvo?.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Join this MMSTR discussion where every response requires understanding before rebuttal.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsJoinModalOpen(false)}
              disabled={isJoining}
            >
              Not Now
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleJoinDiscussion}
              disabled={isJoining}
            >
              {isJoining ? 'Joining...' : 'Join Discussion'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Sign Up Modal */}
      <SignUpModal
        isOpen={isSignUpModalOpen}
        onClose={() => {
          setIsSignUpModalOpen(false);
          setSignUpIntent(null);
        }}
        onSignUp={handleSignUp}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
        <Header
          rightContent={
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          }
        />
        <PageContainer maxWidth="5xl" padding="md">
          <section className="text-center mb-12 pt-8">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Make Me Say That&apos;s Right
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Turn-based discussions that enforce comprehension before rebuttal
            </p>
          </section>
        </PageContainer>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
