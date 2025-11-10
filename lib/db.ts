/**
 * SQLite Database Client and Schema
 * Uses @libsql/client in local file mode for persistent storage
 */

import { createClient, Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';

// Lazy-initialized client
let _client: Client | null = null;

function getClient(): Client {
  if (!_client) {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dbPath = path.join(dataDir, 'app.db');
    _client = createClient({
      url: `file:${dbPath}`
    });
  }
  return _client;
}

// Export client accessor
export const client = new Proxy({} as Client, {
  get(target, prop) {
    const client = getClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

/**
 * Initialize database schema
 * Creates all required tables if they don't exist
 */
export async function initializeDatabase() {
  const db = getClient();
  // Execute each CREATE TABLE statement separately
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS convos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      max_attempts INTEGER DEFAULT 3,
      participant_limit INTEGER DEFAULT 20
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      user_id TEXT NOT NULL,
      convo_id TEXT NOT NULL,
      replying_to_message_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (convo_id) REFERENCES convos(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS breakdowns (
      id TEXT PRIMARY KEY,
      message_id TEXT,
      interpretation_id TEXT,
      created_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS points (
      id TEXT PRIMARY KEY,
      breakdown_id TEXT NOT NULL,
      text TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      FOREIGN KEY (breakdown_id) REFERENCES breakdowns(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS interpretations (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      text TEXT NOT NULL,
      attempt_number INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (message_id) REFERENCES messages(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS interpretation_gradings (
      id TEXT PRIMARY KEY,
      interpretation_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected')),
      similarity_score REAL NOT NULL,
      auto_accept_suggested INTEGER NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (interpretation_id) REFERENCES interpretations(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS interpretation_grading_responses (
      id TEXT PRIMARY KEY,
      interpretation_grading_id TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (interpretation_grading_id) REFERENCES interpretation_gradings(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS arbitrations (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      interpretation_id TEXT NOT NULL,
      interpretation_grading_id TEXT NOT NULL,
      interpretation_grading_response_id TEXT,
      result TEXT NOT NULL CHECK(result IN ('accept', 'reject')),
      ruling_status TEXT NOT NULL,
      explanation TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (message_id) REFERENCES messages(id),
      FOREIGN KEY (interpretation_id) REFERENCES interpretations(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS participations (
      user_id TEXT NOT NULL,
      convo_id TEXT NOT NULL,
      PRIMARY KEY (user_id, convo_id),
      FOREIGN KEY (convo_id) REFERENCES convos(id)
    )
  `);
}

// Export for use in server actions
export default client;

