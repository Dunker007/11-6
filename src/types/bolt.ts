/**
 * bolt.diy Build Package Types
 * Types for generating and exporting build packages to bolt.diy
 */

export type BoltProjectType = 'web' | 'api' | 'cms' | 'static' | 'fullstack';

export interface BoltBuildStep {
  command: string;
  type: 'install' | 'build' | 'deploy' | 'test' | 'custom';
  description?: string;
  workingDirectory?: string;
  environment?: Record<string, string>;
}

export interface BoltDeployConfig {
  platform: 'bolt.diy' | 'custom';
  config: Record<string, any>;
  environment?: Record<string, string>;
}

export interface BoltBuildPackage {
  version: string;
  project: {
    name: string;
    type: BoltProjectType;
    description: string;
    version?: string;
  };
  structure: {
    files: Array<{
      path: string;
      content: string;
      type: string;
      encoding?: 'utf8' | 'base64';
    }>;
    directories: string[];
  };
  dependencies: {
    npm?: Record<string, string>;
    python?: string[];
    pip?: Record<string, string>;
    composer?: Record<string, string>;
    cargo?: Record<string, string>;
    go?: Record<string, string>;
  };
  build: {
    steps: BoltBuildStep[];
    environment?: Record<string, string>;
    preBuild?: string[];
    postBuild?: string[];
  };
  deploy: BoltDeployConfig;
  metadata?: {
    createdAt: string;
    generatedBy: string;
    tags?: string[];
  };
}

export interface PackageValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingFiles?: string[];
  missingDependencies?: string[];
}

