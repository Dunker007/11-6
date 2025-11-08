// src/types/agent.ts

import { LucideIcon } from 'lucide-react';

export type AgentStatus = 'idle' | 'running' | 'success' | 'error' | 'paused';

export interface AgentCapabilitySummary {
  id: string;
  name: string;
  description?: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  status: AgentStatus;
  lastRun?: Date;
  logs: string[];
  capabilities?: AgentCapabilitySummary[];
}
