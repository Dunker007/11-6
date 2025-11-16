export interface DevTool {
  name: string;
  displayName: string;
  installed: boolean;
  version: string | null;
  installCommand?: string;
  downloadUrl?: string;
  category: 'runtime' | 'package-manager' | 'editor' | 'version-control' | 'container' | 'other';
  icon: string;
}

export class DevToolsService {
  private static instance: DevToolsService;

  static getInstance(): DevToolsService {
    if (!DevToolsService.instance) {
      DevToolsService.instance = new DevToolsService();
    }
    return DevToolsService.instance;
  }

  async checkAllTools(): Promise<DevTool[]> {
    try {
      const results = await (window as any).electronAPI.checkDevTools();
      return this.mapResultsToTools(results);
    } catch (error) {
      console.error('Failed to check dev tools:', error);
      return this.getDefaultTools();
    }
  }

  private mapResultsToTools(results: Array<{ name: string; installed: boolean; version: string | null }>): DevTool[] {
    const toolMap = this.getDefaultTools();
    
    return toolMap.map((tool) => {
      const result = results.find((r) => r.name === tool.name);
      return {
        ...tool,
        installed: result?.installed || false,
        version: result?.version || null,
      };
    });
  }

  getDefaultTools(): DevTool[] {
    return [
      {
        name: 'node',
        displayName: 'Node.js',
        installed: false,
        version: null,
        downloadUrl: 'https://nodejs.org/',
        category: 'runtime',
        icon: '🟢',
      },
      {
        name: 'python',
        displayName: 'Python',
        installed: false,
        version: null,
        downloadUrl: 'https://www.python.org/downloads/',
        category: 'runtime',
        icon: '🐍',
      },
      {
        name: 'git',
        displayName: 'Git',
        installed: false,
        version: null,
        downloadUrl: 'https://git-scm.com/download/win',
        category: 'version-control',
        icon: '📦',
      },
      {
        name: 'docker',
        displayName: 'Docker Desktop',
        installed: false,
        version: null,
        downloadUrl: 'https://www.docker.com/products/docker-desktop',
        category: 'container',
        icon: '🐳',
      },
      {
        name: 'vscode',
        displayName: 'VS Code',
        installed: false,
        version: null,
        downloadUrl: 'https://code.visualstudio.com/',
        category: 'editor',
        icon: '💻',
      },
      {
        name: 'npm',
        displayName: 'npm',
        installed: false,
        version: null,
        category: 'package-manager',
        icon: '📦',
      },
      {
        name: 'yarn',
        displayName: 'Yarn',
        installed: false,
        version: null,
        downloadUrl: 'https://yarnpkg.com/getting-started/install',
        category: 'package-manager',
        icon: '🧶',
      },
      {
        name: 'pnpm',
        displayName: 'pnpm',
        installed: false,
        version: null,
        downloadUrl: 'https://pnpm.io/installation',
        category: 'package-manager',
        icon: '📦',
      },
    ];
  }

  async installTool(toolName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await (window as any).electronAPI.installDevTool(toolName);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async installVSCodeExtension(extensionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await (window as any).electronAPI.installVSCodeExtension(extensionId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const devToolsService = DevToolsService.getInstance();

