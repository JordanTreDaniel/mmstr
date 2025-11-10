// MMSTR - Data Entity Type Definitions

/**
 * User entity
 * Represents a participant in the MMSTR discussion platform
 */
export interface User {
  id: number; // Auto-increment from SQLite
  name: string;
  createdAt: string;
}

/**
 * Convo (Conversation) entity
 * Represents a discussion thread
 */
export interface Convo {
  id: string;
  title: string;
  createdAt: string;
  maxAttempts: number; // Max interpretation attempts (default 3)
  participantLimit: number; // Max participants allowed (default 20)
}

/**
 * Participation entity
 * Links users to conversations they participate in
 */
export interface Participation {
  userId: number;
  convoId: string;
}

/**
 * Message entity
 * Represents a single message in a conversation
 */
export interface Message {
  id: string;
  text: string; // 10-280 characters
  userId: number;
  convoId: string;
  replyingToMessageId: string | null; // null for root messages
  createdAt: string;
}

/**
 * Breakdown entity
 * AI-generated breakdown of a message or interpretation into atomic points
 */
export interface Breakdown {
  id: string;
  messageId: string | null; // For message breakdowns
  interpretationId: string | null; // For interpretation breakdowns
  createdAt: string;
}

/**
 * Point entity
 * Individual atomic claim/assertion/question from a breakdown
 */
export interface Point {
  id: string;
  breakdownId: string;
  text: string;
  order: number; // Sequence order in the breakdown
}

/**
 * Interpretation entity
 * User's restatement of a message in their own words
 */
export interface Interpretation {
  id: string;
  messageId: string;
  userId: number;
  text: string;
  attemptNumber: number; // 1, 2, or 3 (or custom max)
  createdAt: string;
}

/**
 * InterpretationGrading entity
 * Evaluation of an interpretation by the original message author
 */
export interface InterpretationGrading {
  id: string;
  interpretationId: string;
  status: 'pending' | 'accepted' | 'rejected';
  similarityScore: number; // 0-100, from AI similarity check
  autoAcceptSuggested: boolean; // true if score >= auto-accept threshold
  notes: string | null; // Optional feedback from author
  createdAt: string;
}

/**
 * InterpretationGradingResponse entity
 * Interpreter's response to a rejection (dispute)
 */
export interface InterpretationGradingResponse {
  id: string;
  interpretationGradingId: string;
  text: string; // Interpreter's explanation of why rejection is unfair
  createdAt: string;
}

/**
 * Arbitration entity
 * AI-mediated resolution when human agreement fails
 */
export interface Arbitration {
  id: string;
  messageId: string;
  interpretationId: string;
  interpretationGradingId: string;
  interpretationGradingResponseId: string | null; // null if triggered by max attempts
  result: 'accept' | 'reject';
  rulingStatus: string; // Status of the arbitration process
  explanation: string; // AI's reasoning for the decision
  createdAt: string;
}
