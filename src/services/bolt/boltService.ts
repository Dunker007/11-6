/**
 * Bolt.diy Service
 * Generates build packages from projects for autonomous building on bolt.diy
 */

import type { Project, ProjectFile } from '@/types/project';
import type {
  BoltBuildPackage,
  BoltProjectType,
  BoltBuildStep,
  PackageValidationResult,
} from '@/types/bolt';
import { projectService } from './projectService';

class BoltService {
  /**
   * Generate a BoltBuildPackage from a project
   */
  async generateBuildPackage(projectId: string): Promise<BoltBuildPackage> {
    const project = projectService.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Detect project type
    const projectType = this.detectProjectType(project);

    // Extract dependencies
    const dependencies = await this.extractDependencies(project);

    // Generate build steps
    const buildSteps = await this.generateBuildSteps(project, projectType);

    // Build file structure
    const structure = this.buildFileStructure(project);

    // Create build package
    const buildPackage: BoltBuildPackage = {
      version: '1.0.0',
      project: {
        name: project.name,
        type: projectType,
        description: project.description || `Project ${project.name}`,
        version: '1.0.0',
      },
      structure,
      dependencies,
      build: {
        steps: buildSteps,
        environment: {
          NODE_ENV: 'production',
        },
      },
      deploy: {
        platform: 'bolt.diy',
        config: {},
      },
      metadata: {
        createdAt: new Date().toISOString(),
        generatedBy: 'DLX Studios Ultimate',
        tags: [projectType, project.status],
      },
    };

    return buildPackage;
  }

  /**
   * Detect project type from project files
   */
  private detectProjectType(project: Project): BoltProjectType {
    const files = this.flattenFiles(project.files);
    const filePaths = files.map((f) => f.path.toLowerCase());

    // Check for React/Vue/Angular (web)
    if (
      filePaths.some((p) => p.includes('package.json')) &&
      (filePaths.some((p) => p.includes('vite.config')) ||
        filePaths.some((p) => p.includes('webpack.config')) ||
        filePaths.some((p) => p.includes('next.config')))
    ) {
      return 'web';
    }

    // Check for API (Express, FastAPI, etc.)
    if (
      filePaths.some((p) => p.includes('server.ts') || p.includes('server.js') || p.includes('app.py')) ||
      filePaths.some((p) => p.includes('api/') || p.includes('routes/'))
    ) {
      // Check if also has frontend
      if (
        filePaths.some((p) => p.includes('src/') || p.includes('public/')) &&
        filePaths.some((p) => p.includes('package.json'))
      ) {
        return 'fullstack';
      }
      return 'api';
    }

    // Check for CMS (WordPress, Strapi, etc.)
    if (
      filePaths.some((p) => p.includes('wp-config') || p.includes('strapi')) ||
      filePaths.some((p) => p.includes('content/') || p.includes('admin/'))
    ) {
      return 'cms';
    }

    // Check for static site (HTML/CSS/JS only)
    if (
      filePaths.some((p) => p.endsWith('.html')) &&
      !filePaths.some((p) => p.includes('package.json')) &&
      !filePaths.some((p) => p.includes('server'))
    ) {
      return 'static';
    }

    // Default to web if package.json exists
    if (filePaths.some((p) => p.includes('package.json'))) {
      return 'web';
    }

    // Default to static
    return 'static';
  }

  /**
   * Extract dependencies from project files
   */
  private async extractDependencies(project: Project): Promise<BoltBuildPackage['dependencies']> {
    const files = this.flattenFiles(project.files);
    const dependencies: BoltBuildPackage['dependencies'] = {};

    // Find package.json
    const packageJsonFile = files.find((f) => f.path.includes('package.json'));
    if (packageJsonFile && packageJsonFile.content) {
      try {
        const packageJson = JSON.parse(packageJsonFile.content);
        if (packageJson.dependencies || packageJson.devDependencies) {
          dependencies.npm = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
          };
        }
      } catch (error) {
        console.warn('Failed to parse package.json:', error);
      }
    }

    // Find requirements.txt (Python)
    const requirementsFile = files.find((f) => f.path.includes('requirements.txt'));
    if (requirementsFile && requirementsFile.content) {
      const requirements = requirementsFile.content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'));
      dependencies.pip = {};
      requirements.forEach((req) => {
        const [name, version] = req.split('==');
        if (name) {
          dependencies.pip![name.trim()] = version?.trim() || 'latest';
        }
      });
    }

    // Find Cargo.toml (Rust)
    const cargoFile = files.find((f) => f.path.includes('Cargo.toml'));
    if (cargoFile && cargoFile.content) {
      // Simple parsing - could be enhanced
      const cargoMatch = cargoFile.content.match(/\[dependencies\]\s*([\s\S]*?)(?=\[|$)/);
      if (cargoMatch) {
        dependencies.cargo = {};
        cargoMatch[1]
          .split('\n')
          .forEach((line) => {
            const match = line.match(/^(\w+)\s*=\s*"([^"]+)"/);
            if (match) {
              dependencies.cargo![match[1]] = match[2];
            }
          });
      }
    }

    // Find go.mod (Go)
    const goModFile = files.find((f) => f.path.includes('go.mod'));
    if (goModFile && goModFile.content) {
      dependencies.go = {};
      const requireMatches = goModFile.content.matchAll(/require\s+([^\s]+)\s+([^\s]+)/g);
      for (const match of requireMatches) {
        dependencies.go![match[1]] = match[2];
      }
    }

    // Find composer.json (PHP)
    const composerFile = files.find((f) => f.path.includes('composer.json'));
    if (composerFile && composerFile.content) {
      try {
        const composer = JSON.parse(composerFile.content);
        if (composer.require) {
          dependencies.composer = composer.require;
        }
      } catch (error) {
        console.warn('Failed to parse composer.json:', error);
      }
    }

    return dependencies;
  }

  /**
   * Generate build steps based on project type and files
   */
  private async generateBuildSteps(
    project: Project,
    projectType: BoltProjectType
  ): Promise<BoltBuildStep[]> {
    const files = this.flattenFiles(project.files);
    const steps: BoltBuildStep[] = [];

    // Check for package.json scripts
    const packageJsonFile = files.find((f) => f.path.includes('package.json'));
    if (packageJsonFile && packageJsonFile.content) {
      try {
        const packageJson = JSON.parse(packageJsonFile.content);
        if (packageJson.scripts) {
          // Install dependencies
          if (packageJson.dependencies || packageJson.devDependencies) {
            steps.push({
              command: 'npm install',
              type: 'install',
              description: 'Install npm dependencies',
            });
          }

          // Build step
          if (packageJson.scripts.build) {
            steps.push({
              command: 'npm run build',
              type: 'build',
              description: 'Build the project',
            });
          }

          // Test step (optional)
          if (packageJson.scripts.test) {
            steps.push({
              command: 'npm test',
              type: 'test',
              description: 'Run tests',
            });
          }
        }
      } catch (error) {
        console.warn('Failed to parse package.json for build steps:', error);
      }
    }

    // Python projects
    const requirementsFile = files.find((f) => f.path.includes('requirements.txt'));
    if (requirementsFile) {
      steps.push({
        command: 'pip install -r requirements.txt',
        type: 'install',
        description: 'Install Python dependencies',
      });
    }

    // Rust projects
    const cargoFile = files.find((f) => f.path.includes('Cargo.toml'));
    if (cargoFile) {
      steps.push({
        command: 'cargo build --release',
        type: 'build',
        description: 'Build Rust project',
      });
    }

    // Go projects
    const goModFile = files.find((f) => f.path.includes('go.mod'));
    if (goModFile) {
      steps.push({
        command: 'go mod download',
        type: 'install',
        description: 'Download Go dependencies',
      });
      steps.push({
        command: 'go build -o app',
        type: 'build',
        description: 'Build Go application',
      });
    }

    // PHP projects
    const composerFile = files.find((f) => f.path.includes('composer.json'));
    if (composerFile) {
      steps.push({
        command: 'composer install',
        type: 'install',
        description: 'Install PHP dependencies',
      });
    }

    // Default build steps if none found
    if (steps.length === 0) {
      if (projectType === 'static') {
        steps.push({
          command: 'echo "No build steps required for static site"',
          type: 'custom',
          description: 'Static site - no build needed',
        });
      } else {
        steps.push({
          command: 'echo "Build steps not detected"',
          type: 'custom',
          description: 'Please configure build steps manually',
        });
      }
    }

    return steps;
  }

  /**
   * Build file structure from project files
   */
  private buildFileStructure(project: Project): BoltBuildPackage['structure'] {
    const files = this.flattenFiles(project.files);
    const directories = new Set<string>();

    const fileEntries = files
      .filter((f) => !f.isDirectory && f.content)
      .map((f) => {
        // Extract relative path
        const relativePath = f.path.replace(project.rootPath || '', '').replace(/^\//, '');
        
        // Track directory
        const dirParts = relativePath.split('/').slice(0, -1);
        dirParts.forEach((_, index) => {
          const dirPath = dirParts.slice(0, index + 1).join('/');
          if (dirPath) directories.add(dirPath);
        });

        // Determine file type
        const extension = f.path.split('.').pop()?.toLowerCase() || 'txt';
        const type = this.getFileType(extension);

        return {
          path: relativePath,
          content: f.content,
          type,
          encoding: 'utf8' as const,
        };
      });

    return {
      files: fileEntries,
      directories: Array.from(directories),
    };
  }

  /**
   * Get file type from extension
   */
  private getFileType(extension: string): string {
    const typeMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      jsx: 'javascript',
      tsx: 'typescript',
      py: 'python',
      rs: 'rust',
      go: 'go',
      php: 'php',
      html: 'html',
      css: 'css',
      json: 'json',
      yml: 'yaml',
      yaml: 'yaml',
      md: 'markdown',
      txt: 'text',
    };
    return typeMap[extension] || 'text';
  }

  /**
   * Flatten file tree into array
   */
  private flattenFiles(files: ProjectFile[]): ProjectFile[] {
    const result: ProjectFile[] = [];
    const traverse = (fileList: ProjectFile[]) => {
      for (const file of fileList) {
        result.push(file);
        if (file.isDirectory && file.children) {
          traverse(file.children);
        }
      }
    };
    traverse(files);
    return result;
  }

  /**
   * Validate a build package
   */
  validatePackage(buildPackage: BoltBuildPackage): PackageValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!buildPackage.project.name) {
      errors.push('Project name is required');
    }

    if (!buildPackage.structure.files || buildPackage.structure.files.length === 0) {
      warnings.push('No files found in project structure');
    }

    // Check for build steps
    if (!buildPackage.build.steps || buildPackage.build.steps.length === 0) {
      warnings.push('No build steps defined');
    }

    // Check for dependencies
    const hasDependencies = Object.keys(buildPackage.dependencies).length > 0;
    if (!hasDependencies) {
      warnings.push('No dependencies detected');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Export build package as JSON
   */
  exportAsJSON(buildPackage: BoltBuildPackage): string {
    return JSON.stringify(buildPackage, null, 2);
  }
}

export const boltService = new BoltService();

