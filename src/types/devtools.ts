export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string | null;
  updateUrl?: string;
  checkedAt: string;
}

export interface ToolUpdateCheckResult {
  toolId: string;
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string | null;
  updateUrl?: string;
  error?: string;
}

