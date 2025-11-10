/**
 * Custom React hook for managing the current user
 * Handles user creation, persistence, and switching
 * Syncs users with the database via server actions
 */

import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from './use-local-storage';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import type { User } from '@/types/entities';
import { createUser as createUserAction, getUserById as getUserByIdAction, getAllUsers as getAllUsersAction } from '@/app/actions/users';

export interface UseCurrentUserReturn {
  currentUser: User | null;
  currentUserId: number | null;
  allUsers: User[];
  loading: boolean;
  
  // Actions
  setCurrentUser: (userId: number) => void;
  createUser: (name: string) => Promise<User>;
  switchUser: (userId: number) => void;
  clearCurrentUser: () => void;
  getUserById: (userId: number) => User | null;
}

/**
 * Hook for managing the current user
 */
export function useCurrentUser(): UseCurrentUserReturn {
  // Store current user ID in localStorage (per-device)
  const [currentUserId, setCurrentUserId, clearUserId] = useLocalStorage<number | null>(
    STORAGE_KEYS.CURRENT_USER_ID,
    null
  );

  // State for users fetched from database
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false); // Prevent race conditions

  // Load all users from database
  const loadUsers = useCallback(async () => {
    try {
      const users = await getAllUsersAction();
      
      // Filter out any corrupted users with invalid IDs
      const validUsers = users.filter(u => u.id && u.id > 0);
      
      if (validUsers.length < users.length) {
        console.warn(`Found ${users.length - validUsers.length} corrupted user(s) with invalid IDs`);
      }
      
      setAllUsers(validUsers);
      
      // Find current user
      if (currentUserId) {
        const user = validUsers.find(u => u.id === currentUserId);
        if (user) {
          setCurrentUser(user);
        } else {
          // User ID in localStorage doesn't exist in database - clear it
          console.warn('Current user ID not found in database, clearing localStorage');
          clearUserId();
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, clearUserId]);

  // Load users on mount and when currentUserId changes
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Create a new user in database
  const createUser = useCallback(async (name: string): Promise<User> => {
    if (creating) {
      throw new Error('User creation already in progress');
    }
    
    setCreating(true);
    try {
      const newUser = await createUserAction(name);
      
      // Validate the returned user has a valid ID
      if (!newUser.id || newUser.id <= 0) {
        throw new Error('Invalid user ID returned from database');
      }
      
      // Set user state immediately
      setCurrentUserId(newUser.id);
      setCurrentUser(newUser);
      
      // Reload all users from database
      const users = await getAllUsersAction();
      const validUsers = users.filter(u => u.id && u.id > 0);
      setAllUsers(validUsers);
      
      return newUser;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    } finally {
      setCreating(false);
    }
  }, [creating, setCurrentUserId]);

  // Set current user by ID
  const setCurrentUserById = useCallback((userId: number) => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUserId(userId);
      setCurrentUser(user);
    } else {
      console.error('User not found:', userId);
    }
  }, [allUsers, setCurrentUserId]);

  // Switch to a different user
  const switchUser = useCallback((userId: number) => {
    setCurrentUserById(userId);
  }, [setCurrentUserById]);

  // Clear current user (logout)
  const clearCurrentUser = useCallback(() => {
    clearUserId();
    setCurrentUser(null);
  }, [clearUserId]);

  // Get user by ID
  const getUserById = useCallback((userId: number): User | null => {
    return allUsers.find(u => u.id === userId) || null;
  }, [allUsers]);

  // No auto-initialization - users are created explicitly through actions only

  return {
    currentUser,
    currentUserId,
    allUsers,
    loading,
    setCurrentUser: setCurrentUserById,
    createUser,
    switchUser,
    clearCurrentUser,
    getUserById,
  };
}
