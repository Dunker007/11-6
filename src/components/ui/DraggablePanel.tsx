/**
 * DraggablePanel.tsx
 * 
 * Reusable draggable panel wrapper component.
 * Provides drag-to-move functionality and consistent close button.
 * 
 * Features:
 * - Click and drag title bar to move panel
 * - Close button in header
 * - Bounds checking (stays on screen)
 * - Position persistence (localStorage)
 * - Smooth animations
 * - Snap to edges
 */

import { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { X, GripHorizontal } from 'lucide-react';
import '@/styles/DraggablePanel.css';

interface DraggablePanelProps {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  storageKey?: string; // For persisting position
  className?: string;
  showCloseButton?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

interface Position {
  x: number;
  y: number;
}

const SNAP_THRESHOLD = 20; // pixels from edge to snap
const BOUNDS_PADDING = 10; // min pixels visible on screen

export default function DraggablePanel({
  title,
  children,
  onClose,
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 600, height: 400 },
  storageKey,
  className = '',
  showCloseButton = true,
  minWidth = 300,
  minHeight = 200,
  maxWidth,
  maxHeight,
}: DraggablePanelProps) {
  // Load saved position from localStorage
  const getSavedPosition = useCallback((): Position => {
    if (!storageKey) return defaultPosition;
    try {
      const saved = localStorage.getItem(`panel-position-${storageKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { x: parsed.x, y: parsed.y };
      }
    } catch (e) {
      console.warn('Failed to load saved position:', e);
    }
    return defaultPosition;
  }, [storageKey, defaultPosition]);

  const [position, setPosition] = useState<Position>(getSavedPosition);
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Save position to localStorage
  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(`panel-position-${storageKey}`, JSON.stringify(position));
    } catch (e) {
      console.warn('Failed to save position:', e);
    }
  }, [position, storageKey]);

  // Constrain position to window bounds
  const constrainPosition = useCallback((pos: Position): Position => {
    const panel = panelRef.current;
    if (!panel) return pos;

    const rect = panel.getBoundingClientRect();
    const maxX = window.innerWidth - BOUNDS_PADDING;
    const maxY = window.innerHeight - BOUNDS_PADDING;

    let { x, y } = pos;

    // Keep panel mostly on screen
    if (x < -rect.width + BOUNDS_PADDING) x = -rect.width + BOUNDS_PADDING;
    if (x > maxX) x = maxX;
    if (y < 0) y = 0;
    if (y > maxY) y = maxY;

    // Snap to edges
    if (Math.abs(x) < SNAP_THRESHOLD) x = 0;
    if (Math.abs(x - (window.innerWidth - rect.width)) < SNAP_THRESHOLD) {
      x = window.innerWidth - rect.width;
    }
    if (Math.abs(y) < SNAP_THRESHOLD) y = 0;
    if (Math.abs(y - (window.innerHeight - rect.height)) < SNAP_THRESHOLD) {
      y = window.innerHeight - rect.height;
    }

    return { x, y };
  }, []);

  // Mouse down on title bar - start drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag if clicking on title bar, not buttons
    if ((e.target as HTMLElement).closest('button')) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }, [position]);

  // Mouse move - update position
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };
      setPosition(constrainPosition(newPosition));
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
  }, [isDragging, dragStart, constrainPosition]);

  // Handle window resize - reposition if needed
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => constrainPosition(prev));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [constrainPosition]);

  return (
    <div
      ref={panelRef}
      className={`draggable-panel ${isDragging ? 'dragging' : ''} ${className}`}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        minWidth: `${minWidth}px`,
        maxWidth: maxWidth ? `${maxWidth}px` : undefined,
        height: `${size.height}px`,
        minHeight: `${minHeight}px`,
        maxHeight: maxHeight ? `${maxHeight}px` : undefined,
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      <div 
        className="draggable-panel-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="draggable-panel-grip">
          <GripHorizontal size={16} />
        </div>
        <h3 className="draggable-panel-title">{title}</h3>
        {showCloseButton && onClose && (
          <button 
            className="draggable-panel-close"
            onClick={onClose}
            title="Close"
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        )}
      </div>
      <div className="draggable-panel-content">
        {children}
      </div>
    </div>
  );
}
