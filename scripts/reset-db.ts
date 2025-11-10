#!/usr/bin/env tsx
/**
 * Database Reset Script
 * Completely wipes and reinitializes the database
 * 
 * Usage: npm run db:reset
 */

import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';

async function resetDatabase() {
  const dataDir = path.join(process.cwd(), 'data');
  const dbPath = path.join(dataDir, 'app.db');
  
  console.log('🗑️  Deleting old database...');
  
  // Remove database file and any lock files
  const files = fs.readdirSync(dataDir).filter(f => f.startsWith('app.db'));
  files.forEach(file => {
    const filePath = path.join(dataDir, file);
    fs.unlinkSync(filePath);
    console.log(`   Deleted: ${file}`);
  });
  
  console.log('✅ Old database removed\n');
  
  console.log('📝 Creating fresh database with schema...');
  const client = createClient({
    url: `file:${dbPath}`
  });
  
  // Create all tables
  await client.execute(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  console.log('   ✓ users table');
  
  await client.execute(`
    CREATE TABLE convos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      max_attempts INTEGER DEFAULT 3,
      participant_limit INTEGER DEFAULT 20
    )
  `);
  console.log('   ✓ convos table');
  
  await client.execute(`
    CREATE TABLE messages (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      convo_id TEXT NOT NULL,
      replying_to_message_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (convo_id) REFERENCES convos(id)
    )
  `);
  console.log('   ✓ messages table');
  
  await client.execute(`
    CREATE TABLE breakdowns (
      id TEXT PRIMARY KEY,
      message_id TEXT,
      interpretation_id TEXT,
      created_at TEXT NOT NULL
    )
  `);
  console.log('   ✓ breakdowns table');
  
  await client.execute(`
    CREATE TABLE points (
      id TEXT PRIMARY KEY,
      breakdown_id TEXT NOT NULL,
      text TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      FOREIGN KEY (breakdown_id) REFERENCES breakdowns(id)
    )
  `);
  console.log('   ✓ points table');
  
  await client.execute(`
    CREATE TABLE interpretations (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      attempt_number INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (message_id) REFERENCES messages(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  console.log('   ✓ interpretations table');
  
  await client.execute(`
    CREATE TABLE interpretation_gradings (
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
  console.log('   ✓ interpretation_gradings table');
  
  await client.execute(`
    CREATE TABLE interpretation_grading_responses (
      id TEXT PRIMARY KEY,
      interpretation_grading_id TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (interpretation_grading_id) REFERENCES interpretation_gradings(id)
    )
  `);
  console.log('   ✓ interpretation_grading_responses table');
  
  await client.execute(`
    CREATE TABLE arbitrations (
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
  console.log('   ✓ arbitrations table');
  
  await client.execute(`
    CREATE TABLE participations (
      user_id INTEGER NOT NULL,
      convo_id TEXT NOT NULL,
      PRIMARY KEY (user_id, convo_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (convo_id) REFERENCES convos(id)
    )
  `);
  console.log('   ✓ participations table');
  
  console.log('\n✅ Database schema created successfully!\n');
  
  // Test AUTOINCREMENT
  console.log('🧪 Verifying AUTOINCREMENT...');
  const result = await client.execute({
    sql: 'INSERT INTO users (name, created_at) VALUES (?, ?) RETURNING id',
    args: ['Test User', new Date().toISOString()]
  });
  
  const userId = Number(result.rows[0].id);
  console.log(`   First user ID: ${userId}`);
  
  if (userId === 1) {
    console.log('   ✅ AUTOINCREMENT working correctly!');
  } else {
    console.warn(`   ⚠️  Expected ID 1, got ${userId}`);
  }
  
  // Clean up test user
  await client.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [userId] });
  
  console.log('\n✨ Database reset complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Restart your dev server');
  console.log('   2. Clear localStorage in browser (DevTools → Application → Local Storage)');
  console.log('   3. Refresh the page\n');
}

resetDatabase().catch((error) => {
  console.error('❌ Error resetting database:', error);
  process.exit(1);
});

