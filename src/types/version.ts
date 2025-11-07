export interface AppVersion {
  version: string;
  buildDate: Date;
  gitCommit?: string;
  gitBranch?: string;
}

export interface ComponentVersion {
  componentId: string;
  componentName: string;
  version: string;
  lastUpdated: Date;
  changelog?: string[];
}

export interface VersionHistory {
  version: string;
  date: Date;
  changes: string[];
  breakingChanges?: string[];
}

export interface FeatureVersion {
  featureId: string;
  featureName: string;
  version: string;
  status: 'active' | 'preview' | 'deprecated';
  introduced: Date;
  lastUpdated: Date;
}

