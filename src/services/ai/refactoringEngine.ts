import type { Project, ProjectFile } from '@/types/project';
import { multiFileContextService } from './multiFileContextService';

export interface RefactoringOperation {
  id: string;
  type: 'rename' | 'extract' | 'inline' | 'move' | 'convert' | 'optimize';
  description: string;
  filePath: string;
  changes: FileChange[];
  safe: boolean;
  preview: string;
}

export interface FileChange {
  filePath: string;
  oldContent: string;
  newContent: string;
  lineChanges: LineChange[];
}

export interface LineChange {
  line: number;
  oldText: string;
  newText: string;
}

export interface RefactoringResult {
  success: boolean;
  operation: RefactoringOperation;
  affectedFiles: string[];
  error?: string;
}

class RefactoringEngine {
  /**
   * Rename a symbol across the project
   */
  async renameSymbol(
    project: Project,
    filePath: string,
    oldName: string,
    newName: string
  ): Promise<RefactoringOperation> {
    // Validate inputs
    if (!oldName || !newName || oldName === newName) {
      throw new Error('Invalid rename parameters');
    }

    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(newName)) {
      throw new Error('Invalid identifier name');
    }

    // Find all occurrences across project
    const context = multiFileContextService.getProjectContext(project.id);
    if (!context) {
      await multiFileContextService.analyzeProject(project);
    }

    const changes: FileChange[] = [];
    const relatedFiles = multiFileContextService.getRelatedFiles(project.id, filePath, 3);

    relatedFiles.forEach(path => {
      const file = this.findFileByPath(project.files, path);
      if (file && file.content) {
        const newContent = this.replaceSymbol(file.content, oldName, newName);
        if (newContent !== file.content) {
          changes.push({
            filePath: path,
            oldContent: file.content,
            newContent,
            lineChanges: this.getLineChanges(file.content, newContent),
          });
        }
      }
    });

    return {
      id: crypto.randomUUID(),
      type: 'rename',
      description: `Rename ${oldName} to ${newName}`,
      filePath,
      changes,
      safe: true,
      preview: this.generatePreview(changes),
    };
  }

  /**
   * Extract method/function from selected code
   */
  async extractMethod(
    filePath: string,
    selectedCode: string,
    newMethodName: string,
    language: string
  ): Promise<RefactoringOperation> {
    // Validate method name
    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(newMethodName)) {
      throw new Error('Invalid method name');
    }

    // Analyze selected code for dependencies
    const variables = this.extractVariables(selectedCode);
    const parameters = variables.filter(v => !this.isLocalVariable(selectedCode, v));

    // Generate method signature
    const methodSignature = this.generateMethodSignature(newMethodName, parameters, language);
    const methodBody = this.formatMethodBody(selectedCode, language);
    const methodCall = this.generateMethodCall(newMethodName, parameters);

    // Build changes
    const changes: FileChange[] = [{
      filePath,
      oldContent: selectedCode,
      newContent: methodCall,
      lineChanges: [{
        line: 0,
        oldText: selectedCode,
        newText: methodSignature + '\n' + methodBody + '\n\n' + methodCall,
      }],
    }];

    return {
      id: crypto.randomUUID(),
      type: 'extract',
      description: `Extract method ${newMethodName}`,
      filePath,
      changes,
      safe: true,
      preview: `${methodSignature}\n${methodBody}\n\n// Call site:\n${methodCall}`,
    };
  }

  /**
   * Inline a function/method
   */
  async inlineFunction(
    project: Project,
    filePath: string,
    functionName: string
  ): Promise<RefactoringOperation> {
    const context = multiFileContextService.getProjectContext(project.id);
    if (!context) {
      await multiFileContextService.analyzeProject(project);
    }

    // Find function definition
    const fileContext = context?.files.get(filePath);
    if (!fileContext) {
      throw new Error('File not found in context');
    }

    const functionBody = this.extractFunctionBody(fileContext.content, functionName);
    if (!functionBody) {
      throw new Error(`Function ${functionName} not found`);
    }

    // Find all call sites
    const changes: FileChange[] = [];
    const relatedFiles = multiFileContextService.getRelatedFiles(project.id, filePath, 2);

    relatedFiles.forEach(path => {
      const file = this.findFileByPath(project.files, path);
      if (file && file.content) {
        const newContent = this.replaceFunctionCalls(file.content, functionName, functionBody);
        if (newContent !== file.content) {
          changes.push({
            filePath: path,
            oldContent: file.content,
            newContent,
            lineChanges: this.getLineChanges(file.content, newContent),
          });
        }
      }
    });

    return {
      id: crypto.randomUUID(),
      type: 'inline',
      description: `Inline function ${functionName}`,
      filePath,
      changes,
      safe: changes.length < 10, // Safe if small number of call sites
      preview: this.generatePreview(changes),
    };
  }

  /**
   * Move file/module to a different location
   */
  async moveFile(
    project: Project,
    oldPath: string,
    newPath: string
  ): Promise<RefactoringOperation> {
    const context = multiFileContextService.getProjectContext(project.id);
    if (!context) {
      await multiFileContextService.analyzeProject(project);
    }

    const file = this.findFileByPath(project.files, oldPath);
    if (!file) {
      throw new Error('File not found');
    }

    // Update all imports
    const changes: FileChange[] = [];
    
    // Add the file move itself
    changes.push({
      filePath: oldPath,
      oldContent: file.content || '',
      newContent: file.content || '',
      lineChanges: [],
    });

    // Update imports in other files
    context?.dependencyGraph.forEach((deps, depPath) => {
      if (deps.has(oldPath) || this.hasRelativeImport(deps, oldPath)) {
        const depFile = this.findFileByPath(project.files, depPath);
        if (depFile && depFile.content) {
          const newContent = this.updateImportPaths(depFile.content, oldPath, newPath, depPath);
          changes.push({
            filePath: depPath,
            oldContent: depFile.content,
            newContent,
            lineChanges: this.getLineChanges(depFile.content, newContent),
          });
        }
      }
    });

    return {
      id: crypto.randomUUID(),
      type: 'move',
      description: `Move ${oldPath} to ${newPath}`,
      filePath: oldPath,
      changes,
      safe: true,
      preview: this.generatePreview(changes),
    };
  }

  /**
   * Convert code style (e.g., var to const/let, function to arrow)
   */
  async convertStyle(
    filePath: string,
    content: string,
    conversionType: 'var-to-const' | 'function-to-arrow' | 'class-to-function'
  ): Promise<RefactoringOperation> {
    let newContent = content;

    switch (conversionType) {
      case 'var-to-const':
        newContent = this.convertVarToConst(content);
        break;
      case 'function-to-arrow':
        newContent = this.convertFunctionToArrow(content);
        break;
      case 'class-to-function':
        newContent = this.convertClassToFunction(content);
        break;
    }

    const changes: FileChange[] = [{
      filePath,
      oldContent: content,
      newContent,
      lineChanges: this.getLineChanges(content, newContent),
    }];

    return {
      id: crypto.randomUUID(),
      type: 'convert',
      description: `Convert style: ${conversionType}`,
      filePath,
      changes,
      safe: true,
      preview: this.generatePreview(changes),
    };
  }

  /**
   * Optimize imports (remove unused, sort, group)
   */
  async optimizeImports(filePath: string, content: string): Promise<RefactoringOperation> {
    const usedSymbols = this.findUsedSymbols(content);
    const imports = this.parseImports(content);
    
    // Remove unused imports
    const usedImports = imports.filter(imp => 
      imp.symbols.some(sym => usedSymbols.has(sym))
    );

    // Sort and group imports
    const sortedImports = this.sortImports(usedImports);
    
    // Rebuild content
    const newContent = this.rebuildWithImports(content, sortedImports);

    const changes: FileChange[] = [{
      filePath,
      oldContent: content,
      newContent,
      lineChanges: this.getLineChanges(content, newContent),
    }];

    return {
      id: crypto.randomUUID(),
      type: 'optimize',
      description: 'Optimize imports',
      filePath,
      changes,
      safe: true,
      preview: this.generatePreview(changes),
    };
  }

  // Helper methods

  private replaceSymbol(content: string, oldName: string, newName: string): string {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${oldName}\\b`, 'g');
    return content.replace(regex, newName);
  }

  private getLineChanges(oldContent: string, newContent: string): LineChange[] {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const changes: LineChange[] = [];

    const maxLen = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLen; i++) {
      if (oldLines[i] !== newLines[i]) {
        changes.push({
          line: i + 1,
          oldText: oldLines[i] || '',
          newText: newLines[i] || '',
        });
      }
    }

    return changes;
  }

  private generatePreview(changes: FileChange[]): string {
    let preview = '';
    changes.forEach(change => {
      preview += `\n=== ${change.filePath} ===\n`;
      change.lineChanges.slice(0, 5).forEach(lineChange => {
        preview += `Line ${lineChange.line}:\n`;
        preview += `- ${lineChange.oldText}\n`;
        preview += `+ ${lineChange.newText}\n`;
      });
      if (change.lineChanges.length > 5) {
        preview += `... and ${change.lineChanges.length - 5} more changes\n`;
      }
    });
    return preview;
  }

  private extractVariables(code: string): string[] {
    const varRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
    const variables = new Set<string>();
    let match;
    while ((match = varRegex.exec(code)) !== null) {
      if (!this.isKeyword(match[1])) {
        variables.add(match[1]);
      }
    }
    return Array.from(variables);
  }

  private isLocalVariable(code: string, varName: string): boolean {
    const declRegex = new RegExp(`\\b(?:const|let|var)\\s+${varName}\\b`);
    return declRegex.test(code);
  }

  private isKeyword(word: string): boolean {
    const keywords = ['if', 'else', 'for', 'while', 'function', 'return', 'const', 'let', 'var', 'class', 'import', 'export'];
    return keywords.includes(word);
  }

  private generateMethodSignature(name: string, params: string[], language: string): string {
    const paramList = params.join(', ');
    if (language === 'typescript' || language === 'javascript') {
      return `function ${name}(${paramList}) {`;
    }
    return `def ${name}(${paramList}):`;
  }

  private formatMethodBody(code: string, language: string): string {
    const lines = code.split('\n');
    const indented = lines.map(line => '  ' + line).join('\n');
    return indented + (language === 'typescript' || language === 'javascript' ? '\n}' : '');
  }

  private generateMethodCall(name: string, params: string[]): string {
    return `${name}(${params.join(', ')})`;
  }

  private extractFunctionBody(content: string, functionName: string): string | null {
    const regex = new RegExp(`function\\s+${functionName}\\s*\\([^)]*\\)\\s*{([^}]+)}`, 's');
    const match = regex.exec(content);
    return match ? match[1].trim() : null;
  }

  private replaceFunctionCalls(content: string, functionName: string, functionBody: string): string {
    const callRegex = new RegExp(`${functionName}\\s*\\([^)]*\\)`, 'g');
    return content.replace(callRegex, `(${functionBody})`);
  }

  private findFileByPath(files: ProjectFile[], path: string): ProjectFile | null {
    for (const file of files) {
      if (file.path === path) return file;
      if (file.children) {
        const found = this.findFileByPath(file.children, path);
        if (found) return found;
      }
    }
    return null;
  }

  private hasRelativeImport(deps: Set<string>, path: string): boolean {
    return Array.from(deps).some(dep => dep.includes(path.split('/').pop() || ''));
  }

  private updateImportPaths(content: string, fileToMoveOldPath: string, fileToMoveNewPath: string, currentFilePath: string): string {
    const importRegex = /import\s+(?:.+?\s+from\s+)?['"](.+?)['"]/g;
    
    // NOTE: This assumes a 'path' object similar to Node's path module is available.
    const path = {
      dirname: (p: string) => p.substring(0, p.lastIndexOf('/')),
      relative: (from: string, to: string) => {
        const fromParts = from.split('/').filter(Boolean);
        const toParts = to.split('/').filter(Boolean);
        let i = 0;
        while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) {
          i++;
        }
        let relPath = '../'.repeat(fromParts.length - 1 - i);
        relPath += toParts.slice(i).join('/');
        if (!relPath.startsWith('.')) {
          relPath = './' + relPath;
        }
        return relPath;
      },
      join: (...parts: string[]) => parts.join('/').replace(/\/+/g, '/')
    };

    return content.replace(importRegex, (match, importPath) => {
      if (!importPath.startsWith('.')) return match; // a non-relative import, ignore
      const importAbsolutePath = path.join(path.dirname(currentFilePath), importPath);
      
      if (importAbsolutePath.startsWith(fileToMoveOldPath.replace(/\.(ts|tsx)$/, ''))) {
        const newRelativePath = path.relative(path.dirname(currentFilePath), fileToMoveNewPath.replace(/\.(ts|tsx)$/, ''));
        return match.replace(importPath, newRelativePath);
      }
      
      return match;
    });
  }

  private convertVarToConst(content: string): string {
    return content.replace(/\bvar\s+(\w+)\s*=/g, 'const $1 =');
  }

  private convertFunctionToArrow(content: string): string {
    return content.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*{/g, 'const $1 = ($2) => {');
  }

  private convertClassToFunction(content: string): string {
    // Simplified - would need full AST parsing for production
    return content; // Placeholder
  }

  private findUsedSymbols(content: string): Set<string> {
    const symbols = new Set<string>();
    const symbolRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
    let match;
    while ((match = symbolRegex.exec(content)) !== null) {
      symbols.add(match[1]);
    }
    return symbols;
  }

  private parseImports(content: string): Array<{ raw: string; source: string; symbols: string[] }> {
    const imports: Array<{ raw: string; source: string; symbols: string[] }> = [];
    // This regex captures: default, { named }, * as namespace, and side-effect imports
    const importRegex = /import(?:(?:([^"'\s]+)\s*,?\s*)?(?:{([^}]+)})?\s*|\s*(\* as \S+)\s*)from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const [raw, defaultImport, namedImports, namespaceImport, source1, source2] = match;
      const source = source1 || source2;
      const symbols = [];
      if (defaultImport) symbols.push(defaultImport.trim());
      if (namedImports) symbols.push(...namedImports.split(',').map(s => s.trim()).filter(Boolean));
      if (namespaceImport) symbols.push(namespaceImport.trim());

      imports.push({ raw, source, symbols });
    }
    return imports;
  }

  private sortImports(imports: Array<{ raw: string; source: string; symbols: string[] }>): Array<{ raw: string; source: string; symbols: string[] }> {
    return imports.sort((a, b) => {
      // External imports first, then relative
      const aExternal = !a.source.startsWith('.');
      const bExternal = !b.source.startsWith('.');
      if (aExternal !== bExternal) return aExternal ? -1 : 1;
      return a.source.localeCompare(b.source);
    });
  }

  private rebuildWithImports(content: string, imports: Array<{ raw: string; source: string; symbols: string[] }>): string {
    // Remove old imports
    const importRegex = /import(?:(?:.+?\s+from\s+)?['"].+?['"]|['"].+?['"]);?/g;
    const withoutImports = content.replace(importRegex, '');
    
    // Add sorted imports
    const importLines = imports.map(imp => imp.raw).join('\n');
    
    return importLines + '\n\n' + withoutImports.trim();
  }
}

export const refactoringEngine = new RefactoringEngine();

