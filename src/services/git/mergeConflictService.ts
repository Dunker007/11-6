/**
 * mergeConflictService.ts
 * 
 * PURPOSE:
 * Service for detecting and resolving Git merge conflicts. Provides methods
 * to get conflict information, parse conflict markers, and resolve conflicts.
 * 
 * ARCHITECTURE:
 * Service layer that wraps simple-git operations for conflict resolution:
 * - Detect conflicts
 * - Parse conflict markers
 * - Resolve conflicts (ours, theirs, manual)
 * - Get conflict details
 * 
 * Features:
 * - Conflict detection
 * - Conflict parsing
 * - Resolution options (ours, theirs, manual)
 * - Conflict file listing
 * 
 * CURRENT STATUS:
 * ✅ Conflict detection
 * ✅ Conflict parsing
 * ✅ Resolution methods
 * 
 * DEPENDENCIES:
 * - simple-git: Git operations
 * - Electron environment: Required for Node.js Git operations
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { mergeConflictService } from '@/services/git/mergeConflictService';
 * 
 * const conflicts = await mergeConflictService.getConflicts('/path/to/repo');
 * await mergeConflictService.resolveConflict('/path/to/repo', 'file.ts', 'ours');
 * ```
 */

// Dynamic import helper for simple-git (Node.js only, not available in browser)
async function getSimpleGit(path?: string) {
  try {
    if (typeof window !== 'undefined' && !(window as any).electron) {
      throw new Error('Git operations are only available in Electron environment');
    }
    const simpleGit = (await import('simple-git')).default;
    return path ? simpleGit(path) : simpleGit();
  } catch (error) {
    throw new Error(`Failed to load git: ${(error as Error).message}`);
  }
}

export interface ConflictSection {
  type: 'ours' | 'theirs' | 'base';
  content: string;
  startLine: number;
  endLine: number;
}

export interface ConflictMarker {
  startLine: number;
  endLine: number;
  ours: ConflictSection;
  theirs: ConflictSection;
  base?: ConflictSection;
}

export interface ConflictFile {
  path: string;
  conflicts: ConflictMarker[];
  content: string;
  resolved: boolean;
}

class MergeConflictService {
  private static instance: MergeConflictService;

  private constructor() {}

  static getInstance(): MergeConflictService {
    if (!MergeConflictService.instance) {
      MergeConflictService.instance = new MergeConflictService();
    }
    return MergeConflictService.instance;
  }

  /**
   * Get all conflicted files
   */
  async getConflicts(repoPath: string): Promise<ConflictFile[]> {
    try {
      const git = await getSimpleGit(repoPath);
      const status = await git.status();
      
      const conflictFiles: ConflictFile[] = [];

      for (const file of status.conflicted) {
        const conflictFile = await this.parseConflictFile(repoPath, file);
        if (conflictFile) {
          conflictFiles.push(conflictFile);
        }
      }

      return conflictFiles;
    } catch (error) {
      console.error('Error getting conflicts:', error);
      return [];
    }
  }

  /**
   * Parse conflict markers from file content
   */
  private async parseConflictFile(repoPath: string, filePath: string): Promise<ConflictFile | null> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const fullPath = path.join(repoPath, filePath);
      const content = await fs.readFile(fullPath, 'utf-8');

      const conflicts = this.parseConflictMarkers(content);

      return {
        path: filePath,
        conflicts,
        content,
        resolved: conflicts.length === 0,
      };
    } catch (error) {
      console.error(`Error parsing conflict file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Parse conflict markers from content
   */
  private parseConflictMarkers(content: string): ConflictMarker[] {
    const conflicts: ConflictMarker[] = [];
    const lines = content.split('\n');

    let currentConflict: Partial<ConflictMarker> | null = null;
    let currentSection: 'ours' | 'theirs' | 'base' | null = null;
    let lineNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      lineNumber = i + 1;
      const line = lines[i];

      // Check for conflict start markers
      if (line.startsWith('<<<<<<<')) {
        currentConflict = {
          startLine: lineNumber,
          ours: {
            type: 'ours',
            content: '',
            startLine: lineNumber,
            endLine: lineNumber,
          },
        };
        currentSection = 'ours';
        continue;
      }

      // Check for separator (base, if present)
      if (line.startsWith('|||||||')) {
        if (currentConflict) {
          currentConflict.base = {
            type: 'base',
            content: '',
            startLine: lineNumber,
            endLine: lineNumber,
          };
          currentSection = 'base';
        }
        continue;
      }

      // Check for separator (ours/theirs)
      if (line.startsWith('=======')) {
        if (currentConflict) {
          currentConflict.theirs = {
            type: 'theirs',
            content: '',
            startLine: lineNumber,
            endLine: lineNumber,
          };
          currentSection = 'theirs';
        }
        continue;
      }

      // Check for conflict end marker
      if (line.startsWith('>>>>>>>')) {
        if (currentConflict && currentConflict.ours && currentConflict.theirs) {
          currentConflict.endLine = lineNumber;
          currentConflict.ours.endLine = lineNumber - 1;
          if (currentConflict.theirs) {
            currentConflict.theirs.endLine = lineNumber - 1;
          }
          conflicts.push(currentConflict as ConflictMarker);
        }
        currentConflict = null;
        currentSection = null;
        continue;
      }

      // Add line to current section
      if (currentConflict && currentSection) {
        if (currentSection === 'ours' && currentConflict.ours) {
          currentConflict.ours.content += (currentConflict.ours.content ? '\n' : '') + line;
        } else if (currentSection === 'theirs' && currentConflict.theirs) {
          currentConflict.theirs.content += (currentConflict.theirs.content ? '\n' : '') + line;
        } else if (currentSection === 'base' && currentConflict.base) {
          currentConflict.base.content += (currentConflict.base.content ? '\n' : '') + line;
        }
      }
    }

    return conflicts;
  }

  /**
   * Resolve a conflict by accepting ours
   */
  async resolveOurs(repoPath: string, filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const git = await getSimpleGit(repoPath);
      await git.checkout(['--ours', filePath]);
      await git.add(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Resolve a conflict by accepting theirs
   */
  async resolveTheirs(repoPath: string, filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const git = await getSimpleGit(repoPath);
      await git.checkout(['--theirs', filePath]);
      await git.add(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Resolve a conflict manually with custom content
   */
  async resolveManual(
    repoPath: string,
    filePath: string,
    content: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const fullPath = path.join(repoPath, filePath);
      
      await fs.writeFile(fullPath, content, 'utf-8');
      
      const git = await getSimpleGit(repoPath);
      await git.add(filePath);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get base version of a conflicted file
   */
  async getBaseVersion(repoPath: string, filePath: string): Promise<string | null> {
    try {
      const git = await getSimpleGit(repoPath);
      const baseContent = await git.show([`:2:${filePath}`]);
      return baseContent || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get our version of a conflicted file
   */
  async getOursVersion(repoPath: string, filePath: string): Promise<string | null> {
    try {
      const git = await getSimpleGit(repoPath);
      const oursContent = await git.show([`:2:${filePath}`]);
      return oursContent || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get their version of a conflicted file
   */
  async getTheirsVersion(repoPath: string, filePath: string): Promise<string | null> {
    try {
      const git = await getSimpleGit(repoPath);
      const theirsContent = await git.show([`:3:${filePath}`]);
      return theirsContent || null;
    } catch (error) {
      return null;
    }
  }
}

export const mergeConflictService = MergeConflictService.getInstance();

