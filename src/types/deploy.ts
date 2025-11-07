export interface DeploymentTarget {
  id: string;
  name: string;
  type: 'vercel' | 'netlify' | 'aws' | 'docker' | 'github-pages' | 'custom';
  icon: string;
  description: string;
  requiresAuth: boolean;
  authType?: 'api-key' | 'oauth' | 'token';
  configFields: ConfigField[];
  supportedFrameworks: string[];
}

export interface ConfigField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
}

export interface DeploymentConfig {
  targetId: string;
  projectPath: string;
  buildCommand?: string;
  outputDirectory?: string;
  environmentVariables: Record<string, string>;
  customDomain?: string;
  framework?: string;
  nodeVersion?: string;
  installCommand?: string;
}

export interface Deployment {
  id: string;
  targetId: string;
  targetName: string;
  config: DeploymentConfig;
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed' | 'cancelled';
  url?: string;
  createdAt: Date;
  completedAt?: Date;
  buildLog?: string[];
  error?: string;
}

export interface DeploymentHistory {
  deployments: Deployment[];
  totalDeployments: number;
  successRate: number;
  lastDeployment?: Deployment;
}

export interface LiveDeploymentStatus {
  deployment: Deployment;
  buildProgress: number;
  deployProgress: number;
  currentStep: string;
  estimatedTimeRemaining?: number;
}

