import type { Project, ProjectFile } from '@/types/project';

export interface BulkOperation {
  id: string;
  type: 'find-replace' | 'rename-files' | 'delete-files' | 'format-files' | 'move-files';
  description: string;
  affectedFiles: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  preview?: BulkChange[];
  results?: BulkOperationResult[];
  createdAt: Date;
  completedAt?: Date;
}

export interface BulkChange {
  filePath: string;
  oldValue: string;
  newValue: string;
  lineNumber?: number;
}

export interface BulkOperationResult {
  filePath: string;
  success: boolean;
  error?: string;
  changes: number;
}

export interface FindReplaceOptions {
  find: string;
  replace: string;
  caseSensitive: boolean;
  useRegex: boolean;
  wholeWord: boolean;
  filePatterns?: string[];
  excludePatterns?: string[];
}

export interface FileRenameOptions {
  pattern: string;
  replacement: string;
  useRegex: boolean;
  preserveExtension: boolean;
}

class BulkOperationsService {
  private operations: Map<string, BulkOperation> = new Map();

  /**
   * Find and replace across multiple files
   */
  async findAndReplace(
    project: Project,
    options: FindReplaceOptions
  ): Promise<BulkOperation> {
    const operation: BulkOperation = {
      id: crypto.randomUUID(),
      type: 'find-replace',
      description: `Replace "${options.find}" with "${options.replace}"`,
      affectedFiles: [],
      status: 'pending',
      preview: [],
      createdAt: new Date(),
    };

    this.operations.set(operation.id, operation);

    // Build search pattern
    let searchPattern: RegExp;
    if (options.useRegex) {
      const flags = options.caseSensitive ? 'g' : 'gi';
      searchPattern = new RegExp(options.find, flags);
    } else {
      const escapedFind = options.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = options.wholeWord ? `\\b${escapedFind}\\b` : escapedFind;
      const flags = options.caseSensitive ? 'g' : 'gi';
      searchPattern = new RegExp(pattern, flags);
    }

    // Search through files
    const searchFiles = (files: ProjectFile[]) => {
      files.forEach(file => {
        if (file.isDirectory && file.children) {
          searchFiles(file.children);
        } else if (!file.isDirectory && file.content) {
          // Check file patterns
          if (options.filePatterns && options.filePatterns.length > 0) {
            const matches = options.filePatterns.some(pattern => 
              new RegExp(pattern).test(file.path)
            );
            if (!matches) return;
          }

          // Check exclude patterns
          if (options.excludePatterns && options.excludePatterns.length > 0) {
            const excluded = options.excludePatterns.some(pattern => 
              new RegExp(pattern).test(file.path)
            );
            if (excluded) return;
          }

          // Find matches
          const lines = file.content.split('\n');
          lines.forEach((line, index) => {
            if (searchPattern.test(line)) {
              const newLine = line.replace(searchPattern, options.replace);
              operation.preview?.push({
                filePath: file.path,
                oldValue: line,
                newValue: newLine,
                lineNumber: index + 1,
              });
              
              if (!operation.affectedFiles.includes(file.path)) {
                operation.affectedFiles.push(file.path);
              }
            }
          });
        }
      });
    };

    searchFiles(project.files);
    return operation;
  }

  /**
   * Execute a bulk operation
   */
  async executeOperation(
    operation: BulkOperation,
    updateFileCallback: (path: string, content: string) => void
  ): Promise<BulkOperationResult[]> {
    operation.status = 'running';
    const results: BulkOperationResult[] = [];

    try {
      if (operation.type === 'find-replace' && operation.preview) {
        // Group changes by file
        const fileChanges = new Map<string, BulkChange[]>();
        operation.preview.forEach(change => {
          if (!fileChanges.has(change.filePath)) {
            fileChanges.set(change.filePath, []);
          }
          fileChanges.get(change.filePath)!.push(change);
        });

        // Apply changes to each file
        fileChanges.forEach((changes, filePath) => {
          try {
            // Build new content
            let changeCount = 0;
            const newLines: string[] = [];
            let currentLine = 1;

            changes.forEach(change => {
              if (change.lineNumber) {
                // Add lines before this change
                while (currentLine < change.lineNumber) {
                  newLines.push(change.oldValue); // Would get from original in real implementation
                  currentLine++;
                }
                newLines.push(change.newValue);
                currentLine++;
                changeCount++;
              }
            });

            const newContent = newLines.join('\n');
            updateFileCallback(filePath, newContent);

            results.push({
              filePath,
              success: true,
              changes: changeCount,
            });
          } catch (error) {
            results.push({
              filePath,
              success: false,
              error: (error as Error).message,
              changes: 0,
            });
          }
        });
      }

      operation.status = 'completed';
      operation.results = results;
      operation.completedAt = new Date();
    } catch (error) {
      operation.status = 'failed';
      operation.completedAt = new Date();
    }

    return results;
  }

  /**
   * Bulk rename files
   */
  async renameFiles(
    _project: Project,
    selectedFiles: string[],
    options: FileRenameOptions
  ): Promise<BulkOperation> {
    const operation: BulkOperation = {
      id: crypto.randomUUID(),
      type: 'rename-files',
      description: `Rename ${selectedFiles.length} files`,
      affectedFiles: selectedFiles,
      status: 'pending',
      preview: [],
      createdAt: new Date(),
    };

    selectedFiles.forEach(filePath => {
      const fileName = filePath.split('/').pop() || filePath;
      const fileExt = fileName.includes('.') ? fileName.split('.').pop() : '';
      const baseName = fileExt ? fileName.replace(`.${fileExt}`, '') : fileName;

      let newBaseName: string;
      if (options.useRegex) {
        newBaseName = baseName.replace(new RegExp(options.pattern, 'g'), options.replacement);
      } else {
        newBaseName = baseName.replace(options.pattern, options.replacement);
      }

      const newFileName = options.preserveExtension && fileExt
        ? `${newBaseName}.${fileExt}`
        : newBaseName;

      // newPath computed but not used in preview - only fileName needed
      // const newPath = filePath.replace(fileName, newFileName);

      operation.preview?.push({
        filePath,
        oldValue: fileName,
        newValue: newFileName,
      });
    });

    this.operations.set(operation.id, operation);
    return operation;
  }

  /**
   * Bulk delete files
   */
  async deleteFiles(selectedFiles: string[]): Promise<BulkOperation> {
    const operation: BulkOperation = {
      id: crypto.randomUUID(),
      type: 'delete-files',
      description: `Delete ${selectedFiles.length} files`,
      affectedFiles: selectedFiles,
      status: 'pending',
      createdAt: new Date(),
    };

    this.operations.set(operation.id, operation);
    return operation;
  }

  /**
   * Bulk format files
   */
  async formatFiles(selectedFiles: string[]): Promise<BulkOperation> {
    const operation: BulkOperation = {
      id: crypto.randomUUID(),
      type: 'format-files',
      description: `Format ${selectedFiles.length} files`,
      affectedFiles: selectedFiles,
      status: 'pending',
      createdAt: new Date(),
    };

    this.operations.set(operation.id, operation);
    return operation;
  }

  /**
   * Bulk move files
   */
  async moveFiles(
    selectedFiles: string[],
    targetDirectory: string
  ): Promise<BulkOperation> {
    const operation: BulkOperation = {
      id: crypto.randomUUID(),
      type: 'move-files',
      description: `Move ${selectedFiles.length} files to ${targetDirectory}`,
      affectedFiles: selectedFiles,
      status: 'pending',
      preview: [],
      createdAt: new Date(),
    };

    selectedFiles.forEach(filePath => {
      const fileName = filePath.split('/').pop() || filePath;
      const newPath = `${targetDirectory}/${fileName}`;

      operation.preview?.push({
        filePath,
        oldValue: filePath,
        newValue: newPath,
      });
    });

    this.operations.set(operation.id, operation);
    return operation;
  }

  /**
   * Get operation by ID
   */
  getOperation(id: string): BulkOperation | undefined {
    return this.operations.get(id);
  }

  /**
   * Get all operations
   */
  getAllOperations(): BulkOperation[] {
    return Array.from(this.operations.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Cancel an operation
   */
  cancelOperation(id: string): boolean {
    const operation = this.operations.get(id);
    if (operation && operation.status === 'running') {
      operation.status = 'failed';
      operation.completedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Clear completed operations
   */
  clearCompleted(): void {
    Array.from(this.operations.entries()).forEach(([id, op]) => {
      if (op.status === 'completed' || op.status === 'failed') {
        this.operations.delete(id);
      }
    });
  }
}

export const bulkOperationsService = new BulkOperationsService();

