import { useState, useEffect, useCallback, memo } from 'react';
import { Minus, Square, X } from 'lucide-react';
import type { WindowControlsAPI } from '@/types/electron';
import { logger } from '../../services/logging/loggerService';
import '../../styles/WindowControls.css';

const WindowControls = memo(function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check initial maximized state
    const checkMaximized = async () => {
      if (typeof window !== 'undefined' && window.windowControls) {
        try {
          const result = await window.windowControls.isMaximized();
          if (result.success) {
            setIsMaximized(result.isMaximized);
          }
        } catch (error) {
          logger.error('Failed to check window state:', { error });
        }
      }
    };
    checkMaximized();

    // Listen for maximize/unmaximize events (if Electron provides them)
    // Note: We'll poll periodically or rely on user clicks for now
  }, []);

  const handleMinimize = useCallback(async () => {
    if (typeof window !== 'undefined' && window.windowControls) {
      try {
        await window.windowControls.minimize();
      } catch (error) {
        logger.error('Failed to minimize window:', { error });
      }
    }
  }, []);

  const handleMaximize = useCallback(async () => {
    if (typeof window !== 'undefined' && window.windowControls) {
      try {
        const result = await window.windowControls.maximize();
        if (result.success) {
          setIsMaximized(result.isMaximized);
        }
      } catch (error) {
        logger.error('Failed to maximize window:', { error });
      }
    }
  }, []);

  const handleClose = useCallback(async () => {
    if (typeof window !== 'undefined' && window.windowControls) {
      try {
        await window.windowControls.close();
      } catch (error) {
        logger.error('Failed to close window:', { error });
      }
    }
  }, []);

  if (typeof window === 'undefined' || !window.windowControls) {
    return null; // Not in Electron environment
  }

  return (
    <div className="window-controls">
      <button
        className="window-control-btn minimize-btn"
        onClick={handleMinimize}
        title="Minimize"
      >
        <Minus size={14} />
      </button>
      <button
        className="window-control-btn maximize-btn"
        onClick={handleMaximize}
        title={isMaximized ? 'Restore' : 'Maximize'}
      >
        <Square size={12} />
      </button>
      <button
        className="window-control-btn close-btn"
        onClick={handleClose}
        title="Close"
      >
        <X size={14} />
      </button>
    </div>
  );
});

export default WindowControls;

