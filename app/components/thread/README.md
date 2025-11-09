# Thread Components

Components for displaying conversation threads and messages in MMSTR.

## Components

### MessageCard

Displays an individual message with user info, timestamp, reply indicator, and status icon.

**Features:**
- ✅ User name display
- ✅ Timestamp with relative formatting (e.g., "5m ago", "2h ago", "3d ago")
- ✅ Message text with proper line breaks and word wrapping
- ✅ Reply-to indicator with snippet and arrow icon
- ✅ Status icon positioned in top-right corner (brain/speaking/checkmark)
- ✅ Clickable card with hover effects
- ✅ Dark mode support

**Props:**
```typescript
interface MessageCardProps {
  message: Message;              // The message entity
  userName: string;              // User name from localStorage
  status: MessageStatus;         // 'brain' | 'speaking' | 'checkmark' | 'none'
  replyingToSnippet?: string | null;  // Reply snippet if applicable
  onClick?: () => void;          // Click handler for opening modal
}
```

**Status Icons:**
- 🧠 **Brain** (purple): Interpretation needed
- 💬 **Speaking** (blue): Can respond now (interpretation accepted)
- ✓ **Checkmark** (green): Completed
- (none): No action needed (own message or short message)

### MessageList

Renders a chronological list of messages in a conversation.

**Features:**
- ✅ Chronological display of messages
- ✅ Empty state message
- ✅ Proper spacing between messages
- ✅ Click handling for opening message modals

**Props:**
```typescript
interface MessageWithMetadata {
  message: Message;
  userName: string;
  status: MessageStatus;
  replyingToSnippet?: string | null;
}

interface MessageListProps {
  messages: MessageWithMetadata[];  // Messages with computed metadata
  onMessageClick?: (messageId: string) => void;  // Click handler
}
```

## Usage Example

```tsx
import { MessageList } from '@/app/components/thread';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getMessageStatus } from '@/lib/message-status';

function ConversationThread({ convoId }: { convoId: string }) {
  const { getUserById, currentUserId } = useCurrentUser();
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Load messages from server
  useEffect(() => {
    async function loadMessages() {
      const msgs = await getConversationMessages(convoId);
      setMessages(msgs);
    }
    loadMessages();
  }, [convoId]);
  
  // Prepare messages with metadata
  const messagesWithMetadata = messages.map(message => {
    const user = getUserById(message.userId);
    const userName = user?.name || 'Unknown User';
    
    // Get reply snippet if replying to another message
    let replyingToSnippet = null;
    if (message.replyingToMessageId) {
      const parentMsg = messages.find(m => m.id === message.replyingToMessageId);
      if (parentMsg) {
        replyingToSnippet = parentMsg.text.length > 60 
          ? parentMsg.text.substring(0, 60) + '...'
          : parentMsg.text;
      }
    }
    
    // Determine message status
    const status = getMessageStatus({
      isOwnMessage: message.userId === currentUserId,
      requiresInterpretation: message.text.length >= 10,
      hasInterpretation: false, // Check interpretation state
      interpretationStatus: undefined,
      hasResponded: false, // Check if user already responded
    });
    
    return {
      message,
      userName,
      status,
      replyingToSnippet,
    };
  });
  
  // Handle message click
  const handleMessageClick = (messageId: string) => {
    // Open message modal
    console.log('Open message modal for:', messageId);
  };
  
  return (
    <MessageList 
      messages={messagesWithMetadata} 
      onMessageClick={handleMessageClick}
    />
  );
}
```

## Styling

Components use Tailwind CSS and follow the app's design system:
- Cards use the `Card` component from `@/app/components/ui`
- Icons from `@/app/components/icons`
- Dark mode classes for theme support
- Responsive design with proper spacing

## Integration Points

**Required imports:**
- `Message` type from `@/types/entities`
- `MessageStatus` type from `@/lib/message-status`
- `getMessageStatus()` utility to determine status
- `useCurrentUser()` hook for user data
- `getConversationMessages()` server action for fetching messages

**Related Components:**
- Will integrate with Message Modal (task 5.x+)
- Will integrate with New Message Composer (task 5.3)
- Uses existing UI components (Card, icons)
