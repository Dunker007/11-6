// Real-world inspired benchmarks for 2025 Distributed Compute Economy
// Base Unit: 1 Credit (CR) ≈ $0.001 USD (Micro-transaction level)

export type HardwareTier = 'cpu-entry' | 'gpu-mid' | 'gpu-high' | 'quantum-cloud';
export type JobType = 'folding' | 'rendering' | 'inference';

interface HardwareStats {
    name: string;
    baseHashrate: number; // Abstract compute power unit
    powerDraw: number; // Watts (for future mechanic?)
    supportedJobs: JobType[];
}

export const HARDWARE_SPECS: Record<HardwareTier, HardwareStats> = {
    'cpu-entry': {
        name: 'Threadripper Node',
        baseHashrate: 10,
        powerDraw: 150,
        supportedJobs: ['folding']
    },
    'gpu-mid': {
        name: 'RTX 4060 Cluster',
        baseHashrate: 45,
        powerDraw: 200,
        supportedJobs: ['folding', 'rendering']
    },
    'gpu-high': {
        name: 'RTX 4090 Beast',
        baseHashrate: 120,
        powerDraw: 450,
        supportedJobs: ['folding', 'rendering', 'inference']
    },
    'quantum-cloud': {
        name: 'H100 Tensor Slice',
        baseHashrate: 500,
        powerDraw: 700,
        supportedJobs: ['folding', 'rendering', 'inference']
    }
};

export const JOB_MULTIPLIERS: Record<JobType, number> = {
    'folding': 0.8,   // Steady, low reward (Science/Charity)
    'rendering': 2.5, // High reward, bursty (VFX/3D)
    'inference': 4.0  // Premium reward (AI Generation)
};

export const calculateTickRevenue = (
    tier: HardwareTier,
    job: JobType,
    efficiency: number, // 0-100
    networkLoad: number // 0-100 (Higher load = higher demand = more pay)
): number => {
    const specs = HARDWARE_SPECS[tier];

    // If job isn't supported, 0 revenue
    if (!specs.supportedJobs.includes(job)) return 0;

    const base = specs.baseHashrate;
    const jobMult = JOB_MULTIPLIERS[job];
    const effMult = efficiency / 100;

    // Network load bonus: High demand increases price per compute unit
    // If load is 80%, bonus is 1.2x. If load is 20%, penalty is 0.8x.
    const demandMult = 0.5 + (networkLoad / 100);

    // Calculate Credits per Tick (assuming 1 tick = 1 second or similar interval)
    // Formula: Base * Job * Efficiency * Demand
    const rawRevenue = base * jobMult * effMult * demandMult;

    // Normalize to a reasonable "per second" drip
    return Number((rawRevenue * 0.01).toFixed(4));
};
