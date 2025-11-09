/**
 * Generic localStorage utility functions with type safety
 * Provides a standardized interface for storing and retrieving data
 * 
 * NOTE: This file is still used for user identity (UUID) storage in browser localStorage.
 * For conversation/message data, use server actions in app/actions/ instead.
 */

/**
 * Safely get an item from localStorage with type safety
 * @param key The localStorage key
 * @returns The parsed value or null if not found or invalid JSON
 */
export function getItem<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null; // Server-side rendering guard
  }

  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return null;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return null;
  }
}

/**
 * Safely set an item in localStorage
 * @param key The localStorage key
 * @param value The value to store (will be JSON stringified)
 * @returns true if successful, false otherwise
 */
export function setItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false; // Server-side rendering guard
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Remove an item from localStorage
 * @param key The localStorage key
 * @returns true if successful, false otherwise
 */
export function removeItem(key: string): boolean {
  if (typeof window === 'undefined') {
    return false; // Server-side rendering guard
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Clear all items from localStorage
 * @returns true if successful, false otherwise
 */
export function clear(): boolean {
  if (typeof window === 'undefined') {
    return false; // Server-side rendering guard
  }

  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
}

/**
 * Check if a key exists in localStorage
 * @param key The localStorage key
 * @returns true if the key exists, false otherwise
 */
export function hasKey(key: string): boolean {
  if (typeof window === 'undefined') {
    return false; // Server-side rendering guard
  }

  return localStorage.getItem(key) !== null;
}

/**
 * Get all keys from localStorage
 * @returns Array of all localStorage keys
 */
export function getAllKeys(): string[] {
  if (typeof window === 'undefined') {
    return []; // Server-side rendering guard
  }

  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key !== null) {
      keys.push(key);
    }
  }
  return keys;
}
