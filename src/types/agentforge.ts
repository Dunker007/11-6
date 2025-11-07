export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface AgentConfig {
  name: string;
  description?: string;
  provider: 'lmstudio' | 'ollama' | 'gemini' | 'notebooklm';
  model: string;
  temperature: number;
  maxTokens?: number;
  systemPrompt?: string;
  capabilities: string[]; // IDs of enabled capabilities
}

export interface Agent {
  id: string;
  config: AgentConfig;
  status: 'idle' | 'running' | 'error';
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  usageCount: number;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: Partial<AgentConfig>;
  category: 'coding' | 'writing' | 'analysis' | 'creative' | 'custom';
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface AgentSession {
  id: string;
  agentId: string;
  messages: AgentMessage[];
  createdAt: Date;
  updatedAt: Date;
}

