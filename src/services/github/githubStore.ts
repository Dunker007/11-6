import { create } from 'zustand';
import { githubService, type Repository, type Branch, type PullRequest, type GitStatus } from './githubService';

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
  getStatus: (path: string) => Promise<void>;
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
    set({ isLoading: true, error: null });
    try {
      const success = await githubService.authenticate(token);
      set({ isAuthenticated: success, isLoading: false });
      if (success) {
        await get().loadRepositories();
      }
      return success;
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      return false;
    }
  },

  loadRepositories: async () => {
    set({ isLoading: true, error: null });
    try {
      const repos = await githubService.getRepositories();
      set({ repositories: repos, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
    }
  },

  setCurrentRepository: (repo: Repository | null) => {
    set({ currentRepository: repo });
  },

  cloneRepository: async (url: string, path: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await githubService.cloneRepository(url, path);
      set({ isLoading: false });
      if (!result.success) {
        set({ error: result.error });
      }
      return result.success;
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      return false;
    }
  },

  initRepository: async (path: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await githubService.initRepository(path);
      set({ isLoading: false });
      if (!result.success) {
        set({ error: result.error });
      }
      return result.success;
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      return false;
    }
  },

  getStatus: async (path: string) => {
    try {
      const status = await githubService.getStatus(path);
      set({ status });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  commit: async (path: string, message: string, files?: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const result = await githubService.commit(path, message, files);
      set({ isLoading: false });
      if (result.success) {
        await get().getStatus(path);
      } else {
        set({ error: result.error });
      }
      return result.success;
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      return false;
    }
  },

  push: async (path: string, remote = 'origin', branch?: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await githubService.push(path, remote, branch);
      set({ isLoading: false });
      if (!result.success) {
        set({ error: result.error });
      }
      return result.success;
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      return false;
    }
  },

  pull: async (path: string, remote = 'origin', branch?: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await githubService.pull(path, remote, branch);
      set({ isLoading: false });
      if (!result.success) {
        set({ error: result.error });
      }
      return result.success;
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      return false;
    }
  },

  createBranch: async (path: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await githubService.createBranch(path, name);
      set({ isLoading: false });
      if (result.success) {
        await get().loadBranches(path);
      } else {
        set({ error: result.error });
      }
      return result.success;
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      return false;
    }
  },

  checkoutBranch: async (path: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await githubService.checkoutBranch(path, name);
      set({ isLoading: false });
      if (result.success) {
        await get().getStatus(path);
        await get().loadBranches(path);
      } else {
        set({ error: result.error });
      }
      return result.success;
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      return false;
    }
  },

  loadBranches: async (path: string) => {
    try {
      const branches = await githubService.getBranches(path);
      set({ branches });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  createPullRequest: async (owner: string, repo: string, title: string, body: string, base: string, head: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await githubService.createPullRequest(owner, repo, title, body, base, head);
      set({ isLoading: false });
      if (result.success && result.pr) {
        set((state) => ({
          pullRequests: [...state.pullRequests, result.pr!],
        }));
        return result.pr;
      }
      set({ error: result.error });
      return null;
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      return null;
    }
  },

  mergePullRequest: async (owner: string, repo: string, prNumber: number, method: 'merge' | 'squash' | 'rebase' = 'merge') => {
    set({ isLoading: true, error: null });
    try {
      const result = await githubService.mergePullRequest(owner, repo, prNumber, method);
      set({ isLoading: false });
      if (result.success) {
        set((state) => ({
          pullRequests: state.pullRequests.map((pr) =>
            pr.number === prNumber ? { ...pr, state: 'merged' as const } : pr
          ),
        }));
      } else {
        set({ error: result.error });
      }
      return result.success;
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      return false;
    }
  },
}));

