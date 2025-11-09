/**
 * Custom React hook for managing conversations
 * Handles CRUD operations for conversations, participations, and messages
 * Uses server actions to interact with SQLite database
 */

import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './use-local-storage';
import {
  getConversations,
  createConversation as createConvoAction,
  getConversationById,
  updateConversation as updateConvoAction,
  deleteConversation as deleteConvoAction,
} from '@/app/actions/convos';
import {
  createMessage as createMessageAction,
  getConversationMessages,
} from '@/app/actions/messages';
import {
  addParticipation,
  removeParticipation,
  getConversationParticipants,
  isUserParticipating,
} from '@/app/actions/participations';
import type { Convo, Message, Participation } from '@/types/entities';

export interface UseConversationsReturn {
  // Conversations
  conversations: Convo[];
  currentConvo: Convo | null;
  loading: boolean;
  
  // Actions
  createConversation: (title: string, maxAttempts?: number, participantLimit?: number) => Promise<Convo>;
  getConversation: (id: string) => Promise<Convo | null>;
  updateConversation: (id: string, updates: Partial<Omit<Convo, 'id' | 'createdAt'>>) => Promise<Convo | null>;
  deleteConversation: (id: string) => Promise<boolean>;
  setCurrentConvo: (convoId: string | null) => void;
  
  // Messages
  getMessages: (convoId: string) => Promise<Message[]>;
  addMessage: (text: string, userId: string, convoId: string, replyingToMessageId?: string | null) => Promise<Message | null>;
  
  // Participations
  joinConversation: (userId: string, convoId: string) => Promise<boolean>;
  leaveConversation: (userId: string, convoId: string) => Promise<boolean>;
  getParticipants: (convoId: string) => Promise<Participation[]>;
  checkParticipation: (userId: string, convoId: string) => Promise<boolean>;
  
  // Refresh
  refresh: () => Promise<void>;
}

/**
 * Hook for managing all conversation-related data
 */
export function useConversations(): UseConversationsReturn {
  // Track current conversation ID in localStorage (browser preference)
  const [currentConvoId, setCurrentConvoId] = useLocalStorage<string | null>(
    'mmstr:current_convo_id',
    null
  );
  
  // Local state for conversations list
  const [conversations, setConversations] = useState<Convo[]>([]);
  const [currentConvo, setCurrentConvo] = useState<Convo | null>(null);
  const [loading, setLoading] = useState(false);

  // Load conversations from database
  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const convos = await getConversations();
      setConversations(convos);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load current conversation
  const loadCurrentConvo = useCallback(async (id: string) => {
    try {
      const convo = await getConversationById(id);
      setCurrentConvo(convo);
    } catch (error) {
      console.error('Error loading current conversation:', error);
    }
  }, []);

  // Load conversations from database on mount
  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load current conversation when currentConvoId changes
  useEffect(() => {
    if (currentConvoId) {
      loadCurrentConvo(currentConvoId);
    } else {
      setCurrentConvo(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConvoId]);

  // Create a new conversation
  const createConversation = useCallback(async (
    title: string,
    maxAttempts: number = 3,
    participantLimit: number = 20
  ): Promise<Convo> => {
    const convo = await createConvoAction(title, maxAttempts, participantLimit);
    await loadConversations();
    return convo;
  }, [loadConversations]);

  // Get conversation by ID
  const getConversation = useCallback(async (id: string): Promise<Convo | null> => {
    return await getConversationById(id);
  }, []);

  // Update conversation
  const updateConversation = useCallback(async (
    id: string,
    updates: Partial<Omit<Convo, 'id' | 'createdAt'>>
  ): Promise<Convo | null> => {
    const updated = await updateConvoAction(id, updates);
    if (updated) {
      await loadConversations();
      if (currentConvoId === id) {
        setCurrentConvo(updated);
      }
    }
    return updated;
  }, [loadConversations, currentConvoId]);

  // Delete conversation
  const deleteConversation = useCallback(async (id: string): Promise<boolean> => {
    const success = await deleteConvoAction(id);
    if (success) {
      await loadConversations();
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
  const getMessages = useCallback(async (convoId: string): Promise<Message[]> => {
    return await getConversationMessages(convoId);
  }, []);

  // Add a message to a conversation
  const addMessage = useCallback(async (
    text: string,
    userId: string,
    convoId: string,
    replyingToMessageId: string | null = null
  ): Promise<Message | null> => {
    return await createMessageAction(text, userId, convoId, replyingToMessageId);
  }, []);

  // Join a conversation
  const joinConversation = useCallback(async (userId: string, convoId: string): Promise<boolean> => {
    return await addParticipation(userId, convoId);
  }, []);

  // Leave a conversation
  const leaveConversation = useCallback(async (userId: string, convoId: string): Promise<boolean> => {
    return await removeParticipation(userId, convoId);
  }, []);

  // Get participants of a conversation
  const getParticipants = useCallback(async (convoId: string): Promise<Participation[]> => {
    return await getConversationParticipants(convoId);
  }, []);

  // Check if user is participating
  const checkParticipation = useCallback(async (userId: string, convoId: string): Promise<boolean> => {
    return await isUserParticipating(userId, convoId);
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    await loadConversations();
    if (currentConvoId) {
      await loadCurrentConvo(currentConvoId);
    }
  }, [loadConversations, loadCurrentConvo, currentConvoId]);

  return {
    conversations,
    currentConvo,
    loading,
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
