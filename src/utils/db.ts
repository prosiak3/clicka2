import { createClient } from '@supabase/supabase-js';
import { FishingSession } from '../types';
import { saveToStorage, loadFromStorage, getStorageUsage } from './storage';

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase Config Check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseKey,
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'missing'
});

if (!supabaseUrl || !supabaseKey) {
  const errorMsg = `Missing Supabase environment variables. URL: ${!!supabaseUrl}, KEY: ${!!supabaseKey}`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}

// Create Supabase client with improved configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  },
  global: {
    headers: { 'x-custom-timeout': '30000' }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Constants
const SESSIONS_KEY = 'clicka_fishing_sessions';
const PENDING_SYNCS_KEY = 'clicka_pending_syncs';
const MAX_LOCAL_SESSIONS = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const OPERATION_TIMEOUT = 30000;
const STORAGE_THRESHOLD = 4 * 1024 * 1024; // 4MB threshold

// Helper function to add delay between retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry failed operations with timeout
async function retryOperation<T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), OPERATION_TIMEOUT);

      try {
        const result = await Promise.race([
          operation(),
          new Promise((_, reject) => {
            controller.signal.addEventListener('abort', () => {
              reject(new Error('Operation timed out'));
            });
          })
        ]);

        clearTimeout(timeoutId);
        return result as T;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      lastError = error as Error;
      console.warn(`Operation failed (attempt ${attempt + 1}/${retries}):`, error);
      
      if (attempt < retries - 1) {
        await delay(RETRY_DELAY * Math.pow(2, attempt));
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

// Load sessions from both local storage and Supabase
export const loadSessions = async (): Promise<FishingSession[]> => {
  // Get sessions from local storage first
  const localSessions = getSessions();

  try {
    // Check if we have a valid session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('No valid auth session found, using local data only');
      return localSessions;
    }

    // Get sessions from Supabase with timeout and retry
    const { data: sessions, error: sessionsError } = await retryOperation(async () => {
      const response = await supabase
        .from('fishing_sessions')
        .select('*')
        .order('start_time', { ascending: false });

      if (response.error) {
        throw response.error;
      }
      return response;
    });

    if (sessionsError) {
      console.error('Failed to fetch sessions:', sessionsError);
      return localSessions;
    }

    // Get catches for all sessions
    const { data: catches, error: catchesError } = await retryOperation(async () => {
      const response = await supabase
        .from('fish_catches')
        .select('*')
        .in('session_id', sessions.map(s => s.id));

      if (response.error) {
        throw response.error;
      }
      return response;
    });

    if (catchesError) {
      console.error('Failed to fetch catches:', catchesError);
      return localSessions;
    }

    // Convert to our app's format
    const formattedSessions: FishingSession[] = sessions.map(session => ({
      id: session.id,
      userId: session.user_id,
      startTime: session.start_time,
      endTime: session.end_time,
      weather: session.weather,
      initialWeather: session.weather,
      locations: session.locations,
      notes: session.notes,
      catches: catches
        .filter(c => c.session_id === session.id)
        .map(catch_ => ({
          id: catch_.id,
          sessionId: catch_.session_id,
          species: catch_.species,
          length: catch_.length,
          weight: catch_.weight,
          location: catch_.location,
          weather: catch_.weather,
          photoUrls: catch_.photo_urls,
          timestamp: catch_.timestamp,
        })),
      synced: true,
      pauses: session.pauses || [],
      totalPauseTime: session.total_pause_time || 0,
      tracking_enabled: session.tracking_enabled ?? true,
      tracking_interval: session.tracking_interval ?? 15
    }));

    // Merge with local sessions (prefer local versions of unsynced sessions)
    const mergedSessions = mergeSessionsWithLocal(formattedSessions, localSessions);

    // Save merged sessions to local storage
    saveToStorage(SESSIONS_KEY, mergedSessions);
    
    return mergedSessions;
  } catch (error) {
    console.error('Failed to load from Supabase:', error);
    // Fall back to local storage
    return localSessions;
  }
};

// Helper function to merge remote and local sessions
function mergeSessionsWithLocal(remoteSessions: FishingSession[], localSessions: FishingSession[]): FishingSession[] {
  const localSessionMap = new Map(localSessions.map(s => [s.id, s]));
  
  return remoteSessions.map(remoteSession => {
    const localSession = localSessionMap.get(remoteSession.id);
    if (localSession && !localSession.synced) {
      return localSession; // Prefer local unsynced version
    }
    return remoteSession;
  });
}

// Get sessions from local storage
export const getSessions = (): FishingSession[] => {
  try {
    return loadFromStorage<FishingSession[]>(SESSIONS_KEY) || [];
  } catch (error) {
    console.error('Failed to load sessions from local storage:', error);
    return [];
  }
};

// Save session both locally and to Supabase
export const saveSession = async (session: FishingSession) => {
  // Save to local storage first
  let sessions = getSessions();
  const existingIndex = sessions.findIndex(s => s.id === session.id);
  
  if (existingIndex >= 0) {
    sessions[existingIndex] = session;
  } else {
    sessions.unshift(session);
  }

  // Check storage usage
  const currentUsage = getStorageUsage();
  if (currentUsage > STORAGE_THRESHOLD) {
    console.warn('Storage usage above threshold, cleaning up old sessions');
    sessions = sessions.slice(0, MAX_LOCAL_SESSIONS);
  }
  
  // Save to local storage
  if (!saveToStorage(SESSIONS_KEY, sessions)) {
    console.warn('Failed to save to local storage, cleaning up old sessions');
    sessions = sessions.slice(0, MAX_LOCAL_SESSIONS);
    if (!saveToStorage(SESSIONS_KEY, sessions)) {
      console.error('Failed to save even after cleanup');
    }
  }

  // Try to sync with Supabase
  try {
    await syncSessionToSupabase(session);
    session.synced = true;
    removePendingSync(session.id);
  } catch (error) {
    console.error('Failed to sync with Supabase:', error);
    session.synced = false;
    addToPendingSync(session.id);
  }

  // Update local storage with sync status
  saveToStorage(SESSIONS_KEY, sessions);
};

// Sync a single session to Supabase
async function syncSessionToSupabase(session: FishingSession) {
  await retryOperation(async () => {
    const { error: sessionError } = await supabase
      .from('fishing_sessions')
      .upsert({
        id: session.id,
        user_id: session.userId,
        start_time: session.startTime,
        end_time: session.endTime,
        weather: session.weather,
        locations: session.locations,
        notes: session.notes,
        pauses: session.pauses,
        total_pause_time: session.totalPauseTime,
        tracking_enabled: session.tracking_enabled,
        tracking_interval: session.tracking_interval
      });

    if (sessionError) throw sessionError;

    // Save catches if any exist
    if (session.catches.length > 0) {
      const { error: catchesError } = await supabase
        .from('fish_catches')
        .upsert(
          session.catches.map(catch_ => ({
            id: catch_.id,
            session_id: session.id,
            species: catch_.species,
            length: catch_.length,
            weight: catch_.weight,
            location: catch_.location,
            weather: catch_.weather,
            photo_urls: catch_.photoUrls,
            timestamp: catch_.timestamp
          }))
        );

      if (catchesError) throw catchesError;
    }
  });
}

// Sync management
export const addToPendingSync = (sessionId: string) => {
  const pending = loadFromStorage<string[]>(PENDING_SYNCS_KEY) || [];
  if (!pending.includes(sessionId)) {
    pending.push(sessionId);
    saveToStorage(PENDING_SYNCS_KEY, pending);
  }
};

export const getPendingSyncs = (): string[] => {
  return loadFromStorage<string[]>(PENDING_SYNCS_KEY) || [];
};

export const removePendingSync = (sessionId: string) => {
  const pending = getPendingSyncs();
  const updated = pending.filter(id => id !== sessionId);
  saveToStorage(PENDING_SYNCS_KEY, updated);
};

// Sync all pending sessions
export const syncPendingSessions = async () => {
  const pending = getPendingSyncs();
  const sessions = getSessions();

  for (const sessionId of pending) {
    const session = sessions.find(s => s.id === sessionId);
    if (session && !session.synced) {
      try {
        await syncSessionToSupabase(session);
        session.synced = true;
        removePendingSync(session.id);
      } catch (error) {
        console.error(`Failed to sync session ${sessionId}:`, error);
      }
    }
  }
};

export const deleteSessions = async (sessionIds: string[]): Promise<void> => {
  await retryOperation(async () => {
    const { error: catchesError } = await supabase
      .from('fish_catches')
      .delete()
      .in('session_id', sessionIds);

    if (catchesError) throw catchesError;

    const { error: sessionsError } = await supabase
      .from('fishing_sessions')
      .delete()
      .in('id', sessionIds);

    if (sessionsError) throw sessionsError;

    const sessions = getSessions();
    const updatedSessions = sessions.filter(s => !sessionIds.includes(s.id));
    saveToStorage(SESSIONS_KEY, updatedSessions);

    sessionIds.forEach(id => removePendingSync(id));
  });
};