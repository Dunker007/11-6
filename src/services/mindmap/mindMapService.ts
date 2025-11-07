import type { MindMap, MindMapNode } from '@/types/mindmap';

const MINDMAPS_STORAGE_KEY = 'dlx_mindmaps';

export class MindMapService {
  private static instance: MindMapService;
  private mindMaps: Map<string, MindMap> = new Map();

  private constructor() {
    this.loadMindMaps();
  }

  static getInstance(): MindMapService {
    if (!MindMapService.instance) {
      MindMapService.instance = new MindMapService();
    }
    return MindMapService.instance;
  }

  private loadMindMaps(): void {
    try {
      const stored = localStorage.getItem(MINDMAPS_STORAGE_KEY);
      if (stored) {
        const maps: MindMap[] = JSON.parse(stored);
        maps.forEach((map) => {
          map.createdAt = new Date(map.createdAt);
          map.updatedAt = new Date(map.updatedAt);
          map.nodes.forEach((node) => {
            if (node.metadata?.createdAt) {
              node.metadata.createdAt = new Date(node.metadata.createdAt);
            }
            if (node.metadata?.updatedAt) {
              node.metadata.updatedAt = new Date(node.metadata.updatedAt);
            }
          });
          this.mindMaps.set(map.id, map);
        });
      }
    } catch (error) {
      console.error('Failed to load mind maps:', error);
    }
  }

  private saveMindMaps(): void {
    try {
      localStorage.setItem(MINDMAPS_STORAGE_KEY, JSON.stringify(Array.from(this.mindMaps.values())));
    } catch (error) {
      console.error('Failed to save mind maps:', error);
    }
  }

  createMindMap(name: string, description?: string): MindMap {
    const mindMap: MindMap = {
      id: crypto.randomUUID(),
      name,
      description,
      nodes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        gridEnabled: true,
        snapToGrid: true,
        gridSize: 20,
      },
    };

    this.mindMaps.set(mindMap.id, mindMap);
    this.saveMindMaps();
    return mindMap;
  }

  getMindMap(id: string): MindMap | null {
    return this.mindMaps.get(id) || null;
  }

  getAllMindMaps(): MindMap[] {
    return Array.from(this.mindMaps.values());
  }

  updateMindMap(id: string, updates: Partial<MindMap>): MindMap | null {
    const mindMap = this.mindMaps.get(id);
    if (!mindMap) return null;

    const updated: MindMap = {
      ...mindMap,
      ...updates,
      updatedAt: new Date(),
    };
    this.mindMaps.set(id, updated);
    this.saveMindMaps();
    return updated;
  }

  deleteMindMap(id: string): boolean {
    const deleted = this.mindMaps.delete(id);
    if (deleted) this.saveMindMaps();
    return deleted;
  }

  addNode(mindMapId: string, node: Omit<MindMapNode, 'id' | 'connections'> & { connections?: string[] }): MindMapNode | null {
    const mindMap = this.mindMaps.get(mindMapId);
    if (!mindMap) return null;

    const newNode: MindMapNode = {
      ...node,
      id: crypto.randomUUID(),
      connections: node.connections || [],
      metadata: {
        ...node.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    mindMap.nodes.push(newNode);
    mindMap.updatedAt = new Date();
    this.saveMindMaps();
    return newNode;
  }

  updateNode(mindMapId: string, nodeId: string, updates: Partial<MindMapNode>): MindMapNode | null {
    const mindMap = this.mindMaps.get(mindMapId);
    if (!mindMap) return null;

    const node = mindMap.nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    Object.assign(node, updates, {
      metadata: {
        ...node.metadata,
        ...updates.metadata,
        updatedAt: new Date(),
      },
    });

    mindMap.updatedAt = new Date();
    this.saveMindMaps();
    return node;
  }

  deleteNode(mindMapId: string, nodeId: string): boolean {
    const mindMap = this.mindMaps.get(mindMapId);
    if (!mindMap) return false;

    // Remove node and all connections to it
    mindMap.nodes = mindMap.nodes.filter((n) => {
      if (n.id === nodeId) return false;
      n.connections = n.connections.filter((connId) => connId !== nodeId);
      return true;
    });

    mindMap.updatedAt = new Date();
    this.saveMindMaps();
    return true;
  }

  connectNodes(mindMapId: string, fromId: string, toId: string): boolean {
    const mindMap = this.mindMaps.get(mindMapId);
    if (!mindMap) return false;

    const fromNode = mindMap.nodes.find((n) => n.id === fromId);
    if (!fromNode || fromNode.connections.includes(toId)) return false;

    fromNode.connections.push(toId);
    mindMap.updatedAt = new Date();
    this.saveMindMaps();
    return true;
  }

  disconnectNodes(mindMapId: string, fromId: string, toId: string): boolean {
    const mindMap = this.mindMaps.get(mindMapId);
    if (!mindMap) return false;

    const fromNode = mindMap.nodes.find((n) => n.id === fromId);
    if (!fromNode) return false;

    fromNode.connections = fromNode.connections.filter((id) => id !== toId);
    mindMap.updatedAt = new Date();
    this.saveMindMaps();
    return true;
  }
}

export const mindMapService = MindMapService.getInstance();

