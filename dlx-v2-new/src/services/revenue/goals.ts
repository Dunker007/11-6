/**
 * Revenue Goals System
 * Track and manage revenue goals and milestones
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from '../../components/ui/Toast';
import { logger } from '../foundation/logger';

export type GoalPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type GoalStatus = 'active' | 'completed' | 'failed' | 'paused';

export interface RevenueGoal {
  id: string;
  name: string;
  target: number; // in cents
  period: GoalPeriod;
  status: GoalStatus;
  createdAt: Date;
  deadline?: Date;
  startDate: Date;
  progress: number; // 0-100
  currentAmount: number; // in cents
  metadata?: {
    description?: string;
    tags?: string[];
    color?: string;
  };
}

interface GoalsState {
  goals: RevenueGoal[];
  addGoal: (goal: Omit<RevenueGoal, 'id' | 'createdAt' | 'progress' | 'currentAmount'>) => void;
  updateGoal: (id: string, updates: Partial<RevenueGoal>) => void;
  deleteGoal: (id: string) => void;
  updateProgress: (totalRevenue: number, revenueByPeriod: Record<GoalPeriod, number>) => void;
  completeGoal: (id: string) => void;
  pauseGoal: (id: string) => void;
  resumeGoal: (id: string) => void;
  getActiveGoals: () => RevenueGoal[];
  getGoalsByStatus: (status: GoalStatus) => RevenueGoal[];
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],

      addGoal: (goalData) => {
        const newGoal: RevenueGoal = {
          ...goalData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          progress: 0,
          currentAmount: 0,
        };

        set((state) => ({
          goals: [...state.goals, newGoal],
        }));

        logger.info('💰 Goal created', { goal: newGoal.name, target: newGoal.target });
        toast.success('Goal created!', {
          description: `${newGoal.name} - $${(newGoal.target / 100).toFixed(0)} target`,
        });
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        }));
        logger.info('📝 Goal updated', { id });
      },

      deleteGoal: (id) => {
        const goal = get().goals.find((g) => g.id === id);
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }));

        logger.info('🗑️ Goal deleted', { goal: goal?.name });
        toast.info('Goal deleted', { description: goal?.name });
      },

      updateProgress: (_totalRevenue, revenueByPeriod) => {
        const goals = get().goals;
        const now = new Date();

        goals.forEach((goal) => {
          if (goal.status !== 'active') return;

          // Get revenue for this goal's period
          let relevantRevenue = 0;

          switch (goal.period) {
            case 'day':
              relevantRevenue = revenueByPeriod.day || 0;
              break;
            case 'week':
              relevantRevenue = revenueByPeriod.week || 0;
              break;
            case 'month':
              relevantRevenue = revenueByPeriod.month || 0;
              break;
            case 'quarter':
              relevantRevenue = revenueByPeriod.quarter || 0;
              break;
            case 'year':
              relevantRevenue = revenueByPeriod.year || 0;
              break;
          }

          const progress = Math.min(100, (relevantRevenue / goal.target) * 100);
          const prevProgress = goal.progress;

          // Update progress
          get().updateGoal(goal.id, {
            currentAmount: relevantRevenue,
            progress,
          });

          // Check for completion
          if (progress >= 100 && prevProgress < 100) {
            get().completeGoal(goal.id);
          }

          // Check for milestone notifications (25%, 50%, 75%)
          const milestones = [25, 50, 75];
          milestones.forEach((milestone) => {
            if (prevProgress < milestone && progress >= milestone) {
              toast.success(`${milestone}% to goal!`, {
                description: `${goal.name} is ${milestone}% complete`,
              });
            }
          });

          // Check for deadline
          if (goal.deadline && now > new Date(goal.deadline) && progress < 100) {
            get().updateGoal(goal.id, { status: 'failed' });
            toast.error('Goal deadline passed', {
              description: `${goal.name} was not completed in time`,
            });
          }
        });
      },

      completeGoal: (id) => {
        const goal = get().goals.find((g) => g.id === id);
        if (!goal) return;

        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, status: 'completed' as GoalStatus, progress: 100 } : g
          ),
        }));

        logger.info('✅ Goal completed!', { goal: goal.name });
        toast.success('🎉 Goal completed!', {
          description: `${goal.name} - $${(goal.currentAmount / 100).toFixed(2)}/$${(goal.target / 100).toFixed(2)}`,
        });
      },

      pauseGoal: (id) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, status: 'paused' as GoalStatus } : g
          ),
        }));
        logger.info('⏸️ Goal paused', { id });
      },

      resumeGoal: (id) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, status: 'active' as GoalStatus } : g
          ),
        }));
        logger.info('▶️ Goal resumed', { id });
      },

      getActiveGoals: () => {
        return get().goals.filter((g) => g.status === 'active');
      },

      getGoalsByStatus: (status) => {
        return get().goals.filter((g) => g.status === status);
      },
    }),
    {
      name: 'dlx-goals',
    }
  )
);
