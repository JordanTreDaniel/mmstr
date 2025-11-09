'use server'

import { client } from '@/lib/db';
import type { Breakdown, Point } from '@/types/entities';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a breakdown for a message or interpretation
 */
export async function createBreakdown(
  messageId: string | null,
  interpretationId: string | null
): Promise<Breakdown> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  
  await client.execute({
    sql: 'INSERT INTO breakdowns (id, message_id, interpretation_id, created_at) VALUES (?, ?, ?, ?)',
    args: [id, messageId, interpretationId, createdAt]
  });
  
  return { id, messageId, interpretationId, createdAt };
}

/**
 * Create a point for a breakdown
 */
export async function createPoint(
  breakdownId: string,
  text: string,
  order: number
): Promise<Point> {
  const id = uuidv4();
  
  await client.execute({
    sql: 'INSERT INTO points (id, breakdown_id, text, "order") VALUES (?, ?, ?, ?)',
    args: [id, breakdownId, text, order]
  });
  
  return { id, breakdownId, text, order };
}

/**
 * Get all points for a breakdown (ordered by order field)
 */
export async function getBreakdownPoints(breakdownId: string): Promise<Point[]> {
  const result = await client.execute({
    sql: 'SELECT * FROM points WHERE breakdown_id = ? ORDER BY "order" ASC',
    args: [breakdownId]
  });
  
  return result.rows.map(row => ({
    id: row.id as string,
    breakdownId: row.breakdown_id as string,
    text: row.text as string,
    order: row.order as number,
  }));
}

/**
 * Get breakdown by ID
 */
export async function getBreakdownById(id: string): Promise<Breakdown | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM breakdowns WHERE id = ?',
    args: [id]
  });
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id as string,
    messageId: row.message_id as string | null,
    interpretationId: row.interpretation_id as string | null,
    createdAt: row.created_at as string,
  };
}

/**
 * Get breakdown for a message
 */
export async function getMessageBreakdown(messageId: string): Promise<Breakdown | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM breakdowns WHERE message_id = ?',
    args: [messageId]
  });
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id as string,
    messageId: row.message_id as string | null,
    interpretationId: row.interpretation_id as string | null,
    createdAt: row.created_at as string,
  };
}

/**
 * Get breakdown for an interpretation
 */
export async function getInterpretationBreakdown(interpretationId: string): Promise<Breakdown | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM breakdowns WHERE interpretation_id = ?',
    args: [interpretationId]
  });
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id as string,
    messageId: row.message_id as string | null,
    interpretationId: row.interpretation_id as string | null,
    createdAt: row.created_at as string,
  };
}

/**
 * Delete a breakdown and its points
 */
export async function deleteBreakdown(id: string): Promise<boolean> {
  // Delete points first
  await client.execute({
    sql: 'DELETE FROM points WHERE breakdown_id = ?',
    args: [id]
  });
  
  // Delete breakdown
  await client.execute({
    sql: 'DELETE FROM breakdowns WHERE id = ?',
    args: [id]
  });
  
  return true;
}

