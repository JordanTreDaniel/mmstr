# MessageComposer Component

## Overview
The MessageComposer component provides a user interface for composing and sending messages in a conversation thread. It includes reply functionality, character limits, and validation.

## Features

### 1. Reply-to Selector (Subtask 5.3.2) ✓
- Dropdown menu to select which message to reply to
- Shows message snippets (truncated to 60 characters) for easy identification
- Displays full snippet of selected message below dropdown
- Disabled when no messages are available

### 2. Message Input with Character Limit (Subtask 5.3.3) ✓
- Textarea with 280 character maximum
- Real-time character counter showing `current/280`
- Visual feedback when over limit (red text)
- Helper text showing valid range (10-280 characters)
- Keyboard shortcut: Ctrl/Cmd + Enter to send

### 3. Send Button with Validation (Subtask 5.3.4) ✓
- Validates message length (10-280 characters)
- Displays appropriate error messages:
  - "Message must be at least 10 characters"
  - "Message must not exceed 280 characters"
  - "Failed to create message" (server error)
- Disabled when:
  - Message is invalid (too short/long)
  - User is not logged in
  - Message is being sent (shows "Sending..." state)

### 4. Auto-clear After Send (Subtask 5.3.5) ✓
- Clears textarea after successful message creation
- Clears any error messages
- Maintains focus for quick follow-up messages

### 5. Auto-select Recent Message (Subtask 5.3.6) ✓
- Automatically selects most recent message as reply target on mount
- After sending a message, auto-selects the newly created message for next reply
- Ensures smooth conversation flow

### 6. Immediate Message Display (Subtask 5.3.7) ✓
- Calls `onMessageSent` callback after successful send
- Parent component (`ConversationPage`) refreshes message list via `loadMessages()`
- New message appears immediately in the thread
- Reply-to selector updates to include new message

## Props

```typescript
interface MessageComposerProps {
  /** Conversation ID to send messages to */
  convoId: string;
  /** Available messages to reply to */
  messages: Message[];
  /** Callback when message is successfully sent */
  onMessageSent?: () => void;
}
```

## Usage

```tsx
import { MessageComposer } from '@/app/components/thread';

function ConversationView() {
  const [messages, setMessages] = useState<Message[]>([]);
  
  const loadMessages = async () => {
    // Fetch messages from server
    const msgs = await getConversationMessages(convoId);
    setMessages(msgs);
  };
  
  return (
    <MessageComposer
      convoId={conversationId}
      messages={messages}
      onMessageSent={loadMessages}
    />
  );
}
```

## Integration

The MessageComposer is integrated into the `ConversationPage` component (`app/conversation/[id]/page.tsx`):
- Positioned at the bottom of the thread view
- Wrapped in a Card component for consistent styling
- Receives live message list for reply-to dropdown
- Triggers message list refresh via `onMessageSent` callback

## Validation Rules

1. **Minimum Length**: 10 characters (trimmed)
2. **Maximum Length**: 280 characters (enforced by textarea)
3. **Server-side Validation**: Also enforced by `createMessage` server action

## User Experience

- Clean, accessible interface with proper labels
- Dark mode support
- Loading states during send operation
- Clear error messaging
- Keyboard shortcuts for power users
- Responsive design

## Dependencies

- `useCurrentUser` hook - Gets current user ID
- `createMessage` server action - Persists messages to database
- `Button` UI component
- `Textarea` UI component with character counter
- `Message` type from entities
