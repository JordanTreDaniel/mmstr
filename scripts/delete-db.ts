/**
 * Script to delete the database file
 * Run with: npx tsx scripts/delete-db.ts
 * Then restart your dev server
 */

import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'app.db');

try {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✓ Database file deleted successfully');
    console.log('  Path:', dbPath);
    console.log('\n⚠️  Please RESTART your dev server now to reinitialize the database');
  } else {
    console.log('✓ Database file does not exist');
    console.log('  Path:', dbPath);
  }
} catch (error) {
  console.error('✗ Error deleting database:', error);
  process.exit(1);
}

