import { create } from 'zustand';
import { versionService } from './versionService';
import type { AppVersion, ComponentVersion, VersionHistory, FeatureVersion } from '@/types/version';

interface VersionStore {
  // State
  appVersion: AppVersion | null;
  componentVersions: ComponentVersion[];
  versionHistory: VersionHistory[];
  featureVersions: FeatureVersion[];
  isLoading: boolean;

  // Actions
  loadAppVersion: () => void;
  loadComponentVersions: () => void;
  loadVersionHistory: () => void;
  loadFeatureVersions: () => void;
  registerComponent: (component: Omit<ComponentVersion, 'lastUpdated'> & { lastUpdated?: Date }) => ComponentVersion;
  registerFeature: (feature: Omit<FeatureVersion, 'introduced' | 'lastUpdated'> & { introduced?: Date; lastUpdated?: Date }) => FeatureVersion;
  addVersionHistory: (version: string, changes: string[], breakingChanges?: string[]) => VersionHistory;
  generateChangelog: (sinceVersion?: string) => string;
}

export const useVersionStore = create<VersionStore>((set, get) => ({
  appVersion: null,
  componentVersions: [],
  versionHistory: [],
  featureVersions: [],
  isLoading: false,

  loadAppVersion: () => {
    const version = versionService.getAppVersion();
    set({ appVersion: version });
  },

  loadComponentVersions: () => {
    const versions = versionService.getAllComponentVersions();
    set({ componentVersions: versions });
  },

  loadVersionHistory: () => {
    const history = versionService.getVersionHistory();
    set({ versionHistory: history });
  },

  loadFeatureVersions: () => {
    const versions = versionService.getAllFeatureVersions();
    set({ featureVersions: versions });
  },

  registerComponent: (component) => {
    const registered = versionService.registerComponent(component);
    get().loadComponentVersions();
    return registered;
  },

  registerFeature: (feature) => {
    const registered = versionService.registerFeature(feature);
    get().loadFeatureVersions();
    return registered;
  },

  addVersionHistory: (version, changes, breakingChanges) => {
    const history = versionService.addVersionHistory(version, changes, breakingChanges);
    get().loadVersionHistory();
    return history;
  },

  generateChangelog: (sinceVersion) => {
    return versionService.generateChangelog(sinceVersion);
  },
}));

