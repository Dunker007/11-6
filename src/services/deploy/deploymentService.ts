import type { DeploymentTarget, DeploymentConfig, Deployment, DeploymentHistory } from '@/types/deploy';

const DEPLOYMENT_TARGETS: DeploymentTarget[] = [
  {
    id: 'vercel',
    name: 'Vercel',
    type: 'vercel',
    icon: '▲',
    description: 'Deploy to Vercel for instant global deployments',
    requiresAuth: true,
    authType: 'token',
    configFields: [
      {
        name: 'vercelToken',
        label: 'Vercel Token',
        type: 'password',
        required: true,
        placeholder: 'Enter your Vercel token',
      },
      {
        name: 'projectName',
        label: 'Project Name',
        type: 'text',
        required: true,
        placeholder: 'my-awesome-project',
      },
      {
        name: 'framework',
        label: 'Framework',
        type: 'select',
        required: false,
        options: ['vite', 'nextjs', 'react', 'vue', 'svelte', 'other'],
        defaultValue: 'vite',
      },
    ],
    supportedFrameworks: ['vite', 'nextjs', 'react', 'vue', 'svelte'],
  },
  {
    id: 'netlify',
    name: 'Netlify',
    type: 'netlify',
    icon: '🌐',
    description: 'Deploy to Netlify with continuous deployment',
    requiresAuth: true,
    authType: 'token',
    configFields: [
      {
        name: 'netlifyToken',
        label: 'Netlify Token',
        type: 'password',
        required: true,
        placeholder: 'Enter your Netlify token',
      },
      {
        name: 'siteName',
        label: 'Site Name',
        type: 'text',
        required: true,
        placeholder: 'my-site',
      },
      {
        name: 'buildCommand',
        label: 'Build Command',
        type: 'text',
        required: false,
        placeholder: 'npm run build',
        defaultValue: 'npm run build',
      },
      {
        name: 'publishDirectory',
        label: 'Publish Directory',
        type: 'text',
        required: false,
        placeholder: 'dist',
        defaultValue: 'dist',
      },
    ],
    supportedFrameworks: ['vite', 'react', 'vue', 'angular', 'svelte'],
  },
  {
    id: 'github-pages',
    name: 'GitHub Pages',
    type: 'github-pages',
    icon: '📄',
    description: 'Deploy to GitHub Pages for free hosting',
    requiresAuth: true,
    authType: 'token',
    configFields: [
      {
        name: 'githubToken',
        label: 'GitHub Token',
        type: 'password',
        required: true,
        placeholder: 'Enter your GitHub token',
      },
      {
        name: 'repository',
        label: 'Repository',
        type: 'text',
        required: true,
        placeholder: 'username/repo-name',
      },
      {
        name: 'branch',
        label: 'Branch',
        type: 'text',
        required: false,
        defaultValue: 'gh-pages',
      },
    ],
    supportedFrameworks: ['vite', 'react', 'vue', 'static'],
  },
  {
    id: 'docker',
    name: 'Docker',
    type: 'docker',
    icon: '🐳',
    description: 'Build and deploy Docker containers',
    requiresAuth: false,
    configFields: [
      {
        name: 'dockerfilePath',
        label: 'Dockerfile Path',
        type: 'text',
        required: false,
        defaultValue: 'Dockerfile',
      },
      {
        name: 'imageName',
        label: 'Image Name',
        type: 'text',
        required: true,
        placeholder: 'my-app',
      },
      {
        name: 'tag',
        label: 'Tag',
        type: 'text',
        required: false,
        defaultValue: 'latest',
      },
    ],
    supportedFrameworks: ['any'],
  },
];

const DEPLOYMENT_HISTORY_KEY = 'dlx_deployment_history';

export class DeploymentService {
  private static instance: DeploymentService;
  private deployments: Deployment[] = [];

  private constructor() {
    this.loadHistory();
  }

  static getInstance(): DeploymentService {
    if (!DeploymentService.instance) {
      DeploymentService.instance = new DeploymentService();
    }
    return DeploymentService.instance;
  }

  private loadHistory(): void {
    try {
      const historyData = localStorage.getItem(DEPLOYMENT_HISTORY_KEY);
      if (historyData) {
        const history: Deployment[] = JSON.parse(historyData);
        this.deployments = history.map((d) => ({
          ...d,
          createdAt: new Date(d.createdAt),
          completedAt: d.completedAt ? new Date(d.completedAt) : undefined,
        }));
      }
    } catch (error) {
      console.error('Failed to load deployment history:', error);
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(DEPLOYMENT_HISTORY_KEY, JSON.stringify(this.deployments));
    } catch (error) {
      console.error('Failed to save deployment history:', error);
    }
  }

  getAllTargets(): DeploymentTarget[] {
    return DEPLOYMENT_TARGETS;
  }

  getTargetById(id: string): DeploymentTarget | null {
    return DEPLOYMENT_TARGETS.find((t) => t.id === id) || null;
  }

  async deploy(config: DeploymentConfig): Promise<Deployment> {
    const target = this.getTargetById(config.targetId);
    if (!target) {
      throw new Error(`Deployment target ${config.targetId} not found`);
    }

    const deployment: Deployment = {
      id: crypto.randomUUID(),
      targetId: config.targetId,
      targetName: target.name,
      config,
      status: 'pending',
      createdAt: new Date(),
    };

    this.deployments.unshift(deployment);
    this.saveHistory();

    // Simulate deployment process
    await this.simulateDeployment(deployment);

    return deployment;
  }

  private async simulateDeployment(deployment: Deployment): Promise<void> {
    deployment.status = 'building';
    this.saveHistory();

    await new Promise((resolve) => setTimeout(resolve, 2000));

    deployment.status = 'deploying';
    this.saveHistory();

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate success (in real implementation, would call actual deployment APIs)
    deployment.status = 'success';
    deployment.completedAt = new Date();
    deployment.url = `https://${deployment.config.projectPath || 'example'}.${this.getTargetDomain(deployment.targetId)}`;
    this.saveHistory();
  }

  private getTargetDomain(targetId: string): string {
    const domains: Record<string, string> = {
      vercel: 'vercel.app',
      netlify: 'netlify.app',
      'github-pages': 'github.io',
    };
    return domains[targetId] || 'example.com';
  }

  getHistory(): DeploymentHistory {
    const successful = this.deployments.filter((d) => d.status === 'success').length;
    const successRate = this.deployments.length > 0 ? (successful / this.deployments.length) * 100 : 0;

    return {
      deployments: [...this.deployments],
      totalDeployments: this.deployments.length,
      successRate,
      lastDeployment: this.deployments[0],
    };
  }

  getDeploymentById(id: string): Deployment | null {
    return this.deployments.find((d) => d.id === id) || null;
  }

  cancelDeployment(id: string): boolean {
    const deployment = this.deployments.find((d) => d.id === id);
    if (deployment && (deployment.status === 'pending' || deployment.status === 'building' || deployment.status === 'deploying')) {
      deployment.status = 'cancelled';
      deployment.completedAt = new Date();
      this.saveHistory();
      return true;
    }
    return false;
  }
}

export const deploymentService = DeploymentService.getInstance();

