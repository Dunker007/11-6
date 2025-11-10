import { useState, useEffect, useRef, useCallback } from 'react';
import { useAgentStore } from '@/services/agents/agentStore';
import { useDebouncedCallback } from '@/utils/hooks/useDebounce';
import ItorAvatar from './ItorAvatar';
import '../../styles/Agents.css';

/**
 * Itor Toolbar Widget
 * Floating, draggable hawk icon widget
 * Shows review status and issue count
 */
function ItorToolbar() {
  const [showPopover, setShowPopover] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  
  const itorStatus = useAgentStore((state) => state.itorStatus);
  const reviewCount = useAgentStore((state) => state.reviewCount);
  const issuesFound = useAgentStore((state) => state.issuesFound);

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('itor-toolbar-position');
    if (savedPosition) {
      try {
        const { x, y } = JSON.parse(savedPosition);
        setPosition({ x, y });
      } catch (e) {
        // Invalid saved position, use default
        setPosition({ x: window.innerWidth - 100, y: 60 });
      }
    } else {
      // Default position: top right
      setPosition({ x: window.innerWidth - 100, y: 60 });
    }
  }, []);

  // Save position to localStorage (debounced to avoid excessive writes)
  const debouncedSavePosition = useDebouncedCallback((pos: { x: number; y: number }) => {
    if (pos.x !== 0 || pos.y !== 0) {
      localStorage.setItem('itor-toolbar-position', JSON.stringify(pos));
    }
  }, 500);

  useEffect(() => {
    debouncedSavePosition(position);
  }, [position, debouncedSavePosition]);

  // Handle window resize - keep widget in bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 50),
        y: Math.min(prev.y, window.innerHeight - 50),
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start drag if clicking directly on the button
    const target = e.target as HTMLElement;
    if (target.closest('.itor-toolbar-btn')) {
      return;
    }
    
    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStartPos.current.x;
      const newY = e.clientY - dragStartPos.current.y;

      // Keep widget within viewport bounds
      const maxX = window.innerWidth - 50;
      const maxY = window.innerHeight - 50;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const getStatusColor = useCallback(() => {
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
  }, [itorStatus]);

  return (
    <div 
      ref={dragRef}
      className={`itor-toolbar-widget itor-floating ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 10002,
      }}
      onMouseDown={handleMouseDown}
    >
      <button
        className="itor-toolbar-btn"
        onClick={() => setShowPopover(!showPopover)}
        onMouseDown={(e) => e.stopPropagation()}
        title={`Itor - ${itorStatus} | Reviews: ${reviewCount} | Issues: ${issuesFound} | Drag to move`}
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

