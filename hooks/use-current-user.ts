/**
 * Custom React hook for managing the current user
 * Handles user creation, persistence, and switching
 */

import { useCallback, useEffect } from 'react';
import { useLocalStorage } from './use-local-storage';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { getItem, setItem } from '@/lib/storage';
import type { User } from '@/types/entities';

export interface UseCurrentUserReturn {
  currentUser: User | null;
  currentUserId: string | null;
  allUsers: User[];
  
  // Actions
  setCurrentUser: (userId: string) => void;
  createUser: (name: string) => User;
  switchUser: (userId: string) => void;
  clearCurrentUser: () => void;
  getUserById: (userId: string) => User | null;
}

/**
 * Hook for managing the current user
 */
export function useCurrentUser(): UseCurrentUserReturn {
  // Store current user ID in localStorage
  const [currentUserId, setCurrentUserId, clearUserId] = useLocalStorage<string | null>(
    STORAGE_KEYS.CURRENT_USER_ID,
    null
  );

  // Store all users in localStorage
  const [allUsers, setAllUsers] = useLocalStorage<User[]>(
    'explicame:users',
    []
  );

  // Get current user object
  const currentUser = allUsers.find(u => u.id === currentUserId) || null;

  // Generate unique user ID
  const generateUserId = useCallback((): string => {
    const counters = getItem<Record<string, number>>(STORAGE_KEYS.ID_COUNTERS) || {};
    const currentId = counters['user'] || 0;
    const nextId = currentId + 1;
    
    counters['user'] = nextId;
    setItem(STORAGE_KEYS.ID_COUNTERS, counters);
    
    return `user_${nextId}`;
  }, []);

  // Create a new user
  const createUser = useCallback((name: string): User => {
    const newUser: User = {
      id: generateUserId(),
      name,
      createdAt: new Date().toISOString(),
    };

    setAllUsers(prev => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    
    return newUser;
  }, [generateUserId, setAllUsers, setCurrentUserId]);

  // Set current user by ID
  const setCurrentUser = useCallback((userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUserId(userId);
    } else {
      console.error('User not found:', userId);
    }
  }, [allUsers, setCurrentUserId]);

  // Switch to a different user
  const switchUser = useCallback((userId: string) => {
    setCurrentUser(userId);
  }, [setCurrentUser]);

  // Clear current user (logout)
  const clearCurrentUser = useCallback(() => {
    clearUserId();
  }, [clearUserId]);

  // Get user by ID
  const getUserById = useCallback((userId: string): User | null => {
    return allUsers.find(u => u.id === userId) || null;
  }, [allUsers]);

  // Create a default user if none exists
  useEffect(() => {
    if (allUsers.length === 0) {
      createUser('User 1');
    }
  }, []); // Run only once on mount

  return {
    currentUser,
    currentUserId,
    allUsers,
    setCurrentUser,
    createUser,
    switchUser,
    clearCurrentUser,
    getUserById,
  };
}
