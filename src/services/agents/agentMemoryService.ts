export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agent?: string;
  projectId?: string;
}

export interface Conversation {
  id: string;
  agent: string;
  projectId?: string;
  messages: AgentMessage[];
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export interface MemorySearchOptions {
  agent?: string;
  projectId?: string;
  query?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface MemoryStorageAdapter {
  saveConversation(conversation: Conversation): Promise<void>;
  getConversation(id: string): Promise<Conversation | null>;
  searchConversations(options: MemorySearchOptions): Promise<Conversation[]>;
  deleteConversation(id: string): Promise<void>;
  sync(): Promise<void>;
}

/**
 * Agent Memory Service
 * Manages agent conversation history with cloud storage support
 */
export class AgentMemoryService {
  private static instance: AgentMemoryService;
  private adapter: MemoryStorageAdapter;
  private conversations: Map<string, Conversation> = new Map();
  private readonly STORAGE_KEY = 'dlx_agent_memory_conversations';
  private syncInProgress = false;

  private constructor(adapter?: MemoryStorageAdapter) {
    // Use provided adapter or default to localStorage
    this.adapter = adapter || new LocalStorageMemoryAdapter();
    this.loadConversations();
  }

  static getInstance(adapter?: MemoryStorageAdapter): AgentMemoryService {
    if (!AgentMemoryService.instance) {
      AgentMemoryService.instance = new AgentMemoryService(adapter);
    }
    return AgentMemoryService.instance;
  }

  private async loadConversations(): Promise<void> {
    try {
      // Load from local storage first
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.forEach((conv: Conversation) => {
          conv.createdAt = new Date(conv.createdAt);
          conv.updatedAt = new Date(conv.updatedAt);
          conv.messages.forEach((msg: AgentMessage) => {
            msg.timestamp = new Date(msg.timestamp);
          });
          this.conversations.set(conv.id, conv);
        });
      }

      // Sync with cloud adapter if available
      if (typeof this.adapter.sync === 'function') {
        await this.sync();
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }

  private async saveConversations(): Promise<void> {
    try {
      const conversationsArray = Array.from(this.conversations.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conversationsArray));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }

  /**
   * Save a conversation
   */
  async saveConversation(conversation: Conversation): Promise<void> {
    conversation.updatedAt = new Date();
    this.conversations.set(conversation.id, conversation);
    await this.saveConversations();
    
    // Also save to adapter
    try {
      await this.adapter.saveConversation(conversation);
    } catch (error) {
      console.error('Failed to save to adapter:', error);
    }
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(conversationId: string, message: AgentMessage): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    conversation.messages.push(message);
    conversation.updatedAt = new Date();
    await this.saveConversation(conversation);
  }

  /**
   * Create a new conversation
   */
  async createConversation(agent: string, projectId?: string, tags?: string[]): Promise<Conversation> {
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      agent,
      projectId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      tags,
    };

    await this.saveConversation(conversation);
    return conversation;
  }

  /**
   * Get a conversation by ID
   */
  async getConversation(id: string): Promise<Conversation | null> {
    // Try local first
    let conversation = this.conversations.get(id);
    
    // If not found, try adapter
    if (!conversation) {
      const adapterConv = await this.adapter.getConversation(id);
      if (adapterConv) {
        conversation = adapterConv;
        this.conversations.set(id, conversation);
      }
    }

    return conversation || null;
  }

  /**
   * Search conversations
   */
  async searchConversations(options: MemorySearchOptions): Promise<Conversation[]> {
    // Search local first
    let results = Array.from(this.conversations.values());

    if (options.agent) {
      results = results.filter(c => c.agent === options.agent);
    }

    if (options.projectId) {
      results = results.filter(c => c.projectId === options.projectId);
    }

    if (options.query) {
      const query = options.query.toLowerCase();
      results = results.filter(c =>
        c.messages.some(m => m.content.toLowerCase().includes(query))
      );
    }

    if (options.startDate) {
      results = results.filter(c => c.createdAt >= options.startDate!);
    }

    if (options.endDate) {
      results = results.filter(c => c.createdAt <= options.endDate!);
    }

    // Also search adapter
    try {
      const adapterResults = await this.adapter.searchConversations(options);
      // Merge and deduplicate
      const adapterMap = new Map(adapterResults.map(c => [c.id, c]));
      adapterMap.forEach((conv, id) => {
        if (!this.conversations.has(id)) {
          this.conversations.set(id, conv);
          results.push(conv);
        }
      });
    } catch (error) {
      console.error('Failed to search adapter:', error);
    }

    // Sort by updatedAt descending
    results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(id: string): Promise<void> {
    this.conversations.delete(id);
    await this.saveConversations();
    
    try {
      await this.adapter.deleteConversation(id);
    } catch (error) {
      console.error('Failed to delete from adapter:', error);
    }
  }

  /**
   * Sync with cloud storage
   */
  async sync(): Promise<void> {
    if (this.syncInProgress) return;
    this.syncInProgress = true;

    try {
      await this.adapter.sync();
      
      // Reload conversations from adapter
      const allConversations = await this.adapter.searchConversations({});
      allConversations.forEach(conv => {
        this.conversations.set(conv.id, conv);
      });
      
      await this.saveConversations();
    } catch (error) {
      console.error('Failed to sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get all conversations for an agent
   */
  async getAgentConversations(agent: string): Promise<Conversation[]> {
    return this.searchConversations({ agent });
  }

  /**
   * Export conversations
   */
  async exportConversations(): Promise<string> {
    const conversations = Array.from(this.conversations.values());
    return JSON.stringify(conversations, null, 2);
  }

  /**
   * Import conversations
   */
  async importConversations(json: string): Promise<void> {
    const conversations: Conversation[] = JSON.parse(json);
    for (const conv of conversations) {
      conv.createdAt = new Date(conv.createdAt);
      conv.updatedAt = new Date(conv.updatedAt);
      conv.messages.forEach(msg => {
        msg.timestamp = new Date(msg.timestamp);
      });
      await this.saveConversation(conv);
    }
  }
}

/**
 * LocalStorage Memory Adapter (fallback)
 */
class LocalStorageMemoryAdapter implements MemoryStorageAdapter {
  async saveConversation(_conversation: Conversation): Promise<void> {
    // Already handled by service
  }

  async getConversation(_id: string): Promise<Conversation | null> {
    return null;
  }

  async searchConversations(_options: MemorySearchOptions): Promise<Conversation[]> {
    return [];
  }

  async deleteConversation(_id: string): Promise<void> {
    // Already handled by service
  }

  async sync(): Promise<void> {
    // No-op for localStorage
  }
}

export const agentMemoryService = AgentMemoryService.getInstance();

