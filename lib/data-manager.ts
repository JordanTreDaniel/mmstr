/**
 * Data Manager
 * Comprehensive CRUD utilities for all ExplicaMe entities
 * Uses localStorage for persistence with type-safe operations
 * 
 * @deprecated This file is deprecated. Use server actions in app/actions/ instead.
 * This file is kept for reference but should not be used in new code.
 */

import { getItem, setItem } from './storage';
import { STORAGE_KEYS } from './storage-keys';
import type {
  Convo,
  Participation,
  Message,
  Breakdown,
  Point,
  Interpretation,
  InterpretationGrading,
  InterpretationGradingResponse,
  Arbitration,
} from '@/types/entities';

// ============================================================================
// ID Generation Utilities
// ============================================================================

/**
 * Get next ID for an entity type
 */
function getNextId(entityType: string): string {
  const counters = getItem<Record<string, number>>(STORAGE_KEYS.ID_COUNTERS) || {};
  const currentId = counters[entityType] || 0;
  const nextId = currentId + 1;
  
  counters[entityType] = nextId;
  setItem(STORAGE_KEYS.ID_COUNTERS, counters);
  
  return `${entityType}_${nextId}`;
}

/**
 * Generate ISO timestamp for createdAt fields
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// ============================================================================
// Data Structure Initialization
// ============================================================================

/**
 * Initialize empty data structures in localStorage if they don't exist
 */
export function initializeDataStructures(): void {
  if (!getItem(STORAGE_KEYS.CONVOS)) {
    setItem<Convo[]>(STORAGE_KEYS.CONVOS, []);
  }
  if (!getItem(STORAGE_KEYS.PARTICIPATIONS)) {
    setItem<Participation[]>(STORAGE_KEYS.PARTICIPATIONS, []);
  }
  if (!getItem(STORAGE_KEYS.MESSAGES)) {
    setItem<Message[]>(STORAGE_KEYS.MESSAGES, []);
  }
  if (!getItem(STORAGE_KEYS.BREAKDOWNS)) {
    setItem<Breakdown[]>(STORAGE_KEYS.BREAKDOWNS, []);
  }
  if (!getItem(STORAGE_KEYS.POINTS)) {
    setItem<Point[]>(STORAGE_KEYS.POINTS, []);
  }
  if (!getItem(STORAGE_KEYS.INTERPRETATIONS)) {
    setItem<Interpretation[]>(STORAGE_KEYS.INTERPRETATIONS, []);
  }
  if (!getItem(STORAGE_KEYS.INTERPRETATION_GRADINGS)) {
    setItem<InterpretationGrading[]>(STORAGE_KEYS.INTERPRETATION_GRADINGS, []);
  }
  if (!getItem(STORAGE_KEYS.INTERPRETATION_GRADING_RESPONSES)) {
    setItem<InterpretationGradingResponse[]>(STORAGE_KEYS.INTERPRETATION_GRADING_RESPONSES, []);
  }
  if (!getItem(STORAGE_KEYS.ARBITRATIONS)) {
    setItem<Arbitration[]>(STORAGE_KEYS.ARBITRATIONS, []);
  }
  if (!getItem(STORAGE_KEYS.ID_COUNTERS)) {
    setItem<Record<string, number>>(STORAGE_KEYS.ID_COUNTERS, {});
  }
}

/**
 * Clear all data structures (useful for testing/reset)
 */
export function clearAllData(): void {
  setItem<Convo[]>(STORAGE_KEYS.CONVOS, []);
  setItem<Participation[]>(STORAGE_KEYS.PARTICIPATIONS, []);
  setItem<Message[]>(STORAGE_KEYS.MESSAGES, []);
  setItem<Breakdown[]>(STORAGE_KEYS.BREAKDOWNS, []);
  setItem<Point[]>(STORAGE_KEYS.POINTS, []);
  setItem<Interpretation[]>(STORAGE_KEYS.INTERPRETATIONS, []);
  setItem<InterpretationGrading[]>(STORAGE_KEYS.INTERPRETATION_GRADINGS, []);
  setItem<InterpretationGradingResponse[]>(STORAGE_KEYS.INTERPRETATION_GRADING_RESPONSES, []);
  setItem<Arbitration[]>(STORAGE_KEYS.ARBITRATIONS, []);
  setItem<Record<string, number>>(STORAGE_KEYS.ID_COUNTERS, {});
}

// ============================================================================
// CRUD: Conversations
// ============================================================================

/**
 * Create a new conversation
 */
export function createConvo(
  title: string,
  maxAttempts: number = 3,
  participantLimit: number = 20
): Convo {
  const convo: Convo = {
    id: getNextId('convo'),
    title,
    createdAt: getCurrentTimestamp(),
    maxAttempts,
    participantLimit,
  };

  const convos = getItem<Convo[]>(STORAGE_KEYS.CONVOS) || [];
  convos.push(convo);
  setItem(STORAGE_KEYS.CONVOS, convos);

  return convo;
}

/**
 * Get all conversations
 */
export function getAllConvos(): Convo[] {
  return getItem<Convo[]>(STORAGE_KEYS.CONVOS) || [];
}

/**
 * Get conversation by ID
 */
export function getConvoById(id: string): Convo | null {
  const convos = getItem<Convo[]>(STORAGE_KEYS.CONVOS) || [];
  return convos.find(c => c.id === id) || null;
}

/**
 * Update conversation
 */
export function updateConvo(id: string, updates: Partial<Omit<Convo, 'id' | 'createdAt'>>): Convo | null {
  const convos = getItem<Convo[]>(STORAGE_KEYS.CONVOS) || [];
  const index = convos.findIndex(c => c.id === id);
  
  if (index === -1) return null;
  
  convos[index] = { ...convos[index], ...updates };
  setItem(STORAGE_KEYS.CONVOS, convos);
  
  return convos[index];
}

/**
 * Delete conversation and all related data
 */
export function deleteConvo(id: string): boolean {
  // Delete conversation
  const convos = getItem<Convo[]>(STORAGE_KEYS.CONVOS) || [];
  const filteredConvos = convos.filter(c => c.id !== id);
  
  if (filteredConvos.length === convos.length) return false;
  
  setItem(STORAGE_KEYS.CONVOS, filteredConvos);
  
  // Delete related participations
  const participations = getItem<Participation[]>(STORAGE_KEYS.PARTICIPATIONS) || [];
  setItem(STORAGE_KEYS.PARTICIPATIONS, participations.filter(p => p.convoId !== id));
  
  // Delete related messages and their cascading data
  const messages = getItem<Message[]>(STORAGE_KEYS.MESSAGES) || [];
  const messageIds = messages.filter(m => m.convoId === id).map(m => m.id);
  setItem(STORAGE_KEYS.MESSAGES, messages.filter(m => m.convoId !== id));
  
  // Delete breakdowns, interpretations, etc. for those messages
  messageIds.forEach(messageId => {
    deleteMessageCascade(messageId);
  });
  
  return true;
}

// ============================================================================
// CRUD: Participations
// ============================================================================

/**
 * Add user participation to conversation
 */
export function addParticipation(userId: string, convoId: string): Participation | null {
  // Check if already participating
  const participations = getItem<Participation[]>(STORAGE_KEYS.PARTICIPATIONS) || [];
  const exists = participations.find(p => p.userId === userId && p.convoId === convoId);
  if (exists) return exists;
  
  // Check participant limit
  const convo = getConvoById(convoId);
  if (!convo) return null;
  
  const currentCount = participations.filter(p => p.convoId === convoId).length;
  if (currentCount >= convo.participantLimit) return null;
  
  const participation: Participation = {
    userId,
    convoId,
  };
  
  participations.push(participation);
  setItem(STORAGE_KEYS.PARTICIPATIONS, participations);
  
  return participation;
}

/**
 * Get all participations for a conversation
 */
export function getConvoParticipations(convoId: string): Participation[] {
  const participations = getItem<Participation[]>(STORAGE_KEYS.PARTICIPATIONS) || [];
  return participations.filter(p => p.convoId === convoId);
}

/**
 * Get all participations for a user
 */
export function getUserParticipations(userId: string): Participation[] {
  const participations = getItem<Participation[]>(STORAGE_KEYS.PARTICIPATIONS) || [];
  return participations.filter(p => p.userId === userId);
}

/**
 * Check if user is participating in conversation
 */
export function isUserParticipating(userId: string, convoId: string): boolean {
  const participations = getItem<Participation[]>(STORAGE_KEYS.PARTICIPATIONS) || [];
  return participations.some(p => p.userId === userId && p.convoId === convoId);
}

/**
 * Remove user from conversation
 */
export function removeParticipation(userId: string, convoId: string): boolean {
  const participations = getItem<Participation[]>(STORAGE_KEYS.PARTICIPATIONS) || [];
  const filtered = participations.filter(p => !(p.userId === userId && p.convoId === convoId));
  
  if (filtered.length === participations.length) return false;
  
  setItem(STORAGE_KEYS.PARTICIPATIONS, filtered);
  return true;
}

// ============================================================================
// CRUD: Messages
// ============================================================================

/**
 * Message validation constraints
 */
const MESSAGE_MIN_LENGTH = 10;
const MESSAGE_MAX_LENGTH = 280;

/**
 * Validate message text
 */
export function validateMessageText(text: string): { valid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  const trimmed = text.trim();
  
  if (trimmed.length < MESSAGE_MIN_LENGTH) {
    return { valid: false, error: `Message must be at least ${MESSAGE_MIN_LENGTH} characters` };
  }
  
  if (trimmed.length > MESSAGE_MAX_LENGTH) {
    return { valid: false, error: `Message cannot exceed ${MESSAGE_MAX_LENGTH} characters` };
  }
  
  return { valid: true };
}

/**
 * Create a new message
 */
export function createMessage(
  text: string,
  userId: string,
  convoId: string,
  replyingToMessageId: string | null = null
): Message | null {
  // Validate message
  const validation = validateMessageText(text);
  if (!validation.valid) {
    console.error('Message validation failed:', validation.error);
    return null;
  }
  
  // Verify conversation exists
  const convo = getConvoById(convoId);
  if (!convo) {
    console.error('Conversation not found:', convoId);
    return null;
  }
  
  // Verify user is participating
  if (!isUserParticipating(userId, convoId)) {
    console.error('User not participating in conversation:', userId, convoId);
    return null;
  }
  
  const message: Message = {
    id: getNextId('message'),
    text: text.trim(),
    userId,
    convoId,
    replyingToMessageId,
    createdAt: getCurrentTimestamp(),
  };
  
  const messages = getItem<Message[]>(STORAGE_KEYS.MESSAGES) || [];
  messages.push(message);
  setItem(STORAGE_KEYS.MESSAGES, messages);
  
  return message;
}

/**
 * Get all messages
 */
export function getAllMessages(): Message[] {
  return getItem<Message[]>(STORAGE_KEYS.MESSAGES) || [];
}

/**
 * Get message by ID
 */
export function getMessageById(id: string): Message | null {
  const messages = getItem<Message[]>(STORAGE_KEYS.MESSAGES) || [];
  return messages.find(m => m.id === id) || null;
}

/**
 * Get all messages for a conversation
 */
export function getConvoMessages(convoId: string): Message[] {
  const messages = getItem<Message[]>(STORAGE_KEYS.MESSAGES) || [];
  return messages.filter(m => m.convoId === convoId).sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/**
 * Get messages replying to a specific message
 */
export function getMessageReplies(messageId: string): Message[] {
  const messages = getItem<Message[]>(STORAGE_KEYS.MESSAGES) || [];
  return messages.filter(m => m.replyingToMessageId === messageId);
}

/**
 * Update message
 */
export function updateMessage(id: string, updates: Partial<Omit<Message, 'id' | 'userId' | 'convoId' | 'createdAt'>>): Message | null {
  const messages = getItem<Message[]>(STORAGE_KEYS.MESSAGES) || [];
  const index = messages.findIndex(m => m.id === id);
  
  if (index === -1) return null;
  
  messages[index] = { ...messages[index], ...updates };
  setItem(STORAGE_KEYS.MESSAGES, messages);
  
  return messages[index];
}

/**
 * Delete message and cascading data (breakdowns, interpretations, etc.)
 */
export function deleteMessage(id: string): boolean {
  const messages = getItem<Message[]>(STORAGE_KEYS.MESSAGES) || [];
  const filtered = messages.filter(m => m.id !== id);
  
  if (filtered.length === messages.length) return false;
  
  setItem(STORAGE_KEYS.MESSAGES, filtered);
  deleteMessageCascade(id);
  
  return true;
}

/**
 * Helper to delete all data cascading from a message
 */
function deleteMessageCascade(messageId: string): void {
  // Delete message breakdowns
  const breakdowns = getItem<Breakdown[]>(STORAGE_KEYS.BREAKDOWNS) || [];
  const messageBreakdownIds = breakdowns.filter(b => b.messageId === messageId).map(b => b.id);
  setItem(STORAGE_KEYS.BREAKDOWNS, breakdowns.filter(b => b.messageId !== messageId));
  
  // Delete points for those breakdowns
  messageBreakdownIds.forEach(breakdownId => {
    const points = getItem<Point[]>(STORAGE_KEYS.POINTS) || [];
    setItem(STORAGE_KEYS.POINTS, points.filter(p => p.breakdownId !== breakdownId));
  });
  
  // Delete interpretations
  const interpretations = getItem<Interpretation[]>(STORAGE_KEYS.INTERPRETATIONS) || [];
  const interpretationIds = interpretations.filter(i => i.messageId === messageId).map(i => i.id);
  setItem(STORAGE_KEYS.INTERPRETATIONS, interpretations.filter(i => i.messageId !== messageId));
  
  // Delete interpretation-related data
  interpretationIds.forEach(interpretationId => {
    deleteInterpretationCascade(interpretationId);
  });
  
  // Delete arbitrations
  const arbitrations = getItem<Arbitration[]>(STORAGE_KEYS.ARBITRATIONS) || [];
  setItem(STORAGE_KEYS.ARBITRATIONS, arbitrations.filter(a => a.messageId !== messageId));
}

// ============================================================================
// CRUD: Breakdowns
// ============================================================================

/**
 * Create a breakdown for a message or interpretation
 */
export function createBreakdown(
  messageId: string | null,
  interpretationId: string | null
): Breakdown {
  const breakdown: Breakdown = {
    id: getNextId('breakdown'),
    messageId,
    interpretationId,
    createdAt: getCurrentTimestamp(),
  };
  
  const breakdowns = getItem<Breakdown[]>(STORAGE_KEYS.BREAKDOWNS) || [];
  breakdowns.push(breakdown);
  setItem(STORAGE_KEYS.BREAKDOWNS, breakdowns);
  
  return breakdown;
}

/**
 * Get breakdown by ID
 */
export function getBreakdownById(id: string): Breakdown | null {
  const breakdowns = getItem<Breakdown[]>(STORAGE_KEYS.BREAKDOWNS) || [];
  return breakdowns.find(b => b.id === id) || null;
}

/**
 * Get breakdown for a message
 */
export function getMessageBreakdown(messageId: string): Breakdown | null {
  const breakdowns = getItem<Breakdown[]>(STORAGE_KEYS.BREAKDOWNS) || [];
  return breakdowns.find(b => b.messageId === messageId) || null;
}

/**
 * Get breakdown for an interpretation
 */
export function getInterpretationBreakdown(interpretationId: string): Breakdown | null {
  const breakdowns = getItem<Breakdown[]>(STORAGE_KEYS.BREAKDOWNS) || [];
  return breakdowns.find(b => b.interpretationId === interpretationId) || null;
}

/**
 * Delete breakdown
 */
export function deleteBreakdown(id: string): boolean {
  const breakdowns = getItem<Breakdown[]>(STORAGE_KEYS.BREAKDOWNS) || [];
  const filtered = breakdowns.filter(b => b.id !== id);
  
  if (filtered.length === breakdowns.length) return false;
  
  setItem(STORAGE_KEYS.BREAKDOWNS, filtered);
  
  // Delete associated points
  const points = getItem<Point[]>(STORAGE_KEYS.POINTS) || [];
  setItem(STORAGE_KEYS.POINTS, points.filter(p => p.breakdownId !== id));
  
  return true;
}

// ============================================================================
// CRUD: Points
// ============================================================================

/**
 * Create a point for a breakdown
 */
export function createPoint(
  breakdownId: string,
  text: string,
  order: number
): Point {
  const point: Point = {
    id: getNextId('point'),
    breakdownId,
    text,
    order,
  };
  
  const points = getItem<Point[]>(STORAGE_KEYS.POINTS) || [];
  points.push(point);
  setItem(STORAGE_KEYS.POINTS, points);
  
  return point;
}

/**
 * Get all points for a breakdown
 */
export function getBreakdownPoints(breakdownId: string): Point[] {
  const points = getItem<Point[]>(STORAGE_KEYS.POINTS) || [];
  return points.filter(p => p.breakdownId === breakdownId).sort((a, b) => a.order - b.order);
}

/**
 * Get point by ID
 */
export function getPointById(id: string): Point | null {
  const points = getItem<Point[]>(STORAGE_KEYS.POINTS) || [];
  return points.find(p => p.id === id) || null;
}

/**
 * Update point
 */
export function updatePoint(id: string, updates: Partial<Omit<Point, 'id' | 'breakdownId'>>): Point | null {
  const points = getItem<Point[]>(STORAGE_KEYS.POINTS) || [];
  const index = points.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  points[index] = { ...points[index], ...updates };
  setItem(STORAGE_KEYS.POINTS, points);
  
  return points[index];
}

/**
 * Delete point
 */
export function deletePoint(id: string): boolean {
  const points = getItem<Point[]>(STORAGE_KEYS.POINTS) || [];
  const filtered = points.filter(p => p.id !== id);
  
  if (filtered.length === points.length) return false;
  
  setItem(STORAGE_KEYS.POINTS, filtered);
  return true;
}

// ============================================================================
// CRUD: Interpretations
// ============================================================================

/**
 * Create an interpretation with attempt tracking
 */
export function createInterpretation(
  messageId: string,
  userId: string,
  text: string
): Interpretation | null {
  // Get existing interpretations for this message by this user
  const interpretations = getItem<Interpretation[]>(STORAGE_KEYS.INTERPRETATIONS) || [];
  const userInterpretations = interpretations.filter(
    i => i.messageId === messageId && i.userId === userId
  );
  
  // Determine attempt number
  const attemptNumber = userInterpretations.length + 1;
  
  // Get message to check max attempts
  const message = getMessageById(messageId);
  if (!message) {
    console.error('Message not found:', messageId);
    return null;
  }
  
  const convo = getConvoById(message.convoId);
  if (!convo) {
    console.error('Conversation not found:', message.convoId);
    return null;
  }
  
  // Check if max attempts exceeded
  if (attemptNumber > convo.maxAttempts) {
    console.error('Max interpretation attempts exceeded:', attemptNumber, '>', convo.maxAttempts);
    return null;
  }
  
  const interpretation: Interpretation = {
    id: getNextId('interpretation'),
    messageId,
    userId,
    text,
    attemptNumber,
    createdAt: getCurrentTimestamp(),
  };
  
  interpretations.push(interpretation);
  setItem(STORAGE_KEYS.INTERPRETATIONS, interpretations);
  
  return interpretation;
}

/**
 * Get interpretation by ID
 */
export function getInterpretationById(id: string): Interpretation | null {
  const interpretations = getItem<Interpretation[]>(STORAGE_KEYS.INTERPRETATIONS) || [];
  return interpretations.find(i => i.id === id) || null;
}

/**
 * Get all interpretations for a message
 */
export function getMessageInterpretations(messageId: string): Interpretation[] {
  const interpretations = getItem<Interpretation[]>(STORAGE_KEYS.INTERPRETATIONS) || [];
  return interpretations.filter(i => i.messageId === messageId).sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/**
 * Get interpretations by user for a specific message
 */
export function getUserMessageInterpretations(messageId: string, userId: string): Interpretation[] {
  const interpretations = getItem<Interpretation[]>(STORAGE_KEYS.INTERPRETATIONS) || [];
  return interpretations.filter(i => i.messageId === messageId && i.userId === userId).sort((a, b) =>
    a.attemptNumber - b.attemptNumber
  );
}

/**
 * Get current attempt count for user on a message
 */
export function getUserAttemptCount(messageId: string, userId: string): number {
  const interpretations = getUserMessageInterpretations(messageId, userId);
  return interpretations.length;
}

/**
 * Delete interpretation and cascading data
 */
export function deleteInterpretation(id: string): boolean {
  const interpretations = getItem<Interpretation[]>(STORAGE_KEYS.INTERPRETATIONS) || [];
  const filtered = interpretations.filter(i => i.id !== id);
  
  if (filtered.length === interpretations.length) return false;
  
  setItem(STORAGE_KEYS.INTERPRETATIONS, filtered);
  deleteInterpretationCascade(id);
  
  return true;
}

/**
 * Helper to delete all data cascading from an interpretation
 */
function deleteInterpretationCascade(interpretationId: string): void {
  // Delete interpretation breakdowns
  const breakdowns = getItem<Breakdown[]>(STORAGE_KEYS.BREAKDOWNS) || [];
  const interpretationBreakdownIds = breakdowns.filter(b => b.interpretationId === interpretationId).map(b => b.id);
  setItem(STORAGE_KEYS.BREAKDOWNS, breakdowns.filter(b => b.interpretationId !== interpretationId));
  
  // Delete points for those breakdowns
  interpretationBreakdownIds.forEach(breakdownId => {
    const points = getItem<Point[]>(STORAGE_KEYS.POINTS) || [];
    setItem(STORAGE_KEYS.POINTS, points.filter(p => p.breakdownId !== breakdownId));
  });
  
  // Delete gradings
  const gradings = getItem<InterpretationGrading[]>(STORAGE_KEYS.INTERPRETATION_GRADINGS) || [];
  const gradingIds = gradings.filter(g => g.interpretationId === interpretationId).map(g => g.id);
  setItem(STORAGE_KEYS.INTERPRETATION_GRADINGS, gradings.filter(g => g.interpretationId !== interpretationId));
  
  // Delete grading responses
  gradingIds.forEach(gradingId => {
    const responses = getItem<InterpretationGradingResponse[]>(STORAGE_KEYS.INTERPRETATION_GRADING_RESPONSES) || [];
    setItem(STORAGE_KEYS.INTERPRETATION_GRADING_RESPONSES, responses.filter(r => r.interpretationGradingId !== gradingId));
  });
  
  // Delete arbitrations
  const arbitrations = getItem<Arbitration[]>(STORAGE_KEYS.ARBITRATIONS) || [];
  setItem(STORAGE_KEYS.ARBITRATIONS, arbitrations.filter(a => a.interpretationId !== interpretationId));
}

// ============================================================================
// CRUD: Interpretation Gradings
// ============================================================================

/**
 * Create an interpretation grading
 */
export function createInterpretationGrading(
  interpretationId: string,
  status: 'pending' | 'accepted' | 'rejected',
  similarityScore: number,
  autoAcceptSuggested: boolean,
  notes: string | null = null
): InterpretationGrading {
  const grading: InterpretationGrading = {
    id: getNextId('grading'),
    interpretationId,
    status,
    similarityScore,
    autoAcceptSuggested,
    notes,
    createdAt: getCurrentTimestamp(),
  };
  
  const gradings = getItem<InterpretationGrading[]>(STORAGE_KEYS.INTERPRETATION_GRADINGS) || [];
  gradings.push(grading);
  setItem(STORAGE_KEYS.INTERPRETATION_GRADINGS, gradings);
  
  return grading;
}

/**
 * Get grading by ID
 */
export function getGradingById(id: string): InterpretationGrading | null {
  const gradings = getItem<InterpretationGrading[]>(STORAGE_KEYS.INTERPRETATION_GRADINGS) || [];
  return gradings.find(g => g.id === id) || null;
}

/**
 * Get grading for an interpretation
 */
export function getInterpretationGrading(interpretationId: string): InterpretationGrading | null {
  const gradings = getItem<InterpretationGrading[]>(STORAGE_KEYS.INTERPRETATION_GRADINGS) || [];
  return gradings.find(g => g.interpretationId === interpretationId) || null;
}

/**
 * Update grading
 */
export function updateGrading(
  id: string,
  updates: Partial<Omit<InterpretationGrading, 'id' | 'interpretationId' | 'createdAt'>>
): InterpretationGrading | null {
  const gradings = getItem<InterpretationGrading[]>(STORAGE_KEYS.INTERPRETATION_GRADINGS) || [];
  const index = gradings.findIndex(g => g.id === id);
  
  if (index === -1) return null;
  
  gradings[index] = { ...gradings[index], ...updates };
  setItem(STORAGE_KEYS.INTERPRETATION_GRADINGS, gradings);
  
  return gradings[index];
}

/**
 * Delete grading
 */
export function deleteGrading(id: string): boolean {
  const gradings = getItem<InterpretationGrading[]>(STORAGE_KEYS.INTERPRETATION_GRADINGS) || [];
  const filtered = gradings.filter(g => g.id !== id);
  
  if (filtered.length === gradings.length) return false;
  
  setItem(STORAGE_KEYS.INTERPRETATION_GRADINGS, filtered);
  
  // Delete associated responses
  const responses = getItem<InterpretationGradingResponse[]>(STORAGE_KEYS.INTERPRETATION_GRADING_RESPONSES) || [];
  setItem(STORAGE_KEYS.INTERPRETATION_GRADING_RESPONSES, responses.filter(r => r.interpretationGradingId !== id));
  
  return true;
}

// ============================================================================
// CRUD: Interpretation Grading Responses
// ============================================================================

/**
 * Create a grading response (dispute)
 */
export function createGradingResponse(
  interpretationGradingId: string,
  text: string
): InterpretationGradingResponse {
  const response: InterpretationGradingResponse = {
    id: getNextId('response'),
    interpretationGradingId,
    text,
    createdAt: getCurrentTimestamp(),
  };
  
  const responses = getItem<InterpretationGradingResponse[]>(STORAGE_KEYS.INTERPRETATION_GRADING_RESPONSES) || [];
  responses.push(response);
  setItem(STORAGE_KEYS.INTERPRETATION_GRADING_RESPONSES, responses);
  
  return response;
}

/**
 * Get response by ID
 */
export function getResponseById(id: string): InterpretationGradingResponse | null {
  const responses = getItem<InterpretationGradingResponse[]>(STORAGE_KEYS.INTERPRETATION_GRADING_RESPONSES) || [];
  return responses.find(r => r.id === id) || null;
}

/**
 * Get response for a grading
 */
export function getGradingResponse(interpretationGradingId: string): InterpretationGradingResponse | null {
  const responses = getItem<InterpretationGradingResponse[]>(STORAGE_KEYS.INTERPRETATION_GRADING_RESPONSES) || [];
  return responses.find(r => r.interpretationGradingId === interpretationGradingId) || null;
}

/**
 * Delete response
 */
export function deleteResponse(id: string): boolean {
  const responses = getItem<InterpretationGradingResponse[]>(STORAGE_KEYS.INTERPRETATION_GRADING_RESPONSES) || [];
  const filtered = responses.filter(r => r.id !== id);
  
  if (filtered.length === responses.length) return false;
  
  setItem(STORAGE_KEYS.INTERPRETATION_GRADING_RESPONSES, filtered);
  return true;
}

// ============================================================================
// CRUD: Arbitrations
// ============================================================================

/**
 * Create an arbitration
 */
export function createArbitration(
  messageId: string,
  interpretationId: string,
  interpretationGradingId: string,
  interpretationGradingResponseId: string | null,
  result: 'accept' | 'reject',
  rulingStatus: string,
  explanation: string
): Arbitration {
  const arbitration: Arbitration = {
    id: getNextId('arbitration'),
    messageId,
    interpretationId,
    interpretationGradingId,
    interpretationGradingResponseId,
    result,
    rulingStatus,
    explanation,
    createdAt: getCurrentTimestamp(),
  };
  
  const arbitrations = getItem<Arbitration[]>(STORAGE_KEYS.ARBITRATIONS) || [];
  arbitrations.push(arbitration);
  setItem(STORAGE_KEYS.ARBITRATIONS, arbitrations);
  
  return arbitration;
}

/**
 * Get arbitration by ID
 */
export function getArbitrationById(id: string): Arbitration | null {
  const arbitrations = getItem<Arbitration[]>(STORAGE_KEYS.ARBITRATIONS) || [];
  return arbitrations.find(a => a.id === id) || null;
}

/**
 * Get arbitration for an interpretation
 */
export function getInterpretationArbitration(interpretationId: string): Arbitration | null {
  const arbitrations = getItem<Arbitration[]>(STORAGE_KEYS.ARBITRATIONS) || [];
  return arbitrations.find(a => a.interpretationId === interpretationId) || null;
}

/**
 * Get all arbitrations for a message
 */
export function getMessageArbitrations(messageId: string): Arbitration[] {
  const arbitrations = getItem<Arbitration[]>(STORAGE_KEYS.ARBITRATIONS) || [];
  return arbitrations.filter(a => a.messageId === messageId);
}

/**
 * Update arbitration
 */
export function updateArbitration(
  id: string,
  updates: Partial<Omit<Arbitration, 'id' | 'messageId' | 'interpretationId' | 'createdAt'>>
): Arbitration | null {
  const arbitrations = getItem<Arbitration[]>(STORAGE_KEYS.ARBITRATIONS) || [];
  const index = arbitrations.findIndex(a => a.id === id);
  
  if (index === -1) return null;
  
  arbitrations[index] = { ...arbitrations[index], ...updates };
  setItem(STORAGE_KEYS.ARBITRATIONS, arbitrations);
  
  return arbitrations[index];
}

/**
 * Delete arbitration
 */
export function deleteArbitration(id: string): boolean {
  const arbitrations = getItem<Arbitration[]>(STORAGE_KEYS.ARBITRATIONS) || [];
  const filtered = arbitrations.filter(a => a.id !== id);
  
  if (filtered.length === arbitrations.length) return false;
  
  setItem(STORAGE_KEYS.ARBITRATIONS, filtered);
  return true;
}

// ============================================================================
// Helper Functions: Data Relationships
// ============================================================================

/**
 * Get complete message data with all relationships
 */
export function getMessageWithRelationships(messageId: string) {
  const message = getMessageById(messageId);
  if (!message) return null;
  
  const breakdown = getMessageBreakdown(messageId);
  const points = breakdown ? getBreakdownPoints(breakdown.id) : [];
  const interpretations = getMessageInterpretations(messageId);
  const arbitrations = getMessageArbitrations(messageId);
  
  // Get gradings for each interpretation
  const interpretationsWithGradings = interpretations.map(interpretation => {
    const grading = getInterpretationGrading(interpretation.id);
    const response = grading ? getGradingResponse(grading.id) : null;
    const arbitration = getInterpretationArbitration(interpretation.id);
    const interpretationBreakdown = getInterpretationBreakdown(interpretation.id);
    const interpretationPoints = interpretationBreakdown ? getBreakdownPoints(interpretationBreakdown.id) : [];
    
    return {
      ...interpretation,
      grading,
      response,
      arbitration,
      breakdown: interpretationBreakdown,
      points: interpretationPoints,
    };
  });
  
  return {
    message,
    breakdown,
    points,
    interpretations: interpretationsWithGradings,
    arbitrations,
  };
}

/**
 * Get complete conversation data with all messages and relationships
 */
export function getConvoWithRelationships(convoId: string) {
  const convo = getConvoById(convoId);
  if (!convo) return null;
  
  const participations = getConvoParticipations(convoId);
  const messages = getConvoMessages(convoId);
  
  const messagesWithRelationships = messages.map(message => 
    getMessageWithRelationships(message.id)
  );
  
  return {
    convo,
    participations,
    messages: messagesWithRelationships,
  };
}

/**
 * Get user's interpretation status for a message
 * Returns null if no interpretations, or the latest interpretation with its status
 */
export function getUserInterpretationStatus(messageId: string, userId: string) {
  const interpretations = getUserMessageInterpretations(messageId, userId);
  if (interpretations.length === 0) return null;
  
  const latestInterpretation = interpretations[interpretations.length - 1];
  const grading = getInterpretationGrading(latestInterpretation.id);
  const arbitration = getInterpretationArbitration(latestInterpretation.id);
  
  const message = getMessageById(messageId);
  const convo = message ? getConvoById(message.convoId) : null;
  const maxAttempts = convo?.maxAttempts || 3;
  
  return {
    interpretation: latestInterpretation,
    grading,
    arbitration,
    attemptNumber: latestInterpretation.attemptNumber,
    maxAttempts,
    canRetry: latestInterpretation.attemptNumber < maxAttempts,
  };
}
