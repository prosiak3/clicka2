import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FishingSession } from '../types';

interface ActiveSessionState {
  session: FishingSession | null;
  setSession: (session: FishingSession | null) => void;
  clearSession: () => void;
  updateLastActivity: () => void;
}

export const useActiveSession = create<ActiveSessionState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
      updateLastActivity: () => set((state) => {
        if (!state.session) return state;
        return {
          session: {
            ...state.session,
            last_activity_at: new Date().toISOString()
          }
        };
      }),
    }),
    {
      name: 'clicka-active-session',
      version: 1,
    }
  )
);