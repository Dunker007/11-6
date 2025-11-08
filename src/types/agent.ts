// src/types/agent.ts

import { LucideIcon } from 'lucide-react';

export type AgentStatus = 'idle' | 'running' | 'success' | 'error' | 'paused';

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  status: AgentStatus;
  lastRun?: Date;
  logs: string[];
}
