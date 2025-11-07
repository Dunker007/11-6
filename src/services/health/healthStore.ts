import { create } from 'zustand';
import { healthMonitor, type SystemStats, type HealthMetric, type HealthAlert } from './healthMonitor';

interface HealthStore {
  // State
  stats: SystemStats | null;
  metrics: HealthMetric[];
  alerts: HealthAlert[];
  isMonitoring: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  getSystemStats: () => Promise<void>;
  checkHealth: () => Promise<void>;
  getAlerts: () => HealthAlert[];
  acknowledgeAlert: (id: string) => void;
  startMonitoring: (intervalMs?: number) => void;
  stopMonitoring: () => void;
  clearAlerts: () => void;
}

export const useHealthStore = create<HealthStore>((set) => ({
  stats: null,
  metrics: [],
  alerts: [],
  isMonitoring: false,
  isLoading: false,
  error: null,

  getSystemStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await healthMonitor.getSystemStats();
      set({ stats, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
    }
  },

  checkHealth: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await healthMonitor.getSystemStats();
      const metrics = await healthMonitor.checkHealth(stats);
      const alerts = healthMonitor.getAlerts();
      set({ stats, metrics, alerts, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
    }
  },

  getAlerts: () => {
    return healthMonitor.getAlerts();
  },

  acknowledgeAlert: (id: string) => {
    healthMonitor.acknowledgeAlert(id);
    set({ alerts: healthMonitor.getAlerts() });
  },

  startMonitoring: (intervalMs = 5000) => {
    healthMonitor.startMonitoring(intervalMs);
    set({ isMonitoring: true });
  },

  stopMonitoring: () => {
    healthMonitor.stopMonitoring();
    set({ isMonitoring: false });
  },

  clearAlerts: () => {
    healthMonitor.clearAlerts();
    set({ alerts: [] });
  },
}));

