import { FishingSession } from '../types';

const SESSIONS_KEY = 'clicka_fishing_sessions';
const PENDING_SYNCS_KEY = 'clicka_pending_syncs';
const STORAGE_VERSION_KEY = 'clicka_storage_version';
const CURRENT_STORAGE_VERSION = 3;
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB typical localStorage limit
const STORAGE_THRESHOLD = 0.7 * MAX_STORAGE_SIZE; // 70% threshold

// Helper to get storage usage
export const getStorageUsage = (): number => {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      total += (localStorage.getItem(key) || '').length;
    }
  }
  return total;
};

// Check if storage is above threshold
export const isStorageAboveThreshold = (): boolean => {
  return getStorageUsage() > STORAGE_THRESHOLD;
};

// Migrate storage to latest version
const migrateStorage = () => {
  try {
    const version = parseInt(localStorage.getItem(STORAGE_VERSION_KEY) || '0', 10);
    if (version === CURRENT_STORAGE_VERSION) return;

    // Handle migrations based on version
    if (version < 1) {
      // Clear potentially corrupted data
      localStorage.clear();
    }

    if (version < 2) {
      // Remove any compressed data
      const keys = [SESSIONS_KEY, PENDING_SYNCS_KEY];
      for (const key of keys) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            // Try to parse existing data
            const data = JSON.parse(value);
            // Rewrite without compression
            localStorage.setItem(key, JSON.stringify(data));
          }
        } catch {
          // Remove corrupted data
          localStorage.removeItem(key);
        }
      }
    }

    // Update version
    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_STORAGE_VERSION.toString());
  } catch (error) {
    console.error('Storage migration failed:', error);
    // On critical failure, clear storage
    localStorage.clear();
    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_STORAGE_VERSION.toString());
  }
};

// Initialize storage
migrateStorage();

// Save data to localStorage
export const saveToStorage = (key: string, data: any): boolean => {
  try {
    const jsonString = JSON.stringify(data);
    const currentUsage = getStorageUsage();
    
    // Check if we have enough space
    if (jsonString.length + currentUsage > MAX_STORAGE_SIZE) {
      console.warn('Storage quota would be exceeded');
      return false;
    }
    
    localStorage.setItem(key, jsonString);
    return true;
  } catch (error) {
    console.error('Failed to save to storage:', error);
    return false;
  }
};

// Load data from localStorage
export const loadFromStorage = <T>(key: string): T | null => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load from storage:', error);
    // Remove corrupted data
    localStorage.removeItem(key);
    return null;
  }
};

// Remove data from localStorage
export const removeFromStorage = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Failed to remove from storage:', error);
    return false;
  }
};

// Get all storage keys
export const getStorageKeys = (): string[] => {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) keys.push(key);
  }
  return keys;
};