'use server'

import { client } from '@/lib/db';
import type { Participation } from '@/types/entities';

/**
 * Add user participation to a conversation
 */
export async function addParticipation(userId: string, convoId: string): Promise<boolean> {
  try {
    await client.execute({
      sql: 'INSERT INTO participations (user_id, convo_id) VALUES (?, ?)',
      args: [userId, convoId]
    });
    return true;
  } catch (error) {
    // Already exists or other error
    return false;
  }
}

/**
 * Remove user from a conversation
 */
export async function removeParticipation(userId: string, convoId: string): Promise<boolean> {
  await client.execute({
    sql: 'DELETE FROM participations WHERE user_id = ? AND convo_id = ?',
    args: [userId, convoId]
  });
  return true;
}

/**
 * Get all participants in a conversation
 */
export async function getConversationParticipants(convoId: string): Promise<Participation[]> {
  const result = await client.execute({
    sql: 'SELECT * FROM participations WHERE convo_id = ?',
    args: [convoId]
  });
  
  return result.rows.map(row => ({
    userId: row.user_id as string,
    convoId: row.convo_id as string,
  }));
}

/**
 * Check if a user is participating in a conversation
 */
export async function isUserParticipating(userId: string, convoId: string): Promise<boolean> {
  const result = await client.execute({
    sql: 'SELECT COUNT(*) as count FROM participations WHERE user_id = ? AND convo_id = ?',
    args: [userId, convoId]
  });
  
  return (result.rows[0].count as number) > 0;
}

