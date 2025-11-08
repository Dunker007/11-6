import { useState, useRef, useEffect, ReactNode } from 'react';
import '../../styles/DraggableWidget.css';

interface DraggableWidgetProps {
  children: ReactNode;
  defaultPosition?: { x: number; y: number };
  storageKey: string; // Key for localStorage persistence
  className?: string;
}

export default function DraggableWidget({ 
  children, 
  defaultPosition = { x: 20, y: 20 },
  storageKey,
  className = ''
}: DraggableWidgetProps) {
  const [position, setPosition] = useState<{ x: number; y: number }>(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  // Load saved position from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`widget-position-${storageKey}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPosition(parsed);
      } catch (e) {
        console.error('Failed to parse saved widget position:', e);
      }
    }
  }, [storageKey]);

  // Save position to localStorage
  const savePosition = (pos: { x: number; y: number }) => {
    localStorage.setItem(`widget-position-${storageKey}`, JSON.stringify(pos));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on left mouse button
    if (e.button !== 0) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;

      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      const newX = dragRef.current.initialX + deltaX;
      const newY = dragRef.current.initialY + deltaY;

      // Keep widget within viewport bounds
      const widget = widgetRef.current;
      if (widget) {
        const maxX = window.innerWidth - widget.offsetWidth;
        const maxY = window.innerHeight - widget.offsetHeight;
        
        const boundedX = Math.max(0, Math.min(newX, maxX));
        const boundedY = Math.max(0, Math.min(newY, maxY));
        
        setPosition({ x: boundedX, y: boundedY });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        
        // Snap to nearest edge if close
        const widget = widgetRef.current;
        if (widget) {
          const snapThreshold = 30;
          const newPos = { ...position };
          
          if (position.x < snapThreshold) newPos.x = 20;
          if (position.y < snapThreshold) newPos.y = 20;
          
          const maxX = window.innerWidth - widget.offsetWidth;
          const maxY = window.innerHeight - widget.offsetHeight;
          
          if (position.x > maxX - snapThreshold) newPos.x = maxX - 20;
          if (position.y > maxY - snapThreshold) newPos.y = maxY - 20;
          
          setPosition(newPos);
          savePosition(newPos);
        } else {
          savePosition(position);
        }
        
        dragRef.current = null;
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);

  return (
    <div
      ref={widgetRef}
      className={`draggable-widget ${className} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div 
        ref={dragHandleRef}
        className="drag-handle"
        onMouseDown={handleMouseDown}
        title="Drag to reposition"
      />
      {children}
    </div>
  );
}

