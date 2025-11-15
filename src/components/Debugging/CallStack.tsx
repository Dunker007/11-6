/**
 * CallStack.tsx
 * 
 * PURPOSE:
 * Component for displaying the call stack during debugging. Shows the
 * execution flow with function names and source locations.
 * 
 * ARCHITECTURE:
 * React component that uses debuggerService to get call stack information:
 * - debuggerService: Retrieves call stack via CDP
 * - Frame selection for variable inspection
 * - Source location navigation
 * 
 * Features:
 * - Call stack display
 * - Frame selection
 * - Source location display
 * - Navigation to source
 * 
 * CURRENT STATUS:
 * ✅ Call stack display
 * ✅ Frame selection
 * ✅ Source location
 * 
 * DEPENDENCIES:
 * - debuggerService: Debugging operations
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import CallStack from '@/components/Debugging/CallStack';
 * 
 * <CallStack onFrameSelect={(frame) => console.log(frame)} />
 * ```
 */

import { useState, useEffect } from 'react';
import { debuggerService, type CallFrame } from '@/services/debugging/debuggerService';
import { FileText, MapPin } from 'lucide-react';
import '../../styles/CallStack.css';

export interface CallStackProps {
  onFrameSelect?: (frame: CallFrame) => void;
}

function CallStack({ onFrameSelect }: CallStackProps) {
  const [callFrames, setCallFrames] = useState<CallFrame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);

  useEffect(() => {
    loadCallStack();
  }, []);

  const loadCallStack = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await debuggerService.getCallStack();
      if (result.success && result.callFrames) {
        setCallFrames(result.callFrames);
        if (result.callFrames.length > 0) {
          setSelectedFrame(result.callFrames[0].id);
        }
      } else {
        setError(result.error || 'Failed to load call stack');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFrameClick = (frame: CallFrame) => {
    setSelectedFrame(frame.id);
    onFrameSelect?.(frame);
  };

  return (
    <div className="call-stack">
      <div className="stack-header">
        <h3>Call Stack</h3>
        <button onClick={loadCallStack} className="refresh-btn" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {isLoading && callFrames.length === 0 ? (
        <div className="loading-state">Loading call stack...</div>
      ) : callFrames.length === 0 ? (
        <div className="empty-state">
          <p>No call stack available</p>
        </div>
      ) : (
        <div className="stack-frames">
          {callFrames.map((frame, index) => {
            const isSelected = selectedFrame === frame.id;
            return (
              <div
                key={frame.id}
                className={`stack-frame ${isSelected ? 'selected' : ''}`}
                onClick={() => handleFrameClick(frame)}
              >
                <div className="frame-index">#{index}</div>
                <div className="frame-info">
                  <div className="frame-function">
                    <FileText size={14} />
                    <span>{frame.functionName || '<anonymous>'}</span>
                  </div>
                  <div className="frame-location">
                    <MapPin size={12} />
                    <span>
                      {frame.location.file}:{frame.location.line}:{frame.location.column}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CallStack;

