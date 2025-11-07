import { useEffect, useRef } from 'react';
import { useActivityStore } from '../../services/activity/activityStore';
import ActivityItem from './ActivityItem';
import { Trash2 } from 'lucide-react';
import '../../styles/ActivityFeed.css';

function ActivityFeed() {
  const { activities, clearActivities } = useActivityStore();
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when new activity is added
  useEffect(() => {
    if (feedRef.current && activities.length > 0) {
      feedRef.current.scrollTop = 0;
    }
  }, [activities.length]);

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

      <div className="activity-feed-list" ref={feedRef}>
        {activities.length === 0 ? (
          <div className="no-activities">
            <div className="no-activities-icon">◈</div>
            <p className="no-activities-text">No activity yet</p>
            <p className="no-activities-subtext">Activity will appear here as you work</p>
          </div>
        ) : (
          activities.map((activity) => (
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

