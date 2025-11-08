import type { Project, ProjectFile } from '@/types/project';

export interface FileContext {
  path: string;
  content: string;
  language: string;
  imports: string[];
  exports: string[];
  functions: string[];
  classes: string[];
  dependencies: string[];
}

export interface ProjectContext {
  projectId: string;
  files: Map<string, FileContext>;
  dependencyGraph: Map<string, Set<string>>;
  filesByLanguage: Map<string, string[]>;
  totalLines: number;
  lastAnalyzed: Date;
}

class MultiFileContextService {
  private contexts: Map<string, ProjectContext> = new Map();

  /**
   * Analyze a project and build comprehensive context
   */
  async analyzeProject(project: Project): Promise<ProjectContext> {
    const context: ProjectContext = {
      projectId: project.id,
      files: new Map(),
      dependencyGraph: new Map(),
      filesByLanguage: new Map(),
      totalLines: 0,
      lastAnalyzed: new Date(),
    };

    // Analyze all files in the project
    const analyzeFile = (file: ProjectFile) => {
      if (!file.isDirectory && file.content) {
        const fileContext = this.analyzeFileContent(file);
        context.files.set(file.path, fileContext);
        context.totalLines += file.content.split('\n').length;

        // Group by language
        if (!context.filesByLanguage.has(fileContext.language)) {
          context.filesByLanguage.set(fileContext.language, []);
        }
        context.filesByLanguage.get(fileContext.language)!.push(file.path);

        // Build dependency graph
        if (fileContext.dependencies.length > 0) {
          context.dependencyGraph.set(file.path, new Set(fileContext.dependencies));
        }
      }

      // Recursively analyze children
      if (file.children) {
        file.children.forEach(analyzeFile);
      }
    };

    project.files.forEach(analyzeFile);
    
    this.contexts.set(project.id, context);
    return context;
  }

  /**
   * Analyze individual file content
   */
  private analyzeFileContent(file: ProjectFile): FileContext {
    const content = file.content || '';
    const fileContext: FileContext = {
      path: file.path,
      content,
      language: file.language || 'plaintext',
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      dependencies: [],
    };

    // Extract imports (TypeScript/JavaScript/Python patterns)
    const importRegex = /^import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/gm;
    const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
    const pythonImportRegex = /^(?:from\s+(\S+)\s+)?import\s+(.+)/gm;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      fileContext.imports.push(match[1]);
      if (match[1].startsWith('.')) {
        fileContext.dependencies.push(match[1]);
      }
    }

    while ((match = requireRegex.exec(content)) !== null) {
      fileContext.imports.push(match[1]);
      if (match[1].startsWith('.')) {
        fileContext.dependencies.push(match[1]);
      }
    }

    while ((match = pythonImportRegex.exec(content)) !== null) {
      const module = match[1] || match[2];
      fileContext.imports.push(module);
      if (module.startsWith('.')) {
        fileContext.dependencies.push(module);
      }
    }

    // Extract exports
    const exportRegex = /^export\s+(?:default\s+)?(?:const|let|var|function|class)\s+(\w+)/gm;
    while ((match = exportRegex.exec(content)) !== null) {
      fileContext.exports.push(match[1]);
    }

    // Extract functions
    const functionRegex = /(?:function|const|let|var)\s+(\w+)\s*=?\s*(?:\([^)]*\)|async\s*\([^)]*\))\s*(?:=>|{)/g;
    while ((match = functionRegex.exec(content)) !== null) {
      fileContext.functions.push(match[1]);
    }

    // Extract classes
    const classRegex = /class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      fileContext.classes.push(match[1]);
    }

    return fileContext;
  }

  /**
   * Get context for a specific project
   */
  getProjectContext(projectId: string): ProjectContext | undefined {
    return this.contexts.get(projectId);
  }

  /**
   * Get related files based on dependencies
   */
  getRelatedFiles(projectId: string, filePath: string, depth: number = 2): string[] {
    const context = this.contexts.get(projectId);
    if (!context) return [];

    const related = new Set<string>();
    const visited = new Set<string>();
    
    const traverse = (path: string, currentDepth: number) => {
      if (currentDepth > depth || visited.has(path)) return;
      visited.add(path);
      related.add(path);

      const dependencies = context.dependencyGraph.get(path);
      if (dependencies) {
        dependencies.forEach(dep => {
          // Resolve relative paths
          const resolvedPath = this.resolvePath(path, dep);
          if (resolvedPath) {
            traverse(resolvedPath, currentDepth + 1);
          }
        });
      }

      // Also find files that depend on this file
      context.dependencyGraph.forEach((deps, depPath) => {
        if (deps.has(path) || deps.has(this.getRelativePath(depPath, path))) {
          traverse(depPath, currentDepth + 1);
        }
      });
    };

    traverse(filePath, 0);
    return Array.from(related);
  }

  /**
   * Generate AI prompt context from multiple files
   */
  generateContextPrompt(projectId: string, files: string[]): string {
    const context = this.contexts.get(projectId);
    if (!context) return '';

    let prompt = '=== Project Context ===\n\n';

    // Add project overview
    prompt += `Total Files: ${context.files.size}\n`;
    prompt += `Total Lines: ${context.totalLines}\n`;
    prompt += `Languages: ${Array.from(context.filesByLanguage.keys()).join(', ')}\n\n`;

    // Add file-specific context
    prompt += '=== Relevant Files ===\n\n';
    files.forEach(filePath => {
      const fileContext = context.files.get(filePath);
      if (fileContext) {
        prompt += `## ${filePath} (${fileContext.language})\n`;
        if (fileContext.imports.length > 0) {
          prompt += `Imports: ${fileContext.imports.join(', ')}\n`;
        }
        if (fileContext.exports.length > 0) {
          prompt += `Exports: ${fileContext.exports.join(', ')}\n`;
        }
        if (fileContext.functions.length > 0) {
          prompt += `Functions: ${fileContext.functions.join(', ')}\n`;
        }
        if (fileContext.classes.length > 0) {
          prompt += `Classes: ${fileContext.classes.join(', ')}\n`;
        }
        prompt += `\n\`\`\`${fileContext.language}\n${fileContext.content}\n\`\`\`\n\n`;
      }
    });

    return prompt;
  }

  /**
   * Find files by symbol (function, class, variable)
   */
  findSymbol(projectId: string, symbolName: string): { file: string; type: 'function' | 'class' | 'export' }[] {
    const context = this.contexts.get(projectId);
    if (!context) return [];

    const results: { file: string; type: 'function' | 'class' | 'export' }[] = [];

    context.files.forEach((fileContext, filePath) => {
      if (fileContext.functions.includes(symbolName)) {
        results.push({ file: filePath, type: 'function' });
      }
      if (fileContext.classes.includes(symbolName)) {
        results.push({ file: filePath, type: 'class' });
      }
      if (fileContext.exports.includes(symbolName)) {
        results.push({ file: filePath, type: 'export' });
      }
    });

    return results;
  }

  /**
   * Resolve relative import path
   */
  private resolvePath(fromPath: string, relativePath: string): string | null {
    if (!relativePath.startsWith('.')) return null;

    const fromParts = fromPath.split('/');
    fromParts.pop(); // Remove filename
    
    const relParts = relativePath.split('/');
    relParts.forEach(part => {
      if (part === '..') {
        fromParts.pop();
      } else if (part !== '.') {
        fromParts.push(part);
      }
    });

    return fromParts.join('/');
  }

  /**
   * Get relative path from one file to another
   */
  private getRelativePath(from: string, to: string): string {
    const fromParts = from.split('/');
    const toParts = to.split('/');

    // Find common base
    let commonLength = 0;
    while (commonLength < fromParts.length && commonLength < toParts.length && 
           fromParts[commonLength] === toParts[commonLength]) {
      commonLength++;
    }

    // Build relative path
    const upCount = fromParts.length - commonLength - 1;
    const upPath = '../'.repeat(upCount);
    const downPath = toParts.slice(commonLength).join('/');

    return upPath + downPath;
  }

  /**
   * Clear context for a project
   */
  clearContext(projectId: string): void {
    this.contexts.delete(projectId);
  }

  /**
   * Get statistics about the context
   */
  getStats(projectId: string): {
    totalFiles: number;
    totalLines: number;
    languageDistribution: Record<string, number>;
    avgFileSize: number;
    mostConnectedFiles: { path: string; connections: number }[];
  } | null {
    const context = this.contexts.get(projectId);
    if (!context) return null;

    const languageDistribution: Record<string, number> = {};
    context.filesByLanguage.forEach((files, lang) => {
      languageDistribution[lang] = files.length;
    });

    const connectionCounts = Array.from(context.dependencyGraph.entries())
      .map(([path, deps]) => ({ path, connections: deps.size }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 10);

    return {
      totalFiles: context.files.size,
      totalLines: context.totalLines,
      languageDistribution,
      avgFileSize: Math.round(context.totalLines / context.files.size),
      mostConnectedFiles: connectionCounts,
    };
  }
}

export const multiFileContextService = new MultiFileContextService();

