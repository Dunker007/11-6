export interface Monitor {
  id: string;
  bounds: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
  isPrimary: boolean;
  name: string;
  resolution: { width: number; height: number };
}

export interface MonitorLayout {
  id: string;
  name: string;
  description?: string;
  monitors: Monitor[];
  createdAt: Date;
  updatedAt: Date;
}

