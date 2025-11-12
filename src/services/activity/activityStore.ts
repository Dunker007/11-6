/**
 * activityStore.ts
 * 
 * PURPOSE:
 * Zustand store for activity feed state. Manages application-wide activity logging and
 * provides reactive state for activity feed components. Integrates with activityService
 * to track user actions, system events, and AI operations.
 * 
 * ARCHITECTURE:
 * Zustand store that wraps activityService with reactive state:
 * - Subscribes to activityService updates
 * - Provides methods to add, clear, and refresh activities
 * - Automatically maps activity types to icons and colors
 * - Maintains reactive activity list for UI components
 * 
 * CURRENT STATUS:
 * ✅ Activity logging and tracking
 * ✅ Activity feed state management
 * ✅ Icon and color mapping
 * ✅ Activity clearing and refresh
 * ✅ Real-time updates via subscription
 * 
 * DEPENDENCIES:
 * - activityService: Core activity operations
 * - activityIconMapper: Icon and color mapping
 * - @/types/activity: Activity type definitions
 * 
 * STATE MANAGEMENT:
 * - activities: List of all activities
 * - Reactive updates via activityService subscription
 * 
 * PERFORMANCE:
 * - Efficient subscription pattern
 * - Icon/color mapping cached
 * - Minimal re-renders
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { useActivityStore } from '@/services/activity/activityStore';
 * 
 * function ActivityFeed() {
 *   const { activities, addActivity } = useActivityStore();
 *   
 *   const handleAction = () => {
 *     addActivity('project', 'created', 'Created new project');
 *   };
 * }
 * ```
 * 
 * RELATED FILES:
 * - src/services/activity/activityService.ts: Core activity operations
 * - src/services/activity/activityIconMapper.ts: Icon/color mapping
 * - src/components/Activity/ActivityFeed.tsx: Displays activities
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Activity filtering and search
 * - Activity export
 * - Activity analytics
 * - Activity grouping by time/type
 */
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
  activityService.subscribe((_activity) => {
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

