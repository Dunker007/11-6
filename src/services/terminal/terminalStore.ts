/**
 * terminalStore.ts
 * 
 * Zustand store for managing terminal sessions, history, and state.
 */

import { create } from 'zustand';

export interface TerminalSession {
  id: string;
  name: string;
  workingDirectory?: string;
  createdAt: number;
  isActive: boolean;
}

interface TerminalStore {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  history: Map<string, string[]>; // sessionId -> command history
  maxHistorySize: number;
  
  // Session management
  createSession: (name?: string, workingDirectory?: string) => string;
  deleteSession: (sessionId: string) => void;
  setActiveSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<TerminalSession>) => void;
  
  // History management
  addToHistory: (sessionId: string, command: string) => void;
  getHistory: (sessionId: string) => string[];
  clearHistory: (sessionId: string) => void;
}

const generateSessionId = (): string => {
  return `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  history: new Map(),
  maxHistorySize: 1000,
  
  createSession: (name, workingDirectory) => {
    const sessionId = generateSessionId();
    const session: TerminalSession = {
      id: sessionId,
      name: name || `Terminal ${get().sessions.length + 1}`,
      workingDirectory,
      createdAt: Date.now(),
      isActive: true,
    };
    
    set({
      sessions: [...get().sessions, session],
      activeSessionId: sessionId,
      history: new Map(get().history).set(sessionId, []),
    });
    
    return sessionId;
  },
  
  deleteSession: (sessionId) => {
    const state = get();
    const newSessions = state.sessions.filter(s => s.id !== sessionId);
    const newHistory = new Map(state.history);
    newHistory.delete(sessionId);
    
    let newActiveSessionId = state.activeSessionId;
    if (state.activeSessionId === sessionId) {
      newActiveSessionId = newSessions.length > 0 ? newSessions[0].id : null;
    }
    
    set({
      sessions: newSessions,
      activeSessionId: newActiveSessionId,
      history: newHistory,
    });
  },
  
  setActiveSession: (sessionId) => {
    set({
      activeSessionId: sessionId,
      sessions: get().sessions.map(s => ({
        ...s,
        isActive: s.id === sessionId,
      })),
    });
  },
  
  updateSession: (sessionId, updates) => {
    set({
      sessions: get().sessions.map(s =>
        s.id === sessionId ? { ...s, ...updates } : s
      ),
    });
  },
  
  addToHistory: (sessionId, command) => {
    const state = get();
    const history = state.history.get(sessionId) || [];
    
    // Don't add duplicate consecutive commands
    if (history[history.length - 1] !== command) {
      const newHistory = [...history, command];
      
      // Limit history size
      if (newHistory.length > state.maxHistorySize) {
        newHistory.shift();
      }
      
      const newHistoryMap = new Map(state.history);
      newHistoryMap.set(sessionId, newHistory);
      
      set({ history: newHistoryMap });
    }
  },
  
  getHistory: (sessionId) => {
    return get().history.get(sessionId) || [];
  },
  
  clearHistory: (sessionId) => {
    const newHistory = new Map(get().history);
    newHistory.set(sessionId, []);
    set({ history: newHistory });
  },
}));

