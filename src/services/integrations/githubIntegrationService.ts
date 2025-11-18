/**
 * githubIntegrationService.ts
 * GitHub integration for automated repo management and issue tracking.
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';
import { credentialVaultService } from '../credentials/credentialVaultService';

export interface GitHubRepo {
  id: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  updatedAt: Date;
}

export interface GitHubIssue {
  id: string;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  assignee?: string;
  createdAt: Date;
  url: string;
}

export interface GitHubRelease {
  id: string;
  tagName: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  createdAt: Date;
  publishedAt?: Date;
}

class GitHubIntegrationService {
  private accessToken?: string;
  private repos: GitHubRepo[] = [];
  private issues: GitHubIssue[] = [];

  setAccessToken(token: string) {
    this.accessToken = token;
    logger.info('GitHub access token configured');
  }

  /**
   * Check if GitHub is connected
   */
  isConnected(): boolean {
    return this.accessToken !== undefined;
  }

  /**
   * Connect from credential vault
   */
  connectFromVault(): boolean {
    const creds = credentialVaultService.getCredentials('github');

    if (creds && creds.credentials.accessToken) {
      this.setAccessToken(creds.credentials.accessToken);
      logger.info('GitHub auto-initialized from credential vault');
      return true;
    }

    logger.warn('GitHub credentials not found in vault - using demo mode');
    return false;
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; hasCredentials: boolean; message: string } {
    const hasVaultCreds = credentialVaultService.hasCredentials('github');
    const isConnected = this.isConnected();

    if (isConnected && hasVaultCreds) {
      return {
        connected: true,
        hasCredentials: true,
        message: 'Connected to GitHub',
      };
    } else if (hasVaultCreds && !isConnected) {
      return {
        connected: false,
        hasCredentials: true,
        message: 'Credentials available - click to connect',
      };
    } else {
      return {
        connected: false,
        hasCredentials: false,
        message: 'Demo mode - configure credentials in vault to connect',
      };
    }
  }

  async getRepos(username?: string): Promise<GitHubRepo[]> {
    logger.info('Fetching GitHub repositories');

    // Demo mode: generate mock repos
    await this.simulateAPICall();

    this.repos = this.generateMockRepos();
    return this.repos;
  }

  async getIssues(repo: string): Promise<GitHubIssue[]> {
    logger.info('Fetching issues', { repo });

    await this.simulateAPICall();

    this.issues = this.generateMockIssues(repo);
    return this.issues;
  }

  async createIssue(repo: string, title: string, body: string, labels?: string[]): Promise<GitHubIssue> {
    logger.info('Creating issue', { repo, title });

    await this.simulateAPICall();

    const issue: GitHubIssue = {
      id: crypto.randomUUID(),
      number: Math.floor(Math.random() * 1000) + 1,
      title,
      body,
      state: 'open',
      labels: labels || [],
      createdAt: new Date(),
      url: `https://github.com/demo/${repo}/issues/${Math.floor(Math.random() * 1000)}`,
    };

    this.issues.push(issue);

    activityService.logActivity({
      type: 'github_issue_created',
      message: `Created issue: ${title}`,
      metadata: { repo },
    });

    return issue;
  }

  async createRelease(repo: string, version: string, changelog: string): Promise<GitHubRelease> {
    logger.info('Creating release', { repo, version });

    await this.simulateAPICall();

    const release: GitHubRelease = {
      id: crypto.randomUUID(),
      tagName: `v${version}`,
      name: `Release ${version}`,
      body: changelog,
      draft: false,
      prerelease: false,
      createdAt: new Date(),
      publishedAt: new Date(),
    };

    activityService.logActivity({
      type: 'github_release_created',
      message: `Released version ${version}`,
      metadata: { repo },
    });

    return release;
  }

  async syncRepoWithContent(repo: string, contentId: string): Promise<boolean> {
    logger.info('Syncing content to repository', { repo, contentId });

    await this.simulateAPICall();

    // Demo: simulate content push to repo
    return true;
  }

  async trackRepoStats(repos: string[]): Promise<Map<string, { stars: number; issues: number; commits: number }>> {
    const stats = new Map();

    for (const repo of repos) {
      await this.simulateAPICall();

      stats.set(repo, {
        stars: Math.floor(Math.random() * 1000),
        issues: Math.floor(Math.random() * 50),
        commits: Math.floor(Math.random() * 500) + 100,
      });
    }

    return stats;
  }

  private generateMockRepos(): GitHubRepo[] {
    return [
      {
        id: crypto.randomUUID(),
        name: 'dlx-studios',
        fullName: 'user/dlx-studios',
        description: 'Ultimate passive income automation platform',
        url: 'https://github.com/user/dlx-studios',
        stars: 245,
        forks: 32,
        openIssues: 8,
        language: 'TypeScript',
        updatedAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: 'content-automation',
        fullName: 'user/content-automation',
        description: 'AI-powered content generation tools',
        url: 'https://github.com/user/content-automation',
        stars: 128,
        forks: 18,
        openIssues: 4,
        language: 'Python',
        updatedAt: new Date(),
      },
    ];
  }

  private generateMockIssues(repo: string): GitHubIssue[] {
    return [
      {
        id: crypto.randomUUID(),
        number: 42,
        title: 'Add dark mode support',
        body: 'Users are requesting dark mode for better UX',
        state: 'open',
        labels: ['enhancement', 'ui'],
        createdAt: new Date(Date.now() - 86400000),
        url: `https://github.com/demo/${repo}/issues/42`,
      },
      {
        id: crypto.randomUUID(),
        number: 41,
        title: 'Fix revenue tracking bug',
        body: 'Revenue totals not calculating correctly',
        state: 'open',
        labels: ['bug', 'priority'],
        assignee: 'developer1',
        createdAt: new Date(Date.now() - 172800000),
        url: `https://github.com/demo/${repo}/issues/41`,
      },
    ];
  }

  private async simulateAPICall(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async quickTest() {
    this.setAccessToken('demo_token_123');

    const repos = await this.getRepos('testuser');
    const issues = await this.getIssues('dlx-studios');
    const newIssue = await this.createIssue('dlx-studios', 'Test automation feature', 'Adding automated testing', ['enhancement']);
    const stats = await this.trackRepoStats(['dlx-studios', 'content-automation']);

    return {
      repos,
      issues,
      newIssue,
      stats: Object.fromEntries(stats),
    };
  }
}

export const githubIntegrationService = new GitHubIntegrationService();

// Auto-initialize from credential vault if available
if (typeof window !== 'undefined') {
  setTimeout(() => {
    githubIntegrationService.connectFromVault();
  }, 100);
}

if (typeof window !== 'undefined') (window as any).testGitHubIntegration = () => githubIntegrationService.quickTest();
