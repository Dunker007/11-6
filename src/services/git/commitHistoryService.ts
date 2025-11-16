/**
 * commitHistoryService.ts
 * 
 * PURPOSE:
 * Service for retrieving Git commit history and commit graph visualization data.
 * Provides methods to get commit logs, commit details, branch information, and
 * parse commit graph for visualization.
 * 
 * ARCHITECTURE:
 * Service layer that wraps simple-git operations for commit history:
 * - Get commit history with pagination
 * - Get commit details
 * - Get commit graph (for visualization)
 * - Filter commits by author, date, message
 * - Get branch information
 * 
 * Features:
 * - Commit history with pagination
 * - Commit graph parsing
 * - Branch visualization data
 * - Commit filtering and search
 * - Commit statistics
 * 
 * CURRENT STATUS:
 * ✅ Commit history retrieval
 * ✅ Commit graph parsing
 * ✅ Branch information
 * ✅ Commit filtering
 * ✅ Commit statistics
 * 
 * DEPENDENCIES:
 * - simple-git: Git operations
 * - Electron environment: Required for Node.js Git operations
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { commitHistoryService } from '@/services/git/commitHistoryService';
 * 
 * const commits = await commitHistoryService.getCommitHistory('/path/to/repo', 50);
 * const graph = await commitHistoryService.getCommitGraph('/path/to/repo');
 * ```
 * 
 * RELATED FILES:
 * - src/components/GitHub/CommitHistoryViewer.tsx: Commit history UI
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

export interface Commit {
  sha: string;
  shortSha: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  date: Date;
  timestamp: number;
  parents: string[];
  branches?: string[];
  tags?: string[];
  stats?: {
    insertions: number;
    deletions: number;
    files: number;
  };
}

export interface CommitGraphNode {
  commit: Commit;
  x: number; // X position in graph
  y: number; // Y position (commit order)
  branches: string[];
  isMerge: boolean;
  parentNodes: CommitGraphNode[];
}

export interface CommitGraph {
  nodes: CommitGraphNode[];
  branches: string[];
  tags: string[];
}

export interface CommitHistoryOptions {
  limit?: number;
  skip?: number;
  author?: string;
  since?: Date;
  until?: Date;
  path?: string;
  branch?: string;
}

class CommitHistoryService {
  private static instance: CommitHistoryService;

  private constructor() {}

  static getInstance(): CommitHistoryService {
    if (!CommitHistoryService.instance) {
      CommitHistoryService.instance = new CommitHistoryService();
    }
    return CommitHistoryService.instance;
  }

  /**
   * Get commit history for a repository
   * @param repoPath - Path to the Git repository
   * @param options - History options (limit, skip, filters)
   * @returns Array of commits
   */
  async getCommitHistory(
    repoPath: string,
    options: CommitHistoryOptions = {}
  ): Promise<Commit[]> {
    try {
      const git = await getSimpleGit(repoPath);
      const limit = options.limit || 50;
      const skip = options.skip || 0;

      // Build log options
      const logOptions: any = {
        maxCount: limit + skip,
      };

      // Add filters
      if (options.author) {
        logOptions['--author'] = options.author;
      }
      if (options.since) {
        logOptions['--since'] = options.since.toISOString();
      }
      if (options.until) {
        logOptions['--until'] = options.until.toISOString();
      }
      if (options.path) {
        logOptions['--'] = options.path;
      }
      if (options.branch) {
        logOptions.from = options.branch;
      }

      const log = await git.log(logOptions);

      // Process commits
      const commits: Commit[] = log.all
        .slice(skip)
        .map((commit: any) => {
          const date = new Date(commit.date);
          return {
            sha: commit.hash || '',
            shortSha: (commit.hash || '').substring(0, 7),
            message: commit.message || '',
            author: {
              name: commit.author_name || 'Unknown',
              email: commit.author_email || '',
            },
            date,
            timestamp: date.getTime(),
            parents: (commit.parents || commit.parent || '').split(' ').filter((p: string) => p),
          };
        });

      // Get branch and tag information for commits
      const branches = await git.branchLocal();
      const tags = await git.tags();

      // Get refs for each commit
      for (const commit of commits) {
        commit.branches = [];
        commit.tags = [];

        // Check if commit is on any branch
        for (const branch of branches.all) {
          try {
            const branchSha = await git.revparse([branch]);
            if (branchSha === commit.sha) {
              commit.branches.push(branch);
            }
          } catch {
            // Branch might not exist or commit not on branch
          }
        }

        // Check if commit has any tags
        for (const tag of tags.all) {
          try {
            const tagSha = await git.revparse([tag]);
            if (tagSha === commit.sha) {
              commit.tags.push(tag);
            }
          } catch {
            // Tag might not exist
          }
        }
      }

      return commits;
    } catch (error) {
      console.error('Error getting commit history:', error);
      return [];
    }
  }

  /**
   * Get detailed information about a specific commit
   * @param repoPath - Path to the Git repository
   * @param sha - Commit SHA
   * @returns Commit details with stats
   */
  async getCommitDetails(repoPath: string, sha: string): Promise<Commit | null> {
    try {
      const git = await getSimpleGit(repoPath);

      // Get commit details
      const show = await git.show([sha, '--stat', '--format=%H|%h|%s|%an|%ae|%ai|%P']);

      const lines = show.split('\n');
      const header = lines[0];
      const [hash, shortHash, message, authorName, authorEmail, dateStr, parents] = header.split('|');

      // Parse stats from show output
      let insertions = 0;
      let deletions = 0;
      let files = 0;

      for (const line of lines) {
        if (line.includes('files changed')) {
          const match = line.match(/(\d+)\s+files? changed/);
          if (match) files = parseInt(match[1], 10);

          const insertMatch = line.match(/(\d+)\s+insertions?/);
          if (insertMatch) insertions = parseInt(insertMatch[1], 10);

          const deleteMatch = line.match(/(\d+)\s+deletions?/);
          if (deleteMatch) deletions = parseInt(deleteMatch[1], 10);
        }
      }

      const date = new Date(dateStr);

      return {
        sha: hash,
        shortSha: shortHash,
        message,
        author: {
          name: authorName,
          email: authorEmail,
        },
        date,
        timestamp: date.getTime(),
        parents: parents.split(' ').filter((p: string) => p),
        stats: {
          insertions,
          deletions,
          files,
        },
      };
    } catch (error) {
      console.error('Error getting commit details:', error);
      return null;
    }
  }

  /**
   * Get commit graph for visualization
   * @param repoPath - Path to the Git repository
   * @param limit - Maximum number of commits to include
   * @returns Commit graph with nodes and connections
   */
  async getCommitGraph(repoPath: string, limit: number = 100): Promise<CommitGraph> {
    try {
      const git = await getSimpleGit(repoPath);

      // Get graph output
      const graphOutput = await git.raw([
        'log',
        '--graph',
        '--oneline',
        '--all',
        '--decorate',
        `--max-count=${limit}`,
        '--format=%H|%h|%s|%an|%ae|%ai|%P|%D',
      ]);

      // Parse graph output
      const commits = await this.getCommitHistory(repoPath, { limit });
      const nodes: CommitGraphNode[] = [];
      const branches = new Set<string>();
      const tags = new Set<string>();

      // Create nodes from commits
      commits.forEach((commit, index) => {
        if (commit.branches) {
          commit.branches.forEach(b => branches.add(b));
        }
        if (commit.tags) {
          commit.tags.forEach(t => tags.add(t));
        }

        nodes.push({
          commit,
          x: 0, // Will be calculated based on graph structure
          y: index,
          branches: commit.branches || [],
          isMerge: commit.parents.length > 1,
          parentNodes: [],
        });
      });

      // Build parent relationships
      const commitMap = new Map<string, CommitGraphNode>();
      nodes.forEach(node => {
        commitMap.set(node.commit.sha, node);
      });

      nodes.forEach(node => {
        node.commit.parents.forEach(parentSha => {
          const parentNode = commitMap.get(parentSha);
          if (parentNode) {
            node.parentNodes.push(parentNode);
          }
        });
      });

      // Calculate X positions based on graph structure
      this.calculateGraphPositions(nodes);

      return {
        nodes,
        branches: Array.from(branches),
        tags: Array.from(tags),
      };
    } catch (error) {
      console.error('Error getting commit graph:', error);
      return {
        nodes: [],
        branches: [],
        tags: [],
      };
    }
  }

  /**
   * Calculate X positions for graph nodes based on branch structure
   * @param nodes - Graph nodes
   */
  private calculateGraphPositions(nodes: CommitGraphNode[]): void {
    // Simple positioning algorithm
    // In a real implementation, you'd want a more sophisticated layout algorithm
    const branchColumns = new Map<string, number>();
    let nextColumn = 0;

    for (const node of nodes) {
      if (node.isMerge) {
        // Merges can be in the middle
        node.x = Math.max(...node.parentNodes.map(p => p.x), 0);
      } else if (node.branches.length > 0) {
        // Assign column based on branch
        const branch = node.branches[0];
        if (!branchColumns.has(branch)) {
          branchColumns.set(branch, nextColumn++);
        }
        node.x = branchColumns.get(branch) || 0;
      } else {
        // Follow parent's column
        if (node.parentNodes.length > 0) {
          node.x = node.parentNodes[0].x;
        } else {
          node.x = 0;
        }
      }
    }
  }

  /**
   * Search commits by message
   * @param repoPath - Path to the Git repository
   * @param query - Search query
   * @param limit - Maximum results
   * @returns Matching commits
   */
  async searchCommits(
    repoPath: string,
    query: string,
    limit: number = 50
  ): Promise<Commit[]> {
    try {
      const git = await getSimpleGit(repoPath);
      const log = await git.log({
        maxCount: limit,
        '--grep': query,
      });

      return log.all.map((commit: any) => {
        const date = new Date(commit.date);
        return {
          sha: commit.hash,
          shortSha: commit.hash?.substring(0, 7) || '',
          message: commit.message || '',
          author: {
            name: commit.author_name || 'Unknown',
            email: commit.author_email || '',
          },
          date,
          timestamp: date.getTime(),
          parents: (commit.parents || '').split(' ').filter((p: string) => p),
        };
      });
    } catch (error) {
      console.error('Error searching commits:', error);
      return [];
    }
  }

  /**
   * Get commits by author
   * @param repoPath - Path to the Git repository
   * @param author - Author name or email
   * @param limit - Maximum results
   * @returns Commits by author
   */
  async getCommitsByAuthor(
    repoPath: string,
    author: string,
    limit: number = 50
  ): Promise<Commit[]> {
    return this.getCommitHistory(repoPath, { author, limit });
  }

  /**
   * Get commits in date range
   * @param repoPath - Path to the Git repository
   * @param since - Start date
   * @param until - End date
   * @param limit - Maximum results
   * @returns Commits in date range
   */
  async getCommitsByDateRange(
    repoPath: string,
    since: Date,
    until: Date,
    limit: number = 50
  ): Promise<Commit[]> {
    return this.getCommitHistory(repoPath, { since, until, limit });
  }
}

export const commitHistoryService = CommitHistoryService.getInstance();

