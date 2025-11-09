// src/services/idea/ideaInventoryService.ts

export interface Idea {
  id: string;
  topic: string;
  title: string;
  description: string;
  source: string;
  status: 'keep' | 'delete' | 'pending';
  created: Date;
}

const STORAGE_KEY = 'idea-inventory-status';

class IdeaInventoryService {
  private static instance: IdeaInventoryService;
  private ideas: Idea[] = [];
  private statusMap: Map<string, 'keep' | 'delete' | 'pending'> = new Map();

  private constructor() {
    this.loadStatuses();
    this.extractIdeas();
  }

  static getInstance(): IdeaInventoryService {
    if (!IdeaInventoryService.instance) {
      IdeaInventoryService.instance = new IdeaInventoryService();
    }
    return IdeaInventoryService.instance;
  }

  private loadStatuses(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null) {
          Object.entries(parsed).forEach(([id, status]) => {
            this.statusMap.set(id, status as 'keep' | 'delete' | 'pending');
          });
        }
      }
    } catch (error) {
      console.error('Failed to load idea statuses:', error);
    }
  }

  private saveStatuses(): void {
    try {
      const statusObj: Record<string, string> = {};
      this.statusMap.forEach((status, id) => {
        statusObj[id] = status;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(statusObj));
    } catch (error) {
      console.error('Failed to save idea statuses:', error);
    }
  }

  private extractIdeas(): void {
    const ideas: Idea[] = [];

    // Passive Income Ideas
    ideas.push(
      {
        id: 'affiliate-content-factory',
        topic: 'Passive Income',
        title: 'Affiliate Content Factory',
        description: 'Automated system that writes and posts affiliate product reviews. Feeds product list to local LLM, generates reviews, and auto-posts. Projected $500-1,000/month in commissions.',
        source: 'test-affiliate-factory.js',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'niche-sites',
        topic: 'Passive Income',
        title: 'Niche Sites',
        description: 'Build automated niche websites for passive revenue generation.',
        source: 'Kai Persona',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'digital-product-stores',
        topic: 'Passive Income',
        title: 'Digital Product Stores',
        description: 'Create and manage digital product stores for automated sales.',
        source: 'Kai Persona',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'membership-hubs',
        topic: 'Passive Income',
        title: 'Membership Hubs',
        description: 'Build membership-based platforms with recurring revenue.',
        source: 'Kai Persona',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'automated-content-farms',
        topic: 'Passive Income',
        title: 'Automated Content Farms',
        description: 'Automated content generation systems for SEO and monetization.',
        source: 'Kai Persona',
        status: 'pending',
        created: new Date(),
      },
    );

    // LLM Optimizer Features
    ideas.push(
      {
        id: 'system-overview',
        topic: 'LLM Optimization',
        title: 'System Overview',
        description: 'View detailed system specifications (CPU, RAM, GPU) with recommendations.',
        source: 'llm-optimizer/README.md',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'llm-detection',
        topic: 'LLM Optimization',
        title: 'LLM Detection',
        description: 'Automatically detect LM Studio, Ollama, and Bolt.diy installations.',
        source: 'llm-optimizer/README.md',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'benchmark-runner',
        topic: 'LLM Optimization',
        title: 'Benchmark Runner',
        description: 'Test and benchmark LLM models for performance metrics.',
        source: 'llm-optimizer/README.md',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'model-library',
        topic: 'LLM Optimization',
        title: 'Model Library',
        description: 'Store and compare benchmark results across models.',
        source: 'llm-optimizer/README.md',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'bolt-optimizer',
        topic: 'LLM Optimization',
        title: 'Bolt.diy Optimizer',
        description: 'Optimize Bolt.diy configuration based on system specs.',
        source: 'llm-optimizer/README.md',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'dev-tools-manager',
        topic: 'LLM Optimization',
        title: 'Dev Tools Manager',
        description: 'Automatically install and manage development tools (Node.js, Python, Git, Docker, VS Code).',
        source: 'llm-optimizer/README.md',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'filesystem-manager',
        topic: 'LLM Optimization',
        title: 'Filesystem Manager',
        description: 'Browse drives, manage files, and perform automated system cleanup.',
        source: 'llm-optimizer/README.md',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'system-cleanup',
        topic: 'LLM Optimization',
        title: 'System Cleanup',
        description: 'Automated cleanup of temp files, cache, and Windows registry.',
        source: 'llm-optimizer/README.md',
        status: 'pending',
        created: new Date(),
      },
    );

    // AI Features
    ideas.push(
      {
        id: 'code-completion',
        topic: 'AI Features',
        title: 'Code Completion',
        description: 'AI-powered autocomplete suggestions while typing.',
        source: 'NEXT_STEPS.md',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'code-review',
        topic: 'AI Features',
        title: 'Code Review',
        description: 'Automated code review suggestions.',
        source: 'NEXT_STEPS.md',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'refactoring-assistant',
        topic: 'AI Features',
        title: 'Refactoring Assistant',
        description: 'AI-guided refactoring suggestions.',
        source: 'NEXT_STEPS.md',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'documentation-generator',
        topic: 'AI Features',
        title: 'Documentation Generator',
        description: 'Auto-generate documentation from code.',
        source: 'NEXT_STEPS.md',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'inline-code-suggestions',
        topic: 'AI Features',
        title: 'Inline Code Suggestions',
        description: 'Copilot-style AI suggestions while typing.',
        source: 'NEXT_STEPS.md',
        status: 'pending',
        created: new Date(),
      },
    );

    // Developer Experience
    ideas.push(
      {
        id: 'terminal-integration',
        topic: 'Developer Experience',
        title: 'Terminal Integration',
        description: 'Built-in terminal for command execution.',
        source: 'NEXT_STEPS.md',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'git-integration',
        topic: 'Developer Experience',
        title: 'Git Integration',
        description: 'Visual git operations and branch management.',
        source: 'NEXT_STEPS.md',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'debugging',
        topic: 'Developer Experience',
        title: 'Debugging',
        description: 'Integrated debugger for code debugging.',
        source: 'NEXT_STEPS.md',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'testing',
        topic: 'Developer Experience',
        title: 'Testing',
        description: 'Test runner and coverage reporting.',
        source: 'NEXT_STEPS.md',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'workspace-management',
        topic: 'Developer Experience',
        title: 'Workspace Management',
        description: 'Multi-workspace support for managing multiple projects.',
        source: 'NEXT_STEPS.md',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'plugin-system',
        topic: 'Developer Experience',
        title: 'Plugin System',
        description: 'Extensibility framework for custom plugins.',
        source: 'NEXT_STEPS.md',
        status: 'pending',
        created: new Date(),
      },
    );

    // Revenue Streams
    ideas.push(
      {
        id: 'saas-subscriptions',
        topic: 'Revenue Streams',
        title: 'SaaS Subscriptions',
        description: 'Recurring subscription revenue model.',
        source: 'src/types/backoffice.ts',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'affiliate',
        topic: 'Revenue Streams',
        title: 'Affiliate Marketing',
        description: 'Affiliate commission revenue.',
        source: 'src/types/backoffice.ts',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'crypto-trading',
        topic: 'Revenue Streams',
        title: 'Crypto Trading',
        description: 'Cryptocurrency trading revenue.',
        source: 'src/types/backoffice.ts',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'crypto-staking',
        topic: 'Revenue Streams',
        title: 'Crypto Staking',
        description: 'Cryptocurrency staking rewards.',
        source: 'src/types/backoffice.ts',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'idle-computing',
        topic: 'Revenue Streams',
        title: 'Idle Computing',
        description: 'Monetize idle computing resources.',
        source: 'src/types/backoffice.ts',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'product-sales',
        topic: 'Revenue Streams',
        title: 'Product Sales',
        description: 'One-time product sales revenue.',
        source: 'src/types/backoffice.ts',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'service-revenue',
        topic: 'Revenue Streams',
        title: 'Service Revenue',
        description: 'Service-based revenue streams.',
        source: 'src/types/backoffice.ts',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'certifications',
        topic: 'Revenue Streams',
        title: 'Certifications',
        description: 'Certification program revenue.',
        source: 'src/types/backoffice.ts',
        status: 'pending',
        created: new Date(),
      },
    );

    // Infrastructure
    ideas.push(
      {
        id: 'ci-cd-pipeline',
        topic: 'Infrastructure',
        title: 'CI/CD Pipeline',
        description: 'GitHub Actions for automated builds and deployments.',
        source: 'NEXT_STEPS.md',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'code-signing',
        topic: 'Infrastructure',
        title: 'Code Signing',
        description: 'Set up certificates for production code signing.',
        source: 'NEXT_STEPS.md',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'error-reporting',
        topic: 'Infrastructure',
        title: 'Error Reporting',
        description: 'Crash reporting and analytics system.',
        source: 'NEXT_STEPS.md',
        status: 'pending',
        created: new Date(),
      },
      {
        id: 'analytics-dashboard',
        topic: 'Infrastructure',
        title: 'Analytics Dashboard',
        description: 'Code stats, productivity metrics, and usage analytics.',
        source: 'NEXT_STEPS.md',
        status: 'pending',
        created: new Date(),
      },
    );

    // Apply saved statuses
    this.ideas = ideas.map(idea => ({
      ...idea,
      status: this.statusMap.get(idea.id) || idea.status,
    }));
  }

  getAllIdeas(): Idea[] {
    return [...this.ideas];
  }

  getIdeasByTopic(topic: string): Idea[] {
    return this.ideas.filter(idea => idea.topic === topic);
  }

  getTopics(): string[] {
    return Array.from(new Set(this.ideas.map(idea => idea.topic)));
  }

  updateIdeaStatus(id: string, status: 'keep' | 'delete' | 'pending'): void {
    const idea = this.ideas.find(i => i.id === id);
    if (idea) {
      idea.status = status;
      this.statusMap.set(id, status);
      this.saveStatuses();
    }
  }

  bulkUpdateStatus(ids: string[], status: 'keep' | 'delete' | 'pending'): void {
    ids.forEach(id => {
      this.updateIdeaStatus(id, status);
    });
  }

  getKeptIdeas(): Idea[] {
    return this.ideas.filter(idea => idea.status === 'keep');
  }

  getDeletedIdeas(): Idea[] {
    return this.ideas.filter(idea => idea.status === 'delete');
  }

  exportIdeas(filter?: (idea: Idea) => boolean): string {
    const ideasToExport = filter ? this.ideas.filter(filter) : this.ideas;
    return JSON.stringify(ideasToExport, null, 2);
  }

  refresh(): void {
    this.extractIdeas();
  }

  addIdea(idea: Idea): Idea {
    this.ideas.push(idea);
    this.statusMap.set(idea.id, idea.status);
    this.saveStatuses();
    return idea;
  }
}

export const ideaInventoryService = IdeaInventoryService.getInstance();

