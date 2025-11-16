/**
 * DebuggerPanel.tsx
 * 
 * PURPOSE:
 * Main debugging panel component that combines breakpoint management,
 * variable inspection, and call stack visualization.
 * 
 * ARCHITECTURE:
 * React component that orchestrates debugging features:
 * - debuggerService: CDP operations
 * - VariableInspector: Variable display
 * - CallStack: Call stack display
 * - Breakpoint management UI
 * 
 * Features:
 * - CDP connection management
 * - Breakpoint list and management
 * - Variable inspection
 * - Call stack visualization
 * - Step controls (over, into, out, resume, pause)
 * 
 * CURRENT STATUS:
 * ✅ CDP connection
 * ✅ Breakpoint management
 * ✅ Variable inspection
 * ✅ Call stack
 * ✅ Step controls
 * 
 * DEPENDENCIES:
 * - debuggerService: Debugging operations
 * - VariableInspector: Variable display
 * - CallStack: Call stack display
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import DebuggerPanel from '@/components/Debugging/DebuggerPanel';
 * 
 * <DebuggerPanel />
 * ```
 */

import { useState, useEffect } from 'react';
import { debuggerService, type Breakpoint } from '@/services/debugging/debuggerService';
import VariableInspector from './VariableInspector';
import CallStack from './CallStack';
import { 
  Play, 
  Pause, 
  StepOver, 
  StepInto, 
  StepOut, 
  Power, 
  PowerOff,
  Circle,
  X
} from 'lucide-react';
import '../../styles/DebuggerPanel.css';

function DebuggerPanel() {
  const [isConnected, setIsConnected] = useState(false);
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([]);
  const [selectedCallFrame, setSelectedCallFrame] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Check connection status
    setIsConnected(debuggerService.getIsConnected());
    setBreakpoints(debuggerService.getBreakpoints());

    // Subscribe to events
    const unsubscribeConnected = debuggerService.on('connected', () => {
      setIsConnected(true);
    });

    const unsubscribeDisconnected = debuggerService.on('disconnected', () => {
      setIsConnected(false);
      setBreakpoints([]);
    });

    const unsubscribeBreakpointAdded = debuggerService.on('breakpointAdded', () => {
      setBreakpoints(debuggerService.getBreakpoints());
    });

    const unsubscribeBreakpointRemoved = debuggerService.on('breakpointRemoved', () => {
      setBreakpoints(debuggerService.getBreakpoints());
    });

    const unsubscribePaused = debuggerService.on('paused', () => {
      setIsPaused(true);
    });

    const unsubscribeResumed = debuggerService.on('resumed', () => {
      setIsPaused(false);
    });

    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeBreakpointAdded();
      unsubscribeBreakpointRemoved();
      unsubscribePaused();
      unsubscribeResumed();
    };
  }, []);

  const handleConnect = async () => {
    const result = await debuggerService.connect(9222);
    if (!result.success) {
      alert(`Failed to connect: ${result.error}`);
    }
  };

  const handleDisconnect = async () => {
    await debuggerService.disconnect();
  };

  const handleResume = async () => {
    await debuggerService.resume();
  };

  const handlePause = async () => {
    await debuggerService.pause();
  };

  const handleStepOver = async () => {
    await debuggerService.stepOver();
  };

  const handleStepInto = async () => {
    await debuggerService.stepInto();
  };

  const handleStepOut = async () => {
    await debuggerService.stepOut();
  };

  const handleRemoveBreakpoint = async (breakpointId: string) => {
    await debuggerService.removeBreakpoint(breakpointId);
  };

  return (
    <div className="debugger-panel">
      <div className="debugger-header">
        <h2>Debugger</h2>
        <div className="connection-controls">
          {!isConnected ? (
            <button onClick={handleConnect} className="connect-btn">
              <Power size={16} />
              Connect
            </button>
          ) : (
            <button onClick={handleDisconnect} className="disconnect-btn">
              <PowerOff size={16} />
              Disconnect
            </button>
          )}
        </div>
      </div>

      {isConnected && (
        <>
          <div className="debug-controls">
            <button
              onClick={isPaused ? handleResume : handlePause}
              className="control-btn"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play size={18} /> : <Pause size={18} />}
            </button>
            <button onClick={handleStepOver} className="control-btn" title="Step Over" disabled={!isPaused}>
              <StepOver size={18} />
            </button>
            <button onClick={handleStepInto} className="control-btn" title="Step Into" disabled={!isPaused}>
              <StepInto size={18} />
            </button>
            <button onClick={handleStepOut} className="control-btn" title="Step Out" disabled={!isPaused}>
              <StepOut size={18} />
            </button>
          </div>

          <div className="debugger-content">
            <div className="debugger-left">
              <div className="breakpoints-section">
                <h3>Breakpoints</h3>
                <div className="breakpoints-list">
                  {breakpoints.length === 0 ? (
                    <div className="empty-state">No breakpoints</div>
                  ) : (
                    breakpoints.map((bp) => (
                      <div key={bp.id} className="breakpoint-item">
                        <Circle size={12} className="breakpoint-icon" />
                        <span className="breakpoint-location">
                          {bp.filePath}:{bp.line}
                        </span>
                        <button
                          onClick={() => handleRemoveBreakpoint(bp.id)}
                          className="remove-breakpoint-btn"
                          title="Remove breakpoint"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <CallStack onFrameSelect={(frame) => setSelectedCallFrame(frame.id)} />
            </div>

            <div className="debugger-right">
              <VariableInspector callFrameId={selectedCallFrame || undefined} />
            </div>
          </div>
        </>
      )}

      {!isConnected && (
        <div className="not-connected-state">
          <p>Connect to CDP endpoint to start debugging</p>
          <p className="hint">Default port: 9222</p>
        </div>
      )}
    </div>
  );
}

export default DebuggerPanel;

