export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  shape?: 'circle' | 'square' | 'diamond' | 'hexagon';
  connections: string[]; // IDs of connected nodes
  metadata?: {
    notes?: string;
    tags?: string[];
    priority?: 'low' | 'medium' | 'high';
    createdAt?: Date;
    updatedAt?: Date;
  };
}

export interface MindMap {
  id: string;
  name: string;
  description?: string;
  nodes: MindMapNode[];
  createdAt: Date;
  updatedAt: Date;
  settings: {
    backgroundColor?: string;
    gridEnabled?: boolean;
    snapToGrid?: boolean;
    gridSize?: number;
  };
}

export interface MindMapConnection {
  from: string;
  to: string;
  label?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  color?: string;
}

export interface MindMapExport {
  format: 'json' | 'png' | 'svg' | 'pdf';
  includeMetadata: boolean;
  includeSettings: boolean;
}

