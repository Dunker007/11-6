import { Activity, ActivityListener, ActivityType } from '../../types/activity';
import { getActivityIcon, getActivityColor } from './activityIconMapper';

class ActivityService {
  private static instance: ActivityService;
  private activities: Activity[] = [];
  private listeners: Set<ActivityListener> = new Set();
  private readonly MAX_ACTIVITIES = 100;
  private readonly STORAGE_KEY = 'dlx-activities';

  private constructor() {
    // Load activities from localStorage
    this.loadActivities();
  }

  static getInstance(): ActivityService {
    if (!ActivityService.instance) {
      ActivityService.instance = new ActivityService();
    }
    return ActivityService.instance;
  }

  /**
   * Add a new activity
   */
  addActivity(activity: Activity): void {
    // Add to beginning of array (newest first)
    this.activities.unshift(activity);

    // Keep only last MAX_ACTIVITIES
    if (this.activities.length > this.MAX_ACTIVITIES) {
      this.activities = this.activities.slice(0, this.MAX_ACTIVITIES);
    }

    // Save to localStorage
    this.saveActivities();

    // Notify all listeners
    this.notifyListeners(activity);
  }

  /**
   * Get all activities
   */
  getActivities(): Activity[] {
    return [...this.activities];
  }

  /**
   * Clear all activities
   */
  clearActivities(): void {
    this.activities = [];
    this.saveActivities();
    // Notify listeners with null to trigger update
    this.listeners.forEach(listener => listener(null as any));
  }

  /**
   * Subscribe to activity updates
   */
  subscribe(listener: ActivityListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of new activity
   */
  private notifyListeners(activity: Activity): void {
    this.listeners.forEach(listener => listener(activity));
  }

  /**
   * Save activities to localStorage
   */
  private saveActivities(): void {
    try {
      // Convert activities to storable format (without icon function)
      const storable = this.activities.map(({ icon, ...rest }) => rest);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storable));
    } catch (error) {
      console.error('Failed to save activities to localStorage:', error);
    }
  }

  /**
   * Load activities from localStorage
   */
  private loadActivities(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Restore icons and colors based on activity type and action
        this.activities = parsed.map((activity: Omit<Activity, 'icon' | 'color'>) => ({
          ...activity,
          icon: getActivityIcon(activity.type, activity.action),
          color: getActivityColor(activity.type, activity.action),
        }));
      }
    } catch (error) {
      console.error('Failed to load activities from localStorage:', error);
      this.activities = [];
    }
  }
}

// Export singleton instance
export const activityService = ActivityService.getInstance();

