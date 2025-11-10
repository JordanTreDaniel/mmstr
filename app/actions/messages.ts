'use server'

import { client } from '@/lib/db';
import type { Message } from '@/types/entities';
import { v4 as uuidv4 } from 'uuid';
import { ensureUser, getUserById } from './users';
import { addParticipation } from './participations';

/**
 * Message validation constraints
 */
const MESSAGE_MIN_LENGTH = 10;
const MESSAGE_MAX_LENGTH = 280;

/**
 * Create a new message
 * Ensures user exists in DB and is a participant in the conversation
 */
export async function createMessage(
  text: string,
  userId: string,
  convoId: string,
  replyingToMessageId?: string | null
): Promise<Message | null> {
  // Validate text length (10-280 characters as per spec)
  const trimmedText = text.trim();
  if (trimmedText.length < MESSAGE_MIN_LENGTH || trimmedText.length > MESSAGE_MAX_LENGTH) {
    return null;
  }
  
  // Get user from DB to ensure they exist
  const user = await getUserById(userId);
  if (!user) {
    // User doesn't exist in DB, cannot create message
    console.error(`User ${userId} not found in database`);
    return null;
  }
  
  // Ensure user is a participant in the conversation
  await addParticipation(userId, convoId);
  
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  
  await client.execute({
    sql: 'INSERT INTO messages (id, text, user_id, convo_id, replying_to_message_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [id, trimmedText, userId, convoId, replyingToMessageId || null, createdAt]
  });
  
  return {
    id,
    text: trimmedText,
    userId,
    convoId,
    replyingToMessageId: replyingToMessageId || null,
    createdAt
  };
}

/**
 * Get all messages for a conversation (ordered chronologically)
 */
export async function getConversationMessages(convoId: string): Promise<Message[]> {
  const result = await client.execute({
    sql: 'SELECT * FROM messages WHERE convo_id = ? ORDER BY created_at ASC',
    args: [convoId]
  });
  
  return result.rows.map(row => ({
    id: row.id as string,
    text: row.text as string,
    userId: row.user_id as string,
    convoId: row.convo_id as string,
    replyingToMessageId: row.replying_to_message_id as string | null,
    createdAt: row.created_at as string,
  }));
}

/**
 * Get a single message by ID
 */
export async function getMessageById(id: string): Promise<Message | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM messages WHERE id = ?',
    args: [id]
  });
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id as string,
    text: row.text as string,
    userId: row.user_id as string,
    convoId: row.convo_id as string,
    replyingToMessageId: row.replying_to_message_id as string | null,
    createdAt: row.created_at as string,
  };
}

/**
 * Delete a message
 */
export async function deleteMessage(id: string): Promise<boolean> {
  await client.execute({
    sql: 'DELETE FROM messages WHERE id = ?',
    args: [id]
  });
  return true;
}

