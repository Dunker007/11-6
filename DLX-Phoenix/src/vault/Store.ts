import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateTickRevenue, HARDWARE_SPECS } from '../features/economy/RevenueEngine';
import type { HardwareTier, JobType } from '../features/economy/RevenueEngine';
import type { AgentTask } from '../agents/AgentService';

export interface Idea {
    id: string;
    content: string;
    timestamp: number;
    tags: string[];
    isFavorite: boolean;
}

export interface MiningNode {
    id: string;
    name: string;
    type: 'cpu' | 'gpu' | 'quantum';
    hardwareTier: HardwareTier;
    efficiency: number; // 0-100
    status: 'idle' | 'mining' | 'offline';
    sector: string;
    jobType: JobType;
}

export interface Mission {
    id: string;
    name: string;
    type: 'folding' | 'rendering' | 'inference';
    progress: number; // 0-100
    status: 'active' | 'paused' | 'completed';
    reward: string;
}

export interface Module {
    id: string;
    name: string;
    description: string;
    installed: boolean;
    rarity: 'common' | 'rare' | 'legendary';
}

export interface Gem {
    id: string;
    name: string;
    systemInstructions: string;
    provider: 'gemini' | 'openai' | 'anthropic' | 'ollama';
    model: string;
    color: string;
}

interface AppState {
    // User Profile
    credits: number;
    xp: number;
    level: number;

    // Neural Mining
    nodes: MiningNode[];
    networkLoad: number; // 0-100
    missions: Mission[];

    // Idea Vault
    ideas: Idea[];

    // Module Matrix
    modules: Module[];

    // Gem Nexus
    gems: Gem[];
    activeGemId: string | null;

    // Provider Configs
    providerConfigs: {
        openai: { apiKey: string; model: string };
        anthropic: { apiKey: string; model: string };
        ollama: { baseUrl: string; model: string };
    };

    // Agent Tasks
    agentTasks: AgentTask[];

    // Actions
    addCredits: (amount: number) => void;
    addIdea: (idea: Idea) => void;
    toggleNodeStatus: (id: string) => void;
    deployNode: (type: MiningNode['type']) => void;
    toggleModule: (id: string) => void;
    tick: () => void;
    addGem: (gem: Gem) => void;
    setActiveGem: (id: string) => void;
    updateProviderConfig: (provider: 'openai' | 'anthropic' | 'ollama', config: any) => void;
    addAgentTask: (task: AgentTask) => void;
    updateAgentTask: (id: string, updates: Partial<AgentTask>) => void;
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            credits: 1250,
            xp: 450,
            level: 3,

            nodes: [
                { id: 'n-1', name: 'Cortex-Alpha', type: 'cpu', hardwareTier: 'cpu-entry', efficiency: 98, status: 'mining', sector: '0x1', jobType: 'folding' },
                { id: 'n-2', name: 'Nebula-GPU', type: 'gpu', hardwareTier: 'gpu-mid', efficiency: 92, status: 'mining', sector: '0x4', jobType: 'rendering' },
            ],
            networkLoad: 45,
            missions: [
                { id: 'mis-1', name: 'Protein Folding: Alzheimer-Beta', type: 'folding', progress: 45, status: 'active', reward: '500 CR/hr' },
                { id: 'mis-2', name: 'VFX Render: Cyberpunk 2099', type: 'rendering', progress: 12, status: 'active', reward: '1200 CR/hr' },
            ],

            ideas: [],

            modules: [
                { id: 'm-1', name: 'Quantum Router', description: 'Optimizes packet routing for low-latency render jobs.', installed: true, rarity: 'rare' },
                { id: 'm-2', name: 'Neural Lace', description: 'Direct interface for higher quality inference tasks.', installed: false, rarity: 'legendary' },
                { id: 'm-3', name: 'Dark Matter Core', description: 'Unlocks deep space visual themes.', installed: true, rarity: 'common' },
                { id: 'm-4', name: 'Auto-Scaler', description: 'Automatically deploys nodes when rental demand peaks.', installed: false, rarity: 'rare' },
            ],

            gems: [
                { id: 'g-1', name: 'Cyber-Consultant', systemInstructions: 'You are a futuristic business consultant in 2077. Give short, punchy, high-tech business ideas.', provider: 'gemini', model: 'gemini-1.5-flash', color: 'text-hologram-blue' }
            ],
            activeGemId: 'g-1',

            providerConfigs: {
                openai: { apiKey: '', model: 'gpt-4o-mini' },
                anthropic: { apiKey: '', model: 'claude-3-5-sonnet-20241022' },
                ollama: { baseUrl: 'http://localhost:11434', model: 'llama3.2' }
            },

            agentTasks: [],

            addCredits: (amount) => set((state) => ({ credits: state.credits + amount })),

            addIdea: (idea) => set((state) => ({ ideas: [idea, ...state.ideas] })),

            toggleNodeStatus: (id) => set((state) => ({
                nodes: state.nodes.map(n =>
                    n.id === id ? { ...n, status: n.status === 'mining' ? 'idle' : 'mining' } : n
                )
            })),

            deployNode: (type) => set((state) => {
                let tier: HardwareTier = 'cpu-entry';
                if (type === 'gpu') tier = 'gpu-mid';
                if (type === 'quantum') tier = 'quantum-cloud';

                const newNode: MiningNode = {
                    id: `n-${Date.now()}`,
                    name: `${HARDWARE_SPECS[tier].name} ${Math.floor(Math.random() * 99)}`,
                    type,
                    hardwareTier: tier,
                    efficiency: Math.floor(Math.random() * 15) + 85,
                    status: 'idle',
                    sector: `0x${Math.floor(Math.random() * 9)}`,
                    jobType: 'folding'
                };
                return { nodes: [...state.nodes, newNode] };
            }),

            toggleModule: (id) => set((state) => ({
                modules: state.modules.map(m =>
                    m.id === id ? { ...m, installed: !m.installed } : m
                )
            })),

            tick: () => set((state) => {
                let tickRevenue = 0;
                state.nodes.forEach(node => {
                    if (node.status === 'mining') {
                        tickRevenue += calculateTickRevenue(node.hardwareTier, node.jobType, node.efficiency, state.networkLoad);
                    }
                });

                const loadChange = (Math.random() - 0.5) * 2;
                const newLoad = Math.max(10, Math.min(99, state.networkLoad + loadChange));

                return {
                    credits: state.credits + tickRevenue,
                    networkLoad: Number(newLoad.toFixed(1))
                };
            }),

            addGem: (gem) => set((state) => ({ gems: [...state.gems, gem] })),
            setActiveGem: (id) => set(() => ({ activeGemId: id })),
            updateProviderConfig: (provider, config) => set((state) => ({
                providerConfigs: {
                    ...state.providerConfigs,
                    [provider]: { ...state.providerConfigs[provider], ...config }
                }
            })),
            addAgentTask: (task) => set((state) => ({ agentTasks: [task, ...state.agentTasks] })),
            updateAgentTask: (id, updates) => set((state) => ({
                agentTasks: state.agentTasks.map(t => t.id === id ? { ...t, ...updates } : t)
            })),
        }),
        {
            name: 'dlx-vault-storage',
        }
    )
);
