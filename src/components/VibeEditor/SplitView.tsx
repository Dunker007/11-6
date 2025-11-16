/**
 * SplitView.tsx
 * 
 * Split view container component supporting horizontal/vertical splits with resize handles.
 * Manages multiple editor panes in a tree structure.
 */

import { useState, useRef, useCallback } from 'react';
import { useTabStore } from '@/services/editor/tabStore';
import type { EditorPane, SplitDirection } from '@/types/editor';
import EditorPane from './EditorPane';
import TechIcon from '../Icons/TechIcon';
import { GripVertical, GripHorizontal, Split, X } from 'lucide-react';
import '@/styles/SplitView.css';

interface SplitViewProps {
  onSplit?: (paneId: string, direction: SplitDirection) => void;
}

function SplitView({ onSplit }: SplitViewProps) {
  const { splitView, splitPane, closePane } = useTabStore();
  const [resizing, setResizing] = useState<{ paneId: string; startX?: number; startY?: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSplit = useCallback((paneId: string, direction: SplitDirection) => {
    splitPane(paneId, direction);
    if (onSplit) {
      onSplit(paneId, direction);
    }
  }, [splitPane, onSplit]);

  const handleMouseDown = (e: React.MouseEvent, paneId: string, isHorizontal: boolean) => {
    e.preventDefault();
    setResizing({
      paneId,
      [isHorizontal ? 'startY' : 'startX']: isHorizontal ? e.clientY : e.clientX,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizing || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Find the pane being resized and its sibling
    const findPaneAndSibling = (pane: EditorPane, parent?: EditorPane): { pane: EditorPane; sibling: EditorPane; parent: EditorPane; index: number } | null => {
      if (pane.children) {
        for (let i = 0; i < pane.children.length; i++) {
          const child = pane.children[i];
          if (child.id === resizing.paneId && i > 0) {
            return { pane: child, sibling: pane.children[i - 1], parent: pane, index: i };
          }
          if (child.id === resizing.paneId && i < pane.children.length - 1) {
            return { pane: child, sibling: pane.children[i + 1], parent: pane, index: i };
          }
          
          const result = findPaneAndSibling(child, pane);
          if (result) return result;
        }
      }
      return null;
    };

    if (!splitView) return;
    
    const result = findPaneAndSibling(splitView.rootPane);
    if (!result) return;

    const { parent, index } = result;
    const isHorizontal = parent.splitDirection === 'horizontal';
    const currentPos = isHorizontal ? e.clientY : e.clientX;
    const containerPos = isHorizontal ? rect.top : rect.left;
    const containerSize = isHorizontal ? rect.height : rect.width;
    
    const relativePos = currentPos - containerPos;
    const percentage = (relativePos / containerSize) * 100;
    
    // Update pane sizes
    if (parent.children) {
      const newSizes = [...parent.children];
      const clampedPercentage = Math.max(10, Math.min(90, percentage));
      
      newSizes[index - 1] = { ...newSizes[index - 1], size: clampedPercentage };
      newSizes[index] = { ...newSizes[index], size: 100 - clampedPercentage };
      
      // Update the split view structure
      const updatePane = (pane: EditorPane): EditorPane => {
        if (pane.id === parent.id) {
          return {
            ...pane,
            children: newSizes,
          };
        }
        
        if (pane.children) {
          return {
            ...pane,
            children: pane.children.map(updatePane),
          };
        }
        
        return pane;
      };
      
      // Update via store
      const currentState = useTabStore.getState();
      if (currentState.splitView) {
        const newRootPane = updatePane(currentState.splitView.rootPane);
        useTabStore.setState({
          splitView: {
            ...currentState.splitView,
            rootPane: newRootPane,
          },
        });
      }
    }
  }, [resizing, splitView]);

  const handleMouseUp = useCallback(() => {
    setResizing(null);
  }, []);

  useEffect(() => {
    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizing, handleMouseMove, handleMouseUp]);

  const renderPane = (pane: EditorPane, depth = 0): JSX.Element | null => {
    if (pane.children && pane.children.length > 0) {
      // Split container
      const isHorizontal = pane.splitDirection === 'horizontal';
      const directionClass = isHorizontal ? 'split-horizontal' : 'split-vertical';
      
      return (
        <div key={pane.id} className={`split-container ${directionClass}`}>
          {pane.children.map((child, index) => {
            const childPane = renderPane(child, depth + 1);
            const size = child.size || (100 / pane.children!.length);
            
            return (
              <div key={child.id} style={{ [isHorizontal ? 'height' : 'width']: `${size}%` }}>
                {childPane}
                {index < pane.children!.length - 1 && (
                  <div
                    className={`split-handle ${isHorizontal ? 'handle-horizontal' : 'handle-vertical'} ${resizing?.paneId === child.id ? 'resizing' : ''}`}
                    onMouseDown={(e) => handleMouseDown(e, child.id, isHorizontal)}
                  >
                    {isHorizontal ? (
                      <TechIcon icon={GripHorizontal} size={16} glow="none" />
                    ) : (
                      <TechIcon icon={GripVertical} size={16} glow="none" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    
    // Leaf pane (editor)
    return (
      <div key={pane.id} className="split-pane">
        <EditorPane
          paneId={pane.id}
          onSplit={(direction) => handleSplit(pane.id, direction)}
        />
      </div>
    );
  };

  if (!splitView) {
    return (
      <div className="split-view empty">
        <div className="empty-state">
          <p>No editor panes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="split-view" ref={containerRef}>
      {renderPane(splitView.rootPane)}
    </div>
  );
}

export default SplitView;

