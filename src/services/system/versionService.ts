import type { AppVersion, ComponentVersion, VersionHistory, FeatureVersion } from '@/types/version';

// Read package.json version at build time
const APP_VERSION = '1.0.0'; // This will be replaced by build script

const COMPONENT_VERSIONS_KEY = 'dlx_component_versions';
const VERSION_HISTORY_KEY = 'dlx_version_history';
const FEATURE_VERSIONS_KEY = 'dlx_feature_versions';

export class VersionService {
  private static instance: VersionService;
  private componentVersions: Map<string, ComponentVersion> = new Map();
  private versionHistory: VersionHistory[] = [];
  private featureVersions: Map<string, FeatureVersion> = new Map();

  private constructor() {
    this.loadData();
  }

  static getInstance(): VersionService {
    if (!VersionService.instance) {
      VersionService.instance = new VersionService();
    }
    return VersionService.instance;
  }

  private loadData(): void {
    try {
      const componentsData = localStorage.getItem(COMPONENT_VERSIONS_KEY);
      if (componentsData) {
        const components: ComponentVersion[] = JSON.parse(componentsData);
        components.forEach((comp) => {
          comp.lastUpdated = new Date(comp.lastUpdated);
          this.componentVersions.set(comp.componentId, comp);
        });
      }

      const historyData = localStorage.getItem(VERSION_HISTORY_KEY);
      if (historyData) {
        const history: VersionHistory[] = JSON.parse(historyData);
        this.versionHistory = history.map((v) => ({
          ...v,
          date: new Date(v.date),
        }));
      }

      const featuresData = localStorage.getItem(FEATURE_VERSIONS_KEY);
      if (featuresData) {
        const features: FeatureVersion[] = JSON.parse(featuresData);
        features.forEach((feat) => {
          feat.introduced = new Date(feat.introduced);
          feat.lastUpdated = new Date(feat.lastUpdated);
          this.featureVersions.set(feat.featureId, feat);
        });
      }
    } catch (error) {
      console.error('Failed to load version data:', error);
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem(COMPONENT_VERSIONS_KEY, JSON.stringify(Array.from(this.componentVersions.values())));
      localStorage.setItem(VERSION_HISTORY_KEY, JSON.stringify(this.versionHistory));
      localStorage.setItem(FEATURE_VERSIONS_KEY, JSON.stringify(Array.from(this.featureVersions.values())));
    } catch (error) {
      console.error('Failed to save version data:', error);
    }
  }

  // App Version
  getAppVersion(): AppVersion {
    return {
      version: APP_VERSION,
      buildDate: new Date(), // In production, this would be set at build time
      gitCommit: undefined, // Would be set by build script
      gitBranch: undefined, // Would be set by build script
    };
  }

  // Component Versions
  registerComponent(component: Omit<ComponentVersion, 'lastUpdated'> & { lastUpdated?: Date }): ComponentVersion {
    const version: ComponentVersion = {
      ...component,
      lastUpdated: component.lastUpdated || new Date(),
    };
    this.componentVersions.set(component.componentId, version);
    this.saveData();
    return version;
  }

  getComponentVersion(componentId: string): ComponentVersion | null {
    return this.componentVersions.get(componentId) || null;
  }

  getAllComponentVersions(): ComponentVersion[] {
    return Array.from(this.componentVersions.values());
  }

  updateComponentVersion(componentId: string, version: string, changelog?: string[]): ComponentVersion | null {
    const existing = this.componentVersions.get(componentId);
    if (!existing) return null;

    const updated: ComponentVersion = {
      ...existing,
      version,
      lastUpdated: new Date(),
      changelog: changelog || existing.changelog,
    };
    this.componentVersions.set(componentId, updated);
    this.saveData();
    return updated;
  }

  // Version History
  addVersionHistory(version: string, changes: string[], breakingChanges?: string[]): VersionHistory {
    const history: VersionHistory = {
      version,
      date: new Date(),
      changes,
      breakingChanges,
    };
    this.versionHistory.push(history);
    this.saveData();
    return history;
  }

  getVersionHistory(): VersionHistory[] {
    return [...this.versionHistory].sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // Feature Versions
  registerFeature(feature: Omit<FeatureVersion, 'introduced' | 'lastUpdated'> & { introduced?: Date; lastUpdated?: Date }): FeatureVersion {
    const now = new Date();
    const version: FeatureVersion = {
      ...feature,
      introduced: feature.introduced || now,
      lastUpdated: feature.lastUpdated || now,
    };
    this.featureVersions.set(feature.featureId, version);
    this.saveData();
    return version;
  }

  getFeatureVersion(featureId: string): FeatureVersion | null {
    return this.featureVersions.get(featureId) || null;
  }

  getAllFeatureVersions(): FeatureVersion[] {
    return Array.from(this.featureVersions.values());
  }

  updateFeatureVersion(featureId: string, updates: Partial<FeatureVersion>): FeatureVersion | null {
    const existing = this.featureVersions.get(featureId);
    if (!existing) return null;

    const updated: FeatureVersion = {
      ...existing,
      ...updates,
      lastUpdated: new Date(),
    };
    this.featureVersions.set(featureId, updated);
    this.saveData();
    return updated;
  }

  // Changelog Generation
  generateChangelog(sinceVersion?: string): string {
    const history = sinceVersion
      ? this.versionHistory.filter((v) => this.compareVersions(v.version, sinceVersion) > 0)
      : this.versionHistory;

    if (history.length === 0) {
      return 'No changes recorded.';
    }

    let changelog = `# Changelog\n\n`;
    history.forEach((entry) => {
      changelog += `## Version ${entry.version} - ${entry.date.toLocaleDateString()}\n\n`;
      if (entry.breakingChanges && entry.breakingChanges.length > 0) {
        changelog += `### ⚠️ Breaking Changes\n`;
        entry.breakingChanges.forEach((change) => {
          changelog += `- ${change}\n`;
        });
        changelog += `\n`;
      }
      changelog += `### Changes\n`;
      entry.changes.forEach((change) => {
        changelog += `- ${change}\n`;
      });
      changelog += `\n`;
    });

    return changelog;
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    return 0;
  }
}

export const versionService = VersionService.getInstance();

