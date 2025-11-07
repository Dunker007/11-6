import { create } from 'zustand';
import type { MonitorLayout } from '@/types/monitor';
import type { Display } from '@/types/electron';

interface MonitorStore {
  // State
  displays: Display[];
  layouts: MonitorLayout[];
  currentLayout: MonitorLayout | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadDisplays: () => Promise<void>;
  loadLayouts: () => Promise<void>;
  saveLayout: (layout: Omit<MonitorLayout, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  deleteLayout: (id: string) => Promise<void>;
  applyLayout: (id: string) => Promise<boolean>;
  setCurrentLayout: (layout: MonitorLayout | null) => void;
}

const STORAGE_KEY = 'dlx_monitor_layouts';

export const useMonitorStore = create<MonitorStore>((set, get) => ({
  displays: [],
  layouts: [],
  currentLayout: null,
  isLoading: false,
  error: null,

  loadDisplays: async () => {
    set({ isLoading: true, error: null });
    try {
      const displays = await window.monitor.getDisplays();
      set({ displays, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
    }
  },

  loadLayouts: async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const layouts: MonitorLayout[] = JSON.parse(stored);
        layouts.forEach((layout) => {
          layout.createdAt = new Date(layout.createdAt);
          layout.updatedAt = new Date(layout.updatedAt);
        });
        set({ layouts });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  saveLayout: async (layoutData) => {
    try {
      const layout: MonitorLayout = {
        id: crypto.randomUUID(),
        ...layoutData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      set((state) => {
        const layouts = [...state.layouts, layout];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
        return { layouts };
      });

      return layout.id;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteLayout: async (id: string) => {
    try {
      set((state) => {
        const layouts = state.layouts.filter((l) => l.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
        if (state.currentLayout?.id === id) {
          return { layouts, currentLayout: null };
        }
        return { layouts };
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  applyLayout: async (id: string) => {
    const layout = get().layouts.find((l) => l.id === id);
    if (!layout) {
      set({ error: 'Layout not found' });
      return false;
    }

    try {
      // Apply each monitor's bounds
      for (const monitor of layout.monitors) {
        await window.monitor.setDisplayBounds(monitor.id, monitor.bounds);
      }

      set({ currentLayout: layout });
      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  setCurrentLayout: (layout: MonitorLayout | null) => {
    set({ currentLayout: layout });
  },
}));

