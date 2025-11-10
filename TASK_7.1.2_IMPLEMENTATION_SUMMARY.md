# Task 7.1.2: Trigger Arbitration on Max Attempts Reached - Implementation Summary

## Overview
Implemented automatic arbitration triggering when an interpreter reaches the maximum number of interpretation attempts and their final attempt is rejected.

## Changes Made

### Modified File: `app/actions/interpretations.ts`

#### 1. Added Import for Max Attempts Arbitration
**Line 8**: Added `arbitrateMaxAttempts` to the import from `@/mocks/mock-ai-arbitration`
**Line 10**: Added import for `getConversationById` from `./convos`

```typescript
import { arbitrateInterpretation, arbitrateMaxAttempts } from '@/mocks/mock-ai-arbitration';
import { getConversationById } from './convos';
```

#### 2. Created `triggerArbitrationForMaxAttempts` Function
**Lines 342-403**: New internal function that triggers arbitration when max attempts are reached

**Key Features**:
- Validates that interpretation attempt number equals conversation's maxAttempts
- Checks for existing arbitration to prevent duplicates
- Uses `arbitrateMaxAttempts` mock function (70% acceptance rate, more lenient than dispute arbitration)
- Creates arbitration record with `interpretationGradingResponseId = null` (distinguishes from dispute-triggered arbitration)

**Function Flow**:
1. Fetch grading by ID
2. Fetch interpretation from grading
3. Fetch original message from interpretation
4. Fetch conversation to check maxAttempts setting
5. Verify attempt number equals maxAttempts (early return if not)
6. Check if arbitration already exists (early return if duplicate)
7. Call `arbitrateMaxAttempts` mock AI function
8. Create arbitration record with null responseId

```typescript
async function triggerArbitrationForMaxAttempts(
  interpretationGradingId: string
): Promise<void> {
  // ... validation and data fetching ...
  
  // Verify this is actually the max attempt
  if (interpretation.attemptNumber < convo.maxAttempts) {
    return; // Not at max attempts yet
  }

  // Check if arbitration already exists
  const existingArbitration = await getArbitrationByInterpretation(interpretation.id);
  if (existingArbitration) {
    return; // Already triggered
  }

  // Call mock AI arbitration for max attempts (more lenient)
  const arbitrationResult = await arbitrateMaxAttempts(
    message.text,
    interpretation.text,
    interpretation.attemptNumber
  );

  // Create arbitration record (no responseId since not triggered by dispute)
  await createArbitration(
    message.id,
    interpretation.id,
    grading.id,
    null, // No dispute response ID
    arbitrationResult.result,
    'complete',
    arbitrationResult.explanation
  );
}
```

#### 3. Updated `updateGrading` Function
**Lines 195-198**: Added automatic arbitration trigger after author manually rejects interpretation

```typescript
// If status was updated to 'rejected', check if max attempts reached
if (updates.status === 'rejected') {
  await triggerArbitrationForMaxAttempts(id);
}
```

**When This Triggers**:
- Author reviews interpretation in ReviewInterpretationStep
- Author clicks "Reject" button with feedback notes
- `updateGrading` is called with status: 'rejected'
- Function checks if this is the final attempt
- If yes, automatically triggers arbitration

#### 4. Updated `gradeInterpretation` Function
**Lines 462-465**: Added automatic arbitration trigger for auto-rejected interpretations

```typescript
// If auto-rejected and max attempts reached, trigger arbitration
if (status === 'rejected') {
  await triggerArbitrationForMaxAttempts(grading.id);
}
```

**When This Triggers**:
- Interpreter submits interpretation in SubmitInterpretationStep
- Word similarity check detects >70% word overlap
- Interpretation is auto-rejected
- If this is the final attempt, automatically triggers arbitration

## Arbitration Triggering Scenarios

### Scenario 1: Manual Rejection at Max Attempts
1. Interpreter submits their 3rd (final) interpretation
2. Author reviews and clicks "Reject" with feedback
3. `updateGrading` is called with status: 'rejected'
4. `triggerArbitrationForMaxAttempts` is called
5. Checks attempt number equals maxAttempts (3)
6. Calls `arbitrateMaxAttempts` mock AI
7. Creates arbitration record with null responseId

### Scenario 2: Auto-Rejection at Max Attempts
1. Interpreter submits their 3rd (final) interpretation
2. System detects >70% word overlap
3. `gradeInterpretation` auto-rejects with notes
4. `triggerArbitrationForMaxAttempts` is called
5. Checks attempt number equals maxAttempts (3)
6. Calls `arbitrateMaxAttempts` mock AI
7. Creates arbitration record with null responseId

### Scenario 3: No Arbitration (Attempts Remaining)
1. Interpreter submits their 2nd interpretation
2. Author rejects it
3. `triggerArbitrationForMaxAttempts` is called
4. Checks attempt number (2) < maxAttempts (3)
5. Early return - no arbitration triggered
6. Interpreter can try again

### Scenario 4: Duplicate Prevention
1. Arbitration already triggered for an interpretation
2. System attempts to trigger again (edge case)
3. `triggerArbitrationForMaxAttempts` checks for existing arbitration
4. Early return - prevents duplicate arbitration records

## Differences: Max Attempts vs Dispute Arbitration

| Aspect | Max Attempts Arbitration | Dispute Arbitration |
|--------|--------------------------|---------------------|
| **Trigger** | Automatic when final attempt rejected | Manual when interpreter disputes |
| **Function** | `triggerArbitrationForMaxAttempts` | `triggerArbitrationForDispute` |
| **Mock AI** | `arbitrateMaxAttempts` (70% accept) | `arbitrateInterpretation` (60% accept) |
| **Response ID** | null | Has interpretationGradingResponseId |
| **Leniency** | More lenient (rewards persistence) | Less lenient (stricter evaluation) |
| **UI Flow** | Silent (happens in background) | Explicit (dispute form submission) |

## Integration with Existing System

### Database Schema Compliance
- Arbitration record correctly uses `interpretationGradingResponseId: null` for max attempts
- Matches spec: "null if triggered by max attempts" (types/entities.ts line 117)

### Works With Existing Components
1. **RejectedInterpretationStep**: Shows "Max Attempts Reached" badge when appropriate
2. **MessageModal**: Will detect arbitration state (future task 7.1.3)
3. **ArbitrationStep**: Will display arbitration results (future task 7.2)

### Mock AI Functions
- Uses existing `arbitrateMaxAttempts` from `mocks/mock-ai-arbitration.ts`
- Provides 70% acceptance rate (more lenient than 60% for disputes)
- Generates contextual explanations mentioning attempt count

## Edge Cases Handled

1. **Not at Max Attempts**: Early return if attempt number < maxAttempts
2. **Duplicate Arbitration**: Checks for existing arbitration before creating new one
3. **Auto-Rejection + Max Attempts**: Triggers in both manual and automatic rejection flows
4. **Custom Max Attempts**: Works with any maxAttempts value (1-5, configurable per conversation)
5. **Missing Data**: Throws descriptive errors if grading/interpretation/message/convo not found

## Testing Verification

### Build Status
✅ No linter errors in modified file
✅ TypeScript compilation successful (Next.js build passed for this file)
✅ No breaking changes to existing functionality

### Manual Testing Checklist (for QA)
- [ ] Create conversation with maxAttempts=3
- [ ] Submit 3 interpretations, all rejected by author
- [ ] Verify arbitration triggers on 3rd rejection
- [ ] Check arbitration record has null interpretationGradingResponseId
- [ ] Verify arbitration uses lenient acceptance rate
- [ ] Test with custom maxAttempts (e.g., 2 or 5)
- [ ] Verify no duplicate arbitrations created
- [ ] Test auto-rejection at max attempts
- [ ] Confirm no arbitration for attempts < max

## Future Integration Points

### Task 7.1.3: Update MessageModal to detect arbitration state
- MessageModal will check for arbitration records
- Display appropriate UI when arbitration exists
- Show arbitration results using ArbitrationStep component

### Task 7.2: Create arbitration results display component
- ArbitrationStep will consume arbitration records
- Display AI decision (accept/reject)
- Show AI explanation
- Indicate whether triggered by max attempts or dispute

## Summary

Successfully implemented automatic arbitration triggering when interpreters reach the maximum number of interpretation attempts. The system now:

1. ✅ Automatically triggers arbitration when final attempt is rejected
2. ✅ Uses more lenient AI evaluation for max attempts (70% vs 60%)
3. ✅ Prevents duplicate arbitrations
4. ✅ Works for both manual and auto-rejected interpretations
5. ✅ Correctly distinguishes max attempts arbitration (null responseId) from dispute arbitration
6. ✅ Integrates seamlessly with existing rejection flow
7. ✅ Supports custom maxAttempts settings per conversation

The implementation completes Task 7.1.2 and sets the foundation for displaying arbitration results in the UI (Tasks 7.1.3 and 7.2).
