import { create } from 'zustand';
import { githubService, type Repository, type Branch, type PullRequest, type GitStatus } from './githubService';
import { withAsyncOperation } from '@/utils/storeHelpers';

interface GitHubStore {
  // State
  isAuthenticated: boolean;
  repositories: Repository[];
  currentRepository: Repository | null;
  branches: Branch[];
  pullRequests: PullRequest[];
  status: GitStatus | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  authenticate: (token: string) => Promise<boolean>;
  loadRepositories: () => Promise<void>;
  setCurrentRepository: (repo: Repository | null) => void;
  cloneRepository: (url: string, path: string) => Promise<boolean>;
  initRepository: (path: string) => Promise<boolean>;
  getStatus: (path: string) => Promise<GitStatus | null>;
  commit: (path: string, message: string, files?: string[]) => Promise<boolean>;
  push: (path: string, remote?: string, branch?: string) => Promise<boolean>;
  pull: (path: string, remote?: string, branch?: string) => Promise<boolean>;
  createBranch: (path: string, name: string) => Promise<boolean>;
  checkoutBranch: (path: string, name: string) => Promise<boolean>;
  loadBranches: (path: string) => Promise<void>;
  createPullRequest: (owner: string, repo: string, title: string, body: string, base: string, head: string) => Promise<PullRequest | null>;
  mergePullRequest: (owner: string, repo: string, prNumber: number, method?: 'merge' | 'squash' | 'rebase') => Promise<boolean>;
}

export const useGitHubStore = create<GitHubStore>((set, get) => ({
  isAuthenticated: false,
  repositories: [],
  currentRepository: null,
  branches: [],
  pullRequests: [],
  status: null,
  isLoading: false,
  error: null,

  authenticate: async (token: string) => {
    const result = await withAsyncOperation(
      async () => {
        const success = await githubService.authenticate(token);
        set({ isAuthenticated: success });
        if (success) {
          await get().loadRepositories();
        }
        return success;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'githubStore'
    );
    return result ?? false;
  },

  loadRepositories: async () => {
    await withAsyncOperation(
      async () => {
        const repos = await githubService.getRepositories();
        set({ repositories: repos });
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'githubStore'
    );
  },

  setCurrentRepository: (repo: Repository | null) => {
    set({ currentRepository: repo });
  },

  cloneRepository: async (url: string, path: string) => {
    const result = await withAsyncOperation(
      async () => {
        const cloneResult = await githubService.cloneRepository(url, path);
        if (!cloneResult.success) {
          throw new Error(cloneResult.error || 'Failed to clone repository');
        }
        return cloneResult.success;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'githubStore'
    );
    return result ?? false;
  },

  initRepository: async (path: string) => {
    const result = await withAsyncOperation(
      async () => {
        const initResult = await githubService.initRepository(path);
        if (!initResult.success) {
          throw new Error(initResult.error || 'Failed to initialize repository');
        }
        return initResult.success;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'githubStore'
    );
    return result ?? false;
  },

  getStatus: async (path: string): Promise<GitStatus | null> => {
    return await withAsyncOperation(
      async () => {
        const status = await githubService.getStatus(path);
        set({ status });
        return status;
      },
      (errorMessage) => set({ error: errorMessage }),
      undefined,
      undefined,
      false, // Don't set loading state for status checks
      'runtime',
      'githubStore'
    );
  },

  commit: async (path: string, message: string, files?: string[]) => {
    const result = await withAsyncOperation(
      async () => {
        const commitResult = await githubService.commit(path, message, files);
        if (commitResult.success) {
          await get().getStatus(path);
        } else {
          throw new Error(commitResult.error || 'Failed to commit');
        }
        return commitResult.success;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'githubStore'
    );
    return result ?? false;
  },

  push: async (path: string, remote = 'origin', branch?: string) => {
    const result = await withAsyncOperation(
      async () => {
        const pushResult = await githubService.push(path, remote, branch);
        if (!pushResult.success) {
          throw new Error(pushResult.error || 'Failed to push');
        }
        return pushResult.success;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'githubStore'
    );
    return result ?? false;
  },

  pull: async (path: string, remote = 'origin', branch?: string) => {
    const result = await withAsyncOperation(
      async () => {
        const pullResult = await githubService.pull(path, remote, branch);
        if (!pullResult.success) {
          throw new Error(pullResult.error || 'Failed to pull');
        }
        return pullResult.success;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'githubStore'
    );
    return result ?? false;
  },

  createBranch: async (path: string, name: string) => {
    const result = await withAsyncOperation(
      async () => {
        const branchResult = await githubService.createBranch(path, name);
        if (branchResult.success) {
          await get().loadBranches(path);
        } else {
          throw new Error(branchResult.error || 'Failed to create branch');
        }
        return branchResult.success;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'githubStore'
    );
    return result ?? false;
  },

  checkoutBranch: async (path: string, name: string) => {
    const result = await withAsyncOperation(
      async () => {
        const checkoutResult = await githubService.checkoutBranch(path, name);
        if (checkoutResult.success) {
          await get().getStatus(path);
          await get().loadBranches(path);
        } else {
          throw new Error(checkoutResult.error || 'Failed to checkout branch');
        }
        return checkoutResult.success;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'githubStore'
    );
    return result ?? false;
  },

  loadBranches: async (path: string) => {
    await withAsyncOperation(
      async () => {
        const branches = await githubService.getBranches(path);
        set({ branches });
      },
      (errorMessage) => set({ error: errorMessage }),
      undefined,
      undefined,
      false, // Don't set loading state for branch loading
      'runtime',
      'githubStore'
    );
  },

  createPullRequest: async (owner: string, repo: string, title: string, body: string, base: string, head: string) => {
    return await withAsyncOperation(
      async () => {
        const prResult = await githubService.createPullRequest(owner, repo, title, body, base, head);
        if (prResult.success && prResult.pr) {
          set((state) => ({
            pullRequests: [...state.pullRequests, prResult.pr!],
          }));
          return prResult.pr;
        }
        throw new Error(prResult.error || 'Failed to create pull request');
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'githubStore'
    );
  },

  mergePullRequest: async (owner: string, repo: string, prNumber: number, method: 'merge' | 'squash' | 'rebase' = 'merge') => {
    const result = await withAsyncOperation(
      async () => {
        const mergeResult = await githubService.mergePullRequest(owner, repo, prNumber, method);
        if (mergeResult.success) {
          set((state) => ({
            pullRequests: state.pullRequests.map((pr) =>
              pr.number === prNumber ? { ...pr, state: 'merged' as const } : pr
            ),
          }));
        } else {
          throw new Error(mergeResult.error || 'Failed to merge pull request');
        }
        return mergeResult.success;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'githubStore'
    );
    return result ?? false;
  },
}));

