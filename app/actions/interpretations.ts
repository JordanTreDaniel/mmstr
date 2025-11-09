'use server'

import { client } from '@/lib/db';
import type { Interpretation, InterpretationGrading, InterpretationGradingResponse, Arbitration } from '@/types/entities';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create an interpretation
 */
export async function createInterpretation(
  messageId: string,
  userId: string,
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
export async function getInterpretationsByMessage(messageId: string, userId?: string): Promise<Interpretation[]> {
  const sql = userId
    ? 'SELECT * FROM interpretations WHERE message_id = ? AND user_id = ? ORDER BY attempt_number DESC'
    : 'SELECT * FROM interpretations WHERE message_id = ? ORDER BY created_at DESC';
  const args = userId ? [messageId, userId] : [messageId];
  
  const result = await client.execute({ sql, args });
  
  return result.rows.map(row => ({
    id: row.id as string,
    messageId: row.message_id as string,
    userId: row.user_id as string,
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
    userId: row.user_id as string,
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
 * Create a grading response (dispute)
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
  
  return { id, interpretationGradingId, text, createdAt };
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

