import { create } from 'zustand';
import { Activity, ActivityType } from '../../types/activity';
import { activityService } from './activityService';
import { getActivityIconAndColor } from './activityIconMapper';

interface ActivityState {
  activities: Activity[];
  addActivity: (type: ActivityType, action: string, description: string, metadata?: any) => void;
  clearActivities: () => void;
  refreshActivities: () => void;
}

export const useActivityStore = create<ActivityState>((set) => {
  // Subscribe to activity service updates
  activityService.subscribe((activity) => {
    set({ activities: activityService.getActivities() });
  });

  return {
    activities: activityService.getActivities(),

    addActivity: (type, action, description, metadata) => {
      const { icon, color } = getActivityIconAndColor(type, action);
      
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

