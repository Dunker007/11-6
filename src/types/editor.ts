/**
 * editor.ts
 * 
 * Type definitions for editor tabs, split views, and editor panes.
 */

export interface EditorTab {
  id: string;
  path: string;
  name: string;
  language?: string;
  isUnsaved: boolean;
  pinned: boolean;
  preview?: string; // First line or preview text
  lastAccessed: number; // Timestamp
}

export type SplitDirection = 'horizontal' | 'vertical';

export interface EditorPane {
  id: string;
  tabs: EditorTab[];
  activeTabId: string | null;
  splitDirection?: SplitDirection;
  children?: EditorPane[];
  size?: number; // Percentage or pixels
}

export interface TabGroup {
  id: string;
  name: string;
  tabs: EditorTab[];
  activeTabId: string | null;
}

export interface SplitViewState {
  rootPane: EditorPane;
  activePaneId: string;
  maxPanes: number; // Maximum allowed panes (default: 4)
}

