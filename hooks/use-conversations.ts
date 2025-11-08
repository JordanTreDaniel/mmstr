/**
 * Custom React hook for managing conversations
 * Handles CRUD operations for conversations, participations, and messages
 */

import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './use-local-storage';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import {
  getAllConvos,
  createConvo as createConvoData,
  getConvoById,
  updateConvo as updateConvoData,
  deleteConvo as deleteConvoData,
  getConvoMessages,
  getConvoParticipations,
  addParticipation,
  removeParticipation,
  isUserParticipating,
  createMessage,
  initializeDataStructures,
} from '@/lib/data-manager';
import type { Convo, Message, Participation } from '@/types/entities';

export interface UseConversationsReturn {
  // Conversations
  conversations: Convo[];
  currentConvo: Convo | null;
  
  // Actions
  createConversation: (title: string, maxAttempts?: number, participantLimit?: number) => Convo;
  getConversation: (id: string) => Convo | null;
  updateConversation: (id: string, updates: Partial<Omit<Convo, 'id' | 'createdAt'>>) => Convo | null;
  deleteConversation: (id: string) => boolean;
  setCurrentConvo: (convoId: string | null) => void;
  
  // Messages
  getMessages: (convoId: string) => Message[];
  addMessage: (text: string, userId: string, convoId: string, replyingToMessageId?: string | null) => Message | null;
  
  // Participations
  joinConversation: (userId: string, convoId: string) => boolean;
  leaveConversation: (userId: string, convoId: string) => boolean;
  getParticipants: (convoId: string) => Participation[];
  checkParticipation: (userId: string, convoId: string) => boolean;
  
  // Refresh
  refresh: () => void;
}

/**
 * Hook for managing all conversation-related data
 */
export function useConversations(): UseConversationsReturn {
  // Track current conversation ID in localStorage
  const [currentConvoId, setCurrentConvoId] = useLocalStorage<string | null>(
    'explicame:current_convo_id',
    null
  );
  
  // Local state for conversations list
  const [conversations, setConversations] = useState<Convo[]>([]);
  const [currentConvo, setCurrentConvo] = useState<Convo | null>(null);

  // Initialize data structures on mount
  useEffect(() => {
    initializeDataStructures();
    loadConversations();
  }, []);

  // Load current conversation when currentConvoId changes
  useEffect(() => {
    if (currentConvoId) {
      const convo = getConvoById(currentConvoId);
      setCurrentConvo(convo);
    } else {
      setCurrentConvo(null);
    }
  }, [currentConvoId]);

  // Load conversations from localStorage
  const loadConversations = useCallback(() => {
    const convos = getAllConvos();
    setConversations(convos);
  }, []);

  // Create a new conversation
  const createConversation = useCallback((
    title: string,
    maxAttempts: number = 3,
    participantLimit: number = 20
  ): Convo => {
    const convo = createConvoData(title, maxAttempts, participantLimit);
    loadConversations();
    return convo;
  }, [loadConversations]);

  // Get conversation by ID
  const getConversation = useCallback((id: string): Convo | null => {
    return getConvoById(id);
  }, []);

  // Update conversation
  const updateConversation = useCallback((
    id: string,
    updates: Partial<Omit<Convo, 'id' | 'createdAt'>>
  ): Convo | null => {
    const updated = updateConvoData(id, updates);
    if (updated) {
      loadConversations();
      if (currentConvoId === id) {
        setCurrentConvo(updated);
      }
    }
    return updated;
  }, [loadConversations, currentConvoId]);

  // Delete conversation
  const deleteConversation = useCallback((id: string): boolean => {
    const success = deleteConvoData(id);
    if (success) {
      loadConversations();
      if (currentConvoId === id) {
        setCurrentConvoId(null);
      }
    }
    return success;
  }, [loadConversations, currentConvoId, setCurrentConvoId]);

  // Set current conversation
  const setCurrentConvoById = useCallback((convoId: string | null) => {
    setCurrentConvoId(convoId);
  }, [setCurrentConvoId]);

  // Get messages for a conversation
  const getMessages = useCallback((convoId: string): Message[] => {
    return getConvoMessages(convoId);
  }, []);

  // Add a message to a conversation
  const addMessage = useCallback((
    text: string,
    userId: string,
    convoId: string,
    replyingToMessageId: string | null = null
  ): Message | null => {
    return createMessage(text, userId, convoId, replyingToMessageId);
  }, []);

  // Join a conversation
  const joinConversation = useCallback((userId: string, convoId: string): boolean => {
    const participation = addParticipation(userId, convoId);
    return participation !== null;
  }, []);

  // Leave a conversation
  const leaveConversation = useCallback((userId: string, convoId: string): boolean => {
    return removeParticipation(userId, convoId);
  }, []);

  // Get participants of a conversation
  const getParticipants = useCallback((convoId: string): Participation[] => {
    return getConvoParticipations(convoId);
  }, []);

  // Check if user is participating
  const checkParticipation = useCallback((userId: string, convoId: string): boolean => {
    return isUserParticipating(userId, convoId);
  }, []);

  // Refresh all data
  const refresh = useCallback(() => {
    loadConversations();
    if (currentConvoId) {
      const convo = getConvoById(currentConvoId);
      setCurrentConvo(convo);
    }
  }, [loadConversations, currentConvoId]);

  return {
    conversations,
    currentConvo,
    createConversation,
    getConversation,
    updateConversation,
    deleteConversation,
    setCurrentConvo: setCurrentConvoById,
    getMessages,
    addMessage,
    joinConversation,
    leaveConversation,
    getParticipants,
    checkParticipation,
    refresh,
  };
}
