import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition: (stats: UserStats) => boolean;
    unlockedAt?: number;
}

export interface UserStats {
    xp: number;
    level: number;
    tasksCompleted: number;
    agentsCreated: number;
    totalTokensUsed: number;
    achievements: string[]; // IDs of unlocked achievements
}

interface GamificationStore extends UserStats {
    addXp: (amount: number) => void;
    incrementTasks: () => void;
    incrementAgents: () => void;
    checkAchievements: () => void;
}

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first_agent',
        name: 'Hello World',
        description: 'Create your first AI Agent.',
        icon: '🤖',
        condition: (stats) => stats.agentsCreated >= 1
    },
    {
        id: 'task_master_1',
        name: 'Getting Things Done',
        description: 'Complete 10 tasks.',
        icon: '✅',
        condition: (stats) => stats.tasksCompleted >= 10
    },
    {
        id: 'level_5',
        name: 'Rising Star',
        description: 'Reach Level 5.',
        icon: '⭐',
        condition: (stats) => stats.level >= 5
    }
];

export const useGamificationStore = create<GamificationStore>()(
    persist(
        (set, get) => ({
            xp: 0,
            level: 1,
            tasksCompleted: 0,
            agentsCreated: 0,
            totalTokensUsed: 0,
            achievements: [],

            addXp: (amount) => {
                const { xp, level } = get();
                const newXp = xp + amount;
                let newLevel = level;

                // Check for level up
                while (newLevel < LEVEL_THRESHOLDS.length && newXp >= LEVEL_THRESHOLDS[newLevel]) {
                    newLevel++;
                }

                set({ xp: newXp, level: newLevel });
                get().checkAchievements();
            },

            incrementTasks: () => {
                set((state) => ({ tasksCompleted: state.tasksCompleted + 1 }));
                get().addXp(50); // 50 XP per task
            },

            incrementAgents: () => {
                set((state) => ({ agentsCreated: state.agentsCreated + 1 }));
                get().addXp(100); // 100 XP per agent
            },

            checkAchievements: () => {
                const state = get();
                const unlocked = [...state.achievements];
                let newUnlock = false;

                ACHIEVEMENTS.forEach(achievement => {
                    if (!unlocked.includes(achievement.id) && achievement.condition(state)) {
                        unlocked.push(achievement.id);
                        newUnlock = true;
                        // TODO: Trigger notification
                        console.log(`Achievement Unlocked: ${achievement.name}`);
                    }
                });

                if (newUnlock) {
                    set({ achievements: unlocked });
                }
            }
        }),
        {
            name: 'dlx-gamification-storage',
        }
    )
);
