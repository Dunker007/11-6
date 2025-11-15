/**
 * EdAvatar.tsx
 * 
 * PURPOSE:
 * Avatar component for the Ed AI agent (Vibed Ed). Displays animated avatar with status-based
 * visuals. Shows different states (idle, coding, thinking, success, error) with corresponding
 * animations and assets. Fallback to CSS-based placeholder if assets unavailable.
 * 
 * ARCHITECTURE:
 * Simple presentational component that:
 * - Displays Ed avatar based on status
 * - Loads status-specific assets
 * - Falls back to CSS placeholder
 * - Supports multiple sizes
 * - Optional animations
 * 
 * CURRENT STATUS:
 * ✅ Status-based avatar display
 * ✅ Asset loading with fallback
 * ✅ CSS placeholder (Boomhauer-style)
 * ✅ Multiple size options
 * ✅ Animation support
 * ✅ Status from store or props
 * 
 * DEPENDENCIES:
 * - useAgentStore: Ed status from store
 * - loadEdAsset: Asset loading utility
 * - @/types/agents: EdStatus type
 * 
 * STATE MANAGEMENT:
 * - Gets status from Zustand store (or props)
 * - No local state
 * 
 * PERFORMANCE:
 * - Lightweight component
 * - Efficient asset loading
 * - CSS-based fallback
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import EdAvatar from '@/components/Agents/EdAvatar';
 * 
 * function AIAssistant() {
 *   return <EdAvatar status="coding" size="lg" animated={true} />;
 * }
 * ```
 * 
 * RELATED FILES:
 * - src/services/agents/agentStore.ts: Status source
 * - src/utils/agentAssets.ts: Asset loading
 * - src/components/AIAssistant/AIAssistant.tsx: Uses this component
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - More status animations
 * - Custom avatar themes
 * - Avatar customization
 * - Status transitions
 */
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

