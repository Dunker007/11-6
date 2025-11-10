import { projectService } from '../project/projectService';
import { multiFileContextService } from './multiFileContextService';
import type { Project, ProjectFile } from '@/types/project';

export interface ProjectKnowledge {
  project: Project;
  fileTree: ProjectFile[];
  allFiles: ProjectFile[];
  languages: string[];
  frameworks: string[];
  dependencies: string[];
  structure: {
    hasConfigFiles: boolean;
    hasTests: boolean;
    hasDocs: boolean;
    entryPoints: string[];
  };
}

export interface NavigationSuggestion {
  workflow: 'create' | 'build' | 'deploy' | 'monitor' | 'monetize';
  reason: string;
  action?: string;
}

class ProjectKnowledgeService {
  private static instance: ProjectKnowledgeService;

  static getInstance(): ProjectKnowledgeService {
    if (!ProjectKnowledgeService.instance) {
      ProjectKnowledgeService.instance = new ProjectKnowledgeService();
    }
    return ProjectKnowledgeService.instance;
  }

  getAllProjects(): Project[] {
    return projectService.getAllProjects();
  }

  getActiveProject(): Project | null {
    return projectService.getActiveProject();
  }

  getProjectKnowledge(projectId: string): ProjectKnowledge | null {
    const project = projectService.getProject(projectId);
    if (!project) return null;

    const allFiles = this.flattenFiles(project.files);
    const languages = this.detectLanguages(allFiles);
    const frameworks = this.detectFrameworks(allFiles);
    const dependencies = this.extractDependencies(allFiles);

    // Trigger deep analysis if not already done
    const deepContext = multiFileContextService.getProjectContext(projectId);
    if (!deepContext && allFiles.length > 0) {
      // Analyze project asynchronously (don't block)
      multiFileContextService.analyzeProject(project).catch(err => {
        console.warn('Failed to analyze project deeply:', err);
      });
    }

    return {
      project,
      fileTree: project.files,
      allFiles,
      languages,
      frameworks,
      dependencies,
      structure: {
        hasConfigFiles: this.hasConfigFiles(allFiles),
        hasTests: this.hasTests(allFiles),
        hasDocs: this.hasDocs(allFiles),
        entryPoints: this.findEntryPoints(allFiles),
      },
    };
  }

  getFullProjectContext(projectId?: string): string {
    const project = projectId 
      ? projectService.getProject(projectId)
      : projectService.getActiveProject();

    if (!project) {
      return 'No active project. User should create or open a project first.';
    }

    const knowledge = this.getProjectKnowledge(project.id);
    if (!knowledge) return '';

    // Get deep context from multiFileContextService if available
    const deepContext = multiFileContextService.getProjectContext(project.id);
    
    const context = [
      `Project: ${project.name}`,
      project.description ? `Description: ${project.description}` : '',
      `Languages: ${knowledge.languages.join(', ') || 'Unknown'}`,
      knowledge.frameworks.length > 0 ? `Frameworks: ${knowledge.frameworks.join(', ')}` : '',
      `Files: ${knowledge.allFiles.filter(f => !f.isDirectory).length} files`,
      knowledge.structure.hasConfigFiles ? 'Has configuration files' : '',
      knowledge.structure.hasTests ? 'Has test files' : '',
      knowledge.structure.hasDocs ? 'Has documentation' : '',
      knowledge.structure.entryPoints.length > 0 
        ? `Entry points: ${knowledge.structure.entryPoints.join(', ')}`
        : '',
      knowledge.dependencies.length > 0 
        ? `Dependencies: ${knowledge.dependencies.slice(0, 10).join(', ')}${knowledge.dependencies.length > 10 ? '...' : ''}`
        : '',
    ];

    // Add deep context insights if available
    if (deepContext) {
      context.push(
        `Total Lines of Code: ${deepContext.totalLines.toLocaleString()}`,
        `Dependency Graph: ${deepContext.dependencyGraph.size} files with dependencies`,
        deepContext.filesByLanguage.size > 0 
          ? `Files by Language: ${Array.from(deepContext.filesByLanguage.entries())
              .map(([lang, files]) => `${lang} (${files.length})`)
              .join(', ')}`
          : ''
      );
    }

    return context.filter(Boolean).join('\n');
  }

  suggestNavigation(userQuery: string, projectId?: string): NavigationSuggestion | null {
    const project = projectId 
      ? projectService.getProject(projectId)
      : projectService.getActiveProject();

    if (!project) {
      if (/create|new|start|begin|template/.test(userQuery.toLowerCase())) {
        return {
          workflow: 'create',
          reason: 'User wants to create a new project',
          action: 'Navigate to Create workflow to start a new project',
        };
      }
      return null;
    }

    const knowledge = this.getProjectKnowledge(project.id);
    if (!knowledge) return null;

    const lowerQuery = userQuery.toLowerCase();

    // Deploy suggestions
    if (/deploy|publish|release|push|production|live|host/.test(lowerQuery)) {
      return {
        workflow: 'deploy',
        reason: 'User wants to deploy or publish their project',
        action: 'Navigate to Deploy workflow to configure and execute deployment',
      };
    }

    // Build suggestions
    if (/build|compile|run|execute|test|debug/.test(lowerQuery)) {
      return {
        workflow: 'build',
        reason: 'User wants to build, run, or test their project',
        action: 'Navigate to Build workflow (VibeEditor) to build and test',
      };
    }

    // Monitor suggestions
    if (/monitor|analytics|stats|metrics|performance|track/.test(lowerQuery)) {
      return {
        workflow: 'monitor',
        reason: 'User wants to monitor or track something',
        action: 'Navigate to Monitor workflow for analytics and tracking',
      };
    }

    // Monetize suggestions
    if (/monetize|revenue|pricing|money|sell|subscription/.test(lowerQuery)) {
      return {
        workflow: 'monetize',
        reason: 'User wants to monetize or set up pricing',
        action: 'Navigate to Monetize workflow for revenue and pricing',
      };
    }

    // File operations - suggest Build workflow
    if (/file|code|edit|write|create file|add file/.test(lowerQuery)) {
      return {
        workflow: 'build',
        reason: 'User wants to work with files or code',
        action: 'Navigate to Build workflow (VibeEditor) to edit files',
      };
    }

    return null;
  }

  private flattenFiles(files: ProjectFile[]): ProjectFile[] {
    const result: ProjectFile[] = [];
    
    for (const file of files) {
      result.push(file);
      if (file.children) {
        result.push(...this.flattenFiles(file.children));
      }
    }
    
    return result;
  }

  private detectLanguages(files: ProjectFile[]): string[] {
    const languages = new Set<string>();
    
    for (const file of files) {
      if (file.isDirectory) continue;
      
      const ext = file.path.split('.').pop()?.toLowerCase();
      const langMap: Record<string, string> = {
        ts: 'TypeScript',
        tsx: 'TypeScript',
        js: 'JavaScript',
        jsx: 'JavaScript',
        py: 'Python',
        java: 'Java',
        cpp: 'C++',
        c: 'C',
        cs: 'C#',
        go: 'Go',
        rs: 'Rust',
        rb: 'Ruby',
        php: 'PHP',
        html: 'HTML',
        css: 'CSS',
        scss: 'SCSS',
        vue: 'Vue',
        svelte: 'Svelte',
      };
      
      if (ext && langMap[ext]) {
        languages.add(langMap[ext]);
      }
    }
    
    return Array.from(languages);
  }

  private detectFrameworks(files: ProjectFile[]): string[] {
    const frameworks: string[] = [];
    const filePaths = files.map(f => f.path.toLowerCase());
    
    if (filePaths.some(p => p.includes('package.json'))) {
      // Check for React
      if (filePaths.some(p => p.includes('react') || p.includes('jsx'))) {
        frameworks.push('React');
      }
      // Check for Vue
      if (filePaths.some(p => p.includes('vue'))) {
        frameworks.push('Vue');
      }
      // Check for Next.js
      if (filePaths.some(p => p.includes('next.config'))) {
        frameworks.push('Next.js');
      }
      // Check for Vite
      if (filePaths.some(p => p.includes('vite.config'))) {
        frameworks.push('Vite');
      }
    }
    
    if (filePaths.some(p => p.includes('requirements.txt'))) {
      frameworks.push('Python');
    }
    
    if (filePaths.some(p => p.includes('pom.xml'))) {
      frameworks.push('Maven');
    }
    
    if (filePaths.some(p => p.includes('cargo.toml'))) {
      frameworks.push('Cargo');
    }
    
    return frameworks;
  }

  private extractDependencies(files: ProjectFile[]): string[] {
    const dependencies: string[] = [];
    
    for (const file of files) {
      if (file.isDirectory) continue;
      
      if (file.path.includes('package.json')) {
        try {
          const content = file.content || '';
          if (content) {
            const pkg = JSON.parse(content);
            if (pkg.dependencies) {
              dependencies.push(...Object.keys(pkg.dependencies));
            }
          }
        } catch {
          // Ignore parse errors
        }
      }
      
      if (file.path.includes('requirements.txt')) {
        const content = file.content || '';
        if (content) {
          const lines = content.split('\n');
          for (const line of lines) {
            const dep = line.trim().split('==')[0].split('>=')[0].split('<=')[0];
            if (dep && !dep.startsWith('#')) {
              dependencies.push(dep);
            }
          }
        }
      }
    }
    
    return dependencies.slice(0, 20); // Limit to first 20
  }

  private hasConfigFiles(files: ProjectFile[]): boolean {
    const configPatterns = [
      'package.json',
      'tsconfig.json',
      'vite.config',
      'webpack.config',
      'next.config',
      'requirements.txt',
      'pom.xml',
      'cargo.toml',
      '.gitignore',
      '.env',
    ];
    
    return files.some(f => 
      configPatterns.some(pattern => f.path.toLowerCase().includes(pattern))
    );
  }

  private hasTests(files: ProjectFile[]): boolean {
    return files.some(f => 
      f.path.toLowerCase().includes('test') ||
      f.path.toLowerCase().includes('spec') ||
      f.path.toLowerCase().includes('__tests__')
    );
  }

  private hasDocs(files: ProjectFile[]): boolean {
    return files.some(f => 
      f.path.toLowerCase().includes('readme') ||
      f.path.toLowerCase().includes('docs') ||
      f.path.toLowerCase().endsWith('.md')
    );
  }

  private findEntryPoints(files: ProjectFile[]): string[] {
    const entryPoints: string[] = [];
    const commonEntryPoints = [
      'index.js',
      'index.ts',
      'index.tsx',
      'main.js',
      'main.ts',
      'app.js',
      'app.ts',
      'app.tsx',
      'main.py',
      'app.py',
    ];
    
    for (const file of files) {
      if (file.isDirectory) continue;
      const fileName = file.path.split('/').pop()?.toLowerCase() || '';
      if (commonEntryPoints.includes(fileName)) {
        entryPoints.push(file.path);
      }
    }
    
    return entryPoints;
  }
}

export const projectKnowledgeService = ProjectKnowledgeService.getInstance();

