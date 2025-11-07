import { create } from 'zustand';
import { Activity, ActivityType, ActivityColor } from '../../types/activity';
import { activityService } from './activityService';
import { LucideIcon, FileText, FolderPlus, Trash2, Save, Code, MessageSquare, Hammer, CheckCircle, XCircle, Upload, GitCommit, Download, AlertCircle, Settings } from 'lucide-react';

interface ActivityState {
  activities: Activity[];
  addActivity: (type: ActivityType, action: string, description: string, metadata?: any) => void;
  clearActivities: () => void;
  refreshActivities: () => void;
}

// Helper function to get icon and color based on type and action
function getIconAndColor(type: ActivityType, action: string): { icon: LucideIcon; color: ActivityColor } {
  switch (type) {
    case 'file':
      if (action === 'created') return { icon: FileText, color: 'green' };
      if (action === 'edited' || action === 'modified') return { icon: Code, color: 'cyan' };
      if (action === 'deleted') return { icon: Trash2, color: 'red' };
      if (action === 'saved') return { icon: Save, color: 'green' };
      return { icon: FileText, color: 'cyan' };

    case 'project':
      if (action === 'created') return { icon: FolderPlus, color: 'green' };
      if (action === 'opened') return { icon: FolderPlus, color: 'cyan' };
      if (action === 'deleted') return { icon: Trash2, color: 'red' };
      return { icon: FolderPlus, color: 'cyan' };

    case 'ai':
      if (action === 'query') return { icon: MessageSquare, color: 'violet' };
      if (action === 'response') return { icon: MessageSquare, color: 'cyan' };
      return { icon: MessageSquare, color: 'violet' };

    case 'build':
      if (action === 'started') return { icon: Hammer, color: 'yellow' };
      if (action === 'completed') return { icon: CheckCircle, color: 'green' };
      if (action === 'failed') return { icon: XCircle, color: 'red' };
      return { icon: Hammer, color: 'cyan' };

    case 'deploy':
      if (action === 'started') return { icon: Upload, color: 'yellow' };
      if (action === 'completed') return { icon: CheckCircle, color: 'green' };
      if (action === 'failed') return { icon: XCircle, color: 'red' };
      return { icon: Upload, color: 'cyan' };

    case 'git':
      if (action === 'commit') return { icon: GitCommit, color: 'cyan' };
      if (action === 'push') return { icon: Upload, color: 'green' };
      if (action === 'pull') return { icon: Download, color: 'cyan' };
      return { icon: GitCommit, color: 'cyan' };

    case 'error':
      return { icon: AlertCircle, color: 'red' };

    case 'system':
      return { icon: Settings, color: 'cyan' };

    default:
      return { icon: Settings, color: 'cyan' };
  }
}

export const useActivityStore = create<ActivityState>((set) => {
  // Subscribe to activity service updates
  activityService.subscribe((activity) => {
    set({ activities: activityService.getActivities() });
  });

  return {
    activities: activityService.getActivities(),

    addActivity: (type, action, description, metadata) => {
      const { icon, color } = getIconAndColor(type, action);
      
      const activity: Activity = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        action,
        description,
        timestamp: Date.now(),
        metadata,
        icon,
        color,
      };

      activityService.addActivity(activity);
      set({ activities: activityService.getActivities() });
    },

    clearActivities: () => {
      activityService.clearActivities();
      set({ activities: [] });
    },

    refreshActivities: () => {
      set({ activities: activityService.getActivities() });
    },
  };
});

