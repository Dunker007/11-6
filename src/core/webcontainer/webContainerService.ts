/**
 * WebContainer Service
 * Provides local Node.js execution in the browser
 */

import { WebContainer } from '@webcontainer/api';
import type { FileSystemTree } from '@webcontainer/api';
import type { ProjectFile } from '@/types/project';
import type { ProjectService } from '../project/projectService';

export interface WebContainerInstance {
  id: string;
  container: WebContainer;
  projectId: string;
  status: 'initializing' | 'ready' | 'running' | 'error';
  currentProcess?: {
    process: any;
    command: string;
    startTime: number;
  };
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode?: number;
  duration: number;
}

class WebContainerService {
  private static instance: WebContainerService;
  private containers = new Map<string, WebContainerInstance>();
  // Removed unused currentContainerId

  private constructor() {}

  static getInstance(): WebContainerService {
    if (!WebContainerService.instance) {
      WebContainerService.instance = new WebContainerService();
    }
    return WebContainerService.instance;
  }

  /**
   * Initialize WebContainer for a project
   */
  async initializeContainer(projectId: string): Promise<WebContainerInstance> {
    try {
      console.log(`Initializing WebContainer for project: ${projectId}`);

      // Check if container already exists
      if (this.containers.has(projectId)) {
        return this.containers.get(projectId)!;
      }

      const container = await WebContainer.boot();
      console.log('WebContainer booted successfully');

      const instance: WebContainerInstance = {
        id: `wc_${Date.now()}`,
        container,
        projectId,
        status: 'initializing'
      };

      this.containers.set(projectId, instance);
      // Removed unused currentContainerId assignment

      // Set up event listeners
      container.on('server-ready', (port, url) => {
        console.log(`Server ready on port ${port}: ${url}`);
      });

      container.on('error', (error) => {
        console.error('WebContainer error:', error);
        instance.status = 'error';
      });

      instance.status = 'ready';
      return instance;

    } catch (error) {
      console.error('Failed to initialize WebContainer:', error);
      throw error;
    }
  }

  /**
   * Load project files into WebContainer
   */
  async loadProjectFiles(projectId: string, files: Record<string, any>): Promise<void> {
    const instance = this.containers.get(projectId);
    if (!instance) {
      throw new Error('Container not initialized');
    }

    try {
      console.log(`Loading project files for ${projectId}`);

      // Convert our file structure to WebContainer format
      const fileTree: FileSystemTree = {};

      for (const [path, content] of Object.entries(files)) {
        this.setNestedProperty(fileTree, path.split('/'), content);
      }

      await instance.container.mount(fileTree);
      console.log('Project files loaded successfully');

    } catch (error) {
      console.error('Failed to load project files:', error);
      throw error;
    }
  }

  /**
   * Execute a command in the WebContainer
   */
  async executeCommand(projectId: string, command: string, args: string[] = []): Promise<ExecutionResult> {
    const instance = this.containers.get(projectId);
    if (!instance) {
      throw new Error('Container not initialized');
    }

    const startTime = Date.now();

    try {
      console.log(`Executing command: ${command} ${args.join(' ')}`);

      instance.status = 'running';

      const process = await instance.container.spawn(command, args);

      instance.currentProcess = {
        process,
        command: `${command} ${args.join(' ')}`,
        startTime
      };

      let output = '';
      let errorOutput = '';

      // Collect stdout
      process.output.pipeTo(new WritableStream({
        write(chunk) {
          output += chunk;
        }
      }));

      // Collect stderr - WebContainerProcess doesn't have stderr property
      // Error output is typically included in the main output stream

      const exitCode = await process.exit;

      instance.status = 'ready';
      instance.currentProcess = undefined;

      const duration = Date.now() - startTime;

      console.log(`Command completed with exit code ${exitCode} in ${duration}ms`);

      return {
        success: exitCode === 0,
        output,
        error: errorOutput,
        exitCode,
        duration
      };

    } catch (error) {
      instance.status = 'error';
      instance.currentProcess = undefined;

      console.error('Command execution failed:', error);

      return {
        success: false,
        output: '',
        error: (error as Error).message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Install dependencies (npm install)
   */
  async installDependencies(projectId: string): Promise<ExecutionResult> {
    return this.executeCommand(projectId, 'npm', ['install']);
  }

  /**
   * Start development server
   */
  async startDevServer(projectId: string, port: number = 3000): Promise<ExecutionResult> {
    return this.executeCommand(projectId, 'npm', ['run', 'dev', '--', '--port', port.toString()]);
  }

  /**
   * Build project for production
   */
  async buildProject(projectId: string): Promise<ExecutionResult> {
    return this.executeCommand(projectId, 'npm', ['run', 'build']);
  }

  /**
   * Run tests
   */
  async runTests(projectId: string): Promise<ExecutionResult> {
    return this.executeCommand(projectId, 'npm', ['test']);
  }

  /**
   * Get container status
   */
  getContainerStatus(projectId: string): WebContainerInstance | null {
    return this.containers.get(projectId) || null;
  }

  /**
   * Get all containers
   */
  getAllContainers(): WebContainerInstance[] {
    return Array.from(this.containers.values());
  }

  /**
   * Convert ProjectFile tree structure to WebContainer FileSystemTree format
   */
  private convertProjectFilesToWebContainerTree(
    projectFiles: ProjectFile[],
    basePath: string = ''
  ): FileSystemTree {
    const tree: FileSystemTree = {};

    for (const file of projectFiles) {
      // Skip root directory itself
      if (file.path === basePath || file.path === '/') {
        if (file.children && file.children.length > 0) {
          const childrenTree = this.convertProjectFilesToWebContainerTree(file.children, basePath);
          Object.assign(tree, childrenTree);
        }
        continue;
      }

      // Get relative path from base
      const relativePath = basePath 
        ? file.path.replace(basePath, '').replace(/^\//, '')
        : file.path.replace(/^\//, '');

      if (!relativePath) continue;

      const pathParts = relativePath.split('/').filter(Boolean);

      if (file.isDirectory) {
        // Create directory structure
        let current = tree;
        for (let i = 0; i < pathParts.length; i++) {
          const part = pathParts[i];
          if (i === pathParts.length - 1) {
            // Last part - create directory with children
            current[part] = {
              directory: file.children && file.children.length > 0
                ? this.convertProjectFilesToWebContainerTree(file.children, file.path)
                : {}
            };
          } else {
            // Intermediate directory
            if (!current[part]) {
              current[part] = { directory: {} };
            } else {
              // Type guard: check if it's a directory node
              const existing = current[part];
              if ('directory' in existing && existing.directory) {
                current = existing.directory;
              } else {
                // Convert to directory if it was a file
                current[part] = { directory: {} };
                current = current[part].directory!;
              }
            }
          }
        }
      } else {
        // Create file
        this.setNestedProperty(tree, pathParts, file.content || '');
      }
    }

    return tree;
  }

  /**
   * Load project files from ProjectService into WebContainer
   */
  async loadProjectFromService(projectId: string, projectService: ProjectService): Promise<void> {
    const instance = this.containers.get(projectId);
    if (!instance) {
      throw new Error('Container not initialized');
    }

    try {
      console.log(`Loading project files from ProjectService for ${projectId}`);

      const project = projectService.getProject(projectId);
      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      if (!project.files || project.files.length === 0) {
        console.warn(`Project ${projectId} has no files to load`);
        return;
      }

      // Convert ProjectFile tree to WebContainer format
      const fileTree = this.convertProjectFilesToWebContainerTree(project.files, project.rootPath || '');

      // Mount the file tree
      await instance.container.mount(fileTree);
      console.log(`Project files loaded successfully for ${projectId}`);

    } catch (error) {
      console.error('Failed to load project files from ProjectService:', error);
      throw error;
    }
  }

  /**
   * Destroy container
   */
  async destroyContainer(projectId: string): Promise<void> {
    const instance = this.containers.get(projectId);
    if (instance) {
      try {
        await instance.container.teardown();
        this.containers.delete(projectId);
        console.log(`Container destroyed for project: ${projectId}`);
      } catch (error) {
        console.error('Failed to destroy container:', error);
      }
    }
  }

  /**
   * Helper to set nested properties in file tree
   */
  private setNestedProperty(obj: any, path: string[], value: any): void {
    const [head, ...tail] = path;

    if (tail.length === 0) {
      obj[head] = {
        file: {
          contents: typeof value === 'string' ? value : JSON.stringify(value, null, 2)
        }
      };
    } else {
      if (!obj[head]) {
        obj[head] = { directory: {} };
      } else {
        // Type guard: check if it's a directory node
        const existing = obj[head];
        if ('directory' in existing && existing.directory) {
          this.setNestedProperty(existing.directory, tail, value);
        } else {
          // Convert to directory if it was a file
          obj[head] = { directory: {} };
          this.setNestedProperty(obj[head].directory, tail, value);
        }
      }
    }
  }
}

export const webContainerService = WebContainerService.getInstance();
