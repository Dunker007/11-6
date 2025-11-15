import React, { useState, useMemo, memo, useCallback } from 'react';
import { useActivityStore } from '../../services/activity/activityStore';
import { useProjectStore } from '../../services/project/projectStore';
import ActivityItem from './ActivityItem';
import { errorLogger } from '../../services/errors/errorLogger';
import { measureRender } from '../../utils/performance';
import { useVirtualScroll } from '@/utils/hooks/usePerformance';
import { SkeletonActivityItem } from '@/components/ui';
import TechIcon from '../Icons/TechIcon';
import { Filter } from 'lucide-react';
import '../../styles/ActivityFeed.css';

/**
 * Activity timeline displaying recent system, project, and error events with filtering.
 *
 * @returns Activity feed card with filter controls.
 */
const ActivityFeed = memo(() => {
  const activities = useActivityStore((state) => state.activities);
  const { activeProject } = useProjectStore();
  const [filterMode, setFilterMode] = useState<'all' | 'errors' | 'project'>(
    'all'
  );
  const [errorCount, setErrorCount] = React.useState(0);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  React.useEffect(() => {
    const updateErrorCount = () => {
      const stats = errorLogger.getStats();
      setErrorCount(stats.bySeverity.critical + stats.bySeverity.error);
    };
    updateErrorCount();
    // Defer subscribe callback to prevent updates during render
    const unsubscribe = errorLogger.subscribe(() =>
      setTimeout(updateErrorCount, 0)
    );
    return unsubscribe;
  }, []);

  // Simulate initial load state for better UX
  React.useEffect(() => {
    if (activities.length > 0 && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [activities.length, isInitialLoad]);

  const filteredActivities = useMemo(() => {
    return measureRender(
      'ActivityFeed.filterActivities',
      () => {
        let filtered = [...activities].sort((a, b) => b.timestamp - a.timestamp);
        if (filterMode === 'errors') {
          return filtered.filter((activity) => activity.type === 'error');
        }
        if (filterMode === 'project' && activeProject) {
          // This is a simple filter. We can make it more robust by adding project IDs to metadata.
          return filtered.filter(
            (activity) =>
              activity.description.includes(activeProject.name) ||
              (activity.type === 'file' &&
                activity.metadata?.path?.startsWith(activeProject.rootPath))
          );
        }
        return filtered;
      },
      8,
      { totalActivities: activities.length, filterMode, hasProject: Boolean(activeProject) }
    );
  }, [activities, filterMode, activeProject]);

  /**
   * Update the active filter mode for the feed.
   *
   * @param mode - Desired filter selection.
   */
  const handleFilterChange = useCallback((mode: 'all' | 'errors' | 'project') => {
    setFilterMode(mode);
  }, []);

  // Virtual scrolling for large lists
  const ITEM_HEIGHT = 70; // Approximate height of ActivityItem
  const CONTAINER_HEIGHT = 600; // Maximum container height
  const { visibleItems, totalHeight, offsetY, handleScroll } = useVirtualScroll(
    filteredActivities,
    ITEM_HEIGHT,
    CONTAINER_HEIGHT
  );

  return (
    <div className="activity-feed-container redesigned">
      <div className="feed-header">
        <h3>Activity Feed</h3>
        <div className="filter-buttons">
          <button
            className={`filter-toggle ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            All
          </button>
          {activeProject && (
            <button
              className={`filter-toggle ${filterMode === 'project' ? 'active' : ''}`}
              onClick={() => handleFilterChange('project')}
            >
              {activeProject.name}
            </button>
          )}
          <button
            className={`filter-toggle ${filterMode === 'errors' ? 'active' : ''}`}
            onClick={() => handleFilterChange('errors')}
          >
            Errors
            {errorCount > 0 && (
              <span className="error-badge">{errorCount}</span>
            )}
          </button>
        </div>
      </div>
      <div 
        className="feed-list" 
        onScroll={handleScroll}
        style={{ maxHeight: `${CONTAINER_HEIGHT}px`, overflow: 'auto' }}
      >
        {isInitialLoad && activities.length === 0 ? (
          // Show skeleton while loading initial data
          <>
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonActivityItem key={index} />
            ))}
          </>
        ) : filteredActivities.length > 0 ? (
          <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              {visibleItems.map(({ item: activity }) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-feed">
            <TechIcon icon={Filter} size={32} />
            <span>
              {filterMode === 'errors'
                ? 'No errors recorded.'
                : filterMode === 'project'
                  ? 'No activity for this project.'
                  : 'No recent activity.'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

ActivityFeed.displayName = 'ActivityFeed';

export default ActivityFeed;
