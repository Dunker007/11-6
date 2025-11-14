import { Activity, ActivityListener } from '../../types/activity';
import { getActivityIcon, getActivityColor } from './activityIconMapper';
import { logger } from '../logging/loggerService';
import { storageService } from '../storage/storageService';

class ActivityService {
  private static instance: ActivityService;
  private activities: Activity[] = [];
  private listeners: Set<ActivityListener> = new Set();
  private readonly MAX_ACTIVITIES = 100; // Restored to 100 now that we have proper storage management
  private readonly STORAGE_KEY = 'activities';
  private isLoading = false;
  private saveTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    // Load activities asynchronously without blocking
    this.loadActivities().catch(err => {
      logger.error('Failed to load activities on init', { error: err instanceof Error ? err.message : String(err) });
    });
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
  addActivity(activity: Omit<Activity, 'id' | 'timestamp' | 'icon' | 'color'> | Activity): void {
    // If activity already has all fields, use it directly
    if ('id' in activity && 'timestamp' in activity && 'icon' in activity && 'color' in activity) {
      this.activities.unshift(activity as Activity);
    } else {
      // Otherwise, create full activity object
      const fullActivity: Activity = {
        ...activity,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        icon: getActivityIcon(activity.type, activity.action),
        color: getActivityColor(activity.type, activity.action),
      };
      this.activities.unshift(fullActivity);
    }

    // Keep only last MAX_ACTIVITIES
    if (this.activities.length > this.MAX_ACTIVITIES) {
      this.activities = this.activities.slice(0, this.MAX_ACTIVITIES);
    }

    // Debounced save to localStorage (prevent rapid successive saves)
    this.debouncedSave();

    // Notify all listeners
    this.notifyListeners(this.activities[0]);
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
  async clearActivities(): Promise<void> {
    this.activities = [];
    
    // Clear any pending saves
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    
    await storageService.remove(this.STORAGE_KEY);
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
   * Debounced save to prevent rapid successive saves
   */
  private debouncedSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveActivities().catch(err => {
        logger.error('Debounced save failed', { error: err instanceof Error ? err.message : String(err) });
      });
    }, 500); // Save 500ms after last activity
  }

  /**
   * Save activities to storage with automatic quota management
   */
  private async saveActivities(): Promise<void> {
    try {
      // Convert activities to storable format (without icon function)
      const storable = this.activities.map(({ icon, ...rest }) => rest);
      
      // Use storageService with low priority (can be cleared if space needed)
      // Expire after 30 days
      const saved = await storageService.set(this.STORAGE_KEY, storable, {
        priority: 'low',
        expiresIn: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
      
      if (!saved) {
        logger.warn('Failed to save activities, but continuing in-memory');
      }
    } catch (error) {
      logger.error('Failed to save activities:', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Load activities from storage
   */
  private async loadActivities(): Promise<void> {
    if (this.isLoading) {
      return; // Prevent concurrent loads
    }
    
    this.isLoading = true;
    try {
      const stored = await storageService.get<Array<Omit<Activity, 'icon' | 'color'>>>(this.STORAGE_KEY);
      
      if (stored && Array.isArray(stored)) {
        // Limit loaded activities to MAX_ACTIVITIES
        const limited = stored.slice(0, this.MAX_ACTIVITIES);
        
        // Restore icons and colors based on activity type and action
        this.activities = limited.map((activity) => ({
          ...activity,
          icon: getActivityIcon(activity.type, activity.action),
          color: getActivityColor(activity.type, activity.action),
        }));
        
        logger.info(`Loaded ${this.activities.length} activities from storage`);
      }
    } catch (error) {
      logger.error('Failed to load activities:', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      this.activities = [];
    } finally {
      this.isLoading = false;
    }
  }
}

// Export singleton instance
export const activityService = ActivityService.getInstance();

