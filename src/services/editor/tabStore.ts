/**
 * tabStore.ts
 * 
 * Zustand store for managing editor tabs, split views, and multi-file editing state.
 */

import { create } from 'zustand';
import type { EditorTab, EditorPane, TabGroup, SplitViewState, SplitDirection } from '@/types/editor';
import { useProjectStore } from '../project/projectStore';

interface TabStore {
  // Tab management
  tabs: Map<string, EditorTab>; // tabId -> EditorTab
  openTabs: Set<string>; // Set of open tab IDs
  activeTabId: string | null;
  tabGroups: TabGroup[];
  
  // Split view management
  splitView: SplitViewState | null;
  maxPanes: number;
  
  // Tab operations
  openTab: (path: string) => string; // Returns tab ID
  closeTab: (tabId: string) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (keepTabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string, isUnsaved?: boolean) => void;
  pinTab: (tabId: string) => void;
  unpinTab: (tabId: string) => void;
  
  // Pane operations
  splitPane: (paneId: string, direction: SplitDirection) => void;
  closePane: (paneId: string) => void;
  setActivePane: (paneId: string) => void;
  moveTabToPane: (tabId: string, targetPaneId: string) => void;
  
  // Tab group operations
  createTabGroup: (name: string) => string;
  addTabToGroup: (tabId: string, groupId: string) => void;
  
  // Getters
  getTab: (tabId: string) => EditorTab | undefined;
  getActiveTab: () => EditorTab | null;
  getTabsByPane: (paneId: string) => EditorTab[];
  getPaneById: (paneId: string) => EditorPane | null;
}

const generateTabId = (path: string): string => {
  return `tab-${path.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
};

const generatePaneId = (): string => {
  return `pane-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const detectLanguage = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    html: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
    sql: 'sql',
  };
  return langMap[ext || ''] || 'plaintext';
};

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: new Map(),
  openTabs: new Set(),
  activeTabId: null,
  tabGroups: [],
  splitView: null,
  maxPanes: 4,
  
  openTab: (path: string) => {
    const state = get();
    
    // Check if tab already exists
    for (const [tabId, tab] of state.tabs.entries()) {
      if (tab.path === path) {
        set({ activeTabId: tabId });
        return tabId;
      }
    }
    
    // Create new tab
    const tabId = generateTabId(path);
    const fileName = path.split('/').pop() || path;
    const language = detectLanguage(path);
    
    // Get file content from project store
    const { getFileContent } = useProjectStore.getState();
    const content = getFileContent(path) || '';
    const preview = content.split('\n')[0].substring(0, 50) || '';
    
    const newTab: EditorTab = {
      id: tabId,
      path,
      name: fileName,
      language,
      isUnsaved: false,
      pinned: false,
      preview,
      lastAccessed: Date.now(),
    };
    
    const newTabs = new Map(state.tabs);
    newTabs.set(tabId, newTab);
    const newOpenTabs = new Set(state.openTabs);
    newOpenTabs.add(tabId);
    
    // Initialize split view if not exists
    let newSplitView = state.splitView;
    if (!newSplitView) {
      const rootPaneId = generatePaneId();
      const rootPane: EditorPane = {
        id: rootPaneId,
        tabs: [newTab],
        activeTabId: tabId,
        size: 100,
      };
      newSplitView = {
        rootPane,
        activePaneId: rootPaneId,
        maxPanes: state.maxPanes,
      };
    } else {
      // Add tab to active pane
      const activePane = get().getPaneById(newSplitView.activePaneId);
      if (activePane) {
        activePane.tabs.push(newTab);
        activePane.activeTabId = tabId;
      }
    }
    
    set({
      tabs: newTabs,
      openTabs: newOpenTabs,
      activeTabId: tabId,
      splitView: newSplitView,
    });
    
    return tabId;
  },
  
  closeTab: (tabId: string) => {
    const state = get();
    const tab = state.tabs.get(tabId);
    if (!tab) return;
    
    // Check if unsaved
    if (tab.isUnsaved) {
      const confirmed = confirm(`Close unsaved file "${tab.name}"?`);
      if (!confirmed) return;
    }
    
    const newTabs = new Map(state.tabs);
    newTabs.delete(tabId);
    const newOpenTabs = new Set(state.openTabs);
    newOpenTabs.delete(tabId);
    
    // Remove from pane
    if (state.splitView) {
      const removeFromPane = (pane: EditorPane): EditorPane => {
        if (pane.children) {
          return {
            ...pane,
            children: pane.children.map(removeFromPane),
          };
        }
        
        const newTabs = pane.tabs.filter(t => t.id !== tabId);
        let newActiveTabId = pane.activeTabId;
        
        if (pane.activeTabId === tabId) {
          // Activate another tab in this pane
          if (newTabs.length > 0) {
            // Prefer pinned tabs, then most recently accessed
            const sorted = [...newTabs].sort((a, b) => {
              if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
              return b.lastAccessed - a.lastAccessed;
            });
            newActiveTabId = sorted[0].id;
          } else {
            newActiveTabId = null;
          }
        }
        
        return {
          ...pane,
          tabs: newTabs,
          activeTabId: newActiveTabId,
        };
      };
      
      const newRootPane = removeFromPane(state.splitView.rootPane);
      let newActiveTabId = state.activeTabId;
      
      if (state.activeTabId === tabId && newRootPane.tabs.length > 0) {
        // Find next active tab
        const allTabs = getAllTabsFromPane(newRootPane);
        if (allTabs.length > 0) {
          const sorted = [...allTabs].sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return b.lastAccessed - a.lastAccessed;
          });
          newActiveTabId = sorted[0].id;
          state.setActiveTab(newActiveTabId);
        } else {
          newActiveTabId = null;
        }
      }
      
      set({
        tabs: newTabs,
        openTabs: newOpenTabs,
        activeTabId: newActiveTabId,
        splitView: {
          ...state.splitView,
          rootPane: newRootPane,
        },
      });
    } else {
      set({
        tabs: newTabs,
        openTabs: newOpenTabs,
        activeTabId: null,
      });
    }
  },
  
  closeAllTabs: () => {
    const state = get();
    const unsavedTabs = Array.from(state.tabs.values()).filter(t => t.isUnsaved);
    
    if (unsavedTabs.length > 0) {
      const confirmed = confirm(`Close ${unsavedTabs.length} unsaved file(s)?`);
      if (!confirmed) return;
    }
    
    set({
      tabs: new Map(),
      openTabs: new Set(),
      activeTabId: null,
      splitView: null,
    });
  },
  
  closeOtherTabs: (keepTabId: string) => {
    const state = get();
    const tabsToClose = Array.from(state.openTabs).filter(id => id !== keepTabId);
    const unsavedTabs = tabsToClose
      .map(id => state.tabs.get(id))
      .filter((tab): tab is EditorTab => tab !== undefined && tab.isUnsaved);
    
    if (unsavedTabs.length > 0) {
      const confirmed = confirm(`Close ${unsavedTabs.length} unsaved file(s)?`);
      if (!confirmed) return;
    }
    
    const newTabs = new Map();
    const tabToKeep = state.tabs.get(keepTabId);
    if (tabToKeep) {
      newTabs.set(keepTabId, tabToKeep);
    }
    
    // Update split view to only have this tab
    if (state.splitView && tabToKeep) {
      const rootPaneId = generatePaneId();
      const rootPane: EditorPane = {
        id: rootPaneId,
        tabs: [tabToKeep],
        activeTabId: keepTabId,
        size: 100,
      };
      
      set({
        tabs: newTabs,
        openTabs: new Set([keepTabId]),
        activeTabId: keepTabId,
        splitView: {
          rootPane,
          activePaneId: rootPaneId,
          maxPanes: state.maxPanes,
        },
      });
    } else {
      set({
        tabs: newTabs,
        openTabs: new Set([keepTabId]),
        activeTabId: keepTabId,
      });
    }
  },
  
  setActiveTab: (tabId: string) => {
    const state = get();
    const tab = state.tabs.get(tabId);
    if (!tab) return;
    
    // Update last accessed time
    const updatedTab = { ...tab, lastAccessed: Date.now() };
    const newTabs = new Map(state.tabs);
    newTabs.set(tabId, updatedTab);
    
    // Update active tab in pane
    if (state.splitView) {
      const updatePane = (pane: EditorPane): EditorPane => {
        if (pane.children) {
          return {
            ...pane,
            children: pane.children.map(updatePane),
          };
        }
        
        if (pane.tabs.some(t => t.id === tabId)) {
          return {
            ...pane,
            activeTabId: tabId,
          };
        }
        
        return pane;
      };
      
      const newRootPane = updatePane(state.splitView.rootPane);
      const pane = get().getPaneById(newRootPane.id);
      let activePaneId = state.splitView.activePaneId;
      if (pane && pane.tabs.some(t => t.id === tabId)) {
        activePaneId = pane.id;
      }
      
      set({
        tabs: newTabs,
        activeTabId: tabId,
        splitView: {
          ...state.splitView,
          rootPane: newRootPane,
          activePaneId,
        },
      });
    } else {
      set({
        tabs: newTabs,
        activeTabId: tabId,
      });
    }
  },
  
  updateTabContent: (tabId: string, content: string, isUnsaved = true) => {
    const state = get();
    const tab = state.tabs.get(tabId);
    if (!tab) return;
    
    const preview = content.split('\n')[0].substring(0, 50) || '';
    const updatedTab: EditorTab = {
      ...tab,
      preview,
      isUnsaved,
      lastAccessed: Date.now(),
    };
    
    const newTabs = new Map(state.tabs);
    newTabs.set(tabId, updatedTab);
    
    set({ tabs: newTabs });
  },
  
  pinTab: (tabId: string) => {
    const state = get();
    const tab = state.tabs.get(tabId);
    if (!tab) return;
    
    const updatedTab = { ...tab, pinned: true };
    const newTabs = new Map(state.tabs);
    newTabs.set(tabId, updatedTab);
    
    set({ tabs: newTabs });
  },
  
  unpinTab: (tabId: string) => {
    const state = get();
    const tab = state.tabs.get(tabId);
    if (!tab) return;
    
    const updatedTab = { ...tab, pinned: false };
    const newTabs = new Map(state.tabs);
    newTabs.set(tabId, updatedTab);
    
    set({ tabs: newTabs });
  },
  
  splitPane: (paneId: string, direction: SplitDirection) => {
    const state = get();
    if (!state.splitView) return;
    
    // Check max panes
    const paneCount = countPanes(state.splitView.rootPane);
    if (paneCount >= state.maxPanes) {
      console.warn(`Maximum ${state.maxPanes} panes reached`);
      return;
    }
    
    const splitPaneRecursive = (pane: EditorPane): EditorPane => {
      if (pane.id === paneId) {
        // Split this pane
        const newPaneId = generatePaneId();
        const activeTab = pane.tabs.find(t => t.id === pane.activeTabId);
        const otherTabs = pane.tabs.filter(t => t.id !== pane.activeTabId);
        
        const newPane: EditorPane = {
          id: newPaneId,
          tabs: activeTab ? [activeTab] : [],
          activeTabId: activeTab?.id || null,
          size: 50,
        };
        
        return {
          id: pane.id,
          tabs: otherTabs,
          activeTabId: otherTabs[0]?.id || null,
          splitDirection: direction,
          children: [
            {
              ...pane,
              tabs: otherTabs,
              size: 50,
            },
            newPane,
          ],
          size: undefined,
        };
      }
      
      if (pane.children) {
        return {
          ...pane,
          children: pane.children.map(splitPaneRecursive),
        };
      }
      
      return pane;
    };
    
    const newRootPane = splitPaneRecursive(state.splitView.rootPane);
    
    set({
      splitView: {
        ...state.splitView,
        rootPane: newRootPane,
      },
    });
  },
  
  closePane: (paneId: string) => {
    const state = get();
    if (!state.splitView) return;
    
    const closePaneRecursive = (pane: EditorPane): EditorPane | null => {
      if (pane.children) {
        const updatedChildren = pane.children
          .map(closePaneRecursive)
          .filter((p): p is EditorPane => p !== null);
        
        if (updatedChildren.length === 0) {
          return null;
        }
        
        if (updatedChildren.length === 1) {
          return updatedChildren[0];
        }
        
        return {
          ...pane,
          children: updatedChildren,
        };
      }
      
      if (pane.id === paneId) {
        return null;
      }
      
      return pane;
    };
    
    const newRootPane = closePaneRecursive(state.splitView.rootPane);
    
    if (!newRootPane) {
      set({ splitView: null });
      return;
    }
    
    set({
      splitView: {
        ...state.splitView,
        rootPane: newRootPane,
      },
    });
  },
  
  setActivePane: (paneId: string) => {
    const state = get();
    if (!state.splitView) return;
    
    const pane = get().getPaneById(paneId);
    if (pane && pane.activeTabId) {
      state.setActiveTab(pane.activeTabId);
    }
    
    set({
      splitView: {
        ...state.splitView,
        activePaneId: paneId,
      },
    });
  },
  
  moveTabToPane: (tabId: string, targetPaneId: string) => {
    const state = get();
    if (!state.splitView) return;
    
    const tab = state.tabs.get(tabId);
    if (!tab) return;
    
    // Remove from current pane
    const removeFromPane = (pane: EditorPane): EditorPane => {
      if (pane.children) {
        return {
          ...pane,
          children: pane.children.map(removeFromPane),
        };
      }
      
      return {
        ...pane,
        tabs: pane.tabs.filter(t => t.id !== tabId),
        activeTabId: pane.activeTabId === tabId ? null : pane.activeTabId,
      };
    };
    
    // Add to target pane
    const addToPane = (pane: EditorPane): EditorPane => {
      if (pane.id === targetPaneId) {
        return {
          ...pane,
          tabs: [...pane.tabs, tab],
          activeTabId: tabId,
        };
      }
      
      if (pane.children) {
        return {
          ...pane,
          children: pane.children.map(addToPane),
        };
      }
      
      return pane;
    };
    
    let newRootPane = removeFromPane(state.splitView.rootPane);
    newRootPane = addToPane(newRootPane);
    
    set({
      splitView: {
        ...state.splitView,
        rootPane: newRootPane,
      },
    });
    
    state.setActiveTab(tabId);
  },
  
  createTabGroup: (name: string) => {
    const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newGroup: TabGroup = {
      id: groupId,
      name,
      tabs: [],
      activeTabId: null,
    };
    
    set({
      tabGroups: [...get().tabGroups, newGroup],
    });
    
    return groupId;
  },
  
  addTabToGroup: (tabId: string, groupId: string) => {
    const state = get();
    const tab = state.tabs.get(tabId);
    const group = state.tabGroups.find(g => g.id === groupId);
    
    if (!tab || !group) return;
    
    const updatedGroup = {
      ...group,
      tabs: [...group.tabs, tab],
      activeTabId: tabId,
    };
    
    set({
      tabGroups: state.tabGroups.map(g => g.id === groupId ? updatedGroup : g),
    });
  },
  
  getTab: (tabId: string) => {
    return get().tabs.get(tabId);
  },
  
  getActiveTab: () => {
    const state = get();
    if (!state.activeTabId) return null;
    return state.tabs.get(state.activeTabId) || null;
  },
  
  getTabsByPane: (paneId: string) => {
    const pane = get().getPaneById(paneId);
    return pane?.tabs || [];
  },
  
  getPaneById: (paneId: string) => {
    const state = get();
    if (!state.splitView) return null;
    
    const findPane = (pane: EditorPane): EditorPane | null => {
      if (pane.id === paneId) return pane;
      if (pane.children) {
        for (const child of pane.children) {
          const found = findPane(child);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findPane(state.splitView.rootPane);
  },
}));

// Helper functions
function getAllTabsFromPane(pane: EditorPane): EditorTab[] {
  let tabs: EditorTab[] = [];
  
  if (pane.children) {
    for (const child of pane.children) {
      tabs = [...tabs, ...getAllTabsFromPane(child)];
    }
  } else {
    tabs = [...tabs, ...pane.tabs];
  }
  
  return tabs;
}

function countPanes(pane: EditorPane): number {
  if (pane.children) {
    return 1 + pane.children.reduce((sum, child) => sum + countPanes(child), 0);
  }
  return 1;
}

