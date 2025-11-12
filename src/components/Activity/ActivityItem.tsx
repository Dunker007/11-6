import { memo } from 'react';
import { Activity } from '../../types/activity';
import TechIcon from '../Icons/TechIcon';
import '../../styles/ActivityFeed.css';

interface ActivityItemProps {
  activity: Activity;
  onClick?: () => void;
}

/**
 * Render a single activity timeline entry with icon, description, and relative timestamp.
 *
 * @param props - Activity metadata and optional click handler.
 * @returns React memoized timeline row.
 */
const ActivityItem = memo(function ActivityItem({
  activity,
  onClick,
}: ActivityItemProps) {
  /**
   * Convert a timestamp into a human-readable relative string.
   *
   * @param timestamp - Epoch milliseconds of the activity event.
   * @returns Relative time string such as "5m ago".
   */
  const getTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div
      className={`activity-item ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="activity-icon-wrapper">
        <TechIcon
          icon={activity.icon}
          size={16}
          glow={activity.color}
          variant="default"
        />
      </div>

      <div className="activity-content">
        <div className="activity-description">{activity.description}</div>
        <div className="activity-time">{getTimeAgo(activity.timestamp)}</div>
      </div>

      <div
        className="activity-glow"
        style={{
          background: `radial-gradient(circle, var(--${activity.color}-500) 0%, transparent 70%)`,
        }}
      ></div>
    </div>
  );
});

export default ActivityItem;
