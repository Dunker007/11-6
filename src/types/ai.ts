export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ConversationHistory {
  projectId: string;
  messages: ChatMessage[];
  lastUpdated: Date;
}

export interface ContextCache {
  projectId: string;
  context: string;
  relatedFiles: string[];
  fileCount: number;
  linesAnalyzed: number;
  lastAnalyzed: Date;
}

