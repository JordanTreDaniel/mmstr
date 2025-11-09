'use client';

import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import { Header, PageContainer } from '@/app/components/layout';

export default function Home() {
  const handleNewConversation = () => {
    // TODO: Navigate to create conversation flow (will be implemented in later task)
    console.log('New conversation clicked');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
      <Header
        rightContent={
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
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
    </div>
  );
}
