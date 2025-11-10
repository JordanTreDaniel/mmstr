'use server'

import { client } from '@/lib/db';
import type { Participation } from '@/types/entities';

/**
 * Add a user to a conversation (if not already participating)
 */
export async function addParticipation(userId: string, convoId: string): Promise<Participation> {
  // Check if already participating
  const existing = await getParticipation(userId, convoId);
  if (existing) {
    return existing;
  }
  
  // Add participation
  await client.execute({
    sql: 'INSERT INTO participations (user_id, convo_id) VALUES (?, ?)',
    args: [userId, convoId]
  });
  
  return { userId, convoId };
}

/**
 * Get a specific participation
 */
export async function getParticipation(userId: string, convoId: string): Promise<Participation | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM participations WHERE user_id = ? AND convo_id = ?',
    args: [userId, convoId]
  });
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    userId: row.user_id as string,
    convoId: row.convo_id as string,
  };
}

/**
 * Get all conversations a user is participating in
 */
export async function getUserParticipations(userId: string): Promise<string[]> {
  const result = await client.execute({
    sql: 'SELECT convo_id FROM participations WHERE user_id = ?',
    args: [userId]
  });
  
  return result.rows.map(row => row.convo_id as string);
}

/**
 * Get all users participating in a conversation
 */
export async function getConversationParticipants(convoId: string): Promise<string[]> {
  const result = await client.execute({
    sql: 'SELECT user_id FROM participations WHERE convo_id = ?',
    args: [convoId]
  });
  
  return result.rows.map(row => row.user_id as string);
}

/**
 * Remove a user from a conversation
 */
export async function removeParticipation(userId: string, convoId: string): Promise<boolean> {
  await client.execute({
    sql: 'DELETE FROM participations WHERE user_id = ? AND convo_id = ?',
    args: [userId, convoId]
  });
  return true;
}

/**
 * Check if a user is participating in a conversation
 */
export async function isUserParticipating(userId: string, convoId: string): Promise<boolean> {
  const participation = await getParticipation(userId, convoId);
  return participation !== null;
}
