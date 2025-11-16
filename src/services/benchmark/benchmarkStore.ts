import { create } from 'zustand';
import { benchmarkService } from '@/services/benchmark/benchmarkService';
import type { BenchmarkSuite } from '@/services/benchmark/benchmarkService';

interface BenchmarkStore {
  suite: BenchmarkSuite | null;
  isRunning: boolean;
  currentTest: string | null;
  progress: number;
  error: string | null;
  lastRun: Date | null;
  
  runBenchmarkSuite: () => Promise<void>;
  clearResults: () => void;
}

export const useBenchmarkStore = create<BenchmarkStore>((set, get) => ({
  suite: null,
  isRunning: false,
  currentTest: null,
  progress: 0,
  error: null,
  lastRun: null,

  runBenchmarkSuite: async () => {
    if (get().isRunning) return;
    
    set({ 
      isRunning: true, 
      error: null, 
      currentTest: null, 
      progress: 0 
    });

    try {
      const suite = await benchmarkService.runBenchmarkSuite((test, progress) => {
        set({ currentTest: test, progress });
      });

      set({
        suite,
        isRunning: false,
        currentTest: null,
        progress: 100,
        lastRun: new Date(),
      });
    } catch (error) {
      set({
        isRunning: false,
        error: (error as Error).message,
        currentTest: null,
        progress: 0,
      });
    }
  },

  clearResults: () => {
    set({
      suite: null,
      lastRun: null,
      error: null,
    });
  },
}));

