import type { DevTool } from './toolRegistry';
import type { ToolUpdateCheckResult, UpdateInfo } from '@/types/devtools';

/**
 * Service for checking if development tools have updates available
 */
class ToolUpdateService {
  private static instance: ToolUpdateService;
  private updateCache: Map<string, { info: UpdateInfo; cachedAt: number }> = new Map();
  private readonly CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

  static getInstance(): ToolUpdateService {
    if (!ToolUpdateService.instance) {
      ToolUpdateService.instance = new ToolUpdateService();
    }
    return ToolUpdateService.instance;
  }

  /**
   * Normalize version string (remove 'v' prefix, handle git versions, etc.)
   */
  private normalizeVersion(version: string): string {
    return version.replace(/^v/i, '').trim();
  }

  /**
   * Compare two version strings using semantic versioning
   * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const normalize = (v: string) => {
      const parts = v.split(/[.-]/).map((p) => {
        const num = parseInt(p, 10);
        return isNaN(num) ? p.toLowerCase() : num;
      });
      return parts;
    };

    const parts1 = normalize(this.normalizeVersion(v1));
    const parts2 = normalize(this.normalizeVersion(v2));
    const maxLength = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLength; i++) {
      const part1 = parts1[i] ?? 0;
      const part2 = parts2[i] ?? 0;

      if (typeof part1 === 'number' && typeof part2 === 'number') {
        if (part1 < part2) return -1;
        if (part1 > part2) return 1;
      } else {
        const str1 = String(part1);
        const str2 = String(part2);
        if (str1 < str2) return -1;
        if (str1 > str2) return 1;
      }
    }

    return 0;
  }

  /**
   * Check for updates for a single tool
   */
  async checkToolUpdate(
    tool: DevTool,
    currentVersion: string
  ): Promise<ToolUpdateCheckResult> {
    if (!tool.updateCheckUrl || !tool.updateCheckType) {
      return {
        toolId: tool.id,
        hasUpdate: false,
        currentVersion,
        latestVersion: null,
        error: 'No update check URL configured',
      };
    }

    // Check cache first
    const cached = this.updateCache.get(tool.id);
    if (cached && Date.now() - cached.cachedAt < this.CACHE_DURATION_MS) {
      return {
        toolId: tool.id,
        hasUpdate: cached.info.hasUpdate,
        currentVersion,
        latestVersion: cached.info.latestVersion,
        updateUrl: cached.info.updateUrl,
      };
    }

    try {
      let latestVersion: string | null = null;
      let updateUrl: string | undefined;

      switch (tool.updateCheckType) {
        case 'github':
          latestVersion = await this.checkGitHubRelease(tool.updateCheckUrl);
          updateUrl = tool.updateCheckUrl.replace('/releases/latest', '/releases');
          break;

        case 'npm':
          latestVersion = await this.checkNpmPackage(tool.updateCheckUrl);
          updateUrl = tool.website;
          break;

        case 'api':
          if (tool.id === 'node') {
            latestVersion = await this.checkNodeVersion(tool.updateCheckUrl);
            updateUrl = tool.website;
          }
          break;

        default:
          return {
            toolId: tool.id,
            hasUpdate: false,
            currentVersion,
            latestVersion: null,
            error: `Unsupported update check type: ${tool.updateCheckType}`,
          };
      }

      const hasUpdate =
        latestVersion !== null &&
        this.compareVersions(currentVersion, latestVersion) < 0;

      const updateInfo: UpdateInfo = {
        hasUpdate,
        currentVersion,
        latestVersion,
        updateUrl,
        checkedAt: new Date().toISOString(),
      };

      // Cache the result
      this.updateCache.set(tool.id, {
        info: updateInfo,
        cachedAt: Date.now(),
      });

      return {
        toolId: tool.id,
        hasUpdate,
        currentVersion,
        latestVersion,
        updateUrl,
      };
    } catch (error) {
      return {
        toolId: tool.id,
        hasUpdate: false,
        currentVersion,
        latestVersion: null,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Check GitHub releases API
   */
  private async checkGitHubRelease(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
      }
      const data = await response.json();
      const tagName = data.tag_name || data.name || '';
      return this.normalizeVersion(tagName);
    } catch (error) {
      console.error('Failed to check GitHub release:', error);
      return null;
    }
  }

  /**
   * Check npm registry
   */
  private async checkNpmPackage(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`npm API returned ${response.status}`);
      }
      const data = await response.json();
      return this.normalizeVersion(data.version || '');
    } catch (error) {
      console.error('Failed to check npm package:', error);
      return null;
    }
  }

  /**
   * Check Node.js version from index.json
   */
  private async checkNodeVersion(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Node.js API returned ${response.status}`);
      }
      const data = await response.json();
      // Get the latest LTS version
      const ltsVersion = data.find((v: any) => v.lts !== false);
      if (ltsVersion && ltsVersion.version) {
        return this.normalizeVersion(ltsVersion.version);
      }
      // Fallback to first entry
      if (data.length > 0 && data[0].version) {
        return this.normalizeVersion(data[0].version);
      }
      return null;
    } catch (error) {
      console.error('Failed to check Node.js version:', error);
      return null;
    }
  }

  /**
   * Check updates for multiple tools
   */
  async checkAllToolUpdates(
    tools: Array<{ tool: DevTool; version?: string; isInstalled: boolean }>
  ): Promise<Map<string, ToolUpdateCheckResult>> {
    const results = new Map<string, ToolUpdateCheckResult>();

    const installedTools = tools.filter(
      (t) => t.isInstalled && t.version && t.tool.updateCheckUrl
    );

    const updatePromises = installedTools.map(async (toolData) => {
      const result = await this.checkToolUpdate(
        toolData.tool,
        toolData.version!
      );
      results.set(toolData.tool.id, result);
    });

    await Promise.all(updatePromises);

    return results;
  }

  /**
   * Clear update cache
   */
  clearCache(): void {
    this.updateCache.clear();
  }
}

export const toolUpdateService = ToolUpdateService.getInstance();

