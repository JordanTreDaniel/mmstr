'use server'

import { client } from '@/lib/db';
import type { Convo } from '@/types/entities';
import { v4 as uuidv4 } from 'uuid';
import { getUserById } from './users';
import { addParticipation } from './participations';

/**
 * Create a new conversation and add the creator as a participant
 */
export async function createConversation(
  title: string,
  creatorUserId: number,
  creatorUserName: string,
  maxAttempts: number = 3,
  participantLimit: number = 20
): Promise<Convo> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  
  // Validate creator exists in database
  const user = await getUserById(creatorUserId);
  if (!user) {
    throw new Error(`User with ID ${creatorUserId} not found. Cannot create conversation.`);
  }
  
  // Create conversation
  await client.execute({
    sql: 'INSERT INTO convos (id, title, created_at, max_attempts, participant_limit) VALUES (?, ?, ?, ?, ?)',
    args: [id, title, createdAt, maxAttempts, participantLimit]
  });
  
  // Add creator as participant
  await addParticipation(creatorUserId, id);
  
  return { id, title, createdAt, maxAttempts, participantLimit };
}

/**
 * Get all conversations ordered by creation date (newest first)
 */
export async function getConversations(): Promise<Convo[]> {
  const result = await client.execute('SELECT * FROM convos ORDER BY created_at DESC');
  return result.rows.map(row => ({
    id: row.id as string,
    title: row.title as string,
    createdAt: row.created_at as string,
    maxAttempts: row.max_attempts as number,
    participantLimit: row.participant_limit as number,
  }));
}

/**
 * Get a single conversation by ID
 */
export async function getConversationById(id: string): Promise<Convo | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM convos WHERE id = ?',
    args: [id]
  });
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id as string,
    title: row.title as string,
    createdAt: row.created_at as string,
    maxAttempts: row.max_attempts as number,
    participantLimit: row.participant_limit as number,
  };
}

/**
 * Update a conversation
 */
export async function updateConversation(
  id: string,
  updates: Partial<Omit<Convo, 'id' | 'createdAt'>>
): Promise<Convo | null> {
  const setClauses: string[] = [];
  const args: any[] = [];
  
  if (updates.title !== undefined) {
    setClauses.push('title = ?');
    args.push(updates.title);
  }
  if (updates.maxAttempts !== undefined) {
    setClauses.push('max_attempts = ?');
    args.push(updates.maxAttempts);
  }
  if (updates.participantLimit !== undefined) {
    setClauses.push('participant_limit = ?');
    args.push(updates.participantLimit);
  }
  
  if (setClauses.length === 0) return null;
  
  args.push(id);
  await client.execute({
    sql: `UPDATE convos SET ${setClauses.join(', ')} WHERE id = ?`,
    args
  });
  
  return getConversationById(id);
}

/**
 * Delete a conversation
 */
export async function deleteConversation(id: string): Promise<boolean> {
  await client.execute({
    sql: 'DELETE FROM convos WHERE id = ?',
    args: [id]
  });
  return true;
}

