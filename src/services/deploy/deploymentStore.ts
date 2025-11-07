import { create } from 'zustand';
import { deploymentService } from './deploymentService';
import type { DeploymentConfig, Deployment, DeploymentHistory, DeploymentTarget } from '@/types/deploy';

interface DeploymentStore {
  // State
  targets: DeploymentTarget[];
  history: DeploymentHistory | null;
  activeDeployment: Deployment | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTargets: () => void;
  loadHistory: () => void;
  deploy: (config: DeploymentConfig) => Promise<Deployment>;
  cancelDeployment: (id: string) => boolean;
  getDeploymentById: (id: string) => Deployment | null;
}

export const useDeploymentStore = create<DeploymentStore>((set, get) => ({
  targets: [],
  history: null,
  activeDeployment: null,
  isLoading: false,
  error: null,

  loadTargets: () => {
    const targets = deploymentService.getAllTargets();
    set({ targets });
  },

  loadHistory: () => {
    const history = deploymentService.getHistory();
    set({ history });
  },

  deploy: async (config) => {
    set({ isLoading: true, error: null });
    try {
      const deployment = await deploymentService.deploy(config);
      get().loadHistory();
      set({ activeDeployment: deployment, isLoading: false });
      return deployment;
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  },

  cancelDeployment: (id) => {
    const cancelled = deploymentService.cancelDeployment(id);
    if (cancelled) {
      get().loadHistory();
      const deployment = get().activeDeployment;
      if (deployment?.id === id) {
        set({ activeDeployment: null });
      }
    }
    return cancelled;
  },

  getDeploymentById: (id) => {
    return deploymentService.getDeploymentById(id);
  },
}));

