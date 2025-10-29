import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LastSpeciesState {
  lastSpecies: string | null;
  setLastSpecies: (species: string) => void;
}

export const useLastSpecies = create<LastSpeciesState>()(
  persist(
    (set) => ({
      lastSpecies: null,
      setLastSpecies: (species) => set({ lastSpecies: species }),
    }),
    {
      name: 'clicka-last-species',
    }
  )
);