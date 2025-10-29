import { supabase } from './db';
import { User } from '../types';

const AUTH_RETRY_DELAY = 2000; // 2 seconds
const MAX_AUTH_RETRIES = 3;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryAuth<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_AUTH_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Auth operation failed (attempt ${attempt + 1}/${MAX_AUTH_RETRIES}):`, error);
      if (attempt < MAX_AUTH_RETRIES - 1) {
        await delay(AUTH_RETRY_DELAY * Math.pow(2, attempt)); // Exponential backoff
      }
    }
  }

  throw lastError || new Error('Authentication failed after retries');
}

export async function signUp(email: string, password: string) {
  try {
    return await retryAuth(async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });
      
      if (error) throw error;
      return data;
    });
  } catch (error) {
    console.error('Sign up error:', error);
    throw new Error('Failed to create account. Please check your connection and try again.');
  }
}

export async function signIn(email: string, password: string) {
  try {
    return await retryAuth(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return data;
    });
  } catch (error) {
    console.error('Sign in error:', error);
    throw new Error('Failed to sign in. Please check your connection and try again.');
  }
}

export async function signOut() {
  try {
    // Get current session first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await retryAuth(async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    });
    
    // Clear local storage
    localStorage.removeItem('clicka_auth_token');
  } catch (error) {
    console.error('Sign out error:', error);
    throw new Error('Failed to sign out. Please check your connection and try again.');
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    return await retryAuth(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      return {
        id: user.id,
        email: user.email!,
        created_at: user.created_at
      };
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}