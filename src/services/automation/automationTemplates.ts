export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'development' | 'deployment' | 'testing' | 'maintenance' | 'custom';
  icon: string;
  steps: AutomationStep[];
  variables: TemplateVariable[];
  estimatedDuration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface AutomationStep {
  id: string;
  name: string;
  command: string;
  waitForCompletion: boolean;
  continueOnError: boolean;
  timeout?: number;
  retries?: number;
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  required: boolean;
  default?: string | number | boolean;
  options?: string[];
}

export interface WorkflowExecution {
  id: string;
  templateId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  currentStep: number;
  totalSteps: number;
  startedAt: Date;
  completedAt?: Date;
  results: Record<string, string>;
  errors: string[];
}

const DEFAULT_TEMPLATES: AutomationTemplate[] = [
  {
    id: 'build-deploy-full',
    name: 'Build & Deploy (Full Stack)',
    description: 'Complete build, test, and deployment pipeline for full-stack applications',
    category: 'deployment',
    icon: 'rocket',
    estimatedDuration: '5-10 minutes',
    difficulty: 'intermediate',
    variables: [
      {
        name: 'environment',
        description: 'Target environment',
        type: 'select',
        required: true,
        options: ['development', 'staging', 'production'],
        default: 'development',
      },
      {
        name: 'runTests',
        description: 'Run tests before deployment',
        type: 'boolean',
        required: false,
        default: true,
      },
    ],
    steps: [
      {
        id: 'install-deps',
        name: 'Install Dependencies',
        command: 'npm install',
        waitForCompletion: true,
        continueOnError: false,
        timeout: 300000,
      },
      {
        id: 'run-linter',
        name: 'Run Linter',
        command: 'npm run lint',
        waitForCompletion: true,
        continueOnError: true,
      },
      {
        id: 'run-tests',
        name: 'Run Tests',
        command: 'npm test',
        waitForCompletion: true,
        continueOnError: false,
        retries: 2,
      },
      {
        id: 'build-app',
        name: 'Build Application',
        command: 'npm run build',
        waitForCompletion: true,
        continueOnError: false,
        timeout: 600000,
      },
      {
        id: 'deploy-app',
        name: 'Deploy to {{environment}}',
        command: 'npm run deploy:{{environment}}',
        waitForCompletion: true,
        continueOnError: false,
        timeout: 300000,
      },
    ],
  },
  {
    id: 'quick-fix-deploy',
    name: 'Quick Fix & Deploy',
    description: 'Rapid hotfix deployment workflow',
    category: 'deployment',
    icon: 'zap',
    estimatedDuration: '2-3 minutes',
    difficulty: 'beginner',
    variables: [
      {
        name: 'commitMessage',
        description: 'Fix description',
        type: 'string',
        required: true,
      },
    ],
    steps: [
      {
        id: 'git-add',
        name: 'Stage Changes',
        command: 'git add .',
        waitForCompletion: true,
        continueOnError: false,
      },
      {
        id: 'git-commit',
        name: 'Commit Changes',
        command: 'git commit -m "hotfix: {{commitMessage}}"',
        waitForCompletion: true,
        continueOnError: false,
      },
      {
        id: 'build-app',
        name: 'Quick Build',
        command: 'npm run build',
        waitForCompletion: true,
        continueOnError: false,
      },
      {
        id: 'deploy-app',
        name: 'Deploy',
        command: 'npm run deploy',
        waitForCompletion: true,
        continueOnError: false,
      },
    ],
  },
  {
    id: 'database-backup',
    name: 'Database Backup & Restore',
    description: 'Backup database and optionally restore to different environment',
    category: 'maintenance',
    icon: 'database',
    estimatedDuration: '3-5 minutes',
    difficulty: 'advanced',
    variables: [
      {
        name: 'database',
        description: 'Database name',
        type: 'string',
        required: true,
      },
      {
        name: 'restore',
        description: 'Restore after backup',
        type: 'boolean',
        required: false,
        default: false,
      },
    ],
    steps: [
      {
        id: 'create-backup',
        name: 'Create Backup',
        command: 'pg_dump {{database}} > backup_$(date +%Y%m%d_%H%M%S).sql',
        waitForCompletion: true,
        continueOnError: false,
      },
      {
        id: 'compress-backup',
        name: 'Compress Backup',
        command: 'gzip backup_*.sql',
        waitForCompletion: true,
        continueOnError: true,
      },
    ],
  },
  {
    id: 'code-quality-check',
    name: 'Code Quality Check',
    description: 'Run comprehensive code quality checks and generate report',
    category: 'testing',
    icon: 'check-circle',
    estimatedDuration: '4-6 minutes',
    difficulty: 'intermediate',
    variables: [
      {
        name: 'generateReport',
        description: 'Generate HTML report',
        type: 'boolean',
        required: false,
        default: true,
      },
    ],
    steps: [
      {
        id: 'run-linter',
        name: 'ESLint Check',
        command: 'npm run lint',
        waitForCompletion: true,
        continueOnError: true,
      },
      {
        id: 'run-prettier',
        name: 'Format Check',
        command: 'npm run format:check',
        waitForCompletion: true,
        continueOnError: true,
      },
      {
        id: 'run-tests',
        name: 'Unit Tests',
        command: 'npm test -- --coverage',
        waitForCompletion: true,
        continueOnError: true,
      },
      {
        id: 'type-check',
        name: 'TypeScript Check',
        command: 'tsc --noEmit',
        waitForCompletion: true,
        continueOnError: true,
      },
    ],
  },
  {
    id: 'dependency-update',
    name: 'Update Dependencies',
    description: 'Update project dependencies and run tests',
    category: 'maintenance',
    icon: 'package',
    estimatedDuration: '5-8 minutes',
    difficulty: 'intermediate',
    variables: [
      {
        name: 'updateType',
        description: 'Update type',
        type: 'select',
        required: true,
        options: ['patch', 'minor', 'major'],
        default: 'minor',
      },
    ],
    steps: [
      {
        id: 'check-outdated',
        name: 'Check Outdated',
        command: 'npm outdated',
        waitForCompletion: true,
        continueOnError: true,
      },
      {
        id: 'update-deps',
        name: 'Update Dependencies',
        command: 'npm update',
        waitForCompletion: true,
        continueOnError: false,
        timeout: 300000,
      },
      {
        id: 'run-tests',
        name: 'Verify with Tests',
        command: 'npm test',
        waitForCompletion: true,
        continueOnError: false,
      },
    ],
  },
  {
    id: 'performance-audit',
    name: 'Performance Audit',
    description: 'Run performance audits and generate optimization recommendations',
    category: 'testing',
    icon: 'activity',
    estimatedDuration: '3-4 minutes',
    difficulty: 'beginner',
    variables: [
      {
        name: 'url',
        description: 'URL to audit',
        type: 'string',
        required: true,
        default: 'http://localhost:3000',
      },
    ],
    steps: [
      {
        id: 'lighthouse-audit',
        name: 'Lighthouse Audit',
        command: 'lighthouse {{url}} --output html --output-path ./reports/lighthouse.html',
        waitForCompletion: true,
        continueOnError: false,
      },
      {
        id: 'bundle-analysis',
        name: 'Bundle Size Analysis',
        command: 'npm run analyze',
        waitForCompletion: true,
        continueOnError: true,
      },
    ],
  },
];

class AutomationTemplatesService {
  private templates: Map<string, AutomationTemplate> = new Map();
  private customTemplates: AutomationTemplate[] = [];
  private activeExecutions: Map<string, WorkflowExecution> = new Map();

  constructor() {
    this.loadTemplates();
    this.loadCustomTemplates();
  }

  private loadTemplates(): void {
    DEFAULT_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private loadCustomTemplates(): void {
    try {
      const stored = localStorage.getItem('automation_custom_templates');
      if (stored) {
        this.customTemplates = JSON.parse(stored);
        this.customTemplates.forEach(template => {
          this.templates.set(template.id, template);
        });
      }
    } catch (error) {
      console.error('Failed to load custom templates:', error);
    }
  }

  private saveCustomTemplates(): void {
    try {
      localStorage.setItem('automation_custom_templates', JSON.stringify(this.customTemplates));
    } catch (error) {
      console.error('Failed to save custom templates:', error);
    }
  }

  getAllTemplates(): AutomationTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: string): AutomationTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  getTemplate(id: string): AutomationTemplate | undefined {
    return this.templates.get(id);
  }

  createCustomTemplate(template: Omit<AutomationTemplate, 'id'>): AutomationTemplate {
    const newTemplate: AutomationTemplate = {
      ...template,
      id: `custom-${crypto.randomUUID()}`,
      category: 'custom',
    };
    
    this.templates.set(newTemplate.id, newTemplate);
    this.customTemplates.push(newTemplate);
    this.saveCustomTemplates();
    
    return newTemplate;
  }

  updateCustomTemplate(id: string, updates: Partial<AutomationTemplate>): boolean {
    const template = this.templates.get(id);
    if (!template || !id.startsWith('custom-')) {
      return false;
    }

    const updated = { ...template, ...updates, id };
    this.templates.set(id, updated);
    
    const index = this.customTemplates.findIndex(t => t.id === id);
    if (index >= 0) {
      this.customTemplates[index] = updated;
      this.saveCustomTemplates();
    }

    return true;
  }

  deleteCustomTemplate(id: string): boolean {
    if (!id.startsWith('custom-')) {
      return false;
    }

    this.templates.delete(id);
    this.customTemplates = this.customTemplates.filter(t => t.id !== id);
    this.saveCustomTemplates();
    
    return true;
  }

  /**
   * Execute a template with provided variable values
   */
  async executeTemplate(
    templateId: string,
    variables: Record<string, string | number | boolean>
  ): Promise<WorkflowExecution> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Validate required variables
    const missing = template.variables
      .filter(v => v.required && !(v.name in variables))
      .map(v => v.name);
    
    if (missing.length > 0) {
      throw new Error(`Missing required variables: ${missing.join(', ')}`);
    }

    // Create execution
    const execution: WorkflowExecution = {
      id: crypto.randomUUID(),
      templateId,
      status: 'running',
      currentStep: 0,
      totalSteps: template.steps.length,
      startedAt: new Date(),
      results: {},
      errors: [],
    };

    this.activeExecutions.set(execution.id, execution);

    // Execute steps (would integrate with ByteBotService in real implementation)
    this.executeSteps(execution, template, variables);

    return execution;
  }

  private async executeSteps(
    execution: WorkflowExecution,
    template: AutomationTemplate,
    variables: Record<string, string | number | boolean>
  ): Promise<void> {
    for (let i = 0; i < template.steps.length; i++) {
      const step = template.steps[i];
      execution.currentStep = i + 1;

      // Replace variables in command
      let command = step.command;
      Object.entries(variables).forEach(([key, value]) => {
        command = command.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });

      try {
        // In real implementation, would call ByteBotService.executeTask
        execution.results[step.id] = `Executed: ${command}`;
      } catch (error) {
        execution.errors.push(`Step ${step.name}: ${(error as Error).message}`);
        if (!step.continueOnError) {
          execution.status = 'failed';
          execution.completedAt = new Date();
          return;
        }
      }
    }

    execution.status = 'completed';
    execution.completedAt = new Date();
  }

  getExecution(id: string): WorkflowExecution | undefined {
    return this.activeExecutions.get(id);
  }

  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  pauseExecution(id: string): boolean {
    const execution = this.activeExecutions.get(id);
    if (execution && execution.status === 'running') {
      execution.status = 'paused';
      return true;
    }
    return false;
  }

  resumeExecution(id: string): boolean {
    const execution = this.activeExecutions.get(id);
    if (execution && execution.status === 'paused') {
      execution.status = 'running';
      // Would resume execution in real implementation
      return true;
    }
    return false;
  }

  cancelExecution(id: string): boolean {
    const execution = this.activeExecutions.get(id);
    if (execution && execution.status === 'running') {
      execution.status = 'failed';
      execution.errors.push('Cancelled by user');
      execution.completedAt = new Date();
      return true;
    }
    return false;
  }
}

export const automationTemplatesService = new AutomationTemplatesService();

