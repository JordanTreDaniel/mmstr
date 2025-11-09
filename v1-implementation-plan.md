# MMSTR v1 Implementation Plan

Root Goal: Build a full-stack Next.js web app that enforces comprehension before rebuttal in turn-based discussions, using in-memory state with localStorage persistence and mocked AI features.

## Phase Structure

This plan follows a preparation-first approach: set up infrastructure, create foundational components and utilities, then implement features sequentially with verification at each step.

---

## Phase 0: Project Setup and Configuration

- [ ] 0.1: Initialize Next.js project with TypeScript and required dependencies
- [ ] 0.1.1: Create new Next.js 14+ app with TypeScript using create-next-app
- [ ] 0.1.2: Install Tailwind CSS and configure postcss.config.js and tailwind.config.js
- [ ] 0.1.3: Install additional dependencies (uuid, date-fns, clsx)
- [ ] 0.1.4: Verify project runs with npm run dev and shows default Next.js page
- [ ] 0.2: Configure project structure and base files
- [ ] 0.2.1: Create folder structure (app, components, lib, types, hooks, mocks)
- [ ] 0.2.2: Create base TypeScript configuration in tsconfig.json with path aliases
- [ ] 0.2.3: Create global CSS file with Tailwind directives and custom styles
- [ ] 0.2.4: Create .gitignore file with node_modules, .next, .env.local
- [ ] 0.3: Set up localStorage utilities and type safety
- [ ] 0.3.1: Create lib/storage.ts with generic localStorage wrapper functions
- [ ] 0.3.2: Create lib/storage-keys.ts with constants for all storage keys
- [ ] 0.3.3: Verify storage utilities work by writing and reading test data

---

## Phase 1: Foundation - Data Models and Core Utilities

- [ ] 1.1: Define TypeScript interfaces for all data entities
- [ ] 1.1.1: Create types/entities.ts with User interface (id, name, createdAt)
- [ ] 1.1.2: Add Convo interface (id, title, createdAt, maxAttempts, participantLimit)
- [ ] 1.1.3: Add Participation interface (userId, convoId)
- [ ] 1.1.4: Add Message interface (id, text, userId, convoId, replyingToMessageId, createdAt)
- [ ] 1.1.5: Add Breakdown interface (id, messageId, interpretationId, createdAt)
- [ ] 1.1.6: Add Point interface (id, breakdownId, text, order)
- [ ] 1.1.7: Add Interpretation interface (id, messageId, userId, text, attemptNumber, createdAt)
- [ ] 1.1.8: Add InterpretationGrading interface (id, interpretationId, status, similarityScore, autoAcceptSuggested, notes, createdAt)
- [ ] 1.1.9: Add InterpretationGradingResponse interface (id, interpretationGradingId, text, createdAt)
- [ ] 1.1.10: Add Arbitration interface (id, messageId, interpretationId, gradingId, gradingResponseId, result, rulingStatus, explanation, createdAt)
- [ ] 1.1.11: Verify all interfaces compile without errors in TypeScript
- [ ] 1.2: Create mock AI utility functions
- [ ] 1.2.1: Create mocks/ai-breakdown.ts with function to generate random breakdown points (2-4 points)
- [ ] 1.2.2: Create mocks/ai-similarity.ts with function to calculate word overlap and return random score 70-95%
- [ ] 1.2.3: Create mocks/ai-arbitration.ts with function to randomly accept/reject with explanation
- [ ] 1.2.4: Add setTimeout delays (500-1500ms) to simulate API latency in all mock functions
- [ ] 1.2.5: Verify mock functions return expected data shapes by calling them with test inputs
- [ ] 1.3: Create data management utilities
- [ ] 1.3.1: Create lib/data-manager.ts with functions to initialize empty data structures
- [ ] 1.3.2: Add CRUD functions for conversations (create, read, update, delete)
- [ ] 1.3.3: Add CRUD functions for messages with validation (10-280 char limits)
- [ ] 1.3.4: Add CRUD functions for interpretations with attempt tracking
- [ ] 1.3.5: Add CRUD functions for gradings and responses
- [ ] 1.3.6: Add CRUD functions for arbitrations
- [ ] 1.3.7: Add helper function to get all data relationships (message with interpretations, etc)
- [ ] 1.3.8: Verify data manager by creating test conversation, message, and interpretation
- [ ] 1.4: Create custom React hooks for state management
- [ ] 1.4.1: Create hooks/use-local-storage.ts hook that syncs state with localStorage
- [ ] 1.4.2: Create hooks/use-conversations.ts hook that manages all conversations data
- [ ] 1.4.3: Create hooks/use-current-user.ts hook that manages current user (creates if not exists)
- [ ] 1.4.4: Create hooks/use-message-interactions.ts hook for interpretation flow state
- [ ] 1.4.5: Verify hooks work by creating test component that uses them

---

## Phase 2: Core UI Components Library

- [ ] 2.1: Create reusable base components
- [ ] 2.1.1: Create components/ui/Button.tsx with variants (primary, secondary, danger)
- [ ] 2.1.2: Create components/ui/Input.tsx with character counter support
- [ ] 2.1.3: Create components/ui/Textarea.tsx with character counter and max length
- [ ] 2.1.4: Create components/ui/Modal.tsx with backdrop, close button, and portal rendering
- [ ] 2.1.5: Create components/ui/Card.tsx for message containers with hover effects
- [ ] 2.1.6: Create components/ui/Badge.tsx for status indicators (pending, accepted, rejected)
- [ ] 2.1.7: Verify all UI components render correctly in isolation with test props
- [ ] 2.2: Create icon components for message status
- [ ] 2.2.1: Create components/icons/BrainIcon.tsx (🧠) for interpretation needed
- [ ] 2.2.2: Create components/icons/SpeakingIcon.tsx (💬) for can respond
- [ ] 2.2.3: Create components/icons/CheckmarkIcon.tsx (✓) for completed
- [ ] 2.2.4: Verify icons render with proper sizing and positioning
- [ ] 2.3: Create utility functions for UI logic
- [ ] 2.3.1: Create lib/message-status.ts to determine message status icon based on interpretation state
- [ ] 2.3.2: Create lib/character-validation.ts for min/max character checks
- [ ] 2.3.3: Create lib/word-similarity.ts to check if wording is too similar (>70% overlap)
- [ ] 2.3.4: Verify utility functions with various test inputs

---

## Phase 3: Landing Page and Navigation

- [ ] 3.1: Create landing page layout
- [ ] 3.1.1: Create app/page.tsx with hero section and MMSTR title
- [ ] 3.1.2: Add New Conversation button that navigates to create flow
- [ ] 3.1.3: Add What is MMSTR section with explanation cards
- [ ] 3.1.4: Add How does it work section with 4-step process
- [ ] 3.1.5: Add How does MMSTR help? section with 6 benefits list
- [ ] 3.1.6: Style landing page with Tailwind following wireframes layout
- [ ] 3.1.7: Verify landing page displays correctly and button is clickable
- [ ] 3.2: Create navigation and layout components
- [ ] 3.2.1: Create components/layout/Header.tsx with logo and back button support
- [ ] 3.2.2: Create components/layout/PageContainer.tsx for consistent page spacing
- [ ] 3.2.3: Verify header shows correctly on landing page

---

## Phase 4: Conversation Creation Flow

- [ ] 4.1: Create new conversation modal
- [ ] 4.1.1: Create components/modals/CreateConvoModal.tsx with form structure
- [ ] 4.1.2: Add title input field with validation
- [ ] 4.1.3: Add max participants slider (1-20, default 20)
- [ ] 4.1.4: Add max interpretation attempts slider (1-5, default 3)
- [ ] 4.1.5: Add optional first message textarea with 280 char limit
- [ ] 4.1.6: Add form validation to ensure title is not empty
- [ ] 4.1.7: Wire up Create Conversation button to save to localStorage and navigate
- [ ] 4.1.8: Verify modal opens from landing page and creates conversation successfully
- [ ] 4.2: Create conversation created success flow
- [ ] 4.2.1: Generate shareable conversation URL with ID
- [ ] 4.2.2: Navigate to thread view on successful creation
- [ ] 4.2.3: Verify navigation works and data persists in localStorage

---

## Phase 5: Thread View - Message Display

- [ ] 5.1: Create thread view page structure
- [ ] 5.1.1: Create app/conversation/[id]/page.tsx with dynamic route
- [ ] 5.1.2: Load conversation data from localStorage using ID param
- [ ] 5.1.3: Display conversation title in header with back button and share link
- [ ] 5.1.4: Show 404 or error state if conversation not found
- [ ] 5.1.5: Verify thread page loads with correct conversation data
- [ ] 5.2: Create message list display
- [ ] 5.2.1: Create components/thread/MessageList.tsx to render messages chronologically
- [ ] 5.2.2: Create components/thread/MessageCard.tsx for individual message display
- [ ] 5.2.3: Add user name and timestamp display in message card
- [ ] 5.2.4: Add reply-to indicator with snippet when message has replyingToMessageId
- [ ] 5.2.5: Position status icon (brain/speaking/checkmark) in top-right corner of card
- [ ] 5.2.6: Make message card clickable to open message modal
- [ ] 5.2.7: Verify messages display correctly with proper formatting and icons
- [ ] 5.3: Create new message composer
- [ ] 5.3.1: Create components/thread/MessageComposer.tsx at bottom of thread
- [ ] 5.3.2: Add dropdown to select which message to reply to (or null for root message)
- [ ] 5.3.3: Add textarea with 280 character limit and counter
- [ ] 5.3.4: Add send button that validates and creates message
- [ ] 5.3.5: Clear composer after successful send
- [ ] 5.3.6: Auto-select most recent message as reply target by default
- [ ] 5.3.7: Verify new messages appear in thread immediately after sending

---

## Phase 6: Interpretation Flow - Modal Views

- [ ] 6.1: Create message detail modal structure
- [ ] 6.1.1: Create components/modals/MessageModal.tsx with modal wrapper
- [ ] 6.1.2: Load message data and all related interpretations from data manager
- [ ] 6.1.3: Determine modal view state (view original, write interpretation, review, etc)
- [ ] 6.1.4: Display author name and timestamp in modal header
- [ ] 6.1.5: Add close button to return to thread view
- [ ] 6.1.6: Verify modal opens when clicking message card
- [ ] 6.2: Implement Step 1 - View Original Message (replier perspective)
- [ ] 6.2.1: Create components/message-modal/ViewOriginalStep.tsx
- [ ] 6.2.2: Display full original message text in card
- [ ] 6.2.3: Show prompt explaining interpretation requirement
- [ ] 6.2.4: Add Start Interpreting button to transition to interpretation entry
- [ ] 6.2.5: Skip this view if message is under minimum character limit (show can respond directly)
- [ ] 6.2.6: Verify original message displays correctly
- [ ] 6.3: Implement Step 2 - Submit Interpretation (replier perspective)
- [ ] 6.3.1: Create components/message-modal/SubmitInterpretationStep.tsx
- [ ] 6.3.2: Add toggle button to view original message (tracks view count)
- [ ] 6.3.3: Hide original message text by default while writing interpretation
- [ ] 6.3.4: Add textarea for interpretation with character limit
- [ ] 6.3.5: Display attempt number (X of 3 or custom max)
- [ ] 6.3.6: Add tip text about using different words but same meaning
- [ ] 6.3.7: Add Submit button that creates interpretation record
- [ ] 6.3.8: Show view count at bottom (how many times they looked back)
- [ ] 6.3.9: Verify interpretation can be written and submitted
- [ ] 6.4: Trigger AI grading on interpretation submission
- [ ] 6.4.1: Call mock similarity function to calculate score (70-95%)
- [ ] 6.4.2: Check for too-similar wording (>70% same words = auto-reject)
- [ ] 6.4.3: Create InterpretationGrading record with score and auto-accept suggestion
- [ ] 6.4.4: Set status to pending if below auto-accept threshold
- [ ] 6.4.5: Show loading state while AI processes (mock delay 500-1500ms)
- [ ] 6.4.6: Verify grading record is created with correct score
- [ ] 6.5: Implement Step 3 - Author Reviews Interpretation (author perspective)
- [ ] 6.5.1: Create components/message-modal/ReviewInterpretationStep.tsx
- [ ] 6.5.2: Display original message at top for reference
- [ ] 6.5.3: Display interpreter's attempt with similarity score
- [ ] 6.5.4: Show auto-accept suggestion badge if score above threshold
- [ ] 6.5.5: Add point-by-point review section with Pass/Fail buttons per point
- [ ] 6.5.6: Add optional feedback textarea for rejection notes
- [ ] 6.5.7: Add Accept and Reject buttons at bottom
- [ ] 6.5.8: Update grading status to accepted or rejected on button click
- [ ] 6.5.9: Verify author can review and accept/reject interpretation
- [ ] 6.6: Handle interpretation acceptance flow
- [ ] 6.6.1: Update interpretation grading status to accepted
- [ ] 6.6.2: Update message status icon to checkmark (✓)
- [ ] 6.6.3: Unlock ability for interpreter to post reply message
- [ ] 6.6.4: Close modal and return to thread view
- [ ] 6.6.5: Verify accepted interpretation enables response ability
- [ ] 6.7: Handle interpretation rejection flow
- [ ] 6.7.1: Update interpretation grading status to rejected with notes
- [ ] 6.7.2: Increment attempt counter for this user on this message
- [ ] 6.7.3: Check if max attempts reached (3 or custom)
- [ ] 6.7.4: Show rejection feedback to interpreter with remaining attempts
- [ ] 6.7.5: Show Try Again and Dispute buttons if attempts remain
- [ ] 6.7.6: Verify rejection shows feedback and attempt count updates

---

## Phase 7: Arbitration System

- [ ] 7.1: Implement dispute flow UI
- [ ] 7.1.1: Create components/message-modal/DisputeStep.tsx
- [ ] 7.1.2: Display original message, interpretation, and author's rejection reason
- [ ] 7.1.3: Add textarea for interpreter to explain why rejection is unfair
- [ ] 7.1.4: Add Submit Dispute button
- [ ] 7.1.5: Verify dispute form displays correctly with all context
- [ ] 7.2: Trigger arbitration on dispute submission
- [ ] 7.2.1: Create InterpretationGradingResponse record with dispute text
- [ ] 7.2.2: Call mock arbitration function with all context
- [ ] 7.2.3: Show loading state with AI Arbitration in Progress message
- [ ] 7.2.4: Create Arbitration record with result (accept or reject)
- [ ] 7.2.5: Mock AI provides point-by-point ruling and explanation (500-1500ms delay)
- [ ] 7.2.6: Verify arbitration record is created with mock ruling
- [ ] 7.3: Trigger arbitration on max attempts reached
- [ ] 7.3.1: Detect when interpreter has used all attempts (3 or custom max)
- [ ] 7.3.2: Automatically call mock arbitration function
- [ ] 7.3.3: Show AI Arbitration notice instead of Try Again option
- [ ] 7.3.4: Apply same arbitration flow as dispute scenario
- [ ] 7.3.5: Verify auto-arbitration triggers after max attempts
- [ ] 7.4: Display arbitration results
- [ ] 7.4.1: Create components/message-modal/ArbitrationStep.tsx
- [ ] 7.4.2: Display original message, interpretation, and rejection context
- [ ] 7.4.3: Show dispute response if present
- [ ] 7.4.4: Display AI ruling (ACCEPTED or REJECTED) with visual indicator
- [ ] 7.4.5: Show point-by-point AI evaluation with checkmarks per point
- [ ] 7.4.6: Display AI explanation text for the ruling
- [ ] 7.4.7: Update message status based on AI ruling (accepted = can respond)
- [ ] 7.4.8: Show Write Response button if AI accepts interpretation
- [ ] 7.4.9: Verify arbitration results display with complete context

---

## Phase 8: User Settings and Preferences

- [ ] 8.1: Create settings modal
- [ ] 8.1.1: Create components/modals/SettingsModal.tsx structure
- [ ] 8.1.2: Add display name input field
- [ ] 8.1.3: Add auto-accept threshold slider (70-100%, default 90%)
- [ ] 8.1.4: Add max interpretation attempts slider for new conversations (1-5, default 3)
- [ ] 8.1.5: Add placeholder stats section (mark as Future Feature)
- [ ] 8.1.6: Add Save Changes button to persist to localStorage
- [ ] 8.1.7: Verify settings persist across page reloads
- [ ] 8.2: Integrate settings into app
- [ ] 8.2.1: Add settings button/link in header (gear icon)
- [ ] 8.2.2: Apply auto-accept threshold when grading interpretations
- [ ] 8.2.3: Apply max attempts preference when creating new conversations
- [ ] 8.2.4: Verify settings affect interpretation flow correctly

---

## Phase 9: Message Status Logic and Permissions

- [ ] 9.1: Implement status icon determination logic
- [ ] 9.1.1: Check if current user needs to interpret message before responding
- [ ] 9.1.2: Show brain icon (🧠) if interpretation required and not completed
- [ ] 9.1.3: Show speaking icon (💬) if interpretation accepted but not yet responded
- [ ] 9.1.4: Show checkmark (✓) if interpretation completed and accepted
- [ ] 9.1.5: Show no icon if message is from current user
- [ ] 9.1.6: Verify correct icon shows for each message state
- [ ] 9.2: Implement response permission checks
- [ ] 9.2.1: Block reply to message if interpretation not accepted
- [ ] 9.2.2: Allow reply if message is under minimum chars (no interpretation needed)
- [ ] 9.2.3: Allow reply if interpretation has been accepted
- [ ] 9.2.4: Show appropriate error message when trying to reply without interpretation
- [ ] 9.2.5: Verify response composer only works with valid interpretation
- [ ] 9.3: Handle messages under minimum character requirement
- [ ] 9.3.1: Detect messages with less than 10 characters or fewer than 3 words
- [ ] 9.3.2: Skip interpretation requirement for short messages
- [ ] 9.3.3: Show different UI flow (can respond directly)
- [ ] 9.3.4: Verify short messages don't require interpretation

---

## Phase 10: Multi-User Simulation and Edge Cases

- [ ] 10.1: Implement user switching for testing
- [ ] 10.1.1: Create dev-only user switcher component in header
- [ ] 10.1.2: Store current user ID in localStorage
- [ ] 10.1.3: Add button to create/switch between test users (Alice, Bob, Charlie)
- [ ] 10.1.4: Verify switching users shows different perspectives in modals
- [ ] 10.2: Handle multiple interpretations per message
- [ ] 10.2.1: Support multiple users interpreting the same message
- [ ] 10.2.2: Show list of all interpretations in message modal
- [ ] 10.2.3: Track interpretation state per user per message
- [ ] 10.2.4: Verify multiple users can interpret same message independently
- [ ] 10.3: Handle edge cases and validation
- [ ] 10.3.1: Prevent creating message with empty text
- [ ] 10.3.2: Prevent interpretation submission if text is empty
- [ ] 10.3.3: Handle missing data gracefully (deleted messages, etc)
- [ ] 10.3.4: Show appropriate error messages for all validation failures
- [ ] 10.3.5: Verify app doesn't crash with invalid data states

---

## Phase 11: Sharing and Multi-Participant Support

- [ ] 11.1: Implement conversation sharing
- [ ] 11.1.1: Generate shareable link with conversation ID
- [ ] 11.1.2: Add Share button in thread header with copy-to-clipboard
- [ ] 11.1.3: Show confirmation when link copied successfully
- [ ] 11.1.4: Verify sharing link navigates to correct conversation
- [ ] 11.2: Handle participant joining
- [ ] 11.2.1: Auto-add current user to conversation participation on first view
- [ ] 11.2.2: Check participant limit before allowing join
- [ ] 11.2.3: Show participant count in thread header
- [ ] 11.2.4: Show error if conversation is full (20 or custom limit reached)
- [ ] 11.2.5: Verify participant tracking works correctly
- [ ] 11.3: Display participant information
- [ ] 11.3.1: Create components/thread/ParticipantsList.tsx
- [ ] 11.3.2: Show all participant names in conversation
- [ ] 11.3.3: Add participant avatars or initials
- [ ] 11.3.4: Verify participant list updates when users join

---

## Phase 12: Polish and Responsive Design

- [ ] 12.1: Enhance visual design with Tailwind
- [ ] 12.1.1: Add consistent color scheme (primary, secondary, success, danger, warning)
- [ ] 12.1.2: Add hover and focus states to all interactive elements
- [ ] 12.1.3: Add smooth transitions for modal open/close
- [ ] 12.1.4: Add loading spinners for async operations (AI grading, arbitration)
- [ ] 12.1.5: Add empty states for conversations with no messages
- [ ] 12.1.6: Verify visual polish matches wireframe aesthetic
- [ ] 12.2: Implement responsive layouts
- [ ] 12.2.1: Make landing page responsive for mobile (sm: breakpoint)
- [ ] 12.2.2: Make thread view responsive for mobile with stacked messages
- [ ] 12.2.3: Make modals responsive and scrollable on small screens
- [ ] 12.2.4: Adjust text sizes and spacing for mobile readability
- [ ] 12.2.5: Verify app works well on mobile, tablet, and desktop screen sizes
- [ ] 12.3: Add accessibility improvements
- [ ] 12.3.1: Add proper ARIA labels to all interactive elements
- [ ] 12.3.2: Ensure keyboard navigation works for modals and forms
- [ ] 12.3.3: Add focus management when opening/closing modals
- [ ] 12.3.4: Test with keyboard-only navigation
- [ ] 12.3.5: Verify screen reader compatibility for core flows

---

## Phase 13: Testing and Bug Fixes

- [ ] 13.1: Manual testing of complete user flows
- [ ] 13.1.1: Test complete flow from landing page to creating conversation
- [ ] 13.1.2: Test posting message and receiving interpretation request
- [ ] 13.1.3: Test interpretation submission and grading flow
- [ ] 13.1.4: Test acceptance path (interpretation accepted, can respond)
- [ ] 13.1.5: Test rejection path with retry attempts
- [ ] 13.1.6: Test dispute and arbitration flow end-to-end
- [ ] 13.1.7: Test max attempts reached triggers arbitration
- [ ] 13.1.8: Document any bugs found during testing
- [ ] 13.2: Edge case testing
- [ ] 13.2.1: Test with very long messages (near 280 char limit)
- [ ] 13.2.2: Test with minimum length messages
- [ ] 13.2.3: Test with special characters and emojis in messages
- [ ] 13.2.4: Test localStorage persistence across page reloads
- [ ] 13.2.5: Test clearing localStorage and starting fresh
- [ ] 13.2.6: Verify no console errors in browser
- [ ] 13.3: Fix identified bugs
- [ ] 13.3.1: Create list of all bugs found during testing
- [ ] 13.3.2: Prioritize bugs by severity (critical, high, medium, low)
- [ ] 13.3.3: Fix critical bugs first (app crashes, data loss)
- [ ] 13.3.4: Fix high priority bugs (broken core flows)
- [ ] 13.3.5: Fix medium priority bugs (UI glitches, minor issues)
- [ ] 13.3.6: Re-test all fixed bugs to verify resolution

---

## Phase 14: Documentation and Deployment Prep

- [ ] 14.1: Create README documentation
- [ ] 14.1.1: Write README.md with project description and MMSTR explanation
- [ ] 14.1.2: Add setup instructions (npm install, npm run dev)
- [ ] 14.1.3: Document project structure and key files
- [ ] 14.1.4: Add section explaining mocked features for v1
- [ ] 14.1.5: Add future roadmap section (real AI, backend, auth, etc)
- [ ] 14.1.6: Verify README is complete and accurate
- [ ] 14.2: Optimize for production build
- [ ] 14.2.1: Run npm run build to verify production build succeeds
- [ ] 14.2.2: Test production build locally with npm run start
- [ ] 14.2.3: Check for build warnings and resolve if possible
- [ ] 14.2.4: Verify production build runs without errors
- [ ] 14.3: Prepare for deployment
- [ ] 14.3.1: Create package.json scripts for deployment
- [ ] 14.3.2: Document deployment options (Vercel, Netlify, etc)
- [ ] 14.3.3: Add environment variable documentation if needed
- [ ] 14.3.4: Verify app is ready for deployment to hosting platform

---

## Verification Checklist

After completing all phases, verify the following works end-to-end:

- [ ] User can create a new conversation with custom settings
- [ ] User can post messages in a conversation
- [ ] User can reply to specific messages with visual reply indicator
- [ ] Message character limits are enforced (10-280)
- [ ] Short messages skip interpretation requirement
- [ ] Brain icon appears when interpretation needed
- [ ] Modal opens showing original message
- [ ] User can write interpretation with original hidden
- [ ] Toggle to view original tracks view count
- [ ] AI grading calculates similarity score
- [ ] Auto-reject triggers for too-similar wording (>70%)
- [ ] Auto-accept suggestion shows for high scores (90%+)
- [ ] Author can review interpretation point-by-point
- [ ] Author can accept interpretation
- [ ] Accepted interpretation shows checkmark and unlocks response
- [ ] Author can reject interpretation with notes
- [ ] Rejected interpretation shows feedback and remaining attempts
- [ ] Interpreter can retry after rejection
- [ ] Interpreter can dispute rejection
- [ ] Arbitration triggers on dispute
- [ ] Arbitration triggers after max attempts
- [ ] AI arbitration shows point-by-point ruling
- [ ] Arbitration result updates message status appropriately
- [ ] Settings modal allows customizing thresholds
- [ ] Share link copies conversation URL
- [ ] Participants can join via shared link
- [ ] Participant limit is enforced
- [ ] All data persists in localStorage across page reloads
- [ ] App is responsive on mobile, tablet, and desktop
- [ ] No console errors appear during normal usage

