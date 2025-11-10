'use server'

import { client } from '@/lib/db';
import type { User } from '@/types/entities';

/**
 * Ensure a user exists in the database
 * Creates the user if they don't exist, otherwise returns existing user
 */
export async function ensureUser(id: string, name: string): Promise<User> {
  // Check if user exists
  const existing = await getUserById(id);
  if (existing) {
    return existing;
  }
  
  // Create new user
  const createdAt = new Date().toISOString();
  await client.execute({
    sql: 'INSERT INTO users (id, name, created_at) VALUES (?, ?, ?)',
    args: [id, name, createdAt]
  });
  
  return { id, name, createdAt };
}

/**
 * Get a user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [id]
  });
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id as string,
    name: row.name as string,
    createdAt: row.created_at as string,
  };
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
  const result = await client.execute('SELECT * FROM users ORDER BY created_at ASC');
  return result.rows.map(row => ({
    id: row.id as string,
    name: row.name as string,
    createdAt: row.created_at as string,
  }));
}

/**
 * Update a user's name
 */
export async function updateUserName(id: string, name: string): Promise<User | null> {
  await client.execute({
    sql: 'UPDATE users SET name = ? WHERE id = ?',
    args: [name, id]
  });
  
  return getUserById(id);
}

/**
 * Delete a user
 */
export async function deleteUser(id: string): Promise<boolean> {
  await client.execute({
    sql: 'DELETE FROM users WHERE id = ?',
    args: [id]
  });
  return true;
}

