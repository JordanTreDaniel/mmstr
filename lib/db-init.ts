/**
 * Database initialization wrapper
 * Ensures database is initialized before the app starts
 */

import { initializeDatabase } from './db';

let initialized = false;

/**
 * Initialize database once
 * Safe to call multiple times - will only initialize once
 */
export async function ensureDbInitialized() {
  if (!initialized) {
    await initializeDatabase();
    initialized = true;
    console.log('✓ Database initialized');
  }
}

