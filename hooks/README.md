# Custom React Hooks

This directory contains custom React hooks for state management in the ExplicaMe application.

## Available Hooks

### 1. `useLocalStorage<T>`
**File:** `use-local-storage.ts`

Syncs React state with localStorage, providing automatic persistence across browser sessions.

**Usage:**
```typescript
import { useLocalStorage } from '@/hooks';

const [value, setValue, removeValue] = useLocalStorage<string>('myKey', 'defaultValue');
```

**Returns:**
- `value`: Current stored value
- `setValue`: Function to update value (supports functional updates)
- `removeValue`: Function to clear the value

**Features:**
- Type-safe
- Automatic localStorage synchronization
- Cross-tab synchronization via storage events
- SSR-safe (server-side rendering compatible)

---

### 2. `useCurrentUser`
**File:** `use-current-user.ts`

Manages the current user state, including user creation and switching.

**Usage:**
```typescript
import { useCurrentUser } from '@/hooks';

const {
  currentUser,
  currentUserId,
  allUsers,
  createUser,
  switchUser,
  clearCurrentUser,
  getUserById,
} = useCurrentUser();
```

**Returns:**
- `currentUser`: Current user object or null
- `currentUserId`: Current user ID or null
- `allUsers`: Array of all users
- `createUser(name)`: Create and set a new user
- `switchUser(userId)`: Switch to a different user
- `clearCurrentUser()`: Log out current user
- `getUserById(userId)`: Get user by ID

**Features:**
- Automatic user ID generation
- Persistent user state via localStorage
- Creates default user if none exists

---

### 3. `useConversations`
**File:** `use-conversations.ts`

Manages all conversation-related data including messages and participations.

**Usage:**
```typescript
import { useConversations } from '@/hooks';

const {
  conversations,
  currentConvo,
  createConversation,
  getConversation,
  updateConversation,
  deleteConversation,
  setCurrentConvo,
  getMessages,
  addMessage,
  joinConversation,
  leaveConversation,
  getParticipants,
  checkParticipation,
  refresh,
} = useConversations();
```

**Returns:**
- `conversations`: Array of all conversations
- `currentConvo`: Currently selected conversation
- `createConversation(title, maxAttempts?, participantLimit?)`: Create new conversation
- `getConversation(id)`: Get conversation by ID
- `updateConversation(id, updates)`: Update conversation
- `deleteConversation(id)`: Delete conversation
- `setCurrentConvo(convoId)`: Set current conversation
- `getMessages(convoId)`: Get all messages for a conversation
- `addMessage(text, userId, convoId, replyingToMessageId?)`: Add new message
- `joinConversation(userId, convoId)`: Add user to conversation
- `leaveConversation(userId, convoId)`: Remove user from conversation
- `getParticipants(convoId)`: Get conversation participants
- `checkParticipation(userId, convoId)`: Check if user is participating
- `refresh()`: Refresh all data

**Features:**
- Complete CRUD operations for conversations
- Message management
- Participant tracking
- Automatic data initialization

---

### 4. `useMessageInteractions`
**File:** `use-message-interactions.ts`

Manages the interpretation flow state including interpretations, gradings, disputes, and arbitrations.

**Usage:**
```typescript
import { useMessageInteractions } from '@/hooks';

const {
  flowState,
  submitInterpretation,
  getAllInterpretations,
  getUserInterpretations,
  getAttemptCount,
  gradeInterpretation,
  updateInterpretationGrading,
  submitGradingResponse,
  submitArbitration,
  createMessageBreakdown,
  createInterpretationBreakdown,
  loadFlowState,
  clearFlowState,
} = useMessageInteractions();
```

**Returns:**
- `flowState`: Current interpretation flow state
- `submitInterpretation(messageId, userId, text)`: Submit interpretation
- `getAllInterpretations(messageId)`: Get all interpretations
- `getUserInterpretations(messageId, userId)`: Get user's interpretations
- `getAttemptCount(messageId, userId)`: Get current attempt count
- `gradeInterpretation(...)`: Grade an interpretation
- `updateInterpretationGrading(...)`: Update grading
- `submitGradingResponse(gradingId, text)`: Submit dispute
- `submitArbitration(...)`: Create arbitration
- `createMessageBreakdown(messageId, points)`: Create message breakdown
- `createInterpretationBreakdown(interpretationId, points)`: Create interpretation breakdown
- `loadFlowState(messageId, userId)`: Load flow state
- `clearFlowState()`: Clear flow state

**Flow State Structure:**
```typescript
{
  interpretation: Interpretation | null,
  grading: InterpretationGrading | null,
  response: InterpretationGradingResponse | null,
  arbitration: Arbitration | null,
  attemptNumber: number,
  maxAttempts: number,
  canRetry: boolean,
  messageBreakdown: Breakdown | null,
  messagePoints: Point[],
  interpretationBreakdown: Breakdown | null,
  interpretationPoints: Point[],
}
```

**Features:**
- Complete interpretation flow management
- Attempt tracking
- Grading and dispute handling
- Breakdown management
- Arbitration support

---

## Testing

A test component (`HooksTest.tsx`) is provided in `app/components/` to verify all hooks work correctly. It demonstrates:

1. **useLocalStorage**: Value persistence across sessions
2. **useCurrentUser**: User creation and switching
3. **useConversations**: Creating conversations, sending messages, managing participants
4. **useMessageInteractions**: Submitting interpretations, viewing grading results

To test, run the application and navigate to the home page where the test component is displayed.

---

## Architecture Notes

- All hooks use the data management utilities from `lib/data-manager.ts`
- State is persisted to localStorage for MVP
- Hooks are client-side only (Next.js client components)
- Type-safe with full TypeScript support
- SSR-compatible with proper guards

---

## Import Patterns

**Individual imports:**
```typescript
import { useLocalStorage } from '@/hooks/use-local-storage';
```

**Batch imports:**
```typescript
import { useLocalStorage, useCurrentUser, useConversations } from '@/hooks';
```
