import { LucideIcon } from 'lucide-react';

export type ActivityType = 'file' | 'project' | 'ai' | 'build' | 'deploy' | 'git' | 'error' | 'system';
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

