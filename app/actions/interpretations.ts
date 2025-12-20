'use server'

import { client } from '@/lib/db';
import type { Interpretation, InterpretationGrading, InterpretationGradingResponse, Arbitration } from '@/types/entities';
import { v4 as uuidv4 } from 'uuid';
import { calculateWordSimilarity } from '@/lib/word-similarity';
import { gradeInterpretation as gradeInterpretationAI } from '@/lib/ai/grade-interpretation';
import { arbitrateInterpretation as arbitrateInterpretationAI, arbitrateMaxAttempts as arbitrateMaxAttemptsAI } from '@/lib/ai/arbitrate-interpretation';
import { getMessageById, getConversationMessages } from './messages';
import { getConversationById } from './convos';

/**
 * Create an interpretation
 */
export async function createInterpretation(
  messageId: string,
  userId: number,
  text: string,
  attemptNumber: number
): Promise<Interpretation> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  
  await client.execute({
    sql: 'INSERT INTO interpretations (id, message_id, user_id, text, attempt_number, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [id, messageId, userId, text, attemptNumber, createdAt]
  });
  
  return { id, messageId, userId, text, attemptNumber, createdAt };
}

/**
 * Get all interpretations for a message, optionally filtered by user
 */
export async function getInterpretationsByMessage(messageId: string, userId?: number): Promise<Interpretation[]> {
  const sql = userId
    ? 'SELECT * FROM interpretations WHERE message_id = ? AND user_id = ? ORDER BY attempt_number DESC'
    : 'SELECT * FROM interpretations WHERE message_id = ? ORDER BY created_at DESC';
  const args = userId ? [messageId, userId] : [messageId];
  
  const result = await client.execute({ sql, args });
  
  return result.rows.map(row => ({
    id: row.id as string,
    messageId: row.message_id as string,
    userId: Number(row.user_id),
    text: row.text as string,
    attemptNumber: row.attempt_number as number,
    createdAt: row.created_at as string,
  }));
}

/**
 * Get interpretation by ID
 */
export async function getInterpretationById(id: string): Promise<Interpretation | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM interpretations WHERE id = ?',
    args: [id]
  });
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id as string,
    messageId: row.message_id as string,
    userId: Number(row.user_id),
    text: row.text as string,
    attemptNumber: row.attempt_number as number,
    createdAt: row.created_at as string,
  };
}

/**
 * Create an interpretation grading
 */
export async function createGrading(
  interpretationId: string,
  status: 'pending' | 'accepted' | 'rejected',
  similarityScore: number,
  autoAcceptSuggested: boolean,
  notes: string | null = null
): Promise<InterpretationGrading> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  
  await client.execute({
    sql: 'INSERT INTO interpretation_gradings (id, interpretation_id, status, similarity_score, auto_accept_suggested, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [id, interpretationId, status, similarityScore, autoAcceptSuggested ? 1 : 0, notes, createdAt]
  });
  
  return { id, interpretationId, status, similarityScore, autoAcceptSuggested, notes, createdAt };
}

/**
 * Get grading for an interpretation
 */
export async function getGradingByInterpretation(interpretationId: string): Promise<InterpretationGrading | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM interpretation_gradings WHERE interpretation_id = ?',
    args: [interpretationId]
  });
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id as string,
    interpretationId: row.interpretation_id as string,
    status: row.status as 'pending' | 'accepted' | 'rejected',
    similarityScore: row.similarity_score as number,
    autoAcceptSuggested: (row.auto_accept_suggested as number) === 1,
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
  };
}

/**
 * Get grading by ID
 */
export async function getGradingById(id: string): Promise<InterpretationGrading | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM interpretation_gradings WHERE id = ?',
    args: [id]
  });
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id as string,
    interpretationId: row.interpretation_id as string,
    status: row.status as 'pending' | 'accepted' | 'rejected',
    similarityScore: row.similarity_score as number,
    autoAcceptSuggested: (row.auto_accept_suggested as number) === 1,
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
  };
}

/**
 * Update grading status
 */
export async function updateGrading(
  id: string,
  updates: Partial<Omit<InterpretationGrading, 'id' | 'interpretationId' | 'createdAt'>>
): Promise<InterpretationGrading | null> {
  const setClauses: string[] = [];
  const args: any[] = [];
  
  if (updates.status !== undefined) {
    setClauses.push('status = ?');
    args.push(updates.status);
  }
  if (updates.similarityScore !== undefined) {
    setClauses.push('similarity_score = ?');
    args.push(updates.similarityScore);
  }
  if (updates.autoAcceptSuggested !== undefined) {
    setClauses.push('auto_accept_suggested = ?');
    args.push(updates.autoAcceptSuggested ? 1 : 0);
  }
  if (updates.notes !== undefined) {
    setClauses.push('notes = ?');
    args.push(updates.notes);
  }
  
  if (setClauses.length === 0) return null;
  
  args.push(id);
  await client.execute({
    sql: `UPDATE interpretation_gradings SET ${setClauses.join(', ')} WHERE id = ?`,
    args
  });
  
  const result = await client.execute({
    sql: 'SELECT * FROM interpretation_gradings WHERE id = ?',
    args: [id]
  });
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  const updatedGrading = {
    id: row.id as string,
    interpretationId: row.interpretation_id as string,
    status: row.status as 'pending' | 'accepted' | 'rejected',
    similarityScore: row.similarity_score as number,
    autoAcceptSuggested: (row.auto_accept_suggested as number) === 1,
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
  };
  
  // If status was updated to 'rejected', check if max attempts reached
  if (updates.status === 'rejected') {
    await triggerArbitrationForMaxAttempts(id);
  }
  
  return updatedGrading;
}

/**
 * Create a grading response (dispute)
 * Automatically triggers arbitration after the dispute is submitted
 */
export async function createGradingResponse(
  interpretationGradingId: string,
  text: string
): Promise<InterpretationGradingResponse> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  
  await client.execute({
    sql: 'INSERT INTO interpretation_grading_responses (id, interpretation_grading_id, text, created_at) VALUES (?, ?, ?, ?)',
    args: [id, interpretationGradingId, text, createdAt]
  });
  
  const response = { id, interpretationGradingId, text, createdAt };
  
  // Automatically trigger arbitration after dispute submission
  await triggerArbitrationForDispute(interpretationGradingId, id, text);
  
  return response;
}

/**
 * Get grading response for a grading
 */
export async function getGradingResponse(interpretationGradingId: string): Promise<InterpretationGradingResponse | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM interpretation_grading_responses WHERE interpretation_grading_id = ?',
    args: [interpretationGradingId]
  });
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id as string,
    interpretationGradingId: row.interpretation_grading_id as string,
    text: row.text as string,
    createdAt: row.created_at as string,
  };
}

/**
 * Create an arbitration
 */
export async function createArbitration(
  messageId: string,
  interpretationId: string,
  interpretationGradingId: string,
  interpretationGradingResponseId: string | null,
  result: 'accept' | 'reject',
  rulingStatus: string,
  explanation: string
): Promise<Arbitration> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  
  await client.execute({
    sql: 'INSERT INTO arbitrations (id, message_id, interpretation_id, interpretation_grading_id, interpretation_grading_response_id, result, ruling_status, explanation, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [id, messageId, interpretationId, interpretationGradingId, interpretationGradingResponseId, result, rulingStatus, explanation, createdAt]
  });
  
  return { id, messageId, interpretationId, interpretationGradingId, interpretationGradingResponseId, result, rulingStatus, explanation, createdAt };
}

/**
 * Get arbitration for an interpretation
 */
export async function getArbitrationByInterpretation(interpretationId: string): Promise<Arbitration | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM arbitrations WHERE interpretation_id = ?',
    args: [interpretationId]
  });
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id as string,
    messageId: row.message_id as string,
    interpretationId: row.interpretation_id as string,
    interpretationGradingId: row.interpretation_grading_id as string,
    interpretationGradingResponseId: row.interpretation_grading_response_id as string | null,
    result: row.result as 'accept' | 'reject',
    rulingStatus: row.ruling_status as string,
    explanation: row.explanation as string,
    createdAt: row.created_at as string,
  };
}

/**
 * Trigger arbitration for a disputed interpretation
 * Called automatically when a dispute is submitted
 */
async function triggerArbitrationForDispute(
  interpretationGradingId: string,
  responseId: string,
  disputeText: string
): Promise<void> {
  // Get the grading by its ID
  const grading = await getGradingById(interpretationGradingId);
  if (!grading) {
    throw new Error('Grading not found');
  }

  // Get the interpretation
  const interpretation = await getInterpretationById(grading.interpretationId);
  if (!interpretation) {
    throw new Error('Interpretation not found');
  }

  // Get the original message
  const message = await getMessageById(interpretation.messageId);
  if (!message) {
    throw new Error('Original message not found');
  }

  // Get all conversation messages for context
  const conversationMessages = await getConversationMessages(message.convoId);

  // Call AI arbitration with full context
  const arbitrationResult = await arbitrateInterpretationAI(
    message,
    interpretation.text,
    conversationMessages,
    grading.notes,
    disputeText
  );

  // Create arbitration record
  await createArbitration(
    message.id,
    interpretation.id,
    grading.id,
    responseId,
    arbitrationResult.result,
    'complete', // ruling status
    arbitrationResult.explanation
  );
}

/**
 * Trigger arbitration when max interpretation attempts are reached
 * Called automatically when the final attempt is rejected
 */
async function triggerArbitrationForMaxAttempts(
  interpretationGradingId: string
): Promise<void> {
  // Get the grading by its ID
  const grading = await getGradingById(interpretationGradingId);
  if (!grading) {
    throw new Error('Grading not found');
  }

  // Get the interpretation
  const interpretation = await getInterpretationById(grading.interpretationId);
  if (!interpretation) {
    throw new Error('Interpretation not found');
  }

  // Get the original message
  const message = await getMessageById(interpretation.messageId);
  if (!message) {
    throw new Error('Original message not found');
  }

  // Get the conversation to check max attempts
  const convo = await getConversationById(message.convoId);
  if (!convo) {
    throw new Error('Conversation not found');
  }

  // Verify this is actually the max attempt
  if (interpretation.attemptNumber < convo.maxAttempts) {
    // Not at max attempts yet, don't trigger arbitration
    return;
  }

  // Check if arbitration already exists for this interpretation
  const existingArbitration = await getArbitrationByInterpretation(interpretation.id);
  if (existingArbitration) {
    // Arbitration already triggered, don't duplicate
    return;
  }

  // Get all conversation messages for context
  const conversationMessages = await getConversationMessages(message.convoId);

  // Call AI arbitration for max attempts
  const arbitrationResult = await arbitrateMaxAttemptsAI(
    message,
    interpretation.text,
    conversationMessages,
    interpretation.attemptNumber
  );

  // Create arbitration record (no responseId since this wasn't triggered by a dispute)
  await createArbitration(
    message.id,
    interpretation.id,
    grading.id,
    null, // No dispute response ID for max attempts arbitration
    arbitrationResult.result,
    'complete', // ruling status
    arbitrationResult.explanation
  );
}

/**
 * Grade an interpretation using AI similarity scoring
 * This function:
 * 1. Calls the AI grading function to calculate semantic similarity and accuracy
 * 2. Checks for too-similar wording (>70% word overlap) - still auto-rejects on this
 * 3. Creates an InterpretationGrading record with appropriate status
 * 4. Auto-rejects if wording is too similar (word overlap check)
 * 5. Sets status based on AI judgment (pending if not auto-accepted)
 * 
 * @param interpretationId The interpretation to grade
 * @returns The created grading record
 */
export async function gradeInterpretation(
  interpretationId: string
): Promise<InterpretationGrading> {
  // Get the interpretation
  const interpretation = await getInterpretationById(interpretationId);
  if (!interpretation) {
    throw new Error('Interpretation not found');
  }

  // Get the original message
  const message = await getMessageById(interpretation.messageId);
  if (!message) {
    throw new Error('Original message not found');
  }

  // Get all conversation messages for context (excluding interpretations)
  const conversationMessages = await getConversationMessages(message.convoId);

  // Calculate AI similarity score and judgment
  const aiResult = await gradeInterpretationAI(message, interpretation.text, conversationMessages);

  // Check for too-similar wording (word overlap) - still apply this check
  const wordSimilarity = calculateWordSimilarity(message.text, interpretation.text);

  // Determine status:
  // - Auto-reject if word overlap > 70% (too similar wording)
  // - Auto-accept if AI suggests it (score >= 90 and passes === true)
  // - Otherwise, 'pending' (author must manually accept/reject)
  let status: 'pending' | 'accepted' | 'rejected';
  let notes: string | null = null;

  if (wordSimilarity.shouldAutoReject) {
    status = 'rejected';
    notes = `Automatically rejected: ${Math.round(wordSimilarity.similarity * 100)}% word overlap (threshold: 70%). Please use different wording to demonstrate understanding.`;
  } else if (aiResult.autoAcceptSuggested && aiResult.passes) {
    status = 'accepted';
    notes = `AI suggested auto-accept: ${aiResult.similarityScore.toFixed(1)}% similarity. ${aiResult.reasoning}`;
  } else {
    // Below auto-accept threshold or AI says it doesn't pass
    status = 'pending';
    notes = aiResult.reasoning; // Include AI reasoning for author review
  }

  // Create the grading record
  const grading = await createGrading(
    interpretationId,
    status,
    aiResult.similarityScore,
    aiResult.autoAcceptSuggested,
    notes
  );
  
  // If auto-rejected and max attempts reached, trigger arbitration
  if (status === 'rejected') {
    await triggerArbitrationForMaxAttempts(grading.id);
  }

  return grading;
}

