import { useState, useEffect } from 'react';
import { Minus, Square, X } from 'lucide-react';
import '../../styles/WindowControls.css';

function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check initial maximized state
    const checkMaximized = async () => {
      if (typeof window !== 'undefined' && (window as any).windowControls) {
        try {
          const result = await (window as any).windowControls.isMaximized();
          if (result.success) {
            setIsMaximized(result.isMaximized);
          }
        } catch (error) {
          console.error('Failed to check window state:', error);
        }
      }
    };
    checkMaximized();

    // Listen for maximize/unmaximize events (if Electron provides them)
    // Note: We'll poll periodically or rely on user clicks for now
  }, []);

  const handleMinimize = async () => {
    if (typeof window !== 'undefined' && (window as any).windowControls) {
      try {
        await (window as any).windowControls.minimize();
      } catch (error) {
        console.error('Failed to minimize window:', error);
      }
    }
  };

  const handleMaximize = async () => {
    if (typeof window !== 'undefined' && (window as any).windowControls) {
      try {
        const result = await (window as any).windowControls.maximize();
        if (result.success) {
          setIsMaximized(result.isMaximized);
        }
      } catch (error) {
        console.error('Failed to maximize window:', error);
      }
    }
  };

  const handleClose = async () => {
    if (typeof window !== 'undefined' && (window as any).windowControls) {
      try {
        await (window as any).windowControls.close();
      } catch (error) {
        console.error('Failed to close window:', error);
      }
    }
  };

  if (typeof window === 'undefined' || !(window as any).windowControls) {
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
}

export default WindowControls;

