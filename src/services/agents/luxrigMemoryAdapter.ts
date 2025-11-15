import type { MemoryStorageAdapter, Conversation, MemorySearchOptions } from './agentMemoryService';

/**
 * LuxRig Memory Adapter
 * Stores agent conversations in LuxRig cloud storage
 */
export class LuxRigMemoryAdapter implements MemoryStorageAdapter {
  private apiEndpoint: string;
  private apiKey: string | null = null;

  constructor(apiEndpoint?: string, apiKey?: string) {
    this.apiEndpoint = apiEndpoint || 'https://api.luxrig.com/v1/memory';
    this.apiKey = apiKey || null;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.apiEndpoint}/conversations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(conversation),
      });

      if (!response.ok) {
        throw new Error(`Failed to save conversation: ${response.statusText}`);
      }
    } catch (error) {
      console.error('LuxRig save error:', error);
      throw error;
    }
  }

  async getConversation(id: string): Promise<Conversation | null> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.apiEndpoint}/conversations/${id}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get conversation: ${response.statusText}`);
      }

      const data = await response.json();
      // Convert date strings back to Date objects
      data.createdAt = new Date(data.createdAt);
      data.updatedAt = new Date(data.updatedAt);
      data.messages.forEach((msg: any) => {
        msg.timestamp = new Date(msg.timestamp);
      });

      return data;
    } catch (error) {
      console.error('LuxRig get error:', error);
      return null;
    }
  }

  async searchConversations(options: MemorySearchOptions): Promise<Conversation[]> {
    try {
      const headers = await this.getHeaders();
      const params = new URLSearchParams();
      
      if (options.agent) params.append('agent', options.agent);
      if (options.projectId) params.append('projectId', options.projectId);
      if (options.query) params.append('query', options.query);
      if (options.startDate) params.append('startDate', options.startDate.toISOString());
      if (options.endDate) params.append('endDate', options.endDate.toISOString());
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await fetch(`${this.apiEndpoint}/conversations/search?${params}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to search conversations: ${response.statusText}`);
      }

      const data = await response.json();
      // Convert date strings back to Date objects
      return data.map((conv: any) => {
        conv.createdAt = new Date(conv.createdAt);
        conv.updatedAt = new Date(conv.updatedAt);
        conv.messages.forEach((msg: any) => {
          msg.timestamp = new Date(msg.timestamp);
        });
        return conv;
      });
    } catch (error) {
      console.error('LuxRig search error:', error);
      return [];
    }
  }

  async deleteConversation(id: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.apiEndpoint}/conversations/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to delete conversation: ${response.statusText}`);
      }
    } catch (error) {
      console.error('LuxRig delete error:', error);
      throw error;
    }
  }

  async sync(): Promise<void> {
    // LuxRig sync is handled by the API
    // This could trigger a background sync if needed
    try {
      const headers = await this.getHeaders();
      await fetch(`${this.apiEndpoint}/sync`, {
        method: 'POST',
        headers,
      });
    } catch (error) {
      console.error('LuxRig sync error:', error);
      // Don't throw - sync failures shouldn't break the app
    }
  }

  /**
   * Set API key for authentication
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Check if LuxRig is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.apiEndpoint}/health`, {
        method: 'GET',
        headers,
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

