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
  resolvedDependencies: string[];
  externalDependencies: string[];
  lineCount: number;
  todoCount: number;
  isTestFile: boolean;
}

export interface ProjectContext {
  projectId: string;
  files: Map<string, FileContext>;
  dependencyGraph: Map<string, Set<string>>;
  dependentsGraph: Map<string, Set<string>>;
  filesByLanguage: Map<string, string[]>;
  totalLines: number;
  lastAnalyzed: Date;
}

export interface ProjectGraphInsights {
  cycles: string[][];
  orphans: string[];
  hotspots: { path: string; dependents: number }[];
  externalDependencies: string[];
}

class MultiFileContextService {
  private contexts: Map<string, ProjectContext> = new Map();
  private readonly extensionCandidates = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'];
  private readonly indexCandidates = ['/index.ts', '/index.tsx', '/index.js', '/index.jsx', '/index.mjs', '/index.cjs'];

  private normalizePath(path: string): string {
    return path.replace(/\\/g, '/').replace(/^\.\/?/, '').replace(/\/{2,}/g, '/');
  }

  private normalizeImportSpecifier(specifier: string): string {
    const trimmed = specifier.trim();
    if (trimmed.startsWith('@/')) {
      return `src/${trimmed.slice(2)}`;
    }
    return trimmed;
  }

  private resolveImportPath(fromPath: string, importPath: string, filePaths: Set<string>): string | null {
    const normalizedSpecifier = this.normalizeImportSpecifier(importPath);
    if (normalizedSpecifier.startsWith('.')) {
      const base = this.resolvePath(fromPath, normalizedSpecifier);
      if (!base) return null;
      return this.findExistingPath(base, filePaths);
    }

    if (normalizedSpecifier.startsWith('src/')) {
      return this.findExistingPath(normalizedSpecifier, filePaths);
    }

    // Attempt to resolve bare specifiers to src/aliases
    const candidate = this.findExistingPath(`src/${normalizedSpecifier}`, filePaths);
    if (candidate) {
      return candidate;
    }

    return null;
  }

  private findExistingPath(basePath: string, filePaths: Set<string>): string | null {
    const normalizedBase = this.normalizePath(basePath);

    if (filePaths.has(normalizedBase)) {
      return normalizedBase;
    }

    for (const ext of this.extensionCandidates) {
      if (!ext) continue;
      const candidate = normalizedBase.endsWith(ext) ? normalizedBase : `${normalizedBase}${ext}`;
      if (filePaths.has(candidate)) {
        return candidate;
      }
    }

    const lastSegment = normalizedBase.split('/').pop() ?? '';
    const hasExtension = /\.[^/]+$/.test(lastSegment);
    if (!hasExtension) {
      for (const indexSuffix of this.indexCandidates) {
        const candidate =
          normalizedBase.endsWith('/')
            ? this.normalizePath(`${normalizedBase}${indexSuffix.slice(1)}`)
            : this.normalizePath(`${normalizedBase}${indexSuffix}`);
        if (filePaths.has(candidate)) {
          return candidate;
        }
      }
    }

    return null;
  }

  /**
   * Analyze a project and build comprehensive context
   */
  async analyzeProject(project: Project): Promise<ProjectContext> {
    const context: ProjectContext = {
      projectId: project.id,
      files: new Map(),
      dependencyGraph: new Map(),
      dependentsGraph: new Map(),
      filesByLanguage: new Map(),
      totalLines: 0,
      lastAnalyzed: new Date(),
    };

    // Analyze all files in the project
    const analyzeFile = (file: ProjectFile) => {
      if (!file.isDirectory && file.content) {
        const fileContext = this.analyzeFileContent(file);
        const normalizedPath = this.normalizePath(file.path);
        fileContext.path = normalizedPath;
        context.files.set(normalizedPath, fileContext);
        context.totalLines += fileContext.lineCount;

        // Group by language
        if (!context.filesByLanguage.has(fileContext.language)) {
          context.filesByLanguage.set(fileContext.language, []);
        }
        context.filesByLanguage.get(fileContext.language)!.push(normalizedPath);

        // Build dependency graph
        if (fileContext.dependencies.length > 0 || fileContext.resolvedDependencies.length > 0) {
          const deps = new Set<string>();
          fileContext.resolvedDependencies.forEach(dep => deps.add(dep));
          if (deps.size === 0) {
            fileContext.dependencies.forEach(dep => deps.add(dep));
          }
          context.dependencyGraph.set(normalizedPath, deps);
        } else {
          context.dependencyGraph.set(normalizedPath, new Set());
        }
      }

      // Recursively analyze children
      if (file.children) {
        file.children.forEach(analyzeFile);
      }
    };

    project.files.forEach(analyzeFile);

    const filePaths = new Set(context.files.keys());

    context.files.forEach((fileContext, filePath) => {
      const resolvedDeps = new Set<string>();
      const externalDeps = new Set<string>();

      // Make sure external deps collected earlier are unique
      fileContext.externalDependencies.forEach((dep) => externalDeps.add(this.normalizeImportSpecifier(dep)));

      fileContext.dependencies.forEach((dep) => {
        const resolved = this.resolveImportPath(filePath, dep, filePaths);
        if (resolved) {
          resolvedDeps.add(resolved);
        } else {
          externalDeps.add(this.normalizeImportSpecifier(dep));
        }
      });

      fileContext.resolvedDependencies = Array.from(resolvedDeps);
      fileContext.externalDependencies = Array.from(externalDeps);

      context.dependencyGraph.set(filePath, resolvedDeps);
    });

    // Build dependents graph
    context.dependencyGraph.forEach((deps, source) => {
      deps.forEach(dep => {
        const normalizedDep = this.normalizePath(dep);
        if (!context.dependentsGraph.has(normalizedDep)) {
          context.dependentsGraph.set(normalizedDep, new Set());
        }
        context.dependentsGraph.get(normalizedDep)!.add(source);

        // Ensure dependency node exists in graph
        if (!context.dependencyGraph.has(normalizedDep)) {
          context.dependencyGraph.set(normalizedDep, new Set());
        }
      });
    });

    this.contexts.set(project.id, context);
    return context;
  }

  /**
   * Analyze individual file content
   */
  private analyzeFileContent(file: ProjectFile): FileContext {
    const content = file.content || '';
    const normalizedPath = this.normalizePath(file.path);
    const lines = content.split(/\r?\n/);
    const todoMatches = content.match(/TODO|FIXME/gi)?.length ?? 0;
    const isTestFile = /\.test\./.test(normalizedPath) ||
      /\.spec\./.test(normalizedPath) ||
      /__tests__/.test(normalizedPath) ||
      normalizedPath.endsWith('.spec.tsx') ||
      normalizedPath.endsWith('.spec.ts') ||
      normalizedPath.endsWith('.test.tsx') ||
      normalizedPath.endsWith('.test.ts');

    const fileContext: FileContext = {
      path: normalizedPath,
      content,
      language: file.language || 'plaintext',
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      dependencies: [],
      resolvedDependencies: [],
      externalDependencies: [],
      lineCount: lines.length,
      todoCount: todoMatches,
      isTestFile,
    };

    // Extract imports (TypeScript/JavaScript patterns)
    // This regex captures: default, { named }, * as namespace, and side-effect imports
    const importRegex = /import(?:(?:.+?\s+from\s+)?['"]([^'"]+)['"]|['"]([^'"]+)['"])/g;
    const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
    const pythonImportRegex = /^(?:from\s+(\S+)\s+)?import\s+(.+)/gm;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const source = match[1] || match[2];
      if (source) {
        fileContext.imports.push(source);
        if (source.startsWith('.')) {
          fileContext.dependencies.push(source);
        } else {
          fileContext.externalDependencies.push(source);
        }
      }
    }

    while ((match = requireRegex.exec(content)) !== null) {
      fileContext.imports.push(match[1]);
      if (match[1].startsWith('.')) {
        fileContext.dependencies.push(match[1]);
      } else {
        fileContext.externalDependencies.push(match[1]);
      }
    }

    while ((match = pythonImportRegex.exec(content)) !== null) {
      const module = match[1] || match[2];
      fileContext.imports.push(module);
      if (module.startsWith('.')) {
        fileContext.dependencies.push(module);
      } else {
        fileContext.externalDependencies.push(module);
      }
    }

    fileContext.imports = Array.from(new Set(fileContext.imports));
    fileContext.dependencies = Array.from(new Set(fileContext.dependencies));
    fileContext.externalDependencies = Array.from(new Set(fileContext.externalDependencies));

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

    const normalizedPath = this.normalizePath(filePath);
    const related = new Set<string>();
    const visited = new Set<string>();

    const traverse = (path: string, currentDepth: number) => {
      if (currentDepth > depth || visited.has(path)) return;
      visited.add(path);
      related.add(path);

      const dependencies = context.dependencyGraph.get(path);
      if (dependencies) {
        dependencies.forEach((dep) => {
          if (context.files.has(dep)) {
            traverse(dep, currentDepth + 1);
          }
        });
      }

      const dependents = context.dependentsGraph.get(path);
      if (dependents) {
        dependents.forEach((dependent) => traverse(dependent, currentDepth + 1));
      }
    };

    traverse(normalizedPath, 0);
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

    const fromParts = this.normalizePath(fromPath).split('/');
    fromParts.pop(); // Remove filename
    
    const relParts = relativePath.split('/');
    relParts.forEach(part => {
      if (part === '..') {
        fromParts.pop();
      } else if (part !== '.') {
        fromParts.push(part);
      }
    });

    return this.normalizePath(fromParts.join('/'));
  }

  // Removed unused _getRelativePath method - kept for future use but currently unused

  /**
   * Clear context for a project
   */
  clearContext(projectId: string): void {
    this.contexts.delete(projectId);
  }

  getGraphInsights(projectId: string): ProjectGraphInsights | null {
    const context = this.contexts.get(projectId);
    if (!context) return null;

    const cycles: string[][] = [];
    const cycleKeys = new Set<string>();
    const visited = new Set<string>();
    const stack = new Set<string>();
    const pathStack: string[] = [];

    const dfs = (node: string) => {
      if (!context.files.has(node)) return;
      visited.add(node);
      stack.add(node);
      pathStack.push(node);

      const neighbors = context.dependencyGraph.get(node);
      neighbors?.forEach((neighbor) => {
        if (!context.files.has(neighbor)) {
          return;
        }
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (stack.has(neighbor)) {
          const startIndex = pathStack.indexOf(neighbor);
          if (startIndex !== -1) {
            const cycle = [...pathStack.slice(startIndex), neighbor];
            const key = cycle.join('->');
            if (!cycleKeys.has(key)) {
              cycleKeys.add(key);
              cycles.push(cycle);
            }
          }
        }
      });

      stack.delete(node);
      pathStack.pop();
    };

    context.dependencyGraph.forEach((_deps, node) => {
      if (!context.files.has(node)) return;
      if (!visited.has(node)) {
        dfs(node);
      }
    });

    const orphans = Array.from(context.files.keys()).filter((path) => {
      const deps = context.dependencyGraph.get(path);
      const dependents = context.dependentsGraph.get(path);
      return (!deps || deps.size === 0) && (!dependents || dependents.size === 0);
    });

    const hotspots = Array.from(context.dependentsGraph.entries())
      .map(([path, dependents]) => ({
        path,
        dependents: dependents.size,
      }))
      .filter((entry) => entry.dependents > 0)
      .sort((a, b) => b.dependents - a.dependents)
      .slice(0, 5);

    const externalDependencies = new Set<string>();
    context.files.forEach((file) => {
      file.externalDependencies.forEach((dep) => externalDependencies.add(dep));
    });

    return {
      cycles,
      orphans,
      hotspots,
      externalDependencies: Array.from(externalDependencies).sort(),
    };
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
    todoCount: number;
    testFileCount: number;
    externalDependencyCount: number;
  } | null {
    const context = this.contexts.get(projectId);
    if (!context) return null;

    const languageDistribution: Record<string, number> = {};
    context.filesByLanguage.forEach((files, lang) => {
      languageDistribution[lang] = files.length;
    });

    const filesArray = Array.from(context.files.values());
    const connectionCounts = Array.from(context.dependencyGraph.entries())
      .map(([path, deps]) => ({ path, connections: deps.size }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 10);

    let todoCount = 0;
    let testFileCount = 0;
    const externalDeps = new Set<string>();

    filesArray.forEach((file) => {
      todoCount += file.todoCount;
      if (file.isTestFile) testFileCount += 1;
      file.externalDependencies.forEach((dep) => externalDeps.add(dep));
    });

    return {
      totalFiles: context.files.size,
      totalLines: context.totalLines,
      languageDistribution,
      avgFileSize: context.files.size > 0 ? Math.round(context.totalLines / context.files.size) : 0,
      mostConnectedFiles: connectionCounts,
      todoCount,
      testFileCount,
      externalDependencyCount: externalDeps.size,
    };
  }
}

export const multiFileContextService = new MultiFileContextService();

