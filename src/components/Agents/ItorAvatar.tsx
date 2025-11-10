import { useAgentStore } from '@/services/agents/agentStore';
import { loadItorAsset } from '@/utils/agentAssets';
import type { ItorStatus } from '@/types/agents';
import '../../styles/Agents.css';

interface ItorAvatarProps {
  status?: ItorStatus;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}

function ItorAvatar({ 
  status, 
  size = 'md', 
  animated = true,
  className = '' 
}: ItorAvatarProps) {
  // Get status from store if not provided
  const storeStatus = useAgentStore((state) => state.itorStatus);
  const currentStatus = status || storeStatus;

  // Try to load asset, fallback to placeholder
  const assetPath = loadItorAsset(currentStatus);
  const usePlaceholder = !assetPath;

  return (
    <div 
      className={`itor-avatar itor-avatar-${size} itor-avatar-${currentStatus} ${animated ? 'animated' : ''} ${className}`}
      title={`Itor - ${currentStatus}`}
    >
      {usePlaceholder ? (
        <div className="itor-placeholder">
          {/* Cartoon hawk placeholder: perched bird with sharp eyes */}
          <div className="itor-body">
            <div className="itor-head">
              <div className="itor-beak"></div>
              <div className="itor-eye itor-eye-left"></div>
              <div className="itor-eye itor-eye-right"></div>
              <div className="itor-crest"></div>
            </div>
            <div className="itor-wing itor-wing-left"></div>
            <div className="itor-wing itor-wing-right"></div>
            <div className="itor-tail"></div>
            <div className="itor-talon itor-talon-left"></div>
            <div className="itor-talon itor-talon-right"></div>
          </div>
          {/* Status-specific elements */}
          {currentStatus === 'scanning' && <div className="itor-scan-lines"></div>}
          {currentStatus === 'reviewing' && <div className="itor-review-particles"></div>}
          {currentStatus === 'alert' && <div className="itor-alert-wings"></div>}
          {currentStatus === 'approved' && <div className="itor-checkmark">✓</div>}
          {currentStatus === 'error' && <div className="itor-error-x">✗</div>}
        </div>
      ) : (
        <img 
          src={assetPath} 
          alt={`Itor - ${currentStatus}`}
          className="itor-asset-image"
        />
      )}
      {/* Cool glow effect */}
      <div className="itor-glow"></div>
    </div>
  );
}

export default ItorAvatar;

