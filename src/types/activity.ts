import { type LucideIcon } from '../components/Icons/icons';

export type ActivityType = 'file' | 'project' | 'ai' | 'build' | 'deploy' | 'deployment' | 'code' | 'git' | 'error' | 'system';
export type ActivityColor = 'cyan' | 'violet' | 'green' | 'yellow' | 'red';

export interface Activity {
  id: string;
  type: ActivityType;
  action: string;
  description: string;
  timestamp: number;
  metadata?: any;
  icon: LucideIcon;
  color: ActivityColor;
}

export interface ActivityListener {
  (activity: Activity): void;
}

