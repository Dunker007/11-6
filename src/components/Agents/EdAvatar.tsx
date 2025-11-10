import { useAgentStore } from '@/services/agents/agentStore';
import { loadEdAsset } from '@/utils/agentAssets';
import type { EdStatus } from '@/types/agents';
import '../../styles/Agents.css';

interface EdAvatarProps {
  status?: EdStatus;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}

function EdAvatar({ 
  status, 
  size = 'md', 
  animated = true,
  className = '' 
}: EdAvatarProps) {
  // Get status from store if not provided
  const storeStatus = useAgentStore((state) => state.edStatus);
  const currentStatus = status || storeStatus;

  // Try to load asset, fallback to placeholder
  const assetPath = loadEdAsset(currentStatus);
  const usePlaceholder = !assetPath;

  return (
    <div 
      className={`ed-avatar ed-avatar-${size} ed-avatar-${currentStatus} ${animated ? 'animated' : ''} ${className}`}
      title={`Ed - ${currentStatus}`}
    >
      {usePlaceholder ? (
        <div className="ed-placeholder">
          {/* Boomhauer-style placeholder: relaxed figure with jean jacket */}
          <div className="ed-head">
            <div className="ed-hair"></div>
            <div className="ed-face">
              <div className="ed-eye ed-eye-left"></div>
              <div className="ed-eye ed-eye-right"></div>
              <div className="ed-mouth"></div>
            </div>
          </div>
          <div className="ed-body">
            <div className="ed-jacket"></div>
            <div className="ed-arm ed-arm-left"></div>
            <div className="ed-arm ed-arm-right"></div>
          </div>
          {/* Status-specific elements */}
          {currentStatus === 'thinking' && <div className="ed-thought-bubble">💭</div>}
          {currentStatus === 'coding' && <div className="ed-code-lines"></div>}
          {currentStatus === 'success' && <div className="ed-thumbs-up">👍</div>}
          {currentStatus === 'error' && <div className="ed-concern">😟</div>}
        </div>
      ) : (
        <img 
          src={assetPath} 
          alt={`Ed - ${currentStatus}`}
          className="ed-asset-image"
        />
      )}
      {/* Warm glow effect */}
      <div className="ed-glow"></div>
    </div>
  );
}

export default EdAvatar;

