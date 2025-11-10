# Task 6.7: Interpretation Rejection Flow - Implementation Summary

## Overview
Implemented the complete interpretation rejection flow, enabling message authors to reject interpretations with feedback, and providing interpreters with options to try again or dispute the rejection.

## Changes Made

### 1. New Component: RejectedInterpretationStep
**File**: `app/components/message-modal/RejectedInterpretationStep.tsx`

**Purpose**: Display rejection feedback and provide action options to interpreters

**Key Features**:
- Shows rejection status with clear visual indicators (⚠️ warning badge for remaining attempts, ❌ error badge when max reached)
- Displays attempt count (e.g., "Attempt 2 of 3") with remaining attempts
- Shows AI similarity score and contextual feedback
- Displays original message, interpreter's attempt, and author's feedback side-by-side
- Provides two action paths:
  1. **Try Again**: Returns to submit interpretation step with incremented attempt number
  2. **Dispute Rejection**: Opens form to submit dispute text, triggers arbitration flow

**Smart UI Logic**:
- Conditionally shows both buttons if attempts remain
- Shows only "Dispute Rejection" button when max attempts reached
- Validates dispute text before submission
- Provides contextual tips based on remaining attempts

**Props**:
- `message`: Original message being interpreted
- `interpretation`: The rejected interpretation
- `grading`: Grading record with status, score, and notes
- `maxAttempts`: Conversation's max attempt limit
- `onTryAgain`: Callback to navigate back to submit step
- `onDisputeSubmitted`: Callback after successful dispute submission

### 2. MessageModal Component Updates
**File**: `app/components/modals/MessageModal.tsx`

**Key Changes**:

#### A. Enhanced View State Logic
```typescript
function determineViewState(): 'view' | 'submit' | 'review' | 'rejected'
```
- Added 'rejected' as a new view state
- Detects when current user has a rejected interpretation
- Checks latest interpretation's grading status

#### B. Conversation Data Loading
- Added `convo` state to store conversation data
- Fetches conversation via `getConversationById()` to get `maxAttempts`
- Passes `maxAttempts` to RejectedInterpretationStep

#### C. Rejected Interpretation Detection
```typescript
const rejectedInterpretation = interpretations.find(interp => {
  if (interp.userId !== currentUserId) return false;
  const grading = gradings.get(interp.id);
  return grading && grading.status === 'rejected';
});
```

#### D. New Action Handlers
1. **handleTryAgain**:
   - Sets `currentStep` to 'submit-interpretation'
   - Allows interpreter to write a new interpretation
   - Automatically increments attempt number

2. **handleDisputeSubmitted**:
   - Reloads message data to reflect dispute
   - Closes modal after successful submission
   - Triggers arbitration flow (handled in future tasks)

#### E. Enhanced Rendering Logic
```typescript
{viewState === 'rejected' && rejectedInterpretation && convo ? (
  <RejectedInterpretationStep
    message={message}
    interpretation={rejectedInterpretation}
    grading={gradings.get(rejectedInterpretation.id)!}
    maxAttempts={convo.maxAttempts}
    onTryAgain={handleTryAgain}
    onDisputeSubmitted={handleDisputeSubmitted}
  />
) : ...}
```

#### F. Submit Step Compatibility
- Updated submit step rendering condition to include 'rejected' view state
- Allows seamless transition from rejected view to try again

### 3. Module Export
**File**: `app/components/message-modal/index.ts`
- Added export for `RejectedInterpretationStep`

## Complete Rejection Flow

### Step-by-Step Process:

1. **Author Rejects Interpretation**:
   - Opens MessageModal, sees ReviewInterpretationStep
   - Provides feedback notes (required for rejection)
   - Clicks "Reject" button
   - `updateGrading()` sets status to 'rejected' with notes
   - Modal reloads and closes

2. **Interpreter Opens Message**:
   - MessageModal loads message and interpretations
   - Detects latest interpretation has 'rejected' status
   - `determineViewState()` returns 'rejected'
   - Displays RejectedInterpretationStep

3. **Interpreter Sees Rejection Feedback**:
   - View shows attempt count (X of 3)
   - Displays remaining attempts
   - Shows AI similarity score
   - Shows original message and their interpretation
   - Shows author's detailed feedback

4. **Interpreter Takes Action**:

   **Option A - Try Again** (if attempts remain):
   - Clicks "Try Again" button
   - Modal transitions to SubmitInterpretationStep
   - Attempt number automatically incremented
   - Can submit new interpretation

   **Option B - Dispute Rejection**:
   - Clicks "Dispute Rejection" button
   - Dispute form appears
   - Enters explanation of why interpretation is accurate
   - Clicks "Submit Dispute"
   - `createGradingResponse()` creates dispute record
   - Triggers arbitration flow (future task)
   - Modal reloads and closes

### Status and Permission Logic:

**Attempt Counter Management**:
- Attempt number is tracked in `interpretations.attempt_number` field
- Incremented automatically when creating new interpretation
- Used to calculate remaining attempts: `maxAttempts - attemptNumber`

**Max Attempts Check**:
- Conversation's `maxAttempts` (default: 3) loaded from database
- Compared against current attempt number
- Determines whether "Try Again" button is shown
- "Dispute" button always available regardless of attempts

**UI States**:
- **Attempts Remaining**: Shows ⚠️ warning badge, both action buttons
- **Max Attempts Reached**: Shows ❌ error badge, only "Dispute" button
- **Contextual Tips**: Different help text based on attempt status

## Database Operations

**Existing Operations (No Changes)**:
- `updateGrading()`: Already sets status to 'rejected' with notes
- `createInterpretation()`: Already increments attempt_number
- `createGradingResponse()`: Already exists for disputes

**New Queries**:
- `getConversationById()`: Fetch conversation's maxAttempts

## Integration Points

### Works With:
1. **ReviewInterpretationStep**: Rejection creates grading with status 'rejected'
2. **SubmitInterpretationStep**: Try Again transitions back to submit flow
3. **Message Status Icons**: Rejected interpretations show 🧠 brain icon
4. **MessageComposer**: Blocks replies until interpretation accepted
5. **Arbitration Flow**: Dispute submission triggers arbitration (future task)

### State Transitions:
```
pending → rejected (author rejects)
rejected → new pending (try again)
rejected → arbitration (dispute submitted)
```

## Edge Cases Handled

1. **No Attempts Remaining**:
   - Only shows "Dispute Rejection" button
   - Updated help text explains arbitration
   - Prevents "Try Again" action

2. **Missing Feedback Notes**:
   - Author must provide feedback when rejecting
   - Ensures interpreter knows what to improve

3. **Empty Dispute Text**:
   - Validates dispute text before submission
   - Shows error if empty

4. **Multiple Rejections**:
   - Always shows latest rejected interpretation
   - Tracks attempt count accurately
   - Prevents exceeding max attempts

5. **Conversation Not Loaded**:
   - Checks `convo` exists before rendering
   - Gracefully handles missing data

6. **Modal State Management**:
   - Reloads data after actions
   - Properly transitions between steps
   - Maintains current step on Try Again

## Testing Checklist

### Basic Rejection Flow:
- [x] Author can reject interpretation with feedback
- [x] Rejection updates grading status to 'rejected'
- [x] Rejected interpretation shows in modal
- [x] Displays attempt count correctly
- [x] Shows remaining attempts

### Try Again Flow:
- [x] "Try Again" button appears when attempts remain
- [x] Clicking "Try Again" opens SubmitInterpretationStep
- [x] Attempt number increments correctly
- [x] Can submit new interpretation

### Dispute Flow:
- [x] "Dispute Rejection" button always available
- [x] Dispute form validates text input
- [x] Creates grading response on submission
- [x] Modal closes after successful dispute

### Max Attempts:
- [x] Calculates remaining attempts correctly
- [x] Hides "Try Again" when max reached
- [x] Shows only "Dispute" button at max attempts
- [x] Updates help text appropriately

### UI/UX:
- [x] Shows rejection badge (warning/error)
- [x] Displays similarity score
- [x] Shows all three texts (original, interpretation, feedback)
- [x] Contextual tips based on attempt status
- [x] Smooth transitions between states

## Future Enhancements (Out of Scope)

- Arbitration resolution display (Task 6.8+)
- Author response to dispute
- Multi-attempt history view
- Notification when interpretation is rejected
- Analytics on rejection reasons

## Files Modified

1. **Created**: `app/components/message-modal/RejectedInterpretationStep.tsx` (277 lines)
2. **Modified**: `app/components/modals/MessageModal.tsx` (+45 lines)
3. **Modified**: `app/components/message-modal/index.ts` (+1 line)

## Summary

Successfully implemented the complete interpretation rejection flow with:
- Clear feedback display for rejected interpretations
- Smart attempt counting and max attempts handling
- Try Again functionality with seamless step transition
- Dispute mechanism to trigger arbitration
- Comprehensive edge case handling
- Intuitive UI/UX with contextual guidance

The rejection flow integrates seamlessly with existing acceptance flow (Task 6.6) and sets the foundation for arbitration flow (future tasks).
