'use client';

import React, { useState } from 'react';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Textarea from '@/app/components/ui/Textarea';
import Modal from '@/app/components/ui/Modal';
import Card from '@/app/components/ui/Card';
import Badge from '@/app/components/ui/Badge';
import { BrainIcon } from '@/app/components/icons/BrainIcon';
import { CheckmarkIcon } from '@/app/components/icons/CheckmarkIcon';
import { SpeakingIcon } from '@/app/components/icons/SpeakingIcon';

export default function UIComponentsTest() {
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-8 space-y-12 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">UI Components Test</h1>

      {/* Button Tests */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Button</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          
          <div className="space-y-2">
            <Button fullWidth>Full Width Button</Button>
            <Button disabled>Disabled Button</Button>
          </div>
        </div>
      </section>

      {/* Input Tests */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Input</h2>
        <div className="space-y-4 max-w-md">
          <Input 
            label="Basic Input" 
            placeholder="Enter text..."
          />
          
          <Input 
            label="With Helper Text" 
            placeholder="Enter text..."
            helperText="This is some helpful information"
          />
          
          <Input 
            label="With Error" 
            placeholder="Enter text..."
            error="This field is required"
          />
          
          <Input 
            label="With Character Count" 
            placeholder="Max 20 characters"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            maxLength={20}
            showCharacterCount
          />
          
          <Input 
            label="Small Size" 
            size="sm"
            placeholder="Small input"
          />
          
          <Input 
            label="Large Size" 
            size="lg"
            placeholder="Large input"
          />
        </div>
      </section>

      {/* Textarea Tests */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Textarea</h2>
        <div className="space-y-4 max-w-md">
          <Textarea 
            label="Basic Textarea" 
            placeholder="Enter text..."
            rows={3}
          />
          
          <Textarea 
            label="With Character Count" 
            placeholder="Max 100 characters"
            value={textareaValue}
            onChange={(e) => setTextareaValue(e.target.value)}
            maxLength={100}
            showCharacterCount
            rows={4}
          />
          
          <Textarea 
            label="No Resize" 
            placeholder="Cannot resize this"
            resize="none"
            rows={3}
          />
          
          <Textarea 
            label="With Error" 
            placeholder="Enter text..."
            error="This field is required"
            rows={3}
          />
        </div>
      </section>

      {/* Modal Tests */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Modal</h2>
        <div className="space-y-4">
          <Button onClick={() => setIsModalOpen(true)}>
            Open Modal
          </Button>
          
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Test Modal"
            size="md"
          >
            <div className="space-y-4">
              <p>This is a test modal with various content.</p>
              <p>It features:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Backdrop with blur effect</li>
                <li>Close button in header</li>
                <li>Portal rendering</li>
                <li>Click outside to close</li>
                <li>Press ESC to close</li>
              </ul>
              <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                Close Modal
              </Button>
            </div>
          </Modal>
        </div>
      </section>

      {/* Card Tests */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Card</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card variant="default">
            <h3 className="font-semibold mb-2">Default Card</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Standard card with border
            </p>
          </Card>
          
          <Card variant="outlined">
            <h3 className="font-semibold mb-2">Outlined Card</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Card with outlined border
            </p>
          </Card>
          
          <Card variant="elevated">
            <h3 className="font-semibold mb-2">Elevated Card</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Card with shadow elevation
            </p>
          </Card>
          
          <Card hoverable>
            <h3 className="font-semibold mb-2">Hoverable Card</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hover over me to see effect
            </p>
          </Card>
          
          <Card clickable onClick={() => alert('Card clicked!')}>
            <h3 className="font-semibold mb-2">Clickable Card</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click me!
            </p>
          </Card>
          
          <Card padding="lg" variant="elevated">
            <h3 className="font-semibold mb-2">Large Padding</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Extra spacious card
            </p>
          </Card>
        </div>
      </section>

      {/* Badge Tests */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Badge</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <Badge size="sm">Small</Badge>
            <Badge size="md">Medium</Badge>
            <Badge size="lg">Large</Badge>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="success" dot>Active</Badge>
            <Badge variant="danger" dot>Error</Badge>
            <Badge variant="warning" dot>Warning</Badge>
            <Badge variant="info" dot>Info</Badge>
          </div>
        </div>
      </section>

      {/* Icon Tests */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Icons</h2>
        <div className="space-y-6">
          {/* Default sizes */}
          <div>
            <h3 className="text-lg font-medium mb-3">Default Sizes</h3>
            <div className="flex flex-wrap gap-6 items-center">
              <BrainIcon />
              <CheckmarkIcon />
              <SpeakingIcon />
            </div>
          </div>

          {/* Different sizes */}
          <div>
            <h3 className="text-lg font-medium mb-3">Size Variations</h3>
            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-2">
                <BrainIcon size={16} />
                <span className="text-sm">16px</span>
              </div>
              <div className="flex items-center gap-2">
                <BrainIcon size={24} />
                <span className="text-sm">24px</span>
              </div>
              <div className="flex items-center gap-2">
                <BrainIcon size={32} />
                <span className="text-sm">32px</span>
              </div>
              <div className="flex items-center gap-2">
                <BrainIcon size={48} />
                <span className="text-sm">48px</span>
              </div>
            </div>
          </div>

          {/* Color variations */}
          <div>
            <h3 className="text-lg font-medium mb-3">Color Variations</h3>
            <div className="flex flex-wrap gap-6 items-center">
              <BrainIcon className="text-blue-600" />
              <CheckmarkIcon className="text-green-600" />
              <SpeakingIcon className="text-purple-600" />
              <BrainIcon className="text-gray-400" />
              <CheckmarkIcon className="text-orange-600" />
              <SpeakingIcon className="text-pink-600" />
            </div>
          </div>

          {/* In context - Chat App UI simulation */}
          <div>
            <h3 className="text-lg font-medium mb-3">Context: Chat Messages</h3>
            <div className="space-y-3 max-w-2xl">
              {/* Message with interpretation needed */}
              <Card>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">Alice</span>
                      <Badge variant="warning" size="sm">
                        <BrainIcon size={12} className="inline" />
                        <span className="ml-1">Needs interpretation</span>
                      </Badge>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      I'm really not sure about this approach...
                    </p>
                  </div>
                </div>
              </Card>

              {/* Message with checkmark - understood */}
              <Card>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">Bob</span>
                      <Badge variant="success" size="sm">
                        <CheckmarkIcon size={12} className="inline" />
                        <span className="ml-1">Understood</span>
                      </Badge>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      Let's move forward with plan A.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Message with speaking icon - can respond */}
              <Card>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">Charlie</span>
                      <Badge variant="info" size="sm">
                        <SpeakingIcon size={12} className="inline" />
                        <span className="ml-1">Your turn</span>
                      </Badge>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      What are your thoughts on this?
                    </p>
                  </div>
                </div>
              </Card>

              {/* All icons together in action buttons */}
              <Card variant="elevated">
                <div className="space-y-3">
                  <p className="text-gray-700 dark:text-gray-300">
                    Message requiring interpretation and response
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">
                      <BrainIcon size={16} className="mr-2" />
                      Interpret Message
                    </Button>
                    <Button variant="outline" size="sm">
                      <SpeakingIcon size={16} className="mr-2" />
                      Respond
                    </Button>
                    <Button variant="outline" size="sm">
                      <CheckmarkIcon size={16} className="mr-2" />
                      Mark Read
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Icon grid - all combinations */}
          <div>
            <h3 className="text-lg font-medium mb-3">All Icons Grid</h3>
            <div className="grid grid-cols-3 gap-4">
              <Card className="flex flex-col items-center justify-center p-6">
                <BrainIcon size={32} className="mb-2 text-blue-600" />
                <p className="text-sm font-medium">Brain Icon</p>
                <p className="text-xs text-gray-500">Interpretation</p>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6">
                <CheckmarkIcon size={32} className="mb-2 text-green-600" />
                <p className="text-sm font-medium">Checkmark Icon</p>
                <p className="text-xs text-gray-500">Completed</p>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6">
                <SpeakingIcon size={32} className="mb-2 text-purple-600" />
                <p className="text-sm font-medium">Speaking Icon</p>
                <p className="text-xs text-gray-500">Can respond</p>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
