/**
 * gitDiffService.ts
 * 
 * PURPOSE:
 * Service for retrieving Git diff content. Provides methods to get diffs between
 * commits, branches, and working directory changes. Used by GitDiffViewer component.
 * 
 * ARCHITECTURE:
 * Service layer that wraps simple-git operations for diff retrieval:
 * - Get diff for specific file
 * - Get diff between commits/branches
 * - Get diff summary (statistics)
 * - Parse diff content for display
 * 
 * Features:
 * - File-level diffs
 * - Commit-to-commit diffs
 * - Branch comparison diffs
 * - Working directory diffs
 * - Diff statistics
 * 
 * CURRENT STATUS:
 * ✅ File diff retrieval
 * ✅ Commit diff retrieval
 * ✅ Branch diff retrieval
 * ✅ Working directory diff
 * ✅ Diff statistics
 * 
 * DEPENDENCIES:
 * - simple-git: Git operations
 * - Electron environment: Required for Node.js Git operations
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { gitDiffService } from '@/services/git/gitDiffService';
 * 
 * const diff = await gitDiffService.getFileDiff('/path/to/repo', 'src/file.ts');
 * const stats = await gitDiffService.getDiffStats('/path/to/repo', 'HEAD', 'main');
 * ```
 * 
 * RELATED FILES:
 * - src/components/GitHub/GitDiffViewer.tsx: Diff viewer component
 * - src/services/github/githubService.ts: Related Git operations
 */

// Dynamic import helper for simple-git (Node.js only, not available in browser)
async function getSimpleGit(path?: string) {
  try {
    // Only import in Electron environment (has window.electron)
    if (typeof window !== 'undefined' && !(window as any).electron) {
      throw new Error('Git operations are only available in Electron environment');
    }
    const simpleGit = (await import('simple-git')).default;
    return path ? simpleGit(path) : simpleGit();
  } catch (error) {
    throw new Error(`Failed to load git: ${(error as Error).message}`);
  }
}

export interface FileDiff {
  path: string;
  originalContent: string;
  modifiedContent: string;
  diff: string;
  stats: {
    insertions: number;
    deletions: number;
    linesChanged: number;
  };
}

export interface DiffStats {
  files: Array<{
    path: string;
    insertions: number;
    deletions: number;
  }>;
  totalInsertions: number;
  totalDeletions: number;
  totalFiles: number;
}

export interface DiffOptions {
  base?: string; // Commit/branch to compare from (default: HEAD)
  contextLines?: number; // Number of context lines (default: 3)
  ignoreWhitespace?: boolean; // Ignore whitespace changes
}

class GitDiffService {
  private static instance: GitDiffService;

  private constructor() {}

  static getInstance(): GitDiffService {
    if (!GitDiffService.instance) {
      GitDiffService.instance = new GitDiffService();
    }
    return GitDiffService.instance;
  }

  /**
   * Get diff for a specific file
   * @param repoPath - Path to the Git repository
   * @param filePath - Path to the file (relative to repo root)
   * @param options - Diff options
   * @returns File diff with original and modified content
   */
  async getFileDiff(
    repoPath: string,
    filePath: string,
    options: DiffOptions = {}
  ): Promise<FileDiff | null> {
    try {
      const git = await getSimpleGit(repoPath);
      const base = options.base || 'HEAD';
      const contextLines = options.contextLines || 3;

      // Get the diff
      const diffArgs = [
        base,
        '--',
        filePath,
        `-U${contextLines}`,
      ];
      
      if (options.ignoreWhitespace) {
        diffArgs.push('-w');
      }

      const diff = await git.diff(diffArgs);

      if (!diff || diff.trim().length === 0) {
        // File might be new or unchanged
        const status = await git.status();
        const fileStatus = status.files.find(f => f.path === filePath);
        
        if (fileStatus?.working_dir === 'A' || fileStatus?.working_dir === '??') {
          // New file - get current content
          const fs = await import('fs/promises');
          const path = await import('path');
          const fullPath = path.join(repoPath, filePath);
          const content = await fs.readFile(fullPath, 'utf-8');
          
          return {
            path: filePath,
            originalContent: '',
            modifiedContent: content,
            diff: `diff --git a/${filePath} b/${filePath}\nnew file mode 100644\n--- /dev/null\n+++ b/${filePath}\n${content.split('\n').map((line) => `+${line}`).join('\n')}`,
            stats: {
              insertions: content.split('\n').length,
              deletions: 0,
              linesChanged: content.split('\n').length,
            },
          };
        }
        
        return null;
      }

      // Get original and modified file content
      let originalContent = '';
      let modifiedContent = '';

      try {
        // Try to get original content from Git
        originalContent = await git.show([`${base}:${filePath}`]);
      } catch {
        // File might not exist in base (new file)
        originalContent = '';
      }

      try {
        // Get current working directory content
        const fs = await import('fs/promises');
        const path = await import('path');
        const fullPath = path.join(repoPath, filePath);
        modifiedContent = await fs.readFile(fullPath, 'utf-8');
      } catch {
        // File might be deleted
        modifiedContent = '';
      }

      // Parse diff statistics
      const stats = this.parseDiffStats(diff);

      return {
        path: filePath,
        originalContent,
        modifiedContent,
        diff,
        stats,
      };
    } catch (error) {
      console.error('Error getting file diff:', error);
      return null;
    }
  }

  /**
   * Get diff between two commits or branches
   * @param repoPath - Path to the Git repository
   * @param from - Source commit/branch
   * @param to - Target commit/branch (default: working directory)
   * @param filePath - Optional: specific file to diff
   * @param options - Diff options
   * @returns Diff content
   */
  async getDiff(
    repoPath: string,
    from: string,
    to?: string,
    filePath?: string,
    options: DiffOptions = {}
  ): Promise<string> {
    try {
      const git = await getSimpleGit(repoPath);
      const contextLines = options.contextLines || 3;

      const diffArgs = [
        from,
        to || 'HEAD',
        `-U${contextLines}`,
      ];

      if (options.ignoreWhitespace) {
        diffArgs.push('-w');
      }

      if (filePath) {
        diffArgs.push('--', filePath);
      }

      const diff = await git.diff(diffArgs);
      return diff || '';
    } catch (error) {
      console.error('Error getting diff:', error);
      return '';
    }
  }

  /**
   * Get diff statistics (files changed, insertions, deletions)
   * @param repoPath - Path to the Git repository
   * @param from - Source commit/branch
   * @param to - Target commit/branch (default: HEAD)
   * @returns Diff statistics
   */
  async getDiffStats(
    repoPath: string,
    from: string,
    to: string = 'HEAD'
  ): Promise<DiffStats> {
    try {
      const git = await getSimpleGit(repoPath);
      const summary = await git.diffSummary([from, to]);

      const files: Array<{ path: string; insertions: number; deletions: number }> = [];
      
      for (const file of summary.files) {
        if ('insertions' in file && 'deletions' in file && typeof file.insertions === 'number' && typeof file.deletions === 'number') {
          files.push({
            path: file.file,
            insertions: file.insertions,
            deletions: file.deletions,
          });
        }
      }

      const totalInsertions = typeof summary.insertions === 'object' && summary.insertions && 'total' in summary.insertions
        ? (summary.insertions as { total: number }).total
        : (typeof summary.insertions === 'number' ? summary.insertions : 0);
      
      const totalDeletions = typeof summary.deletions === 'object' && summary.deletions && 'total' in summary.deletions
        ? (summary.deletions as { total: number }).total
        : (typeof summary.deletions === 'number' ? summary.deletions : 0);

      return {
        files,
        totalInsertions,
        totalDeletions,
        totalFiles: summary.files.length,
      };
    } catch (error) {
      console.error('Error getting diff stats:', error);
      return {
        files: [],
        totalInsertions: 0,
        totalDeletions: 0,
        totalFiles: 0,
      };
    }
  }

  /**
   * Get list of changed files with their status
   * @param repoPath - Path to the Git repository
   * @param base - Base commit/branch (default: HEAD)
   * @returns List of changed files
   */
  async getChangedFiles(
    repoPath: string,
    base: string = 'HEAD'
  ): Promise<Array<{ path: string; status: 'modified' | 'added' | 'deleted' | 'renamed' }>> {
    try {
      const git = await getSimpleGit(repoPath);
      const status = await git.status();
      
      // Get files changed since base
      const diffSummary = await git.diffSummary([base, 'HEAD']);
      
      const files: Array<{ path: string; status: 'modified' | 'added' | 'deleted' | 'renamed' }> = [];
      
      for (const file of diffSummary.files) {
        let status: 'modified' | 'added' | 'deleted' | 'renamed' = 'modified';
        
        if ('insertions' in file && 'deletions' in file) {
          if (file.insertions > 0 && file.deletions === 0) {
            status = 'added';
          } else if (file.insertions === 0 && file.deletions > 0) {
            status = 'deleted';
          } else if ('binary' in file && file.binary) {
            status = 'modified';
          }
        }
        
        files.push({
          path: file.file,
          status,
        });
      }

      // Also include working directory changes
      for (const file of status.files) {
        if (!files.find(f => f.path === file.path)) {
          files.push({
            path: file.path,
            status: file.working_dir as 'modified' | 'added' | 'deleted' | 'renamed',
          });
        }
      }

      return files;
    } catch (error) {
      console.error('Error getting changed files:', error);
      return [];
    }
  }

  /**
   * Parse diff statistics from diff output
   * @param diff - Diff content
   * @returns Statistics object
   */
  private parseDiffStats(diff: string): { insertions: number; deletions: number; linesChanged: number } {
    let insertions = 0;
    let deletions = 0;

    const lines = diff.split('\n');
    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        insertions++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        deletions++;
      }
    }

    return {
      insertions,
      deletions,
      linesChanged: insertions + deletions,
    };
  }
}

export const gitDiffService = GitDiffService.getInstance();

