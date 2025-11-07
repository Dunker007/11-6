import { create } from 'zustand';
import { mindMapService } from './mindMapService';
import type { MindMap, MindMapNode } from '@/types/mindmap';

interface MindMapStore {
  // State
  mindMaps: MindMap[];
  currentMindMap: MindMap | null;
  selectedNode: MindMapNode | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadMindMaps: () => void;
  createMindMap: (name: string, description?: string) => MindMap;
  selectMindMap: (id: string) => void;
  updateMindMap: (id: string, updates: Partial<MindMap>) => MindMap | null;
  deleteMindMap: (id: string) => boolean;
  addNode: (node: Omit<MindMapNode, 'id' | 'connections'> & { connections?: string[] }) => MindMapNode | null;
  updateNode: (nodeId: string, updates: Partial<MindMapNode>) => MindMapNode | null;
  deleteNode: (nodeId: string) => boolean;
  selectNode: (nodeId: string | null) => void;
  connectNodes: (fromId: string, toId: string) => boolean;
  disconnectNodes: (fromId: string, toId: string) => boolean;
  clearSelection: () => void;
}

export const useMindMapStore = create<MindMapStore>((set, get) => ({
  mindMaps: [],
  currentMindMap: null,
  selectedNode: null,
  isLoading: false,
  error: null,

  loadMindMaps: () => {
    const maps = mindMapService.getAllMindMaps();
    set({ mindMaps: maps });
  },

  createMindMap: (name, description) => {
    const newMap = mindMapService.createMindMap(name, description);
    get().loadMindMaps();
    set({ currentMindMap: newMap });
    return newMap;
  },

  selectMindMap: (id) => {
    const mindMap = mindMapService.getMindMap(id);
    set({ currentMindMap: mindMap, selectedNode: null });
  },

  updateMindMap: (id, updates) => {
    const updated = mindMapService.updateMindMap(id, updates);
    if (updated) {
      get().loadMindMaps();
      if (get().currentMindMap?.id === id) {
        set({ currentMindMap: updated });
      }
    }
    return updated;
  },

  deleteMindMap: (id) => {
    const deleted = mindMapService.deleteMindMap(id);
    if (deleted) {
      get().loadMindMaps();
      if (get().currentMindMap?.id === id) {
        set({ currentMindMap: null, selectedNode: null });
      }
    }
    return deleted;
  },

  addNode: (node) => {
    const currentMap = get().currentMindMap;
    if (!currentMap) return null;

    const newNode = mindMapService.addNode(currentMap.id, node);
    if (newNode) {
      const updatedMap = mindMapService.getMindMap(currentMap.id);
      set({ currentMindMap: updatedMap });
    }
    return newNode;
  },

  updateNode: (nodeId, updates) => {
    const currentMap = get().currentMindMap;
    if (!currentMap) return null;

    const updated = mindMapService.updateNode(currentMap.id, nodeId, updates);
    if (updated) {
      const updatedMap = mindMapService.getMindMap(currentMap.id);
      set({ currentMindMap: updatedMap, selectedNode: updated });
    }
    return updated;
  },

  deleteNode: (nodeId) => {
    const currentMap = get().currentMindMap;
    if (!currentMap) return false;

    const deleted = mindMapService.deleteNode(currentMap.id, nodeId);
    if (deleted) {
      const updatedMap = mindMapService.getMindMap(currentMap.id);
      set({ currentMindMap: updatedMap, selectedNode: null });
    }
    return deleted;
  },

  selectNode: (nodeId) => {
    if (!nodeId) {
      set({ selectedNode: null });
      return;
    }

    const currentMap = get().currentMindMap;
    if (!currentMap) return;

    const node = currentMap.nodes.find((n) => n.id === nodeId);
    set({ selectedNode: node || null });
  },

  connectNodes: (fromId, toId) => {
    const currentMap = get().currentMindMap;
    if (!currentMap) return false;

    const connected = mindMapService.connectNodes(currentMap.id, fromId, toId);
    if (connected) {
      const updatedMap = mindMapService.getMindMap(currentMap.id);
      set({ currentMindMap: updatedMap });
    }
    return connected;
  },

  disconnectNodes: (fromId, toId) => {
    const currentMap = get().currentMindMap;
    if (!currentMap) return false;

    const disconnected = mindMapService.disconnectNodes(currentMap.id, fromId, toId);
    if (disconnected) {
      const updatedMap = mindMapService.getMindMap(currentMap.id);
      set({ currentMindMap: updatedMap });
    }
    return disconnected;
  },

  clearSelection: () => {
    set({ selectedNode: null });
  },
}));

