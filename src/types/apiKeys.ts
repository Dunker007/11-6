export type LLMProvider = 
  | 'gemini'
  | 'notebooklm'
  | 'openai'
  | 'anthropic'
  | 'lmstudio'
  | 'ollama'
  | 'openrouter'
  | 'github';

export type APIProvider = LLMProvider | 'coinbase' | 'schwab' | 'plaid' | 'yodlee';

export interface APIKey {
  id: string;
  provider: APIProvider;
  key: string; // encrypted
  name: string;
  createdAt: Date;
  lastUsed: Date | null;
  isValid: boolean;
  usage: UsageStats;
  metadata?: Record<string, any>; // For additional provider-specific data (e.g., Coinbase secret, passphrase)
}

export interface UsageStats {
  requests: number;
  tokens: number;
  cost: number; // in USD
  lastReset: Date;
}

export interface ProviderConfig {
  provider: LLMProvider;
  name: string;
  type: 'local' | 'cloud';
  requiresKey: boolean;
  endpoint?: string;
  description: string;
}

export const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    provider: 'gemini',
    name: 'Google Gemini',
    type: 'cloud',
    requiresKey: true,
    description: 'Google\'s advanced AI model',
  },
  {
    provider: 'notebooklm',
    name: 'NotebookLM',
    type: 'cloud',
    requiresKey: true,
    description: 'Google\'s document-based AI',
  },
  {
    provider: 'openai',
    name: 'OpenAI',
    type: 'cloud',
    requiresKey: true,
    description: 'GPT-4, GPT-3.5, and more',
  },
  {
    provider: 'anthropic',
    name: 'Anthropic Claude',
    type: 'cloud',
    requiresKey: true,
    description: 'Claude AI models',
  },
  {
    provider: 'lmstudio',
    name: 'LM Studio',
    type: 'local',
    requiresKey: false,
    endpoint: 'http://localhost:1234',
    description: 'Local LLM server',
  },
  {
    provider: 'ollama',
    name: 'Ollama',
    type: 'local',
    requiresKey: false,
    endpoint: 'http://localhost:11434',
    description: 'Local LLM runtime',
  },
  {
    provider: 'openrouter',
    name: 'OpenRouter',
    type: 'cloud',
    requiresKey: true,
    description: 'Unified API for 100+ models (GPT-4, Claude, etc.)',
  },
  {
    provider: 'github',
    name: 'GitHub',
    type: 'cloud',
    requiresKey: true,
    description: 'GitHub API for repository management',
  },
];

