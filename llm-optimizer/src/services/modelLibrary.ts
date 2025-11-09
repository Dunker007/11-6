import { create } from 'zustand';

interface BenchmarkResult {
  modelName: string;
  provider: 'lm-studio' | 'ollama';
  tokensPerSecond: number;
  latency: number;
  memoryUsage: number;
  quality: number;
  timestamp: number;
}

interface ModelLibraryStore {
  results: BenchmarkResult[];
  addBenchmarkResult: (result: BenchmarkResult) => void;
  removeResult: (index: number) => void;
  clearResults: () => void;
  loadResults: () => void;
}

const STORAGE_KEY = 'llm-optimizer-library';

const loadFromStorage = (): BenchmarkResult[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (results: BenchmarkResult[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  } catch {
    // Ignore storage errors
  }
};

export const useModelLibrary = create<ModelLibraryStore>((set, get) => ({
  results: loadFromStorage(),
  loadResults: () => set({ results: loadFromStorage() }),
  addBenchmarkResult: (result) => {
    const newResults = [...get().results, result];
    set({ results: newResults });
    saveToStorage(newResults);
  },
  removeResult: (index) => {
    const newResults = get().results.filter((_, i) => i !== index);
    set({ results: newResults });
    saveToStorage(newResults);
  },
  clearResults: () => {
    set({ results: [] });
    saveToStorage([]);
  },
}));

