/**
 * Idle Compute Manager
 * Monetize idle CPU/GPU power
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useRevenueStore } from '../revenue/revenue-engine';
import { logger } from '../foundation/logger';
import { toast } from '../../components/ui/Toast';

export interface IdleComputeState {
  enabled: boolean;
  isRunning: boolean;
  totalEarned: number; // cents
  sessionEarned: number; // cents for current session
  uptime: number; // seconds
  settings: {
    maxCpuUsage: number; // 0-100%
    maxGpuUsage: number; // 0-100%
    onlyWhenIdle: boolean;
    minBatteryLevel: number; // 0-100%
  };
  stats: {
    tasksCompleted: number;
    cpuHours: number;
    gpuHours: number;
    lastPayment?: Date;
  };

  // Actions
  enable: () => void;
  disable: () => void;
  start: () => void;
  stop: () => void;
  updateSettings: (settings: Partial<IdleComputeState['settings']>) => void;
  trackEarnings: (amount: number) => void;
}

export const useIdleCompute = create<IdleComputeState>()(
  persist(
    (set, get) => ({
      enabled: false,
      isRunning: false,
      totalEarned: 0,
      sessionEarned: 0,
      uptime: 0,
      settings: {
        maxCpuUsage: 80,
        maxGpuUsage: 80,
        onlyWhenIdle: true,
        minBatteryLevel: 20,
      },
      stats: {
        tasksCompleted: 0,
        cpuHours: 0,
        gpuHours: 0,
      },

      enable: () => {
        set({ enabled: true });
        logger.info('💻 Idle compute enabled');
        toast.success('Idle compute enabled', {
          description: 'Your computer will earn money when idle',
        });

        // Auto-start if enabled
        if (get().settings.onlyWhenIdle) {
          get().start();
        }
      },

      disable: () => {
        const { stop } = get();
        stop();
        set({ enabled: false });
        logger.info('Idle compute disabled');
        toast.info('Idle compute disabled');
      },

      start: () => {
        const { enabled, settings } = get();

        if (!enabled) {
          toast.error('Enable idle compute first');
          return;
        }

        // Check battery level (if on battery)
        if (navigator && 'getBattery' in navigator) {
          (navigator as any).getBattery().then((battery: any) => {
            if (battery.charging === false && battery.level < settings.minBatteryLevel / 100) {
              toast.warning('Battery too low', {
                description: `Minimum battery level: ${settings.minBatteryLevel}%`,
              });
              return;
            }
          });
        }

        set({ isRunning: true, sessionEarned: 0 });
        logger.info('🚀 Idle compute started');

        // Simulate compute work (in real app, this would connect to compute network)
        simulateComputeWork();
      },

      stop: () => {
        const { sessionEarned } = get();

        set({ isRunning: false });
        logger.info('Idle compute stopped', { sessionEarned });

        if (sessionEarned > 0) {
          toast.info('Session ended', {
            description: `Earned $${(sessionEarned / 100).toFixed(2)} this session`,
          });
        }
      },

      updateSettings: (newSettings) => {
        set(state => ({
          settings: { ...state.settings, ...newSettings },
        }));
        logger.info('Idle compute settings updated', newSettings);
      },

      trackEarnings: (amount) => {
        const { addStream } = useRevenueStore.getState();

        set(state => ({
          totalEarned: state.totalEarned + amount,
          sessionEarned: state.sessionEarned + amount,
          stats: {
            ...state.stats,
            tasksCompleted: state.stats.tasksCompleted + 1,
            cpuHours: state.stats.cpuHours + 0.1, // Estimate
            lastPayment: new Date(),
          },
        }));

        // Add to revenue tracking
        addStream({
          source: 'idle-compute',
          name: 'Idle compute earnings',
          amount,
          currency: 'USD',
          timestamp: new Date(),
          metadata: {
            tasksCompleted: get().stats.tasksCompleted,
          },
        });

        logger.info('💰 Idle compute earnings', { amount });
      },
    }),
    {
      name: 'dlx-idle-compute',
      version: 1,
    }
  )
);

// Simulate compute work (demo mode)
function simulateComputeWork() {
  const { isRunning, trackEarnings } = useIdleCompute.getState();

  if (!isRunning) return;

  // Simulate earning $0.01-0.05 every 10-30 seconds
  const delay = 10000 + Math.random() * 20000; // 10-30 seconds
  const earnings = 1 + Math.floor(Math.random() * 4); // 1-5 cents

  setTimeout(() => {
    if (useIdleCompute.getState().isRunning) {
      trackEarnings(earnings);
      simulateComputeWork(); // Continue
    }
  }, delay);
}
