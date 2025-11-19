// achievements.ts – placeholder for gamification achievements and XP rules
export const achievements = [
    {
        id: 'first-assist',
        title: 'First Assistant Run',
        description: 'Run the AI Assistant for the first time.',
        xp: 100,
    },
    {
        id: 'ten-tasks',
        title: 'Task Master',
        description: 'Complete 10 agent tasks.',
        xp: 500,
    },
    // Add more achievement definitions here
];

export const xpPerTask = 50; // Base XP awarded for each successful task
