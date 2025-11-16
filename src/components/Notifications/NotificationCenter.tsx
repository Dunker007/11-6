// src/components/Notifications/NotificationCenter.tsx
import { useNotificationStore } from '../../services/notification/notificationStore';
import { notificationService } from '../../services/notification/notificationService';
import TechIcon from '../Icons/TechIcon';
import { ICON_MAP } from '../Icons/IconSet';
import '../../styles/NotificationCenter.css';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter = ({ isOpen, onClose }: NotificationCenterProps) => {
  const notifications = useNotificationStore((state) => state.notifications);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="notification-center-overlay" onClick={onClose}>
      <div className="notification-center" onClick={(e) => e.stopPropagation()}>
        <div className="nc-header">
          <h3>Notifications</h3>
          <button onClick={() => notificationService.clearAll()} className="nc-clear-btn">
            Clear All
          </button>
        </div>
        <div className="nc-list">
          {notifications.length === 0 ? (
            <div className="nc-empty-state">
              <TechIcon icon={ICON_MAP.bell} size="lg" />
              <p>All caught up!</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div key={notif.id} className={`nc-item ${notif.type} ${notif.read ? 'read' : ''}`} onClick={() => notificationService.markAsRead(notif.id)}>
                <div className="nc-item-icon">
                  <TechIcon icon={notif.icon || ICON_MAP.bell} />
                </div>
                <div className="nc-item-content">
                  <h4>{notif.title}</h4>
                  <p>{notif.message}</p>
                  <span className="nc-item-timestamp">{notif.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
