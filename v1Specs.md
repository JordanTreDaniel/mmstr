# MMSTR - Updated Spec v2

Build a full-stack web app called **"MMSTR"** based on **"Make Me Say That's Right"** by Chris Voss. It is a turn-based discussion tool that enforces comprehension before rebuttal.

## Tech Stack (MVP):
- **Frontend**: Next.js + React + Tailwind CSS
- **State**: In-memory (useState/Context) + localStorage for persistence
- **AI**: Mocked with setTimeout + random scores (placeholder for future Langchain)
- **Backend**: Next.js server functions (mocked for v1)

---

## Core Features:

### 1. Conversations:
- Users can create a new discussion (thread)
- Thread has a unique ID so other parties may join (limit 20 participants)
- Title
- No "complete" state in v1 - conversations persist indefinitely

### 2. Messages & Their Points:
- Each message is broken down into **assertions/points/questions** (atomic claims)
- AI breakdowns are INTERNAL ONLY (not shown to users, used for granular comparison)
- Messages can reference older messages (iPhone-style "replying to" with snippet)
- Main thread view shows only messages, not interpretation sub-conversations
- **Character limits**:
  - Max: 280 characters per message
  - Min: 10 characters (3+ words)
  - Messages under minimum do NOT require interpretation to respond
- **Message status icons** (half-overlaid on message card):
  - 🧠 Brain: Open interpretation modal
  - 💬 Speaking: Interpretation accepted, can now respond
  - ✓ Checkmark: Interpretation completed and accepted

### 3. Interpretations:
- **Replier must interpret the ENTIRE message** covering every point before they can reply
- Creates new "interpretation" linked to that message and replier's ID
- Interpretation unlocks ability to respond
- **Writing interpretations**:
  - Original message is HIDDEN while writing interpretation
  - Users can toggle back to view original, but cannot see both simultaneously
  - Track view count in background (how many times they looked back)
- **Grading**:
  - Vectors determine similarity between original and interpretation
  - High meaning similarity + different wording = best score
  - **Auto-reject if too similar wording**: >70% same words = automatic rejection
  - Auto-accept threshold: configurable per user (default 90%+)
  - Auto-accept is a suggestion; only human can truly accept (except in arbitration)
  - Users see score even if auto-accepted
- **Attempt limits**: Up to 3 attempts per message (configurable by conversation creator)
- All interpretations/gradings/responses shown in expandable modal, NOT in main thread

### 4. Arbitration:
- **Triggers**: 
  - After 3 failed interpretation attempts, OR
  - When interpreter disputes a rejection
- AI arbitrates whether interpretation was accurate
- Mock function for v1: simulates LLM judgment
- AI grades each point of message: yes/no on interpretation accuracy
- If AI must step in, someone loses points (future feature)

### 5. Data Models:
Use these entities (localStorage/in-memory for v1):

- `Convo` (id, title, created_at, max_attempts, participant_limit)
  - has many `Participation` (user_id, convo_id)
  - has many `Message`

- `Message` (id, text, user_id, convo_id, replying_to_message_id, created_at)
  - has one `Breakdown` (for display)
  - has many `Interpretation` (from different users)

- `Breakdown` (id, message_id OR interpretation_id, created_at)
  - has many `Point`

- `Point` (id, breakdown_id, text, order)

- `Interpretation` (id, message_id, user_id, text, attempt_number, created_at)
  - has one `Breakdown`
  - has one `Interpretation_Grading`

- `Interpretation_Grading` (id, interpretation_id, status [pending/accepted/rejected], similarity_score, auto_accept_suggested, notes, created_at)
  - has zero or one `Interpretation_Grading_Response`

- `Interpretation_Grading_Response` (id, interpretation_grading_id, text, created_at)
  - triggers `Arbitration` if author still rejects

- `Arbitration` (id, message_id, interpretation_id, interpretation_grading_id, interpretation_grading_response_id, result [accept/reject], ruling_status, explanation, created_at)

### 6. UI/UX:

#### Landing Page:
- Hero section explaining MMSTR
- "New Conversation" button

**What is MMSTR?**
- "Make Me Say That's Right" - a negotiation technique by Chris Voss

**How does it work?**
- Before responding, you must restate what the other person said in your own words
- They must confirm you understood correctly
- Only then can you reply

**How does it help?**
- Ensures clarity: confirms what you said vs what they heard
- Prevents looping arguments and misunderstandings
- Blocks dirty tactics: strawmanning, intentional misinterpretations
- Teaches active listening
- Makes people feel heard, opening them to disagreement
- Eliminates "yeah yeah I understand" bullshit - prove it by restating

#### Thread View:
- Linear, sequential message thread
- iPhone-style "replying to" indicators with message snippets
- Each message expandable via modal

#### Message Modal:
Shows progression (only displays what's been reached):
1. Original message + breakdown
2. Interpretation(s) from repliers
3. Grading from author (accept/reject + score + notes)
4. Grading response (if rejected and disputed)
5. Arbitration (if triggered)

**Author Actions:**
- Review interpretation point-by-point
- Grade each point individually (Pass/Fail)
- Accept or reject overall with notes
- See similarity score and auto-accept suggestion

**Replier Actions:**
- Submit interpretation (covering all points)
- See their attempt count (X of 3)
- Respond to rejection if they dispute it
- Once accepted, unlock ability to post reply message

**Visual Indicators:**
- Green checkmark: interpretation accepted
- Yellow warning: interpretation rejected, can retry
- Red X: max attempts reached or arbitration needed
- Blue info: arbitration in progress/complete

### 7. Bonus Features:
- Track comprehension success rate per user (future)
- Store all interactions for replay/export (future)
- User settings for auto-accept threshold and max attempts

---

## MVP Goals:
1. Working Next.js app with clean Tailwind UI
2. In-memory state + localStorage persistence
3. Full interpretation flow with mocked AI scoring
4. Modal-based interaction system
5. iPhone-style reply threading
6. Deploy as working prototype enforcing comprehension before response

## What's Mocked:
- AI breakdown suggestions (random bullet points)
- Similarity scoring (random 70-95%)
- Arbitration judgments (coin flip with explanation)