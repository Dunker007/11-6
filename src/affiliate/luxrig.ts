/**
 * LuxRig Affiliate System
 * GPU recommendations and affiliate link management for AI/ML workloads
 */

export interface GPURecommendation {
  id: string;
  name: string;
  gpuModel: string;
  vram: string;
  price: number;
  affiliateUrl: string;
  performance:
    | 'budget'
    | 'mid-range'
    | 'high-end'
    | 'workstation'
    | 'enterprise';
  useCase: string;
  affiliateCommission: number;
  description: string;
  specs: {
    cudaCores: number;
    memoryType: string;
    memoryBandwidth: string;
    powerConsumption: string;
    formFactor: string;
  };
}

export interface LuxRigConfig {
  affiliateId: string;
  defaultCommission: number;
  trackingEnabled: boolean;
}

/**
 * LuxRig Affiliate Manager
 * Handles GPU recommendations and affiliate link generation
 */
export class LuxRigAffiliate {
  private config: LuxRigConfig;
  private gpuDatabase: GPURecommendation[];

  constructor(config: LuxRigConfig) {
    this.config = config;
    this.gpuDatabase = this.initializeGPUDatabase();
  }

  /**
   * Initialize the GPU database with current recommendations
   */
  private initializeGPUDatabase(): GPURecommendation[] {
    return [
      {
        id: 'rtx-4070-super',
        name: 'RTX 4070 Super',
        gpuModel: 'NVIDIA GeForce RTX 4070 Super',
        vram: '12GB GDDR6X',
        price: 599,
        affiliateUrl: `https://luxrig.com/gpu/nvidia-rtx-4070-super?ref=${this.config.affiliateId}`,
        performance: 'high-end',
        useCase: 'AI/ML development, gaming, content creation',
        affiliateCommission: 0.05, // 5%
        description:
          'Excellent balance of performance and value for AI development',
        specs: {
          cudaCores: 7168,
          memoryType: 'GDDR6X',
          memoryBandwidth: '21.4 Gbps',
          powerConsumption: '220W',
          formFactor: 'Dual-slot',
        },
      },
      {
        id: 'rtx-4080',
        name: 'RTX 4080',
        gpuModel: 'NVIDIA GeForce RTX 4080',
        vram: '16GB GDDR6X',
        price: 1199,
        affiliateUrl: `https://luxrig.com/gpu/nvidia-rtx-4080?ref=${this.config.affiliateId}`,
        performance: 'workstation',
        useCase: 'Professional AI/ML, 3D rendering, data science',
        affiliateCommission: 0.05,
        description: 'High-performance GPU for demanding AI workloads',
        specs: {
          cudaCores: 9728,
          memoryType: 'GDDR6X',
          memoryBandwidth: '22.4 Gbps',
          powerConsumption: '320W',
          formFactor: 'Triple-slot',
        },
      },
      {
        id: 'rtx-4090',
        name: 'RTX 4090',
        gpuModel: 'NVIDIA GeForce RTX 4090',
        vram: '24GB GDDR6X',
        price: 1599,
        affiliateUrl: `https://luxrig.com/gpu/nvidia-rtx-4090?ref=${this.config.affiliateId}`,
        performance: 'enterprise',
        useCase: 'Enterprise AI, deep learning research, high-end gaming',
        affiliateCommission: 0.05,
        description:
          'Ultimate performance for the most demanding AI applications',
        specs: {
          cudaCores: 16384,
          memoryType: 'GDDR6X',
          memoryBandwidth: '21 Gbps',
          powerConsumption: '450W',
          formFactor: 'Triple-slot',
        },
      },
      {
        id: 'rx-7900-xtx',
        name: 'RX 7900 XTX',
        gpuModel: 'AMD Radeon RX 7900 XTX',
        vram: '24GB GDDR6',
        price: 999,
        affiliateUrl: `https://luxrig.com/gpu/amd-rx-7900-xtx?ref=${this.config.affiliateId}`,
        performance: 'high-end',
        useCase: 'AI/ML development, content creation, gaming',
        affiliateCommission: 0.05,
        description: 'AMD alternative with excellent AI performance and value',
        specs: {
          cudaCores: 0, // AMD uses compute units
          memoryType: 'GDDR6',
          memoryBandwidth: '20 Gbps',
          powerConsumption: '355W',
          formFactor: 'Dual-slot',
        },
      },
    ];
  }

  /**
   * Get GPU recommendations based on use case and budget
   */
  getRecommendations(
    options: {
      useCase?: 'ai-ml' | 'gaming' | 'content-creation' | 'general';
      budget?: number;
      performance?: 'budget' | 'mid-range' | 'high-end' | 'workstation';
    } = {}
  ): GPURecommendation[] {
    let recommendations = [...this.gpuDatabase];

    // Filter by use case
    if (options.useCase) {
      switch (options.useCase) {
        case 'ai-ml':
          recommendations = recommendations.filter(
            (gpu) =>
              gpu.useCase.includes('AI/ML') ||
              gpu.performance === 'workstation' ||
              gpu.performance === 'enterprise'
          );
          break;
        case 'gaming':
          recommendations = recommendations.filter((gpu) =>
            gpu.useCase.includes('gaming')
          );
          break;
        case 'content-creation':
          recommendations = recommendations.filter((gpu) =>
            gpu.useCase.includes('content creation')
          );
          break;
      }
    }

    // Filter by budget
    if (options.budget !== undefined && options.budget !== null) {
      recommendations = recommendations.filter(
        (gpu) => gpu.price <= options.budget!
      );
    }

    // Filter by performance level
    if (options.performance) {
      recommendations = recommendations.filter(
        (gpu) => gpu.performance === options.performance
      );
    }

    // Sort by price (best value first)
    return recommendations.sort((a, b) => a.price - b.price);
  }

  /**
   * Get a specific GPU recommendation
   */
  getGPU(id: string): GPURecommendation | null {
    return this.gpuDatabase.find((gpu) => gpu.id === id) || null;
  }

  /**
   * Generate affiliate link for a GPU
   */
  generateAffiliateLink(gpuId: string): string | null {
    const gpu = this.getGPU(gpuId);
    return gpu ? gpu.affiliateUrl : null;
  }

  /**
   * Get AI-optimized GPU recommendations
   */
  getAIRecommendations(): GPURecommendation[] {
    return this.getRecommendations({
      useCase: 'ai-ml',
      performance: 'high-end',
    });
  }

  /**
   * Calculate potential earnings from recommendations
   */
  calculatePotentialEarnings(recommendations: GPURecommendation[]): number {
    return recommendations.reduce((total, gpu) => {
      return total + gpu.price * gpu.affiliateCommission;
    }, 0);
  }
}

/**
 * LuxRig Service Instance
 */
export const luxrigAffiliate = new LuxRigAffiliate({
  affiliateId: 'vibed-ed-studio',
  defaultCommission: 0.05, // 5%
  trackingEnabled: true,
});

/**
 * AI Context for GPU Recommendations
 */
export function getGPUContextForAI(): string {
  const recommendations = luxrigAffiliate.getAIRecommendations();
  const topGPU = recommendations[0];

  if (!topGPU) return '';

  return `
LuxRig GPU Recommendations for AI Development:
- ${topGPU.name}: ${topGPU.gpuModel} (${topGPU.vram}) - $${topGPU.price}
- Perfect for: ${topGPU.useCase}
- Affiliate link available for recommendations

I can help recommend the right GPU for your AI/ML workloads based on your specific needs and budget.`;
}
