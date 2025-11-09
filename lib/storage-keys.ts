/**
 * Constants for all localStorage keys
 * Centralized to avoid typos and ensure consistency
 */

// Core data storage keys
export const STORAGE_KEYS = {
  // Conversations
  CONVOS: 'mmstr:convos',
  
  // Participations (user-convo relationships)
  PARTICIPATIONS: 'mmstr:participations',
  
  // Messages
  MESSAGES: 'mmstr:messages',
  
  // Breakdowns (AI-generated point breakdowns)
  BREAKDOWNS: 'mmstr:breakdowns',
  
  // Points (individual points within a breakdown)
  POINTS: 'mmstr:points',
  
  // Interpretations (user attempts to restate messages)
  INTERPRETATIONS: 'mmstr:interpretations',
  
  // Interpretation Gradings (author's evaluation of interpretations)
  INTERPRETATION_GRADINGS: 'mmstr:interpretation_gradings',
  
  // Interpretation Grading Responses (replier's response to rejection)
  INTERPRETATION_GRADING_RESPONSES: 'mmstr:interpretation_grading_responses',
  
  // Arbitrations (AI judgments when disputes occur)
  ARBITRATIONS: 'mmstr:arbitrations',
  
  // User settings
  USER_SETTINGS: 'mmstr:user_settings',
  
  // Current user ID (for MVP, simple user tracking)
  CURRENT_USER_ID: 'mmstr:current_user_id',
  
  // ID counters for generating unique IDs
  ID_COUNTERS: 'mmstr:id_counters',
} as const;

// Type-safe keys
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
