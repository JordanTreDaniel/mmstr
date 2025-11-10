/**
 * Custom React hook for managing message interpretation flow state
 * Handles interpretations, gradings, responses, and arbitrations
 * Uses server actions to interact with SQLite database
 */

import { useState, useCallback } from 'react';
import {
  createInterpretation as createInterpretationAction,
  getInterpretationsByMessage,
  getInterpretationById,
  createGrading as createGradingAction,
  getGradingByInterpretation,
  updateGrading as updateGradingAction,
  createGradingResponse as createGradingResponseAction,
  getGradingResponse,
  createArbitration as createArbitrationAction,
  getArbitrationByInterpretation,
} from '@/app/actions/interpretations';
import {
  getMessageById,
} from '@/app/actions/messages';
import {
  getConversationById,
} from '@/app/actions/convos';
import {
  createBreakdown as createBreakdownAction,
  createPoint as createPointAction,
  getMessageBreakdown,
  getBreakdownPoints,
  getInterpretationBreakdown,
} from '@/app/actions/breakdowns';
import type {
  Interpretation,
  InterpretationGrading,
  InterpretationGradingResponse,
  Arbitration,
  Breakdown,
  Point,
} from '@/types/entities';

export interface InterpretationFlowState {
  interpretation: Interpretation | null;
  grading: InterpretationGrading | null;
  response: InterpretationGradingResponse | null;
  arbitration: Arbitration | null;
  attemptNumber: number;
  maxAttempts: number;
  canRetry: boolean;
  messageBreakdown: Breakdown | null;
  messagePoints: Point[];
  interpretationBreakdown: Breakdown | null;
  interpretationPoints: Point[];
}

export interface UseMessageInteractionsReturn {
  // Current flow state
  flowState: InterpretationFlowState | null;
  
  // Interpretation actions
  submitInterpretation: (messageId: string, userId: number, text: string) => Promise<Interpretation | null>;
  getAllInterpretations: (messageId: string) => Promise<Interpretation[]>;
  getUserInterpretations: (messageId: string, userId: number) => Promise<Interpretation[]>;
  getAttemptCount: (messageId: string, userId: number) => Promise<number>;
  
  // Grading actions
  gradeInterpretation: (
    interpretationId: string,
    status: 'accepted' | 'rejected',
    similarityScore: number,
    autoAcceptSuggested: boolean,
    notes?: string | null
  ) => Promise<InterpretationGrading>;
  updateInterpretationGrading: (
    gradingId: string,
    updates: Partial<Omit<InterpretationGrading, 'id' | 'interpretationId' | 'createdAt'>>
  ) => Promise<InterpretationGrading | null>;
  
  // Response actions (disputes)
  submitGradingResponse: (gradingId: string, text: string) => Promise<InterpretationGradingResponse>;
  
  // Arbitration actions
  submitArbitration: (
    messageId: string,
    interpretationId: string,
    gradingId: string,
    responseId: string | null,
    result: 'accept' | 'reject',
    rulingStatus: string,
    explanation: string
  ) => Promise<Arbitration>;
  
  // Breakdown actions
  createMessageBreakdown: (messageId: string, points: string[]) => Promise<{ breakdown: Breakdown; points: Point[] }>;
  createInterpretationBreakdown: (interpretationId: string, points: string[]) => Promise<{ breakdown: Breakdown; points: Point[] }>;
  
  // Load flow state
  loadFlowState: (messageId: string, userId: number) => Promise<void>;
  clearFlowState: () => void;
}

/**
 * Hook for managing message interpretation flow
 */
export function useMessageInteractions(): UseMessageInteractionsReturn {
  const [flowState, setFlowState] = useState<InterpretationFlowState | null>(null);

  // Submit a new interpretation
  const submitInterpretation = useCallback(async (
    messageId: string,
    userId: number,
    text: string
  ): Promise<Interpretation | null> => {
    // Get current attempt count
    const existingInterpretations = await getInterpretationsByMessage(messageId, userId);
    const attemptNumber = existingInterpretations.length + 1;
    
    // Check max attempts
    const message = await getMessageById(messageId);
    if (!message) return null;
    
    const convo = await getConversationById(message.convoId);
    if (!convo) return null;
    
    if (attemptNumber > convo.maxAttempts) {
      console.error('Max interpretation attempts exceeded');
      return null;
    }
    
    const interpretation = await createInterpretationAction(messageId, userId, text, attemptNumber);
    
    // Reload flow state to reflect new interpretation
    await loadFlowState(messageId, userId);
    
    return interpretation;
  }, []);

  // Get all interpretations for a message
  const getAllInterpretations = useCallback(async (messageId: string): Promise<Interpretation[]> => {
    return await getInterpretationsByMessage(messageId);
  }, []);

  // Get user's interpretations for a message
  const getUserInterpretations = useCallback(async (messageId: string, userId: number): Promise<Interpretation[]> => {
    return await getInterpretationsByMessage(messageId, userId);
  }, []);

  // Get attempt count
  const getAttemptCount = useCallback(async (messageId: string, userId: number): Promise<number> => {
    const interpretations = await getInterpretationsByMessage(messageId, userId);
    return interpretations.length;
  }, []);

  // Grade an interpretation
  const gradeInterpretation = useCallback(async (
    interpretationId: string,
    status: 'accepted' | 'rejected',
    similarityScore: number,
    autoAcceptSuggested: boolean,
    notes: string | null = null
  ): Promise<InterpretationGrading> => {
    return await createGradingAction(
      interpretationId,
      status,
      similarityScore,
      autoAcceptSuggested,
      notes
    );
  }, []);

  // Update grading
  const updateInterpretationGrading = useCallback(async (
    gradingId: string,
    updates: Partial<Omit<InterpretationGrading, 'id' | 'interpretationId' | 'createdAt'>>
  ): Promise<InterpretationGrading | null> => {
    return await updateGradingAction(gradingId, updates);
  }, []);

  // Submit grading response (dispute)
  const submitGradingResponse = useCallback(async (
    gradingId: string,
    text: string
  ): Promise<InterpretationGradingResponse> => {
    return await createGradingResponseAction(gradingId, text);
  }, []);

  // Submit arbitration
  const submitArbitration = useCallback(async (
    messageId: string,
    interpretationId: string,
    gradingId: string,
    responseId: string | null,
    result: 'accept' | 'reject',
    rulingStatus: string,
    explanation: string
  ): Promise<Arbitration> => {
    return await createArbitrationAction(
      messageId,
      interpretationId,
      gradingId,
      responseId,
      result,
      rulingStatus,
      explanation
    );
  }, []);

  // Create message breakdown
  const createMessageBreakdown = useCallback(async (
    messageId: string,
    points: string[]
  ): Promise<{ breakdown: Breakdown; points: Point[] }> => {
    const breakdown = await createBreakdownAction(messageId, null);
    const createdPoints: Point[] = [];
    
    for (let i = 0; i < points.length; i++) {
      const point = await createPointAction(breakdown.id, points[i], i + 1);
      createdPoints.push(point);
    }
    
    return { breakdown, points: createdPoints };
  }, []);

  // Create interpretation breakdown
  const createInterpretationBreakdown = useCallback(async (
    interpretationId: string,
    points: string[]
  ): Promise<{ breakdown: Breakdown; points: Point[] }> => {
    const breakdown = await createBreakdownAction(null, interpretationId);
    const createdPoints: Point[] = [];
    
    for (let i = 0; i < points.length; i++) {
      const point = await createPointAction(breakdown.id, points[i], i + 1);
      createdPoints.push(point);
    }
    
    return { breakdown, points: createdPoints };
  }, []);

  // Load flow state for a message and user
  const loadFlowState = useCallback(async (messageId: string, userId: number) => {
    try {
      const message = await getMessageById(messageId);
      
      if (!message) {
        setFlowState(null);
        return;
      }

      const messageBreakdown = await getMessageBreakdown(messageId);
      const messagePoints = messageBreakdown ? await getBreakdownPoints(messageBreakdown.id) : [];

      // Get user's interpretations
      const interpretations = await getInterpretationsByMessage(messageId, userId);
      
      if (interpretations.length === 0) {
        // No interpretations yet
        const convo = await getConversationById(message.convoId);
        setFlowState({
          interpretation: null,
          grading: null,
          response: null,
          arbitration: null,
          attemptNumber: 0,
          maxAttempts: convo?.maxAttempts || 3,
          canRetry: true,
          messageBreakdown,
          messagePoints,
          interpretationBreakdown: null,
          interpretationPoints: [],
        });
        return;
      }

      // Get the latest interpretation
      const latestInterpretation = interpretations[0]; // Already sorted by attempt_number DESC
      const grading = await getGradingByInterpretation(latestInterpretation.id);
      const response = grading ? await getGradingResponse(grading.id) : null;
      const arbitration = await getArbitrationByInterpretation(latestInterpretation.id);
      
      const interpretationBreakdown = await getInterpretationBreakdown(latestInterpretation.id);
      const interpretationPoints = interpretationBreakdown ? 
        await getBreakdownPoints(interpretationBreakdown.id) : [];

      const convo = await getConversationById(message.convoId);
      const maxAttempts = convo?.maxAttempts || 3;
      const canRetry = latestInterpretation.attemptNumber < maxAttempts;

      setFlowState({
        interpretation: latestInterpretation,
        grading,
        response,
        arbitration,
        attemptNumber: latestInterpretation.attemptNumber,
        maxAttempts,
        canRetry,
        messageBreakdown,
        messagePoints,
        interpretationBreakdown,
        interpretationPoints,
      });
    } catch (error) {
      console.error('Error loading flow state:', error);
      setFlowState(null);
    }
  }, []);

  // Clear flow state
  const clearFlowState = useCallback(() => {
    setFlowState(null);
  }, []);

  return {
    flowState,
    submitInterpretation,
    getAllInterpretations,
    getUserInterpretations,
    getAttemptCount,
    gradeInterpretation,
    updateInterpretationGrading,
    submitGradingResponse,
    submitArbitration,
    createMessageBreakdown,
    createInterpretationBreakdown,
    loadFlowState,
    clearFlowState,
  };
}
