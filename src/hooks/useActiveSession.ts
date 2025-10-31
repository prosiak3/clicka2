import { create } from 'zustand';
import { FishingSession } from '../types';

interface ActiveSessionState {
  session: FishingSession | null;
  setSession: (session: FishingSession | null) => void;
}

export const useActiveSession = create<ActiveSessionState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
}));