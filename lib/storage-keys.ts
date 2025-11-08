/**
 * Constants for all localStorage keys
 * Centralized to avoid typos and ensure consistency
 */

// Core data storage keys
export const STORAGE_KEYS = {
  // Conversations
  CONVOS: 'explicame:convos',
  
  // Participations (user-convo relationships)
  PARTICIPATIONS: 'explicame:participations',
  
  // Messages
  MESSAGES: 'explicame:messages',
  
  // Breakdowns (AI-generated point breakdowns)
  BREAKDOWNS: 'explicame:breakdowns',
  
  // Points (individual points within a breakdown)
  POINTS: 'explicame:points',
  
  // Interpretations (user attempts to restate messages)
  INTERPRETATIONS: 'explicame:interpretations',
  
  // Interpretation Gradings (author's evaluation of interpretations)
  INTERPRETATION_GRADINGS: 'explicame:interpretation_gradings',
  
  // Interpretation Grading Responses (replier's response to rejection)
  INTERPRETATION_GRADING_RESPONSES: 'explicame:interpretation_grading_responses',
  
  // Arbitrations (AI judgments when disputes occur)
  ARBITRATIONS: 'explicame:arbitrations',
  
  // User settings
  USER_SETTINGS: 'explicame:user_settings',
  
  // Current user ID (for MVP, simple user tracking)
  CURRENT_USER_ID: 'explicame:current_user_id',
  
  // ID counters for generating unique IDs
  ID_COUNTERS: 'explicame:id_counters',
} as const;

// Type-safe keys
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
