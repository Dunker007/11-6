import { useState } from 'react';
import { useAgentStore } from '@/services/agents/agentStore';
import ItorAvatar from './ItorAvatar';
import '../../styles/Agents.css';

/**
 * Itor Toolbar Widget
 * Small hawk icon in top toolbar, always visible
 * Shows review status and issue count
 */
function ItorToolbar() {
  const [showPopover, setShowPopover] = useState(false);
  const itorStatus = useAgentStore((state) => state.itorStatus);
  const reviewCount = useAgentStore((state) => state.reviewCount);
  const issuesFound = useAgentStore((state) => state.issuesFound);

  const getStatusColor = () => {
    switch (itorStatus) {
      case 'alert':
        return 'var(--red-500)';
      case 'approved':
        return 'var(--green-500)';
      case 'reviewing':
      case 'scanning':
        return 'var(--cyan-500)';
      case 'error':
        return 'var(--red-600)';
      default:
        return 'var(--cyan-400)';
    }
  };

  return (
    <div className="itor-toolbar-widget">
      <button
        className="itor-toolbar-btn"
        onClick={() => setShowPopover(!showPopover)}
        title={`Itor - ${itorStatus} | Reviews: ${reviewCount} | Issues: ${issuesFound}`}
        style={{
          '--itor-glow-color': getStatusColor(),
        } as React.CSSProperties}
      >
        <ItorAvatar status={itorStatus} size="sm" animated={true} />
        {issuesFound > 0 && (
          <span className="itor-badge">{issuesFound}</span>
        )}
      </button>

      {showPopover && (
        <>
          <div 
            className="itor-popover-backdrop"
            onClick={() => setShowPopover(false)}
          />
          <div className="itor-popover">
            <div className="itor-popover-header">
              <ItorAvatar status={itorStatus} size="md" animated={true} />
              <div className="itor-popover-info">
                <h4>Itor - Code Reviewer</h4>
                <p className="itor-status-text">Status: {itorStatus}</p>
              </div>
            </div>
            <div className="itor-popover-stats">
              <div className="itor-stat">
                <span className="itor-stat-label">Reviews</span>
                <span className="itor-stat-value">{reviewCount}</span>
              </div>
              <div className="itor-stat">
                <span className="itor-stat-label">Issues Found</span>
                <span className="itor-stat-value">{issuesFound}</span>
              </div>
            </div>
            {issuesFound > 0 && (
              <div className="itor-popover-alert">
                ⚠️ {issuesFound} issue{issuesFound !== 1 ? 's' : ''} detected
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ItorToolbar;

