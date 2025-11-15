import { Octokit } from '@octokit/rest';
import { apiKeyService } from '@/services/apiKeys/apiKeyService';

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

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description?: string;
  private: boolean;
  url: string;
  cloneUrl: string;
  defaultBranch: string;
  updatedAt: string;
}

export interface Branch {
  name: string;
  sha: string;
  protected: boolean;
}

export interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed' | 'merged';
  author: string;
  base: string;
  head: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitStatus {
  current: string;
  branch: string;
  ahead: number;
  behind: number;
  files: {
    path: string;
    status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
  }[];
}

export class GitHubService {
  private static instance: GitHubService;
  private octokit: Octokit | null = null;

  private constructor() {
    this.initializeGitHub();
  }

  static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  private initializeGitHub(): void {
    const token = apiKeyService.getKeyForProvider('github');
    if (token) {
      this.octokit = new Octokit({ auth: token });
    }
  }

  async authenticate(token: string): Promise<boolean> {
    try {
      this.octokit = new Octokit({ auth: token });
      await this.octokit.users.getAuthenticated();
      await apiKeyService.addKey('github', token, 'GitHub Token');
      return true;
    } catch (error) {
      return false;
    }
  }

  async getRepositories(): Promise<Repository[]> {
    if (!this.octokit) {
      throw new Error('GitHub not authenticated');
    }

    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    });

    return data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner.login,
      description: repo.description || undefined,
      private: repo.private,
      url: repo.html_url,
      cloneUrl: repo.clone_url,
      defaultBranch: repo.default_branch,
      updatedAt: repo.updated_at || new Date().toISOString(),
    }));
  }

  async cloneRepository(url: string, path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const git = await getSimpleGit();
      await git.clone(url, path);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async initRepository(path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const git = await getSimpleGit(path);
      await git.init();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getStatus(path: string): Promise<GitStatus | null> {
    try {
      const git = await getSimpleGit(path);
      const status = await git.status();
      const branch = await git.revparse(['--abbrev-ref', 'HEAD']);

      return {
        current: branch,
        branch: branch,
        ahead: status.ahead,
        behind: status.behind,
        files: status.files.map((file) => ({
          path: file.path,
          status: file.working_dir as GitStatus['files'][0]['status'],
        })),
      };
    } catch (error) {
      return null;
    }
  }

  async commit(path: string, message: string, files?: string[]): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
      const git = await getSimpleGit(path);
      
      if (files && files.length > 0) {
        await git.add(files);
      } else {
        await git.add('.');
      }

      const commit = await git.commit(message);
      return { success: true, hash: commit.commit };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async push(path: string, remote = 'origin', branch?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const git = await getSimpleGit(path);
      const currentBranch = branch || (await git.revparse(['--abbrev-ref', 'HEAD']));
      await git.push(remote, currentBranch);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async pull(path: string, remote = 'origin', branch?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const git = await getSimpleGit(path);
      await git.pull(remote, branch);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async createBranch(path: string, name: string): Promise<{ success: boolean; error?: string }> {
    try {
      const git = await getSimpleGit(path);
      await git.checkoutLocalBranch(name);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async checkoutBranch(path: string, name: string): Promise<{ success: boolean; error?: string }> {
    try {
      const git = await getSimpleGit(path);
      await git.checkout(name);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getBranches(path: string): Promise<Branch[]> {
    try {
      const git = await getSimpleGit(path);
      const branches = await git.branchLocal();
      return branches.all.map((name) => ({
        name,
        sha: '', // Would need to fetch this separately
        protected: false,
      }));
    } catch (error) {
      return [];
    }
  }

  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    body: string,
    base: string,
    head: string
  ): Promise<{ success: boolean; pr?: PullRequest; error?: string }> {
    if (!this.octokit) {
      throw new Error('GitHub not authenticated');
    }

    try {
      const { data } = await this.octokit.pulls.create({
        owner,
        repo,
        title,
        body,
        base,
        head,
      });

      return {
        success: true,
        pr: {
          id: data.id,
          number: data.number,
          title: data.title,
          body: data.body || undefined,
          state: data.state as PullRequest['state'],
          author: data.user.login,
          base: data.base.ref,
          head: data.head.ref,
          url: data.html_url,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async mergePullRequest(
    owner: string,
    repo: string,
    prNumber: number,
    method: 'merge' | 'squash' | 'rebase' = 'merge'
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.octokit) {
      throw new Error('GitHub not authenticated');
    }

    try {
      await this.octokit.pulls.merge({
        owner,
        repo,
        pull_number: prNumber,
        merge_method: method,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async generateCommitMessage(files: string[]): Promise<string> {
    // This would use AI to generate commit messages
    // For now, return a simple message
    return `Update ${files.length} file${files.length > 1 ? 's' : ''}`;
  }

  /**
   * Suggest a commit message based on changed files
   */
  async suggestCommitMessage(files: string[]): Promise<string> {
    if (files.length === 0) {
      return 'Update files';
    }

    // Analyze file changes to suggest a message
    const added = files.filter(f => f.includes('new') || f.includes('add')).length;
    const modified = files.length - added;

    if (added > 0 && modified === 0) {
      return `Add ${added} file${added > 1 ? 's' : ''}`;
    } else if (modified > 0 && added === 0) {
      return `Update ${modified} file${modified > 1 ? 's' : ''}`;
    } else {
      return `Update ${files.length} file${files.length > 1 ? 's' : ''}`;
    }
  }

  /**
   * Auto-commit all changes with a generated message
   */
  async autoCommit(path: string, message?: string): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
      const git = await getSimpleGit(path);
      await git.add('.');

      if (!message) {
        const status = await git.status();
        const files = status.files.map(f => f.path);
        message = await this.suggestCommitMessage(files);
      }

      const commit = await git.commit(message);
      return { success: true, hash: commit.commit };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Smart sync: pull then push with conflict detection
   */
  async smartSync(path: string, remote = 'origin'): Promise<{ success: boolean; error?: string; hasConflicts?: boolean }> {
    try {
      const git = await getSimpleGit(path);
      
      // Check if there are uncommitted changes
      const status = await git.status();
      if (status.files.length > 0) {
        return { success: false, error: 'Please commit or stash your changes before syncing' };
      }

      // Pull first
      try {
        await git.pull(remote);
      } catch (pullError) {
        // Check for conflicts
        const pullStatus = await git.status();
        if (pullStatus.conflicted.length > 0) {
          return { success: false, error: 'Merge conflicts detected. Please resolve them manually.', hasConflicts: true };
        }
        throw pullError;
      }

      // Push after successful pull
      const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
      await git.push(remote, currentBranch);

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Detect Git state and suggest next actions
   */
  async detectGitState(path: string): Promise<{ state: 'clean' | 'dirty' | 'conflicts' | 'ahead' | 'behind'; suggestedActions: string[] }> {
    try {
      const git = await getSimpleGit(path);
      const status = await git.status();

      const suggestedActions: string[] = [];

      if (status.conflicted.length > 0) {
        return {
          state: 'conflicts',
          suggestedActions: ['Resolve merge conflicts', 'Commit resolved files', 'Push changes'],
        };
      }

      if (status.files.length > 0) {
        suggestedActions.push('Commit changes', 'Review changes');
        return {
          state: 'dirty',
          suggestedActions,
        };
      }

      if (status.ahead > 0) {
        suggestedActions.push('Push changes');
      }

      if (status.behind > 0) {
        suggestedActions.push('Pull changes');
      }

      if (status.ahead > 0 && status.behind > 0) {
        suggestedActions.push('Sync with remote (pull then push)');
      }

      return {
        state: status.ahead > 0 ? 'ahead' : status.behind > 0 ? 'behind' : 'clean',
        suggestedActions: suggestedActions.length > 0 ? suggestedActions : ['Repository is up to date'],
      };
    } catch (error) {
      return {
        state: 'clean',
        suggestedActions: ['Initialize repository', 'Connect to remote'],
      };
    }
  }
}

export const githubService = GitHubService.getInstance();

