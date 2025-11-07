import type { DevTool } from './toolRegistry';
import { DEV_TOOLS } from './toolRegistry';

export interface ToolCheckResult {
  tool: DevTool;
  isInstalled: boolean;
  version?: string;
  error?: string;
}

export class ToolManager {
  private static instance: ToolManager;
  private checkedTools: Map<string, ToolCheckResult> = new Map();

  private constructor() {}

  static getInstance(): ToolManager {
    if (!ToolManager.instance) {
      ToolManager.instance = new ToolManager();
    }
    return ToolManager.instance;
  }

  async checkTool(tool: DevTool): Promise<ToolCheckResult> {
    // Check cache first
    const cached = this.checkedTools.get(tool.id);
    if (cached) {
      return cached;
    }

    try {
      if (!window.devTools) {
        return {
          tool,
          isInstalled: false,
          error: 'Dev tools API not available',
        };
      }

      const result = await window.devTools.check(tool.command);
      
      if (result.success && result.installed) {
        let version: string | undefined;
        
        if (tool.versionCommand) {
          const versionResult = await window.devTools.getVersion(tool.versionCommand);
          version = versionResult.version;
        } else if (result.output) {
          version = this.extractVersion(result.output);
        }

        const toolResult: ToolCheckResult = {
          tool,
          isInstalled: true,
          version: version || 'unknown',
        };

        this.checkedTools.set(tool.id, toolResult);
        return toolResult;
      } else {
        const toolResult: ToolCheckResult = {
          tool,
          isInstalled: false,
          error: result.error,
        };

        this.checkedTools.set(tool.id, toolResult);
        return toolResult;
      }
    } catch (error) {
      const result: ToolCheckResult = {
        tool,
        isInstalled: false,
        error: (error as Error).message,
      };

      this.checkedTools.set(tool.id, result);
      return result;
    }
  }

  async checkAllTools(): Promise<ToolCheckResult[]> {
    const results = await Promise.all(
      DEV_TOOLS.map((tool) => this.checkTool(tool))
    );
    return results;
  }

  async getVersion(tool: DevTool): Promise<string | undefined> {
    if (!tool.versionCommand) return undefined;

    try {
      if (!window.devTools) {
        return undefined;
      }
      const result = await window.devTools.getVersion(tool.versionCommand);
      return result.version;
    } catch {
      return undefined;
    }
  }

  private extractVersion(output: string): string | undefined {
    // Extract version from command output
    const match = output.match(/(\d+\.\d+\.\d+)/);
    return match ? match[1] : undefined;
  }

  async installTool(tool: DevTool): Promise<{ success: boolean; error?: string }> {
    if (!tool.installCommand) {
      return { success: false, error: 'No install command available' };
    }

    try {
      if (!window.devTools) {
        return { success: false, error: 'Dev tools API not available' };
      }
      const result = await window.devTools.install(tool.installCommand);
      if (result.success) {
        // Clear cache to force re-check
        this.checkedTools.delete(tool.id);
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  clearCache(): void {
    this.checkedTools.clear();
  }

  getToolsByCategory(category: DevTool['category']): DevTool[] {
    return DEV_TOOLS.filter((tool) => tool.category === category);
  }

  getInstalledTools(): DevTool[] {
    return Array.from(this.checkedTools.values())
      .filter((result) => result.isInstalled)
      .map((result) => result.tool);
  }
}

export const toolManager = ToolManager.getInstance();
