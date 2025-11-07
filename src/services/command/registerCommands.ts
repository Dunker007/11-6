import { commandService } from './commandService';

export interface CommandHandlers {
  onWorkflowChange: (workflow: 'create' | 'build' | 'deploy' | 'monitor' | 'monetize') => void;
  onOpenAPIKeys: () => void;
  onOpenDevTools: () => void;
  onOpenGitHub: () => void;
  onOpenMonitorLayouts: () => void;
  onOpenByteBot: () => void;
  onOpenBackOffice: () => void;
  onOpenMindMap: () => void;
  onOpenCodeReview: () => void;
  onOpenAgentForge: () => void;
  onOpenCreator: () => void;
}

export function registerCommands(handlers: CommandHandlers): void {
  // Workflow commands
  commandService.register({
    id: 'workflow-create',
    label: 'Switch to Create Workflow',
    description: 'Open the Create workflow',
    category: 'workflow',
    icon: '💡',
    keywords: ['create', 'new', 'project', 'template'],
    action: () => handlers.onWorkflowChange('create'),
  });

  commandService.register({
    id: 'workflow-build',
    label: 'Switch to Build Workflow',
    description: 'Open the Build workflow (VibeEditor)',
    category: 'workflow',
    icon: '⚡',
    keywords: ['build', 'editor', 'code', 'vibe'],
    action: () => handlers.onWorkflowChange('build'),
  });

  commandService.register({
    id: 'workflow-deploy',
    label: 'Switch to Deploy Workflow',
    description: 'Open the Deploy workflow',
    category: 'workflow',
    icon: '🚀',
    keywords: ['deploy', 'publish', 'release'],
    action: () => handlers.onWorkflowChange('deploy'),
  });

  commandService.register({
    id: 'workflow-monitor',
    label: 'Switch to Monitor Workflow',
    description: 'Open the Monitor workflow',
    category: 'workflow',
    icon: '📊',
    keywords: ['monitor', 'analytics', 'dashboard'],
    action: () => handlers.onWorkflowChange('monitor'),
  });

  commandService.register({
    id: 'workflow-monetize',
    label: 'Switch to Monetize Workflow',
    description: 'Open the Monetize workflow',
    category: 'workflow',
    icon: '💰',
    keywords: ['monetize', 'revenue', 'pricing'],
    action: () => handlers.onWorkflowChange('monetize'),
  });

  // Settings commands
  commandService.register({
    id: 'settings-api-keys',
    label: 'Open API Keys Manager',
    description: 'Manage API keys for LLM providers',
    category: 'settings',
    icon: '⚙️',
    keywords: ['api', 'keys', 'settings', 'config'],
    action: handlers.onOpenAPIKeys,
  });

  commandService.register({
    id: 'settings-dev-tools',
    label: 'Open Dev Tools Manager',
    description: 'Manage development tools',
    category: 'settings',
    icon: '🔧',
    keywords: ['dev', 'tools', 'install'],
    action: handlers.onOpenDevTools,
  });

  commandService.register({
    id: 'settings-github',
    label: 'Open GitHub Panel',
    description: 'GitHub integration and repository management',
    category: 'settings',
    icon: '🐙',
    keywords: ['github', 'git', 'repo'],
    action: handlers.onOpenGitHub,
  });

  commandService.register({
    id: 'settings-monitors',
    label: 'Open Monitor Layouts',
    description: 'Manage monitor layouts',
    category: 'settings',
    icon: '🖥️',
    keywords: ['monitor', 'display', 'layout'],
    action: handlers.onOpenMonitorLayouts,
  });

  commandService.register({
    id: 'settings-bytebot',
    label: 'Open ByteBot Panel',
    description: 'Automation and ByteBot settings',
    category: 'settings',
    icon: '🤖',
    keywords: ['bytebot', 'automation'],
    action: handlers.onOpenByteBot,
  });

  commandService.register({
    id: 'settings-backoffice',
    label: 'Open Back Office',
    description: 'Financial and business management',
    category: 'settings',
    icon: '📊',
    keywords: ['backoffice', 'finance', 'business'],
    action: handlers.onOpenBackOffice,
  });

  // Quick Labs commands
  commandService.register({
    id: 'quicklab-mindmap',
    label: 'Open Mind Map',
    description: 'Visual node editor for mind mapping',
    category: 'quicklabs',
    icon: '🧠',
    keywords: ['mindmap', 'mind', 'map', 'visual'],
    action: handlers.onOpenMindMap,
  });

  commandService.register({
    id: 'quicklab-codereview',
    label: 'Open Code Review',
    description: 'Code analysis and review tool',
    category: 'quicklabs',
    icon: '🔍',
    keywords: ['code', 'review', 'analysis'],
    action: handlers.onOpenCodeReview,
  });

  commandService.register({
    id: 'quicklab-agentforge',
    label: 'Open Agent Forge',
    description: 'Create and manage AI agents',
    category: 'quicklabs',
    icon: '🤖',
    keywords: ['agent', 'forge', 'ai'],
    action: handlers.onOpenAgentForge,
  });

  commandService.register({
    id: 'quicklab-creator',
    label: 'Open Creator',
    description: 'Markdown editor for content creation',
    category: 'quicklabs',
    icon: '📝',
    keywords: ['creator', 'markdown', 'content'],
    action: handlers.onOpenCreator,
  });
}

