/**
 * Vibes Store
 * Manages CodeVibe objects for inline code feedback
 */

import { create } from 'zustand';
import type { CodeVibe } from '@/types/agents';

interface VibesState {
  vibes: CodeVibe[];
  setVibes: (vibes: CodeVibe[]) => void;
  addVibe: (vibe: CodeVibe) => void;
  removeVibe: (id: string) => void;
  clearVibes: () => void;
  clearVibesForFile: (filePath: string) => void;
  getVibesForFile: (filePath: string) => CodeVibe[];
}

export const useVibesStore = create<VibesState>((set, get) => ({
  vibes: [],

  setVibes: (vibes) => set({ vibes }),

  addVibe: (vibe) => set((state) => ({
    vibes: [...state.vibes.filter(v => v.id !== vibe.id), vibe],
  })),

  removeVibe: (id) => set((state) => ({
    vibes: state.vibes.filter(v => v.id !== id),
  })),

  clearVibes: () => set({ vibes: [] }),

  clearVibesForFile: (filePath) => set((state) => ({
    vibes: state.vibes.filter(v => v.filePath !== filePath),
  })),

  getVibesForFile: (filePath) => {
    return get().vibes.filter(v => v.filePath === filePath);
  },
}));

