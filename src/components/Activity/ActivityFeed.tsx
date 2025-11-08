import { useEffect, useRef, useState } from 'react';
import { useActivityStore } from '../../services/activity/activityStore';
import { errorLogger } from '../../services/errors/errorLogger';
import ActivityItem from './ActivityItem';
import { Trash2, AlertCircle, Filter } from 'lucide-react';
import TechIcon from '../Icons/TechIcon';
import '../../styles/ActivityFeed.css';

type FilterMode = 'all' | 'errors' | 'recent';

function ActivityFeed() {
  const { activities, clearActivities } = useActivityStore();
  const feedRef = useRef<HTMLDivElement>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [errorCount, setErrorCount] = useState(0);

  // Auto-scroll to top when new activity is added
  useEffect(() => {
    if (feedRef.current && activities.length > 0) {
      feedRef.current.scrollTop = 0;
    }
  }, [activities.length]);

  // Subscribe to error updates
  useEffect(() => {
    const updateErrorCount = () => {
      const stats = errorLogger.getStats();
      setErrorCount(stats.bySeverity.critical + stats.bySeverity.error);
    };

    updateErrorCount();
    const unsubscribe = errorLogger.subscribe(updateErrorCount);
    return unsubscribe;
  }, []);

  // Filter activities based on mode
  const filteredActivities = filterMode === 'errors'
    ? activities.filter(a => a.type === 'error')
    : filterMode === 'recent'
      ? activities.slice(0, 10)
      : activities;

  return (
    <div className="activity-feed-container">
      <div className="activity-feed-header">
        <div className="header-content">
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span className="live-text">LIVE</span>
          </div>
          <h3 className="feed-title">Activity Feed</h3>
        </div>
        <div className="feed-actions">
          <div className="filter-buttons">
            <button
              className={`filter-toggle ${filterMode === 'all' ? 'active' : ''}`}
              onClick={() => setFilterMode('all')}
              title="Show All"
            >
              <TechIcon icon={Filter} size={12} />
              <span>All</span>
            </button>
            <button
              className={`filter-toggle ${filterMode === 'errors' ? 'active' : ''}`}
              onClick={() => setFilterMode('errors')}
              title="Show Errors Only"
            >
              <TechIcon icon={AlertCircle} size={12} glow={errorCount > 0 ? 'red' : undefined} />
              <span>Errors</span>
              {errorCount > 0 && <span className="error-badge">{errorCount}</span>}
            </button>
          </div>
          {activities.length > 0 && (
            <button 
              className="clear-activities-btn"
              onClick={clearActivities}
              title="Clear all activities"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="activity-feed-list" ref={feedRef}>
        {filteredActivities.length === 0 ? (
          <div className="no-activities">
            <div className="no-activities-icon">◈</div>
            <p className="no-activities-text">
              {filterMode === 'errors' ? 'No errors' : 'No activity yet'}
            </p>
            <p className="no-activities-subtext">
              {filterMode === 'errors' 
                ? 'All systems operational' 
                : 'Activity will appear here as you work'}
            </p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <ActivityItem 
              key={activity.id} 
              activity={activity}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ActivityFeed;

