import { create } from 'zustand';
import type { EdStatus, ItorStatus, AgentPairState, AgentPairWorkflow } from '@/types/agents';

interface AgentStore extends Omit<AgentPairState, 'currentWorkflow'> {
  currentWorkflow: AgentPairState['currentWorkflow'] | null;
  workflows: AgentPairWorkflow[];
  
  // Actions
  setEdStatus: (status: EdStatus) => void;
  setItorStatus: (status: ItorStatus) => void;
  setWorkflow: (workflow: AgentPairState['currentWorkflow']) => void;
  resetPair: () => void;
  addWorkflow: (workflow: AgentPairWorkflow) => void;
  incrementReviewCount: () => void;
  incrementIssuesFound: (count?: number) => void;
}

const initialState: AgentPairState = {
  edStatus: 'idle',
  itorStatus: 'idle',
  currentWorkflow: 'idle',
  reviewCount: 0,
  issuesFound: 0,
};

export const useAgentStore = create<AgentStore>((set) => ({
  ...initialState,
  currentWorkflow: null,
  workflows: [],

  setEdStatus: (status: EdStatus) => {
    set({
      edStatus: status,
      lastEdActivity: new Date(),
    });
  },

  setItorStatus: (status: ItorStatus) => {
    set({
      itorStatus: status,
      lastItorActivity: new Date(),
    });
  },

  setWorkflow: (workflow: AgentPairState['currentWorkflow']) => {
    set({ currentWorkflow: workflow });
  },

  resetPair: () => {
    set({
      ...initialState,
      workflows: [],
    });
  },

  addWorkflow: (workflow: AgentPairWorkflow) => {
    set((state) => ({
      workflows: [...state.workflows, workflow],
    }));
  },

  incrementReviewCount: () => {
    set((state) => ({
      reviewCount: state.reviewCount + 1,
    }));
  },

  incrementIssuesFound: (count = 1) => {
    set((state) => ({
      issuesFound: state.issuesFound + count,
    }));
  },
}));

