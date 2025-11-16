/**
 * TabBar.tsx
 * 
 * Tab management component for displaying and managing editor tabs.
 * Supports tab operations: close, pin, context menu, drag & drop.
 */

import { useRef, useState } from 'react';
import { useTabStore } from '@/services/editor/tabStore';
import TechIcon from '../Icons/TechIcon';
import { X, Pin, MoreVertical, Code } from 'lucide-react';
import '@/styles/TabBar.css';

interface TabBarProps {
  paneId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string, e: React.MouseEvent) => void;
  onTabContextMenu?: (tabId: string, x: number, y: number) => void;
}

function TabBar({ paneId, onTabClick, onTabClose, onTabContextMenu }: TabBarProps) {
  const { getTabsByPane, activeTabId, pinTab, unpinTab, closeTab, closeOtherTabs } = useTabStore();
  const [contextMenu, setContextMenu] = useState<{ tabId: string; x: number; y: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const tabs = getTabsByPane(paneId);
  const sortedTabs = [...tabs].sort((a, b) => {
    // Pinned tabs first
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    // Then by last accessed
    return b.lastAccessed - a.lastAccessed;
  });

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onTabContextMenu) {
      onTabContextMenu(tabId, e.clientX, e.clientY);
    } else {
      setContextMenu({ tabId, x: e.clientX, y: e.clientY });
    }
  };

  const handlePin = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const tab = useTabStore.getState().getTab(tabId);
    if (tab?.pinned) {
      unpinTab(tabId);
    } else {
      pinTab(tabId);
    }
  };

  const handleClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onTabClose(tabId, e);
  };

  const handleCloseOthers = (tabId: string) => {
    closeOtherTabs(tabId);
    setContextMenu(null);
  };

  const handleCloseAll = () => {
    const { closeAllTabs } = useTabStore.getState();
    closeAllTabs();
    setContextMenu(null);
  };

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="tab-bar">
      <div className="tab-bar-scroll" ref={scrollRef}>
        {sortedTabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          
          return (
            <div
              key={tab.id}
              className={`editor-tab ${isActive ? 'active' : ''} ${tab.pinned ? 'pinned' : ''} ${tab.isUnsaved ? 'unsaved' : ''}`}
              onClick={() => onTabClick(tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              title={tab.path}
            >
              {tab.pinned && (
                <TechIcon icon={Pin} size={12} glow="none" className="tab-pin-icon" />
              )}
              <TechIcon icon={Code} size={14} glow="none" className="tab-icon" />
              <span className="tab-name">{tab.name}</span>
              {tab.isUnsaved && <span className="unsaved-indicator" />}
              
              <div className="tab-actions">
                <button
                  className="tab-action-btn"
                  onClick={(e) => handlePin(e, tab.id)}
                  title={tab.pinned ? 'Unpin tab' : 'Pin tab'}
                >
                  <TechIcon icon={Pin} size={10} glow="none" />
                </button>
                <button
                  className="tab-action-btn"
                  onClick={(e) => handleClose(e, tab.id)}
                  title="Close tab"
                >
                  <TechIcon icon={X} size={12} glow="none" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {contextMenu && (
        <>
          <div
            className="context-menu-overlay"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="tab-context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="context-menu-item"
              onClick={() => {
                const tab = useTabStore.getState().getTab(contextMenu.tabId);
                if (tab?.pinned) {
                  unpinTab(contextMenu.tabId);
                } else {
                  pinTab(contextMenu.tabId);
                }
                setContextMenu(null);
              }}
            >
              {useTabStore.getState().getTab(contextMenu.tabId)?.pinned ? 'Unpin' : 'Pin'} Tab
            </button>
            <button
              className="context-menu-item"
              onClick={() => handleCloseOthers(contextMenu.tabId)}
            >
              Close Others
            </button>
            <button
              className="context-menu-item"
              onClick={handleCloseAll}
            >
              Close All
            </button>
            <div className="context-menu-divider" />
            <button
              className="context-menu-item danger"
              onClick={(e) => {
                handleClose(e, contextMenu.tabId);
                setContextMenu(null);
              }}
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default TabBar;

