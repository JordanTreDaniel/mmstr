/**
 * Custom React hook for managing message interpretation flow state
 * Handles interpretations, gradings, responses, and arbitrations
 */

import { useState, useCallback, useEffect } from 'react';
import {
  createInterpretation,
  getMessageInterpretations,
  getUserMessageInterpretations,
  getUserAttemptCount,
  getInterpretationById,
  createInterpretationGrading,
  getInterpretationGrading,
  updateGrading,
  createGradingResponse,
  getGradingResponse,
  createArbitration,
  getInterpretationArbitration,
  getUserInterpretationStatus,
  getMessageById,
  getConvoById,
  createBreakdown,
  createPoint,
  getMessageBreakdown,
  getBreakdownPoints,
  getInterpretationBreakdown,
} from '@/lib/data-manager';
import type {
  Message,
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
  submitInterpretation: (messageId: string, userId: string, text: string) => Promise<Interpretation | null>;
  getAllInterpretations: (messageId: string) => Interpretation[];
  getUserInterpretations: (messageId: string, userId: string) => Interpretation[];
  getAttemptCount: (messageId: string, userId: string) => number;
  
  // Grading actions
  gradeInterpretation: (
    interpretationId: string,
    status: 'accepted' | 'rejected',
    similarityScore: number,
    autoAcceptSuggested: boolean,
    notes?: string | null
  ) => InterpretationGrading;
  updateInterpretationGrading: (
    gradingId: string,
    updates: Partial<Omit<InterpretationGrading, 'id' | 'interpretationId' | 'createdAt'>>
  ) => InterpretationGrading | null;
  
  // Response actions (disputes)
  submitGradingResponse: (gradingId: string, text: string) => InterpretationGradingResponse;
  
  // Arbitration actions
  submitArbitration: (
    messageId: string,
    interpretationId: string,
    gradingId: string,
    responseId: string | null,
    result: 'accept' | 'reject',
    rulingStatus: string,
    explanation: string
  ) => Arbitration;
  
  // Breakdown actions
  createMessageBreakdown: (messageId: string, points: string[]) => { breakdown: Breakdown; points: Point[] };
  createInterpretationBreakdown: (interpretationId: string, points: string[]) => { breakdown: Breakdown; points: Point[] };
  
  // Load flow state
  loadFlowState: (messageId: string, userId: string) => void;
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
    userId: string,
    text: string
  ): Promise<Interpretation | null> => {
    const interpretation = createInterpretation(messageId, userId, text);
    if (interpretation) {
      // Reload flow state to reflect new interpretation
      loadFlowState(messageId, userId);
    }
    return interpretation;
  }, []);

  // Get all interpretations for a message
  const getAllInterpretations = useCallback((messageId: string): Interpretation[] => {
    return getMessageInterpretations(messageId);
  }, []);

  // Get user's interpretations for a message
  const getUserInterpretations = useCallback((messageId: string, userId: string): Interpretation[] => {
    return getUserMessageInterpretations(messageId, userId);
  }, []);

  // Get attempt count
  const getAttemptCount = useCallback((messageId: string, userId: string): number => {
    return getUserAttemptCount(messageId, userId);
  }, []);

  // Grade an interpretation
  const gradeInterpretation = useCallback((
    interpretationId: string,
    status: 'accepted' | 'rejected',
    similarityScore: number,
    autoAcceptSuggested: boolean,
    notes: string | null = null
  ): InterpretationGrading => {
    return createInterpretationGrading(
      interpretationId,
      status,
      similarityScore,
      autoAcceptSuggested,
      notes
    );
  }, []);

  // Update grading
  const updateInterpretationGrading = useCallback((
    gradingId: string,
    updates: Partial<Omit<InterpretationGrading, 'id' | 'interpretationId' | 'createdAt'>>
  ): InterpretationGrading | null => {
    return updateGrading(gradingId, updates);
  }, []);

  // Submit grading response (dispute)
  const submitGradingResponse = useCallback((
    gradingId: string,
    text: string
  ): InterpretationGradingResponse => {
    return createGradingResponse(gradingId, text);
  }, []);

  // Submit arbitration
  const submitArbitration = useCallback((
    messageId: string,
    interpretationId: string,
    gradingId: string,
    responseId: string | null,
    result: 'accept' | 'reject',
    rulingStatus: string,
    explanation: string
  ): Arbitration => {
    return createArbitration(
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
  const createMessageBreakdown = useCallback((
    messageId: string,
    points: string[]
  ): { breakdown: Breakdown; points: Point[] } => {
    const breakdown = createBreakdown(messageId, null);
    const createdPoints = points.map((text, index) => 
      createPoint(breakdown.id, text, index + 1)
    );
    
    return { breakdown, points: createdPoints };
  }, []);

  // Create interpretation breakdown
  const createInterpretationBreakdown = useCallback((
    interpretationId: string,
    points: string[]
  ): { breakdown: Breakdown; points: Point[] } => {
    const breakdown = createBreakdown(null, interpretationId);
    const createdPoints = points.map((text, index) => 
      createPoint(breakdown.id, text, index + 1)
    );
    
    return { breakdown, points: createdPoints };
  }, []);

  // Load flow state for a message and user
  const loadFlowState = useCallback((messageId: string, userId: string) => {
    const status = getUserInterpretationStatus(messageId, userId);
    const message = getMessageById(messageId);
    
    if (!message) {
      setFlowState(null);
      return;
    }

    const messageBreakdown = getMessageBreakdown(messageId);
    const messagePoints = messageBreakdown ? getBreakdownPoints(messageBreakdown.id) : [];

    if (!status) {
      // No interpretations yet
      const convo = getConvoById(message.convoId);
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

    const interpretationBreakdown = getInterpretationBreakdown(status.interpretation.id);
    const interpretationPoints = interpretationBreakdown ? 
      getBreakdownPoints(interpretationBreakdown.id) : [];

    setFlowState({
      interpretation: status.interpretation,
      grading: status.grading || null,
      response: status.grading ? getGradingResponse(status.grading.id) : null,
      arbitration: status.arbitration || null,
      attemptNumber: status.attemptNumber,
      maxAttempts: status.maxAttempts,
      canRetry: status.canRetry,
      messageBreakdown,
      messagePoints,
      interpretationBreakdown,
      interpretationPoints,
    });
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
